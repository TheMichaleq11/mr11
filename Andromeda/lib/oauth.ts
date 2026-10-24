// Minimalny klient OAuth 1.0a (HMAC-SHA1), którego wymaga USOS API.
import { createHmac, randomBytes } from 'node:crypto';

export type Credentials = {
  consumerKey: string;
  consumerSecret: string;
  token?: string;
  tokenSecret?: string;
};

/** Kodowanie procentowe zgodne z RFC 3986 (wymagane przez OAuth). */
export function rfc3986(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}

export function signatureBaseString(
  method: string,
  url: string,
  params: Record<string, string>,
): string {
  const normalized = Object.keys(params)
    .map((k) => [rfc3986(k), rfc3986(params[k])] as const)
    .sort((a, b) => (a[0] === b[0] ? (a[1] < b[1] ? -1 : 1) : a[0] < b[0] ? -1 : 1))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return [method.toUpperCase(), rfc3986(url), rfc3986(normalized)].join('&');
}

export function sign(baseString: string, consumerSecret: string, tokenSecret = ''): string {
  const key = `${rfc3986(consumerSecret)}&${rfc3986(tokenSecret)}`;
  return createHmac('sha1', key).update(baseString).digest('base64');
}

/**
 * Buduje podpisane parametry żądania (oauth_* + parametry metody),
 * gotowe do wysłania jako ciało POST application/x-www-form-urlencoded.
 */
export function signedParams(
  method: string,
  url: string,
  creds: Credentials,
  params: Record<string, string> = {},
  extraOauth: Record<string, string> = {},
  now: { timestamp?: string; nonce?: string } = {},
): Record<string, string> {
  const oauth: Record<string, string> = {
    oauth_consumer_key: creds.consumerKey,
    oauth_nonce: now.nonce ?? randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: now.timestamp ?? Math.floor(Date.now() / 1000).toString(),
    oauth_version: '1.0',
    ...extraOauth,
  };
  if (creds.token) oauth.oauth_token = creds.token;
  const all = { ...params, ...oauth };
  const base = signatureBaseString(method, url, all);
  return { ...all, oauth_signature: sign(base, creds.consumerSecret, creds.tokenSecret) };
}

export function toForm(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([k, v]) => `${rfc3986(k)}=${rfc3986(v)}`)
    .join('&');
}

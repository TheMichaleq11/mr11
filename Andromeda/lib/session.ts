// Sesja trzymana w zaszyfrowanym ciasteczku (AES-256-GCM).
// Na serwerze nic nie zapisujemy — token USOS żyje tylko w ciasteczku użytkownika.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'andro_sess';
export const REQUEST_COOKIE = 'andro_req';

export type Session =
  | { kind: 'usos'; token: string; tokenSecret: string }
  | { kind: 'demo' };

export type PendingRequest = { token: string; tokenSecret: string };

function key(): Buffer {
  const secret =
    process.env.SESSION_SECRET ||
    (process.env.USOS_CONSUMER_SECRET ? 'andromeda:' + process.env.USOS_CONSUMER_SECRET : '') ||
    'andromeda-dev-only-secret';
  return createHash('sha256').update(secret).digest();
}

export function seal(data: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64url');
}

export function unseal<T>(value: string | undefined): T | null {
  if (!value) return null;
  try {
    const raw = Buffer.from(value, 'base64url');
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const enc = raw.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', key(), iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
    return JSON.parse(dec.toString('utf8')) as T;
  } catch {
    return null;
  }
}

export const cookieOptions = (maxAgeSeconds: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: maxAgeSeconds,
});

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return unseal<Session>(store.get(SESSION_COOKIE)?.value);
}

export function usosConfigured(): boolean {
  return Boolean(process.env.USOS_CONSUMER_KEY && process.env.USOS_CONSUMER_SECRET);
}

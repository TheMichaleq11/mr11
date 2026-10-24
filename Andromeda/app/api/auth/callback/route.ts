import { NextResponse, type NextRequest } from 'next/server';
import { consumer, usosPost } from '@/lib/usos';
import {
  cookieOptions,
  REQUEST_COOKIE,
  SESSION_COOKIE,
  seal,
  unseal,
  type PendingRequest,
  type Session,
} from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const token = req.nextUrl.searchParams.get('oauth_token');
  const verifier = req.nextUrl.searchParams.get('oauth_verifier');
  const pending = unseal<PendingRequest>(req.cookies.get(REQUEST_COOKIE)?.value);

  if (!token || !verifier || !pending || pending.token !== token) {
    return NextResponse.redirect(new URL('/zaloguj?blad=sesja', origin));
  }

  try {
    const text = await usosPost(
      'oauth/access_token',
      { ...consumer(), token: pending.token, tokenSecret: pending.tokenSecret },
      {},
      { oauth_verifier: verifier },
    );
    const p = new URLSearchParams(text);
    const accessToken = p.get('oauth_token');
    const accessSecret = p.get('oauth_token_secret');
    if (!accessToken || !accessSecret) throw new Error('Brak tokenu dostępu: ' + text.slice(0, 200));

    const session: Session = { kind: 'usos', token: accessToken, tokenSecret: accessSecret };
    const res = NextResponse.redirect(new URL('/', origin));
    res.cookies.set(SESSION_COOKIE, seal(session), cookieOptions(60 * 60 * 24 * 180));
    res.cookies.delete(REQUEST_COOKIE);
    return res;
  } catch (e) {
    console.error('[andromeda callback]', e);
    return NextResponse.redirect(new URL('/zaloguj?blad=usos', origin));
  }
}

import { NextResponse, type NextRequest } from 'next/server';
import { consumer, SCOPES, USOS_BASE, usosPost } from '@/lib/usos';
import { cookieOptions, REQUEST_COOKIE, seal, usosConfigured } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  if (!usosConfigured()) {
    return NextResponse.redirect(new URL('/zaloguj?blad=brak-klucza', origin));
  }
  try {
    const text = await usosPost('oauth/request_token', consumer(), { scopes: SCOPES }, {
      oauth_callback: `${origin}/api/auth/callback`,
    });
    const p = new URLSearchParams(text);
    const token = p.get('oauth_token');
    const tokenSecret = p.get('oauth_token_secret');
    if (!token || !tokenSecret) throw new Error('Brak oauth_token w odpowiedzi: ' + text.slice(0, 200));

    const res = NextResponse.redirect(`${USOS_BASE}/services/oauth/authorize?oauth_token=${encodeURIComponent(token)}`);
    res.cookies.set(REQUEST_COOKIE, seal({ token, tokenSecret }), cookieOptions(15 * 60));
    return res;
  } catch (e) {
    console.error('[andromeda login]', e);
    return NextResponse.redirect(new URL('/zaloguj?blad=usos', origin));
  }
}

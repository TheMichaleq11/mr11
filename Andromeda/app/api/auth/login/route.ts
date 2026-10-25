import { NextResponse, type NextRequest } from 'next/server';
import { BASE_SCOPES, consumer, SCOPES, USOS_BASE, usosPost } from '@/lib/usos';
import { cookieOptions, REQUEST_COOKIE, seal, usosConfigured } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  if (!usosConfigured()) {
    return NextResponse.redirect(new URL('/zaloguj?blad=brak-klucza', origin));
  }
  try {
    const ask = (scopes: string) =>
      usosPost('oauth/request_token', consumer(), { scopes }, { oauth_callback: `${origin}/api/auth/callback` });
    // Nowe uprawnienia mogą nie być dostępne dla tej aplikacji — wtedy logujemy się z podstawowymi.
    const text = await ask(SCOPES).catch((e) => {
      console.warn('[andromeda login] pełne uprawnienia odrzucone, próbuję podstawowych', e);
      return ask(BASE_SCOPES);
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

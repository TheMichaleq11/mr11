// Szybka bramka logowania na brzegu sieci: bez ciasteczka sesji → ekran logowania.
// Pełna weryfikacja sesji odbywa się w /api/* (nieprawidłowe ciasteczko = 401 = powrót do logowania).
// Dzięki temu same strony są statyczne i otwierają się natychmiast.
import { NextResponse, type NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  if (!req.cookies.get('andro_sess')?.value) {
    const url = req.nextUrl.clone();
    url.pathname = '/zaloguj';
    url.search = '';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // wszystko poza API, logowaniem i plikami statycznymi
  matcher: ['/((?!api|zaloguj|_next|icons|sw\\.js|manifest\\.webmanifest|icon\\.png|favicon\\.ico).*)'],
};

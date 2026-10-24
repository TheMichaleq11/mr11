import { NextResponse, type NextRequest } from 'next/server';
import { cookieOptions, SESSION_COOKIE, seal, type Session } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session: Session = { kind: 'demo' };
  const res = NextResponse.redirect(new URL('/', req.nextUrl.origin));
  res.cookies.set(SESSION_COOKIE, seal(session), cookieOptions(60 * 60 * 24 * 30));
  return res;
}

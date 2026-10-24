import { NextResponse, type NextRequest } from 'next/server';
import { REQUEST_COOKIE, SESSION_COOKIE } from '@/lib/session';

export const dynamic = 'force-dynamic';

function logout(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/zaloguj', req.nextUrl.origin), 303);
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(REQUEST_COOKIE);
  return res;
}

export const GET = logout;
export const POST = logout;

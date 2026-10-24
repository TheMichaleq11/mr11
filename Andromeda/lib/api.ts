// Wspólna obsługa sesji i błędów w endpointach /api/*.
import { NextResponse } from 'next/server';
import { getSession, SESSION_COOKIE, type Session } from './session';
import { consumer, UsosAuthError, UsosError } from './usos';
import type { Credentials } from './oauth';

export type Ctx = { session: Session; creds: Credentials | null };

export async function withSession(handler: (ctx: Ctx) => Promise<unknown>): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_logged_in' }, { status: 401 });

  const creds =
    session.kind === 'usos' ? { ...consumer(), token: session.token, tokenSecret: session.tokenSecret } : null;

  try {
    const data = await handler({ session, creds });
    return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (e) {
    if (e instanceof UsosAuthError) {
      const res = NextResponse.json({ error: 'usos_auth' }, { status: 401 });
      res.cookies.delete(SESSION_COOKIE);
      return res;
    }
    const status = e instanceof UsosError ? 502 : 500;
    console.error('[andromeda api]', e);
    return NextResponse.json({ error: 'usos_error', detail: e instanceof Error ? e.message : String(e) }, { status });
  }
}

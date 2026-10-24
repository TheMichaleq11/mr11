// Wspólna obsługa sesji i błędów w endpointach /api/*.
import { NextResponse } from 'next/server';
import { getSession, SESSION_COOKIE, type Session } from './session';
import { consumer, UsosAuthError, UsosError, UsosScopeError } from './usos';
import type { Credentials } from './oauth';

export type Ctx = { session: Session; creds: Credentials | null };

export async function withSession(handler: (ctx: Ctx) => Promise<unknown>): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_logged_in' }, { status: 401 });

  const creds =
    session.kind === 'usos' ? { ...consumer(), token: session.token, tokenSecret: session.tokenSecret } : null;

  try {
    const data = await handler({ session, creds });
    return NextResponse.json(data ?? { ok: true }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (e) {
    if (e instanceof UsosAuthError) {
      const res = NextResponse.json({ error: 'usos_auth' }, { status: 401 });
      res.cookies.delete(SESSION_COOKIE);
      return res;
    }
    if (e instanceof UsosScopeError) {
      // Token sprzed rozbudowy aplikacji — brakuje mu nowego uprawnienia.
      return NextResponse.json({ error: 'scope', detail: 'Ta sekcja wymaga dodatkowej zgody w USOS.' }, { status: 403 });
    }
    if (e instanceof BadRequest) {
      return NextResponse.json({ error: 'bad_request', detail: e.message }, { status: 400 });
    }
    console.error('[andromeda api]', e);
    const status = e instanceof UsosError ? 502 : 500;
    const detail = e instanceof UsosError ? e.userMessage || e.message.slice(0, 300) : e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'usos_error', detail }, { status });
  }
}

export class BadRequest extends Error {}

/** Akcje zmieniające dane (zapisy, ankiety) przyjmujemy tylko z naszej własnej strony. */
export function assertSameOrigin(req: Request): void {
  const origin = req.headers.get('origin');
  const host = req.headers.get('host');
  if (!origin || !host || new URL(origin).host !== host) throw new BadRequest('Nieprawidłowe źródło żądania.');
}

export async function jsonBody<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new BadRequest('Nieprawidłowe dane.');
  }
}

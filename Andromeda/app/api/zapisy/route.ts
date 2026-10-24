import { assertSameOrigin, BadRequest, jsonBody, withSession } from '@/lib/api';
import { demoRegistrations } from '@/lib/demo-more';
import { fetchRegistrations, registerAction } from '@/lib/usos-more';

export const dynamic = 'force-dynamic';

export function GET() {
  return withSession(async ({ creds }) => (creds ? fetchRegistrations(creds) : demoRegistrations()));
}

type Body = { action?: string; roundId?: string; courseId?: string; termId?: string };

export function POST(req: Request) {
  return withSession(async ({ creds }) => {
    assertSameOrigin(req);
    const b = await jsonBody<Body>(req);
    if ((b.action !== 'register' && b.action !== 'unregister') || !b.roundId || !b.courseId || !b.termId) {
      throw new BadRequest('Brakuje danych zapisu.');
    }
    if (!creds) throw new BadRequest('W trybie demo zapisy są tylko na pokaz — zaloguj się do USOS.');
    await registerAction(creds, b.action, b.roundId, b.courseId, b.termId);
    return { ok: true };
  });
}

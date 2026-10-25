import { assertSameOrigin, BadRequest, jsonBody, withSession } from '@/lib/api';
import { demoMeetingDetail } from '@/lib/demo-extra';
import { fetchMeetingDetail, meetingAction } from '@/lib/usos-extra';

export const dynamic = 'force-dynamic';

type P = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: P) {
  const { id } = await params;
  return withSession(async ({ creds }) => (creds ? fetchMeetingDetail(creds, id) : demoMeetingDetail(id)));
}

type Body = { action?: string; dateId?: string; substantiationId?: string; message?: string };

export async function POST(req: Request) {
  return withSession(async ({ creds }) => {
    assertSameOrigin(req);
    const b = await jsonBody<Body>(req);
    if ((b.action !== 'sign_up' && b.action !== 'sign_off') || !b.dateId || !/^[\w-]+$/.test(b.dateId)) throw new BadRequest('Brakuje danych terminu.');
    if (b.action === 'sign_up' && !b.substantiationId) throw new BadRequest('Wybierz powód spotkania.');
    if (!creds) throw new BadRequest('W trybie demo zapisy są tylko na pokaz — zaloguj się do USOS.');
    await meetingAction(creds, b.action, b.dateId, b.substantiationId, b.message?.trim().slice(0, 500) || undefined);
    return { ok: true };
  });
}

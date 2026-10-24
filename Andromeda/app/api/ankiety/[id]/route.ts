import { assertSameOrigin, BadRequest, jsonBody, withSession } from '@/lib/api';
import { demoSurvey } from '@/lib/demo-more';
import { fetchSurvey, fillSurvey } from '@/lib/usos-more';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  return withSession(async ({ creds }) => (creds ? fetchSurvey(creds, id) : demoSurvey(id)));
}

type Body = { answers?: Record<string, { answer: string | null; comment: string | null }>; comment?: string | null };

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  return withSession(async ({ creds }) => {
    assertSameOrigin(req);
    const b = await jsonBody<Body>(req);
    if (!b.answers || typeof b.answers !== 'object') throw new BadRequest('Brak odpowiedzi.');
    if (!creds) throw new BadRequest('W trybie demo ankiety nie są wysyłane — zaloguj się do USOS.');
    await fillSurvey(creds, id, b.answers, b.comment ?? null);
    return { ok: true };
  });
}

import { assertSameOrigin, BadRequest, jsonBody, withSession } from '@/lib/api';
import { sendMail } from '@/lib/usos-studies';

export const dynamic = 'force-dynamic';

type Body = { userIds?: string[]; subject?: string; content?: string; copyToMe?: boolean };

export function POST(req: Request) {
  return withSession(async ({ creds }) => {
    assertSameOrigin(req);
    const b = await jsonBody<Body>(req);
    const ids = (b.userIds ?? []).filter((x) => typeof x === 'string' && /^[\w-]+$/.test(x));
    if (!ids.length) throw new BadRequest('Brak odbiorców.');
    if (!b.subject?.trim()) throw new BadRequest('Wpisz temat.');
    if (!b.content?.trim()) throw new BadRequest('Wpisz treść wiadomości.');
    if (!creds) throw new BadRequest('W trybie demo wiadomości nie są wysyłane — zaloguj się do USOS.');
    await sendMail(creds, ids, b.subject.trim(), b.content.trim(), Boolean(b.copyToMe));
    return { ok: true };
  });
}

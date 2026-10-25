import { NextResponse } from 'next/server';
import { assertSameOrigin, BadRequest, withSession } from '@/lib/api';
import { consumer, UsosAuthError } from '@/lib/usos';
import { getSession } from '@/lib/session';
import { downloadDocument, receiveDocument } from '@/lib/usos-studies';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** Pobranie pliku dokumentu (PDF) — strumień z USOS, bez zapisywania na serwerze. */
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_logged_in' }, { status: 401 });
  if (session.kind !== 'usos') return NextResponse.json({ error: 'bad_request', detail: 'W trybie demo nie ma plików.' }, { status: 400 });
  try {
    const file = await downloadDocument({ ...consumer(), token: session.token, tokenSecret: session.tokenSecret }, id);
    const safe = file.name.replace(/[^\p{L}\p{N} ._-]/gu, '').slice(0, 80) || 'dokument';
    const ext = file.type.includes('pdf') ? '.pdf' : '';
    return new NextResponse(file.body, {
      headers: {
        'Content-Type': file.type,
        'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(safe + ext)}`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (e) {
    if (e instanceof UsosAuthError) return NextResponse.json({ error: 'usos_auth' }, { status: 401 });
    return NextResponse.json({ error: 'usos_error', detail: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}

/** Potwierdzenie odbioru dokumentu (gdy USOS tego wymaga, zanim da się go pobrać). */
export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  return withSession(async ({ creds }) => {
    assertSameOrigin(req);
    if (!creds) throw new BadRequest('W trybie demo nie ma dokumentów do odebrania.');
    await receiveDocument(creds, id);
    return { ok: true };
  });
}

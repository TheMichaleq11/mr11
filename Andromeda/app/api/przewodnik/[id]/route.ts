import { BadRequest, withSession } from '@/lib/api';
import { demoGuidePage } from '@/lib/demo-extra';
import { fetchGuidePage } from '@/lib/usos-extra';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withSession(async ({ creds }) => {
    if (!/^[\w-]+$/.test(id)) throw new BadRequest('Nieprawidłowa strona.');
    return creds ? fetchGuidePage(creds, id) : demoGuidePage(id);
  });
}

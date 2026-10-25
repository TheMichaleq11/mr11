import { BadRequest, withSession } from '@/lib/api';
import { demoGroup } from '@/lib/demo-studies';
import { fetchGroup } from '@/lib/usos-studies';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  return withSession(async ({ creds }) => {
    const m = /^(.+)-(\d+)$/.exec(key);
    if (!m) throw new BadRequest('Nieprawidłowa grupa.');
    return creds ? fetchGroup(creds, m[1], m[2]) : demoGroup(key);
  });
}

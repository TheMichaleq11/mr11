import { withSession } from '@/lib/api';
import { demoPerson } from '@/lib/demo-courses';
import { fetchPerson } from '@/lib/usos-courses';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withSession(async ({ creds }) => (creds ? fetchPerson(creds, id) : demoPerson(id)));
}

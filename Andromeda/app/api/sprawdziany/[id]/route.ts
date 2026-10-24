import { withSession } from '@/lib/api';
import { demoTestTree } from '@/lib/demo-more';
import { fetchTestTree } from '@/lib/usos-more';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withSession(async ({ creds }) => (creds ? fetchTestTree(creds, id) : demoTestTree(id)));
}

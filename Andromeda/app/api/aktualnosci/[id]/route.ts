import { withSession } from '@/lib/api';
import { demoNews } from '@/lib/demo-more';
import { fetchArticle } from '@/lib/usos-more';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withSession(async ({ creds }) => (creds ? fetchArticle(creds, id) : demoNews().find((a) => a.id === id) ?? demoNews()[0]));
}

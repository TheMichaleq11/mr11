import { withSession } from '@/lib/api';
import { demoBuildings } from '@/lib/demo-more';
import { fetchBuildings } from '@/lib/usos-more';

export const dynamic = 'force-dynamic';

export function GET() {
  return withSession(async ({ creds }) => ({ buildings: creds ? await fetchBuildings(creds) : demoBuildings() }));
}

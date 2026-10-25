import { withSession } from '@/lib/api';
import { demoPlacement } from '@/lib/demo-extra';
import { fetchPlacementTests, soft } from '@/lib/usos-extra';

export const dynamic = 'force-dynamic';

export function GET() {
  return withSession(async ({ creds }) => (creds ? soft(() => fetchPlacementTests(creds)) : { data: demoPlacement() }));
}

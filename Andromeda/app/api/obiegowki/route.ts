import { withSession } from '@/lib/api';
import { demoSlips } from '@/lib/demo-extra';
import { fetchSlips, soft } from '@/lib/usos-extra';

export const dynamic = 'force-dynamic';

export function GET() {
  return withSession(async ({ creds }) => (creds ? soft(() => fetchSlips(creds)) : { data: demoSlips() }));
}

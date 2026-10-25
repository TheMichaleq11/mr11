import { withSession } from '@/lib/api';
import { demoGuide } from '@/lib/demo-extra';
import { fetchGuide, soft } from '@/lib/usos-extra';

export const dynamic = 'force-dynamic';

export function GET() {
  return withSession(async ({ creds }) => (creds ? soft(() => fetchGuide(creds)) : { data: demoGuide() }));
}

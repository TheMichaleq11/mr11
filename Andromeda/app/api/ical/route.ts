import { withSession } from '@/lib/api';
import { fetchIcalUrl } from '@/lib/usos-studies';

export const dynamic = 'force-dynamic';

export function GET() {
  return withSession(async ({ creds }) => (creds ? fetchIcalUrl(creds) : { webcalUrl: null }));
}

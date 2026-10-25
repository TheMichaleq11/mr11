import { withSession } from '@/lib/api';
import { demoMeetings } from '@/lib/demo-extra';
import { fetchMeetings, soft } from '@/lib/usos-extra';

export const dynamic = 'force-dynamic';

export function GET() {
  return withSession(async ({ creds }) => (creds ? soft(() => fetchMeetings(creds)) : { data: demoMeetings() }));
}

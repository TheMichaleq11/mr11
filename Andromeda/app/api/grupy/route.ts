import { withSession } from '@/lib/api';
import { demoGroups } from '@/lib/demo-studies';
import { fetchGroups } from '@/lib/usos-studies';

export const dynamic = 'force-dynamic';

export function GET() {
  return withSession(async ({ creds }) => ({ groups: creds ? await fetchGroups(creds) : demoGroups() }));
}

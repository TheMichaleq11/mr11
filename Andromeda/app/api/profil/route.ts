import { withSession } from '@/lib/api';
import { demoProfile } from '@/lib/demo-more';
import { fetchProfile } from '@/lib/usos-more';

export const dynamic = 'force-dynamic';

export function GET() {
  return withSession(async ({ creds }) => (creds ? fetchProfile(creds) : demoProfile()));
}

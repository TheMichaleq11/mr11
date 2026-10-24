import { withSession } from '@/lib/api';
import { demoMe } from '@/lib/demo';
import { fetchMe } from '@/lib/usos';

export const dynamic = 'force-dynamic';

export function GET() {
  return withSession(async ({ creds }) => (creds ? fetchMe(creds) : demoMe));
}

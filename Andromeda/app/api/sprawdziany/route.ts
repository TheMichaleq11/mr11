import { withSession } from '@/lib/api';
import { demoTests } from '@/lib/demo-more';
import { fetchTests } from '@/lib/usos-more';

export const dynamic = 'force-dynamic';

export function GET() {
  return withSession(async ({ creds }) => ({ tests: creds ? await fetchTests(creds) : demoTests() }));
}

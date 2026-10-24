import { withSession } from '@/lib/api';
import { demoPayments } from '@/lib/demo-more';
import { fetchPayments } from '@/lib/usos-more';

export const dynamic = 'force-dynamic';

export function GET() {
  return withSession(async ({ creds }) => ({ payments: creds ? await fetchPayments(creds) : demoPayments() }));
}

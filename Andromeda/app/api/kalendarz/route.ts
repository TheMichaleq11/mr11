import { withSession } from '@/lib/api';
import { demoCalendar } from '@/lib/demo-more';
import { fetchCalendar } from '@/lib/usos-more';

export const dynamic = 'force-dynamic';

export function GET() {
  return withSession(async ({ creds }) => (creds ? fetchCalendar(creds) : demoCalendar()));
}

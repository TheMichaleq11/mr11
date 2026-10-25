import { withSession } from '@/lib/api';
import { demoStudies } from '@/lib/demo-studies';
import { fetchStudies } from '@/lib/usos-studies';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export function GET() {
  return withSession(async ({ creds }) => (creds ? fetchStudies(creds) : demoStudies()));
}

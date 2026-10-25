import { withSession } from '@/lib/api';
import { demoExams } from '@/lib/demo-studies';
import { fetchExams } from '@/lib/usos-studies';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export function GET() {
  return withSession(async ({ creds }) => (creds ? fetchExams(creds) : demoExams()));
}

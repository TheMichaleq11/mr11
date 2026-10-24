import { withSession } from '@/lib/api';
import { demoSurveys } from '@/lib/demo-more';
import { fetchSurveys } from '@/lib/usos-more';

export const dynamic = 'force-dynamic';

export function GET() {
  return withSession(async ({ creds }) => ({ surveys: creds ? await fetchSurveys(creds) : demoSurveys() }));
}

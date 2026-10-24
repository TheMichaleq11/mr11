import type { NextRequest } from 'next/server';
import { withSession } from '@/lib/api';
import { demoGrades } from '@/lib/demo';
import { fetchGrades } from '@/lib/usos';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  const term = req.nextUrl.searchParams.get('term');
  return withSession(async ({ creds }) => (creds ? fetchGrades(creds, term) : demoGrades()));
}

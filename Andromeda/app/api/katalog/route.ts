import type { NextRequest } from 'next/server';
import { withSession } from '@/lib/api';
import { demoCourseSearch } from '@/lib/demo-courses';
import { searchCourses } from '@/lib/usos-courses';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').trim().slice(0, 100);
  return withSession(async ({ creds }) => {
    if (q.length < 2) return { items: [] };
    return { items: creds ? await searchCourses(creds, q) : demoCourseSearch(q) };
  });
}

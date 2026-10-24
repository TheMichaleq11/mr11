import type { NextRequest } from 'next/server';
import { withSession } from '@/lib/api';
import { demoSyllabus } from '@/lib/demo-courses';
import { fetchSyllabus } from '@/lib/usos-courses';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const term = req.nextUrl.searchParams.get('term');
  return withSession(async ({ creds }) => (creds ? fetchSyllabus(creds, id, term) : demoSyllabus(id)));
}

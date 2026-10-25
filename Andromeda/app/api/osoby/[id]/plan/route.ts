import type { NextRequest } from 'next/server';
import { withSession } from '@/lib/api';
import { demoPlan } from '@/lib/demo';
import { localDate } from '@/lib/usos';
import { fetchStaffPlan } from '@/lib/usos-studies';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = req.nextUrl.searchParams.get('start');
  const start = s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : localDate();
  return withSession(async ({ creds }) =>
    creds ? fetchStaffPlan(creds, id, start) : { events: demoPlan(start, 7).filter((e) => e.courseId === 'DEMO-MIKRO') },
  );
}

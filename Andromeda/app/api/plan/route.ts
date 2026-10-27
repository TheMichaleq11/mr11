import type { NextRequest } from 'next/server';
import { withSession } from '@/lib/api';
import { demoPlan } from '@/lib/demo';
import { fetchPlan, localDate } from '@/lib/usos';
import { applyPlanOverrides } from '@/lib/plan-overrides';
import type { PlanResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  const qs = req.nextUrl.searchParams;
  const startParam = qs.get('start');
  const start = startParam && /^\d{4}-\d{2}-\d{2}$/.test(startParam) ? startParam : localDate();
  const days = Math.min(Math.max(Number(qs.get('days')) || 7, 1), 7);

  return withSession(async ({ creds }): Promise<PlanResponse> => ({
    start,
    days,
    events: creds ? await applyPlanOverrides(creds, await fetchPlan(creds, start, days), start, days) : demoPlan(start, days),
  }));
}

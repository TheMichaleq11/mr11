import type { NextRequest } from 'next/server';
import { withSession } from '@/lib/api';
import { demoNews } from '@/lib/demo-more';
import { fetchNews } from '@/lib/usos-more';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  const start = Math.max(0, Number(req.nextUrl.searchParams.get('start')) || 0);
  return withSession(async ({ creds }) =>
    creds ? fetchNews(creds, start) : { articles: demoNews(), total: demoNews().length, nextPage: false },
  );
}

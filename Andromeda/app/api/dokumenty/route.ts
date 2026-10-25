import { withSession } from '@/lib/api';
import { demoDocuments } from '@/lib/demo-studies';
import { fetchDocuments } from '@/lib/usos-studies';

export const dynamic = 'force-dynamic';

export function GET() {
  return withSession(async ({ creds }) => (creds ? fetchDocuments(creds) : demoDocuments()));
}

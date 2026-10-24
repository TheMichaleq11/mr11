import { redirect } from 'next/navigation';
import Shell from '@/components/Shell';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/zaloguj');
  return <Shell>{children}</Shell>;
}

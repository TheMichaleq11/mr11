import type { Metadata } from 'next';
import { GuideView } from '@/components/views/NewViews';

export const metadata: Metadata = { title: 'Andromeda' };

export default function Page() {
  return <GuideView />;
}

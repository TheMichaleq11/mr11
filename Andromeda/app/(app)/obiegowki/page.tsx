import type { Metadata } from 'next';
import { SlipsView } from '@/components/views/NewViews';

export const metadata: Metadata = { title: 'Andromeda' };

export default function Page() {
  return <SlipsView />;
}

import type { Metadata } from 'next';
import MoreView from '@/components/views/MoreView';

export const metadata: Metadata = { title: 'Andromeda' };

export default function Page() {
  return <MoreView />;
}

import type { Metadata } from 'next';
import MoreView from '@/components/views/MoreView';

export const metadata: Metadata = { title: 'Więcej · Andromeda' };

export default function Page() {
  return <MoreView />;
}

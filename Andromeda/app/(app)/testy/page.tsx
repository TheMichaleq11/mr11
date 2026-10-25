import type { Metadata } from 'next';
import { PlacementView } from '@/components/views/NewViews';

export const metadata: Metadata = { title: 'Andromeda' };

export default function Page() {
  return <PlacementView />;
}

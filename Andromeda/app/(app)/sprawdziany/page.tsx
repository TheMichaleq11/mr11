import type { Metadata } from 'next';
import { TestsList } from '@/components/views/TestsView';

export const metadata: Metadata = { title: 'Sprawdziany · Andromeda' };

export default function Page() {
  return <TestsList />;
}

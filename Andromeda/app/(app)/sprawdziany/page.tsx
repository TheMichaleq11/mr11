import type { Metadata } from 'next';
import { TestsList } from '@/components/views/TestsView';

export const metadata: Metadata = { title: 'Andromeda' };

export default function Page() {
  return <TestsList />;
}

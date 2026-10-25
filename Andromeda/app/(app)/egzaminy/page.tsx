import type { Metadata } from 'next';
import ExamsView from '@/components/views/ExamsView';

export const metadata: Metadata = { title: 'Andromeda' };

export default function Page() {
  return <ExamsView />;
}

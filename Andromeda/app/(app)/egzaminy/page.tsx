import type { Metadata } from 'next';
import ExamsView from '@/components/views/ExamsView';

export const metadata: Metadata = { title: 'Egzaminy · Andromeda' };

export default function Page() {
  return <ExamsView />;
}

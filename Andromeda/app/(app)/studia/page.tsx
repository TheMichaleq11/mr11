import type { Metadata } from 'next';
import StudiesView from '@/components/views/StudiesView';

export const metadata: Metadata = { title: 'Andromeda' };

export default function Page() {
  return <StudiesView />;
}

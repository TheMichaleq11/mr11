import type { Metadata } from 'next';
import GradesView from '@/components/views/GradesView';

export const metadata: Metadata = { title: 'Oceny · Andromeda' };

export default function Page() {
  return <GradesView />;
}

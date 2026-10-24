import type { Metadata } from 'next';
import CoursesView from '@/components/views/CoursesView';

export const metadata: Metadata = { title: 'Przedmioty · Andromeda' };

export default function Page() {
  return <CoursesView />;
}

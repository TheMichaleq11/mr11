import type { Metadata } from 'next';
import CoursesView from '@/components/views/CoursesView';

export const metadata: Metadata = { title: 'Andromeda' };

export default function Page() {
  return <CoursesView />;
}

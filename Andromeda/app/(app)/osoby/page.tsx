import type { Metadata } from 'next';
import { PeopleList } from '@/components/views/PeopleView';

export const metadata: Metadata = { title: 'Andromeda' };

export default function Page() {
  return <PeopleList />;
}

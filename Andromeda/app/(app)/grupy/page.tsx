import type { Metadata } from 'next';
import { GroupsList } from '@/components/views/GroupsView';

export const metadata: Metadata = { title: 'Grupy zajęciowe · Andromeda' };

export default function Page() {
  return <GroupsList />;
}

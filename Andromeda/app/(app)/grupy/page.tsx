import type { Metadata } from 'next';
import { GroupsList } from '@/components/views/GroupsView';

export const metadata: Metadata = { title: 'Andromeda' };

export default function Page() {
  return <GroupsList />;
}

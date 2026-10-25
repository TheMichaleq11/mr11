'use client';
import { useParams } from 'next/navigation';
import { GroupView } from '@/components/views/GroupsView';

export default function View() {
  const { key } = useParams<{ key: string }>();
  return <GroupView id={decodeURIComponent(key)} />;
}

import { GroupView } from '@/components/views/GroupsView';

export default async function Page({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  return <GroupView id={decodeURIComponent(key)} />;
}

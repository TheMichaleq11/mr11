import { BuildingDetail } from '@/components/views/BuildingsView';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BuildingDetail id={decodeURIComponent(id)} />;
}

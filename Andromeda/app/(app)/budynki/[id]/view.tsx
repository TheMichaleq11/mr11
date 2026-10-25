'use client';
import { useParams } from 'next/navigation';
import { BuildingDetail } from '@/components/views/BuildingsView';

export default function View() {
  const { id } = useParams<{ id: string }>();
  return <BuildingDetail id={decodeURIComponent(id)} />;
}

import type { Metadata } from 'next';
import { BuildingsList } from '@/components/views/BuildingsView';

export const metadata: Metadata = { title: 'Budynki · Andromeda' };

export default function Page() {
  return <BuildingsList />;
}

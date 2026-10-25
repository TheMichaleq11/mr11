import type { Metadata } from 'next';
import RegistrationsView from '@/components/views/RegistrationsView';

export const metadata: Metadata = { title: 'Andromeda' };

export default function Page() {
  return <RegistrationsView />;
}

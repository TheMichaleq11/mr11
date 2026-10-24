import type { Metadata } from 'next';
import RegistrationsView from '@/components/views/RegistrationsView';

export const metadata: Metadata = { title: 'Zapisy · Andromeda' };

export default function Page() {
  return <RegistrationsView />;
}

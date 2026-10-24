import type { Metadata } from 'next';
import { PaymentsView } from '@/components/views/ProfileView';

export const metadata: Metadata = { title: 'Płatności · Andromeda' };

export default function Page() {
  return <PaymentsView />;
}

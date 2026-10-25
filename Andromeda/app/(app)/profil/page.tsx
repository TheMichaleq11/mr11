import type { Metadata } from 'next';
import { ProfileView } from '@/components/views/ProfileView';

export const metadata: Metadata = { title: 'Andromeda' };

export default function Page() {
  return <ProfileView />;
}

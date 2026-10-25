import type { Metadata } from 'next';
import { MeetingsView } from '@/components/views/NewViews';

export const metadata: Metadata = { title: 'Andromeda' };

export default function Page() {
  return <MeetingsView />;
}

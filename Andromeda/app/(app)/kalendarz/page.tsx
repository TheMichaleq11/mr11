import type { Metadata } from 'next';
import CalendarView from '@/components/views/CalendarView';

export const metadata: Metadata = { title: 'Andromeda' };

export default function Page() {
  return <CalendarView />;
}

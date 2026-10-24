import type { Metadata } from 'next';
import CalendarView from '@/components/views/CalendarView';

export const metadata: Metadata = { title: 'Kalendarz akademicki · Andromeda' };

export default function Page() {
  return <CalendarView />;
}

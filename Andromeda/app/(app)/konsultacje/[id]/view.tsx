'use client';
import { useParams } from 'next/navigation';
import { MeetingView } from '@/components/views/NewViews';

export default function View() {
  const { id } = useParams<{ id: string }>();
  return <MeetingView id={decodeURIComponent(id)} />;
}

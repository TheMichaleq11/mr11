'use client';
import { useParams } from 'next/navigation';
import RoomView from '@/components/views/RoomView';

export default function View() {
  const { id } = useParams<{ id: string }>();
  return <RoomView id={decodeURIComponent(id)} />;
}

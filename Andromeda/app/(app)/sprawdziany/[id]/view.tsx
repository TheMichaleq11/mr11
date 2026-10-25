'use client';
import { useParams } from 'next/navigation';
import { TestDetail } from '@/components/views/TestsView';

export default function View() {
  const { id } = useParams<{ id: string }>();
  return <TestDetail id={decodeURIComponent(id)} />;
}

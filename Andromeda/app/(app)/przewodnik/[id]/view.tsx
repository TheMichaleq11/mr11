'use client';
import { useParams } from 'next/navigation';
import { GuidePageView } from '@/components/views/NewViews';

export default function View() {
  const { id } = useParams<{ id: string }>();
  return <GuidePageView id={decodeURIComponent(id)} />;
}

'use client';
import { useParams } from 'next/navigation';
import { ArticleView } from '@/components/views/NewsView';

export default function View() {
  const { id } = useParams<{ id: string }>();
  return <ArticleView id={decodeURIComponent(id)} />;
}

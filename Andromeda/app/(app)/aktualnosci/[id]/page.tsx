import { ArticleView } from '@/components/views/NewsView';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ArticleView id={decodeURIComponent(id)} />;
}

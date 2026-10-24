import CourseView from '@/components/views/CourseView';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ term?: string }>;
}) {
  const { id } = await params;
  const { term } = await searchParams;
  return <CourseView courseId={decodeURIComponent(id)} termId={term ?? null} />;
}

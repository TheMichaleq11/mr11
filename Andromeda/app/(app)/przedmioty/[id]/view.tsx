'use client';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import CourseView from '@/components/views/CourseView';

function Inner() {
  const { id } = useParams<{ id: string }>();
  const term = useSearchParams().get('term');
  return <CourseView courseId={decodeURIComponent(id)} termId={term} />;
}

export default function View() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}

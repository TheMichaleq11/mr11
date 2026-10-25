'use client';
import { useParams } from 'next/navigation';
import { SurveyForm } from '@/components/views/SurveysView';

export default function View() {
  const { id } = useParams<{ id: string }>();
  return <SurveyForm id={decodeURIComponent(id)} />;
}

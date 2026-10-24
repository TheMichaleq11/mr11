import { SurveyForm } from '@/components/views/SurveysView';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SurveyForm id={decodeURIComponent(id)} />;
}

import type { Metadata } from 'next';
import { SurveysList } from '@/components/views/SurveysView';

export const metadata: Metadata = { title: 'Andromeda' };

export default function Page() {
  return <SurveysList />;
}

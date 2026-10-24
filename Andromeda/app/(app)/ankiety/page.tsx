import type { Metadata } from 'next';
import { SurveysList } from '@/components/views/SurveysView';

export const metadata: Metadata = { title: 'Ankiety · Andromeda' };

export default function Page() {
  return <SurveysList />;
}

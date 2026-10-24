import type { Metadata } from 'next';
import PlanView from '@/components/views/PlanView';

export const metadata: Metadata = { title: 'Plan zajęć · Andromeda' };

export default function Page() {
  return <PlanView />;
}

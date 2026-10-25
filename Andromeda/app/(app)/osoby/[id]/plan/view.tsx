'use client';
import { useParams } from 'next/navigation';
import { PersonPlan } from '@/components/views/PeopleView';

export default function View() {
  const { id } = useParams<{ id: string }>();
  return <PersonPlan id={decodeURIComponent(id)} />;
}

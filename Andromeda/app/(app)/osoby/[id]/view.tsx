'use client';
import { useParams } from 'next/navigation';
import { PersonView } from '@/components/views/PeopleView';

export default function View() {
  const { id } = useParams<{ id: string }>();
  return <PersonView id={decodeURIComponent(id)} />;
}

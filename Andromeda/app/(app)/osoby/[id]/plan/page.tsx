import { PersonPlan } from '@/components/views/PeopleView';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PersonPlan id={decodeURIComponent(id)} />;
}

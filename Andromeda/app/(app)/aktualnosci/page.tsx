import type { Metadata } from 'next';
import { NewsList } from '@/components/views/NewsView';

export const metadata: Metadata = { title: 'Andromeda' };

export default function Page() {
  return <NewsList />;
}

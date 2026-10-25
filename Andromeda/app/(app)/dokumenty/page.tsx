import type { Metadata } from 'next';
import DocumentsView from '@/components/views/DocumentsView';

export const metadata: Metadata = { title: 'Andromeda' };

export default function Page() {
  return <DocumentsView />;
}

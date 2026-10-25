import type { Metadata } from 'next';
import DocumentsView from '@/components/views/DocumentsView';

export const metadata: Metadata = { title: 'Dokumenty · Andromeda' };

export default function Page() {
  return <DocumentsView />;
}

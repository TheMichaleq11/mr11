import Shell from '@/components/Shell';

// Strony aplikacji są statyczne (logowanie sprawdza middleware.ts, dane ładują się z /api).
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}

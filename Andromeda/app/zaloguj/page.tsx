import type { Metadata } from 'next';
import ClearCache from '@/components/ClearCache';
import { usosConfigured } from '@/lib/session';

export const metadata: Metadata = { title: 'Andromeda' };
export const dynamic = 'force-dynamic';

const errors: Record<string, string> = {
  'brak-klucza': 'Logowanie do USOS nie jest jeszcze skonfigurowane (brak klucza API). Na razie możesz obejrzeć wersję demo.',
  usos: 'USOS nie odpowiedział poprawnie. Spróbuj ponownie za chwilę.',
  sesja: 'Logowanie wygasło albo zostało przerwane. Spróbuj jeszcze raz.',
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ blad?: string }> }) {
  const { blad } = await searchParams;
  const ready = usosConfigured();

  return (
    <main className="login">
      <ClearCache />
      <div className="login-card">
        <span className="login-logo">
          <img src="/logo-ikona.png" alt="" width={64} height={64} />
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h1>Andromeda</h1>
          <p>Twój plan zajęć, oceny i przedmioty z USOS UJ — w końcu czytelnie.</p>
        </div>

        {blad && errors[blad] && (
          <div className="error" role="alert">
            {errors[blad]}
          </div>
        )}

        <div className="actions">
          {ready ? (
            <a href="/api/auth/login" className="btn btn-primary">
              Zaloguj przez USOS UJ
            </a>
          ) : (
            <span className="btn btn-ghost" aria-disabled="true" style={{ opacity: 0.6 }}>
              Logowanie do USOS — wkrótce
            </span>
          )}
          <a href="/api/auth/demo" className="btn btn-ghost">
            Zobacz wersję demo
          </a>
        </div>

        <p className="fine">
          Logujesz się na oficjalnej stronie USOS — Andromeda nigdy nie widzi Twojego hasła. Dostaje tylko dostęp do
          odczytu planu i ocen, który możesz w każdej chwili cofnąć w USOSweb.
        </p>
      </div>
    </main>
  );
}

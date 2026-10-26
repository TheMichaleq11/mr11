import type { Metadata } from 'next';
import ClearCache from '@/components/ClearCache';
import { usosConfigured } from '@/lib/session';
import GlassCard from '@/components/GlassCard';

const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
const Lock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
);

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
      <GlassCard className="login-card2">
        <img className="login-mark" src="/logo-znak.svg" alt="" width={150} height={103} />
        <h1 className="login-title">Andromeda</h1>

        {blad && errors[blad] && (
          <div className="error" role="alert">
            {errors[blad]}
          </div>
        )}

        <div className="actions">
          {ready ? (
            <a href="/api/auth/login" className="btn btn-glow">
              Zaloguj przez USOS UJ <ArrowRight />
            </a>
          ) : (
            <span className="btn btn-glow" aria-disabled="true" style={{ opacity: 0.55 }}>
              Logowanie do USOS — wkrótce
            </span>
          )}
          <div className="or">albo</div>
          <a href="/api/auth/demo" className="btn btn-ghost">
            Zobacz wersję demo
          </a>
        </div>

        <p className="fine">
          <Lock />
          <span>Hasło wpisujesz na oficjalnej stronie USOS — Andromeda go nie widzi. Dostęp możesz cofnąć w USOSweb.</span>
        </p>
      </GlassCard>
    </main>
  );
}

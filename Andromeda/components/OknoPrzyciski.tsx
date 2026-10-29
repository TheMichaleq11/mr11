'use client';
// Przyciski okna (zminimalizuj / zmaksymalizuj / zamknij) w prawym górnym rogu panelu — tylko w aplikacji
// Andromeda na Windowsa. W trybie „ostrym” (przezroczyste okno) także niewidoczne uchwyty do zmiany rozmiaru.
import { useEffect, useState, type PointerEvent } from 'react';

type Okno = {
  windows?: boolean;
  tryb?: 'ostre' | 'szklo' | 'zwykle';
  min?: () => void;
  max?: () => void;
  zamknij?: () => void;
  onStan?: (cb: (s: { max: boolean }) => void) => void;
  rozmiar?: (faza: 'start' | 'ruch' | 'koniec', krawedz?: string) => void;
};

const KRAWEDZIE = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const;

export default function OknoPrzyciski() {
  const [okno, setOkno] = useState<Okno | null>(null);
  const [max, setMax] = useState(false);

  useEffect(() => {
    const o = (window as unknown as { andromedaOkno?: Okno }).andromedaOkno;
    if (!o?.windows || !o.min) return;
    setOkno(o);
    o.onStan?.((s) => setMax(s.max));
  }, []);

  if (!okno) return null;

  const start = (k: string) => (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    okno.rozmiar?.('start', k);
  };
  const ruch = (e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) okno.rozmiar?.('ruch');
  };
  const koniec = (e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    okno.rozmiar?.('koniec');
  };

  return (
    <>
      <div className="okno-btns" role="group" aria-label="Okno">
        <button type="button" className="okno-btn" onClick={() => okno.min?.()} aria-label="Zminimalizuj" title="Zminimalizuj">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6.5h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
        </button>
        <button type="button" className="okno-btn" onClick={() => okno.max?.()} aria-label={max ? 'Przywróć' : 'Zmaksymalizuj'} title={max ? 'Przywróć' : 'Zmaksymalizuj'}>
          {max ? (
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="2" y="3.8" width="6.2" height="6.2" rx="1.4" />
              <path d="M4.2 2.2h4.2a1.4 1.4 0 0 1 1.4 1.4v4.2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="2.2" y="2.2" width="7.6" height="7.6" rx="1.6" /></svg>
          )}
        </button>
        <button type="button" className="okno-btn okno-x" onClick={() => okno.zamknij?.()} aria-label="Zamknij" title="Zamknij">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.6 2.6l6.8 6.8M9.4 2.6l-6.8 6.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
        </button>
      </div>
      {okno.tryb === 'ostre' && !max &&
        KRAWEDZIE.map((k) => (
          <div key={k} className={`okno-rozmiar r-${k}`} onPointerDown={start(k)} onPointerMove={ruch} onPointerUp={koniec} onPointerCancel={koniec} aria-hidden="true" />
        ))}
    </>
  );
}

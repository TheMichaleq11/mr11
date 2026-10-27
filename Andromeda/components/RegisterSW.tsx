'use client';
import { useEffect } from 'react';

// Aplikacja dodana do ekranu głównego (iPhone/iPad) nie przeładowuje się sama — wraca z pamięci.
// Dlatego przy każdym powrocie do aplikacji sprawdzamy, czy na serwerze jest nowsza wersja,
// i jeśli tak — pobieramy nowy service worker i przeładowujemy stronę.
const MOJA = process.env.NEXT_PUBLIC_WERSJA ?? '';

export default function RegisterSW() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') return;
    let reg: ServiceWorkerRegistration | undefined;
    let reloading = false;
    const reload = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };

    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then((r) => (reg = r)).catch(() => {});
    // nowy service worker przejął stronę → przeładuj, żeby od razu była nowa wersja
    const hadController = !!navigator.serviceWorker.controller;
    const onController = () => {
      if (hadController) reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onController);

    let last = 0;
    const check = async () => {
      if (document.visibilityState !== 'visible' || Date.now() - last < 15000) return;
      last = Date.now();
      try {
        const r = await fetch('/api/wersja', { cache: 'no-store' });
        const { wersja } = (await r.json()) as { wersja: string };
        if (wersja && MOJA && wersja !== MOJA) {
          // zabezpieczenie: dla danej wersji przeładowujemy najwyżej raz (bez pętli)
          const key = 'andro:wersja-reload';
          let done: string | null = null;
          try {
            done = sessionStorage.getItem(key);
            sessionStorage.setItem(key, wersja);
          } catch {
            /* brak pamięci sesji */
          }
          if (done === wersja) return;
          await reg?.update().catch(() => {});
          reload();
        }
      } catch {
        /* bez internetu — zostaje obecna wersja */
      }
    };
    check();
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);
    window.addEventListener('pageshow', check);
    const t = window.setInterval(check, 5 * 60 * 1000);
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onController);
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('focus', check);
      window.removeEventListener('pageshow', check);
      clearInterval(t);
    };
  }, []);
  return null;
}

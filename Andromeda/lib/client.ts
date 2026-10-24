'use client';
// Prosty hook do pobierania danych z /api z pamięcią podręczną między ekranami.
import { useCallback, useEffect, useState } from 'react';

const cache = new Map<string, unknown>();
const inflight = new Map<string, Promise<Response>>();

/** Kilka komponentów prosi o to samo naraz — do USOS idzie jedno zapytanie. */
function shared(url: string): Promise<Response> {
  let p = inflight.get(url);
  if (!p) {
    p = fetch(url, { credentials: 'same-origin' }).finally(() => setTimeout(() => inflight.delete(url), 0));
    inflight.set(url, p);
  }
  return p.then((r) => r.clone());
}

export type ApiState<T> = { data: T | null; error: string | null; loading: boolean; reload: () => void };

export function useApi<T>(url: string | null): ApiState<T> {
  const [data, setData] = useState<T | null>(() => (url ? ((cache.get(url) as T) ?? null) : null));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(url) && !cache.has(url ?? ''));
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!url) return;
    let alive = true;
    if (cache.has(url)) setData(cache.get(url) as T);
    else {
      setData(null);
      setLoading(true);
    }
    shared(url)
      .then(async (r) => {
        if (r.status === 401) {
          window.location.href = '/zaloguj';
          return;
        }
        if (!r.ok) throw new Error((await r.json().catch(() => null))?.detail || `Błąd ${r.status}`);
        const json = (await r.json()) as T;
        cache.set(url, json);
        if (alive) {
          setData(json);
          setError(null);
        }
      })
      .catch((e: Error) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [url, tick]);

  useEffect(() => {
    const onFocus = () => setTick((t) => t + 1);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, reload };
}

/** Odświeża komponent co minutę (np. "za 25 min"). */
export function useNow(intervalMs = 60000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

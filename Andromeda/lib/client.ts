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

class ApiError extends Error {
  constructor(message: string, public code: string | null) {
    super(message);
  }
}

/** Czyści zapamiętane odpowiedzi (np. po zapisie na przedmiot). */
export function invalidate(prefix: string) {
  for (const k of [...cache.keys()]) if (k.startsWith(prefix)) cache.delete(k);
}

export type ApiState<T> = {
  data: T | null;
  error: string | null;
  /** 'scope' = brakuje zgody w USOS (trzeba zalogować się ponownie) */
  errorCode: string | null;
  loading: boolean;
  reload: () => void;
};

export function useApi<T>(url: string | null): ApiState<T> {
  const [data, setData] = useState<T | null>(() => (url ? ((cache.get(url) as T) ?? null) : null));
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
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
        if (!r.ok) {
          const body = await r.json().catch(() => null);
          throw new ApiError(body?.detail || `Błąd ${r.status}`, body?.error ?? null);
        }
        const json = (await r.json()) as T;
        cache.set(url, json);
        if (alive) {
          setData(json);
          setError(null);
          setErrorCode(null);
        }
      })
      .catch((e: Error) => {
        if (!alive) return;
        setError(e.message);
        setErrorCode(e instanceof ApiError ? e.code : null);
      })
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

  const reload = useCallback(() => {
    if (url) cache.delete(url);
    setTick((t) => t + 1);
  }, [url]);
  return { data, error, errorCode, loading, reload };
}

/** POST z JSON-em; zwraca komunikat błędu albo null przy sukcesie. */
export async function postJson(url: string, body: unknown): Promise<string | null> {
  try {
    const r = await fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (r.ok) return null;
    const j = await r.json().catch(() => null);
    if (j?.error === 'scope') return 'Ta akcja wymaga dodatkowej zgody w USOS — zaloguj się ponownie.';
    return j?.detail || `Błąd ${r.status}`;
  } catch {
    return 'Brak połączenia z internetem.';
  }
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

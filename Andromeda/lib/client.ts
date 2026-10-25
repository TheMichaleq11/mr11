'use client';
// Pobieranie danych z /api: najpierw pokazujemy to, co już mamy (pamięć + zapis na urządzeniu),
// a świeże dane dociągamy w tle ("stale-while-revalidate"). Dzięki temu ekrany otwierają się od razu.
import { useCallback, useEffect, useRef, useState } from 'react';

type Cached = { t: number; d: unknown };

const STORAGE_KEY = 'andro:cache:v1';
const MAX_STORED = 80; // tyle odpowiedzi trzymamy na urządzeniu
const MAX_AGE_STORED = 14 * 24 * 3600 * 1000; // starsze wyrzucamy
/** Jak długo dane uchodzą za świeże — w tym czasie przełączanie ekranów nie pyta serwera wcale. */
const FRESH_MS = 45_000;
/** Powrót do aplikacji odświeża dane najwyżej raz na tyle. */
const FOCUS_MS = 60_000;

const mem = new Map<string, Cached>();
const inflight = new Map<string, Promise<unknown>>();
const listeners = new Map<string, Set<(v: Cached) => void>>();
let loaded = false;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const obj = JSON.parse(raw) as Record<string, Cached>;
    const now = Date.now();
    for (const [k, v] of Object.entries(obj)) if (v && now - v.t < MAX_AGE_STORED) mem.set(k, v);
  } catch {
    /* prywatne okno / brak miejsca — działamy bez zapisu */
  }
}

function save() {
  if (typeof window === 'undefined') return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const entries = [...mem.entries()].sort((a, b) => b[1].t - a[1].t).slice(0, MAX_STORED);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(entries)));
    } catch {
      /* za mało miejsca — trudno, zostaje pamięć RAM */
    }
  }, 400);
}

function put(url: string, d: unknown) {
  const v = { t: Date.now(), d };
  mem.set(url, v);
  save();
  listeners.get(url)?.forEach((fn) => fn(v));
}

class ApiError extends Error {
  constructor(message: string, public code: string | null) {
    super(message);
  }
}

/** Jedno zapytanie naraz dla danego adresu, wynik trafia do pamięci. */
function revalidate(url: string): Promise<unknown> {
  let p = inflight.get(url);
  if (p) return p;
  p = fetch(url, { credentials: 'same-origin' })
    .then(async (r) => {
      if (r.status === 401) {
        clearClientCache();
        window.location.href = '/zaloguj';
        return new Promise(() => {}); // strona i tak się przeładowuje
      }
      if (!r.ok) {
        const body = await r.json().catch(() => null);
        throw new ApiError(body?.detail || `Błąd ${r.status}`, body?.error ?? null);
      }
      const json = await r.json();
      put(url, json);
      return json;
    })
    .finally(() => inflight.delete(url));
  inflight.set(url, p);
  return p;
}

/** Pobiera dane w tle, zanim użytkownik wejdzie na ekran. */
export function prefetch(url: string) {
  load();
  const c = mem.get(url);
  if (c && Date.now() - c.t < FRESH_MS) return;
  revalidate(url).catch(() => {});
}

/** Czyści zapamiętane odpowiedzi (np. po zapisie na przedmiot). */
export function invalidate(prefix: string) {
  load();
  for (const k of [...mem.keys()]) if (k.startsWith(prefix)) mem.delete(k);
  save();
}

/** Usuwa wszystkie dane z urządzenia (wylogowanie, zmiana konta). */
export function clearClientCache() {
  mem.clear();
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nic */
  }
}

export type ApiState<T> = {
  data: T | null;
  error: string | null;
  /** 'scope' = brakuje zgody w USOS (trzeba zalogować się ponownie) */
  errorCode: string | null;
  loading: boolean;
  /** true, gdy pokazujemy zapamiętane dane i właśnie dociągamy świeże */
  refreshing: boolean;
  reload: () => void;
};

export function useApi<T>(url: string | null): ApiState<T> {
  // Pierwszy render zawsze pusty (taki sam jak na serwerze), dane z pamięci wchodzą zaraz potem.
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [refreshing, setRefreshing] = useState(false);
  const lastFetch = useRef(0);
  const [tick, setTick] = useState(0);
  const force = useRef(false);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }
    load();
    let alive = true;
    const cached = mem.get(url);
    if (cached) {
      setData(cached.d as T);
      setLoading(false);
    } else {
      setData(null);
      setLoading(true);
    }
    setError(null);
    setErrorCode(null);

    // aktualizacje z innych komponentów proszących o ten sam adres
    const fn = (v: Cached) => alive && setData(v.d as T);
    if (!listeners.has(url)) listeners.set(url, new Set());
    listeners.get(url)!.add(fn);

    const fresh = cached && Date.now() - cached.t < FRESH_MS;
    if (!fresh || force.current) {
      force.current = false;
      setRefreshing(Boolean(cached));
      lastFetch.current = Date.now();
      revalidate(url)
        .then((json) => {
          if (!alive) return;
          setData(json as T);
          setError(null);
          setErrorCode(null);
        })
        .catch((e: Error) => {
          if (!alive) return;
          // mamy stare dane — pokazujemy je dalej, bez straszenia błędem
          if (!mem.has(url)) {
            setError(e.message);
            setErrorCode(e instanceof ApiError ? e.code : null);
          }
        })
        .finally(() => {
          if (!alive) return;
          setLoading(false);
          setRefreshing(false);
        });
    }
    return () => {
      alive = false;
      listeners.get(url)?.delete(fn);
    };
  }, [url, tick]);

  useEffect(() => {
    const onFocus = () => {
      if (Date.now() - lastFetch.current < FOCUS_MS) return;
      force.current = true;
      setTick((t) => t + 1);
    };
    const onVisible = () => document.visibilityState === 'visible' && onFocus();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const reload = useCallback(() => {
    force.current = true;
    setTick((t) => t + 1);
  }, []);
  return { data, error, errorCode, loading, refreshing, reload };
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

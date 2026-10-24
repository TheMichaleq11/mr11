'use client';
import { useEffect, useState } from 'react';

/** Wartość "opóźniona" — wyszukiwarka nie pyta USOS przy każdej literce. */
export function useDebounced<T>(value: T, ms = 350): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

'use client';
// Motyw jasny / ciemny — zapamiętany na urządzeniu, ustawiany na <html data-motyw>.
import { useEffect, useState } from 'react';

export type Motyw = 'ciemny' | 'jasny';
const KEY = 'andro:motyw';

/** Skrypt wstawiany do <head>, żeby motyw był ustawiony zanim strona się narysuje (bez mignięcia). */
export const motywScript = `try{if(localStorage.getItem('${KEY}')==='jasny')document.documentElement.dataset.motyw='jasny'}catch(e){}`;

// Kolor paska przeglądarki (Safari na iPhonie) dopasowany do motywu.
function setBarColor(m: Motyw) {
  const color = m === 'jasny' && window.innerWidth < 900 ? '#E9EEFC' : '#050812';
  document.querySelectorAll('meta[name="theme-color"]').forEach((el) => el.setAttribute('content', color));
}

export function useMotyw(): [Motyw, () => void] {
  const [motyw, setMotyw] = useState<Motyw>('ciemny');
  useEffect(() => {
    const m: Motyw = document.documentElement.dataset.motyw === 'jasny' ? 'jasny' : 'ciemny';
    setMotyw(m);
    setBarColor(m);
  }, []);
  const toggle = () => {
    const next: Motyw = motyw === 'jasny' ? 'ciemny' : 'jasny';
    const root = document.documentElement;
    const apply = () => {
      if (next === 'jasny') root.dataset.motyw = 'jasny';
      else delete root.dataset.motyw;
      setBarColor(next);
    };
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* brak pamięci — działa do odświeżenia */
    }
    setMotyw(next);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Płynne przenikanie całej strony naraz: tła, napisy i kolory zmieniają się w tym samym momencie.
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (doc.startViewTransition && !reduce) {
      root.classList.add('motyw-vt');
      const vt = doc.startViewTransition(apply) as { finished?: Promise<void> };
      vt.finished?.finally(() => root.classList.remove('motyw-vt'));
      return;
    }
    // Starsze przeglądarki: wszystkie kolory przechodzą razem w tym samym czasie.
    root.classList.add('motyw-zmiana');
    apply();
    window.setTimeout(() => root.classList.remove('motyw-zmiana'), 600);
  };
  return [motyw, toggle];
}

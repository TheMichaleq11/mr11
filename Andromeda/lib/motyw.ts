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
    root.classList.add('motyw-zmiana');
    if (next === 'jasny') root.dataset.motyw = 'jasny';
    else delete root.dataset.motyw;
    window.setTimeout(() => root.classList.remove('motyw-zmiana'), 450);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* brak pamięci — działa do odświeżenia */
    }
    setBarColor(next);
    setMotyw(next);
  };
  return [motyw, toggle];
}

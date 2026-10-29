'use client';
// Motywy aplikacji — zapamiętane na urządzeniu.
// Na <html> ustawiamy dwa atrybuty: data-motyw="jasny" (jasna baza) i data-paleta="blekit|noc" (kolorystyka).
import { useEffect, useState } from 'react';

export type Motyw = 'ciemny' | 'jasny' | 'blekit' | 'noc';
const KEY = 'andro:motyw';

export const MOTYWY: { id: Motyw; nazwa: string; kolory: [string, string] }[] = [
  { id: 'ciemny', nazwa: 'Ciemny', kolory: ['#10152E', '#282E5C'] },
  { id: 'jasny', nazwa: 'Jasny', kolory: ['#10152E', '#E9EEFC'] },
  { id: 'blekit', nazwa: 'Błękit', kolory: ['#0040FF', '#FFFFFF'] },
  { id: 'noc', nazwa: 'Noc', kolory: ['#061553', '#0A5BFF'] },
];

const ATTR: Record<Motyw, { motyw?: 'jasny'; paleta?: 'blekit' | 'noc' }> = {
  ciemny: {},
  jasny: { motyw: 'jasny' },
  blekit: { motyw: 'jasny', paleta: 'blekit' },
  noc: { paleta: 'noc' },
};

/** Skrypt wstawiany do <head>, żeby motyw był ustawiony zanim strona się narysuje (bez mignięcia). */
// W aplikacji na Windowsa (Electron) okno dopisuje do user-agenta „AndromedaOkno/… (szklo)” albo „(zwykle)”
// — wtedy ustawiamy data-okno, a CSS robi miejsce na przyciski okna i (przy szkle) przepuszcza pulpit.
export const motywScript = `try{var m=localStorage.getItem('${KEY}'),d=document.documentElement,u=navigator.userAgent.match(/AndromedaOkno\\/[\\d.]+ \\((szklo|zwykle)\\)/);if(u)d.dataset.okno=u[1];if(m==='jasny'||m==='blekit')d.dataset.motyw='jasny';if(m==='blekit'||m==='noc')d.dataset.paleta=m}catch(e){}`;

type Okno = { motyw?: (m: Motyw) => void };
/** Mówi oknu Windowsa, jaki jest motyw — dopasowuje kolor przycisków okna i odcień szkła. */
function powiedzOknu(m: Motyw) {
  try {
    (window as unknown as { andromedaOkno?: Okno }).andromedaOkno?.motyw?.(m);
  } catch {
    /* zwykła przeglądarka */
  }
}

function current(): Motyw {
  const d = document.documentElement.dataset;
  if (d.paleta === 'blekit') return 'blekit';
  if (d.paleta === 'noc') return 'noc';
  return d.motyw === 'jasny' ? 'jasny' : 'ciemny';
}

// Kolor paska przeglądarki (Safari na iPhonie) dopasowany do motywu.
function setBarColor(m: Motyw) {
  const phone = window.innerWidth < 900;
  const color = !phone ? '#050812' : m === 'jasny' ? '#E9EEFC' : m === 'blekit' ? '#EEF2FF' : m === 'noc' ? '#061553' : '#050812';
  document.querySelectorAll('meta[name="theme-color"]').forEach((el) => el.setAttribute('content', color));
}

export function useMotyw(): [Motyw, (m: Motyw) => void] {
  const [motyw, setMotyw] = useState<Motyw>('ciemny');
  useEffect(() => {
    const m = current();
    setMotyw(m);
    setBarColor(m);
    powiedzOknu(m);
  }, []);
  const choose = (next: Motyw) => {
    if (next === current()) return;
    const root = document.documentElement;
    const apply = () => {
      const a = ATTR[next];
      if (a.motyw) root.dataset.motyw = a.motyw;
      else delete root.dataset.motyw;
      if (a.paleta) root.dataset.paleta = a.paleta;
      else delete root.dataset.paleta;
      setBarColor(next);
      powiedzOknu(next);
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
      doc.startViewTransition(apply);
      return;
    }
    root.classList.add('motyw-zmiana');
    apply();
    window.setTimeout(() => root.classList.remove('motyw-zmiana'), 600);
  };
  return [motyw, choose];
}

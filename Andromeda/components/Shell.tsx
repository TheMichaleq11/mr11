'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { prefetch, useApi } from '@/lib/client';
import { activeMonday, today } from '@/lib/dates';
import { registerCourses } from '@/lib/colors';
import type { GradesResponse, Me } from '@/lib/types';
import {
  Book,
  Calendar,
  CalendarDays,
  Chart,
  Award,
  Clipboard,
  FileText,
  Pencil,
  Users,
  Grid,
  Home,
  IdCard,
  LogOut,
  MapPin,
  News,
  Survey,
  Ticket,
  User,
  Wallet,
  ChevronLeft,
  Chat,
  CheckList,
  Language,
  Compass,
  Sun,
  Moon,
} from './Icons';
import { useMotyw } from '@/lib/motyw';

const MeContext = createContext<Me | null>(null);
export const useMe = () => useContext(MeContext);

type Item = { href: string; label: string; longLabel?: string; desc?: string; Icon: (p: { size?: number }) => ReactNode };

/** Wszystkie sekcje aplikacji — boczne menu na komputerze i ekran "Więcej" na telefonie. */
export const sections: { title: string; items: Item[] }[] = [
  {
    title: 'Studia',
    items: [
      { href: '/', label: 'Dziś', Icon: Home },
      { href: '/plan', label: 'Plan', longLabel: 'Plan zajęć', Icon: Calendar, desc: 'Tydzień zajęć z salami' },
      { href: '/oceny', label: 'Oceny', Icon: Chart, desc: 'Oceny i średnia' },
      { href: '/sprawdziany', label: 'Sprawdziany', Icon: Clipboard, desc: 'Punkty z kolokwiów i prac' },
      { href: '/egzaminy', label: 'Egzaminy', Icon: Pencil, desc: 'Terminy, sale, zapisy w sesji' },
      { href: '/grupy', label: 'Grupy', longLabel: 'Grupy zajęciowe', Icon: Users, desc: 'Kto jest w grupie, mail do grupy' },
      { href: '/przedmioty', label: 'Przedmioty', Icon: Book, desc: 'Prowadzący, terminy, sylabus' },
      { href: '/zapisy', label: 'Zapisy', Icon: Ticket, desc: 'Rejestracje i koszyk' },
      { href: '/konsultacje', label: 'Konsultacje', Icon: Chat, desc: 'Zapisy na dyżury i spotkania' },
      { href: '/testy', label: 'Testy językowe', longLabel: 'Testy poziomujące', Icon: Language, desc: 'Wyniki testów z języków' },
    ],
  },
  {
    title: 'Uczelnia',
    items: [
      { href: '/kalendarz', label: 'Kalendarz', longLabel: 'Kalendarz akademicki', Icon: CalendarDays, desc: 'Sesja, dni wolne, przerwy' },
      { href: '/budynki', label: 'Budynki', longLabel: 'Budynki i mapa', Icon: MapPin, desc: 'Gdzie co jest' },
      { href: '/osoby', label: 'Prowadzący', Icon: User, desc: 'Dyżury, pokoje, kontakt' },
      { href: '/aktualnosci', label: 'Aktualności', Icon: News, desc: 'Ogłoszenia UJ i wydziału' },
      { href: '/ankiety', label: 'Ankiety', Icon: Survey, desc: 'Ocena zajęć' },
      { href: '/przewodnik', label: 'Przewodnik', Icon: Compass, desc: 'Najważniejsze informacje UJ' },
    ],
  },
  {
    title: 'Ja',
    items: [
      { href: '/profil', label: 'Profil', longLabel: 'Profil i legitymacja', Icon: IdCard, desc: 'Album, kierunek, legitymacja' },
      { href: '/studia', label: 'Studia i ECTS', Icon: Award, desc: 'Etapy, punkty, dyplom' },
      { href: '/dokumenty', label: 'Dokumenty', Icon: FileText, desc: 'Decyzje i zaświadczenia' },
      { href: '/platnosci', label: 'Płatności', Icon: Wallet, desc: 'Opłaty, konto do wpłat, zwroty' },
      { href: '/obiegowki', label: 'Obiegówki', Icon: CheckList, desc: 'Rozliczenia z uczelnią' },
    ],
  },
];

const tabs: Item[] = [
  { href: '/', label: 'Dziś', Icon: Home },
  { href: '/plan', label: 'Plan', Icon: Calendar },
  { href: '/oceny', label: 'Oceny', Icon: Chart },
  { href: '/zapisy', label: 'Zapisy', Icon: Ticket },
  { href: '/wiecej', label: 'Więcej', Icon: Grid },
];

function isActive(path: string, href: string) {
  return href === '/' ? path === '/' : path === href || path.startsWith(href + '/');
}

const tabHrefs = new Set(tabs.map((t) => t.href).filter((h) => h !== '/wiecej'));

export default function Shell({ children }: { children: ReactNode }) {
  const path = usePathname() || '/';
  const { data: me } = useApi<Me>('/api/me');
  const { data: grades } = useApi<GradesResponse>('/api/grades');
  const [palette, setPalette] = useState(0);
  const [motyw, toggleMotyw] = useMotyw();
  const motywLabel = motyw === 'jasny' ? 'Motyw ciemny' : 'Motyw jasny';
  useEffect(() => {
    if (grades && registerCourses(grades.courses.map((c) => c.courseId))) setPalette((v) => v + 1);
  }, [grades]);
  // Treść rysujemy dopiero na urządzeniu (strony są statyczne, a daty i dane są "na teraz").
  const [mounted, setMounted] = useState(false);
  // Podpis ikony w pływającym dymku (rysowany poza paskiem, więc pasek może się przewijać).
  const [tip, setTip] = useState<{ label: string; top: number; left: number } | null>(null);
  // Pasek boczny: rozwinięty (z podpisami) albo zwinięty do ikon — zapamiętane na urządzeniu.
  // Domyślnie wąski pasek z ikonami; rozwinięcie zapamiętujemy na urządzeniu.
  const [collapsed, setCollapsed] = useState(true);
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('andro:side') !== 'full');
    } catch {
      /* brak dostępu do pamięci — zostaje rozwinięty */
    }
  }, []);
  const toggleSide = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem('andro:side', c ? 'full' : 'mini');
      } catch {
        /* trudno */
      }
      return !c;
    });
  // Szklane podświetlenie, które płynnie jedzie za kursorem po pozycjach menu.
  const [hover, setHover] = useState<{ top: number; height: number } | null>(null);
  // Szklane zaznaczenie aktywnej zakładki — przejeżdża płynnie do nowo wybranej pozycji.
  const navRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState<{ top: number; height: number; anim: boolean } | null>(null);
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const el = nav.querySelector<HTMLElement>('.side-link[aria-current="page"]');
    if (!el) {
      setActive(null);
      return;
    }
    const r = el.getBoundingClientRect();
    const n = nav.getBoundingClientRect();
    const top = r.top - n.top + nav.scrollTop;
    setActive((prev) => ({ top, height: r.height, anim: prev !== null }));
  }, [path]);
  const showTip = (label: string, el: HTMLElement) => {
    // Pastylka jeździ tylko po pozycjach menu (nie po profilu czy wylogowaniu) i tylko pod myszką —
    // na dotyku zostawałaby w przypadkowym miejscu.
    const nav = el.closest('.side-nav') as HTMLElement | null;
    const mouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (nav && mouse) {
      const r = el.getBoundingClientRect();
      const n = nav.getBoundingClientRect();
      setHover({ top: r.top - n.top + nav.scrollTop, height: r.height });
    } else setHover(null);
    if (!collapsed) return;
    const r = el.getBoundingClientRect();
    setTip({ label, top: r.top + r.height / 2, left: r.right + 14 });
  };
  const tipProps = (label: string) => ({
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => showTip(label, e.currentTarget),
    onFocus: (e: React.FocusEvent<HTMLElement>) => showTip(label, e.currentTarget),
    onMouseLeave: () => setTip(null),
    onBlur: () => setTip(null),
  });
  useEffect(() => {
    setTip(null);
    setHover(null);
  }, [path]);
  useEffect(() => setMounted(true), []);

  // Gdy telefon nic nie robi — dociągamy dane głównych zakładek, żeby otwierały się od razu.
  useEffect(() => {
    const warm = () => {
      prefetch(`/api/plan?start=${activeMonday()}&days=7`);
      prefetch(`/api/plan?start=${today()}&days=7`);
      prefetch('/api/grades');
      setTimeout(() => prefetch('/api/zapisy'), 1500);
    };
    // Safari na iPhonie nie ma requestIdleCallback — wtedy krótkie opóźnienie.
    const id = window.setTimeout(() => {
      if ('requestIdleCallback' in window) window.requestIdleCallback(warm, { timeout: 2500 });
      else warm();
    }, 600);
    return () => clearTimeout(id);
  }, []);

  const initials = me ? `${me.firstName[0] ?? ''}${me.lastName[0] ?? ''}` : '';
  // "Więcej" świeci się dla sekcji, które nie mają własnej zakładki na telefonie.
  const moreActive = path === '/wiecej' || ![...tabHrefs].some((h) => isActive(path, h));

  return (
    <MeContext.Provider value={me}>
      <div className="shell">
        <aside className={`side${collapsed ? ' mini' : ''}`} aria-label="Menu">
          <div className="side-top">
            <Link href="/" className="brand" aria-label="Andromeda — strona główna">
              <span className="brand-mark"><img src="/logo-znak.svg" alt="" width={44} height={30} /></span>
              <span className="brand-name lbl" aria-hidden="true">
                {'NDROMEDA'.split('').map((c, i) => (
                  <b key={i} style={{ transitionDelay: collapsed ? '0s' : `${0.22 + i * 0.035}s` }}>{c}</b>
                ))}
              </span>
            </Link>
            <button className="side-toggle" onClick={toggleSide} aria-label={collapsed ? 'Rozwiń menu' : 'Zwiń menu'} aria-expanded={!collapsed}>
              <ChevronLeft size={16} />
            </button>
          </div>

          <Link href="/profil" className="side-me" aria-current={isActive(path, '/profil') ? 'page' : undefined} {...tipProps(me ? `${me.firstName} ${me.lastName}` : 'Profil')}>
            <span className="avatar">{initials || '·'}</span>
            <span className="me-letter" aria-hidden="true">{me?.firstName?.[0] ?? '·'}</span>
            <span className="who lbl">
              <span>{me ? `${me.firstName} ${me.lastName}` : '…'}</span>
              <span>{me?.demo ? 'Tryb demo' : me?.programme ?? 'Student UJ'}</span>
            </span>
            <span className="me-chev lbl" aria-hidden="true"><ChevronLeft size={14} /></span>
          </Link>

          <nav ref={navRef} aria-label="Główna nawigacja" className={`side-nav${active ? ' has-pill' : ''}`} onMouseLeave={() => setHover(null)}>
            <span
              className="side-active"
              aria-hidden="true"
              style={active ? { transform: `translateY(${active.top}px)`, height: active.height, opacity: 1, transition: active.anim ? undefined : 'none' } : { opacity: 0 }}
            />
            <span className="side-hover" aria-hidden="true" style={hover ? { transform: `translateY(${hover.top}px)`, height: hover.height, opacity: 1 } : { opacity: 0 }} />
            {sections.map((s) => (
              <div key={s.title} className="side-group">
                <span className="side-title lbl">{s.title}</span>
                {s.items.map(({ href, label, longLabel, Icon }) => (
                  <Link key={href} href={href} className="side-link" aria-current={isActive(path, href) ? 'page' : undefined} aria-label={collapsed ? longLabel ?? label : undefined} {...tipProps(longLabel ?? label)}>
                    <Icon size={20} />
                    <span className="lbl">{longLabel ?? label}</span>
                  </Link>
                ))}
              </div>
            ))}
          </nav>

          <form action="/api/auth/logout" method="post" className="side-bottom">
            <button type="button" className="side-link side-motyw" onClick={toggleMotyw} aria-label={collapsed ? motywLabel : undefined} {...tipProps(motywLabel)}>
              {motyw === 'jasny' ? <Moon size={20} /> : <Sun size={20} />}
              <span className="lbl">{motywLabel}</span>
            </button>
            <button className="side-link side-out" aria-label={collapsed ? 'Wyloguj' : undefined} {...tipProps('Wyloguj')}>
              <LogOut size={20} />
              <span className="lbl">Wyloguj</span>
            </button>
          </form>
        </aside>
        {tip && (
          <span className="tip on" role="tooltip" style={{ top: tip.top, left: tip.left }}>
            {tip.label}
          </span>
        )}

        <main className="main">
          <div className="container page-in" key={`${palette}-${path}`}>
            {mounted ? children : <div className="skeleton" style={{ minHeight: 180 }} aria-hidden="true" />}
          </div>
        </main>

        <nav className="tabbar" aria-label="Główna nawigacja" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
          {tabs.map(({ href, label, Icon }) => {
            const on = href === '/wiecej' ? moreActive : isActive(path, href);
            return (
              <Link key={href} href={href} className="tab" aria-current={on ? 'page' : undefined}>
                <Icon />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </MeContext.Provider>
  );
}

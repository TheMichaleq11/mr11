'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useApi } from '@/lib/client';
import { registerCourses } from '@/lib/colors';
import type { GradesResponse, Me } from '@/lib/types';
import { Book, Calendar, Chart, Galaxy, Home, LogOut } from './Icons';

const MeContext = createContext<Me | null>(null);
export const useMe = () => useContext(MeContext);

const items = [
  { href: '/', label: 'Dziś', Icon: Home },
  { href: '/plan', label: 'Plan', longLabel: 'Plan zajęć', Icon: Calendar },
  { href: '/oceny', label: 'Oceny', Icon: Chart },
  { href: '/przedmioty', label: 'Przedmioty', Icon: Book },
];

function isActive(path: string, href: string) {
  return href === '/' ? path === '/' : path === href || path.startsWith(href + '/');
}

export default function Shell({ children }: { children: ReactNode }) {
  const path = usePathname() || '/';
  const { data: me } = useApi<Me>('/api/me');
  const { data: grades } = useApi<GradesResponse>('/api/grades');
  const [palette, setPalette] = useState(0);
  useEffect(() => {
    if (grades && registerCourses(grades.courses.map((c) => c.courseId))) setPalette((v) => v + 1);
  }, [grades]);
  const initials = me ? `${me.firstName[0] ?? ''}${me.lastName[0] ?? ''}` : '';

  return (
    <MeContext.Provider value={me}>
      <div className="shell">
        <aside className="side">
          <Link href="/" className="brand" aria-label="Andromeda — strona główna">
            <span className="brand-mark"><Galaxy /></span>
            <span className="brand-name">Andromeda</span>
          </Link>
          <nav aria-label="Główna nawigacja">
            {items.map(({ href, label, longLabel, Icon }) => (
              <Link key={href} href={href} className="side-link" aria-current={isActive(path, href) ? 'page' : undefined}>
                <Icon size={20} />
                {longLabel ?? label}
              </Link>
            ))}
          </nav>
          <div className="side-user">
            <span className="avatar">{initials || '·'}</span>
            <div className="who">
              <span>{me ? `${me.firstName} ${me.lastName}` : '…'}</span>
              <span>{me?.demo ? 'Tryb demo' : me?.programme ?? 'Student UJ'}</span>
            </div>
            <form action="/api/auth/logout" method="post">
              <button className="icon-btn" aria-label="Wyloguj" title="Wyloguj"><LogOut /></button>
            </form>
          </div>
        </aside>

        <main className="main">
          <div className="container" key={palette}>
            {children}
          </div>
        </main>

        <nav className="tabbar" aria-label="Główna nawigacja">
          {items.map(({ href, label, Icon }) => (
            <Link key={href} href={href} className="tab" aria-current={isActive(path, href) ? 'page' : undefined}>
              <Icon />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </MeContext.Provider>
  );
}

'use client';
import Link from 'next/link';
import { sections, useMe } from '../Shell';
import { LogOut, Moon, Sun } from '../Icons';
import { useMotyw } from '@/lib/motyw';
import { PageHead } from '../ui';

const onTabbar = new Set(['/', '/plan', '/oceny', '/zapisy']);

export default function MoreView() {
  const me = useMe();
  const [motyw, toggleMotyw] = useMotyw();
  return (
    <>
      <PageHead eyebrow={me ? `${me.firstName} ${me.lastName}` : undefined} title="Więcej" />
      {sections.map((s) => {
        const items = s.items.filter((i) => !onTabbar.has(i.href));
        if (!items.length) return null;
        return (
          <section className="section" key={s.title}>
            <h2 className="h2">{s.title}</h2>
            <div className="more-grid">
              {items.map(({ href, label, longLabel, desc, Icon }) => (
                <Link key={href} href={href} className="more-tile">
                  <span className="ico"><Icon size={22} /></span>
                  <b>{longLabel ?? label}</b>
                  {desc && <span>{desc}</span>}
                </Link>
              ))}
            </div>
          </section>
        );
      })}
      <button type="button" className="btn btn-ghost motyw-btn" style={{ width: '100%', marginBottom: 10 }} onClick={toggleMotyw}>
        {motyw === 'jasny' ? <Moon size={18} /> : <Sun size={18} />} {motyw === 'jasny' ? 'Motyw ciemny' : 'Motyw jasny'}
      </button>
      <form action="/api/auth/logout" method="post">
        <button className="btn btn-ghost" style={{ width: '100%' }}><LogOut /> Wyloguj</button>
      </form>
    </>
  );
}

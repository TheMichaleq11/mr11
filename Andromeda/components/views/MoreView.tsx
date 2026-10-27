'use client';
import Link from 'next/link';
import { sections, useMe } from '../Shell';
import { LogOut } from '../Icons';
import { MOTYWY, useMotyw } from '@/lib/motyw';
import { PageHead } from '../ui';

const onTabbar = new Set(['/', '/plan', '/oceny', '/zapisy']);

export default function MoreView() {
  const me = useMe();
  const [motyw, chooseMotyw] = useMotyw();
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
      <section className="section">
        <h2 className="h2">Motyw</h2>
        <div className="motyw-grid">
          {MOTYWY.map((m) => (
            <button key={m.id} type="button" className="motyw-opt" aria-pressed={motyw === m.id} onClick={() => chooseMotyw(m.id)}>
              <span className="sw" style={{ background: `linear-gradient(135deg, ${m.kolory[0]} 50%, ${m.kolory[1]} 50%)` }} />
              {m.nazwa}
            </button>
          ))}
        </div>
      </section>
      <form action="/api/auth/logout" method="post">
        <button className="btn btn-ghost" style={{ width: '100%' }}><LogOut /> Wyloguj</button>
      </form>
      <p className="wersja-app">Wersja {(process.env.NEXT_PUBLIC_WERSJA ?? '').slice(0, 7) || 'lokalna'}</p>
    </>
  );
}

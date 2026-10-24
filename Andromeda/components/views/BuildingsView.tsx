'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useApi } from '@/lib/client';
import { activeMonday, dayOf, hhmm, shortWeekday } from '@/lib/dates';
import type { PlanResponse } from '@/lib/types';
import type { Building, BuildingsResponse } from '@/lib/types-more';
import { ChevronLeft, ChevronRight, External, MapPin, Search } from '../Icons';
import { Empty, LoadError, PageHead, roomLabel, Skeleton } from '../ui';

function mapsLink(b: Building, apple: boolean): string | null {
  if (b.lat === null || b.lng === null) {
    return b.address ? (apple ? `https://maps.apple.com/?q=${encodeURIComponent(b.address)}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`) : null;
  }
  return apple
    ? `https://maps.apple.com/?ll=${b.lat},${b.lng}&q=${encodeURIComponent(b.name)}`
    : `https://www.google.com/maps/search/?api=1&query=${b.lat},${b.lng}`;
}

function useIsApple() {
  const [apple, setApple] = useState(false);
  useEffect(() => setApple(/iPhone|iPad|Macintosh/.test(navigator.userAgent)), []);
  return apple;
}

function BuildingRow({ b, hint }: { b: Building; hint?: string }) {
  return (
    <Link href={`/budynki/${encodeURIComponent(b.id)}`} className="row">
      <span className="avatar" style={{ background: 'var(--ok-bg)', color: 'var(--ok-ink)', borderRadius: 12 }}>
        <MapPin size={18} />
      </span>
      <div className="grow">
        <span className="t1">{b.name}</span>
        <span className="t2">{hint ?? ([b.address, b.campus].filter(Boolean).join(' · ') || 'Brak adresu')}</span>
      </div>
      <span style={{ color: 'var(--muted)' }}><ChevronRight /></span>
    </Link>
  );
}

export function BuildingsList() {
  const api = useApi<BuildingsResponse>('/api/budynki');
  const plan = useApi<PlanResponse>(`/api/plan?start=${activeMonday()}&days=7`);
  const [q, setQ] = useState('');

  const mine = useMemo(() => {
    const ids = new Map<string, Set<string>>();
    for (const e of plan.data?.events ?? []) {
      if (!e.buildingId) continue;
      ids.set(e.buildingId, (ids.get(e.buildingId) ?? new Set()).add(e.courseName));
    }
    return (api.data?.buildings ?? []).filter((b) => ids.has(b.id)).map((b) => ({ b, hint: [...ids.get(b.id)!].join(', ') }));
  }, [api.data, plan.data]);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    const list = api.data?.buildings ?? [];
    return n ? list.filter((b) => [b.name, b.address, b.campus].some((x) => x?.toLowerCase().includes(n))) : list;
  }, [api.data, q]);

  const byCampus = useMemo(() => {
    const m = new Map<string, Building[]>();
    for (const b of filtered) m.set(b.campus ?? 'Pozostałe', [...(m.get(b.campus ?? 'Pozostałe') ?? []), b]);
    return [...m.entries()].sort((a, b) => (a[0] === 'Pozostałe' ? 1 : b[0] === 'Pozostałe' ? -1 : a[0].localeCompare(b[0], 'pl')));
  }, [filtered]);

  return (
    <>
      <PageHead eyebrow="Gdzie co jest" title="Budynki" />
      <LoadError api={api} />
      <label className="searchbox">
        <Search />
        <span className="sr-only">Szukaj budynku</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Szukaj budynku, ulicy, kampusu" />
      </label>
      {!q && mine.length > 0 && (
        <section className="section">
          <h2 className="h2">Twoje budynki w tym tygodniu</h2>
          <div className="list">{mine.map(({ b, hint }) => <BuildingRow key={b.id} b={b} hint={hint} />)}</div>
        </section>
      )}
      {api.loading && !api.data ? (
        <Skeleton n={5} h={60} />
      ) : byCampus.length ? (
        byCampus.map(([campus, list]) => (
          <section className="section" key={campus}>
            <h2 className="h2">{campus}</h2>
            <div className="list">{list.map((b) => <BuildingRow key={b.id} b={b} />)}</div>
          </section>
        ))
      ) : (
        api.data && <Empty title="Nic nie znaleziono" />
      )}
    </>
  );
}

export function BuildingDetail({ id }: { id: string }) {
  const api = useApi<BuildingsResponse>('/api/budynki');
  const plan = useApi<PlanResponse>(`/api/plan?start=${activeMonday()}&days=7`);
  const apple = useIsApple();
  const b = api.data?.buildings.find((x) => x.id === id);
  const here = (plan.data?.events ?? []).filter((e) => e.buildingId === id);
  const d = 0.004;
  const embed =
    b && b.lat !== null && b.lng !== null
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${b.lng - d * 1.6},${b.lat - d},${b.lng + d * 1.6},${b.lat + d}&layer=mapnik&marker=${b.lat},${b.lng}`
      : null;
  const link = b ? mapsLink(b, apple) : null;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/budynki" className="icon-btn" aria-label="Wróć do budynków"><ChevronLeft size={20} /></Link>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <p className="eyebrow">{b?.campus ?? 'Budynek'}</p>
          <h1 className="title" style={{ fontSize: 28 }}>{b?.name ?? (api.loading ? '…' : 'Nieznany budynek')}</h1>
        </div>
      </div>
      <LoadError api={api} />
      {api.loading && !api.data ? (
        <Skeleton h={260} />
      ) : b ? (
        <>
          {embed ? <iframe className="map-frame" src={embed} title={`Mapa: ${b.name}`} loading="lazy" /> : <Empty title="Brak lokalizacji">USOS nie ma współrzędnych tego budynku.</Empty>}
          {b.photo && <img src={b.photo} alt={b.name} style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 'var(--radius)' }} />}
          <div className="card">
            <div className="kv"><span>Adres</span><span>{b.address ?? '—'}</span></div>
            {b.campus && <div className="kv"><span>Kampus</span><span>{b.campus}</span></div>}
          </div>
          {link && (
            <a href={link} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              <External size={18} /> Prowadź w {apple ? 'Mapach Apple' : 'Mapach Google'}
            </a>
          )}
          {here.length > 0 && (
            <section className="section">
              <h2 className="h2">Twoje zajęcia tutaj w tym tygodniu</h2>
              <div className="list">
                {here.map((e) => (
                  <div className="row" key={e.id}>
                    <div className="times num"><b>{shortWeekday(dayOf(e.start))}</b><span>{hhmm(e.start)}</span></div>
                    <div className="grow">
                      <span className="t1">{e.courseName}</span>
                      <span className="t2">{[e.classType, roomLabel(e.room)].filter(Boolean).join(' · ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <Empty title="Nie znaleziono budynku" />
      )}
    </>
  );
}

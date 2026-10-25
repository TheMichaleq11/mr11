'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useApi } from '@/lib/client';
import { addDays, dayOf, hhmm, longDate, shortDate, today } from '@/lib/dates';
import type { ClassEvent } from '@/lib/types';
import { ChevronLeft, ChevronRight, MapPin } from '../Icons';
import { courseHref, Empty, LoadError, Skeleton } from '../ui';

type RoomPlan = { events: ClassEvent[]; room: { number: string | null; capacity: number | null; buildingId: string | null; buildingName: string | null } | null };

/** Wolne okna między 8:00 a 20:00 w danym dniu. */
function freeSlots(day: string, events: ClassEvent[]): string[] {
  const evs = events.filter((e) => dayOf(e.start) === day).sort((a, b) => a.start.localeCompare(b.start));
  const out: string[] = [];
  let cur = '08:00';
  for (const e of evs) {
    const s = hhmm(e.start);
    if (s > cur && (Number(s.slice(0, 2)) * 60 + Number(s.slice(3))) - (Number(cur.slice(0, 2)) * 60 + Number(cur.slice(3))) >= 45) out.push(`${cur}–${s}`);
    if (hhmm(e.end) > cur) cur = hhmm(e.end);
  }
  if (cur < '19:15') out.push(`${cur}–20:00`);
  return out;
}

/** Tygodniowy plan sali albo prowadzącego. */
export function WeekActivities({ url, title, eyebrow, back, headerExtra }: { url: (start: string) => string; title: string; eyebrow: string; back?: { href: string; label: string }; headerExtra?: React.ReactNode }) {
  const [start, setStart] = useState(today());
  const api = useApi<RoomPlan>(url(start));
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const evs = api.data?.events ?? [];

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {back && <Link href={back.href} className="icon-btn" aria-label={back.label}><ChevronLeft size={20} /></Link>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flexGrow: 1 }}>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="title" style={{ fontSize: 28 }}>{title}</h1>
        </div>
      </div>
      {headerExtra}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button className="icon-btn" aria-label="Poprzedni tydzień" onClick={() => setStart(addDays(start, -7))}><ChevronLeft /></button>
        <span className="meta-line" style={{ flexGrow: 1, textAlign: 'center' }}>{shortDate(start)} – {shortDate(addDays(start, 6))}</span>
        <button className="icon-btn" aria-label="Następny tydzień" onClick={() => setStart(addDays(start, 7))}><ChevronRight /></button>
      </div>
      <LoadError api={api} />
      {api.loading && !api.data ? (
        <Skeleton n={3} h={80} />
      ) : (
        days.map((d) => {
          const list = evs.filter((e) => dayOf(e.start) === d);
          const weekend = [0, 6].includes(new Date(d + 'T12:00:00').getDay());
          if (weekend && !list.length) return null;
          return (
            <section className="section" key={d}>
              <h2 className="h2" style={{ fontSize: 16 }}>{longDate(d)}</h2>
              {list.length ? (
                <div className="list">
                  {list.map((e) => (
                    <Link key={e.id} href={courseHref(e.courseId)} className="row">
                      <div className="times num"><b>{hhmm(e.start)}</b><span>{hhmm(e.end)}</span></div>
                      <div className="grow">
                        <span className="t1">{e.courseName || 'Zajęcia'}</span>
                        <span className="t2">{[e.classType, e.room && `sala ${e.room}`, e.lecturers[0]].filter(Boolean).join(' · ')}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <span className="meta-line">Brak zajęć</span>
              )}
              {url(start).startsWith('/api/sale') && freeSlots(d, evs).length > 0 && (
                <span className="meta-line">Wolne: {freeSlots(d, evs).join(', ')}</span>
              )}
            </section>
          );
        })
      )}
      {api.data && !evs.length && <Empty title="Cały tydzień bez zajęć" />}
    </>
  );
}

export default function RoomView({ id }: { id: string }) {
  const info = useApi<RoomPlan>(`/api/sale/${encodeURIComponent(id)}?start=${today()}`);
  const room = info.data?.room;
  return (
    <WeekActivities
      url={(s) => `/api/sale/${encodeURIComponent(id)}?start=${s}`}
      eyebrow={room?.buildingName ?? 'Sala'}
      title={room?.number ? `Sala ${room.number}` : 'Plan sali'}
      headerExtra={
        room && (room.buildingId || room.capacity) ? (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {room.capacity && <span className="tag none">{room.capacity} miejsc</span>}
            {room.buildingId && (
              <Link href={`/budynki/${encodeURIComponent(room.buildingId)}`} className="btn btn-ghost btn-sm"><MapPin size={18} /> Budynek na mapie</Link>
            )}
          </div>
        ) : null
      }
    />
  );
}

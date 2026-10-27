'use client';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import EventDialog from './EventDialog';
import { gradeTone, typeColor } from '@/lib/colors';
import { addDays, dayNumber, dayOf, hhmm, shortWeekday, today } from '@/lib/dates';
import type { ClassEvent, CourseSummary, Grade } from '@/lib/types';
import { MapPin } from './Icons';

export const courseHref = (courseId: string | null, termId?: string | null) =>
  courseId ? `/przedmioty/${encodeURIComponent(courseId)}${termId ? `?term=${encodeURIComponent(termId)}` : ''}` : '/przedmioty';

export const roomLabel = (room: string | null) => (room ? (/^\d/.test(room) ? `sala ${room}` : room) : null);
export const where = (e: ClassEvent) => [roomLabel(e.room), e.building].filter(Boolean).join(' · ');

export function Skeleton({ h = 72, n = 1 }: { h?: number; n?: number }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="skeleton" style={{ minHeight: h }} aria-hidden="true" />
      ))}
    </>
  );
}

/** Prośba o ponowne zalogowanie, gdy token nie ma zgody na nową sekcję. */
export function ScopeBox() {
  return (
    <div className="notice warn" role="alert">
      <span>
        Ta sekcja jest nowa i potrzebuje Twojej zgody w USOS. Zaloguj się jeszcze raz — USOS pokaże listę uprawnień do zatwierdzenia.
      </span>
      <a href="/api/auth/login" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start', textDecoration: 'none' }}>
        Zaloguj ponownie przez USOS
      </a>
    </div>
  );
}

/** Błąd ładowania z obsługą braku zgody. */
export function LoadError({ api }: { api: { error: string | null; errorCode: string | null; reload: () => void } }) {
  if (!api.error) return null;
  if (api.errorCode === 'scope') return <ScopeBox />;
  return <ErrorBox message={api.error} onRetry={api.reload} />;
}

export function PageHead({ eyebrow, title, children }: { eyebrow?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <header className="page-head">
      <div className="titles">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="title">{title}</h1>
      </div>
      {children}
    </header>
  );
}

/** "2026-10-26 10:00:00" → "26.10.2026" (+ godzina, jeśli inna niż północ) */
export function fmtDate(v: string | null, withTime = false): string {
  if (!v) return '';
  const d = v.slice(0, 10).split('-');
  const date = d.length === 3 ? `${d[2]}.${d[1]}.${d[0]}` : v;
  const t = v.slice(11, 16);
  return withTime && t && t !== '00:00' ? `${date}, ${t}` : date;
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error" role="alert">
      <span>Nie udało się pobrać danych z USOS. {message}</span>
      {onRetry && (
        <button className="btn btn-ghost" style={{ minHeight: 40 }} onClick={onRetry}>
          Spróbuj ponownie
        </button>
      )}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <b>{title}</b>
      {children && <span>{children}</span>}
    </div>
  );
}

export function bestGrade(c: CourseSummary): Grade | null {
  return c.finalGrades[c.finalGrades.length - 1] ?? c.unitGrades[c.unitGrades.length - 1] ?? null;
}

export function GradeChip({ grade }: { grade: Grade | null }) {
  if (!grade) return <span className="chip none" aria-label="Brak oceny">—</span>;
  return <span className={`chip ${gradeTone(grade.numeric, grade.passes)}`}>{grade.value}</span>;
}

export function EventRow({ e }: { e: ClassEvent }) {
  return (
    <Link href={courseHref(e.courseId)} className="row">
      <div className="times num">
        <b>{hhmm(e.start)}</b>
        <span>{hhmm(e.end)}</span>
      </div>
      <span className="dot" style={{ background: e.kind === 'exam' ? 'var(--warn)' : typeColor(e.classType) }} />
      <div className="grow">
        <span className="t1">{e.courseName}</span>
        <span className="t2">{[e.classType, roomLabel(e.room)].filter(Boolean).join(' · ')}</span>
      </div>
    </Link>
  );
}

export function EventCard({ e }: { e: ClassEvent }) {
  return (
    <div className="event-card" style={{ alignItems: 'flex-start' }}>
      <Link href={courseHref(e.courseId)} style={{ display: 'flex', gap: 14, flexGrow: 1, minWidth: 0, color: 'inherit' }}>
        <div className="times num">
          <b>{hhmm(e.start)}</b>
          <span>{hhmm(e.end)}</span>
        </div>
        <div className="body">
          <div className="kind">
            <span className="dot" style={{ background: e.kind === 'exam' ? 'var(--warn)' : typeColor(e.classType) }} />
            {e.classType ?? 'Zajęcia'}
            {e.group ? ` · gr. ${e.group}` : ''}
          </div>
          <span className="nm">{e.courseName}</span>
          <span className="wh">{[where(e), e.lecturers.join(', ')].filter(Boolean).join(' · ')}</span>
        </div>
      </Link>
      {(e.roomId || e.buildingId) && (
        <Link
          href={e.roomId ? `/sale/${encodeURIComponent(e.roomId)}` : `/budynki/${encodeURIComponent(e.buildingId!)}`}
          className="icon-btn"
          style={{ background: 'var(--surface-2)' }}
          aria-label={e.roomId ? `Sala ${e.room ?? ''}: plan i mapa` : `Pokaż budynek: ${e.building ?? 'na mapie'}`}
        >
          <MapPin size={20} />
        </Link>
      )}
    </div>
  );
}

/** Minuty od północy z godziny zajęć („08:15” → 495). */
const mins = (iso: string) => {
  const [h, m] = hhmm(iso).split(':').map(Number);
  return h * 60 + m;
};

/** Rozkład zajęć jednego dnia na kolumny, gdy nachodzą na siebie. */
function lanes(evs: ClassEvent[]) {
  const sorted = [...evs].sort((a, b) => mins(a.start) - mins(b.start));
  const out = new Map<string, { lane: number; of: number }>();
  let group: ClassEvent[] = [];
  let groupEnd = -1;
  const flush = () => {
    const ends: number[] = [];
    const assigned: [ClassEvent, number][] = [];
    for (const e of group) {
      let l = ends.findIndex((end) => end <= mins(e.start));
      if (l === -1) l = ends.length;
      ends[l] = mins(e.end);
      assigned.push([e, l]);
    }
    for (const [e, l] of assigned) out.set(e.id, { lane: l, of: ends.length });
    group = [];
  };
  for (const e of sorted) {
    if (group.length && mins(e.start) >= groupEnd) flush();
    group.push(e);
    groupEnd = Math.max(groupEnd, mins(e.end));
  }
  if (group.length) flush();
  return out;
}

/** Plan na osi godzin: każde zajęcia stoją na wysokości swojej godziny i mają długość swojego czasu trwania. */
export function TimeGrid({ days, events, pph = 56, showHead = true, details = false }: { days: string[]; events: ClassEvent[]; pph?: number; showHead?: boolean; details?: boolean }) {
  const t = today();
  const list = events.filter((e) => days.includes(dayOf(e.start)));
  const from = Math.min(8, ...list.map((e) => Math.floor(mins(e.start) / 60)));
  const to = Math.max(from + 6, ...list.map((e) => Math.ceil(mins(e.end) / 60)));
  const hours = Array.from({ length: to - from }, (_, i) => from + i);
  const height = (to - from) * pph;
  const y = (m: number) => ((m - from * 60) / 60) * pph;
 const now = new Date();
  const nowM = now.getHours() * 60 + now.getMinutes();
  const [open, setOpen] = useState<ClassEvent | null>(null);
  return (
    <div className="tg" style={{ '--pph': `${pph}px` } as React.CSSProperties}>
      <div className="tg-grid" style={{ gridTemplateColumns: `40px repeat(${days.length}, minmax(0, 1fr))` }}>
        {showHead && (
          <>
            <span />
            {days.map((d) => (
              <div key={d} className={`week-head${d === t ? ' is-today' : ''}`}>
                <span>{shortWeekday(d)}</span>
                <span className="num">{dayNumber(d)}</span>
              </div>
            ))}
          </>
        )}
        <div className="tg-axis" style={{ height }}>
          {hours.map((h) => (
            <span key={h} className="num" style={{ top: y(h * 60) }}>{String(h).padStart(2, '0')}:00</span>
          ))}
        </div>
        {days.map((d) => {
          const evs = list.filter((e) => dayOf(e.start) === d);
          const lay = lanes(evs);
          return (
            <div key={d} className={`tg-day${d === t ? ' is-today' : ''}`} style={{ height }}>
              {hours.map((h) => (
                <span key={h} className="tg-line" style={{ top: y(h * 60) }} />
              ))}
              {d === t && nowM > from * 60 && nowM < to * 60 && <span className="tg-now" style={{ top: y(nowM) }} />}
              {evs.length === 0 && <div className="tg-free">Wolne</div>}
              {evs.map((e) => {
                const tc = e.kind === 'exam' ? 'var(--warn)' : typeColor(e.classType);
                const l = lay.get(e.id) ?? { lane: 0, of: 1 };
                const top = y(mins(e.start));
                const h = Math.max(y(mins(e.end)) - top, 26);
                return (
                  <button
                    type="button"
                    key={e.id}
                    onClick={() => setOpen(e)}
                    className={`slot tg-slot${e.kind === 'exam' ? ' exam' : ''}${h < 52 ? ' short' : ''}`}
                    style={{ '--c': tc, top, height: h - 3, left: `calc(${(l.lane / l.of) * 100}% + 2px)`, width: `calc(${100 / l.of}% - 4px)` } as React.CSSProperties}
                  >
                    <span className="s1 num">
                      {hhmm(e.start)}–{hhmm(e.end)} · {e.classType ?? 'Zajęcia'}
                    </span>
                    <span className="s2">{e.courseName}</span>
                    {details && where(e) && <span className="s3">{where(e)}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
      {open && <EventDialog e={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

/** Siatka tygodnia (pon–pt, plus weekend jeśli są zajęcia) — na osi godzin. */
export function WeekGrid({ monday, events, pph }: { monday: string; events: ClassEvent[]; pph?: number }) {
  const all = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const days = all.filter((d, i) => i < 5 || events.some((e) => dayOf(e.start) === d));
  return (
    <div className="week-scroll">
      <div style={{ minWidth: 600 }}>
        <TimeGrid days={days} events={events} pph={pph} />
      </div>
      <TypeLegend types={events.filter((e) => e.kind !== 'exam').map((e) => e.classType)} />
    </div>
  );
}

/** Legenda kolorów typów zajęć, które występują na planie. */
export function TypeLegend({ types }: { types: (string | null)[] }) {
  const uniq = [...new Set(types.map((t) => t ?? 'Zajęcia'))];
  if (uniq.length < 2) return null;
  return (
    <div className="type-legend">
      {uniq.map((t) => (
        <span key={t}>
          <i style={{ background: typeColor(t) }} />
          {t}
        </span>
      ))}
    </div>
  );
}

/** Kropki w kolorach typów zajęć przedmiotu (np. wykład + ćwiczenia = dwie kropki). */
export function TypeDots({ types }: { types: string[] }) {
  const list = types.length ? types : [null];
  return (
    <span className="type-dots" aria-hidden="true">
      {list.map((t, i) => (
        <span key={i} className="dot" style={{ background: typeColor(t) }} />
      ))}
    </span>
  );
}

export function CourseGradeRow({ c }: { c: CourseSummary }) {
  const g = bestGrade(c);
  const sub = g ? g.label : c.classTypes.join(', ') || 'Brak ocen';
  return (
    <Link href={courseHref(c.courseId, c.termId)} className="row">
      <TypeDots types={c.classTypes} />
      <div className="grow">
        <span className="t1">{c.name}</span>
        <span className="t2">{g ? sub : `Brak ocen · ${sub}`}</span>
      </div>
      <GradeChip grade={g} />
    </Link>
  );
}

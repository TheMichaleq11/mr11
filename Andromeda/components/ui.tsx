'use client';
import Link from 'next/link';
import type { ReactNode } from 'react';
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

/** Siatka tygodnia (pon–pt, plus weekend jeśli są zajęcia). */
export function WeekGrid({ monday, events }: { monday: string; events: ClassEvent[] }) {
  const t = today();
  const all = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const days = all.filter((d, i) => i < 5 || events.some((e) => dayOf(e.start) === d));
  return (
    <div className="week-scroll">
      <div className="week" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
        {days.map((d) => {
          const evs = events.filter((e) => dayOf(e.start) === d);
          return (
            <div className="week-day" key={d}>
              <div className={`week-head${d === t ? ' is-today' : ''}`}>
                <span>{shortWeekday(d)}</span>
                <span className="num">{dayNumber(d)}</span>
              </div>
              {evs.length === 0 && <div className="free">Wolne</div>}
              {evs.map((e) => {
                const tc = e.kind === 'exam' ? 'var(--warn)' : typeColor(e.classType);
                return (
                  <Link
                    key={e.id}
                    href={courseHref(e.courseId)}
                    className={`slot${e.kind === 'exam' ? ' exam' : ''}`}
                    style={{ '--c': tc } as React.CSSProperties}
                  >
                    <span className="s1 num">
                      {hhmm(e.start)} · {e.classType ?? 'Zajęcia'}
                    </span>
                    <span className="s2">{e.courseName}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
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

'use client';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { courseColor, gradeTone } from '@/lib/colors';
import { addDays, dayNumber, dayOf, hhmm, shortWeekday, today } from '@/lib/dates';
import type { ClassEvent, CourseSummary, Grade } from '@/lib/types';

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
  const c = courseColor(e.courseId ?? e.courseName);
  return (
    <Link href={courseHref(e.courseId)} className="row">
      <div className="times num">
        <b>{hhmm(e.start)}</b>
        <span>{hhmm(e.end)}</span>
      </div>
      <span className="dot" style={{ background: c.dot }} />
      <div className="grow">
        <span className="t1">{e.courseName}</span>
        <span className="t2">{[e.classType, roomLabel(e.room)].filter(Boolean).join(' · ')}</span>
      </div>
    </Link>
  );
}

export function EventCard({ e }: { e: ClassEvent }) {
  const c = courseColor(e.courseId ?? e.courseName);
  return (
    <Link href={courseHref(e.courseId)} className="event-card">
      <div className="times num">
        <b>{hhmm(e.start)}</b>
        <span>{hhmm(e.end)}</span>
      </div>
      <div className="body">
        <div className="kind">
          <span className="dot" style={{ background: e.kind === 'exam' ? '#E0782B' : c.dot }} />
          {e.classType ?? 'Zajęcia'}
          {e.group ? ` · gr. ${e.group}` : ''}
        </div>
        <span className="nm">{e.courseName}</span>
        <span className="wh">{[where(e), e.lecturers.join(', ')].filter(Boolean).join(' · ')}</span>
      </div>
    </Link>
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
                const c = courseColor(e.courseId ?? e.courseName);
                return (
                  <Link
                    key={e.id}
                    href={courseHref(e.courseId)}
                    className={`slot${e.kind === 'exam' ? ' exam' : ''}`}
                    style={{ background: c.bg }}
                  >
                    <span className="s1 num" style={{ color: c.ink }}>
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
    </div>
  );
}

export function CourseGradeRow({ c }: { c: CourseSummary }) {
  const col = courseColor(c.courseId);
  const g = bestGrade(c);
  const sub = g ? g.label : c.classTypes.join(', ') || 'Brak ocen';
  return (
    <Link href={courseHref(c.courseId, c.termId)} className="row">
      <span className="dot" style={{ background: col.dot }} />
      <div className="grow">
        <span className="t1">{c.name}</span>
        <span className="t2">{g ? sub : `Brak ocen · ${sub}`}</span>
      </div>
      <GradeChip grade={g} />
    </Link>
  );
}

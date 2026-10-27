'use client';
import Link from 'next/link';
import { useApi, useNow } from '@/lib/client';
import { activeMonday, dayOf, hhmm, isoDay, longDate, mondayOf, relativeDay, shortDate, shortWeekday, toDate } from '@/lib/dates';
import type { ClassEvent, GradesResponse, PlanResponse } from '@/lib/types';
import { useMe } from '../Shell';
import { Pin, User } from '../Icons';
import { CourseGradeRow, courseHref, Empty, ErrorBox, EventRow, Skeleton, WeekGrid, where } from '../ui';
import CountUp from '../CountUp';

function heroLabel(e: ClassEvent, now: Date): string {
  const start = toDate(e.start);
  const end = toDate(e.end);
  if (start <= now && now < end) return 'Teraz';
  const mins = Math.round((start.getTime() - now.getTime()) / 60000);
  const day = dayOf(e.start);
  if (day === isoDay(now)) {
    if (mins < 60) return `Za ${mins} min`;
    return `Dziś o ${hhmm(e.start)}`;
  }
  const rel = relativeDay(day, isoDay(now));
  return rel === 'jutro' ? `Jutro o ${hhmm(e.start)}` : `${shortWeekday(day)} ${shortDate(day)} · ${hhmm(e.start)}`;
}

export default function TodayView() {
  const me = useMe();
  const now = useNow();
  const todayIso = isoDay(now);
  const monday = activeMonday(todayIso);
  const isNextWeek = monday !== mondayOf(todayIso);

  const upcoming = useApi<PlanResponse>(`/api/plan?start=${todayIso}&days=7`);
  const week = useApi<PlanResponse>(`/api/plan?start=${monday}&days=7`);
  const grades = useApi<GradesResponse>('/api/grades');

  const events = upcoming.data?.events ?? [];
  const future = events.filter((e) => toDate(e.end) > now);
  const hero = future.find((e) => e.kind !== 'meeting') ?? null;
  const restToday = future.filter((e) => e !== hero && dayOf(e.start) === todayIso);
  const exam = events.find((e) => e.kind === 'exam' && toDate(e.start) > now) ?? null;

  return (
    <>
      <header className="page-head">
        <div className="titles">
          <div className="mini-brand mobile-only">
            <img src="/logo-znak.svg" alt="" width={30} height={21} className="mini-brand-mark" />
            <span>Andromeda</span>
          </div>
          <p className="eyebrow">{longDate(todayIso)}</p>
          <h1 className="title">Cześć{me?.firstName ? `, ${me.firstName}` : ''}</h1>
        </div>
        {me?.demo && (
          <Link href="/zaloguj" className="demo-badge">
            Tryb demo — zaloguj się do USOS
          </Link>
        )}
      </header>

      {upcoming.error && <ErrorBox message={upcoming.error} onRetry={upcoming.reload} />}

      <section className="band" aria-label="Najbliższe zajęcia i podsumowanie">
        <div className="band-main">
          {upcoming.loading && !upcoming.data ? (
            <div style={{ minHeight: 120 }} aria-busy="true" />
          ) : hero ? (
            <>
              <div className="top">
                <span className="when">{heroLabel(hero, now)}</span>
                <span className={`pill${hero.kind === 'exam' ? ' pill-exam' : ''}`}>{hero.classType ?? 'Zajęcia'}</span>
              </div>
              <Link href={courseHref(hero.courseId)} className="name">
                {hero.courseName}
              </Link>
              <div className="meta">
                <span className="num">
                  {hhmm(hero.start)} – {hhmm(hero.end)}
                </span>
                {where(hero) && (
                  <span className="meta-i">
                    <Pin /> {where(hero)}
                  </span>
                )}
                {hero.lecturers.length > 0 && (
                  <span className="meta-i">
                    <User /> {hero.lecturers.join(', ')}
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              <span className="when">Najbliższe 7 dni</span>
              <span className="name">Brak zajęć</span>
              <span className="meta">W planie nic nie ma.</span>
            </>
          )}
        </div>

        <div className="band-stats">
          <Link href="/oceny" className="stat">
            <span className="lab">Średnia</span>
            <span className="val num">
              <CountUp value={grades.data?.average ?? null} />
            </span>
            <span className="sub">
              {grades.data
                ? grades.data.gradedCount
                  ? `z ${grades.data.gradedCount} ${grades.data.gradedCount === 1 ? 'oceny' : 'ocen'}`
                  : 'jeszcze brak ocen'
                : 'wczytywanie…'}
            </span>
          </Link>
          <Link href="/egzaminy" className={`stat${exam ? ' stat-warn' : ''}`}>
            <span className="lab">Najbliższy egzamin</span>
            {exam ? (
              <>
                <span className="val-sm">{exam.courseName}</span>
                <span className="sub num">
                  {shortDate(dayOf(exam.start))} · {hhmm(exam.start)} · {relativeDay(dayOf(exam.start), todayIso)}
                </span>
              </>
            ) : (
              <>
                <span className="val-sm">Brak w tym tygodniu</span>
                <span className="sub">Sprawdzamy 7 dni do przodu</span>
              </>
            )}
          </Link>
        </div>
      </section>

      <section className="section mobile-only">
        <div className="section-head">
          <h2 className="h2">Dalej dziś</h2>
          <Link href="/plan" className="link-sm">Cały plan</Link>
        </div>
        {upcoming.loading && !upcoming.data ? (
          <Skeleton n={2} />
        ) : restToday.length ? (
          <div className="list">
            {restToday.map((e) => (
              <EventRow key={e.id} e={e} />
            ))}
          </div>
        ) : (
          <Empty title="To wszystko na dziś" />
        )}
      </section>

      <div className="two-col desktop-only">
        <section className="wide section plain">
          <div className="section-head ruled">
            <h2 className="h2">{isNextWeek ? 'Nadchodzący tydzień' : 'Ten tydzień'}</h2>
            <Link href="/plan" className="link-sm">Cały plan</Link>
          </div>
          {week.data ? <WeekGrid monday={monday} events={week.data.events} pph={44} /> : <Skeleton h={220} />}
        </section>
        <section className="narrow section plain">
          <div className="section-head ruled">
            <h2 className="h2">Oceny</h2>
            <Link href="/oceny" className="link-sm">Wszystkie</Link>
          </div>
          {grades.data ? (
            <div className="ledger">{grades.data.courses.slice(0, 6).map((c) => <CourseGradeRow key={c.courseId} c={c} />)}</div>
          ) : (
            <Skeleton n={3} h={52} />
          )}
        </section>
      </div>
    </>
  );
}

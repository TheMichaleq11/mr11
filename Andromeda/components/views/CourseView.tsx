'use client';
import Link from 'next/link';
import { useApi } from '@/lib/client';
import { courseColor } from '@/lib/colors';
import { activeMonday, dayOf, hhmm, shortWeekday } from '@/lib/dates';
import type { GradesResponse, PlanResponse } from '@/lib/types';
import type { TestsResponse } from '@/lib/types-more';
import { ChevronLeft, ChevronRight, External } from '../Icons';
import { Empty, ErrorBox, GradeChip, roomLabel, Skeleton } from '../ui';

export default function CourseView({ courseId, termId }: { courseId: string; termId: string | null }) {
  const grades = useApi<GradesResponse>(`/api/grades${termId ? `?term=${encodeURIComponent(termId)}` : ''}`);
  const plan = useApi<PlanResponse>(`/api/plan?start=${activeMonday()}&days=7`);

  const course = grades.data?.courses.find((c) => c.courseId === courseId);
  const fromPlan = plan.data?.events.filter((e) => e.courseId === courseId) ?? [];
  const name = course?.name ?? fromPlan[0]?.courseName ?? courseId;
  const col = courseColor(courseId);
  const lecturers = course?.lecturers.length ? course.lecturers : [...new Set(fromPlan.flatMap((e) => e.lecturers))];
  const allGrades = [...(course?.finalGrades ?? []), ...(course?.unitGrades ?? [])];
  const isDemo = courseId.startsWith('DEMO-');
  const tests = useApi<TestsResponse>('/api/sprawdziany');
  const test = tests.data?.tests.find((t) => t.courseId === courseId);
  const usosweb = `https://www.usosweb.uj.edu.pl/kontroler.php?_action=katalog2/przedmioty/pokazPrzedmiot&prz_kod=${encodeURIComponent(courseId)}`;

  return (
    <>
      <section className="course-hero" style={{ background: col.dot }}>
        <Link href="/przedmioty" className="back" aria-label="Wróć do przedmiotów">
          <ChevronLeft size={20} />
        </Link>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="lab">{[course?.classTypes.join(' · '), isDemo ? null : courseId].filter(Boolean).join(' · ')}</span>
          <h1>{name}</h1>
        </div>
        {fromPlan.length > 0 && (
          <div className="glass-grid">
            {fromPlan.map((e) => (
              <div className="glass" key={e.id}>
                <span>
                  {e.classType ?? 'Zajęcia'}
                  {e.group ? ` · gr. ${e.group}` : ''}
                </span>
                <span className="num">
                  {shortWeekday(dayOf(e.start))} {hhmm(e.start)}
                  {e.room ? ` · ${roomLabel(e.room)}` : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {grades.error && <ErrorBox message={grades.error} onRetry={grades.reload} />}

      <section className="section">
        <h2 className="h2">Oceny</h2>
        {grades.loading && !grades.data ? (
          <Skeleton n={2} h={52} />
        ) : allGrades.length ? (
          <div className="list">
            {allGrades.map((g, i) => (
              <div className="row" key={i}>
                <div className="grow">
                  <span className="t1">{g.label}</span>
                  <span className="t2">
                    {[g.session ? `termin ${g.session}` : null, g.date ? g.date.slice(0, 10) : null, g.countsIntoAverage ? null : 'nie wchodzi do średniej']
                      .filter(Boolean)
                      .join(' · ') || 'ocena w USOS'}
                  </span>
                </div>
                <GradeChip grade={g} />
              </div>
            ))}
          </div>
        ) : (
          <Empty title="Jeszcze bez ocen">Pojawią się tu, gdy prowadzący wpisze je do USOS.</Empty>
        )}
      </section>

      {lecturers.length > 0 && (
        <section className="section">
          <h2 className="h2">Prowadzący</h2>
          <div className="list">
            {lecturers.map((l) => (
              <div className="row" key={l}>
                <span className="avatar" style={{ background: col.bg, color: col.ink }}>
                  {l.replace(/^(prof\.|dr hab\.|dr|mgr|inż\.)\s*/g, '').charAt(0)}
                </span>
                <div className="grow">
                  <span className="t1">{l}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {test && (
        <Link href={`/sprawdziany/${encodeURIComponent(test.rootId)}`} className="card row" style={{ padding: '14px 16px' }}>
          <div className="grow">
            <span className="t1">Punkty ze sprawdzianów</span>
            <span className="t2">{test.name}</span>
          </div>
          <span style={{ color: 'var(--muted)' }}><ChevronRight /></span>
        </Link>
      )}

      {!isDemo && (
        <a href={usosweb} target="_blank" rel="noopener noreferrer" className="card row" style={{ padding: '14px 16px' }}>
          <span style={{ color: 'var(--accent)' }}><External /></span>
          <div className="grow">
            <span className="t1">Sylabus i opis w USOSweb</span>
          </div>
          <span style={{ color: 'var(--muted)' }}><ChevronRight /></span>
        </a>
      )}
    </>
  );
}

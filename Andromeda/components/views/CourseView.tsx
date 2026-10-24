'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useApi } from '@/lib/client';
import { courseColor } from '@/lib/colors';
import { activeMonday, dayOf, hhmm, shortWeekday } from '@/lib/dates';
import type { GradesResponse, PlanResponse } from '@/lib/types';
import type { TestsResponse } from '@/lib/types-more';
import type { PersonRef, SylSection, SyllabusResponse } from '@/lib/usos-courses';
import { ChevronLeft, ChevronRight, External } from '../Icons';
import { Empty, GradeChip, LoadError, roomLabel, Skeleton } from '../ui';

const passing: Record<string, [string, string]> = {
  passed: ['Zaliczony', 'good'],
  failed: ['Niezaliczony', 'bad'],
  not_yet_passed: ['W trakcie', 'none'],
};

function initial(name: string) {
  return name.replace(/^((prof\.|dr|hab\.|mgr|inż\.|lic\.)\s*)+/g, '').charAt(0) || '·';
}

function People({ people, color }: { people: (PersonRef & { role?: string })[]; color: { bg: string; ink: string } }) {
  return (
    <div className="list">
      {people.map((p, i) => {
        const inner = (
          <>
            <span className="avatar" style={{ background: color.bg, color: color.ink }}>{initial(p.name)}</span>
            <div className="grow">
              <span className="t1">{p.name}</span>
              {p.role && <span className="t2">{p.role}</span>}
            </div>
            {p.id && <span style={{ color: 'var(--muted)' }}><ChevronRight /></span>}
          </>
        );
        return p.id ? (
          <Link key={p.id + i} href={`/osoby/${encodeURIComponent(p.id)}`} className="row">{inner}</Link>
        ) : (
          <div key={p.name + i} className="row">{inner}</div>
        );
      })}
    </div>
  );
}

function Sections({ sections, openFirst }: { sections: SylSection[]; openFirst?: boolean }) {
  return (
    <>
      {sections.map((s, i) => (
        <details key={s.title + i} className="card syl" open={openFirst && i === 0}>
          <summary>{s.title}</summary>
          <div className="html" dangerouslySetInnerHTML={{ __html: s.html }} />
        </details>
      ))}
    </>
  );
}

export default function CourseView({ courseId, termId }: { courseId: string; termId: string | null }) {
  const grades = useApi<GradesResponse>(`/api/grades${termId ? `?term=${encodeURIComponent(termId)}` : ''}`);
  const plan = useApi<PlanResponse>(`/api/plan?start=${activeMonday()}&days=7`);
  const syl = useApi<SyllabusResponse>(`/api/sylabus/${encodeURIComponent(courseId)}${termId ? `?term=${encodeURIComponent(termId)}` : ''}`);
  const tests = useApi<TestsResponse>('/api/sprawdziany');

  const course = grades.data?.courses.find((c) => c.courseId === courseId);
  const mine = Boolean(course) || (plan.data?.events.some((e) => e.courseId === courseId) ?? false);
  const [tab, setTab] = useState<'info' | 'syllabus' | null>(null);
  const activeTab = tab ?? (grades.data && plan.data && !mine ? 'syllabus' : 'info');

  const s = syl.data;
  const fromPlan = plan.data?.events.filter((e) => e.courseId === courseId) ?? [];
  const name = s?.name ?? course?.name ?? fromPlan[0]?.courseName ?? courseId;
  const col = courseColor(courseId);
  const allGrades = [...(course?.finalGrades ?? []), ...(course?.unitGrades ?? [])];
  const test = tests.data?.tests.find((t) => t.courseId === courseId);
  const isDemo = courseId.startsWith('DEMO-');
  const usosweb =
    s?.profileUrl ?? `https://www.usosweb.uj.edu.pl/kontroler.php?_action=katalog2/przedmioty/pokazPrzedmiot&prz_kod=${encodeURIComponent(courseId)}`;

  // Prowadzący: koordynatorzy + prowadzący z sylabusa, a gdy go brak — z ocen/planu.
  const people: (PersonRef & { role?: string })[] = [];
  const seen = new Set<string>();
  const add = (p: PersonRef, role: string) => {
    const k = p.id ?? p.name;
    if (seen.has(k)) return;
    seen.add(k);
    people.push({ ...p, role });
  };
  s?.coordinators.forEach((p) => add(p, 'Koordynator'));
  s?.groups.forEach((g) => g.lecturers.forEach((p) => add(p, `${g.classType}, Twoja grupa ${g.number}`)));
  s?.lecturers.forEach((p) => add(p, 'Prowadzący'));
  if (!people.length) {
    (course?.lecturers ?? []).forEach((n) => add({ id: null, name: n }, 'Prowadzący'));
    fromPlan.flatMap((e) => e.lecturers).forEach((n) => add({ id: null, name: n }, 'Prowadzący'));
  }

  const pass = s?.passing ? passing[s.passing] : null;

  return (
    <>
      <section className="course-hero" style={{ background: col.dot }}>
        <Link href="/przedmioty" className="back" aria-label="Wróć do przedmiotów">
          <ChevronLeft size={20} />
        </Link>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="lab">
            {[s?.ects != null ? `${String(s.ects).replace('.', ',')} ECTS` : null, s?.language, isDemo ? null : courseId].filter(Boolean).join(' · ')}
          </span>
          <h1>{name}</h1>
          {s?.faculty && <span className="lab">{s.faculty}</span>}
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

      <div className="seg" role="tablist" aria-label="Widok przedmiotu" style={{ alignSelf: 'flex-start' }}>
        <button role="tab" aria-pressed={activeTab === 'info'} aria-selected={activeTab === 'info'} onClick={() => setTab('info')}>
          Przegląd
        </button>
        <button role="tab" aria-pressed={activeTab === 'syllabus'} aria-selected={activeTab === 'syllabus'} onClick={() => setTab('syllabus')}>
          Sylabus
        </button>
      </div>

      {activeTab === 'info' ? (
        <>
          <section className="section">
            <div className="section-head">
              <h2 className="h2">Oceny</h2>
              {pass && <span className={`tag ${pass[1]}`}>{pass[0]}</span>}
            </div>
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

          {test && (
            <Link href={`/sprawdziany/${encodeURIComponent(test.rootId)}`} className="card row" style={{ padding: '14px 16px' }}>
              <div className="grow">
                <span className="t1">Punkty ze sprawdzianów</span>
                <span className="t2">{test.name}</span>
              </div>
              <span style={{ color: 'var(--muted)' }}><ChevronRight /></span>
            </Link>
          )}

          {people.length > 0 && (
            <section className="section">
              <h2 className="h2">Prowadzący</h2>
              <People people={people} color={col} />
            </section>
          )}

          {s && s.groups.some((g) => g.sections.length) && (
            <section className="section">
              <h2 className="h2">Twoje grupy</h2>
              {s.groups
                .filter((g) => g.sections.length)
                .map((g) => (
                  <Sections key={g.classType + g.number} sections={g.sections.map((x) => ({ ...x, title: `${g.classType}, gr. ${g.number} — ${x.title.toLowerCase()}` }))} />
                ))}
            </section>
          )}

          <button className="card row" style={{ padding: '14px 16px', border: 'none', textAlign: 'left', fontFamily: 'inherit', width: '100%' }} onClick={() => setTab('syllabus')}>
            <div className="grow">
              <span className="t1">Sylabus</span>
              <span className="t2">Opis, efekty uczenia się, zaliczenie, literatura</span>
            </div>
            <span style={{ color: 'var(--muted)' }}><ChevronRight /></span>
          </button>
        </>
      ) : (
        <>
          <LoadError api={syl} />
          {syl.loading && !s ? (
            <Skeleton n={4} h={64} />
          ) : s ? (
            <>
              {s.sections.length ? (
                <section className="section">
                  <Sections sections={s.sections} openFirst />
                </section>
              ) : (
                <Empty title="Brak sylabusa w USOS">Ten przedmiot nie ma uzupełnionego opisu.</Empty>
              )}

              {s.units.filter((u) => u.sections.length).map((u) => (
                <section className="section" key={u.id}>
                  <h2 className="h2">{u.classType}</h2>
                  <Sections sections={u.sections} />
                </section>
              ))}

              {s.attributes.length > 0 && (
                <section className="section">
                  <h2 className="h2">Informacje</h2>
                  <div className="card" style={{ padding: '4px 16px' }}>
                    {s.attributes.map((a) => (
                      <div className="kv" key={a.name}>
                        <span>{a.name}</span>
                        <span>{a.values.join(', ')}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {people.length > 0 && (
                <section className="section">
                  <h2 className="h2">Prowadzący</h2>
                  <People people={people} color={col} />
                </section>
              )}

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {s.homepage && (
                  <a href={s.homepage} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                    <External size={18} /> Strona przedmiotu
                  </a>
                )}
                {!isDemo && (
                  <a href={usosweb} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                    <External size={18} /> W USOSweb
                  </a>
                )}
              </div>
            </>
          ) : null}
        </>
      )}
    </>
  );
}

'use client';
import { useState } from 'react';
import { useApi } from '@/lib/client';
import type { GradesResponse } from '@/lib/types';
import { CourseGradeRow, Empty, ErrorBox, Skeleton } from '../ui';
import { LatestGrades } from './ExtraSections';
import CountUp from '../CountUp';

export default function GradesView() {
  const [term, setTerm] = useState<string | null>(null);
  const { data, error, loading, reload } = useApi<GradesResponse>(`/api/grades${term ? `?term=${encodeURIComponent(term)}` : ''}`);
  const graded = data?.courses.filter((c) => c.finalGrades.length || c.unitGrades.length).length ?? 0;
  const hasFinals = data?.courses.some((c) => c.finalGrades.length) ?? false;

  return (
    <>
      <header className="page-head">
        <h1 className="title">Oceny</h1>
        {data && data.terms.length > 0 && (
          <label>
            <span className="sr-only">Semestr</span>
            <select className="select" value={data.currentTermId ?? ''} onChange={(e) => setTerm(e.target.value)}>
              {data.terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </header>

      {error && <ErrorBox message={error} onRetry={reload} />}

      {loading && !data ? (
        <Skeleton h={150} />
      ) : data ? (
        <section className="summary">
          <div className="row2">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span className="lab">{hasFinals ? 'Średnia z ocen końcowych' : 'Średnia z ocen cząstkowych'}</span>
              <span className="avg num"><CountUp value={data.average} /></span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
              <span className="lab">Przedmioty z oceną</span>
              <span className="num" style={{ fontSize: 22, fontWeight: 600 }}>
                {graded} / {data.courses.length}
              </span>
            </div>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${data.courses.length ? Math.round((graded / data.courses.length) * 100) : 0}%`,
                height: 8,
                borderRadius: 4,
                background: 'var(--hero-accent)',
              }}
            />
          </div>
          <span className="note">
            {hasFinals ? 'Liczone tylko z ocen, które wchodzą do średniej.' : 'Oceny końcowe pojawią się po sesji.'}
          </span>
        </section>
      ) : null}

      <LatestGrades />

      <section className="section">
        <h2 className="h2">Przedmioty</h2>
        {loading && !data ? (
          <Skeleton n={4} h={56} />
        ) : data && data.courses.length ? (
          <div className="list">
            {data.courses.map((c) => (
              <CourseGradeRow key={c.courseId} c={c} />
            ))}
          </div>
        ) : (
          data && <Empty title="Brak przedmiotów">USOS nie zwrócił przedmiotów dla tego semestru.</Empty>
        )}
      </section>
    </>
  );
}

'use client';
import Link from 'next/link';
import { useApi } from '@/lib/client';
import { courseColor } from '@/lib/colors';
import type { GradesResponse } from '@/lib/types';
import { ChevronRight } from '../Icons';
import { courseHref, Empty, ErrorBox, Skeleton } from '../ui';

export default function CoursesView() {
  const { data, error, loading, reload } = useApi<GradesResponse>('/api/grades');
  const term = data?.terms.find((t) => t.id === data.currentTermId);

  return (
    <>
      <header className="page-head">
        <div className="titles">
          <p className="eyebrow">{term?.name ?? 'Bieżący semestr'}</p>
          <h1 className="title">Przedmioty</h1>
        </div>
      </header>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data ? (
        <Skeleton n={5} h={64} />
      ) : data && data.courses.length ? (
        <div className="list">
          {data.courses.map((c) => {
            const col = courseColor(c.courseId);
            return (
              <Link key={c.courseId} href={courseHref(c.courseId, c.termId)} className="row">
                <span
                  aria-hidden="true"
                  style={{ width: 40, height: 40, borderRadius: 12, background: col.bg, color: col.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}
                >
                  {c.name.charAt(0)}
                </span>
                <div className="grow">
                  <span className="t1">{c.name}</span>
                  <span className="t2">{[c.classTypes.join(', '), c.lecturers[0]].filter(Boolean).join(' · ')}</span>
                </div>
                <span style={{ color: 'var(--muted)' }}><ChevronRight /></span>
              </Link>
            );
          })}
        </div>
      ) : (
        data && <Empty title="Brak przedmiotów" />
      )}
    </>
  );
}

'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useApi } from '@/lib/client';
import { courseColor } from '@/lib/colors';
import type { GradesResponse } from '@/lib/types';
import type { CourseHit } from '@/lib/usos-courses';
import { useDebounced } from '@/lib/useDebounced';
import { ChevronRight, Search } from '../Icons';
import { courseHref, Empty, LoadError, Skeleton } from '../ui';

export default function CoursesView() {
  const api = useApi<GradesResponse>('/api/grades');
  const data = api.data;
  const term = data?.terms.find((t) => t.id === data.currentTermId);
  const [q, setQ] = useState('');
  const dq = useDebounced(q.trim());
  const search = useApi<{ items: CourseHit[] }>(dq.length >= 2 ? `/api/katalog?q=${encodeURIComponent(dq)}` : null);

  return (
    <>
      <header className="page-head">
        <div className="titles">
          <p className="eyebrow">{term?.name ?? 'Bieżący semestr'}</p>
          <h1 className="title">Przedmioty</h1>
        </div>
      </header>

      <label className="searchbox">
        <Search />
        <span className="sr-only">Szukaj w katalogu przedmiotów UJ</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Szukaj w katalogu przedmiotów UJ" />
      </label>

      {dq.length >= 2 ? (
        <section className="section">
          <h2 className="h2">Katalog UJ</h2>
          <LoadError api={search} />
          {search.loading && !search.data ? (
            <Skeleton n={3} h={56} />
          ) : search.data?.items.length ? (
            <div className="list">
              {search.data.items.map((c) => (
                <Link key={c.id} href={courseHref(c.id)} className="row">
                  <div className="grow">
                    <span className="t1">{c.name}</span>
                    <span className="t2">{c.id}</span>
                  </div>
                  <span style={{ color: 'var(--muted)' }}><ChevronRight /></span>
                </Link>
              ))}
            </div>
          ) : (
            search.data && <Empty title="Nic nie znaleziono">Spróbuj innej nazwy albo kodu przedmiotu.</Empty>
          )}
        </section>
      ) : (
        <>
          <LoadError api={api} />
          {api.loading && !data ? (
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
      )}
    </>
  );
}

'use client';
import Link from 'next/link';
import { useApi } from '@/lib/client';
import { courseColor } from '@/lib/colors';
import type { TestNode, TestsResponse, TestTreeResponse } from '@/lib/types-more';
import { ChevronLeft, ChevronRight } from '../Icons';
import { Empty, LoadError, PageHead, Skeleton } from '../ui';

const fmt = (n: number | null) => (n === null ? '—' : String(Math.round(n * 100) / 100).replace('.', ','));

export function TestsList() {
  const api = useApi<TestsResponse>('/api/sprawdziany');
  return (
    <>
      <PageHead eyebrow="Punkty i oceny cząstkowe" title="Sprawdziany" />
      <LoadError api={api} />
      {api.loading && !api.data ? (
        <Skeleton n={4} h={64} />
      ) : api.data?.tests.length ? (
        <div className="list">
          {api.data.tests.map((t) => {
            const col = courseColor(t.courseId ?? t.courseName);
            return (
              <Link key={t.rootId} href={`/sprawdziany/${encodeURIComponent(t.rootId)}`} className="row">
                <span className="dot" style={{ background: col.dot }} />
                <div className="grow">
                  <span className="t1">{t.courseName}</span>
                  <span className="t2">{t.name}</span>
                </div>
                <span style={{ color: 'var(--muted)' }}><ChevronRight /></span>
              </Link>
            );
          })}
        </div>
      ) : (
        api.data && <Empty title="Brak sprawdzianów">Prowadzący nie dodali jeszcze punktacji w USOS.</Empty>
      )}
    </>
  );
}

function Leaf({ n }: { n: TestNode }) {
  return (
    <div className="row" style={{ minHeight: 0 }}>
      <div className="grow">
        <span className="t1" style={{ fontSize: 15 }}>{n.name}</span>
        {(n.description || n.comment) && <span className="t2">{[n.description, n.comment && `Komentarz: ${n.comment}`].filter(Boolean).join(' · ')}</span>}
      </div>
      {n.type === 'grade' ? (
        <span className={`chip ${n.grade ? 'ok' : 'none'}`}>{n.grade ?? '—'}</span>
      ) : (
        <span className="pts">
          {fmt(n.points)}
          {n.pointsMax !== null && <small> / {fmt(n.pointsMax)}</small>}
        </span>
      )}
    </div>
  );
}

function folderSum(n: TestNode): [number | null, number | null] {
  let s: number | null = null;
  let m: number | null = null;
  const walk = (x: TestNode) => {
    if (x.type === 'task') {
      if (x.points !== null) s = (s ?? 0) + x.points;
      if (x.pointsMax !== null) m = (m ?? 0) + x.pointsMax;
    }
    x.children.forEach(walk);
  };
  walk(n);
  return [s, m];
}

function Folder({ n }: { n: TestNode }) {
  const [s, m] = folderSum(n);
  return (
    <div className="tree-folder">
      <div className="head">
        <span>{n.name}</span>
        {(s !== null || m !== null) && (
          <span className="pts">
            {fmt(s)}
            {m !== null && <small> / {fmt(m)}</small>}
          </span>
        )}
      </div>
      {n.description && <span className="meta-line">{n.description}</span>}
      <div className="tree-children">
        {n.children.length ? n.children.map((c) => (c.type === 'folder' ? <Folder key={c.id} n={c} /> : <Leaf key={c.id} n={c} />)) : <span className="meta-line" style={{ padding: '8px 0' }}>Pusto</span>}
      </div>
    </div>
  );
}

export function TestDetail({ id }: { id: string }) {
  const api = useApi<TestTreeResponse>(`/api/sprawdziany/${encodeURIComponent(id)}`);
  const list = useApi<TestsResponse>('/api/sprawdziany');
  const meta = list.data?.tests.find((t) => t.rootId === id);
  const d = api.data;
  const pct = d && d.sum !== null && d.sumMax ? Math.min(100, Math.round((d.sum / d.sumMax) * 100)) : null;
  const leaves = d?.root.children.filter((c) => c.type !== 'folder') ?? [];
  const folders = d?.root.children.filter((c) => c.type === 'folder') ?? [];

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/sprawdziany" className="icon-btn" aria-label="Wróć do sprawdzianów"><ChevronLeft size={20} /></Link>
        <div className="titles" style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <p className="eyebrow">{meta?.name ?? 'Sprawdziany'}</p>
          <h1 className="title" style={{ fontSize: 28 }}>{meta?.courseName ?? d?.root.name ?? '…'}</h1>
        </div>
      </div>
      <LoadError api={api} />
      {api.loading && !d ? (
        <Skeleton n={3} h={90} />
      ) : d ? (
        <>
          <section className="summary">
            <div className="row2">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span className="lab">Zdobyte punkty</span>
                <span className="avg num">
                  {fmt(d.sum)}
                  {d.sumMax !== null && <span style={{ fontSize: 24, opacity: 0.7 }}> / {fmt(d.sumMax)}</span>}
                </span>
              </div>
              {pct !== null && <span className="num" style={{ fontSize: 22, fontWeight: 700 }}>{pct}%</span>}
            </div>
            {pct !== null && (
              <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: 8, background: '#7C9BFF', borderRadius: 4 }} />
              </div>
            )}
            <span className="note">Suma z zadań, które mają już wpisane punkty.</span>
          </section>
          {folders.length > 0 && (
            <section className="card card-pad" style={{ display: 'flex', flexDirection: 'column' }}>
              {folders.map((f) => <Folder key={f.id} n={f} />)}
            </section>
          )}
          {leaves.length > 0 && <div className="list">{leaves.map((l) => <Leaf key={l.id} n={l} />)}</div>}
          {!folders.length && !leaves.length && <Empty title="Pusto">Prowadzący nie dodał jeszcze zadań.</Empty>}
        </>
      ) : null}
    </>
  );
}

'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useApi } from '@/lib/client';
import { courseColor } from '@/lib/colors';
import type { GroupDetail, GroupSummary } from '@/lib/usos-studies';
import MailForm from '../MailForm';
import { ChevronLeft, ChevronRight, Mail } from '../Icons';
import { courseHref, Empty, LoadError, PageHead, Skeleton } from '../ui';
import { GroupsExtra } from './ExtraSections';

export function GroupsList() {
  const api = useApi<{ groups: GroupSummary[] }>('/api/grupy');
  return (
    <>
      <PageHead eyebrow="Kto jest w Twoich grupach" title="Grupy zajęciowe" />
      <LoadError api={api} />
      {api.loading && !api.data ? (
        <Skeleton n={4} h={60} />
      ) : api.data?.groups.length ? (
        <div className="list">
          {api.data.groups.map((g) => {
            const col = courseColor(g.courseId ?? g.courseName);
            return (
              <Link key={g.key} href={`/grupy/${encodeURIComponent(g.key)}`} className="row">
                <span className="dot" style={{ background: col.dot }} />
                <div className="grow">
                  <span className="t1">{g.courseName}</span>
                  <span className="t2">{[`${g.classType}, gr. ${g.number}`, g.lecturers[0]?.name].filter(Boolean).join(' · ')}</span>
                </div>
                <span style={{ color: 'var(--muted)' }}><ChevronRight /></span>
              </Link>
            );
          })}
        </div>
      ) : (
        api.data && <Empty title="Brak grup" />
      )}
      <GroupsExtra />
    </>
  );
}

export function GroupView({ id }: { id: string }) {
  const api = useApi<GroupDetail>(`/api/grupy/${encodeURIComponent(id)}`);
  const g = api.data;
  const [mail, setMail] = useState<{ to: string; ids: string[] } | null>(null);
  const others = g ? g.participants.filter((p) => p.id && p.id !== g.meId) : [];

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/grupy" className="icon-btn" aria-label="Wróć do grup"><ChevronLeft size={20} /></Link>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <p className="eyebrow">{g ? `${g.classType}, grupa ${g.number}` : 'Grupa'}</p>
          <h1 className="title" style={{ fontSize: 28 }}>{g?.courseName ?? '…'}</h1>
        </div>
      </div>
      <LoadError api={api} />
      {api.loading && !g ? (
        <Skeleton n={3} h={70} />
      ) : g ? (
        <>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {g.lecturers.some((l) => l.id) && (
              <button className="btn btn-primary btn-sm" onClick={() => setMail({ to: g.lecturers.map((l) => l.name).join(', '), ids: g.lecturers.map((l) => l.id!).filter(Boolean) })}>
                <Mail /> Napisz do prowadzącego
              </button>
            )}
            {others.length > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={() => setMail({ to: `cała grupa (${others.length} os.)`, ids: others.map((p) => p.id!) })}>
                <Mail /> Napisz do grupy
              </button>
            )}
            {g.courseId && <Link href={courseHref(g.courseId, g.termId)} className="btn btn-ghost btn-sm">Przedmiot i sylabus</Link>}
          </div>
          {mail && <MailForm to={mail.to} userIds={mail.ids} onClose={() => setMail(null)} />}

          <section className="section">
            <h2 className="h2">Prowadzący</h2>
            <div className="list">
              {g.lecturers.map((l, i) =>
                l.id ? (
                  <Link key={l.id} href={`/osoby/${encodeURIComponent(l.id)}`} className="row">
                    <div className="grow"><span className="t1">{l.name}</span></div>
                    <span style={{ color: 'var(--muted)' }}><ChevronRight /></span>
                  </Link>
                ) : (
                  <div key={i} className="row"><div className="grow"><span className="t1">{l.name}</span></div></div>
                ),
              )}
            </div>
          </section>

          <section className="section">
            <h2 className="h2">Uczestnicy ({g.participants.length})</h2>
            {g.participants.length ? (
              <div className="list">
                {g.participants.map((p, i) => (
                  <div key={p.id ?? i} className="row" style={{ minHeight: 0, padding: '10px 0' }}>
                    <span className="avatar" style={{ width: 32, height: 32, fontSize: 13 }}>{p.name.charAt(0)}</span>
                    <div className="grow"><span className="t1" style={{ fontSize: 15 }}>{p.name}{p.id === g.meId ? ' (Ty)' : ''}</span></div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty title="Lista niedostępna">USOS nie udostępnił listy uczestników tej grupy.</Empty>
            )}
          </section>
        </>
      ) : null}
    </>
  );
}

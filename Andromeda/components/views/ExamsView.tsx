'use client';
import Link from 'next/link';
import { useApi } from '@/lib/client';

import { dayOf, hhmm, relativeDay, today } from '@/lib/dates';
import type { Exam, ExamsResponse } from '@/lib/usos-studies';
import { External, MapPin } from '../Icons';
import { courseHref, Empty, fmtDate, LoadError, PageHead, roomLabel, Skeleton } from '../ui';

function regState(e: Exam): [string, string] | null {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const start = e.registrationStart;
  const end = e.registerUntil ?? e.registrationEnd;
  if (!start && !end) return null;
  if (start && now < start) return [`Zapisy od ${fmtDate(start, true)}`, 'warn'];
  if (end && now > end) return ['Zapisy zamknięte', 'none'];
  return [end ? `Zapisy do ${fmtDate(end, true)}` : 'Zapisy otwarte', 'good'];
}

function ExamCard({ e }: { e: Exam }) {
  const reg = regState(e);
  return (
    <section className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <Link href={courseHref(e.courseId, e.termId)} style={{ color: 'var(--ink)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="dot" style={{ background: 'var(--warn)' }} />
            <h2 className="h2">{e.courseName}</h2>
          </Link>
          <span className="meta-line">{e.name}</span>
        </div>
        {reg && <span className={`tag ${reg[1]}`}>{reg[0]}</span>}
      </div>
      {e.description && <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>{e.description}</p>}
      {e.groups.length ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {e.groups.map((g) => (
            <div key={g.number} className="reg-row" style={{ alignItems: 'flex-start' }}>
              <div className="grow">
                <span className="t1 num">
                  {g.start ? `${fmtDate(g.start)} · ${hhmm(g.start)}${g.end ? `–${hhmm(g.end)}` : ''}` : `Termin ${g.number}`}
                </span>
                <span className="meta-line">
                  {[g.room && [roomLabel(g.room.number), g.room.buildingName].filter(Boolean).join(', '), g.examiners.map((x) => x.name).join(', ')]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
                {g.slots.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {g.slots.map((s) => {
                      const full = s.capacity !== null && s.taken !== null && s.taken >= s.capacity;
                      return (
                        <span key={s.number} className={`tag ${full ? 'none' : 'ok'}`}>
                          {s.start ? hhmm(s.start) : `Slot ${s.number}`}
                          {s.capacity !== null ? ` · ${s.taken ?? 0}/${s.capacity}` : ''}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              {g.room?.id ? (
                <Link href={`/sale/${encodeURIComponent(g.room.id)}`} className="icon-btn" style={{ background: 'var(--surface-2)' }} aria-label="Pokaż salę"><MapPin size={20} /></Link>
              ) : g.room?.buildingId ? (
                <Link href={`/budynki/${encodeURIComponent(g.room.buildingId)}`} className="icon-btn" style={{ background: 'var(--surface-2)' }} aria-label="Pokaż budynek"><MapPin size={20} /></Link>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <span className="meta-line">Terminy nie są jeszcze ustalone.</span>
      )}
    </section>
  );
}

export default function ExamsView() {
  const api = useApi<ExamsResponse>('/api/egzaminy');
  const d = api.data;
  const t = today();
  return (
    <>
      <PageHead eyebrow="Sesja i zaliczenia" title="Egzaminy" />
      <LoadError api={api} />
      {api.loading && !d ? (
        <Skeleton n={3} h={120} />
      ) : d ? (
        <>
          {d.planned.length > 0 && (
            <section className="section">
              <h2 className="h2">W planie (najbliższe tygodnie)</h2>
              <div className="list">
                {d.planned.map((e) => (
                  <Link key={e.id} href={courseHref(e.courseId)} className="row">
                    <div className="times num"><b>{hhmm(e.start)}</b><span>{fmtDate(dayOf(e.start)).slice(0, 5)}</span></div>
                    <div className="grow">
                      <span className="t1">{e.courseName}</span>
                      <span className="t2">{[e.classType, roomLabel(e.room), relativeDay(dayOf(e.start), t)].filter(Boolean).join(' · ')}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
          {d.exams.length ? (
            d.exams.map((e) => <ExamCard key={e.id} e={e} />)
          ) : (
            <Empty title="Brak egzaminów w USOS">Terminy egzaminów pojawią się, gdy wydział ogłosi sesję.</Empty>
          )}
          <p className="meta-line" style={{ lineHeight: 1.5 }}>
            Zapisy na konkretny termin egzaminu robi się w USOSweb (Dla studentów → Egzaminy) —{' '}
            <a href={d.usoswebUrl} target="_blank" rel="noopener noreferrer">otwórz USOSweb <External size={13} /></a>.
          </p>
        </>
      ) : null}
    </>
  );
}

'use client';
import { useApi } from '@/lib/client';
import { today } from '@/lib/dates';
import type { CalendarResponse, CalEvent } from '@/lib/types-more';
import { Empty, LoadError, PageHead, Skeleton } from '../ui';

const typeInfo: Record<string, [string, string]> = {
  exam_session: ['Sesja', 'warn'],
  rector: ['Dzień rektorski', 'ok'],
  dean: ['Dzień dziekański', 'ok'],
  holidays: ['Przerwa', 'good'],
  public_holidays: ['Święto', 'good'],
  break: ['Przerwa', 'good'],
  academic_year: ['Rok akademicki', 'none'],
};

const monthName = (iso: string) => {
  const s = new Intl.DateTimeFormat('pl-PL', { month: 'long', year: 'numeric' }).format(new Date(iso.slice(0, 10) + 'T12:00:00'));
  return s.charAt(0).toUpperCase() + s.slice(1);
};

function range(e: CalEvent): string {
  const f = (v: string) => new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short', weekday: 'short' }).format(new Date(v.slice(0, 10) + 'T12:00:00'));
  const a = e.start.slice(0, 10);
  const b = e.end.slice(0, 10);
  return a === b ? f(a) : `${f(a)} – ${f(b)}`;
}

function daysUntil(iso: string): number {
  return Math.round((new Date(iso.slice(0, 10) + 'T12:00:00').getTime() - new Date(today() + 'T12:00:00').getTime()) / 86400000);
}

export default function CalendarView() {
  const api = useApi<CalendarResponse>('/api/kalendarz');
  const evs = api.data?.events ?? [];
  const t = today();
  const now = evs.filter((e) => e.start.slice(0, 10) <= t && e.end.slice(0, 10) >= t);
  const nextOff = evs.find((e) => e.dayOff && e.start.slice(0, 10) > t);
  const session = evs.find((e) => e.type === 'exam_session');

  const byMonth = new Map<string, CalEvent[]>();
  for (const e of evs) {
    const k = e.start.slice(0, 7) < t.slice(0, 7) ? t.slice(0, 7) : e.start.slice(0, 7);
    byMonth.set(k, [...(byMonth.get(k) ?? []), e]);
  }

  return (
    <>
      <PageHead eyebrow={api.data?.faculties.length ? api.data.faculties.join(' · ') : 'Najbliższe miesiące'} title="Kalendarz akademicki" />
      <LoadError api={api} />
      {api.loading && !api.data ? (
        <Skeleton n={3} h={90} />
      ) : api.data ? (
        <>
          {api.data.note && <div className="notice warn">{api.data.note}</div>}
          {(nextOff || session) && (
            <div className="tiles">
              {nextOff && (
                <div className="tile">
                  <span className="lab">Najbliższy dzień wolny</span>
                  <span className="mid">{nextOff.name}</span>
                  <span className="sub">{range(nextOff)} · za {daysUntil(nextOff.start)} dni</span>
                </div>
              )}
              {session && (
                <div className="tile warn">
                  <span className="lab">Sesja</span>
                  <span className="mid">{session.name}</span>
                  <span className="sub">
                    {range(session)}
                    {daysUntil(session.start) > 0 ? ` · za ${daysUntil(session.start)} dni` : ' · trwa'}
                  </span>
                </div>
              )}
            </div>
          )}
          {now.length > 0 && (
            <div className="notice" role="status">
              <span>Teraz: {now.map((e) => e.name).join(', ')}</span>
            </div>
          )}
          {[...byMonth.entries()].map(([month, list]) => (
            <section className="section" key={month}>
              <h2 className="h2">{monthName(month + '-01')}</h2>
              <div className="list">
                {list.map((e) => {
                  const info = typeInfo[e.type] ?? [e.dayOff ? 'Dzień wolny' : 'Wydarzenie', e.dayOff ? 'good' : 'none'];
                  return (
                    <div className="row" key={e.id}>
                      <div className="grow">
                        <span className="t1">{e.name}</span>
                        <span className="t2">{[range(e), e.faculty].filter(Boolean).join(' · ')}</span>
                      </div>
                      <span className={`tag ${info[1]}`}>{e.dayOff && info[0] !== 'Święto' && info[0] !== 'Przerwa' ? 'Wolne' : info[0]}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
          {!evs.length && !api.data.note && <Empty title="Brak wydarzeń">W najbliższych miesiącach kalendarz jest pusty.</Empty>}
        </>
      ) : null}
    </>
  );
}

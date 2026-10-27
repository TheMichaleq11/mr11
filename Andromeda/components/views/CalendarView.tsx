'use client';
import { useApi } from '@/lib/client';
import { today } from '@/lib/dates';
import type { CalendarResponse, CalEvent } from '@/lib/types-more';
import { Empty, LoadError, PageHead, Skeleton } from '../ui';

// Nazwa i kolor typu dnia (kolorowy pasek i etykieta — jak typy zajęć w planie).
const typeInfo: Record<string, [string, string]> = {
  exam_session: ['Sesja', '#F0A23A'],
  rector: ['Dzień rektorski', '#A06BF0'],
  dean: ['Dzień dziekański', '#A06BF0'],
  holidays: ['Przerwa', '#34B26A'],
  public_holidays: ['Święto', '#F07A5A'],
  break: ['Przerwa', '#34B26A'],
  academic_year: ['Rok akademicki', '#8A96B8'],
};

function lengthLabel(e: CalEvent): string {
  const n = Math.round((new Date(e.end.slice(0, 10) + 'T12:00:00').getTime() - new Date(e.start.slice(0, 10) + 'T12:00:00').getTime()) / 86400000) + 1;
  return n === 1 ? '1 dzień' : `${n} dni`;
}

function whenLabel(e: CalEvent, t: string): string {
  const a = e.start.slice(0, 10);
  const b = e.end.slice(0, 10);
  if (a <= t && b >= t) return 'trwa';
  if (b < t) return 'minęło';
  const d = daysUntil(a);
  return d === 1 ? 'jutro' : `za ${d} dni`;
}

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
                  const info = typeInfo[e.type] ?? [e.dayOff ? 'Dzień wolny' : 'Wydarzenie', e.dayOff ? '#34B26A' : '#8A96B8'];
                  return (
                    <div className="row cal-row" key={e.id} style={{ '--k': info[1] } as React.CSSProperties}>
                      <div className="grow">
                        <span className="t1">{e.name}</span>
                        <span className="t2">{[range(e), e.faculty].filter(Boolean).join(' · ')}</span>
                      </div>
                      <span className="cal-when">
                        {whenLabel(e, t)}
                        <small>{lengthLabel(e)}</small>
                      </span>
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

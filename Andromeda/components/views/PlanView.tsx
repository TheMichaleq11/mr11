'use client';
import { useEffect, useState } from 'react';
import { useApi } from '@/lib/client';
import { activeMonday, addDays, dayNumber, dayOf, longDate, mondayOf, shortWeekday, today, weekRangeLabel } from '@/lib/dates';
import type { PlanResponse } from '@/lib/types';
import { ChevronLeft, ChevronRight } from '../Icons';
import { Empty, ErrorBox, EventCard, Skeleton, WeekGrid } from '../ui';

export default function PlanView() {
  const [monday, setMonday] = useState(() => activeMonday());
  const [selected, setSelected] = useState(() => {
    const t = today();
    const idx = Math.round((new Date(t + 'T12:00:00').getTime() - new Date(mondayOf(t) + 'T12:00:00').getTime()) / 86400000);
    return idx > 4 ? 0 : idx;
  });
  const { data, error, loading, reload } = useApi<PlanResponse>(`/api/plan?start=${monday}&days=7`);
  const events = data?.events ?? [];

  const weekend = [5, 6].filter((i) => events.some((e) => dayOf(e.start) === addDays(monday, i)));
  const dayIdx = [0, 1, 2, 3, 4, ...weekend];
  useEffect(() => {
    if (!dayIdx.includes(selected)) setSelected(0);
  }, [dayIdx, selected]);

  const selDay = addDays(monday, selected);
  const dayEvents = events.filter((e) => dayOf(e.start) === selDay);
  const home = activeMonday();
  const isThisWeek = monday === home;
  const weekName = monday === mondayOf(today()) ? 'Ten tydzień' : isThisWeek ? 'Nadchodzący tydzień' : 'Tydzień';

  return (
    <>
      <header className="page-head">
        <div className="titles">
          <p className="eyebrow">
            {weekName} · {weekRangeLabel(monday)}
          </p>
          <h1 className="title">Plan zajęć</h1>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {!isThisWeek && (
            <button className="btn btn-ghost" style={{ minHeight: 44, fontSize: 14 }} onClick={() => setMonday(home)}>
              Dziś
            </button>
          )}
          <button className="icon-btn" aria-label="Poprzedni tydzień" onClick={() => setMonday(addDays(monday, -7))}>
            <ChevronLeft />
          </button>
          <button className="icon-btn" aria-label="Następny tydzień" onClick={() => setMonday(addDays(monday, 7))}>
            <ChevronRight />
          </button>
        </div>
      </header>

      {error && <ErrorBox message={error} onRetry={reload} />}

      <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="days" role="tablist" aria-label="Dzień tygodnia" style={{ gridTemplateColumns: `repeat(${dayIdx.length}, minmax(0, 1fr))` }}>
          {dayIdx.map((i) => {
            const d = addDays(monday, i);
            const has = events.some((e) => dayOf(e.start) === d);
            const on = i === selected;
            return (
              <button key={d} role="tab" aria-selected={on} className="day-btn" onClick={() => setSelected(i)}>
                <span className="d1">{shortWeekday(d)}</span>
                <span className="d2 num">{dayNumber(d)}</span>
                <span className="d3" style={{ background: has ? (on ? 'var(--hero-accent)' : 'var(--accent)') : 'transparent' }} />
              </button>
            );
          })}
        </div>

        <section className="section">
          <h2 className="eyebrow" style={{ fontWeight: 600 }}>{longDate(selDay)}</h2>
          {loading && !data ? (
            <Skeleton n={3} h={96} />
          ) : dayEvents.length ? (
            dayEvents.map((e) => <EventCard key={e.id} e={e} />)
          ) : (
            <Empty title="Wolne">Brak zajęć w tym dniu</Empty>
          )}
        </section>
      </div>

      <section className="desktop-only plain-week">
        {data ? <WeekGrid monday={monday} events={events} /> : <Skeleton h={320} />}
      </section>

      <CalendarSubscribe />
    </>
  );
}

/** Subskrypcja planu w Kalendarzu (iPhone: webcal, Google/Outlook: link https). */
function CalendarSubscribe() {
  const [state, setState] = useState<{ busy: boolean; url: string | null; err: string | null }>({ busy: false, url: null, err: null });
  async function get() {
    setState({ busy: true, url: null, err: null });
    try {
      const r = await fetch('/api/ical', { credentials: 'same-origin' });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error === 'scope' ? 'Potrzebna ponowna zgoda w USOS — zaloguj się jeszcze raz.' : j?.detail || 'Błąd');
      if (!j.webcalUrl) throw new Error('W trybie demo nie ma kalendarza — zaloguj się do USOS.');
      setState({ busy: false, url: j.webcalUrl, err: null });
      if (/iPhone|iPad|Macintosh/.test(navigator.userAgent)) window.location.href = j.webcalUrl;
    } catch (e) {
      setState({ busy: false, url: null, err: e instanceof Error ? e.message : String(e) });
    }
  }
  return (
    <section className="callout">
      <b>Plan w kalendarzu telefonu</b>
      {state.err && <div className="notice warn">{state.err}</div>}
      {state.url ? (
        <a href={state.url} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Dodaj do Kalendarza</a>
      ) : (
        <button className="btn btn-primary" disabled={state.busy} onClick={get} style={{ alignSelf: 'flex-start' }}>
          {state.busy ? 'Chwila…' : 'Dodaj plan do kalendarza'}
        </button>
      )}
    </section>
  );
}

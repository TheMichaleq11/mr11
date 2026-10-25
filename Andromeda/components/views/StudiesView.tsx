'use client';
import Link from 'next/link';
import { useApi } from '@/lib/client';
import type { StudiesResponse } from '@/lib/usos-studies';
import { courseHref, Empty, fmtDate, LoadError, PageHead, Skeleton } from '../ui';

const fmt = (n: number | null) => (n === null ? '—' : String(n).replace('.', ','));
const progStatus: Record<string, [string, string]> = {
  active: ['aktywny', 'good'],
  cancelled: ['skreślony', 'bad'],
  graduated_end_of_study: ['ukończony', 'ok'],
  graduated_before_diploma: ['przed dyplomem', 'warn'],
  graduated_diploma: ['ukończony z dyplomem', 'ok'],
};
const mobState: Record<string, string> = { in_preparation: 'w przygotowaniu', active: 'trwa', reserve: 'lista rezerwowa', resignation: 'rezygnacja' };
const thesisType: Record<string, string> = { licentiate: 'licencjacka', master: 'magisterska', engineer: 'inżynierska', doctoral: 'doktorska', postgraduate: 'podyplomowa' };

export default function StudiesView() {
  const api = useApi<StudiesResponse>('/api/studia');
  const d = api.data;
  const pct = d && d.term.total ? Math.min(100, Math.round(((d.term.passed ?? 0) / d.term.total) * 100)) : 0;

  return (
    <>
      <PageHead eyebrow="Etapy, punkty ECTS, dyplom" title="Studia" />
      <LoadError api={api} />
      {api.loading && !d ? (
        <Skeleton n={3} h={130} />
      ) : d ? (
        <>
          <section className="summary">
            <div className="row2">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span className="lab">ECTS zaliczone w semestrze</span>
                <span className="avg num">
                  {fmt(d.term.passed ?? 0)}
                  <span style={{ fontSize: 24, opacity: 0.7 }}> / {fmt(d.term.total)}</span>
                </span>
              </div>
              {d.ectsTotal !== null && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                  <span className="lab">Łącznie na studiach</span>
                  <span className="num" style={{ fontSize: 22, fontWeight: 700 }}>{fmt(d.ectsTotal)}</span>
                </div>
              )}
            </div>
            <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: 8, background: '#7C9BFF', borderRadius: 4 }} />
            </div>
            <span className="note">
              {d.term.termName ? `${d.term.termName}. ` : ''}Punkty liczą się po zaliczeniu przedmiotu oceną końcową. Typowo semestr to 30 ECTS — dokładny wymóg sprawdzisz w programie studiów.
            </span>
          </section>

          {d.term.courses.length > 0 && (
            <section className="section">
              <h2 className="h2">Przedmioty i punkty</h2>
              <div className="list">
                {d.term.courses.map((c) => (
                  <Link key={c.id} href={courseHref(c.id)} className="row">
                    <div className="grow">
                      <span className="t1">{c.name}</span>
                      <span className="t2">{c.passed === true ? 'zaliczony' : c.passed === false ? 'niezaliczony' : 'w trakcie'}</span>
                    </div>
                    <span className={`chip ${c.passed ? 'good' : c.passed === false ? 'bad' : 'none'}`} style={{ fontSize: 14 }}>{c.ects !== null ? `${fmt(c.ects)} ECTS` : '— ECTS'}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {d.programmes.map((p) => {
            const st = p.status ? progStatus[p.status] ?? [p.status, 'none'] : null;
            return (
              <section key={p.id} className="section">
                <div className="section-head">
                  <h2 className="h2">{p.name}</h2>
                  {st && <span className={`tag ${st[1]}`}>{st[0]}</span>}
                </div>
                <div className="card" style={{ padding: '4px 16px' }}>
                  {p.faculty && <div className="kv"><span>Wydział</span><span>{p.faculty}</span></div>}
                  {p.level && <div className="kv"><span>Poziom</span><span>{p.level}</span></div>}
                  {p.mode && <div className="kv"><span>Forma</span><span>{p.mode}</span></div>}
                  {p.duration && <div className="kv"><span>Czas trwania</span><span>{p.duration}</span></div>}
                  {p.admission && <div className="kv"><span>Przyjęcie</span><span className="num">{fmtDate(p.admission)}</span></div>}
                  {p.ectsUsed !== null && <div className="kv"><span>ECTS na kierunku</span><span className="num">{fmt(p.ectsUsed)}</span></div>}
                </div>
                {p.stages.length > 0 && (
                  <div className="list">
                    {p.stages.map((s, i) => (
                      <div className="row" key={i}>
                        <div className="grow">
                          <span className="t1">{s.name}</span>
                          {s.term && <span className="t2">{s.term}</span>}
                        </div>
                        {s.status && <span className="tag none">{s.status}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}

          {d.theses.length > 0 && (
            <section className="section">
              <h2 className="h2">Prace dyplomowe</h2>
              <div className="list">
                {d.theses.map((t) => (
                  <div className="row" key={t.id}>
                    <div className="grow">
                      <span className="t1">{t.title}</span>
                      <span className="t2">{[t.type && `praca ${thesisType[t.type] ?? t.type}`, t.supervisors.length && `promotor: ${t.supervisors.join(', ')}`, t.faculty].filter(Boolean).join(' · ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {d.mobilities.length > 0 && (
            <section className="section">
              <h2 className="h2">Wymiana studencka</h2>
              <div className="list">
                {d.mobilities.map((m) => (
                  <div className="row" key={m.id}>
                    <div className="grow">
                      <span className="t1">{m.institution ?? 'Wyjazd'}</span>
                      <span className="t2">{[m.term, m.start && `${fmtDate(m.start)} – ${fmtDate(m.end)}`].filter(Boolean).join(' · ')}</span>
                    </div>
                    {m.state && <span className="tag ok">{mobState[m.state] ?? m.state}</span>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {!d.programmes.length && <Empty title="Brak danych o kierunku" />}
        </>
      ) : null}
    </>
  );
}

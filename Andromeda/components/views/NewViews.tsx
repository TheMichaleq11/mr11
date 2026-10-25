'use client';
// Nowe ekrany: konsultacje i spotkania, obiegówki, testy poziomujące, przewodnik po uczelni.
import Link from 'next/link';
import { useState } from 'react';
import { invalidate, postJson, useApi } from '@/lib/client';
import { dayOf, hhmm, longDate } from '@/lib/dates';
import type { GuideChapter, GuidePage, Meeting, MeetingDetail, Part, PlacementResult, Slip } from '@/lib/usos-extra';
import { ChevronLeft, ChevronRight } from '../Icons';
import { Empty, fmtDate, LoadError, PageHead, ScopeBox, Skeleton } from '../ui';

function PartState<T>({ part, empty, children }: { part: Part<T> | undefined; empty: React.ReactNode; children: (d: T) => React.ReactNode }) {
  if (!part) return null;
  if (part.scope) return <ScopeBox />;
  if (part.unavailable || part.data == null) return <>{empty}</>;
  return <>{children(part.data)}</>;
}

// =====================================================================
// KONSULTACJE I SPOTKANIA
// =====================================================================
export function MeetingsView() {
  const api = useApi<Part<Meeting[]>>('/api/spotkania');
  return (
    <>
      <PageHead eyebrow="Dyżury, konsultacje, spotkania z opiekunem" title="Konsultacje" />
      <LoadError api={api} />
      {api.loading && !api.data ? (
        <Skeleton n={3} h={64} />
      ) : (
        <PartState part={api.data ?? undefined} empty={<Empty title="Brak spotkań">USOS nie ma teraz otwartych zapisów na konsultacje dla Ciebie.</Empty>}>
          {(list) =>
            list.length ? (
              <div className="ledger">
                {list.map((m) => (
                  <Link key={m.id} href={`/konsultacje/${encodeURIComponent(m.id)}`} className="row">
                    <div className="grow">
                      <span className="t1">{m.name}</span>
                      <span className="t2">
                        {[m.lecturer, m.soonest && `najbliższy termin ${fmtDate(m.soonest, true)}`, m.faculty].filter(Boolean).join(' · ')}
                      </span>
                    </div>
                    <span style={{ color: 'var(--faint)' }}><ChevronRight /></span>
                  </Link>
                ))}
              </div>
            ) : (
              <Empty title="Brak spotkań">USOS nie ma teraz otwartych zapisów na konsultacje dla Ciebie.</Empty>
            )
          }
        </PartState>
      )}
    </>
  );
}

const meetStatus: Record<string, [string, string]> = {
  accepted: ['Zapisany', 'good'],
  waiting: ['Czeka na akceptację', 'warn'],
  rejected: ['Odrzucony', 'bad'],
  token_created: ['W toku', 'warn'],
};

export function MeetingView({ id }: { id: string }) {
  const url = `/api/spotkania/${encodeURIComponent(id)}`;
  const api = useApi<MeetingDetail>(url);
  const [pick, setPick] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const d = api.data;

  async function act(action: 'sign_up' | 'sign_off', dateId: string) {
    setBusy(true);
    const err = await postJson(url, { action, dateId, substantiationId: reason || d?.substantiations[0]?.id, message: note });
    setBusy(false);
    setMsg(err ?? (action === 'sign_up' ? 'Zapisano na termin.' : 'Wypisano z terminu.'));
    setPick(null);
    invalidate('/api/spotkania');
    api.reload();
  }

  const byDay = new Map<string, MeetingDetail['dates']>();
  d?.dates.forEach((x) => byDay.set(dayOf(x.start), [...(byDay.get(dayOf(x.start)) ?? []), x]));

  return (
    <>
      <Link href="/konsultacje" className="link-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><ChevronLeft size={16} /> Konsultacje</Link>
      <LoadError api={api} />
      {api.loading && !d ? (
        <Skeleton n={3} h={64} />
      ) : d ? (
        <>
          <PageHead eyebrow={[d.meeting.lecturer, d.meeting.faculty].filter(Boolean).join(' · ')} title={d.meeting.name} />
          {d.meeting.comment && <p style={{ color: 'var(--ink-2)', maxWidth: '64ch', lineHeight: 1.55 }}>{d.meeting.comment}</p>}
          {msg && <div className="notice" role="status">{msg}</div>}
          {d.dates.length ? (
            [...byDay.entries()].map(([day, dates]) => (
              <section key={day} className="section">
                <div className="section-head ruled"><h2 className="h2">{longDate(day)}</h2></div>
                <div className="ledger">
                  {dates.map((x) => {
                    const st = x.status ? meetStatus[x.status] : null;
                    const full = x.seats != null && x.accepted != null && x.accepted >= x.seats;
                    return (
                      <div key={x.id} className="row" style={{ flexWrap: 'wrap' }}>
                        <div className="times num"><b>{hhmm(x.start)}</b>{x.end && <span>{hhmm(x.end)}</span>}</div>
                        <div className="grow">
                          <span className="t1">{x.room ? `sala ${x.room}` : 'Termin'}</span>
                          <span className="t2 num">
                            {[x.seats != null && `miejsca ${x.accepted ?? 0} / ${x.seats}`, x.waiting ? `rezerwa ${x.waiting}` : null, x.regEnd && `zapisy do ${fmtDate(x.regEnd, true)}`]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        </div>
                        {st ? (
                          <>
                            <span className={`tag ${st[1]}`}>{st[0]}</span>
                            {x.canSignOut && <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => act('sign_off', x.id)}>Wypisz</button>}
                          </>
                        ) : x.canSignUp ? (
                          <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => setPick(pick === x.id ? null : x.id)}>Zapisz się</button>
                        ) : (
                          <span className="tag none">{full ? 'Brak miejsc' : 'Niedostępny'}</span>
                        )}
                        {pick === x.id && (
                          <div style={{ flexBasis: '100%', display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
                            {d.substantiations.length > 1 && (
                              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
                                Powód spotkania
                                <select className="select" value={reason || d.substantiations[0].id} onChange={(e) => setReason(e.target.value)}>
                                  {d.substantiations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                              </label>
                            )}
                            <textarea className="input" placeholder="Wiadomość do prowadzącego (opcjonalnie)" value={note} onChange={(e) => setNote(e.target.value)} />
                            <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} disabled={busy} onClick={() => act('sign_up', x.id)}>Potwierdź zapis</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
          ) : (
            <Empty title="Brak terminów">Prowadzący nie dodał jeszcze terminów tego spotkania.</Empty>
          )}
        </>
      ) : null}
    </>
  );
}

// =====================================================================
// OBIEGÓWKI
// =====================================================================
const qTone: Record<string, [string, string]> = {
  cleared: ['Rozliczone', 'good'],
  rejected: ['Odmowa', 'bad'],
  unclear: ['Sprawdź', 'warn'],
  pending: ['Czeka', 'none'],
};

export function SlipsView() {
  const api = useApi<Part<Slip[]>>('/api/obiegowki');
  return (
    <>
      <PageHead eyebrow="Rozliczenia z uczelnią" title="Obiegówki" />
      <LoadError api={api} />
      {api.loading && !api.data ? (
        <Skeleton n={2} h={120} />
      ) : (
        <PartState part={api.data ?? undefined} empty={<Empty title="Brak obiegówek">Gdy uczelnia wystawi Ci obiegówkę (np. przy końcu studiów), zobaczysz tu, co jest już rozliczone.</Empty>}>
          {(slips) =>
            slips.length ? (
              slips.map((s) => {
                const done = s.questions.filter((q) => q.status === 'cleared').length;
                return (
                  <section key={s.id} className="section">
                    <div className="section-head ruled">
                      <h2 className="h2">{s.name}</h2>
                      <span className={`tag ${s.state === 'closed' ? 'none' : 'ok'}`}>{s.state === 'closed' ? 'Zamknięta' : 'Otwarta'}</span>
                    </div>
                    <span className="meta-line">
                      {[s.created && `wystawiona ${fmtDate(s.created)}`, s.issuer, s.questions.length && `rozliczone ${done} z ${s.questions.length}`].filter(Boolean).join(' · ')}
                    </span>
                    {s.questions.length > 0 && (
                      <div className="bar" style={{ maxWidth: 420 }}><span style={{ width: `${(done / s.questions.length) * 100}%` }} /></div>
                    )}
                    {s.comment && <p style={{ fontSize: 14, color: 'var(--ink-2)' }}>{s.comment}</p>}
                    <div className="ledger">
                      {s.questions.map((q, i) => {
                        const t = qTone[q.status] ?? qTone.pending;
                        return (
                          <div key={i} className="row" style={{ alignItems: 'flex-start' }}>
                            <div className="grow">
                              <span className="t1">{q.question}</span>
                              {(q.answer || q.answerer) && (
                                <span className="t2">{[q.answer, q.answerer, q.answered && fmtDate(q.answered)].filter(Boolean).join(' · ')}</span>
                              )}
                            </div>
                            <span className={`tag ${t[1]}`}>{t[0]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })
            ) : (
              <Empty title="Brak obiegówek">Gdy uczelnia wystawi Ci obiegówkę (np. przy końcu studiów), zobaczysz tu, co jest już rozliczone.</Empty>
            )
          }
        </PartState>
      )}
    </>
  );
}

// =====================================================================
// TESTY POZIOMUJĄCE
// =====================================================================
export function PlacementView() {
  const api = useApi<Part<PlacementResult[]>>('/api/testy');
  return (
    <>
      <PageHead eyebrow="Języki obce" title="Testy poziomujące" />
      <LoadError api={api} />
      {api.loading && !api.data ? (
        <Skeleton n={2} h={60} />
      ) : (
        <PartState part={api.data ?? undefined} empty={<Empty title="Brak wyników">Po napisaniu testu poziomującego (np. w SJO UJ) wynik pojawi się tutaj.</Empty>}>
          {(list) =>
            list.length ? (
              <div className="ledger">
                {list.map((t) => (
                  <div key={t.id} className="row">
                    <div className="grow">
                      <span className="t1">{t.name}</span>
                      <span className="t2">Wynik testu</span>
                    </div>
                    <span className="chip ok num">{t.value ?? '—'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <Empty title="Brak wyników">Po napisaniu testu poziomującego (np. w SJO UJ) wynik pojawi się tutaj.</Empty>
            )
          }
        </PartState>
      )}
    </>
  );
}

// =====================================================================
// PRZEWODNIK PO UCZELNI
// =====================================================================
export function GuideView() {
  const api = useApi<Part<GuideChapter[]>>('/api/przewodnik');
  return (
    <>
      <PageHead eyebrow="Najważniejsze informacje dla studentów" title="Przewodnik" />
      <LoadError api={api} />
      {api.loading && !api.data ? (
        <Skeleton n={4} h={52} />
      ) : (
        <PartState part={api.data ?? undefined} empty={<Empty title="Przewodnik niedostępny">UJ nie udostępnia teraz przewodnika w USOS.</Empty>}>
          {(chapters) =>
            chapters.length ? (
              chapters.map((c) => (
                <section key={c.id} className="section">
                  <div className="section-head ruled"><h2 className="h2">{c.title}</h2></div>
                  <div className="ledger">
                    {c.pages.map((p) => (
                      <Link key={p.id} href={`/przewodnik/${encodeURIComponent(p.id)}`} className="row">
                        <div className="grow"><span className="t1">{p.title}</span></div>
                        <span style={{ color: 'var(--faint)' }}><ChevronRight /></span>
                      </Link>
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <Empty title="Przewodnik jest pusty">UJ nie dodał jeszcze treści do przewodnika w USOS.</Empty>
            )
          }
        </PartState>
      )}
    </>
  );
}

export function GuidePageView({ id }: { id: string }) {
  const api = useApi<GuidePage>(`/api/przewodnik/${encodeURIComponent(id)}`);
  const p = api.data;
  return (
    <>
      <Link href="/przewodnik" className="link-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><ChevronLeft size={16} /> Przewodnik</Link>
      <LoadError api={api} />
      {api.loading && !p ? (
        <Skeleton n={3} h={120} />
      ) : p ? (
        <>
          <PageHead title={p.title} />
          {p.entries.map((e) => (
            <article key={e.id} className="section">
              {e.title && <div className="section-head ruled"><h2 className="h2">{e.title}</h2></div>}
              {e.image && <img src={e.image} alt="" style={{ maxWidth: 540, width: '100%', borderRadius: 12 }} />}
              <div className="html" dangerouslySetInnerHTML={{ __html: e.html }} />
            </article>
          ))}
        </>
      ) : null}
    </>
  );
}

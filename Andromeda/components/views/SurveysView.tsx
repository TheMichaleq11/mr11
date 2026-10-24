'use client';
import Link from 'next/link';
import { useState } from 'react';
import { invalidate, postJson, useApi } from '@/lib/client';
import type { SurveyDetail, SurveysResponse } from '@/lib/types-more';
import { ChevronLeft, ChevronRight } from '../Icons';
import { Empty, fmtDate, LoadError, PageHead, Skeleton } from '../ui';

export function SurveysList() {
  const api = useApi<SurveysResponse>('/api/ankiety');
  const list = api.data?.surveys ?? [];
  const open = list.filter((s) => s.canFill);
  const rest = list.filter((s) => !s.canFill);

  const row = (s: SurveysResponse['surveys'][number]) => (
    <Link key={s.id} href={`/ankiety/${encodeURIComponent(s.id)}`} className="row">
      <div className="grow">
        <span className="t1">{s.subject ?? s.name}</span>
        <span className="t2">{[s.subject ? s.name : null, s.lecturer, s.end && `do ${fmtDate(s.end)}`].filter(Boolean).join(' · ')}</span>
      </div>
      {s.filled ? <span className="tag good">Wypełniona</span> : s.canFill ? <span className="tag warn">Do wypełnienia</span> : <span className="tag none">Zamknięta</span>}
      <span style={{ color: 'var(--muted)' }}><ChevronRight /></span>
    </Link>
  );

  return (
    <>
      <PageHead eyebrow="Ocena zajęć i prowadzących" title="Ankiety" />
      <LoadError api={api} />
      {api.loading && !api.data ? (
        <Skeleton n={3} h={64} />
      ) : api.data ? (
        list.length ? (
          <>
            {open.length > 0 && (
              <section className="section">
                <h2 className="h2">Do wypełnienia ({open.length})</h2>
                <div className="list">{open.map(row)}</div>
              </section>
            )}
            {rest.length > 0 && (
              <section className="section">
                <h2 className="h2">Pozostałe</h2>
                <div className="list">{rest.map(row)}</div>
              </section>
            )}
          </>
        ) : (
          <Empty title="Brak ankiet">Gdy pojawią się ankiety do wypełnienia, zobaczysz je tutaj.</Empty>
        )
      ) : null}
    </>
  );
}

export function SurveyForm({ id }: { id: string }) {
  const api = useApi<SurveyDetail>(`/api/ankiety/${encodeURIComponent(id)}`);
  const [answers, setAnswers] = useState<Record<string, { answer: string | null; comment: string | null }>>({});
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const s = api.data;

  const set = (qid: string, patch: Partial<{ answer: string | null; comment: string | null }>) =>
    setAnswers((a) => ({ ...a, [qid]: { answer: a[qid]?.answer ?? null, comment: a[qid]?.comment ?? null, ...patch } }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!Object.values(answers).some((a) => a.answer || a.comment)) {
      setMsg({ ok: false, text: 'Odpowiedz na co najmniej jedno pytanie.' });
      return;
    }
    if (!window.confirm('Wysłać ankietę? Później nie da się jej zmienić.')) return;
    setBusy(true);
    const err = await postJson(`/api/ankiety/${encodeURIComponent(id)}`, { answers, comment: s?.hasFinalComment ? comment : null });
    setBusy(false);
    if (err) setMsg({ ok: false, text: err });
    else {
      setMsg({ ok: true, text: 'Dziękujemy — ankieta wysłana.' });
      invalidate('/api/ankiety');
      api.reload();
    }
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/ankiety" className="icon-btn" aria-label="Wróć do ankiet"><ChevronLeft size={20} /></Link>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <p className="eyebrow">{[s?.lecturer, s?.subject].filter(Boolean).join(' · ') || 'Ankieta'}</p>
          <h1 className="title" style={{ fontSize: 26 }}>{s?.name ?? '…'}</h1>
        </div>
      </div>
      <LoadError api={api} />
      {msg && <div className={`notice ${msg.ok ? '' : 'warn'}`} role="status">{msg.text}</div>}
      {api.loading && !s ? (
        <Skeleton n={3} h={110} />
      ) : s ? (
        s.filled ? (
          <Empty title="Ankieta wypełniona">Dziękujemy za odpowiedzi.</Empty>
        ) : !s.canFill ? (
          <Empty title="Ankieta zamknięta">{s.end ? `Zbieranie odpowiedzi zakończyło się ${fmtDate(s.end)}.` : 'Nie możesz już jej wypełnić.'}</Empty>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {s.headlineHtml && <div className="html card" dangerouslySetInnerHTML={{ __html: s.headlineHtml }} />}
            {s.questions.map((q) =>
              q.answers.length === 0 && !q.allowComment ? (
                <h2 key={q.id} className="h2 html" style={{ marginTop: 8 }} dangerouslySetInnerHTML={{ __html: `${q.number ? q.number + '. ' : ''}${q.html}` }} />
              ) : (
                <fieldset key={q.id} className="q" style={{ marginLeft: q.level * 12 }}>
                  <legend>
                    <span className="html" dangerouslySetInnerHTML={{ __html: `${q.number ? q.number + '. ' : ''}${q.html}` }} />
                  </legend>
                  {q.answers.length > 0 && (
                    <div className="choices">
                      {q.answers.map((a) => (
                        <label key={a.id} className="choice">
                          <input type="radio" name={`q-${q.id}`} value={a.id} checked={answers[q.id]?.answer === a.id} onChange={() => set(q.id, { answer: a.id })} />
                          <span dangerouslySetInnerHTML={{ __html: a.html }} />
                        </label>
                      ))}
                    </div>
                  )}
                  {q.allowComment && (
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span className="meta-line">Komentarz (opcjonalnie)</span>
                      <textarea className="input" maxLength={q.commentLength ?? 3000} value={answers[q.id]?.comment ?? ''} onChange={(e) => set(q.id, { comment: e.target.value })} />
                    </label>
                  )}
                </fieldset>
              ),
            )}
            {s.hasFinalComment && (
              <label className="q" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontWeight: 600 }}>Uwagi końcowe (opcjonalnie)</span>
                <textarea className="input" maxLength={3000} value={comment} onChange={(e) => setComment(e.target.value)} />
              </label>
            )}
            <button className="btn btn-primary" disabled={busy}>{busy ? 'Wysyłanie…' : 'Wyślij ankietę'}</button>
          </form>
        )
      ) : null}
    </>
  );
}

'use client';
import { useState } from 'react';
import { invalidate, postJson, useApi } from '@/lib/client';
import type { AdmDocument } from '@/lib/usos-studies';
import { External, FileText } from '../Icons';
import { Empty, fmtDate, LoadError, PageHead, Skeleton } from '../ui';

export default function DocumentsView() {
  const api = useApi<{ documents: AdmDocument[]; usoswebUrl: string }>('/api/dokumenty');
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function receive(d: AdmDocument) {
    if (!window.confirm(`Potwierdzić odbiór dokumentu „${d.name}”? USOS zapisze datę doręczenia.`)) return;
    setBusy(d.id);
    const err = await postJson(`/api/dokumenty/${encodeURIComponent(d.id)}`, {});
    setBusy(null);
    setMsg(err ?? 'Odebrano — teraz możesz pobrać dokument.');
    invalidate('/api/dokumenty');
    api.reload();
  }

  return (
    <>
      <PageHead eyebrow="Decyzje, pisma, zaświadczenia" title="Dokumenty" />
      <LoadError api={api} />
      {msg && <div className="notice" role="status">{msg}</div>}
      {api.loading && !api.data ? (
        <Skeleton n={3} h={70} />
      ) : api.data ? (
        <>
          {api.data.documents.length ? (
            <div className="list">
              {api.data.documents.map((d) => (
                <div key={d.id} className="row" style={{ alignItems: 'center' }}>
                  <span className="avatar" style={{ background: 'var(--ok-bg)', color: 'var(--ok-ink)', borderRadius: 12 }}><FileText size={18} /></span>
                  <div className="grow">
                    <span className="t1">{d.name}</span>
                    <span className="t2">{[d.type, d.status, d.published && fmtDate(d.published)].filter(Boolean).join(' · ')}</span>
                  </div>
                  {d.canReceive ? (
                    <button className="btn btn-primary btn-sm" disabled={busy === d.id} onClick={() => receive(d)}>Odbierz</button>
                  ) : d.canDownload ? (
                    <a href={`/api/dokumenty/${encodeURIComponent(d.id)}`} target="_blank" rel="noopener" className="btn btn-ghost btn-sm" style={{ background: 'var(--surface-2)' }}>Pobierz</a>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <Empty title="Brak dokumentów">Gdy uczelnia wyśle Ci decyzję albo pismo przez USOS, pojawi się tutaj.</Empty>
          )}
          <div className="notice">
            <b>Zaświadczenie o studiowaniu</b>
            <span>Wniosek o zaświadczenie (np. do ZUS, banku, ulgi) składa się w USOSweb albo w sekretariacie — gotowe dokumenty pojawią się na tej liście.</span>
            <a href={api.data.usoswebUrl} target="_blank" rel="noopener noreferrer">Otwórz USOSweb <External size={13} /></a>
          </div>
        </>
      ) : null}
    </>
  );
}

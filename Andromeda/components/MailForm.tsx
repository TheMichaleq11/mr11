'use client';
import { useState } from 'react';
import { postJson } from '@/lib/client';
import { Mail } from './Icons';

/** Formularz wiadomości wysyłanej przez pocztę USOS (z adresu uczelnianego). */
export default function MailForm({ to, userIds, onClose }: { to: string; userIds: string[]; onClose: () => void }) {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [copy, setCopy] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!window.confirm(`Wysłać wiadomość do: ${to}?`)) return;
    setBusy(true);
    const err = await postJson('/api/poczta', { userIds, subject, content, copyToMe: copy });
    setBusy(false);
    if (err) setMsg({ ok: false, text: err });
    else {
      setMsg({ ok: true, text: 'Wysłano przez pocztę USOS.' });
      setSubject('');
      setContent('');
    }
  }

  return (
    <form onSubmit={send} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <b style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Mail /> Do: {to}</b>
        <button type="button" className="btn btn-ghost btn-sm" style={{ background: 'var(--surface-2)' }} onClick={onClose}>Zamknij</button>
      </div>
      {msg && <div className={`notice ${msg.ok ? '' : 'warn'}`} role="status">{msg.text}</div>}
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span className="meta-line">Temat</span>
        <input className="input" style={{ minHeight: 48, borderRadius: 14, border: '1px solid var(--line-strong)', background: 'var(--surface)', color: 'var(--ink)', padding: '0 12px', fontFamily: 'inherit', fontSize: 16 }} maxLength={200} value={subject} onChange={(e) => setSubject(e.target.value)} required />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span className="meta-line">Treść</span>
        <textarea className="input" style={{ minHeight: 160 }} maxLength={15000} value={content} onChange={(e) => setContent(e.target.value)} required />
      </label>
      <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 15, minHeight: 44 }}>
        <input type="checkbox" checked={copy} onChange={(e) => setCopy(e.target.checked)} style={{ width: 20, height: 20 }} />
        Wyślij kopię do mnie
      </label>
      <button className="btn btn-primary" disabled={busy}>{busy ? 'Wysyłanie…' : 'Wyślij'}</button>
      <span className="meta-line">Wiadomość wyjdzie z Twojego adresu uczelnianego przez pocztę USOS.</span>
    </form>
  );
}

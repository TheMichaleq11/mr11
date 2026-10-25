'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useApi } from '@/lib/client';
import type { GradesResponse } from '@/lib/types';
import type { Person, PersonHit } from '@/lib/usos-courses';
import { useDebounced } from '@/lib/useDebounced';
import { ChevronLeft, ChevronRight, External, Mail, MapPin, Search } from '../Icons';
import MailForm from '../MailForm';
import { WeekActivities } from './RoomView';
import { courseHref, Empty, LoadError, PageHead, Skeleton } from '../ui';

const initial = (name: string) => name.replace(/^((prof\.|dr|hab\.|mgr|inż\.|lic\.)\s*)+/g, '').charAt(0) || '·';

export function PeopleList() {
  const [q, setQ] = useState('');
  const dq = useDebounced(q.trim());
  const search = useApi<{ items: PersonHit[] }>(dq.length >= 2 ? `/api/osoby?q=${encodeURIComponent(dq)}` : null);
  const grades = useApi<GradesResponse>('/api/grades');
  const myLecturers = [...new Set((grades.data?.courses ?? []).flatMap((c) => c.lecturers))].sort((a, b) => a.localeCompare(b, 'pl'));

  return (
    <>
      <PageHead eyebrow="Dyżury, pokoje, kontakt" title="Prowadzący" />
      <label className="searchbox">
        <Search />
        <span className="sr-only">Szukaj prowadzącego</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Imię lub nazwisko prowadzącego" />
      </label>
      {dq.length >= 2 ? (
        <>
          <LoadError api={search} />
          {search.loading && !search.data ? (
            <Skeleton n={3} h={56} />
          ) : search.data?.items.length ? (
            <div className="list">
              {search.data.items.map((p) => (
                <Link key={p.id} href={`/osoby/${encodeURIComponent(p.id)}`} className="row">
                  <span className="avatar">{initial(p.name)}</span>
                  <div className="grow">
                    <span className="t1">{p.name}</span>
                  </div>
                  <span style={{ color: 'var(--muted)' }}><ChevronRight /></span>
                </Link>
              ))}
            </div>
          ) : (
            search.data && <Empty title="Nie znaleziono" />
          )}
        </>
      ) : myLecturers.length ? (
        <section className="section">
          <h2 className="h2">Twoi prowadzący</h2>
          <div className="list">
            {myLecturers.map((n) => (
              <button key={n} className="row" style={{ border: 'none', background: 'none', textAlign: 'left', fontFamily: 'inherit', width: '100%', cursor: 'pointer' }} onClick={() => setQ(n.replace(/^((prof\.|dr|hab\.|mgr|inż\.|lic\.)\s*)+/g, ''))}>
                <span className="avatar">{initial(n)}</span>
                <div className="grow">
                  <span className="t1">{n}</span>
                </div>
                <span style={{ color: 'var(--muted)' }}><Search /></span>
              </button>
            ))}
          </div>
          <span className="meta-line">Kliknij, żeby znaleźć dyżury i kontakt. Pełne profile są też pod każdym przedmiotem.</span>
        </section>
      ) : null}
    </>
  );
}

export function PersonView({ id }: { id: string }) {
  const api = useApi<Person>(`/api/osoby/${encodeURIComponent(id)}`);
  const p = api.data;
  const full = p ? [p.titlesBefore, p.name, p.titlesAfter].filter(Boolean).join(' ') : '';
  const [mail, setMail] = useState(false);

  return (
    <>
      <Link href="/osoby" className="icon-btn" aria-label="Wróć do prowadzących"><ChevronLeft size={20} /></Link>
      <LoadError api={api} />
      {api.loading && !p ? (
        <Skeleton n={3} h={100} />
      ) : p ? (
        <>
          <section className="card card-pad" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {p.photo ? <img className="photo" src={p.photo} alt="" /> : <span className="avatar" style={{ width: 72, height: 72, borderRadius: 36, fontSize: 26 }}>{initial(p.name)}</span>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.15 }}>{full}</h1>
              {p.positions.map((pos) => <span key={pos} className="meta-line">{pos}</span>)}
            </div>
          </section>

          {p.officeHours && (
            <section className="notice">
              <b>Dyżur</b>
              <span style={{ whiteSpace: 'pre-line' }}>{p.officeHours}</span>
            </section>
          )}

          <div className="card" style={{ padding: '4px 16px' }}>
            {p.room && (
              <div className="kv">
                <span>Pokój</span>
                <span>
                  {[p.room.number, p.room.buildingName].filter(Boolean).join(', ')}
                  {p.room.buildingId && (
                    <>
                      {' '}
                      <Link href={`/budynki/${encodeURIComponent(p.room.buildingId)}`} aria-label="Pokaż budynek" style={{ display: 'inline-flex', verticalAlign: 'middle' }}>
                        <MapPin size={18} />
                      </Link>
                    </>
                  )}
                </span>
              </div>
            )}
            {p.phones.map((ph) => (
              <div className="kv" key={ph}>
                <span>Telefon</span>
                <span><a href={`tel:${ph.replace(/\s/g, '')}`}>{ph}</a></span>
              </div>
            ))}
            {!p.room && !p.phones.length && <div className="kv"><span>Kontakt</span><span>brak danych w USOS</span></div>}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => setMail((v) => !v)}><Mail /> Napisz przez USOS</button>
            <Link href={`/osoby/${encodeURIComponent(p.id)}/plan`} className="btn btn-ghost">Plan zajęć</Link>
            {p.emailUrl && <a href={p.emailUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost"><External size={18} /> Pokaż e-mail</a>}
            {p.homepage && <a href={p.homepage} target="_blank" rel="noopener noreferrer" className="btn btn-ghost"><External size={18} /> Strona domowa</a>}
            {p.profileUrl && <a href={p.profileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost"><External size={18} /> Profil w USOSweb</a>}
          </div>

          {mail && <MailForm to={full} userIds={[p.id]} onClose={() => setMail(false)} />}

          {p.courses.length > 0 && (
            <section className="section">
              <h2 className="h2">Prowadzi teraz</h2>
              <div className="list">
                {p.courses.map((c) => (
                  <Link key={c.id + c.termId} href={courseHref(c.id, c.termId)} className="row">
                    <div className="grow">
                      <span className="t1">{c.name}</span>
                      {c.termName && <span className="t2">{c.termName}</span>}
                    </div>
                    <span style={{ color: 'var(--muted)' }}><ChevronRight /></span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      ) : null}
    </>
  );
}

export function PersonPlan({ id }: { id: string }) {
  const api = useApi<Person>(`/api/osoby/${encodeURIComponent(id)}`);
  const p = api.data;
  return (
    <WeekActivities
      url={(s) => `/api/osoby/${encodeURIComponent(id)}/plan?start=${s}`}
      eyebrow="Plan zajęć prowadzącego"
      title={p ? [p.titlesBefore, p.name].filter(Boolean).join(' ') : '…'}
      back={{ href: `/osoby/${encodeURIComponent(id)}`, label: 'Wróć do profilu' }}
    />
  );
}

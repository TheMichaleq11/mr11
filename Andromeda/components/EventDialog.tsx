'use client';
// Okienko z informacjami o zajęciach (po kliknięciu w planie).
// Komputer/tablet: okno na środku, tło przyciemnione. Telefon: arkusz wysuwany od dołu (zsuwa się palcem).
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { typeColor } from '@/lib/colors';
import { dayOf, hhmm, longDate, today } from '@/lib/dates';
import type { ClassEvent } from '@/lib/types';
import { Clock, Close, MapPin, User } from './Icons';

const mins = (iso: string) => {
  const [h, m] = hhmm(iso).split(':').map(Number);
  return h * 60 + m;
};

export default function EventDialog({ e, onClose }: { e: ClassEvent; onClose: () => void }) {
  const [closing, setClosing] = useState(false);
  const [drag, setDrag] = useState(0);
  const startY = useRef<number | null>(null);
  const close = () => {
    setClosing(true);
    window.setTimeout(onClose, 220);
  };
  useEffect(() => {
    const k = (ev: KeyboardEvent) => ev.key === 'Escape' && close();
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const color = e.kind === 'exam' ? 'var(--warn)' : typeColor(e.classType);
  const len = mins(e.end) - mins(e.start);
  // postęp zajęć, gdy trwają teraz
  const now = new Date();
  const nowM = now.getHours() * 60 + now.getMinutes();
  const d = dayOf(e.start);
  const t = today();
  const progress = d === t ? Math.min(1, Math.max(0, (nowM - mins(e.start)) / len)) : d < t ? 1 : 0;
  const placeHref = e.roomId ? `/sale/${encodeURIComponent(e.roomId)}` : e.buildingId ? `/budynki/${encodeURIComponent(e.buildingId)}` : null;
  const roomName = e.room ? (/^\d/.test(e.room) ? `sala ${e.room}` : e.room) : null;

  // na wierzch strony (poza panelem z animacją, który ograniczałby okno do swojego obszaru)
  return createPortal(
    <div className={`evd${closing ? ' out' : ''}`} role="dialog" aria-modal="true" aria-label={e.courseName}>
      <div className="evd-bk" onClick={close} />
      <div
        className="evd-card"
        style={{ '--c': color, transform: drag ? `translateY(${drag}px)` : undefined } as React.CSSProperties}
        onTouchStart={(t) => (startY.current = t.touches[0].clientY)}
        onTouchMove={(t) => startY.current !== null && setDrag(Math.max(0, t.touches[0].clientY - startY.current))}
        onTouchEnd={() => {
          if (drag > 90) close();
          else setDrag(0);
          startY.current = null;
        }}
      >
        <button className="evd-x" onClick={close} aria-label="Zamknij">
          <Close />
        </button>
        {/* kolorowy nagłówek w kolorze typu zajęć, ze smugą światła jak karta „Teraz” */}
        <div className="evd-head">
          <span className="evd-grip" aria-hidden="true" />
          <span className="evd-type"><i />{e.kind === 'exam' ? 'Egzamin' : e.classType ?? 'Zajęcia'}</span>
          <h3 className="evd-title">{e.courseName}</h3>
          <div className="evd-prog">
            <span className="num">{hhmm(e.start)}</span>
            <span className="track"><i style={{ width: `${progress * 100}%` }} /></span>
            <span className="num">{hhmm(e.end)}</span>
          </div>
        </div>
        <div className="evd-body">
        <div className="evd-row">
          <span className="ic"><Clock /></span>
          <div>
            <b>{longDate(dayOf(e.start))} · {hhmm(e.start)}–{hhmm(e.end)}</b>
            <span>{len} minut</span>
          </div>
        </div>
        {(roomName || e.building) && (
          <div className="evd-row">
            <span className="ic"><MapPin size={16} /></span>
            <div>
              <b>{roomName ?? e.building}</b>
              {roomName && e.building && <span>{e.building}</span>}
            </div>
          </div>
        )}
        {(e.lecturers.length > 0 || e.group) && (
          <div className="evd-row">
            <span className="ic"><User /></span>
            <div>
              <b>{e.lecturers.join(', ') || 'Prowadzący'}</b>
              <span>{['prowadzący', e.group ? `grupa ${e.group}` : null].filter(Boolean).join(' · ')}</span>
            </div>
          </div>
        )}
        <div className="evd-acts">
          {e.courseId && (
            <Link href={`/przedmioty/${encodeURIComponent(e.courseId)}`} className="evd-btn p" onClick={onClose}>
              Przedmiot
            </Link>
          )}
          {placeHref && (
            <Link href={placeHref} className="evd-btn" onClick={onClose}>
              {e.roomId ? 'Sala na mapie' : 'Mapa budynku'}
            </Link>
          )}
        </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

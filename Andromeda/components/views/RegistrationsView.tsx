'use client';
import { useMemo, useState } from 'react';
import { invalidate, postJson, useApi } from '@/lib/client';
import type { RegCourse, Registration, RegistrationsResponse, RegRound } from '@/lib/types-more';
import { External, Search } from '../Icons';
import { Empty, fmtDate, LoadError, PageHead, Skeleton } from '../ui';
import { CartSection } from './ExtraSections';

const roundTag: Record<string, [string, string]> = {
  active: ['Trwa', 'good'],
  preparing: ['Wkrótce', 'warn'],
  closed: ['Zakończona', 'none'],
};

const myStatusLabel: Record<string, [string, string]> = {
  accepted: ['Zapisany', 'good'],
  ask: ['Czeka na decyzję', 'warn'],
  refused: ['Odrzucony', 'bad'],
  refused_permanently: ['Odrzucony', 'bad'],
  cancelled: ['Wypisany', 'none'],
  cancelled_ask: ['Wypisany', 'none'],
};

function CourseRow({ c, round, onDone }: { c: RegCourse; round: RegRound; onDone: (msg: string) => void }) {
  const [busy, setBusy] = useState(false);
  const full = c.limit !== null && c.count !== null && c.count >= c.limit;
  const mine = c.myStatus ? myStatusLabel[c.myStatus] : null;

  async function act(action: 'register' | 'unregister') {
    const verb = action === 'register' ? 'Zapisać się na' : 'Wypisać się z';
    if (!window.confirm(`${verb} „${c.courseName}”?`)) return;
    setBusy(true);
    const err = await postJson('/api/zapisy', { action, roundId: round.id, courseId: c.courseId, termId: c.termId });
    setBusy(false);
    onDone(err ?? (action === 'register' ? `Zapisano na „${c.courseName}”.` : `Wypisano z „${c.courseName}”.`));
  }

  return (
    <div className="reg-row">
      <div className="grow">
        <span className="t1">{c.courseName}</span>
        <span className="meta-line num">
          {c.limit !== null ? `Miejsca: ${c.count ?? 0} / ${c.limit}` : c.count !== null ? `Zapisanych: ${c.count}` : c.courseId}
          {full && !mine ? ' · brak miejsc' : ''}
        </span>
        {mine && (
          <span>
            <span className={`tag ${mine[1]}`}>{mine[0]}</span>
          </span>
        )}
      </div>
      {c.canUnregister ? (
        <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => act('unregister')}>
          {busy ? '…' : 'Wypisz'}
        </button>
      ) : c.canRegister ? (
        <button className="btn btn-primary btn-sm" disabled={busy || full} onClick={() => act('register')}>
          {busy ? '…' : full ? 'Pełne' : 'Zapisz'}
        </button>
      ) : null}
    </div>
  );
}

function RoundBlock({ round, onDone }: { round: RegRound; onDone: (m: string) => void }) {
  const [q, setQ] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);
  const tag = roundTag[round.status] ?? [round.status, 'none'];
  const courses = round.courses ?? [];
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return courses.filter(
      (c) =>
        (!onlyMine || c.myStatus === 'accepted' || c.myStatus === 'ask') &&
        (!needle || c.courseName.toLowerCase().includes(needle) || c.courseId.toLowerCase().includes(needle)),
    );
  }, [courses, q, onlyMine]);
  const myCount = courses.filter((c) => c.myStatus === 'accepted' || c.myStatus === 'ask').length;

  return (
    <div className="round">
      <div className="round-head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <b style={{ fontSize: 16 }}>{round.name}</b>
          <span className="meta-line">
            {fmtDate(round.start, true)} – {fmtDate(round.end, true)}
            {round.selectionLimit ? ` · limit wyborów: ${round.selectionLimit}` : ''}
            {myCount ? ` · Twoje zapisy: ${myCount}` : ''}
          </span>
        </div>
        <span className={`tag ${tag[1]}`}>{tag[0]}</span>
      </div>

      {round.courses && round.courses.length > 6 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <label className="searchbox" style={{ flex: '1 1 220px' }}>
            <Search />
            <span className="sr-only">Szukaj przedmiotu</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Szukaj przedmiotu" />
          </label>
          <div className="seg" role="group" aria-label="Filtr">
            <button aria-pressed={!onlyMine} onClick={() => setOnlyMine(false)}>Wszystkie</button>
            <button aria-pressed={onlyMine} onClick={() => setOnlyMine(true)}>Moje</button>
          </div>
        </div>
      )}

      {round.courses === null ? null : courses.length === 0 ? (
        <span className="meta-line">{round.status === 'preparing' ? 'Lista przedmiotów pojawi się przed startem tury.' : 'Brak przedmiotów w tej turze.'}</span>
      ) : shown.length ? (
        <div>{shown.slice(0, 150).map((c) => <CourseRow key={c.courseId + c.termId} c={c} round={round} onDone={onDone} />)}</div>
      ) : (
        <span className="meta-line">Nic nie pasuje do wyszukiwania.</span>
      )}
      {shown.length > 150 && <span className="meta-line">Pokazuję 150 z {shown.length} — zawęź wyszukiwanie.</span>}
    </div>
  );
}

function RegistrationCard({ r, web, onDone }: { r: Registration; web: string; onDone: (m: string) => void }) {
  const active = r.rounds.some((x) => x.status === 'active');
  return (
    <section className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <h2 className="h2">{r.name}</h2>
          <span className="meta-line">{[r.kind === 'żetonowa' ? 'Rejestracja żetonowa' : null, r.faculty].filter(Boolean).join(' · ')}</span>
        </div>
        {active && <span className="tag good">Otwarta</span>}
      </div>
      {r.message && <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>{r.message}</p>}
      {r.rounds.map((round) => <RoundBlock key={round.id} round={round} onDone={onDone} />)}
      {(r.kind === 'żetonowa' || r.rounds.length === 0) && (
        <a href={`${web}/kontroler.php?_action=dla_stud/rejestracja/kalendarz`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', background: 'var(--surface-2)' }}>
          <External size={16} /> Otwórz w USOSweb
        </a>
      )}
    </section>
  );
}

export default function RegistrationsView() {
  const api = useApi<RegistrationsResponse>('/api/zapisy');
  const [flash, setFlash] = useState<string | null>(null);
  const data = api.data;

  const onDone = (msg: string) => {
    setFlash(msg);
    invalidate('/api/zapisy');
    invalidate('/api/grades');
    api.reload();
  };

  const sorted = useMemo(() => {
    const score = (r: Registration) =>
      r.rounds.some((x) => x.status === 'active') ? 0 : r.rounds.some((x) => x.status === 'preparing') ? 1 : 2;
    return [...(data?.registrations ?? [])].sort((a, b) => score(a) - score(b));
  }, [data]);

  return (
    <>
      <PageHead eyebrow="Rejestracje na zajęcia" title="Zapisy" />
      <LoadError api={api} />
      {flash && (
        <div className="notice" role="status">
          <span>{flash}</span>
        </div>
      )}
      {api.loading && !data ? (
        <Skeleton n={2} h={160} />
      ) : data ? (
        sorted.length ? (
          sorted.map((r) => <RegistrationCard key={r.id} r={r} web={data.usoswebUrl} onDone={onDone} />)
        ) : (
          <Empty title="Brak otwartych rejestracji">Gdy wydział otworzy zapisy, pojawią się tutaj.</Empty>
        )
      ) : null}
      {data && (
        <p className="meta-line" style={{ lineHeight: 1.5 }}>
          Zapis do konkretnej grupy zajęciowej (np. wybór godziny ćwiczeń) robi się w USOSweb —{' '}
          <a href={`${data.usoswebUrl}/kontroler.php?_action=dla_stud/rejestracja/kalendarz`} target="_blank" rel="noopener noreferrer">
            otwórz rejestracje w USOSweb
          </a>
          .
        </p>
      )}
      <CartSection />
    </>
  );
}

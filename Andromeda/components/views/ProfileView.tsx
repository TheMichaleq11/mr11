'use client';
import { useApi } from '@/lib/client';
import { today } from '@/lib/dates';
import type { PaymentsResponse, ProfileResponse } from '@/lib/types-more';
import { External, LogOut } from '../Icons';
import { Empty, fmtDate, LoadError, PageHead, ScopeBox, Skeleton } from '../ui';

const cardType: Record<string, string> = {
  student: 'Legitymacja studencka',
  phd: 'Legitymacja doktoranta',
  staff: 'Legitymacja pracownika',
  graduate: 'Karta absolwenta',
  academic_teacher: 'Legitymacja nauczyciela',
};

const progStatus: Record<string, string> = {
  active: 'aktywny',
  graduated_before_diploma: 'przed dyplomem',
  graduated_diploma: 'ukończony',
  cancelled: 'skreślony',
};

function daysLeft(iso: string | null): number | null {
  if (!iso) return null;
  return Math.round((new Date(iso.slice(0, 10) + 'T12:00:00').getTime() - new Date(today() + 'T12:00:00').getTime()) / 86400000);
}

export function ProfileView() {
  const api = useApi<ProfileResponse>('/api/profil');
  const p = api.data;

  return (
    <>
      <PageHead eyebrow="Twoje dane w USOS" title="Profil" />
      <LoadError api={api} />
      {api.loading && !p ? (
        <Skeleton n={3} h={120} />
      ) : p ? (
        <>
          <section className="card card-pad" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {p.photo ? <img className="photo" src={p.photo} alt="" /> : <span className="avatar" style={{ width: 72, height: 72, borderRadius: 36, fontSize: 24 }}>{`${p.firstName[0] ?? ''}${p.lastName[0] ?? ''}`}</span>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{p.firstName} {p.lastName}</span>
              {p.studentNumber && <span className="meta-line num">Nr albumu: {p.studentNumber}</span>}
            </div>
          </section>

          {p.cards === null ? (
            <ScopeBox />
          ) : p.cards.length ? (
            p.cards.map((c, i) => {
              const left = daysLeft(c.expires);
              return (
                <section key={i} className="section">
                  <div className="id-card">
                    <div className="row1">
                      <span className="lab">{cardType[c.type] ?? 'Legitymacja'}</span>
                      <span style={{ fontWeight: 700 }}>UJ</span>
                    </div>
                    <span className="name">{p.firstName} {p.lastName}</span>
                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                      <div><div className="lab">Nr albumu</div><div className="val num">{p.studentNumber ?? '—'}</div></div>
                      <div><div className="lab">Ważna do</div><div className="val num">{fmtDate(c.expires) || '—'}</div></div>
                    </div>
                  </div>
                  {left !== null && left <= 30 && (
                    <div className={`notice ${left < 0 ? '' : 'warn'}`} role="status">
                      {left < 0 ? 'Legitymacja straciła ważność — przedłuż ją w dziekanacie.' : `Legitymacja traci ważność za ${left} dni — pamiętaj o przedłużeniu.`}
                    </div>
                  )}
                  <p className="meta-line">To podgląd danych z USOS — nie zastępuje legitymacji ani mLegitymacji w mObywatelu.</p>
                </section>
              );
            })
          ) : (
            <Empty title="Brak legitymacji w USOS" />
          )}

          <section className="section">
            <h2 className="h2">Dane</h2>
            <div className="card" style={{ padding: '4px 16px' }}>
              <div className="kv"><span>Nr albumu</span><span className="num">{p.studentNumber ?? '—'}</span></div>
              <div className="kv"><span>E-mail</span><span>{p.email ?? (p.missing.includes('e-mail') ? 'wymaga ponownej zgody' : '—')}</span></div>
              {p.cards?.[0]?.number && <div className="kv"><span>Nr legitymacji</span><span className="num">{p.cards[0].number}</span></div>}
            </div>
          </section>

          {p.programmes.length > 0 && (
            <section className="section">
              <h2 className="h2">Kierunki</h2>
              <div className="list">
                {p.programmes.map((pr, i) => (
                  <div className="row" key={i}>
                    <div className="grow">
                      <span className="t1">{pr.name}</span>
                      <span className="t2">{[pr.faculty, pr.admission && `od ${fmtDate(pr.admission)}`].filter(Boolean).join(' · ')}</span>
                    </div>
                    {pr.status && <span className={`tag ${pr.status === 'active' ? 'good' : 'none'}`}>{progStatus[pr.status] ?? pr.status}</span>}
                  </div>
                ))}
              </div>
            </section>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a href={p.usoswebUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost"><External size={18} /> Otwórz USOSweb</a>
            <form action="/api/auth/logout" method="post">
              <button className="btn btn-ghost"><LogOut /> Wyloguj</button>
            </form>
          </div>
        </>
      ) : null}
    </>
  );
}

const payState: Record<string, [string, string]> = {
  paid: ['Opłacona', 'good'],
  settled: ['Rozliczona', 'good'],
  unpaid: ['Do zapłaty', 'warn'],
  not_paid: ['Do zapłaty', 'warn'],
  partially_paid: ['Częściowo', 'warn'],
  overdue: ['Po terminie', 'bad'],
  cancelled: ['Anulowana', 'none'],
};

const money = (n: number | null, cur: string) =>
  n === null ? '—' : new Intl.NumberFormat('pl-PL', { style: 'currency', currency: cur || 'PLN' }).format(n);

export function PaymentsView() {
  const api = useApi<PaymentsResponse>('/api/platnosci');
  const list = api.data?.payments ?? [];
  const due = list.filter((p) => (p.remaining ?? 0) > 0);
  const total = due.reduce((s, p) => s + (p.remaining ?? 0), 0);

  return (
    <>
      <PageHead eyebrow="Opłaty i należności" title="Płatności" />
      <LoadError api={api} />
      {api.loading && !api.data ? (
        <Skeleton n={3} h={72} />
      ) : api.data ? (
        <>
          <section className="summary">
            <span className="lab">Do zapłaty</span>
            <span className="avg num">{money(total, due[0]?.currency ?? 'PLN')}</span>
            <span className="note">{due.length ? `${due.length} ${due.length === 1 ? 'należność' : 'należności'}` : 'Wszystko opłacone'}</span>
          </section>
          {list.length ? (
            <div className="list">
              {list.map((p) => {
                const st = (p.state && payState[p.state]) || [(p.remaining ?? 0) > 0 ? 'Do zapłaty' : p.state ?? '—', (p.remaining ?? 0) > 0 ? 'warn' : 'none'];
                return (
                  <div className="row" key={p.id} style={{ alignItems: 'flex-start' }}>
                    <div className="grow">
                      <span className="t1">{p.description}</span>
                      <span className="t2 num">
                        {[money(p.amount, p.currency), p.deadline && `termin ${fmtDate(p.deadline)}`].filter(Boolean).join(' · ')}
                      </span>
                      {p.account && (p.remaining ?? 0) > 0 && <span className="t2 num" style={{ overflowWrap: 'anywhere' }}>Konto: {p.account}</span>}
                    </div>
                    <span className={`tag ${st[1]}`}>{st[0]}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty title="Brak płatności">USOS nie ma żadnych należności na Twoim koncie.</Empty>
          )}
        </>
      ) : null}
    </>
  );
}

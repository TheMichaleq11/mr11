'use client';
// Dodatkowe sekcje istniejących ekranów: najnowsze oceny, konta i zwroty, mLegitymacja,
// koszyk zapisów, grupy dziekańskie, własne grupy, wysłane wiadomości.
import Link from 'next/link';
import { useApi } from '@/lib/client';
import type { BankAccount, CartItem, CustomGroup, LatestGrade, MCard, Part, PrimaryGroup, Remittance, SentMessage } from '@/lib/usos-extra';
import { courseHref, fmtDate, ScopeBox } from '../ui';

/** Sekcja z danymi z jednej części; brak zgody → prośba o ponowne logowanie, brak modułu → nic. */
function Guard<T>({ part, children }: { part: Part<T> | undefined; children: (d: T) => React.ReactNode }) {
  if (!part) return null;
  if (part.scope) return <ScopeBox />;
  if (part.data == null) return null;
  return <>{children(part.data)}</>;
}

const gradeTone = (g: LatestGrade) => (g.passes === false ? 'bad' : /^(5|4,5|4\.5)/.test(g.value) ? 'good' : 'ok');

export function LatestGrades() {
  const api = useApi<{ latest: Part<LatestGrade[]> }>('/api/dodatki?co=oceny');
  return (
    <Guard part={api.data?.latest}>
      {(list) =>
        list.length ? (
          <section className="section">
            <div className="section-head ruled">
              <h2 className="h2">Nowe oceny</h2>
              <span className="meta-line">ostatnie 60 dni</span>
            </div>
            <div className="ledger">
              {list.map((g, i) => (
                <Link key={i} href={courseHref(g.courseId, g.termId)} className="row">
                  <div className="grow">
                    <span className="t1">{g.course}</span>
                    <span className="t2">{[g.kind, g.session && g.session > 1 ? `termin ${g.session}` : null, g.date && `wpisana ${fmtDate(g.date)}`].filter(Boolean).join(' · ')}</span>
                  </div>
                  <span className={`chip ${gradeTone(g)}`}>{g.value}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null
      }
    </Guard>
  );
}

const money = (v: number | null, cur = 'PLN') =>
  v == null ? '—' : new Intl.NumberFormat('pl-PL', { style: 'currency', currency: cur || 'PLN' }).format(v);

export function PaymentsExtra() {
  const api = useApi<{ accounts: Part<BankAccount[]>; remittances: Part<Remittance[]> }>('/api/dodatki?co=platnosci');
  return (
    <>
      <Guard part={api.data?.accounts}>
        {(acc) =>
          acc.length ? (
            <section className="section">
              <div className="section-head ruled">
                <h2 className="h2">Twoje konta do wpłat</h2>
              </div>
              <div className="ledger">
                {acc.map((a, i) => (
                  <div key={i} className="row" style={{ alignItems: 'flex-start' }}>
                    <div className="grow">
                      <span className="t1">{a.name ?? 'Konto'}</span>
                      <span className="num" style={{ fontSize: 16, fontWeight: 600, letterSpacing: '0.02em', overflowWrap: 'anywhere' }}>{a.number}</span>
                      <span className="t2">{[a.owner, a.faculty, a.currency, a.swift && `SWIFT ${a.swift}`].filter(Boolean).join(' · ')}</span>
                      {a.titlePrefix && <span className="t2">Tytuł przelewu zaczynaj od: „{a.titlePrefix}”</span>}
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard?.writeText(a.number.replace(/\s/g, ''))}>Kopiuj</button>
                  </div>
                ))}
              </div>
            </section>
          ) : null
        }
      </Guard>
      <Guard part={api.data?.remittances}>
        {(rem) =>
          rem.length ? (
            <section className="section">
              <div className="section-head ruled">
                <h2 className="h2">Zwroty</h2>
              </div>
              <div className="ledger">
                {rem.map((r) => (
                  <div key={r.id} className="row">
                    <div className="grow">
                      <span className="t1">{r.description}</span>
                      <span className="t2 num">{[money(r.amount), r.date && fmtDate(r.date)].filter(Boolean).join(' · ')}</span>
                    </div>
                    <span className={`tag ${r.settled ? 'good' : 'warn'}`}>{r.settled ? 'Rozliczony' : 'W toku'}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null
        }
      </Guard>
    </>
  );
}

const mStatus: Record<string, [string, string]> = {
  pending: ['Zamówiona — czeka na wysłanie', 'warn'],
  in_progress: ['W przygotowaniu', 'warn'],
  ready_to_receive: ['Gotowa do pobrania w mObywatelu', 'good'],
  received: ['Aktywna w mObywatelu', 'good'],
  error: ['Błąd zamówienia', 'bad'],
  revoked_by_me: ['Unieważniona przez Ciebie', 'none'],
  revoked: ['Unieważniona', 'none'],
};

export function ProfileExtra({ usoswebUrl }: { usoswebUrl?: string }) {
  const api = useApi<{ mcard: Part<MCard>; photo: Part<string | null> }>('/api/dodatki?co=profil');
  return (
    <>
      <Guard part={api.data?.mcard}>
        {(m) => {
          const st = m.order ? mStatus[m.order.status] ?? [m.order.status, 'none'] : null;
          return (
            <section className="section">
              <div className="section-head ruled">
                <h2 className="h2">mLegitymacja</h2>
                {st && <span className={`tag ${st[1]}`}>{st[0]}</span>}
              </div>
              {m.order ? (
                <div className="ledger">
                  {m.order.date && <div className="kv"><span>Zamówiona</span><span>{fmtDate(m.order.date)}</span></div>}
                  {m.order.expiry && <div className="kv"><span>Ważna do</span><span>{fmtDate(m.order.expiry)}</span></div>}
                  {m.order.token && <div className="kv"><span>Kod do mObywatela</span><span className="num">{m.order.token}</span></div>}
                  {m.order.pass && <div className="kv"><span>Hasło</span><span className="num">{m.order.pass}</span></div>}
                </div>
              ) : (
                <p className="meta-line" style={{ fontSize: 14 }}>
                  {m.whyCannotOrder ?? 'Nie masz jeszcze mLegitymacji. Możesz ją zamówić w USOSweb — pojawi się w aplikacji mObywatel.'}
                </p>
              )}
              {usoswebUrl && !m.order && !m.whyCannotOrder && (
                <a className="link-sm" href={usoswebUrl} target="_blank" rel="noopener noreferrer">Zamów w USOSweb</a>
              )}
            </section>
          );
        }}
      </Guard>
      <Guard part={api.data?.photo}>
        {(desc) =>
          desc ? (
            <section className="section">
              <div className="section-head ruled">
                <h2 className="h2">Kto widzi Twoje zdjęcie</h2>
              </div>
              <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55, maxWidth: '64ch' }}>{desc}</p>
            </section>
          ) : null
        }
      </Guard>
    </>
  );
}

const cartStatus: Record<string, [string, string]> = {
  accepted: ['Zapisany', 'good'],
  ask: ['Czeka na decyzję', 'warn'],
  refused: ['Odrzucony', 'bad'],
  refused_permanently: ['Odrzucony', 'bad'],
  cancelled: ['Wypisany', 'none'],
  cancelled_ask: ['Wycofany', 'none'],
};

export function CartSection() {
  const api = useApi<{ cart: Part<CartItem[]> }>('/api/dodatki?co=koszyk');
  return (
    <Guard part={api.data?.cart}>
      {(cart) =>
        cart.length ? (
          <section className="section">
            <div className="section-head ruled">
              <h2 className="h2">Koszyk</h2>
              <span className="meta-line">przedmioty wybrane do zapisu</span>
            </div>
            <div className="ledger">
              {cart.map((c, i) => {
                const st = c.status ? cartStatus[c.status] ?? [c.status, 'none'] : ['W koszyku', 'ok'];
                return (
                  <Link key={i} href={courseHref(c.courseId, c.termId)} className="row">
                    <div className="grow">
                      <span className="t1">{c.course}</span>
                      <span className="t2 num">
                        {[c.term, c.limit != null && `miejsca ${c.count ?? '?'} / ${c.limit}`, c.choice && `wybór nr ${c.choice}`].filter(Boolean).join(' · ')}
                      </span>
                    </div>
                    <span className={`tag ${st[1]}`}>{st[0]}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null
      }
    </Guard>
  );
}

export function GroupsExtra() {
  const api = useApi<{ primary: Part<PrimaryGroup[]>; custom: Part<CustomGroup[]>; sent: Part<SentMessage[]> }>('/api/dodatki?co=grupy');
  return (
    <>
      <Guard part={api.data?.primary}>
        {(g) =>
          g.length ? (
            <section className="section">
              <div className="section-head ruled">
                <h2 className="h2">Grupy dziekańskie</h2>
              </div>
              <div className="ledger">
                {g.map((x) => (
                  <div key={x.id} className="row">
                    <div className="grow">
                      <span className="t1">{x.name}</span>
                      {x.members != null && <span className="t2">{x.members} osób</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null
        }
      </Guard>
      <Guard part={api.data?.custom}>
        {(g) =>
          g.length ? (
            <section className="section">
              <div className="section-head ruled">
                <h2 className="h2">Twoje własne grupy</h2>
              </div>
              <div className="ledger">
                {g.map((x) => (
                  <div key={x.id} className="row"><div className="grow"><span className="t1">{x.name}</span></div></div>
                ))}
              </div>
            </section>
          ) : null
        }
      </Guard>
      <Guard part={api.data?.sent}>
        {(m) =>
          m.length ? (
            <section className="section">
              <div className="section-head ruled">
                <h2 className="h2">Wysłane wiadomości</h2>
              </div>
              <div className="ledger">
                {m.map((x) => (
                  <div key={x.id} className="row">
                    <div className="grow">
                      <span className="t1">{x.subject}</span>
                      <span className="t2">{[x.date && fmtDate(x.date, true), x.recipients != null && `${x.recipients} odb.`].filter(Boolean).join(' · ')}</span>
                    </div>
                    <span className={`tag ${x.status === 'sent' ? 'good' : x.status === 'error' ? 'bad' : 'warn'}`}>
                      {x.status === 'sent' ? 'Wysłana' : x.status === 'error' ? 'Błąd' : 'Wysyłanie'}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : null
        }
      </Guard>
    </>
  );
}

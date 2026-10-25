// Kolejne moduły USOS API dostępne dla studenta na UJ:
// konsultacje i spotkania, obiegówki, testy poziomujące, przewodnik po uczelni, najnowsze oceny,
// konta do wpłat i zwroty, mLegitymacja, koszyk zapisów, grupy dziekańskie, własne grupy, wysłane wiadomości.
import type { Credentials } from './oauth';
import { cleanHtml, plainText } from './html';
import { pl, usosJson, UsosAuthError, UsosScopeError } from './usos';
import { tryFields } from './usos-more';

type Any = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const str = (v: unknown): string | null => (v === null || v === undefined || v === '' ? null : String(v));
const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const person = (u: Any | null | undefined) =>
  u ? [u.titles?.before, u.first_name, u.last_name].filter(Boolean).join(' ') || null : null;
const list = (v: unknown): Any[] => (Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v as Any).filter(Boolean) : []);

/** Część ekranu: dane albo informacja, że brakuje zgody (scope) / moduł jest niedostępny. */
export type Part<T> = { data: T | null; scope?: boolean; unavailable?: boolean };

/** Uruchamia zapytanie i zamienia brak zgody / błąd modułu na łagodną informację zamiast błędu całej strony. */
export async function soft<T>(fn: () => Promise<T>): Promise<Part<T>> {
  try {
    return { data: await fn() };
  } catch (e) {
    if (e instanceof UsosAuthError) throw e;
    if (e instanceof UsosScopeError) return { data: null, scope: true };
    console.error('[andromeda extra]', e);
    return { data: null, unavailable: true };
  }
}

// =====================================================================
// KONSULTACJE I SPOTKANIA (services/meetings)
// =====================================================================
export type Meeting = {
  id: string;
  name: string;
  comment: string | null;
  lecturer: string | null;
  lecturerId: string | null;
  facultyId: string | null;
  faculty: string | null;
  open: boolean;
  canAttend: boolean;
  autoAccept: boolean;
  soonest: string | null;
};
export type MeetingDate = {
  id: string;
  start: string;
  end: string | null;
  regStart: string | null;
  regEnd: string | null;
  seats: number | null;
  accepted: number | null;
  waiting: number | null;
  status: 'accepted' | 'waiting' | 'rejected' | 'token_created' | null;
  canSignUp: boolean;
  canSignOut: boolean;
  room: string | null;
  comment: string | null;
};
export type Substantiation = { id: string; name: string; message: string | null };
export type MeetingDetail = { meeting: Meeting; dates: MeetingDate[]; substantiations: Substantiation[] };

const MEETING_FIELDS = [
  'id|name|comment|open|can_i_attend|auto_accept|state|soonest_datetime|lecturer[id|first_name|last_name|titles]|faculty[id|name]',
  'id|name|comment|open|can_i_attend|soonest_datetime|lecturer|faculty',
  'id|name|comment|open',
];

function toMeeting(m: Any): Meeting {
  return {
    id: String(m.id),
    name: pl(m.name) || 'Spotkanie',
    comment: plainText(pl(m.comment)) || null,
    lecturer: person(m.lecturer),
    lecturerId: str(m.lecturer?.id),
    facultyId: str(m.faculty?.id),
    faculty: pl(m.faculty?.name) || null,
    open: Boolean(m.open),
    canAttend: m.can_i_attend !== false,
    autoAccept: Boolean(m.auto_accept),
    soonest: str(m.soonest_datetime),
  };
}

export async function fetchMeetings(creds: Credentials): Promise<Meeting[]> {
  const raw = await tryFields<Any[]>('meetings/available_meetings', creds, {}, MEETING_FIELDS);
  return list(raw)
    .filter((m) => !m.state || m.state === 'active')
    .map(toMeeting)
    .sort((a, b) => (a.soonest ?? '9999').localeCompare(b.soonest ?? '9999'));
}

export async function fetchMeetingDetail(creds: Credentials, meetingId: string): Promise<MeetingDetail> {
  const m = await tryFields<Any>('meetings/meeting', creds, { meeting_id: meetingId }, MEETING_FIELDS);
  const meeting = toMeeting(m);
  const datesRaw = await tryFields<Any[]>('meetings/search_meeting_dates', creds, { meeting_id: meetingId }, [
    'id|comment|start_time|end_time|registration_start_time|registration_end_time|seats_limit|accepted_participants_count|waiting_participants_count|user_status|can_i_sign_up|can_i_sign_out|room[id|number]',
    'id|comment|start_time|end_time|registration_start_time|registration_end_time|seats_limit|accepted_participants_count|waiting_participants_count|user_status|can_i_sign_up|can_i_sign_out',
    'id|start_time|end_time|seats_limit|user_status',
  ]);
  const dates: MeetingDate[] = list(datesRaw)
    .map((d) => ({
      id: String(d.id),
      start: String(d.start_time),
      end: str(d.end_time),
      regStart: str(d.registration_start_time),
      regEnd: str(d.registration_end_time),
      seats: num(d.seats_limit),
      accepted: num(d.accepted_participants_count),
      waiting: num(d.waiting_participants_count),
      status: (str(d.user_status) as MeetingDate['status']) ?? null,
      canSignUp: Boolean(d.can_i_sign_up),
      canSignOut: Boolean(d.can_i_sign_out),
      room: str(d.room?.number),
      comment: plainText(pl(d.comment)) || null,
    }))
    .sort((a, b) => a.start.localeCompare(b.start));

  let substantiations: Substantiation[] = [];
  if (meeting.facultyId) {
    try {
      const s = await usosJson<Any[]>('meetings/get_meeting_substantiations', creds, {
        fac_id: meeting.facultyId,
        fields: 'id|name|message|type',
      });
      substantiations = list(s)
        .filter((x) => !x.type || x.type === 'meeting')
        .map((x) => ({ id: String(x.id), name: pl(x.name) || 'Powód', message: plainText(pl(x.message)) || null }));
    } catch (e) {
      if (e instanceof UsosAuthError) throw e;
    }
  }
  return { meeting, dates, substantiations };
}

export async function meetingAction(
  creds: Credentials,
  action: 'sign_up' | 'sign_off',
  dateId: string,
  substantiationId?: string,
  message?: string,
): Promise<void> {
  if (action === 'sign_up') {
    const p: Record<string, string> = { meeting_date_id: dateId, substantiation_id: substantiationId ?? '' };
    if (message) p.substantiation_message = message;
    await usosJson('meetings/sign_up', creds, p);
  } else {
    await usosJson('meetings/sign_off', creds, { meeting_date_id: dateId });
  }
}

// =====================================================================
// OBIEGÓWKI (services/slips)
// =====================================================================
export type SlipQuestion = { question: string; status: 'pending' | 'cleared' | 'rejected' | 'unclear'; answer: string | null; answered: string | null; answerer: string | null };
export type Slip = { id: string; name: string; state: 'active' | 'closed' | string; created: string | null; closed: string | null; comment: string | null; issuer: string | null; questions: SlipQuestion[] };

export async function fetchSlips(creds: Credentials): Promise<Slip[]> {
  const res = await tryFields<Any>('slips/search_slips', creds, { langpref: 'pl', my_role: 'client', num: '20' }, [
    'id|state|date_created|date_last_closed|issuers_comment|template[id|name]|issuer|questions[question[question]|answer|answer_status|date_answered|answerer]',
    'id|state|date_created|template[id|name]|questions[question[question]|answer_status]',
    'id|state|date_created|template[id|name]',
  ]);
  return list(res?.items).map((s) => ({
    id: String(s.id),
    name: str(s.template?.name) ?? 'Obiegówka',
    state: String(s.state ?? 'active'),
    created: str(s.date_created),
    closed: str(s.date_last_closed),
    comment: str(s.issuers_comment),
    issuer: person(s.issuer),
    questions: list(s.questions)
      .flatMap((group) => (Array.isArray(group) ? group : [group]))
      .map((q: Any) => ({
        question: str(q?.question?.question) ?? 'Pozycja',
        status: (str(q?.answer_status) as SlipQuestion['status']) ?? 'pending',
        answer: str(q?.answer),
        answered: str(q?.date_answered),
        answerer: person(q?.answerer),
      })),
  }));
}

// =====================================================================
// TESTY POZIOMUJĄCE (services/plctests)
// =====================================================================
export type PlacementResult = { id: string; name: string; value: number | null };

export async function fetchPlacementTests(creds: Credentials): Promise<PlacementResult[]> {
  const res = await usosJson<Any>('plctests/user', creds, { fields: 'test|value' });
  return Object.entries(res ?? {}).map(([id, r]) => ({
    id,
    name: pl((r as Any)?.test?.name) || 'Test poziomujący',
    value: num((r as Any)?.value),
  }));
}

// =====================================================================
// PRZEWODNIK PO UCZELNI (services/guide) — publiczny
// =====================================================================
export type GuideChapter = { id: string; title: string; pages: { id: string; title: string }[] };
export type GuidePage = { id: string; title: string; entries: { id: string; title: string; html: string; image: string | null }[] };

export async function fetchGuide(creds: Credentials): Promise<GuideChapter[]> {
  const res = await usosJson<Any[]>('guide/guide', creds, { lang: 'pl', fields: 'id|title|pages[id|title]' });
  return list(res).map((c) => ({
    id: String(c.id),
    title: pl(c.title) || 'Rozdział',
    pages: list(c.pages).map((p) => ({ id: String(p.id), title: pl(p.title) || 'Strona' })),
  }));
}

export async function fetchGuidePage(creds: Credentials, pageId: string): Promise<GuidePage> {
  const p = await tryFields<Any>('guide/page', creds, { page_id: pageId, lang: 'pl' }, [
    'id|title|entries[id|title|content|image_urls[540x304]]',
    'id|title|entries[id|title|content]',
  ]);
  return {
    id: String(p.id),
    title: pl(p.title) || 'Przewodnik',
    entries: list(p.entries).map((e) => ({
      id: String(e.id),
      title: pl(e.title) || '',
      html: cleanHtml(pl(e.content)),
      image: str(e.image_urls?.['540x304']),
    })),
  };
}

// =====================================================================
// NAJNOWSZE OCENY (services/grades/latest)
// =====================================================================
export type LatestGrade = { value: string; passes: boolean | null; course: string; courseId: string | null; termId: string | null; date: string | null; session: number | null; kind: string | null };

export async function fetchLatestGrades(creds: Credentials): Promise<LatestGrade[]> {
  const raw = await tryFields<Any[]>('grades/latest', creds, { days: '60' }, [
    'value_symbol|passes|value_description|exam_session_number|date_modified|course_edition|unit',
    'value_symbol|passes|value_description|exam_session_number|date_modified|course_edition',
    'value_symbol|passes|exam_session_number|date_modified',
  ]);
  return list(raw).map((g) => ({
    value: String(g.value_symbol ?? '—'),
    passes: typeof g.passes === 'boolean' ? g.passes : null,
    course: pl(g.course_edition?.course_name) || 'Przedmiot',
    courseId: str(g.course_edition?.course_id),
    termId: str(g.course_edition?.term_id),
    date: str(g.date_modified),
    session: num(g.exam_session_number),
    kind: g.unit ? 'Ocena z zajęć' : 'Ocena końcowa',
  }));
}

// =====================================================================
// PŁATNOŚCI — konta do wpłat i zwroty (services/payments)
// =====================================================================
export type BankAccount = { number: string; name: string | null; owner: string | null; titlePrefix: string | null; faculty: string | null; currency: string | null; swift: string | null };
export type Remittance = { id: string; description: string; amount: number | null; remaining: number | null; status: string | null; settled: boolean; date: string | null };

export async function fetchAccounts(creds: Credentials): Promise<BankAccount[]> {
  const raw = await usosJson<Any[]>('payments/user_accounts', creds, {});
  return list(raw).map((a) => ({
    number: String(a.account_number ?? ''),
    name: pl(a.name) || str(a.name),
    owner: pl(a.account_owner) || str(a.account_owner),
    titlePrefix: str(a.title_prefix),
    faculty: pl(a.faculty?.name) || null,
    currency: str(a.currency),
    swift: str(a.swift),
  }));
}

export async function fetchRemittances(creds: Credentials): Promise<Remittance[]> {
  const raw = await tryFields<Any[]>('payments/user_remittances', creds, {}, [
    'id|remaining|description|amount|status|is_settled|date',
    'id|description|amount|status|date',
  ]);
  return list(raw).map((r) => ({
    id: String(r.id),
    description: pl(r.description) || 'Zwrot',
    amount: num(r.amount),
    remaining: num(r.remaining),
    status: str(r.status),
    settled: Boolean(r.is_settled),
    date: str(r.date),
  }));
}

// =====================================================================
// mLEGITYMACJA i ZDJĘCIE (services/cards, services/photos)
// =====================================================================
export type MCard = {
  whyCannotOrder: string | null;
  expectedExpiry: string | null;
  order: { id: string; date: string | null; status: string; expiry: string | null; token: string | null; pass: string | null } | null;
};

export async function fetchMCard(creds: Credentials): Promise<MCard> {
  const r = await tryFields<Any>('cards/mcard2', creds, {}, [
    'why_cannot_order|expected_expiration_date|latest_order[id|order_date|status|expiration_date|token|distribution_pass]',
    'why_cannot_order|expected_expiration_date|latest_order',
  ]);
  const o = r?.latest_order;
  const ready = o?.status === 'ready_to_receive';
  return {
    whyCannotOrder: plainText(pl(r?.why_cannot_order)) || null,
    expectedExpiry: str(r?.expected_expiration_date),
    order: o
      ? {
          id: String(o.id),
          date: str(o.order_date),
          status: String(o.status ?? 'pending'),
          expiry: str(o.expiration_date),
          token: ready ? str(o.token) : null,
          pass: ready ? str(o.distribution_pass) : null,
        }
      : null,
  };
}

export async function fetchPhotoVisibility(creds: Credentials): Promise<string | null> {
  const r = await usosJson<Any>('photos/my_photo_visibility', creds, { fields: 'desc_for_user' });
  return plainText(pl(r?.desc_for_user)) || null;
}

// =====================================================================
// KOSZYK ZAPISÓW (services/registrations/courses_cart)
// =====================================================================
export type CartItem = { courseId: string; course: string; termId: string | null; term: string | null; status: string | null; limit: number | null; count: number | null; choice: number | null; regOpen: string | null };

export async function fetchCart(creds: Credentials): Promise<CartItem[]> {
  const raw = await tryFields<Any>('registrations/courses_cart', creds, {}, [
    'course[id|name]|term[id|name]|user_registration_status|registration_status|limits|registrations_count|choice_number',
    'course|term|user_registration_status|limits|registrations_count',
    'course|term|user_registration_status',
  ]);
  return list(raw).map((c) => ({
    courseId: String(c.course?.id ?? c.course_id ?? ''),
    course: pl(c.course?.name) || String(c.course?.id ?? 'Przedmiot'),
    termId: str(c.term?.id),
    term: pl(c.term?.name) || str(c.term?.id),
    status: str(c.user_registration_status),
    limit: num(c.limits),
    count: num(c.registrations_count),
    choice: num(c.choice_number),
    regOpen: str(c.registration_status),
  }));
}

// =====================================================================
// GRUPY DZIEKAŃSKIE, WŁASNE GRUPY, WYSŁANE WIADOMOŚCI
// =====================================================================
export type PrimaryGroup = { id: string; name: string; members: number | null };
export type CustomGroup = { id: string; name: string };
export type SentMessage = { id: string; subject: string; status: string | null; date: string | null; recipients: number | null };

export async function fetchPrimaryGroups(creds: Credentials): Promise<PrimaryGroup[]> {
  const raw = await tryFields<Any[]>('prgroups/user', creds, {}, ['id|name|users', 'id|name']);
  return list(raw).map((g) => ({ id: String(g.id), name: pl(g.name) || 'Grupa', members: Array.isArray(g.users) ? g.users.length : null }));
}

export async function fetchCustomGroups(creds: Credentials): Promise<CustomGroup[]> {
  const raw = await usosJson<Any[]>('csgroups/user', creds, { fields: 'id|name' });
  return list(raw).map((g) => ({ id: String(g.id), name: pl(g.name) || str(g.name) || 'Grupa' }));
}

export async function fetchSentMessages(creds: Credentials): Promise<SentMessage[]> {
  const raw = await tryFields<Any[]>('mailclient/user', creds, { status: 'sent|error|pending' }, ['id|subject|status|date', 'id|subject|status']);
  const ids = list(raw).map((m) => String(m.id)).slice(0, 30);
  let counts: Record<string, number | null> = {};
  if (ids.length) {
    try {
      const det = await usosJson<Any>('mailclient/messages', creds, { message_ids: ids.join('|'), fields: 'id|recipients_count' });
      counts = Object.fromEntries(Object.entries(det ?? {}).map(([k, v]) => [k, num((v as Any)?.recipients_count)]));
    } catch (e) {
      if (e instanceof UsosAuthError) throw e;
    }
  }
  return list(raw)
    .map((m) => ({ id: String(m.id), subject: str(m.subject) ?? '(bez tematu)', status: str(m.status), date: str(m.date), recipients: counts[String(m.id)] ?? null }))
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
    .slice(0, 30);
}

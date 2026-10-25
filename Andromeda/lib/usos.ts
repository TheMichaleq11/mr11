// Wywołania USOS API i zamiana odpowiedzi na proste typy aplikacji.
import { signedParams, toForm, type Credentials } from './oauth';
import type { ClassEvent, CourseSummary, Grade, GradesResponse, Me, Term } from './types';

export const USOS_BASE = (process.env.USOS_BASE_URL || 'https://apps.usos.uj.edu.pl').replace(/\/$/, '');
// Zmiana listy = użytkownik musi raz zalogować się ponownie (USOS pokaże nowe uprawnienia).
export const BASE_SCOPES = 'studies|grades|offline_access|crstests|payments|cards|surveys_filling|email|adm_documents|mailclient';
/** Pełna lista: obiegówki, testy poziomujące, widoczność zdjęcia. Gdy USOS ich nie przyzna, logowanie wraca do BASE_SCOPES. */
export const SCOPES = BASE_SCOPES + '|slips|placement_tests|photo';

export class UsosAuthError extends Error {}
/** Token nie ma uprawnienia (scope) do tej metody — potrzebne ponowne zalogowanie. */
export class UsosScopeError extends Error {}
export class UsosError extends Error {
  /** Komunikat z USOS po polsku, jeśli go zwrócił (np. przy nieudanym zapisie). */
  public userMessage: string | null;
  constructor(message: string, public status: number) {
    super(message);
    this.userMessage = null;
    try {
      const j = JSON.parse(message);
      this.userMessage = j?.user_messages?.generic_message?.pl || j?.user_messages?.generic_message?.en || j?.message || null;
    } catch {
      /* nie-JSON */
    }
  }
}

export function consumer(): Credentials {
  return {
    // trim(): przy wklejaniu do Vercela łatwo złapać spację albo enter
    consumerKey: (process.env.USOS_CONSUMER_KEY || '').trim(),
    consumerSecret: (process.env.USOS_CONSUMER_SECRET || '').trim(),
  };
}

/** Podpisany POST do USOS API. Zwraca tekst odpowiedzi. */
export async function usosPost(
  path: string,
  creds: Credentials,
  params: Record<string, string> = {},
  extraOauth: Record<string, string> = {},
): Promise<string> {
  const url = `${USOS_BASE}/services/${path}`;
  const body = toForm(signedParams('POST', url, creds, params, extraOauth));
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });
  const text = await res.text();
  if (res.status === 401) throw new UsosAuthError(text);
  if (res.status === 403 && /scope/i.test(text)) throw new UsosScopeError(text);
  if (!res.ok) throw new UsosError(text.slice(0, 2000), res.status);
  return text;
}

/** Podpisany POST zwracający surową odpowiedź (pliki, np. zaświadczenia z blobbox). */
export async function usosRaw(path: string, creds: Credentials, params: Record<string, string> = {}): Promise<Response> {
  const url = `${USOS_BASE}/services/${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: toForm(signedParams('POST', url, creds, params)),
    cache: 'no-store',
  });
  if (res.status === 401) throw new UsosAuthError(await res.text());
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 403 && /scope/i.test(text)) throw new UsosScopeError(text);
    throw new UsosError(text.slice(0, 2000), res.status);
  }
  return res;
}

// ---------- pamięć podręczna odpowiedzi USOS ----------
// Ciepła instancja serwera pamięta odpowiedzi przez chwilę, więc ekrany, które pytają
// o to samo (np. dane użytkownika, listę przedmiotów, plan tygodnia), nie czekają drugi raz.
// Dane prywatne są kluczowane tokenem użytkownika; publiczne (sylabusy, budynki) — wspólne.

/** Metody zmieniające dane — nigdy nie cache'ujemy, a po nich czyścimy cache użytkownika. */
const WRITE = /(^|\/)(register|unregister|fill_out2?|create_and_send_message|send_message|receive|update_\w+|sign_up|sign_off|oauth\/)/;

/** Dane jednakowe dla wszystkich (czas w sekundach). */
const PUBLIC_TTL: Record<string, number> = {
  'courses/classtypes_index': 86400,
  'courses/course': 21600,
  'courses/unit': 21600,
  'courses/search': 3600,
  'fac/faculty': 86400,
  'geo/building_index': 43200,
  'geo/room': 43200,
  'calendar/search': 21600,
  'news/search': 600,
  'news/article': 3600,
  'guide/guide': 21600,
  'guide/page': 21600,
  'plctests/test': 86400,
};

/** Dane prywatne — dłużej dla rzeczy, które zmieniają się rzadko. */
const PRIVATE_TTL: Record<string, number> = {
  'users/user': 900,
  'users/users': 3600,
  'progs/student': 3600,
  'courses/user': 600,
  'courses/course_edition': 900,
  'groups/user': 900,
  'groups/group': 900,
  'crstests/participant2': 600,
  'crstests/participant': 600,
  'credits/used_sum': 900,
  'theses/user': 3600,
  'mobility/student': 3600,
  'tt/staff': 600,
  'tt/room': 600,
  'tt/upcoming_share': 3600,
  'cards/user': 3600,
  'exams/student_exams': 600,
  'exams/group': 600,
  'surveys/surveys_to_fill2': 120,
  'payments/user_accounts': 21600,
  'prgroups/user': 3600,
  'csgroups/user': 900,
  'plctests/user': 3600,
  'photos/my_photo_visibility': 21600,
  'meetings/available_meetings': 300,
  'slips/search_slips': 600,
};
const DEFAULT_PRIVATE_TTL = 90; // plan, oceny, zapisy, punkty — świeże, ale bez dublowania w ciągu chwili

type Entry = { at: number; ttl: number; value: Promise<unknown> };
const cache = new Map<string, Entry>();
const MAX_ENTRIES = 1500;

function cacheKey(path: string, creds: Credentials, params: Record<string, string>): string {
  const p = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return path in PUBLIC_TTL ? `pub|${path}|${p}` : `${creds.token ?? 'anon'}|${path}|${p}`;
}

function prune() {
  if (cache.size <= MAX_ENTRIES) return;
  const now = Date.now();
  for (const [k, e] of cache) if (now - e.at > e.ttl * 1000) cache.delete(k);
  // nadal za dużo — usuń najstarsze
  for (const k of cache.keys()) {
    if (cache.size <= MAX_ENTRIES * 0.8) break;
    cache.delete(k);
  }
}

/** Czyści pamięć podręczną jednego użytkownika (po zapisie, wysłaniu ankiety itp.). */
export function forgetUser(token: string | undefined) {
  if (!token) return;
  for (const k of cache.keys()) if (k.startsWith(token + '|')) cache.delete(k);
}

export async function usosJson<T>(
  path: string,
  creds: Credentials,
  params: Record<string, string> = {},
): Promise<T> {
  const run = async () => JSON.parse(await usosPost(path, creds, { format: 'json', ...params })) as T;
  if (WRITE.test(path)) {
    const out = await run();
    forgetUser(creds.token);
    return out;
  }
  const key = cacheKey(path, creds, params);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < hit.ttl * 1000) return hit.value as Promise<T>;

  const ttl = PUBLIC_TTL[path] ?? PRIVATE_TTL[path] ?? DEFAULT_PRIVATE_TTL;
  const value = run();
  cache.set(key, { at: Date.now(), ttl, value });
  // błędów nie zapamiętujemy
  value.catch(() => {
    if (cache.get(key)?.value === value) cache.delete(key);
  });
  prune();
  return value;
}

// ---------- pomocnicze ----------

type LangDict = { pl?: string; en?: string } | string | null | undefined;

export function pl(v: LangDict): string {
  if (!v) return '';
  if (typeof v === 'string') return v;
  return v.pl || v.en || '';
}

export function parseGradeNumber(symbol: string): number | null {
  const s = symbol.trim().replace(',', '.');
  if (!/^\d(\.\d)?$/.test(s)) return null;
  const n = Number(s);
  return n >= 2 && n <= 5.5 ? n : null;
}

export function localDate(d = new Date()): string {
  // Data w strefie Polski, niezależnie od strefy serwera.
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Warsaw' }).format(d);
}

export function addDaysIso(iso: string, n: number): string {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// ---------- użytkownik ----------

type RawUser = {
  first_name?: string;
  last_name?: string;
  student_programmes?: { programme?: { description?: LangDict } }[];
};

export async function fetchMe(creds: Credentials): Promise<Me> {
  let u: RawUser;
  try {
    u = await usosJson<RawUser>('users/user', creds, {
      fields: 'id|first_name|last_name|student_programmes',
    });
  } catch (e) {
    if (e instanceof UsosAuthError) throw e;
    u = await usosJson<RawUser>('users/user', creds, { fields: 'id|first_name|last_name' });
  }
  const programme = u.student_programmes?.[0]?.programme?.description;
  return {
    firstName: u.first_name || '',
    lastName: u.last_name || '',
    programme: programme ? pl(programme) : null,
    demo: false,
  };
}

// ---------- plan zajęć ----------

type RawActivity = {
  type?: string;
  start_time: string;
  end_time: string;
  name?: LangDict;
  course_id?: string;
  course_name?: LangDict;
  classtype_name?: LangDict;
  building_name?: LangDict;
  building_id?: string;
  room_number?: string;
  room_id?: string | number;
  group_number?: number;
  lecturer_ids?: number[];
};

const lecturerNames = new Map<string, string>();

type RawUsers = Record<string, { first_name?: string; last_name?: string; titles?: { before?: string | null } } | null>;

export async function fetchPlan(creds: Credentials, start: string, days: number): Promise<ClassEvent[]> {
  return fetchActivities(creds, 'tt/student', {}, start, days);
}

/** Wspólne dla planu studenta, planu sali (tt/room) i planu prowadzącego (tt/staff). */
export async function fetchActivities(
  creds: Credentials,
  method: 'tt/student' | 'tt/room' | 'tt/staff',
  extra: Record<string, string>,
  start: string,
  days: number,
): Promise<ClassEvent[]> {
  const fields =
    'type|start_time|end_time|name|course_id|course_name|classtype_name|building_name|building_id|room_number|room_id|group_number|lecturer_ids';
  let acts: RawActivity[];
  try {
    acts = await usosJson<RawActivity[]>(method, creds, { ...extra, start, days: String(Math.min(Math.max(days, 1), 7)), fields });
  } catch (e) {
    // Plan sali/prowadzącego zwraca też inne typy aktywności — gdy któreś pole nie pasuje, prostszy zestaw.
    if (method === 'tt/student' || !(e instanceof UsosError) || e.status !== 400) throw e;
    acts = await usosJson<RawActivity[]>(method, creds, { ...extra, start, days: String(Math.min(Math.max(days, 1), 7)), fields: 'type|start_time|end_time|name' });
  }

  // Imiona prowadzących są publiczne i rzadko się zmieniają — pamiętamy je osobno dla każdej osoby,
  // więc kolejne tygodnie planu nie czekają na dodatkowe zapytanie.
  const ids = [...new Set(acts.flatMap((a) => a.lecturer_ids || []))].map(String);
  const missing = ids.filter((id) => !lecturerNames.has(id));
  if (missing.length) {
    try {
      const people = await usosJson<RawUsers>('users/users', creds, {
        user_ids: missing.join('|'),
        fields: 'first_name|last_name|titles',
      });
      for (const [id, p] of Object.entries(people)) {
        if (p) lecturerNames.set(id, [p.titles?.before, p.first_name, p.last_name].filter(Boolean).join(' '));
      }
      if (lecturerNames.size > 5000) lecturerNames.clear();
    } catch (e) {
      if (e instanceof UsosAuthError) throw e;
    }
  }
  const nameOf = (id: number) => lecturerNames.get(String(id)) ?? null;

  return acts
    .map((a, i): ClassEvent => {
      const kind =
        a.type === 'exam' ? 'exam' : a.type === 'meeting' ? 'meeting' : a.type?.startsWith('classgroup') ? 'class' : 'other';
      return {
        id: `${a.start_time}-${a.course_id ?? i}-${i}`,
        kind,
        start: a.start_time,
        end: a.end_time,
        courseId: a.course_id ?? null,
        courseName: pl(a.course_name) || pl(a.name),
        classType: kind === 'exam' ? 'Egzamin' : pl(a.classtype_name) || null,
        building: pl(a.building_name) || null,
        buildingId: a.building_id ?? null,
        room: a.room_number || null,
        roomId: a.room_id != null ? String(a.room_id) : null,
        group: a.group_number ?? null,
        lecturers: (a.lecturer_ids || []).map(nameOf).filter((x): x is string => Boolean(x)),
      };
    })
    .sort((x, y) => x.start.localeCompare(y.start));
}

// ---------- przedmioty i oceny ----------

type RawGrade = {
  value_symbol?: string;
  passes?: boolean | null;
  counts_into_average?: boolean | string;
  exam_session_number?: number;
  date_modified?: string | null;
};

type RawCourseEdition = {
  course_id: string;
  course_name?: LangDict;
  term_id: string;
  user_groups?: {
    class_type?: LangDict;
    lecturers?: { first_name?: string; last_name?: string }[];
  }[];
};

type RawCoursesUser = {
  course_editions?: Record<string, RawCourseEdition[]>;
  terms?: { id: string; name?: LangDict; start_date?: string; end_date?: string; finish_date?: string }[];
};

type RawGradesEdition = {
  course_grades?: unknown;
  course_units_grades?: Record<string, unknown>;
} | null;

/** USOS raz zwraca listę ocen, raz słownik {numer_terminu: ocena} — zbieramy wszystko. */
function collectGrades(node: unknown, out: RawGrade[] = []): RawGrade[] {
  if (!node) return out;
  if (Array.isArray(node)) {
    node.forEach((n) => collectGrades(n, out));
  } else if (typeof node === 'object') {
    const o = node as Record<string, unknown>;
    if (typeof o.value_symbol === 'string') out.push(o as RawGrade);
    else Object.values(o).forEach((n) => collectGrades(n, out));
  }
  return out;
}

function toGrade(g: RawGrade, label: string): Grade {
  const value = g.value_symbol || '';
  return {
    value,
    numeric: parseGradeNumber(value),
    passes: g.passes ?? null,
    countsIntoAverage: g.counts_into_average === true || g.counts_into_average === 'T',
    session: g.exam_session_number ?? null,
    date: g.date_modified ?? null,
    label,
  };
}

/** Z kilku terminów (np. poprawka) bierzemy ostatni. */
function latestBySession(grades: Grade[]): Grade[] {
  if (grades.length <= 1) return grades;
  const max = Math.max(...grades.map((g) => g.session ?? 0));
  return grades.filter((g) => (g.session ?? 0) === max);
}

export function pickCurrentTerm(terms: Term[], today = localDate()): string | null {
  const current = terms.find((t) => t.start && t.end && t.start <= today && today <= t.end);
  if (current) return current.id;
  const past = terms.filter((t) => t.start && t.start <= today).sort((a, b) => (a.start! < b.start! ? 1 : -1));
  return past[0]?.id ?? terms[terms.length - 1]?.id ?? null;
}

export function summarize(courses: CourseSummary[]): { average: number | null; gradedCount: number } {
  const finals = courses.flatMap((c) => c.finalGrades);
  const pool = (finals.length ? finals : courses.flatMap((c) => c.unitGrades)).filter(
    (g) => g.numeric !== null && (g.countsIntoAverage || !finals.length),
  );
  const average = pool.length ? Math.round((pool.reduce((s, g) => s + g.numeric!, 0) / pool.length) * 100) / 100 : null;
  return { average, gradedCount: pool.length };
}

export async function fetchGrades(creds: Credentials, wantedTermId?: string | null): Promise<GradesResponse> {
  let raw: RawCoursesUser;
  try {
    raw = await usosJson<RawCoursesUser>('courses/user', creds, {
      fields:
        'course_editions[course_id|course_name|term_id|user_groups[class_type|lecturers]]|terms[id|name|start_date|end_date]',
    });
  } catch (e) {
    if (e instanceof UsosAuthError) throw e;
    raw = await usosJson<RawCoursesUser>('courses/user', creds, { fields: 'course_editions|terms' });
  }

  const terms: Term[] = (raw.terms || [])
    .map((t) => ({ id: t.id, name: pl(t.name) || t.id, start: t.start_date ?? null, end: t.end_date ?? t.finish_date ?? null }))
    .sort((a, b) => (a.start || '').localeCompare(b.start || ''));

  const currentTermId =
    wantedTermId && terms.some((t) => t.id === wantedTermId) ? wantedTermId : pickCurrentTerm(terms);
  const editions = currentTermId ? raw.course_editions?.[currentTermId] || [] : [];

  let gradesRaw: Record<string, Record<string, RawGradesEdition> | null> = {};
  if (currentTermId) {
    gradesRaw = await usosJson('grades/terms2', creds, { term_ids: currentTermId });
  }
  const termGrades = (currentTermId && gradesRaw[currentTermId]) || {};

  const courses: CourseSummary[] = editions.map((ed) => {
    const g = termGrades[ed.course_id];
    const finalGrades = latestBySession(collectGrades(g?.course_grades).map((x) => toGrade(x, 'Ocena końcowa')));
    const unitGrades = Object.values(g?.course_units_grades || {}).flatMap((u) =>
      latestBySession(collectGrades(u).map((x) => toGrade(x, 'Ocena z zajęć'))),
    );
    const groups = ed.user_groups || [];
    return {
      courseId: ed.course_id,
      termId: ed.term_id,
      name: pl(ed.course_name) || ed.course_id,
      classTypes: [...new Set(groups.map((x) => pl(x.class_type)).filter(Boolean))],
      lecturers: [
        ...new Set(
          groups.flatMap((x) => (x.lecturers || []).map((l) => [l.first_name, l.last_name].filter(Boolean).join(' '))),
        ),
      ].filter(Boolean),
      finalGrades,
      unitGrades,
    };
  });

  courses.sort((a, b) => a.name.localeCompare(b.name, 'pl'));
  return { terms, currentTermId, courses, ...summarize(courses) };
}

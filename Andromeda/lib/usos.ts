// Wywołania USOS API i zamiana odpowiedzi na proste typy aplikacji.
import { signedParams, toForm, type Credentials } from './oauth';
import type { ClassEvent, CourseSummary, Grade, GradesResponse, Me, Term } from './types';

export const USOS_BASE = (process.env.USOS_BASE_URL || 'https://apps.usos.uj.edu.pl').replace(/\/$/, '');
export const SCOPES = 'studies|grades|offline_access';

export class UsosAuthError extends Error {}
export class UsosError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export function consumer(): Credentials {
  return {
    consumerKey: process.env.USOS_CONSUMER_KEY || '',
    consumerSecret: process.env.USOS_CONSUMER_SECRET || '',
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
  if (!res.ok) throw new UsosError(text.slice(0, 400), res.status);
  return text;
}

export async function usosJson<T>(
  path: string,
  creds: Credentials,
  params: Record<string, string> = {},
): Promise<T> {
  return JSON.parse(await usosPost(path, creds, { format: 'json', ...params })) as T;
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
  room_number?: string;
  group_number?: number;
  lecturer_ids?: number[];
};

type RawUsers = Record<string, { first_name?: string; last_name?: string; titles?: { before?: string | null } } | null>;

export async function fetchPlan(creds: Credentials, start: string, days: number): Promise<ClassEvent[]> {
  const acts = await usosJson<RawActivity[]>('tt/student', creds, {
    start,
    days: String(Math.min(Math.max(days, 1), 7)),
    fields:
      'type|start_time|end_time|name|course_id|course_name|classtype_name|building_name|room_number|group_number|lecturer_ids',
  });

  const ids = [...new Set(acts.flatMap((a) => a.lecturer_ids || []))];
  let people: RawUsers = {};
  if (ids.length) {
    try {
      people = await usosJson<RawUsers>('users/users', creds, {
        user_ids: ids.join('|'),
        fields: 'first_name|last_name|titles',
      });
    } catch (e) {
      if (e instanceof UsosAuthError) throw e;
    }
  }
  const nameOf = (id: number) => {
    const p = people[String(id)];
    if (!p) return null;
    return [p.titles?.before, p.first_name, p.last_name].filter(Boolean).join(' ');
  };

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
        room: a.room_number || null,
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

// Moduły USOS API poza planem i ocenami: zapisy, sprawdziany, kalendarz, budynki,
// profil i legitymacja, płatności, ankiety, aktualności.
import type { Credentials } from './oauth';
import { cleanHtml, plainText } from './html';
import { localDate, pl, usosJson, UsosAuthError, UsosError, UsosScopeError } from './usos';
import type {
  Article,
  Building,
  CalendarResponse,
  CalEvent,
  Card,
  NewsResponse,
  Payment,
  ProfileResponse,
  Programme,
  RegCourse,
  Registration,
  RegistrationsResponse,
  RegRound,
  SurveyDetail,
  SurveySummary,
  TestNode,
  TestSummary,
  TestTreeResponse,
} from './types-more';

type Any = Record<string, any>; // odpowiedzi USOS bywają różne między instalacjami

export const USOSWEB_FALLBACK = (process.env.USOSWEB_URL || 'https://www.usosweb.uj.edu.pl').replace(/\/$/, '');

/**
 * Próbuje kolejnych selektorów pól — instalacje USOS różnią się tym, które pola/zagnieżdżenia przyjmują.
 * Błędy logowania i brak uprawnień przepuszcza od razu.
 */
export async function tryFields<T>(path: string, creds: Credentials, params: Record<string, string>, selectors: string[]): Promise<T> {
  let last: unknown;
  for (const fields of selectors) {
    try {
      return await usosJson<T>(path, creds, { ...params, fields });
    } catch (e) {
      if (e instanceof UsosAuthError || e instanceof UsosScopeError) throw e;
      if (e instanceof UsosError && e.status !== 400) throw e;
      last = e;
    }
  }
  throw last;
}

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const str = (v: unknown): string | null => (v === null || v === undefined || v === '' ? null : String(v));
const personName = (u: Any | null | undefined) =>
  u ? [u.titles?.before, u.first_name, u.last_name].filter(Boolean).join(' ') || null : null;

/** Adres USOSweb wyciągnięty z profile_url użytkownika (np. https://www.usosweb.uj.edu.pl). */
export function usoswebFrom(profileUrl: string | null | undefined): string {
  try {
    return profileUrl ? new URL(profileUrl).origin : USOSWEB_FALLBACK;
  } catch {
    return USOSWEB_FALLBACK;
  }
}

async function usoswebUrl(creds: Credentials): Promise<string> {
  try {
    const u = await usosJson<Any>('users/user', creds, { fields: 'id|profile_url' });
    return usoswebFrom(u.profile_url);
  } catch (e) {
    if (e instanceof UsosAuthError) throw e;
    return USOSWEB_FALLBACK;
  }
}

// =====================================================================
// ZAPISY
// =====================================================================

function toCourse(c: Any, roundActive: boolean): RegCourse {
  const status = str(c.status ?? c.registration_status);
  const mine = str(c.user_registration_status);
  const registered = mine === 'accepted' || mine === 'ask';
  return {
    courseId: String(c.course?.id ?? c.course_id ?? ''),
    courseName: pl(c.course?.name) || String(c.course?.id ?? c.course_id ?? ''),
    termId: String(c.term_id ?? c.term?.id ?? ''),
    status,
    limit: num(c.limits),
    count: num(c.registrations_count),
    myStatus: mine,
    canRegister: roundActive && !registered && (status === 'register_and_unregister' || status === 'register_only'),
    canUnregister: roundActive && registered && (status === 'register_and_unregister' || status === 'unregister_only'),
  };
}

function toRound(r: Any): RegRound {
  return {
    id: String(r.id),
    name: pl(r.name) || `Tura ${r.id}`,
    status: str(r.status) ?? 'closed',
    mode: str(r.registration_mode),
    start: str(r.start_date),
    end: str(r.end_date),
    selectionLimit: num(r.selection_limit),
    courses: null,
  };
}

export async function fetchRegistrations(creds: Credentials): Promise<RegistrationsResponse> {
  const [regs, tokenRegs, web] = await Promise.all([
    tryFields<Any[]>('registrations/user_registrations', creds, { active_only: 'true' }, [
      'id|description|message|status|type|faculty[id|name]|rounds',
      'id|description|message|status|type|faculty',
      'id|description|message|status|type',
    ]),
    tryFields<Any[]>('registrations/user_token_registrations', creds, { active_only: 'true' }, [
      'id|description|message|status|faculty[id|name]',
      'id|description|message|status',
    ]).catch((e) => {
      if (e instanceof UsosAuthError) throw e;
      return [] as Any[];
    }),
    usoswebUrl(creds),
  ]);

  const registrations: Registration[] = await Promise.all(
    regs.map(async (r): Promise<Registration> => {
      let rounds: Any[] = Array.isArray(r.rounds) ? r.rounds : [];
      if (!Array.isArray(r.rounds)) {
        rounds = await tryFields<Any[]>('registrations/course_registration_rounds', creds, { registration_id: String(r.id) }, [
          'id|name|status|registration_mode|start_date|end_date|selection_limit',
          'id|name|status|registration_mode|start_date|end_date',
        ]).catch((e) => {
          if (e instanceof UsosAuthError) throw e;
          return [] as Any[];
        });
      }
      const mapped = rounds.map(toRound).sort((a, b) => (a.start || '').localeCompare(b.start || ''));
      // Przedmioty pobieramy tylko dla tur aktywnych i nadchodzących (zamknięte nic nie zmienią).
      await Promise.all(
        mapped
          .filter((x) => x.status === 'active' || x.status === 'preparing')
          .map(async (round) => {
            try {
              const courses = await tryFields<Any[]>('registrations/registration_round_courses', creds, { registration_round_id: round.id }, [
                'course[id|name]|term_id|status|limits|registrations_count|user_registration_status',
                'course|term_id|status|limits|registrations_count|user_registration_status',
              ]);
              round.courses = courses
                .map((c) => toCourse(c, round.status === 'active'))
                .sort((a, b) => a.courseName.localeCompare(b.courseName, 'pl'));
            } catch (e) {
              if (e instanceof UsosAuthError) throw e;
              round.courses = [];
            }
          }),
      );
      return {
        id: String(r.id),
        name: pl(r.description) || String(r.id),
        message: plainText(pl(r.message)) || null,
        status: str(r.status),
        faculty: pl(r.faculty?.name) || null,
        kind: 'zwykła',
        rounds: mapped,
      };
    }),
  );

  for (const t of tokenRegs) {
    registrations.push({
      id: `token-${t.id}`,
      name: pl(t.description) || String(t.id),
      message: plainText(pl(t.message)) || null,
      status: str(t.status),
      faculty: pl(t.faculty?.name) || null,
      kind: 'żetonowa',
      rounds: [],
    });
  }
  return { registrations, usoswebUrl: web };
}

export async function registerAction(
  creds: Credentials,
  action: 'register' | 'unregister',
  roundId: string,
  courseId: string,
  termId: string,
): Promise<void> {
  await usosJson(`registrations/${action}`, creds, { round_id: roundId, course_id: courseId, term_id: termId });
}

// =====================================================================
// SPRAWDZIANY
// =====================================================================

export async function fetchTests(creds: Credentials): Promise<TestSummary[]> {
  let items: Any[] = [];
  try {
    items = await tryFields<Any[]>('crstests/participant2', creds, {}, [
      'course_edition[course_id|course_name|term_id]|root[id|name]',
      'course_edition|root',
    ]);
  } catch (e) {
    if (e instanceof UsosAuthError || e instanceof UsosScopeError) throw e;
    // starsza metoda: { tests: { term_id: [root, ...] } }
    const old = await usosJson<Any>('crstests/participant', creds);
    items = Object.values(old.tests || {}).flatMap((roots: any) =>
      (roots as Any[]).map((root) => ({ course_edition: root.course_edition, root })),
    );
  }
  return items
    .map((it): TestSummary => {
      const root = it.root || {};
      const ce = it.course_edition || root.course_edition || {};
      return {
        rootId: String(root.id ?? root.node_id ?? ''),
        courseId: str(ce.course_id),
        courseName: pl(ce.course_name) || pl(root.name) || 'Sprawdzian',
        termId: str(ce.term_id),
        name: pl(root.name) || 'Sprawdziany',
      };
    })
    .filter((t) => t.rootId)
    .sort((a, b) => a.courseName.localeCompare(b.courseName, 'pl'));
}

export async function fetchTestTree(creds: Credentials, rootId: string): Promise<TestTreeResponse> {
  const root = await tryFields<Any>('crstests/node2', creds, { node_id: rootId }, [
    'id|name|description|type|order|visible_for_students|subnodes_deep',
    'id|name|type|subnodes_deep',
  ]);
  const flat: Any[] = (root.subnodes_deep || []).filter((n: Any) => n.visible_for_students !== false);
  const tasks = flat.filter((n) => n.type === 'task').map((n) => String(n.id));
  const grades = flat.filter((n) => n.type === 'grade').map((n) => String(n.id));

  const [points, gradeVals, maxes] = await Promise.all([
    tasks.length ? usosJson<Any[]>('crstests/user_points', creds, { node_ids: tasks.join('|') }).catch(() => [] as Any[]) : ([] as Any[]),
    grades.length ? usosJson<Any[]>('crstests/user_grades', creds, { node_ids: grades.join('|') }).catch(() => [] as Any[]) : ([] as Any[]),
    Promise.all(
      tasks.slice(0, 60).map((id) =>
        usosJson<Any>('crstests/task_node_details', creds, { id, fields: 'points_max' })
          .then((d) => [id, num(d.points_max)] as const)
          .catch(() => [id, null] as const),
      ),
    ),
  ]);

  const pointsBy = new Map(points.map((p) => [String(p.node_id), p]));
  const gradesBy = new Map(gradeVals.map((g) => [String(g.node_id), g]));
  const maxBy = new Map(maxes);

  const make = (n: Any): TestNode => {
    const id = String(n.id);
    const p = pointsBy.get(id);
    const g = gradesBy.get(id);
    const gradeValue = g ? (typeof g.grade === 'object' && g.grade ? g.grade.value_symbol ?? pl(g.grade.name) : g.grade) : null;
    return {
      id,
      name: pl(n.name) || 'Bez nazwy',
      description: plainText(pl(n.description)) || null,
      type: n.type,
      points: p ? num(p.points) : null,
      pointsMax: maxBy.get(id) ?? null,
      grade: str(gradeValue),
      comment: p?.comment || g?.public_comment || null,
      children: [],
    };
  };

  const nodes = new Map<string, TestNode>();
  const order = new Map<string, number>();
  for (const n of flat) {
    nodes.set(String(n.id), make(n));
    order.set(String(n.id), num(n.order) ?? 0);
  }
  const rootNode: TestNode = { ...make(root), type: 'root' };
  for (const n of flat) {
    const parent = n.parent_id != null && nodes.get(String(n.parent_id));
    (parent || rootNode).children.push(nodes.get(String(n.id))!);
  }
  const sortRec = (t: TestNode) => {
    t.children.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    t.children.forEach(sortRec);
  };
  sortRec(rootNode);

  const allTasks = [...nodes.values()].filter((t) => t.type === 'task');
  const scored = allTasks.filter((t) => t.points !== null);
  const sum = scored.length ? Math.round(scored.reduce((s, t) => s + (t.points ?? 0), 0) * 100) / 100 : null;
  const withMax = scored.filter((t) => t.pointsMax !== null);
  const sumMax = withMax.length ? Math.round(withMax.reduce((s, t) => s + (t.pointsMax ?? 0), 0) * 100) / 100 : null;
  return { root: rootNode, sum, sumMax };
}

// =====================================================================
// PROFIL, KIERUNKI, LEGITYMACJA
// =====================================================================

async function fetchProgrammes(creds: Credentials): Promise<{ list: Programme[]; facultyIds: string[] }> {
  const raw = await tryFields<Any[]>('progs/student', creds, {}, [
    'id|status|admission_date|programme[id|description|faculty[id|name]]',
    'id|status|admission_date|programme',
    'id|programme',
  ]);
  const facultyIds: string[] = [];
  const list = raw.map((p): Programme => {
    const fac = p.programme?.faculty;
    if (fac?.id) facultyIds.push(String(fac.id));
    return {
      name: pl(p.programme?.description) || String(p.programme?.id ?? ''),
      faculty: pl(fac?.name) || null,
      status: str(p.status),
      admission: str(p.admission_date),
    };
  });
  return { list, facultyIds };
}

export async function fetchProfile(creds: Credentials): Promise<ProfileResponse> {
  const missing: string[] = [];
  let user: Any;
  try {
    user = await usosJson<Any>('users/user', creds, {
      fields: 'id|first_name|last_name|student_number|email|photo_urls|profile_url',
    });
  } catch (e) {
    if (e instanceof UsosAuthError) throw e;
    missing.push('e-mail');
    user = await usosJson<Any>('users/user', creds, { fields: 'id|first_name|last_name|student_number|photo_urls|profile_url' });
  }

  const [progs, cardsRaw] = await Promise.all([
    fetchProgrammes(creds).catch((e) => {
      if (e instanceof UsosAuthError) throw e;
      return { list: [] as Programme[], facultyIds: [] };
    }),
    usosJson<Any[]>('cards/user', creds).catch((e) => {
      if (e instanceof UsosAuthError) throw e;
      missing.push('legitymacja');
      return null;
    }),
  ]);

  const photos: Record<string, string> = user.photo_urls || {};
  const bestPhoto = Object.entries(photos).sort((a, b) => parseInt(b[0]) - parseInt(a[0]))[0]?.[1] ?? null;
  const cards: Card[] | null = cardsRaw
    ? cardsRaw.map((c) => ({
        type: str(c.type) ?? 'student',
        number: str(c.barcode_number) ?? str(c.student_number),
        expires: str(c.expiration_date),
        issued: str(c.date_of_issue),
      }))
    : null;

  return {
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    studentNumber: str(user.student_number),
    email: str(user.email),
    photo: bestPhoto,
    usoswebUrl: usoswebFrom(user.profile_url),
    programmes: progs.list,
    cards,
    missing,
  };
}

// =====================================================================
// KALENDARZ AKADEMICKI
// =====================================================================

function monthStarts(count: number, from = localDate()): string[] {
  const [y, m] = from.split('-').map(Number);
  return Array.from({ length: count + 1 }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 + i, 1));
    return d.toISOString().slice(0, 10);
  });
}

export async function fetchCalendar(creds: Credentials, months = 5): Promise<CalendarResponse> {
  const { facultyIds } = await fetchProgrammes(creds).catch((e) => {
    if (e instanceof UsosAuthError) throw e;
    return { list: [], facultyIds: [] as string[] };
  });

  // Wydział studenta + jednostki nadrzędne (tam bywają dni rektorskie i święta).
  const ids = new Set<string>(facultyIds);
  await Promise.all(
    facultyIds.map(async (id) => {
      try {
        const f = await usosJson<Any>('fac/faculty', creds, { fac_id: id, fields: 'id|path' });
        for (const p of f.path || []) if (p?.id) ids.add(String(p.id));
      } catch {
        /* brak ścieżki — zostaje sam wydział */
      }
    }),
  );
  if (!ids.size) {
    return { events: [], faculties: [], note: 'Nie udało się ustalić Twojego wydziału, więc nie wiem, który kalendarz pokazać.' };
  }

  const starts = monthStarts(months);
  const seen = new Map<string, CalEvent>();
  const facNames = new Set<string>();
  await Promise.all(
    [...ids].flatMap((fac) =>
      starts.slice(0, -1).map(async (start, i) => {
        try {
          const evs = await usosJson<Any[]>('calendar/search', creds, {
            faculty_id: fac,
            start_date: start,
            end_date: starts[i + 1],
            fields: 'id|name|start_date|end_date|type|is_day_off|faculty',
          });
          for (const e of evs) {
            const facName = pl(e.faculty?.name) || null;
            if (facName) facNames.add(facName);
            seen.set(String(e.id), {
              id: String(e.id),
              name: pl(e.name),
              start: String(e.start_date),
              end: String(e.end_date),
              type: String(e.type ?? 'undefined'),
              dayOff: Boolean(e.is_day_off),
              faculty: facName,
            });
          }
        } catch (e) {
          if (e instanceof UsosAuthError) throw e;
        }
      }),
    ),
  );
  const today = localDate();
  const events = [...seen.values()]
    .filter((e) => e.end.slice(0, 10) >= today && e.type !== 'links_edit')
    .sort((a, b) => a.start.localeCompare(b.start));
  return { events, faculties: [...facNames], note: null };
}

// =====================================================================
// BUDYNKI
// =====================================================================

let buildingsCache: { at: number; data: Building[] } | null = null;

export async function fetchBuildings(creds: Credentials): Promise<Building[]> {
  if (buildingsCache && Date.now() - buildingsCache.at < 12 * 3600 * 1000) return buildingsCache.data;
  const raw = await tryFields<Any[]>('geo/building_index', creds, { langpref: 'pl' }, [
    'id|name|location|postal_address|campus_name|photo_urls',
    'id|name|location|postal_address|campus_name',
    'id|name|location',
  ]);
  const data = raw
    .map(
      (b): Building => ({
        id: String(b.id),
        name: pl(b.name) || String(b.id),
        campus: pl(b.campus_name) || null,
        address: typeof b.postal_address === 'string' ? b.postal_address : pl(b.postal_address) || null,
        lat: num(b.location?.lat),
        lng: num(b.location?.long),
        photo: b.photo_urls?.screen && !/placeholder|blank/i.test(b.photo_urls.screen) ? b.photo_urls.screen : null,
      }),
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'pl'));
  buildingsCache = { at: Date.now(), data };
  return data;
}

// =====================================================================
// PŁATNOŚCI
// =====================================================================

export async function fetchPayments(creds: Credentials): Promise<Payment[]> {
  const raw = await tryFields<Any[]>('payments/user_payments', creds, {}, [
    'id|type|description|state|total_amount|saldo_amount|currency|payment_deadline|account_number',
    'id|type|description|state|total_amount|currency|payment_deadline',
  ]);
  return raw
    .map(
      (p): Payment => ({
        id: String(p.id),
        description: pl(p.description) || 'Płatność',
        type: str(p.type),
        state: str(p.state),
        amount: num(p.total_amount),
        remaining: num(p.saldo_amount),
        currency: str(p.currency) ?? 'PLN',
        deadline: str(p.payment_deadline),
        account: str(p.account_number),
      }),
    )
    .sort((a, b) => (b.deadline || '').localeCompare(a.deadline || ''));
}

// =====================================================================
// ANKIETY
// =====================================================================

function groupLabel(g: Any | null | undefined): string | null {
  if (!g) return null;
  const course = pl(g.course_name) || pl(g.course?.name) || null;
  const type = pl(g.class_type) || null;
  return [course, type].filter(Boolean).join(' · ') || null;
}

function toSurvey(s: Any): SurveySummary {
  return {
    id: String(s.id),
    name: plainText(pl(s.name)) || 'Ankieta',
    type: str(s.survey_type) ?? 'general',
    start: str(s.start_date),
    end: str(s.end_date),
    canFill: Boolean(s.can_i_fill_out),
    filled: Boolean(s.did_i_fill_out),
    subject: groupLabel(s.group),
    lecturer: personName(s.lecturer),
  };
}

export async function fetchSurveys(creds: Credentials): Promise<SurveySummary[]> {
  const raw = await tryFields<Any[]>('surveys/surveys_to_fill2', creds, { include_filled_out: 'true' }, [
    'id|survey_type|name|start_date|end_date|can_i_fill_out|did_i_fill_out|group[course_name|class_type]|lecturer[first_name|last_name|titles]',
    'id|survey_type|name|start_date|end_date|can_i_fill_out|did_i_fill_out|group|lecturer',
    'id|survey_type|name|can_i_fill_out|did_i_fill_out',
  ]);
  return raw.map(toSurvey).sort((a, b) => Number(b.canFill) - Number(a.canFill) || a.name.localeCompare(b.name, 'pl'));
}

export async function fetchSurvey(creds: Credentials, id: string): Promise<SurveyDetail> {
  const s = await tryFields<Any>('surveys/survey2', creds, { survey_id: id }, [
    'id|survey_type|name|headline_html|start_date|end_date|can_i_fill_out|did_i_fill_out|group[course_name|class_type]|lecturer[first_name|last_name|titles]|questions|has_final_comment',
    'id|survey_type|name|headline_html|start_date|end_date|can_i_fill_out|did_i_fill_out|group|lecturer|questions|has_final_comment',
  ]);
  return {
    ...toSurvey(s),
    headlineHtml: cleanHtml(pl(s.headline_html)) || null,
    hasFinalComment: Boolean(s.has_final_comment),
    questions: (s.questions || []).map((q: Any) => ({
      id: String(q.id),
      number: String(q.number ?? ''),
      level: num(q.level) ?? 0,
      html: cleanHtml(pl(q.display_text_html)),
      answers: (q.possible_answers || []).map((a: Any) => ({ id: String(a.id), html: cleanHtml(pl(a.display_text_html)) })),
      allowComment: Boolean(q.allow_comment),
      commentLength: num(q.comment_length),
    })),
  };
}

export async function fillSurvey(
  creds: Credentials,
  id: string,
  answers: Record<string, { answer: string | null; comment: string | null }>,
  comment: string | null,
): Promise<void> {
  const payload: Record<string, { answers: string[]; comment: string | null }> = {};
  for (const [qid, a] of Object.entries(answers)) {
    if (!a.answer && !a.comment) continue;
    payload[qid] = { answers: a.answer ? [a.answer] : [], comment: a.comment?.trim() ? a.comment.trim() : null };
  }
  const params: Record<string, string> = { survey_id: id, answers: JSON.stringify(payload) };
  if (comment?.trim()) params.comment = comment.trim().slice(0, 3000);
  await usosJson('surveys/fill_out2', creds, params);
}

// =====================================================================
// AKTUALNOŚCI
// =====================================================================

function toArticle(a: Any, withContent: boolean): Article {
  const img = a.image_urls ? Object.values(a.image_urls as Record<string, string>)[0] ?? null : null;
  return {
    id: String(a.id),
    title: plainText(pl(a.title)) || 'Bez tytułu',
    headlineHtml: cleanHtml(pl(a.headline_html)),
    contentHtml: withContent ? cleanHtml(pl(a.content_html)) : null,
    date: str(a.publication_date),
    author: plainText(pl(a.author)) || null,
    faculty: pl(a.faculty?.name) || null,
    image: typeof img === 'string' && img.startsWith('https://') ? img : null,
  };
}

export async function fetchNews(creds: Credentials, start = 0): Promise<NewsResponse> {
  const res = await tryFields<Any>('news/search', creds, { num: '20', start: String(start) }, [
    'items[article[id|title|headline_html|publication_date|author|faculty[id|name]|image_urls]]|next_page|total',
    'items[article[id|title|headline_html|publication_date|author]]|next_page|total',
  ]);
  return {
    articles: (res.items || []).map((i: Any) => toArticle(i.article || {}, false)),
    total: num(res.total) ?? 0,
    nextPage: Boolean(res.next_page),
  };
}

export async function fetchArticle(creds: Credentials, id: string): Promise<Article> {
  const a = await tryFields<Any>('news/article', creds, { article_id: id }, [
    'id|title|headline_html|content_html|publication_date|author|faculty[id|name]|image_urls',
    'id|title|headline_html|content_html|publication_date|author',
  ]);
  return toArticle(a, true);
}

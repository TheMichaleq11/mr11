// Egzaminy, etapy studiów i ECTS, grupy zajęciowe z mailem, zaświadczenia,
// plan sali/prowadzącego, kalendarz iCal, prace dyplomowe i wymiana.
import type { Credentials } from './oauth';
import { addDaysIso, fetchActivities, fetchGrades, localDate, pl, usosJson, usosRaw, UsosAuthError } from './usos';
import { tryFields, usoswebFrom, USOSWEB_FALLBACK } from './usos-more';
import type { ClassEvent } from './types';

type Any = Record<string, any>;
const swallow = <T,>(fallback: T) => (e: unknown): T => {
  if (e instanceof UsosAuthError) throw e;
  return fallback;
};
const str = (v: unknown): string | null => (v === null || v === undefined || v === '' ? null : String(v));
const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const person = (u: Any) => ({ id: u?.id != null ? String(u.id) : null, name: [u?.titles?.before, u?.first_name, u?.last_name].filter(Boolean).join(' ') || 'Osoba' });

// =====================================================================
// EGZAMINY
// =====================================================================

export type ExamSlot = { number: string; start: string | null; end: string | null; capacity: number | null; taken: number | null };
export type ExamGroup = {
  number: string;
  start: string | null;
  end: string | null;
  room: { id: string | null; number: string | null; buildingId: string | null; buildingName: string | null } | null;
  examiners: { id: string | null; name: string }[];
  capacity: number | null;
  slots: ExamSlot[];
};
export type Exam = {
  id: string;
  name: string;
  courseId: string | null;
  courseName: string;
  termId: string | null;
  description: string | null;
  registrationStart: string | null;
  registrationEnd: string | null;
  registerUntil: string | null;
  unregisterUntil: string | null;
  groups: ExamGroup[];
};
export type ExamsResponse = { exams: Exam[]; planned: ClassEvent[]; usoswebUrl: string };

function toRoom(r: Any | null | undefined) {
  if (!r) return null;
  return {
    id: str(r.id),
    number: str(r.number),
    buildingId: str(r.building_id ?? r.building?.id),
    buildingName: pl(r.building_name) || pl(r.building?.name) || null,
  };
}

export async function fetchExams(creds: Credentials): Promise<ExamsResponse> {
  const today = localDate();
  const [raw, web, ...weeks] = await Promise.all([
    tryFields<Any[]>('exams/student_exams', creds, {}, [
      'id|name|description|course[id|name]|term|registration_start|registration_end|register_until|unregister_until|groups[number|exam_start|exam_end|capacity|room|examiners|slots[number|start|end|capacity|attendees_count]]',
      'id|name|course|term|registration_start|registration_end|register_until|unregister_until|groups',
      'id|course|term|registration_start|registration_end|groups',
    ]).catch(swallow<Any[]>([])),
    usosJson<Any>('users/user', creds, { fields: 'id|profile_url' })
      .then((u) => usoswebFrom(u.profile_url))
      .catch(swallow(USOSWEB_FALLBACK)),
    // Egzaminy, które już są w planie (najbliższe 6 tygodni)
    ...[0, 7, 14, 21, 28, 35].map((d) => fetchActivities(creds, 'tt/student', {}, addDaysIso(today, d), 7).catch(swallow<ClassEvent[]>([]))),
  ]);

  // Brakujące szczegóły grup (gdy instalacja nie przyjęła zagnieżdżonego selektora)
  const exams = await Promise.all(
    (raw as Any[]).map(async (e): Promise<Exam> => {
      let groups: Any[] = Array.isArray(e.groups) ? e.groups : [];
      if (groups.length && groups.every((g) => g && typeof g !== 'object')) {
        groups = await Promise.all(
          groups.map((n) =>
            usosJson<Any>('exams/group', creds, { exam_id: String(e.id), group_number: String(n), fields: 'number|exam_start|exam_end|capacity|room|examiners|slots' }).catch(
              swallow<Any>({ number: n }),
            ),
          ),
        );
      }
      return {
        id: String(e.id),
        name: pl(e.name) || 'Egzamin',
        courseId: str(e.course?.id ?? e.course),
        courseName: pl(e.course?.name) || pl(e.name) || String(e.course?.id ?? e.course ?? 'Egzamin'),
        termId: str(e.term?.id ?? e.term),
        description: pl(e.description) || null,
        registrationStart: str(e.registration_start),
        registrationEnd: str(e.registration_end),
        registerUntil: str(e.register_until),
        unregisterUntil: str(e.unregister_until),
        groups: groups.map((g) => ({
          number: String(g.number ?? ''),
          start: str(g.exam_start),
          end: str(g.exam_end),
          room: toRoom(g.room),
          examiners: (g.examiners ?? []).map(person),
          capacity: num(g.capacity),
          slots: (g.slots ?? []).map((s: Any) => ({
            number: String(s.number ?? ''),
            start: str(s.start),
            end: str(s.end),
            capacity: num(s.capacity),
            taken: num(s.attendees_count),
          })),
        })),
      };
    }),
  );

  exams.sort((a, b) => (a.groups[0]?.start ?? '9').localeCompare(b.groups[0]?.start ?? '9') || a.courseName.localeCompare(b.courseName, 'pl'));
  const planned = (weeks as ClassEvent[][]).flat().filter((e) => e.kind === 'exam' || /egzamin|kolokwium|zaliczenie/i.test(e.classType ?? ''));
  return { exams, planned, usoswebUrl: web as string };
}

// =====================================================================
// ETAPY, ECTS, PRACE DYPLOMOWE, WYMIANA
// =====================================================================

export type StageInfo = { name: string; term: string | null; status: string | null };
export type ProgrammeInfo = {
  id: string;
  name: string;
  faculty: string | null;
  status: string | null;
  admission: string | null;
  level: string | null;
  mode: string | null;
  duration: string | null;
  ectsUsed: number | null;
  stages: StageInfo[];
};
export type TermEcts = {
  termName: string | null;
  total: number | null;
  passed: number | null;
  courses: { id: string; name: string; ects: number | null; passed: boolean | null }[];
};
export type Thesis = { id: string; title: string; type: string | null; supervisors: string[]; faculty: string | null };
export type Mobility = { id: string; institution: string | null; state: string | null; start: string | null; end: string | null; term: string | null };
export type StudiesResponse = {
  programmes: ProgrammeInfo[];
  ectsTotal: number | null;
  term: TermEcts;
  theses: Thesis[];
  mobilities: Mobility[];
};

function stageOf(s: Any): StageInfo {
  const st = s?.stage ?? s;
  return {
    name: pl(st?.name) || pl(st?.description) || pl(s?.name) || str(st?.id) || 'Etap',
    term: pl(s?.term?.name) || str(s?.term_id ?? s?.term?.id),
    status: pl(s?.status) || str(s?.decision) || pl(s?.result) || null,
  };
}

export async function fetchStudies(creds: Credentials): Promise<StudiesResponse> {
  const [progsRaw, me, grades, ectsTotal] = await Promise.all([
    tryFields<Any[]>('progs/student', creds, { active_only: 'false' }, [
      'id|status|admission_date|stages|programme[id|description|faculty[id|name]|level_of_studies|mode_of_studies|duration]',
      'id|status|admission_date|stages|programme',
      'id|status|admission_date|programme',
    ]).catch(swallow<Any[]>([])),
    usosJson<Any>('users/user', creds, { fields: 'id' }),
    fetchGrades(creds).catch(swallow(null)),
    usosJson<unknown>('credits/used_sum', creds).catch(swallow<unknown>(null)),
  ]);

  const programmes = await Promise.all(
    progsRaw.map(async (p): Promise<ProgrammeInfo> => {
      const used = await usosJson<unknown>('credits/used_sum', creds, { students_programme_id: String(p.id) }).catch(swallow<unknown>(null));
      const pr = p.programme ?? {};
      return {
        id: String(p.id),
        name: pl(pr.description) || String(pr.id ?? p.id),
        faculty: pl(pr.faculty?.name) || null,
        status: str(p.status),
        admission: str(p.admission_date),
        level: pl(pr.level_of_studies) || null,
        mode: pl(pr.mode_of_studies) || null,
        duration: pl(pr.duration) || null,
        ectsUsed: num(used),
        stages: Array.isArray(p.stages) ? p.stages.map(stageOf) : [],
      };
    }),
  );

  // ECTS w bieżącym semestrze: punkty przedmiotów (wartość typowa z katalogu) + czy już zaliczone
  const courses = grades?.courses ?? [];
  const ectsList = await Promise.all(
    courses.map((c) =>
      usosJson<Any>('courses/course', creds, { course_id: c.courseId, fields: 'id|ects_credits_simplified' })
        .then((r) => num(r.ects_credits_simplified))
        .catch(swallow<number | null>(null)),
    ),
  );
  const termCourses = courses.map((c, i) => {
    const finals = c.finalGrades;
    const last = finals[finals.length - 1];
    return { id: c.courseId, name: c.name, ects: ectsList[i], passed: last ? last.passes : null };
  });
  const sum = (xs: (number | null)[]) => (xs.some((x) => x !== null) ? Math.round(xs.reduce<number>((s, x) => s + (x ?? 0), 0) * 10) / 10 : null);

  const [theses, mobilities] = await Promise.all([
    tryFields<Any>('theses/user', creds, { user_id: String(me.id) }, [
      'authored_theses[id|title|type|supervisors|faculty]',
      'authored_theses[id|title|type]',
    ])
      .then((t) =>
        (t.authored_theses ?? []).map((x: Any): Thesis => ({
          id: String(x.id),
          title: x.title || pl(x.titles) || 'Praca dyplomowa',
          type: str(x.type),
          supervisors: (x.supervisors ?? []).map((s: Any) => person(s).name),
          faculty: pl(x.faculty?.name) || null,
        })),
      )
      .catch(swallow<Thesis[]>([])),
    tryFields<Any[]>('mobility/student', creds, {}, ['id|term|state|receiving_institution|start_date|end_date', 'id|state'])
      .then((ms) =>
        ms.map((m): Mobility => ({
          id: String(m.id),
          institution: pl(m.receiving_institution?.name) || str(m.receiving_institution?.erasmus_code) || null,
          state: str(m.state),
          start: str(m.start_date),
          end: str(m.end_date),
          term: pl(m.term?.name) || null,
        })),
      )
      .catch(swallow<Mobility[]>([])),
  ]);

  const term = grades?.terms.find((t) => t.id === grades.currentTermId);
  return {
    programmes,
    ectsTotal: num(ectsTotal),
    term: {
      termName: term?.name ?? null,
      total: sum(termCourses.map((c) => c.ects)),
      passed: sum(termCourses.filter((c) => c.passed).map((c) => c.ects)),
      courses: termCourses,
    },
    theses,
    mobilities,
  };
}

// =====================================================================
// GRUPY ZAJĘCIOWE I POCZTA
// =====================================================================

export type GroupSummary = {
  key: string; // "unitId-nr"
  unitId: string;
  number: string;
  courseId: string | null;
  courseName: string;
  classType: string;
  termId: string | null;
  lecturers: { id: string | null; name: string }[];
};
export type GroupDetail = GroupSummary & { participants: { id: string | null; name: string }[]; meId: string | null };

function toGroup(g: Any): GroupSummary {
  return {
    key: `${g.course_unit_id}-${g.group_number}`,
    unitId: String(g.course_unit_id),
    number: String(g.group_number),
    courseId: str(g.course_id),
    courseName: pl(g.course_name) || String(g.course_id ?? ''),
    classType: pl(g.class_type) || 'Zajęcia',
    termId: str(g.term_id),
    lecturers: (g.lecturers ?? []).map(person),
  };
}

export async function fetchGroups(creds: Credentials): Promise<GroupSummary[]> {
  const raw = await tryFields<Any>('groups/user', creds, { active_terms: 'true' }, [
    'course_unit_id|group_number|class_type|course_id|course_name|term_id|lecturers',
    'course_unit_id|group_number|class_type|course_id|course_name|term_id',
  ]);
  const list: Any[] = Array.isArray(raw)
    ? raw
    : raw?.groups
      ? Object.values(raw.groups as Record<string, Any[]>).flat()
      : Object.values(raw ?? {}).flat().filter((x: Any) => x && typeof x === 'object' && 'course_unit_id' in x);
  return list
    .filter((g) => g.relationship_type !== 'lecturer')
    .map(toGroup)
    .sort((a, b) => a.courseName.localeCompare(b.courseName, 'pl') || a.classType.localeCompare(b.classType, 'pl'));
}

export async function fetchGroup(creds: Credentials, unitId: string, number: string): Promise<GroupDetail> {
  const [g, me] = await Promise.all([
    tryFields<Any>('groups/group', creds, { course_unit_id: unitId, group_number: number }, [
      'course_unit_id|group_number|class_type|course_id|course_name|term_id|lecturers|participants',
      'course_unit_id|group_number|class_type|course_id|course_name|term_id|lecturers',
    ]),
    usosJson<Any>('users/user', creds, { fields: 'id' }).catch(swallow<Any>({})),
  ]);
  return {
    ...toGroup(g),
    participants: (g.participants ?? []).map(person).sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'pl')),
    meId: str(me.id),
  };
}

export async function sendMail(creds: Credentials, userIds: string[], subject: string, content: string, copyToMe: boolean): Promise<void> {
  await usosJson('mailclient/create_and_send_message', creds, {
    subject: subject.slice(0, 200),
    content: content.slice(0, 15000),
    user_ids: userIds.join('|'),
    send_to_myself: copyToMe ? 'true' : 'false',
    content_format: 'plain',
    lang: 'pl',
  });
}

// =====================================================================
// ZAŚWIADCZENIA / DOKUMENTY
// =====================================================================

export type AdmDocument = {
  id: string;
  name: string;
  type: string | null;
  status: string | null;
  published: string | null;
  delivered: string | null;
  blobId: string | null;
  canDownload: boolean;
  canReceive: boolean;
};

export async function fetchDocuments(creds: Credentials): Promise<{ documents: AdmDocument[]; usoswebUrl: string }> {
  const [docs, web] = await Promise.all([
    usosJson<Any[]>('adm_documents/user_documents', creds, {
      fields: 'id|published_date|delivered_date|id_blobbox|actions|name|status|type|type_name',
    }),
    usosJson<Any>('users/user', creds, { fields: 'id|profile_url' })
      .then((u) => usoswebFrom(u.profile_url))
      .catch(swallow(USOSWEB_FALLBACK)),
  ]);
  return {
    usoswebUrl: web,
    documents: docs
      .map((d): AdmDocument => {
        const actions: string[] = Array.isArray(d.actions) ? d.actions : [];
        return {
          id: String(d.id),
          name: pl(d.name) || 'Dokument',
          type: pl(d.type_name) || str(d.type),
          status: pl(d.status) || null,
          published: str(d.published_date),
          delivered: str(d.delivered_date),
          blobId: str(d.id_blobbox),
          canDownload: actions.includes('GET_DOCUMENT') && Boolean(d.id_blobbox),
          canReceive: actions.includes('RECEIVE_DOCUMENT'),
        };
      })
      .sort((a, b) => (b.published || '').localeCompare(a.published || '')),
  };
}

/** Pobiera plik dokumentu — tylko jeśli należy do listy dokumentów tego użytkownika. */
export async function downloadDocument(creds: Credentials, docId: string): Promise<{ body: ArrayBuffer; type: string; name: string }> {
  const { documents } = await fetchDocuments(creds);
  const doc = documents.find((d) => d.id === docId);
  if (!doc || !doc.canDownload || !doc.blobId) throw new Error('Dokument niedostępny do pobrania.');
  const res = await usosRaw('blobbox/get', creds, { blob_id: doc.blobId });
  return { body: await res.arrayBuffer(), type: res.headers.get('content-type') || 'application/pdf', name: doc.name };
}

export async function receiveDocument(creds: Credentials, docId: string): Promise<void> {
  await usosJson('adm_documents/receive', creds, { id: docId });
}

// =====================================================================
// PLAN SALI, PLAN PROWADZĄCEGO, KALENDARZ ICAL
// =====================================================================

export async function fetchRoomPlan(creds: Credentials, roomId: string, start: string) {
  const [events, room] = await Promise.all([
    fetchActivities(creds, 'tt/room', { room_id: roomId }, start, 7),
    usosJson<Any>('geo/room', creds, { room_id: roomId, fields: 'id|number|building|type|capacity' }).catch(swallow<Any | null>(null)),
  ]);
  return {
    events,
    room: room
      ? {
          number: str(room.number),
          capacity: num(room.capacity),
          buildingId: str(room.building?.id ?? room.building_id),
          buildingName: pl(room.building?.name) || pl(room.building_name) || null,
        }
      : null,
  };
}

export async function fetchStaffPlan(creds: Credentials, userId: string, start: string) {
  return { events: await fetchActivities(creds, 'tt/staff', { user_id: userId }, start, 7) };
}

export async function fetchIcalUrl(creds: Credentials): Promise<{ webcalUrl: string | null }> {
  const r = await usosJson<Any>('tt/upcoming_share', creds, { lang: 'pl' });
  return { webcalUrl: str(r.webcal_url) };
}

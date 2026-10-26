// Sylabus przedmiotu, katalog przedmiotów i profile prowadzących.
import type { Credentials } from './oauth';
import { cleanHtml } from './html';
import { pl, usosJson, UsosAuthError } from './usos';
import { tryFields } from './usos-more';

type Any = Record<string, any>;

export type SylSection = { title: string; html: string };
export type SylUnit = { id: string; classType: string; sections: SylSection[]; homepage: string | null };
export type SylGroup = { classType: string; number: string; lecturers: PersonRef[]; sections: SylSection[] };
export type PersonRef = { id: string | null; name: string };

export type SyllabusResponse = {
  courseId: string;
  name: string;
  termId: string | null;
  ects: number | null;
  language: string | null;
  faculty: string | null;
  passing: string | null; // passed | failed | not_yet_passed
  homepage: string | null;
  profileUrl: string | null;
  coordinators: PersonRef[];
  lecturers: PersonRef[];
  sections: SylSection[]; // opis, efekty, kryteria, literatura...
  attributes: { name: string; values: string[] }[];
  units: SylUnit[];
  groups: SylGroup[];
};

export type Person = {
  id: string;
  name: string;
  titlesBefore: string | null;
  titlesAfter: string | null;
  photo: string | null;
  officeHours: string | null;
  room: { number: string | null; buildingId: string | null; buildingName: string | null } | null;
  phones: string[];
  emailUrl: string | null;
  homepage: string | null;
  profileUrl: string | null;
  positions: string[];
  courses: { id: string; name: string; termId: string | null; termName: string | null }[];
};

export type PersonHit = { id: string; name: string; match: string | null };
export type CourseHit = { id: string; name: string };

// ---------- pomocnicze ----------

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Pola sylabusa bywają HTML-em albo zwykłym tekstem z enterami — oba przerabiamy na bezpieczny HTML. */
export function richText(v: unknown): string | null {
  const s = pl(v as never).trim();
  if (!s) return null;
  let html = /<\/?[a-z][\s\S]*>/i.test(s) ? cleanHtml(s) : escapeHtml(s);
  // Tekst bez znaczników akapitów — entery zamieniamy na łamania linii.
  if (!/<(p|br|li|div|ul|ol|h\d|table)\b/i.test(html)) html = html.replace(/\r?\n/g, '<br>');
  return html.replace(/(<br\s*\/?>\s*){3,}/gi, '<br><br>').trim() || null;
}

const sec = (title: string, v: unknown): SylSection | null => {
  const html = richText(v);
  return html ? { title, html } : null;
};

const personRef = (u: Any): PersonRef => ({
  id: u?.id != null ? String(u.id) : null,
  name: [u?.titles?.before, u?.first_name, u?.last_name].filter(Boolean).join(' ') || 'Prowadzący',
});

const languages: Record<string, string> = { pl: 'polski', en: 'angielski', de: 'niemiecki', fr: 'francuski', es: 'hiszpański', it: 'włoski', ru: 'rosyjski' };

let classTypes: Record<string, string> | null = null;
async function classTypeName(creds: Credentials, id: string | null | undefined): Promise<string> {
  if (!id) return 'Zajęcia';
  if (!classTypes) {
    try {
      const raw = await usosJson<Record<string, Any>>('courses/classtypes_index', creds);
      classTypes = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, pl(v?.name)]));
    } catch (e) {
      if (e instanceof UsosAuthError) throw e;
      classTypes = {};
    }
  }
  return classTypes[id] || id;
}

const swallow = <T,>(fallback: T) => (e: unknown): T => {
  if (e instanceof UsosAuthError) throw e;
  return fallback;
};

// ---------- sylabus ----------

export async function fetchSyllabus(creds: Credentials, courseId: string, wantedTerm: string | null): Promise<SyllabusResponse> {
  const course = await tryFields<Any>('courses/course', creds, { course_id: courseId }, [
    'id|name|ects_credits_simplified|lang_id|fac_id|terms|homepage_url|profile_url|description|bibliography|learning_outcomes|assessment_criteria|practical_placement|attributes2',
    'id|name|ects_credits_simplified|lang_id|fac_id|terms|homepage_url|profile_url|description|bibliography|learning_outcomes|assessment_criteria|practical_placement',
    'id|name|terms|description',
  ]);
  const terms: string[] = Array.isArray(course.terms) ? course.terms.map((t: Any) => String(t?.id ?? t)) : [];
  const termId = wantedTerm || terms[0] || null;

  const [edition, faculty] = await Promise.all([
    termId
      ? tryFields<Any>('courses/course_edition', creds, { course_id: courseId, term_id: termId }, [
          'course_id|term_id|homepage_url|coordinators|lecturers|passing_status|user_groups|description|bibliography|notes|course_units_ids|attributes',
          'course_id|term_id|coordinators|lecturers|user_groups|description|course_units_ids',
          'course_id|term_id|lecturers|course_units_ids',
        ]).catch(swallow<Any | null>(null))
      : Promise.resolve(null),
    course.fac_id
      ? usosJson<Any>('fac/faculty', creds, { fac_id: String(course.fac_id), fields: 'id|name' }).catch(swallow<Any | null>(null))
      : Promise.resolve(null),
  ]);

  const unitIds: string[] = (edition?.course_units_ids ?? []).map(String);
  const units = (
    await Promise.all(
      unitIds.slice(0, 12).map(async (id) => {
        const u = await tryFields<Any>('courses/unit', creds, { unit_id: id }, [
          'id|classtype_id|learning_outcomes|assessment_criteria|topics|teaching_methods|bibliography|homepage_url',
          'id|classtype_id|topics|bibliography',
        ]).catch(swallow<Any | null>(null));
        if (!u) return null;
        const sections = [
          sec('Tematy zajęć', u.topics),
          sec('Metody dydaktyczne', u.teaching_methods),
          sec('Efekty uczenia się', u.learning_outcomes),
          sec('Kryteria oceniania', u.assessment_criteria),
          sec('Literatura', u.bibliography),
        ].filter((x): x is SylSection => x !== null);
        return { id, classType: await classTypeName(creds, u.classtype_id), sections, homepage: u.homepage_url ?? null } as SylUnit;
      }),
    )
  ).filter((u): u is SylUnit => u !== null);

  const myGroups: Any[] = Array.isArray(edition?.user_groups) ? edition!.user_groups : [];
  const groups = (
    await Promise.all(
      myGroups.slice(0, 8).map(async (g) => {
        const unitId = g.course_unit_id;
        const nr = g.group_number;
        if (unitId == null || nr == null) return null;
        const full = await tryFields<Any>('groups/group', creds, { course_unit_id: String(unitId), group_number: String(nr) }, [
          'course_unit_id|group_number|class_type|lecturers|group_description|group_literature',
          'course_unit_id|group_number|class_type|lecturers',
        ]).catch(swallow<Any | null>(null));
        const src = full ?? g;
        return {
          classType: pl(src.class_type) || 'Zajęcia',
          number: String(nr),
          lecturers: (src.lecturers ?? []).map(personRef),
          sections: [sec('Opis grupy', src.group_description), sec('Literatura grupy', src.group_literature)].filter(
            (x): x is SylSection => x !== null,
          ),
        } as SylGroup;
      }),
    )
  ).filter((g): g is SylGroup => g !== null);

  const sections = [
    sec('Opis przedmiotu', course.description),
    sec('Opis w tym semestrze', edition?.description),
    sec('Efekty uczenia się', course.learning_outcomes),
    sec('Kryteria oceniania', course.assessment_criteria),
    sec('Literatura', course.bibliography),
    sec('Literatura w tym semestrze', edition?.bibliography),
    sec('Praktyki zawodowe', course.practical_placement),
    sec('Uwagi', edition?.notes),
  ].filter((x): x is SylSection => x !== null);

  const rawAttrs: Any[] = course.attributes2 ?? edition?.attributes ?? [];
  const attributes = rawAttrs
    .map((a) => ({
      name: pl(a?.name) || '',
      values: (a?.values ?? [])
        .map((v: unknown) => (typeof v === 'string' ? v : pl(v as never) || pl((v as Any)?.name) || pl((v as Any)?.description)))
        .filter(Boolean) as string[],
    }))
    .filter((a) => a.name && a.values.length);

  return {
    courseId,
    name: pl(course.name) || courseId,
    termId,
    ects: typeof course.ects_credits_simplified === 'number' ? course.ects_credits_simplified : null,
    language: course.lang_id ? languages[course.lang_id] ?? course.lang_id : null,
    faculty: faculty ? pl(faculty.name) : null,
    passing: edition?.passing_status ?? null,
    homepage: edition?.homepage_url || course.homepage_url || null,
    profileUrl: course.profile_url ?? null,
    coordinators: (edition?.coordinators ?? []).map(personRef),
    lecturers: (edition?.lecturers ?? []).map(personRef),
    sections,
    attributes,
    units,
    groups,
  };
}

// ---------- katalog przedmiotów ----------

export async function searchCourses(creds: Credentials, q: string): Promise<CourseHit[]> {
  const res = await tryFields<Any>('courses/search', creds, { lang: 'pl', name: q, num: '20' }, [
    'items[course_id|course_name]|next_page',
    'items[course_id|match]|next_page',
  ]);
  return (res.items ?? []).map((i: Any) => ({
    id: String(i.course_id),
    name: pl(i.course_name) || String(i.match ?? i.course_id).replace(/<[^>]+>/g, ''),
  }));
}

// ---------- prowadzący ----------

export async function searchPeople(creds: Credentials, q: string): Promise<PersonHit[]> {
  const res = await tryFields<Any>('users/search2', creds, { lang: 'pl', query: q, among: 'current_staff|current_teachers', num: '20' }, [
    'items[user[id|first_name|last_name|titles]|match]|next_page',
    'items[user[id|first_name|last_name]|match]|next_page',
  ]);
  return (res.items ?? []).map((i: Any) => ({
    id: String(i.user?.id),
    name: personRef(i.user).name,
    match: typeof i.match === 'string' ? i.match.replace(/<[^>]+>/g, '') : null,
  }));
}

export async function fetchPerson(creds: Credentials, id: string): Promise<Person> {
  const u = await tryFields<Any>('users/user', creds, { user_id: id }, [
    'id|first_name|last_name|titles|photo_urls|office_hours|room[id|number|building_id|building_name]|homepage_url|phone_numbers|email_url|profile_url|employment_positions|course_editions_conducted',
    'id|first_name|last_name|titles|photo_urls|office_hours|room|homepage_url|phone_numbers|email_url|profile_url|employment_positions',
    'id|first_name|last_name|titles|photo_urls|office_hours|homepage_url|phone_numbers|profile_url',
  ]);
  const photos: Record<string, string> = u.photo_urls ?? {};
  const photo = photos['original'] ?? photos['400x500'] ?? photos['200x250'] ?? photos['200x200'] ?? photos['100x125'] ?? Object.values(photos)[0] ?? null;
  const positions = (u.employment_positions ?? [])
    .map((p: Any) => [pl(p?.position?.name ?? p?.name), pl(p?.faculty?.name)].filter(Boolean).join(' · '))
    .filter(Boolean);
  const courses = (u.course_editions_conducted ?? [])
    .map((c: Any) => ({
      id: String(c?.course?.id ?? ''),
      name: pl(c?.course?.name) || String(c?.course?.id ?? ''),
      termId: c?.term?.id != null ? String(c.term.id) : null,
      termName: pl(c?.term?.name) || null,
    }))
    .filter((c: { id: string }) => c.id);
  return {
    id: String(u.id),
    name: [u.first_name, u.last_name].filter(Boolean).join(' '),
    titlesBefore: u.titles?.before ?? null,
    titlesAfter: u.titles?.after ?? null,
    photo: typeof photo === 'string' ? photo : null,
    officeHours: pl(u.office_hours) || null,
    room: u.room
      ? {
          number: u.room.number != null ? String(u.room.number) : null,
          buildingId: u.room.building_id != null ? String(u.room.building_id) : u.room.building?.id != null ? String(u.room.building.id) : null,
          buildingName: pl(u.room.building_name) || pl(u.room.building?.name) || null,
        }
      : null,
    phones: Array.isArray(u.phone_numbers) ? u.phone_numbers.map(String) : [],
    emailUrl: u.email_url ?? null,
    homepage: u.homepage_url ?? null,
    profileUrl: u.profile_url ?? null,
    positions,
    courses,
  };
}

import type { Credentials } from './oauth';
import type { ClassEvent } from './types';
import { usosJson } from './usos';

/**
 * Ręczne poprawki planu — gdy grupa jest już zmieniona, a USOS jeszcze tego nie pokazuje.
 * Działają tylko dla właściciela (sprawdzane po imieniu i nazwisku z USOS) i tylko dopóty,
 * dopóki USOS sam nie pokaże docelowej grupy — wtedy poprawka danego przedmiotu się wyłącza.
 * Gdy USOS już wszędzie pokazuje nowe grupy, ten plik można usunąć.
 */

type Slot = { date: string; from: string; to: string; room?: string };

type Override = {
  match: RegExp; // nazwa przedmiotu
  classType: RegExp; // np. ćwiczenia
  group: number; // grupa docelowa
  courseName: string;
  classTypeLabel: string;
  room: string;
  lecturers: string[];
  slots: Slot[];
};

const OWNER = { first: 'michał', last: 'rosiek' };

const weekly = (dates: string[], from: string, to: string): Slot[] => dates.map((date) => ({ date, from, to }));

const OVERRIDES: Override[] = [
  {
    match: /technologie informacyjne/i,
    classType: /ćwicz/i,
    group: 1,
    courseName: 'Technologie informacyjne',
    classTypeLabel: 'Ćwiczenia',
    room: '0.318',
    lecturers: ['dr Aneta Lipińska'],
    slots: [
      ...weekly(
        [
          '2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26', '2026-11-09', '2026-11-16', '2026-11-23',
          '2026-11-30', '2026-12-07', '2026-12-14', '2026-12-21', '2027-01-11', '2027-01-18', '2027-01-25',
        ],
        '11:30',
        '13:00',
      ),
      { date: '2026-10-19', from: '15:00', to: '16:30' }, // dodatkowe zajęcia
    ],
  },
  {
    match: /mikroekonomia/i,
    classType: /ćwicz/i,
    group: 1,
    courseName: 'Mikroekonomia',
    classTypeLabel: 'Ćwiczenia',
    room: '1.119',
    lecturers: ['dr Judyta Lubacha'],
    slots: weekly(
      [
        '2026-10-27', '2026-11-03', '2026-11-10', '2026-11-17', '2026-11-24',
        '2026-12-01', '2026-12-08', '2026-12-15', '2026-12-22', '2027-01-12',
      ],
      '11:30',
      '13:00',
    ),
  },
];

const norm = (s: string | undefined) => (s || '').trim().toLocaleLowerCase('pl');

async function isOwner(creds: Credentials): Promise<boolean> {
  try {
    const u = await usosJson<{ first_name?: string; last_name?: string }>('users/user', creds, { fields: 'id|first_name|last_name' });
    return norm(u.first_name) === OWNER.first && norm(u.last_name) === OWNER.last;
  } catch {
    return false;
  }
}

export async function applyPlanOverrides(
  creds: Credentials,
  events: ClassEvent[],
  start: string,
  days: number,
): Promise<ClassEvent[]> {
  if (!(await isOwner(creds))) return events;

  const end = new Date(start + 'T12:00:00Z');
  end.setUTCDate(end.getUTCDate() + days);
  const endIso = end.toISOString().slice(0, 10);
  const inRange = (d: string) => d >= start && d < endIso;

  let out = events;
  for (const o of OVERRIDES) {
    const isThis = (e: ClassEvent) => e.kind === 'class' && o.match.test(e.courseName) && o.classType.test(e.classType || '');
    // USOS już pokazuje nową grupę — poprawka niepotrzebna.
    if (out.some((e) => isThis(e) && e.group === o.group)) continue;

    const old = out.filter(isThis);
    const sameCourse = old[0] ?? out.find((e) => o.match.test(e.courseName));
    const sibling = sameCourse ?? out.find((e) => e.kind === 'class' && e.building);
    out = out.filter((e) => !isThis(e));

    for (const s of o.slots.filter((s) => inRange(s.date))) {
      out.push({
        id: `override-${o.courseName}-${s.date}-${s.from}`,
        kind: 'class',
        start: `${s.date} ${s.from}:00`,
        end: `${s.date} ${s.to}:00`,
        courseId: sameCourse?.courseId ?? null,
        courseName: old[0]?.courseName ?? o.courseName,
        classType: old[0]?.classType ?? o.classTypeLabel,
        building: sibling?.building ?? null,
        buildingId: sibling?.buildingId ?? null,
        room: s.room ?? o.room,
        roomId: null,
        group: o.group,
        lecturers: o.lecturers,
      });
    }
  }
  return out === events ? events : out.sort((x, y) => x.start.localeCompare(y.start));
}

// Przykładowe dane do trybu demo (bez logowania do USOS).
import type { ClassEvent, CourseSummary, GradesResponse, Me } from './types';
import { summarize } from './usos';

export const demoMe: Me = { firstName: 'Michał', lastName: 'Demo', programme: 'Ekonomia, I stopień', demo: true };

type Slot = {
  dow: number; // 1 = poniedziałek
  from: string;
  to: string;
  course: string;
  courseId: string;
  type: string;
  room: string;
  lecturer: string;
  kind?: ClassEvent['kind'];
};

const week: Slot[] = [
  { dow: 1, from: '10:00', to: '11:30', course: 'Mikroekonomia I', courseId: 'DEMO-MIKRO', type: 'Wykład', room: 'Aula A', lecturer: 'dr hab. Anna Przykładowa' },
  { dow: 1, from: '11:45', to: '13:15', course: 'Matematyka', courseId: 'DEMO-MAT', type: 'Ćwiczenia', room: '2.14', lecturer: 'mgr Jan Kowalski' },
  { dow: 1, from: '15:00', to: '16:30', course: 'Statystyka opisowa', courseId: 'DEMO-STAT', type: 'Laboratorium', room: '0.08', lecturer: 'dr Ewa Nowak' },
  { dow: 2, from: '08:15', to: '09:45', course: 'Wstęp do prawa', courseId: 'DEMO-PRAWO', type: 'Wykład', room: 'Aula B', lecturer: 'prof. Piotr Wiśniewski' },
  { dow: 2, from: '12:00', to: '13:30', course: 'Język angielski', courseId: 'DEMO-ANG', type: 'Lektorat', room: '3.02', lecturer: 'mgr Kate Smith' },
  { dow: 3, from: '09:45', to: '11:15', course: 'Matematyka', courseId: 'DEMO-MAT', type: 'Wykład', room: 'Aula A', lecturer: 'dr Tomasz Zieliński' },
  { dow: 3, from: '11:30', to: '13:00', course: 'Mikroekonomia I', courseId: 'DEMO-MIKRO', type: 'Ćwiczenia', room: '1.09', lecturer: 'mgr Marta Lewandowska' },
  { dow: 4, from: '10:00', to: '11:30', course: 'Matematyka', courseId: 'DEMO-MAT', type: 'Kolokwium', room: '2.14', lecturer: 'mgr Jan Kowalski', kind: 'exam' },
  { dow: 4, from: '13:15', to: '14:45', course: 'Wstęp do prawa', courseId: 'DEMO-PRAWO', type: 'Ćwiczenia', room: '1.11', lecturer: 'mgr Paweł Wójcik' },
];

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function dow(iso: string): number {
  const d = new Date(iso + 'T12:00:00Z').getUTCDay();
  return d === 0 ? 7 : d;
}

export function demoPlan(start: string, days: number): ClassEvent[] {
  const out: ClassEvent[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(start, i);
    for (const s of week.filter((x) => x.dow === dow(date))) {
      out.push({
        id: `${date}-${s.courseId}-${s.from}`,
        kind: s.kind ?? 'class',
        start: `${date} ${s.from}:00`,
        end: `${date} ${s.to}:00`,
        courseId: s.courseId,
        courseName: s.course,
        classType: s.type,
        building: 'Budynek demo',
        room: s.room,
        group: 3,
        lecturers: [s.lecturer],
      });
    }
  }
  return out;
}

const g = (value: string, label: string, numeric: number | null) => ({
  value,
  numeric,
  passes: true,
  countsIntoAverage: true,
  session: 1,
  date: null,
  label,
});

export function demoGrades(): GradesResponse {
  const courses: CourseSummary[] = [
    { courseId: 'DEMO-ANG', termId: 'DEMO-Z', name: 'Język angielski', classTypes: ['Lektorat'], lecturers: ['mgr Kate Smith'], finalGrades: [], unitGrades: [g('4', 'Ocena z zajęć', 4)] },
    { courseId: 'DEMO-MAT', termId: 'DEMO-Z', name: 'Matematyka', classTypes: ['Wykład', 'Ćwiczenia'], lecturers: ['dr Tomasz Zieliński', 'mgr Jan Kowalski'], finalGrades: [], unitGrades: [] },
    { courseId: 'DEMO-MIKRO', termId: 'DEMO-Z', name: 'Mikroekonomia I', classTypes: ['Wykład', 'Ćwiczenia'], lecturers: ['dr hab. Anna Przykładowa', 'mgr Marta Lewandowska'], finalGrades: [], unitGrades: [g('5', 'Ocena z zajęć', 5)] },
    { courseId: 'DEMO-STAT', termId: 'DEMO-Z', name: 'Statystyka opisowa', classTypes: ['Laboratorium'], lecturers: ['dr Ewa Nowak'], finalGrades: [], unitGrades: [] },
    { courseId: 'DEMO-PRAWO', termId: 'DEMO-Z', name: 'Wstęp do prawa', classTypes: ['Wykład', 'Ćwiczenia'], lecturers: ['prof. Piotr Wiśniewski', 'mgr Paweł Wójcik'], finalGrades: [], unitGrades: [g('4,5', 'Ocena z zajęć', 4.5)] },
  ];
  return {
    terms: [{ id: 'DEMO-Z', name: 'Semestr zimowy 2026/27 (demo)', start: '2026-10-01', end: '2027-02-28' }],
    currentTermId: 'DEMO-Z',
    courses,
    ...summarize(courses),
  };
}

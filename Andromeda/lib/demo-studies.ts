// Przykładowe dane: egzaminy, studia/ECTS, grupy, dokumenty — tryb demo.
import { demoPlan } from './demo';
import { addDaysIso, localDate } from './usos';
import type { ExamsResponse, GroupDetail, GroupSummary, StudiesResponse, AdmDocument } from './usos-studies';

const monday = () => {
  const t = localDate();
  const dow = new Date(t + 'T12:00:00Z').getUTCDay() || 7;
  return addDaysIso(t, 1 - dow + (dow >= 6 ? 7 : 0));
};

export function demoExams(): ExamsResponse {
  const planned = [0, 7, 14].flatMap((d) => demoPlan(addDaysIso(monday(), d), 7)).filter((e) => e.kind === 'exam');
  return {
    usoswebUrl: 'https://www.usosweb.uj.edu.pl',
    planned,
    exams: [
      {
        id: 'DEMO-E1', name: 'Egzamin pisemny — I termin', courseId: 'DEMO-MIKRO', courseName: 'Mikroekonomia I', termId: 'DEMO-Z',
        description: 'Egzamin pisemny, 90 minut. Zabierz legitymację.',
        registrationStart: '2027-01-10 10:00:00', registrationEnd: '2027-01-25 23:59:00', registerUntil: '2027-01-25 23:59:00', unregisterUntil: '2027-01-27 23:59:00',
        groups: [
          { number: '1', start: '2027-02-01 09:00:00', end: '2027-02-01 10:30:00', room: { id: 'DEMO-R1', number: 'Aula A', buildingId: 'DEMO-B2', buildingName: 'Auditorium Maximum' }, examiners: [{ id: 'DEMO-P1', name: 'dr hab. Anna Przykładowa' }], capacity: 200, slots: [] },
          { number: '2', start: '2027-02-08 12:00:00', end: '2027-02-08 13:30:00', room: { id: 'DEMO-R1', number: 'Aula A', buildingId: 'DEMO-B2', buildingName: 'Auditorium Maximum' }, examiners: [{ id: 'DEMO-P1', name: 'dr hab. Anna Przykładowa' }], capacity: 200, slots: [] },
        ],
      },
      {
        id: 'DEMO-E2', name: 'Egzamin ustny', courseId: 'DEMO-PRAWO', courseName: 'Wstęp do prawa', termId: 'DEMO-Z', description: null,
        registrationStart: '2027-01-10 10:00:00', registrationEnd: '2027-01-28 23:59:00', registerUntil: null, unregisterUntil: null,
        groups: [
          { number: '1', start: '2027-02-03 09:00:00', end: '2027-02-03 15:00:00', room: { id: null, number: '3.10', buildingId: null, buildingName: 'Collegium Novum' }, examiners: [{ id: null, name: 'prof. Piotr Wiśniewski' }], capacity: 24,
            slots: [
              { number: '1', start: '2027-02-03 09:00:00', end: '2027-02-03 10:00:00', capacity: 6, taken: 6 },
              { number: '2', start: '2027-02-03 10:00:00', end: '2027-02-03 11:00:00', capacity: 6, taken: 4 },
              { number: '3', start: '2027-02-03 11:00:00', end: '2027-02-03 12:00:00', capacity: 6, taken: 1 },
            ] },
        ],
      },
    ],
  };
}

export function demoStudies(): StudiesResponse {
  return {
    ectsTotal: 0,
    programmes: [
      {
        id: 'DEMO-PR', name: 'Ekonomia, studia I stopnia, stacjonarne', faculty: 'Wydział demo', status: 'active', admission: '2026-10-01',
        level: 'pierwszego stopnia', mode: 'stacjonarne', duration: '3 lata', ectsUsed: 0,
        stages: [{ name: 'Pierwszy rok', term: 'Rok akademicki 2026/27', status: 'w trakcie' }],
      },
    ],
    term: {
      termName: 'Semestr zimowy 2026/27 (demo)',
      total: 30,
      passed: 0,
      courses: [
        { id: 'DEMO-MAT', name: 'Matematyka', ects: 8, passed: null },
        { id: 'DEMO-MIKRO', name: 'Mikroekonomia I', ects: 6, passed: null },
        { id: 'DEMO-STAT', name: 'Statystyka opisowa', ects: 6, passed: null },
        { id: 'DEMO-PRAWO', name: 'Wstęp do prawa', ects: 4, passed: null },
        { id: 'DEMO-ANG', name: 'Język angielski', ects: 2, passed: null },
        { id: 'DEMO-WF', name: 'Wychowanie fizyczne', ects: 0, passed: null },
      ],
    },
    theses: [],
    mobilities: [],
  };
}

const lect = (id: string | null, name: string) => ({ id, name });
export function demoGroups(): GroupSummary[] {
  return [
    { key: 'U1-3', unitId: 'U1', number: '3', courseId: 'DEMO-MIKRO', courseName: 'Mikroekonomia I', classType: 'Ćwiczenia', termId: 'DEMO-Z', lecturers: [lect('DEMO-P2', 'mgr Marta Lewandowska')] },
    { key: 'U2-1', unitId: 'U2', number: '1', courseId: 'DEMO-MIKRO', courseName: 'Mikroekonomia I', classType: 'Wykład', termId: 'DEMO-Z', lecturers: [lect('DEMO-P1', 'dr hab. Anna Przykładowa')] },
    { key: 'U3-3', unitId: 'U3', number: '3', courseId: 'DEMO-MAT', courseName: 'Matematyka', classType: 'Ćwiczenia', termId: 'DEMO-Z', lecturers: [lect(null, 'mgr Jan Kowalski')] },
  ];
}

export function demoGroup(key: string): GroupDetail {
  const g = demoGroups().find((x) => x.key === key) ?? demoGroups()[0];
  const people = ['Adamska Ola', 'Bielecki Tomek', 'Czarnecka Julia', 'Demo Michał', 'Kwiatkowski Kuba', 'Nowak Zuzia', 'Wójcik Bartek'];
  return { ...g, participants: people.map((n, i) => ({ id: `S${i}`, name: n.split(' ').reverse().join(' ') })), meId: 'S3' };
}

export function demoDocuments(): { documents: AdmDocument[]; usoswebUrl: string } {
  return {
    usoswebUrl: 'https://www.usosweb.uj.edu.pl',
    documents: [
      { id: 'DEMO-D1', name: 'Decyzja o przyjęciu na studia', type: 'Decyzja', status: 'Doręczono', published: '2026-09-20 10:00:00', delivered: '2026-09-21 18:12:00', blobId: null, canDownload: false, canReceive: false },
    ],
  };
}

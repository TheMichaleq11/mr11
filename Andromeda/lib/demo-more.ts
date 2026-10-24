// Przykładowe dane dla nowych sekcji w trybie demo.
import { localDate } from './usos';
import type {
  Article,
  Building,
  CalendarResponse,
  Payment,
  ProfileResponse,
  RegistrationsResponse,
  SurveyDetail,
  SurveySummary,
  TestSummary,
  TestTreeResponse,
} from './types-more';

const addDays = (n: number) => {
  const d = new Date(localDate() + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export const demoRegistrations = (): RegistrationsResponse => ({
  usoswebUrl: 'https://www.usosweb.uj.edu.pl',
  registrations: [
    {
      id: 'DEMO-R1',
      name: 'Wykłady ogólnouczelniane — semestr letni (demo)',
      message: 'Zapisy na wykłady do wyboru dla studentów I roku. Limit: 2 przedmioty.',
      status: 'active',
      faculty: 'Wydział demo',
      kind: 'zwykła',
      rounds: [
        {
          id: 'DEMO-T1',
          name: 'Tura 1 — zapisy podstawowe',
          status: 'active',
          mode: 'direct_for__courses_and_groups',
          start: `${addDays(-2)} 10:00:00`,
          end: `${addDays(5)} 23:59:00`,
          selectionLimit: 2,
          courses: [
            { courseId: 'DEMO-OG1', courseName: 'Historia Krakowa', termId: 'DEMO-L', status: 'register_and_unregister', limit: 120, count: 87, myStatus: 'accepted', canRegister: false, canUnregister: true },
            { courseId: 'DEMO-OG2', courseName: 'Psychologia decyzji', termId: 'DEMO-L', status: 'register_and_unregister', limit: 80, count: 80, myStatus: null, canRegister: true, canUnregister: false },
            { courseId: 'DEMO-OG3', courseName: 'Wstęp do programowania w Pythonie', termId: 'DEMO-L', status: 'register_and_unregister', limit: 60, count: 41, myStatus: null, canRegister: true, canUnregister: false },
          ],
        },
        { id: 'DEMO-T2', name: 'Tura 2 — dopisy', status: 'preparing', mode: null, start: `${addDays(12)} 10:00:00`, end: `${addDays(16)} 23:59:00`, selectionLimit: null, courses: [] },
      ],
    },
    { id: 'token-DEMO', name: 'Lektoraty — rejestracja żetonowa (demo)', message: 'Wybór języka i poziomu na podstawie testu.', status: 'active', faculty: null, kind: 'żetonowa', rounds: [] },
  ],
});

export const demoTests = (): TestSummary[] => [
  { rootId: 'DEMO-S1', courseId: 'DEMO-MIKRO', courseName: 'Mikroekonomia I', termId: 'DEMO-Z', name: 'Ćwiczenia — punktacja' },
  { rootId: 'DEMO-S2', courseId: 'DEMO-MAT', courseName: 'Matematyka', termId: 'DEMO-Z', name: 'Kolokwia' },
];

export const demoTestTree = (id: string): TestTreeResponse => {
  const leaf = (nid: string, name: string, points: number | null, max: number) => ({
    id: nid, name, description: null, type: 'task', points, pointsMax: max, grade: null, comment: null, children: [],
  });
  const root = {
    id, name: id === 'DEMO-S2' ? 'Kolokwia' : 'Ćwiczenia — punktacja', description: null, type: 'root', points: null, pointsMax: null, grade: null, comment: null,
    children: [
      { id: id + '-f1', name: 'Kolokwium 1', description: 'Rozdziały 1–4', type: 'folder', points: null, pointsMax: null, grade: null, comment: null,
        children: [leaf(id + '-z1', 'Zadanie 1', 5, 5), leaf(id + '-z2', 'Zadanie 2', 3.5, 5), leaf(id + '-z3', 'Zadanie 3', 4, 5)] },
      { id: id + '-f2', name: 'Kolokwium 2', description: null, type: 'folder', points: null, pointsMax: null, grade: null, comment: null,
        children: [leaf(id + '-z4', 'Zadanie 1', null, 10), leaf(id + '-z5', 'Zadanie 2', null, 10)] },
      leaf(id + '-a', 'Aktywność na zajęciach', 2, 3),
      { id: id + '-g', name: 'Ocena z ćwiczeń', description: null, type: 'grade', points: null, pointsMax: null, grade: null, comment: null, children: [] },
    ],
  };
  return { root, sum: 14.5, sumMax: 18 };
};

export const demoCalendar = (): CalendarResponse => ({
  faculties: ['Wydział demo', 'Uniwersytet Jagielloński'],
  note: null,
  events: [
    { id: 'c1', name: 'Wszystkich Świętych', start: '2026-11-01 00:00:00', end: '2026-11-01 23:59:59', type: 'public_holidays', dayOff: true, faculty: null },
    { id: 'c2', name: 'Narodowe Święto Niepodległości', start: '2026-11-11 00:00:00', end: '2026-11-11 23:59:59', type: 'public_holidays', dayOff: true, faculty: null },
    { id: 'c3', name: 'Przerwa świąteczna', start: '2026-12-22 00:00:00', end: '2027-01-06 23:59:59', type: 'holidays', dayOff: true, faculty: null },
    { id: 'c4', name: 'Zimowa sesja egzaminacyjna', start: '2027-01-30 00:00:00', end: '2027-02-12 23:59:59', type: 'exam_session', dayOff: false, faculty: 'Wydział demo' },
    { id: 'c5', name: 'Przerwa semestralna', start: '2027-02-13 00:00:00', end: '2027-02-21 23:59:59', type: 'break', dayOff: true, faculty: null },
  ].filter((e) => e.end.slice(0, 10) >= localDate()),
});

export const demoBuildings = (): Building[] => [
  { id: 'DEMO-B1', name: 'Collegium Novum', campus: 'Stare Miasto', address: 'ul. Gołębia 24, 31-007 Kraków', lat: 50.0606, lng: 19.9336, photo: null },
  { id: 'DEMO-B2', name: 'Auditorium Maximum', campus: 'Stare Miasto', address: 'ul. Krupnicza 33, 31-123 Kraków', lat: 50.0635, lng: 19.9246, photo: null },
  { id: 'DEMO-B3', name: 'Kampus 600-lecia Odnowienia UJ — budynek dydaktyczny', campus: 'Kampus 600-lecia', address: 'ul. Łojasiewicza, 30-348 Kraków', lat: 50.0285, lng: 19.9065, photo: null },
];

export const demoProfile = (): ProfileResponse => ({
  firstName: 'Michał',
  lastName: 'Demo',
  studentNumber: '1234567',
  email: 'michal.demo@student.uj.edu.pl',
  photo: null,
  usoswebUrl: 'https://www.usosweb.uj.edu.pl',
  programmes: [{ name: 'Ekonomia, studia I stopnia, stacjonarne', faculty: 'Wydział demo', status: 'active', admission: '2026-10-01' }],
  cards: [{ type: 'student', number: '0000 1234 5678', expires: '2027-03-31', issued: '2026-10-01' }],
  missing: [],
});

export const demoPayments = (): Payment[] => [
  { id: 'p1', description: 'Opłata za legitymację studencką', type: 'others', state: 'paid', amount: 22, remaining: 0, currency: 'PLN', deadline: '2026-10-15', account: null },
];

export const demoSurveys = (): SurveySummary[] => [
  { id: 'DEMO-A1', name: 'Ankieta oceny zajęć — Mikroekonomia I', type: 'course', start: '2026-10-20', end: '2026-11-15', canFill: true, filled: false, subject: 'Mikroekonomia I · Ćwiczenia', lecturer: 'mgr Marta Lewandowska' },
  { id: 'DEMO-A2', name: 'Ankieta dla studentów I roku', type: 'general', start: null, end: null, canFill: false, filled: true, subject: null, lecturer: null },
];

export const demoSurvey = (id: string): SurveyDetail => ({
  ...(demoSurveys().find((s) => s.id === id) ?? demoSurveys()[0]),
  headlineHtml: '<p>Ankieta jest anonimowa. Wypełnienie zajmie ok. 2 minut.</p>',
  hasFinalComment: true,
  questions: [
    { id: 'q1', number: '1', level: 0, html: 'Prowadzący jasno tłumaczy materiał.', answers: [1, 2, 3, 4, 5].map((n) => ({ id: `q1a${n}`, html: String(n) })), allowComment: false, commentLength: null },
    { id: 'q2', number: '2', level: 0, html: 'Zajęcia zaczynają się punktualnie.', answers: [{ id: 'q2t', html: 'Tak' }, { id: 'q2n', html: 'Nie' }], allowComment: true, commentLength: 500 },
  ],
});

export const demoNews = (): Article[] => [
  { id: 'n1', title: 'Rusza rejestracja na wykłady ogólnouczelniane (demo)', headlineHtml: '<p>Zapisy potrwają do końca przyszłego tygodnia.</p>', contentHtml: '<p>To przykładowy artykuł w trybie demo. Po zalogowaniu zobaczysz tu prawdziwe aktualności z USOS UJ.</p>', date: `${addDays(-1)} 09:00:00`, author: 'Dział Nauczania', faculty: null, image: null },
  { id: 'n2', title: 'Dzień rektorski 12 listopada (demo)', headlineHtml: '<p>Zajęcia dydaktyczne są odwołane.</p>', contentHtml: '<p>Przykładowa treść.</p>', date: `${addDays(-4)} 12:00:00`, author: null, faculty: null, image: null },
];

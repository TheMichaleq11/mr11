// Przykładowe dane dla trybu demo — nowe moduły.
import { addDaysIso, localDate } from './usos';
import type {
  BankAccount,
  CartItem,
  CustomGroup,
  GuideChapter,
  GuidePage,
  LatestGrade,
  MCard,
  Meeting,
  MeetingDetail,
  PlacementResult,
  PrimaryGroup,
  Remittance,
  SentMessage,
  Slip,
} from './usos-extra';

const d = (days: number, time = '10:00:00') => `${addDaysIso(localDate(), days)} ${time}`;

export const demoMeetings = (): Meeting[] => [
  { id: 'M1', name: 'Konsultacje — Mikroekonomia I', comment: 'Pytania do kolokwium i zadań domowych.', lecturer: 'dr hab. Anna Przykładowa', lecturerId: 'D1', facultyId: 'DEMO', faculty: 'Wydział demo', open: true, canAttend: true, autoAccept: true, soonest: d(2, '12:00:00') },
  { id: 'M2', name: 'Dyżur — Matematyka', comment: null, lecturer: 'mgr Jan Kowalski', lecturerId: 'D2', facultyId: 'DEMO', faculty: 'Wydział demo', open: true, canAttend: true, autoAccept: false, soonest: d(3, '14:30:00') },
  { id: 'M3', name: 'Spotkanie z opiekunem roku', comment: 'Sprawy organizacyjne I roku.', lecturer: 'dr Ewa Nowak', lecturerId: 'D3', facultyId: 'DEMO', faculty: 'Wydział demo', open: true, canAttend: true, autoAccept: true, soonest: d(6, '16:00:00') },
];

export function demoMeetingDetail(id: string): MeetingDetail {
  const meeting = demoMeetings().find((m) => m.id === id) ?? demoMeetings()[0];
  const base = id === 'M2' ? 3 : id === 'M3' ? 6 : 2;
  return {
    meeting,
    dates: [0, 15, 30, 45].map((min, i) => ({
      id: `${meeting.id}-${i}`,
      start: `${addDaysIso(localDate(), base)} ${String(12 + Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}:00`,
      end: `${addDaysIso(localDate(), base)} ${String(12 + Math.floor((min + 15) / 60)).padStart(2, '0')}:${String((min + 15) % 60).padStart(2, '0')}:00`,
      regStart: d(-3),
      regEnd: d(base - 1, '23:59:00'),
      seats: 1,
      accepted: i === 1 ? 1 : 0,
      waiting: 0,
      status: i === 0 ? 'accepted' : null,
      canSignUp: i > 1,
      canSignOut: i === 0,
      room: '3.12',
      comment: null,
    })),
    substantiations: [
      { id: 'S1', name: 'Pytania merytoryczne', message: null },
      { id: 'S2', name: 'Sprawy organizacyjne', message: null },
    ],
  };
}

export const demoSlips = (): Slip[] => [
  {
    id: 'O1',
    name: 'Obiegówka — rozpoczęcie studiów',
    state: 'active',
    created: d(-20),
    closed: null,
    comment: 'Zwrot karty bibliotecznej i podpis w sekretariacie.',
    issuer: 'Sekretariat demo',
    questions: [
      { question: 'Biblioteka wydziałowa — brak zaległości', status: 'cleared', answer: 'Bez zaległości', answered: d(-10), answerer: 'Biblioteka' },
      { question: 'Sekretariat — komplet dokumentów', status: 'pending', answer: null, answered: null, answerer: null },
      { question: 'Szkolenie BHP', status: 'cleared', answer: 'Zaliczone', answered: d(-15), answerer: 'Dział BHP' },
    ],
  },
];

export const demoPlacement = (): PlacementResult[] => [{ id: 'ANG', name: 'Test poziomujący — język angielski', value: 78 }];

export const demoGuide = (): GuideChapter[] => [
  { id: 'C1', title: 'Pierwsze kroki', pages: [{ id: 'P1', title: 'Legitymacja i konto' }, { id: 'P2', title: 'Poczta i Wi-Fi' }] },
  { id: 'C2', title: 'Studia', pages: [{ id: 'P3', title: 'Zapisy na zajęcia' }, { id: 'P4', title: 'Sesja i egzaminy' }] },
];

export function demoGuidePage(id: string): GuidePage {
  const title = demoGuide().flatMap((c) => c.pages).find((p) => p.id === id)?.title ?? 'Przewodnik';
  return {
    id,
    title,
    entries: [
      { id: id + 'a', title: 'Najważniejsze', html: '<p>To przykładowa strona przewodnika. Po zalogowaniu zobaczysz tu treści przygotowane przez UJ.</p>', image: null },
      { id: id + 'b', title: 'Gdzie szukać pomocy', html: '<p>Sekretariat wydziału, opiekun roku i samorząd studentów chętnie odpowiedzą na pytania.</p>', image: null },
    ],
  };
}

export const demoLatestGrades = (): LatestGrade[] => [
  { value: '5', passes: true, course: 'Mikroekonomia I', courseId: 'DEMO-MIKRO', termId: null, date: d(-2, '18:12:00'), session: 1, kind: 'Ocena z zajęć' },
  { value: '4,5', passes: true, course: 'Wstęp do prawa', courseId: 'DEMO-PRAWO', termId: null, date: d(-6, '09:40:00'), session: 1, kind: 'Ocena z zajęć' },
];

export const demoAccounts = (): BankAccount[] => [
  { number: '00 1234 5678 9012 3456 7890 1234', name: 'Indywidualne konto do opłat', owner: 'Uniwersytet Jagielloński', titlePrefix: 'Opłata — nr albumu 1234567', faculty: 'Wydział demo', currency: 'PLN', swift: null },
];
export const demoRemittances = (): Remittance[] => [];

export const demoMCard = (): MCard => ({
  whyCannotOrder: null,
  expectedExpiry: addDaysIso(localDate(), 500),
  order: { id: 'MC1', date: d(-30), status: 'received', expiry: addDaysIso(localDate(), 500), token: null, pass: null },
});

export const demoCart = (): CartItem[] => [
  { courseId: 'DEMO-OG2', course: 'Psychologia decyzji', termId: 'DEMO-L', term: 'Semestr letni (demo)', status: null, limit: 80, count: 80, choice: 1, regOpen: 'Tura 1' },
];

export const demoPrimaryGroups = (): PrimaryGroup[] => [{ id: 'PG1', name: 'Ekonomia I rok — grupa 3', members: 28 }];
export const demoCustomGroups = (): CustomGroup[] => [];
export const demoSent = (): SentMessage[] => [
  { id: 'SM1', subject: 'Pytanie o termin kolokwium', status: 'sent', date: d(-4, '21:15:00'), recipients: 1 },
];

// Typy dla modułów: zapisy, sprawdziany, kalendarz, budynki, profil, płatności, ankiety, aktualności.

// ---------- zapisy ----------
export type RoundStatus = 'active' | 'preparing' | 'closed' | string;

export type RegCourse = {
  courseId: string;
  courseName: string;
  termId: string;
  status: string | null; // register_and_unregister | register_only | unregister_only | closed
  limit: number | null;
  count: number | null;
  myStatus: string | null; // accepted | ask | refused | ... | null
  canRegister: boolean;
  canUnregister: boolean;
  /** Zapis wymaga przypięcia przedmiotu do kierunku (deklaracja w programie studiów). */
  linkage: boolean;
  choice: number | null;
};

export type RegRound = {
  id: string;
  name: string;
  status: RoundStatus;
  mode: string | null;
  start: string | null;
  end: string | null;
  selectionLimit: number | null;
  courses: RegCourse[] | null; // null = nie pobrano (tura nieaktywna)
};

export type Registration = {
  id: string;
  name: string;
  message: string | null;
  status: string | null;
  faculty: string | null;
  kind: 'zwykła' | 'żetonowa';
  rounds: RegRound[];
};

export type RegProgramme = { id: string; name: string };
export type RegistrationsResponse = { registrations: Registration[]; usoswebUrl: string; programmes: RegProgramme[] };

// ---------- sprawdziany ----------
export type TestSummary = { rootId: string; courseId: string | null; courseName: string; termId: string | null; name: string };
export type TestsResponse = { tests: TestSummary[] };

export type TestNode = {
  id: string;
  name: string;
  description: string | null;
  type: 'root' | 'folder' | 'task' | 'grade' | string;
  points: number | null;
  pointsMax: number | null;
  grade: string | null;
  comment: string | null;
  children: TestNode[];
};
export type TestTreeResponse = { root: TestNode; sum: number | null; sumMax: number | null };

// ---------- kalendarz ----------
export type CalEvent = {
  id: string;
  name: string;
  start: string;
  end: string;
  type: string;
  dayOff: boolean;
  faculty: string | null;
};
export type CalendarResponse = { events: CalEvent[]; faculties: string[]; note: string | null };

// ---------- budynki ----------
export type Building = {
  id: string;
  name: string;
  campus: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  photo: string | null;
};
export type BuildingsResponse = { buildings: Building[] };

// ---------- profil ----------
export type Card = { type: string; number: string | null; expires: string | null; issued: string | null };
export type Programme = { name: string; faculty: string | null; status: string | null; admission: string | null };
export type ProfileResponse = {
  firstName: string;
  lastName: string;
  studentNumber: string | null;
  email: string | null;
  photo: string | null;
  usoswebUrl: string;
  programmes: Programme[];
  cards: Card[] | null; // null = brak uprawnienia
  missing: string[]; // sekcje, do których token nie ma dostępu
};

// ---------- płatności ----------
export type Payment = {
  id: string;
  description: string;
  type: string | null;
  state: string | null;
  amount: number | null;
  remaining: number | null;
  currency: string;
  deadline: string | null;
  account: string | null;
};
export type PaymentsResponse = { payments: Payment[] };

// ---------- ankiety ----------
export type SurveySummary = {
  id: string;
  name: string;
  type: string;
  start: string | null;
  end: string | null;
  canFill: boolean;
  filled: boolean;
  subject: string | null; // przedmiot / grupa
  lecturer: string | null;
};
export type SurveysResponse = { surveys: SurveySummary[] };

export type SurveyQuestion = {
  id: string;
  number: string;
  level: number;
  html: string;
  answers: { id: string; html: string }[];
  allowComment: boolean;
  commentLength: number | null;
};
export type SurveyDetail = SurveySummary & { headlineHtml: string | null; questions: SurveyQuestion[]; hasFinalComment: boolean };

// ---------- aktualności ----------
export type Article = {
  id: string;
  title: string;
  headlineHtml: string;
  contentHtml: string | null;
  date: string | null;
  author: string | null;
  faculty: string | null;
  image: string | null;
};
export type NewsResponse = { articles: Article[]; total: number; nextPage: boolean };

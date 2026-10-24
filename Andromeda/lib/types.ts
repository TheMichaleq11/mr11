// Wspólne typy danych, już po przetworzeniu odpowiedzi USOS API.

export type ClassEvent = {
  id: string;
  kind: 'class' | 'exam' | 'meeting' | 'other';
  start: string; // ISO, czas lokalny "YYYY-MM-DD HH:MM:SS"
  end: string;
  courseId: string | null;
  courseName: string;
  classType: string | null; // np. "Wykład", "Ćwiczenia"
  building: string | null;
  room: string | null;
  group: number | null;
  lecturers: string[];
};

export type Grade = {
  value: string; // "4,5", "zal", "ZAL"
  numeric: number | null;
  passes: boolean | null;
  countsIntoAverage: boolean;
  session: number | null;
  date: string | null;
  label: string; // np. "Egzamin", "Ćwiczenia"
};

export type CourseSummary = {
  courseId: string;
  termId: string;
  name: string;
  classTypes: string[];
  lecturers: string[];
  finalGrades: Grade[];
  unitGrades: Grade[];
};

export type Term = {
  id: string;
  name: string;
  start: string | null;
  end: string | null;
};

export type Me = {
  firstName: string;
  lastName: string;
  programme: string | null;
  demo: boolean;
};

export type PlanResponse = { start: string; days: number; events: ClassEvent[] };

export type GradesResponse = {
  terms: Term[];
  currentTermId: string | null;
  courses: CourseSummary[];
  average: number | null;
  gradedCount: number;
};

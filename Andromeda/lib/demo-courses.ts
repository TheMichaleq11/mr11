// Przykładowy sylabus i profile prowadzących dla trybu demo.
import type { CourseHit, Person, PersonHit, SyllabusResponse } from './usos-courses';

const names: Record<string, string> = {
  'DEMO-MIKRO': 'Mikroekonomia I',
  'DEMO-MAT': 'Matematyka',
  'DEMO-STAT': 'Statystyka opisowa',
  'DEMO-PRAWO': 'Wstęp do prawa',
  'DEMO-ANG': 'Język angielski',
};

export function demoSyllabus(courseId: string): SyllabusResponse {
  const name = names[courseId] ?? 'Przedmiot demo';
  return {
    courseId,
    name,
    termId: 'DEMO-Z',
    ects: courseId === 'DEMO-MAT' ? 8 : 6,
    language: 'polski',
    faculty: 'Wydział demo',
    passing: 'not_yet_passed',
    homepage: null,
    profileUrl: null,
    coordinators: [{ id: 'DEMO-P1', name: 'dr hab. Anna Przykładowa' }],
    lecturers: [
      { id: 'DEMO-P1', name: 'dr hab. Anna Przykładowa' },
      { id: 'DEMO-P2', name: 'mgr Marta Lewandowska' },
    ],
    sections: [
      { title: 'Opis przedmiotu', html: `Przykładowy opis przedmiotu „${name}” w trybie demo. Po zalogowaniu do USOS zobaczysz tu prawdziwy sylabus.` },
      { title: 'Efekty uczenia się', html: 'Student:<br>– zna podstawowe pojęcia przedmiotu,<br>– potrafi rozwiązywać typowe zadania,<br>– umie interpretować wyniki.' },
      { title: 'Kryteria oceniania', html: 'Kolokwia: 40%<br>Egzamin pisemny: 60%<br>Próg zaliczenia: 51%.' },
      { title: 'Literatura', html: '1. Podręcznik podstawowy, wyd. 2024.<br>2. Zbiór zadań, wyd. 2022.' },
    ],
    attributes: [{ name: 'Rodzaj przedmiotu', values: ['obowiązkowy'] }],
    units: [
      { id: 'u1', classType: 'Wykład', homepage: null, sections: [{ title: 'Tematy zajęć', html: '1. Wprowadzenie<br>2. Popyt i podaż<br>3. Elastyczność<br>4. Teoria konsumenta' }] },
      { id: 'u2', classType: 'Ćwiczenia', homepage: null, sections: [{ title: 'Metody dydaktyczne', html: 'Rozwiązywanie zadań, praca w grupach, krótkie kartkówki.' }] },
    ],
    groups: [{ classType: 'Ćwiczenia', number: '3', lecturers: [{ id: 'DEMO-P2', name: 'mgr Marta Lewandowska' }], sections: [{ title: 'Opis grupy', html: 'Spotkania w sali 1.09. Materiały na platformie Pegaz.' }] }],
  };
}

export function demoPerson(id: string): Person {
  const isP2 = id === 'DEMO-P2';
  return {
    id,
    name: isP2 ? 'Marta Lewandowska' : 'Anna Przykładowa',
    titlesBefore: isP2 ? 'mgr' : 'dr hab.',
    titlesAfter: null,
    photo: null,
    officeHours: isP2 ? 'Środa 13:15–14:45, pokój 1.12' : 'Poniedziałek 12:00–13:30 (po wcześniejszym mailu)',
    room: { number: '1.12', buildingId: 'DEMO-B3', buildingName: 'Kampus 600-lecia (demo)' },
    phones: ['+48 12 000 00 00'],
    emailUrl: null,
    homepage: null,
    profileUrl: null,
    positions: [isP2 ? 'asystent · Wydział demo' : 'profesor uczelni · Wydział demo'],
    courses: [{ id: 'DEMO-MIKRO', name: 'Mikroekonomia I', termId: 'DEMO-Z', termName: 'Semestr zimowy 2026/27' }],
  };
}

export function demoPeopleSearch(q: string): PersonHit[] {
  return [demoPerson('DEMO-P1'), demoPerson('DEMO-P2')]
    .filter((p) => `${p.titlesBefore} ${p.name}`.toLowerCase().includes(q.toLowerCase()))
    .map((p) => ({ id: p.id, name: `${p.titlesBefore} ${p.name}`, match: null }));
}

export function demoCourseSearch(q: string): CourseHit[] {
  return Object.entries(names)
    .filter(([, n]) => n.toLowerCase().includes(q.toLowerCase()))
    .map(([id, name]) => ({ id, name }));
}

// Każdy przedmiot dostaje stały kolor (z kodu przedmiotu), żeby był rozpoznawalny wszędzie.
export type CourseColor = { dot: string; bg: string; ink: string };

const palette: CourseColor[] = [
  { dot: '#2F5BEA', bg: 'var(--c-blue-bg)', ink: 'var(--c-blue-ink)' },
  { dot: '#E0782B', bg: 'var(--c-orange-bg)', ink: 'var(--c-orange-ink)' },
  { dot: '#12A37F', bg: 'var(--c-teal-bg)', ink: 'var(--c-teal-ink)' },
  { dot: '#7A5AF8', bg: 'var(--c-purple-bg)', ink: 'var(--c-purple-ink)' },
  { dot: '#D6457A', bg: 'var(--c-pink-bg)', ink: 'var(--c-pink-ink)' },
  { dot: '#B8901A', bg: 'var(--c-gold-bg)', ink: 'var(--c-gold-ink)' },
];

// Gdy znamy listę przedmiotów z semestru, rozdajemy kolory po kolei — bez powtórzeń.
const assigned = new Map<string, CourseColor>();
let assignedKey = '';

/** Zwraca true, jeśli przydział kolorów się zmienił. */
export function registerCourses(ids: string[]): boolean {
  const sorted = [...new Set(ids)].sort();
  const key = sorted.join('|');
  if (key === assignedKey) return false;
  assignedKey = key;
  assigned.clear();
  sorted.forEach((id, i) => assigned.set(id, palette[i % palette.length]));
  return true;
}

export function courseColor(key: string | null | undefined): CourseColor {
  const known = key ? assigned.get(key) : undefined;
  if (known) return known;
  const s = key || '?';
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

export function gradeTone(numeric: number | null, passes: boolean | null): 'good' | 'ok' | 'bad' | 'none' {
  if (numeric === null) return passes === false ? 'bad' : passes ? 'good' : 'none';
  if (numeric >= 4.5) return 'good';
  if (numeric >= 3) return 'ok';
  return 'bad';
}

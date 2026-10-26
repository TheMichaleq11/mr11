// Każdy przedmiot dostaje stały kolor (z kodu przedmiotu), żeby był rozpoznawalny wszędzie.
export type CourseColor = { dot: string; bg: string; ink: string };

// Jednolity wygląd: wszystkie przedmioty mają ten sam akcent (błękit z logo).
// Zostawiamy mechanizm przydziału, gdyby kiedyś wróciły kolory przedmiotów.
const palette: CourseColor[] = [
  { dot: 'var(--accent)', bg: 'var(--accent-soft)', ink: 'var(--accent-ink)' },
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

// Kolor typu zajęć — jak w aplikacji USOS: każdy typ ma swój kolor paska.
const TYPE_COLORS: [RegExp, string][] = [
  [/wyk/i, '#3D8BFF'], // wykład
  [/ćwicz|cwicz/i, '#A06BF0'], // ćwiczenia
  [/konwers/i, '#34B26A'], // konwersatorium
  [/fizycz|wf|wychowanie/i, '#14A89A'], // zajęcia fizyczne / WF
  [/lektor|język/i, '#F0A23A'], // lektorat
  [/labor/i, '#EC6FA8'], // laboratorium
  [/semin|prosemin/i, '#F07A5A'], // seminarium, proseminarium
  [/projekt/i, '#4FC3E8'], // projekt
  [/warszt/i, '#B9CC3F'], // warsztaty
];

/** Kolor paska dla typu zajęć (np. „Wykład”, „Ćwiczenia”). */
export function typeColor(classType: string | null | undefined): string {
  const t = classType ?? '';
  for (const [re, c] of TYPE_COLORS) if (re.test(t)) return c;
  return '#8A96B8';
}

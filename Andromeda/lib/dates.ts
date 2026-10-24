// Daty po polsku, liczone w czasie urządzenia (telefon/komputer w Polsce).

export const toDate = (usos: string) => new Date(usos.replace(' ', 'T'));

export function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return isoDay(d);
}

export function mondayOf(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  const dow = d.getDay() === 0 ? 7 : d.getDay();
  return addDays(iso, 1 - dow);
}

export const today = () => isoDay(new Date());

/** Poniedziałek "bieżącego" tygodnia — w sobotę i niedzielę to już nadchodzący tydzień. */
export function activeMonday(iso = today()): string {
  const dow = new Date(iso + 'T12:00:00').getDay();
  return dow === 6 || dow === 0 ? addDays(mondayOf(iso), 7) : mondayOf(iso);
}

export const hhmm = (usos: string) => usos.slice(11, 16);
export const dayOf = (usos: string) => usos.slice(0, 10);

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function longDate(iso: string): string {
  return cap(
    new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' }).format(
      new Date(iso + 'T12:00:00'),
    ),
  );
}

export function shortWeekday(iso: string): string {
  const names = ['Nd', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'];
  return names[new Date(iso + 'T12:00:00').getDay()];
}

export function dayNumber(iso: string): string {
  return String(Number(iso.slice(8, 10)));
}

export function shortDate(iso: string): string {
  return `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;
}

/** "dziś", "jutro", "za 3 dni" */
export function relativeDay(iso: string, from = today()): string {
  const diff = Math.round(
    (new Date(iso + 'T12:00:00').getTime() - new Date(from + 'T12:00:00').getTime()) / 86400000,
  );
  if (diff === 0) return 'dziś';
  if (diff === 1) return 'jutro';
  if (diff === -1) return 'wczoraj';
  if (diff > 1) return `za ${diff} dni`;
  return `${-diff} dni temu`;
}

export function weekRangeLabel(monday: string): string {
  const fri = addDays(monday, 4);
  return `${shortDate(monday)} – ${shortDate(fri)}`;
}

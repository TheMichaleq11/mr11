// Test sylabusa, katalogu i profili prowadzących (bez sieci).
// Uruchom: npx tsx scripts/test-courses.mts
process.env.USOS_CONSUMER_KEY = 'k';
process.env.USOS_CONSUMER_SECRET = 's';

const calls: { method: string; params: URLSearchParams }[] = [];
const responses: Record<string, (p: URLSearchParams) => unknown> = {
  'courses/course': () => ({
    id: 'WZ-101', name: { pl: 'Mikroekonomia I' }, ects_credits_simplified: 6, lang_id: 'pl', fac_id: 'F1', terms: ['2026Z', '2025Z'],
    profile_url: 'https://www.usosweb.uj.edu.pl/x', description: { pl: 'Linia 1\nLinia 2 <script>alert(1)</script>' },
    learning_outcomes: { pl: '<p>Zna <b>pojęcia</b></p><img src="javascript:x">' }, bibliography: { pl: '' },
    attributes2: [{ name: { pl: 'Rodzaj' }, values: [{ pl: 'obowiązkowy' }] }],
  }),
  'courses/course_edition': () => ({
    course_id: 'WZ-101', term_id: '2026Z', passing_status: 'not_yet_passed',
    coordinators: [{ id: 7, first_name: 'Anna', last_name: 'Nowak', titles: { before: 'dr hab.' } }],
    lecturers: [{ id: 7, first_name: 'Anna', last_name: 'Nowak' }, { id: 8, first_name: 'Jan', last_name: 'Kos' }],
    user_groups: [{ course_unit_id: 55, group_number: 3 }], course_units_ids: ['55', '56'],
  }),
  'courses/unit': (p) => (p.get('unit_id') === '55' ? { id: 55, classtype_id: 'CW', topics: { pl: '1. Popyt' } } : { id: 56, classtype_id: 'WYK', topics: { pl: '' } }),
  'courses/classtypes_index': () => ({ CW: { name: { pl: 'Ćwiczenia' } }, WYK: { name: { pl: 'Wykład' } } }),
  'groups/group': () => ({ course_unit_id: 55, group_number: 3, class_type: { pl: 'Ćwiczenia' }, lecturers: [{ id: 8, first_name: 'Jan', last_name: 'Kos' }], group_description: { pl: 'Sala 1.09' } }),
  'fac/faculty': () => ({ id: 'F1', name: { pl: 'Wydział Zarządzania' } }),
  'users/user': () => ({
    id: 7, first_name: 'Anna', last_name: 'Nowak', titles: { before: 'dr hab.', after: null }, photo_urls: { '50x50': 'a', '200x250': 'b' },
    office_hours: { pl: 'pon 12-13' }, room: { id: 1, number: '1.12', building_id: 'B1', building_name: { pl: 'Kampus' } },
    phone_numbers: ['12 345'], email_url: 'https://e', employment_positions: [{ position: { name: { pl: 'adiunkt' } }, faculty: { name: { pl: 'WZiKS' } } }],
    course_editions_conducted: [{ id: 'x', course: { id: 'WZ-101', name: { pl: 'Mikro' } }, term: { id: '2026Z', name: { pl: 'Zima' } } }],
  }),
  'users/search2': () => ({ items: [{ user: { id: 7, first_name: 'Anna', last_name: 'Nowak', titles: { before: 'dr' } }, match: '<b>Anna</b> Nowak' }], next_page: false }),
  'courses/search': () => ({ items: [{ course_id: 'WZ-101', course_name: { pl: 'Mikroekonomia I' } }], next_page: false }),
};

globalThis.fetch = (async (url: string, init: { body: string }) => {
  const method = String(url).split('/services/')[1];
  const params = new URLSearchParams(init.body);
  calls.push({ method, params });
  const h = responses[method];
  if (!h) return new Response(JSON.stringify({ message: 'nieznana ' + method }), { status: 400 });
  return new Response(JSON.stringify(h(params)), { status: 200 });
}) as typeof fetch;

const m = await import('../lib/usos-courses');
const creds = { consumerKey: 'k', consumerSecret: 's', token: 't', tokenSecret: 'ts' };
const check = (c: boolean, msg: string) => {
  console.log(`${c ? 'OK  ' : 'BŁĄD'} ${msg}`);
  if (!c) process.exitCode = 1;
};

const s = await m.fetchSyllabus(creds, 'WZ-101', null);
check(s.termId === '2026Z', 'semestr domyślny = najnowsze wydanie');
check(s.ects === 6 && s.language === 'polski' && s.faculty === 'Wydział Zarządzania', 'ECTS, język, wydział');
const opis = s.sections.find((x) => x.title === 'Opis przedmiotu')!;
check(opis.html.includes('Linia 1<br>Linia 2') && !opis.html.includes('<script'), 'zwykły tekst: entery → <br>, skrypt zneutralizowany');
const efekty = s.sections.find((x) => x.title === 'Efekty uczenia się')!;
check(efekty.html.includes('<b>pojęcia</b>') && !efekty.html.includes('javascript'), 'HTML oczyszczony');
check(!s.sections.some((x) => x.title === 'Literatura'), 'puste sekcje pominięte');
check(s.units.length === 2 && s.units[0].classType === 'Ćwiczenia' && s.units[0].sections[0].title === 'Tematy zajęć', 'formy zajęć z nazwami typów');
check(s.groups[0].number === '3' && s.groups[0].lecturers[0].name === 'Jan Kos' && s.groups[0].sections[0].html === 'Sala 1.09', 'Twoja grupa z opisem i prowadzącym');
check(s.coordinators[0].id === '7' && s.coordinators[0].name === 'dr hab. Anna Nowak', 'koordynator z tytułem i id');
check(s.attributes[0].name === 'Rodzaj' && s.attributes[0].values[0] === 'obowiązkowy', 'atrybuty przedmiotu');

const p = await m.fetchPerson(creds, '7');
check(p.photo === 'b' && p.officeHours === 'pon 12-13', 'profil: zdjęcie i dyżur');
check(p.room?.number === '1.12' && p.room?.buildingId === 'B1' && p.room?.buildingName === 'Kampus', 'profil: pokój z budynkiem');
check(p.positions[0] === 'adiunkt · WZiKS' && p.courses[0].id === 'WZ-101', 'profil: stanowisko i prowadzone przedmioty');

const ppl = await m.searchPeople(creds, 'Anna');
check(ppl[0].id === '7' && ppl[0].name === 'dr Anna Nowak', 'wyszukiwarka prowadzących');
const sp = calls.find((c) => c.method === 'users/search2')!;
check(sp.params.get('among') === 'current_staff|current_teachers', 'szuka tylko wśród pracowników');
const cs = await m.searchCourses(creds, 'mikro');
check(cs[0].id === 'WZ-101' && cs[0].name === 'Mikroekonomia I', 'katalog przedmiotów');

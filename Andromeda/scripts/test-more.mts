// Test nowych modułów (zapisy, sprawdziany, kalendarz, ankiety, profil) bez sieci.
// Uruchom: npx tsx scripts/test-more.mts
process.env.USOS_CONSUMER_KEY = 'k';
process.env.USOS_CONSUMER_SECRET = 's';

const calls: { method: string; params: URLSearchParams }[] = [];

const responses: Record<string, (p: URLSearchParams) => unknown> = {
  'users/user': () => ({ id: '1', first_name: 'Michał', last_name: 'Rosiek', student_number: '1111111', profile_url: 'https://www.usosweb.uj.edu.pl/kontroler.php?_action=katalog2/osoby/pokazOsobe&os_id=1', photo_urls: { '50x50': 'https://x/50.jpg', '200x200': 'https://x/200.jpg' } }),
  'registrations/user_registrations': () => [
    { id: 'R1', description: { pl: 'Wykłady OGUN' }, message: { pl: '<p>Zapisy <b>trwają</b></p>' }, status: 'active', type: 'course', faculty: { id: 'F1', name: { pl: 'Wydział' } }, rounds: [
      { id: 'T1', name: { pl: 'Tura 1' }, status: 'active', registration_mode: 'direct_for__courses_and_groups', start_date: '2026-10-20 10:00:00', end_date: '2026-10-30 23:59:00' },
      { id: 'T0', name: { pl: 'Tura 0' }, status: 'closed', start_date: '2026-10-01 10:00:00', end_date: '2026-10-05 23:59:00' },
    ] },
  ],
  'registrations/user_token_registrations': () => [],
  'registrations/registration_round_courses': () => [
    { course: { id: 'C1', name: { pl: 'Historia' } }, term_id: '2026Z', status: 'register_and_unregister', limits: 10, registrations_count: 5, user_registration_status: 'accepted' },
    { course: { id: 'C2', name: { pl: 'Astronomia' } }, term_id: '2026Z', status: 'register_only', limits: 10, registrations_count: 10, user_registration_status: null },
  ],
  'registrations/register': () => ({}),
  'crstests/participant2': () => [{ course_edition: { course_id: 'C1', course_name: { pl: 'Historia' }, term_id: '2026Z' }, root: { id: 100, name: { pl: 'Kolokwia' } } }],
  'crstests/node2': () => ({ id: 100, name: { pl: 'Kolokwia' }, type: 'root', subnodes_deep: [
    { id: 101, parent_id: 100, order: 1, name: { pl: 'Kolokwium 1' }, type: 'folder', visible_for_students: true },
    { id: 102, parent_id: 101, order: 2, name: { pl: 'Zad 2' }, type: 'task', visible_for_students: true },
    { id: 103, parent_id: 101, order: 1, name: { pl: 'Zad 1' }, type: 'task', visible_for_students: true },
    { id: 104, parent_id: 100, order: 2, name: { pl: 'Ocena' }, type: 'grade', visible_for_students: true },
    { id: 105, parent_id: 100, order: 3, name: { pl: 'Ukryte' }, type: 'task', visible_for_students: false },
  ] }),
  'crstests/user_points': () => [{ node_id: 102, points: 3.5, comment: 'dobrze' }, { node_id: 103, points: '4', comment: null }],
  'crstests/user_grades': () => [{ node_id: 104, grade: { value_symbol: '4,5' }, public_comment: null }],
  'crstests/task_node_details': (p) => ({ points_max: p.get('id') === '102' ? 5 : 6 }),
  'progs/student': () => [{ id: 'P1', status: 'active', admission_date: '2026-10-01', programme: { id: 'EK', description: { pl: 'Ekonomia' }, faculty: { id: 'F1', name: { pl: 'Wydział' } } } }],
  'fac/faculty': () => ({ id: 'F1', path: [{ id: 'UJ' }] }),
  'calendar/search': (p) =>
    p.get('faculty_id') === 'UJ' && p.get('start_date')!.startsWith('2026-11')
      ? [{ id: 'E1', name: { pl: 'Dzień rektorski' }, start_date: '2026-11-12 00:00:00', end_date: '2026-11-12 23:59:59', type: 'rector', is_day_off: true, faculty: { name: { pl: 'UJ' } } }]
      : [],
  'cards/user': () => [{ type: 'student', barcode_number: '123', expiration_date: '2027-03-31', date_of_issue: '2026-10-01' }],
  'surveys/fill_out2': () => ({}),
};

globalThis.fetch = (async (url: string, init: { body: string }) => {
  const method = String(url).split('/services/')[1];
  const params = new URLSearchParams(init.body);
  if (!params.get('oauth_signature')) throw new Error('niepodpisane');
  calls.push({ method, params });
  const handler = responses[method];
  if (!handler) return new Response(JSON.stringify({ message: 'nieznana metoda ' + method }), { status: 400 });
  return new Response(JSON.stringify(handler(params)), { status: 200 });
}) as typeof fetch;

const m = await import('../lib/usos-more');
const creds = { consumerKey: 'k', consumerSecret: 's', token: 't', tokenSecret: 'ts' };
const check = (cond: boolean, msg: string) => {
  console.log(`${cond ? 'OK  ' : 'BŁĄD'} ${msg}`);
  if (!cond) process.exitCode = 1;
};

const regs = await m.fetchRegistrations(creds);
const r = regs.registrations[0];
const t1 = r.rounds.find((x) => x.id === 'T1')!;
check(regs.usoswebUrl === 'https://www.usosweb.uj.edu.pl', 'adres USOSweb z profilu');
check(r.message === 'Zapisy trwają', 'komunikat rejestracji bez HTML');
check(r.rounds[0].id === 'T0' && t1.courses?.length === 2, 'tury posortowane, przedmioty tylko dla aktywnej');
check(r.rounds.find((x) => x.id === 'T0')!.courses === null, 'zamknięta tura bez pobierania przedmiotów');
const c1 = t1.courses!.find((c) => c.courseId === 'C1')!;
const c2 = t1.courses!.find((c) => c.courseId === 'C2')!;
check(c1.canUnregister && !c1.canRegister, 'zapisany przedmiot: można się wypisać');
check(c2.canRegister && !c2.canUnregister, 'wolny przedmiot: można się zapisać');

await m.registerAction(creds, 'register', 'T1', 'C2', '2026Z');
const reg = calls.find((c) => c.method === 'registrations/register')!;
check(reg.params.get('round_id') === 'T1' && reg.params.get('course_id') === 'C2' && reg.params.get('term_id') === '2026Z', 'zapis wysyła round_id, course_id, term_id');

const tests = await m.fetchTests(creds);
check(tests.length === 1 && tests[0].rootId === '100' && tests[0].courseName === 'Historia', 'lista sprawdzianów');
const tree = await m.fetchTestTree(creds, '100');
const folder = tree.root.children[0];
check(folder.name === 'Kolokwium 1' && folder.children.map((c) => c.name).join(',') === 'Zad 1,Zad 2', 'drzewo: kolejność wg order');
check(!JSON.stringify(tree).includes('Ukryte'), 'ukryte zadania pominięte');
check(tree.sum === 7.5 && tree.sumMax === 11, `suma punktów ${tree.sum}/${tree.sumMax}`);
check(tree.root.children[1].grade === '4,5', 'ocena z węzła oceny');

const cal = await m.fetchCalendar(creds);
check(cal.events.length === 1 && cal.events[0].dayOff && cal.events[0].type === 'rector', 'kalendarz: dzień rektorski z jednostki nadrzędnej');
const facIds = new Set(calls.filter((c) => c.method === 'calendar/search').map((c) => c.params.get('faculty_id')));
check(facIds.has('F1') && facIds.has('UJ'), 'kalendarz pytany dla wydziału i całego UJ');
check(calls.filter((c) => c.method === 'calendar/search').every((c) => c.params.get('end_date')! > c.params.get('start_date')!), 'zakresy dat po maks. miesiąc');

const prof = await m.fetchProfile(creds);
check(prof.photo === 'https://x/200.jpg' && prof.cards?.[0].expires === '2027-03-31' && prof.programmes[0].faculty === 'Wydział', 'profil: zdjęcie, legitymacja, kierunek');

await m.fillSurvey(creds, 'S1', { q1: { answer: 'a3', comment: null }, q2: { answer: null, comment: '  ok  ' }, q3: { answer: null, comment: '' } }, '');
const fill = calls.find((c) => c.method === 'surveys/fill_out2')!;
const answers = JSON.parse(fill.params.get('answers')!);
check(answers.q1.answers[0] === 'a3' && answers.q1.comment === null, 'ankieta: odpowiedź jako lista');
check(answers.q2.comment === 'ok' && !('q3' in answers), 'ankieta: komentarz przycięty, puste pytania pominięte');
check(!fill.params.has('comment'), 'ankieta: pusty komentarz końcowy nie jest wysyłany');

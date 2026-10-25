// Test: egzaminy, studia/ECTS, grupy i poczta, dokumenty, plan sali, iCal (bez sieci).
// Uruchom: npx tsx scripts/test-studies.mts
process.env.USOS_CONSUMER_KEY = 'k';
process.env.USOS_CONSUMER_SECRET = 's';

const calls: { method: string; params: URLSearchParams }[] = [];
const nestedRejected = new Set(['exams/student_exams']);

const responses: Record<string, (p: URLSearchParams) => unknown> = {
  'users/user': () => ({ id: '42', profile_url: 'https://www.usosweb.uj.edu.pl/p' }),
  'exams/student_exams': () => [{ id: 9, name: { pl: 'Egzamin I termin' }, course: { id: 'C1', name: { pl: 'Mikro' } }, term: { id: '2026Z' }, registration_start: '2027-01-10 10:00:00', registration_end: '2027-01-25 23:59:00', groups: [1, 2] }],
  'exams/group': (p) => ({ number: Number(p.get('group_number')), exam_start: `2027-02-0${p.get('group_number')} 09:00:00`, exam_end: '2027-02-01 10:30:00', capacity: 100, room: { id: 5, number: '1.09', building_id: 'B1', building_name: { pl: 'Kampus' } }, examiners: [{ id: 7, first_name: 'Anna', last_name: 'Nowak' }], slots: [{ number: 1, start: '2027-02-01 09:00:00', capacity: 10, attendees_count: 3 }] }),
  'tt/student': (p) => (p.get('start') === '2026-10-25' ? [{ type: 'exam', start_time: '2026-10-29 10:00:00', end_time: '2026-10-29 11:00:00', course_id: 'C2', course_name: { pl: 'Matma' } }] : []),
  'progs/student': () => [{ id: 'SP1', status: 'active', admission_date: '2026-10-01', stages: [{ stage: { name: { pl: 'Pierwszy rok' } }, term: { name: { pl: '2026/27' } } }], programme: { id: 'EK', description: { pl: 'Ekonomia' }, faculty: { name: { pl: 'WZ' } }, level_of_studies: { pl: 'I stopnia' } } }],
  'credits/used_sum': (p) => (p.get('students_programme_id') ? 12 : 18),
  'courses/user': () => ({ course_editions: { '2026Z': [{ course_id: 'C1', course_name: { pl: 'Mikro' }, term_id: '2026Z' }, { course_id: 'C2', course_name: { pl: 'Matma' }, term_id: '2026Z' }] }, terms: [{ id: '2026Z', name: { pl: 'Zima' }, start_date: '2026-10-01', end_date: '2027-02-28' }] }),
  'grades/terms2': () => ({ '2026Z': { C1: { course_grades: [{ '1': { value_symbol: '4', passes: true, counts_into_average: true, exam_session_number: 1 } }] }, C2: { course_grades: [] } } }),
  'courses/course': (p) => ({ id: p.get('course_id'), ects_credits_simplified: p.get('course_id') === 'C1' ? 6 : 8 }),
  'theses/user': () => ({ authored_theses: [] }),
  'mobility/student': () => [],
  'groups/user': () => ({ groups: { '2026Z': [{ course_unit_id: 55, group_number: 3, class_type: { pl: 'Ćwiczenia' }, course_id: 'C1', course_name: { pl: 'Mikro' }, term_id: '2026Z', lecturers: [{ id: 7, first_name: 'Anna', last_name: 'Nowak' }], relationship_type: 'participant' }, { course_unit_id: 99, group_number: 1, course_name: { pl: 'X' }, relationship_type: 'lecturer' }] }, terms: [] }),
  'groups/group': () => ({ course_unit_id: 55, group_number: 3, class_type: { pl: 'Ćwiczenia' }, course_name: { pl: 'Mikro' }, lecturers: [], participants: [{ id: 2, first_name: 'Zenon', last_name: 'B' }, { id: 1, first_name: 'Ala', last_name: 'A' }] }),
  'mailclient/create_and_send_message': () => ({ message_id: 1 }),
  'adm_documents/user_documents': () => [{ id: 'D1', name: { pl: 'Decyzja' }, actions: ['GET_DOCUMENT'], id_blobbox: 'BLOB1', published_date: '2026-09-20' }, { id: 'D2', name: { pl: 'Pismo' }, actions: ['RECEIVE_DOCUMENT'], id_blobbox: null }],
  'blobbox/get': () => 'PDFDATA',
  'tt/upcoming_share': () => ({ webcal_url: 'webcal://apps.usos.uj.edu.pl/x?key=abc' }),
};

globalThis.fetch = (async (url: string, init: { body: string }) => {
  const method = String(url).split('/services/')[1];
  const params = new URLSearchParams(init.body);
  calls.push({ method, params });
  if (nestedRejected.has(method) && (params.get('fields') || '').includes('groups[')) {
    return new Response(JSON.stringify({ message: 'bad field' }), { status: 400 });
  }
  const h = responses[method];
  if (!h) return new Response(JSON.stringify({ message: 'nieznana ' + method }), { status: 400 });
  const out = h(params);
  return new Response(typeof out === 'string' ? out : JSON.stringify(out), { status: 200, headers: { 'content-type': method === 'blobbox/get' ? 'application/pdf' : 'application/json' } });
}) as typeof fetch;

const realNow = Date.now;
const usos = await import('../lib/usos');
const localDate = usos.localDate;
const m = await import('../lib/usos-studies');
const creds = { consumerKey: 'k', consumerSecret: 's', token: 't', tokenSecret: 'ts' };
const check = (c: boolean, msg: string) => {
  console.log(`${c ? 'OK  ' : 'BŁĄD'} ${msg}`);
  if (!c) process.exitCode = 1;
};
void realNow;

const ex = await m.fetchExams(creds);
check(ex.exams.length === 1 && ex.exams[0].courseName === 'Mikro', 'egzamin z nazwą przedmiotu');
check(ex.exams[0].groups.length === 2 && ex.exams[0].groups[0].room?.number === '1.09' && ex.exams[0].groups[0].examiners[0].name === 'Anna Nowak', 'grupy egzaminu dociągnięte po numerach (sala, egzaminator)');
check(ex.exams[0].groups[0].slots[0].taken === 3, 'sloty z liczbą zapisanych');
check(ex.usoswebUrl === 'https://www.usosweb.uj.edu.pl', 'link do USOSweb');
const today = localDate();
check(calls.filter((c) => c.method === 'tt/student').length === 6, 'plan sprawdzony 6 tygodni do przodu');
check(today !== '2026-10-25' || (ex.planned.length === 1 && ex.planned[0].courseName === 'Matma'), 'egzaminy z planu zebrane');

const st = await m.fetchStudies(creds);
check(st.programmes[0].name === 'Ekonomia' && st.programmes[0].ectsUsed === 12 && st.ectsTotal === 18, 'kierunek i ECTS z credits/used_sum');
check(st.programmes[0].stages[0].name === 'Pierwszy rok' && st.programmes[0].stages[0].term === '2026/27', 'etapy studiów');
check(st.term.total === 14 && st.term.passed === 6, `ECTS w semestrze: ${st.term.passed}/${st.term.total} (zaliczony tylko C1)`);

const groups = await m.fetchGroups(creds);
check(groups.length === 1 && groups[0].key === '55-3' && groups[0].lecturers[0].name === 'Anna Nowak', 'grupy: słownik po semestrach, bez grup prowadzonych');
const g = await m.fetchGroup(creds, '55', '3');
check(g.participants.map((p) => p.name).join(',') === 'Ala A,Zenon B' && g.meId === '42', 'uczestnicy posortowani, rozpoznane „Ty”');

await m.sendMail(creds, ['1', '2'], 'Temat', 'Treść', true);
const mail = calls.find((c) => c.method === 'mailclient/create_and_send_message')!;
check(mail.params.get('user_ids') === '1|2' && mail.params.get('send_to_myself') === 'true' && mail.params.get('content_format') === 'plain', 'mail: odbiorcy, kopia, zwykły tekst');

const docs = await m.fetchDocuments(creds);
check(docs.documents.find((d) => d.id === 'D1')!.canDownload && docs.documents.find((d) => d.id === 'D2')!.canReceive, 'dokumenty: pobierz / odbierz wg akcji');
const file = await m.downloadDocument(creds, 'D1');
check(new TextDecoder().decode(file.body) === 'PDFDATA' && file.type === 'application/pdf', 'pobranie pliku z blobbox');
let blocked = false;
try {
  await m.downloadDocument(creds, 'OBCY');
} catch {
  blocked = true;
}
check(blocked, 'nie da się pobrać dokumentu spoza własnej listy');

const ical = await m.fetchIcalUrl(creds);
check(ical.webcalUrl === 'webcal://apps.usos.uj.edu.pl/x?key=abc', 'adres subskrypcji kalendarza');

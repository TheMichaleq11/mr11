// Test przetwarzania odpowiedzi USOS API (bez sieci — fetch jest podmieniony).
// Uruchom: npx tsx scripts/test-usos.mts
process.env.USOS_CONSUMER_KEY = 'k';
process.env.USOS_CONSUMER_SECRET = 's';

const responses: Record<string, unknown> = {
  'courses/user': {
    course_editions: {
      '2026Z': [
        { course_id: 'WZ.EK-101', course_name: { pl: 'Mikroekonomia I', en: 'Microeconomics I' }, term_id: '2026Z', user_groups: [{ class_type: { pl: 'Wykład' }, lecturers: [{ first_name: 'Anna', last_name: 'Nowak' }] }] },
        { course_id: 'WZ.EK-102', course_name: { pl: 'Matematyka' }, term_id: '2026Z', user_groups: [] },
        { course_id: 'WZ.EK-103', course_name: { pl: 'Prawo' }, term_id: '2026Z' },
      ],
    },
    terms: [
      { id: '2026Z', name: { pl: 'Semestr zimowy 2026/27' }, start_date: '2026-10-01', end_date: '2027-02-28' },
      { id: '2026L', name: { pl: 'Semestr letni 2026/27' }, start_date: '2027-03-01', end_date: '2027-09-30' },
    ],
  },
  'grades/terms2': {
    '2026Z': {
      // poprawka: termin 1 = 2, termin 2 = 3,5 → liczy się 3,5
      'WZ.EK-101': { course_grades: [{ '1': { value_symbol: '2', passes: false, counts_into_average: true, exam_session_number: 1 }, '2': { value_symbol: '3,5', passes: true, counts_into_average: true, exam_session_number: 2 } }], course_units_grades: {} },
      'WZ.EK-102': { course_grades: [], course_units_grades: { '555': [{ '1': { value_symbol: '4,5', passes: true, counts_into_average: true, exam_session_number: 1 } }] } },
      'WZ.EK-103': { course_grades: [{ value_symbol: 'ZAL', passes: true, counts_into_average: false, exam_session_number: 1 }] },
    },
  },
  'tt/student': [
    { type: 'classgroup2', start_time: '2026-10-26 10:00:00', end_time: '2026-10-26 11:30:00', name: { pl: 'Mikroekonomia I - Wykład' }, course_id: 'WZ.EK-101', course_name: { pl: 'Mikroekonomia I' }, classtype_name: { pl: 'Wykład' }, building_name: { pl: 'Kampus 600-lecia' }, room_number: '1.09', group_number: 1, lecturer_ids: [7] },
    { type: 'exam', start_time: '2026-10-29 10:00:00', end_time: '2026-10-29 11:30:00', name: { pl: 'Kolokwium' }, course_id: 'WZ.EK-102', course_name: { pl: 'Matematyka' } },
  ],
  'users/users': { '7': { first_name: 'Anna', last_name: 'Nowak', titles: { before: 'dr hab.' } } },
};

globalThis.fetch = (async (url: string, init: { body: string }) => {
  const method = String(url).split('/services/')[1];
  if (!init.body.includes('oauth_signature=')) throw new Error('niepodpisane żądanie');
  return new Response(JSON.stringify(responses[method]), { status: 200 });
}) as typeof fetch;

const { fetchGrades, fetchPlan } = await import('../lib/usos');
const creds = { consumerKey: 'k', consumerSecret: 's', token: 't', tokenSecret: 'ts' };

const g = await fetchGrades(creds);
const plan = await fetchPlan(creds, '2026-10-26', 7);

const check = (cond: boolean, msg: string) => {
  console.log(`${cond ? 'OK  ' : 'BŁĄD'} ${msg}`);
  if (!cond) process.exitCode = 1;
};
const mikro = g.courses.find((c) => c.courseId === 'WZ.EK-101')!;
check(g.currentTermId === '2026Z', 'wybrany bieżący semestr (dziś w zakresie dat)');
check(mikro.finalGrades.length === 1 && mikro.finalGrades[0].value === '3,5', 'z poprawki liczy się ostatni termin (3,5)');
check(g.courses.find((c) => c.courseId === 'WZ.EK-102')!.unitGrades[0]?.numeric === 4.5, 'ocena z zajęć 4,5 odczytana jako liczba');
check(g.average === 3.5 && g.gradedCount === 1, `średnia z ocen końcowych: ${g.average} (ZAL nie liczy się do średniej)`);
check(mikro.lecturers[0] === 'Anna Nowak', 'prowadzący z grupy zajęciowej');
check(plan.length === 2 && plan[0].lecturers[0] === 'dr hab. Anna Nowak', 'plan: prowadzący z tytułem');
check(plan[1].kind === 'exam' && plan[1].classType === 'Egzamin', 'plan: egzamin rozpoznany');
check(plan[0].room === '1.09' && plan[0].building === 'Kampus 600-lecia', 'plan: sala i budynek');

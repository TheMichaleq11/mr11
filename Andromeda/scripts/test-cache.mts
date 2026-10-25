// Test pamięci podręcznej zapytań do USOS (bez sieci).
// Uruchom: npx tsx scripts/test-cache.mts
process.env.USOS_CONSUMER_KEY = 'k';
process.env.USOS_CONSUMER_SECRET = 's';

let calls = 0;
globalThis.fetch = (async (url: string) => {
  calls++;
  const method = String(url).split('/services/')[1];
  await new Promise((r) => setTimeout(r, 20));
  if (method === 'grades/terms2') return new Response('{"message":"x"}', { status: 500 });
  return new Response(JSON.stringify({ method, n: calls }), { status: 200 });
}) as typeof fetch;

const { usosJson } = await import('../lib/usos');
const A = { consumerKey: 'k', consumerSecret: 's', token: 'A', tokenSecret: 'a' };
const B = { consumerKey: 'k', consumerSecret: 's', token: 'B', tokenSecret: 'b' };
const check = (c: boolean, msg: string) => {
  console.log(`${c ? 'OK  ' : 'BŁĄD'} ${msg}`);
  if (!c) process.exitCode = 1;
};

calls = 0;
await Promise.all([usosJson('users/user', A), usosJson('users/user', A), usosJson('users/user', A)]);
check(calls === 1, 'trzy jednoczesne identyczne zapytania → jedno do USOS');

calls = 0;
await usosJson('users/user', A);
check(calls === 0, 'kolejne zapytanie z pamięci');

calls = 0;
await usosJson('users/user', B);
check(calls === 1, 'inny użytkownik nie dostaje cudzych danych');

calls = 0;
await usosJson('courses/course', A, { course_id: 'X' });
await usosJson('courses/course', B, { course_id: 'X' });
check(calls === 1, 'dane publiczne (sylabus) wspólne dla wszystkich');

calls = 0;
await usosJson('users/user', A, { fields: 'id' });
check(calls === 1, 'inne parametry = osobny wpis');

calls = 0;
await usosJson('registrations/register', A, { course_id: 'C' });
await usosJson('registrations/register', A, { course_id: 'C' });
check(calls === 2, 'zapis na przedmiot nigdy z pamięci');
calls = 0;
await usosJson('users/user', A);
check(calls === 1, 'po zapisie cache użytkownika wyczyszczony');

calls = 0;
await usosJson('grades/terms2', A).catch(() => {});
await usosJson('grades/terms2', A).catch(() => {});
check(calls === 2, 'błędy nie są zapamiętywane');

// Service worker Andromedy — aplikacja z ekranu głównego startuje od razu, także bez zasięgu.
// • Pliki aplikacji (_next/static, ikony, czcionki) — z pamięci, bo mają unikalne nazwy.
// • Strony — od razu z pamięci, a w tle pobieramy nowszą wersję na następny raz.
// • Dane z /api NIGDY nie trafiają tutaj (prywatne dane z USOS trzyma sama aplikacja).
const STATIC = 'andromeda-static-v2';
const PAGES = 'andromeda-pages-v2';
const SHELL = ['/', '/plan', '/oceny', '/zapisy', '/wiecej', '/przedmioty'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((c) => Promise.all(SHELL.map((u) => fetch(u, { credentials: 'same-origin' }).then((r) => (r.ok && !r.redirected ? c.put(u, r) : null)).catch(() => null))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== STATIC && k !== PAGES).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isStatic(url) {
  return url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/') || /\.(woff2?|png|svg|ico)$/.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/zaloguj')) return;

  if (isStatic(url)) {
    event.respondWith(
      caches.open(STATIC).then((c) =>
        c.match(req).then(
          (hit) =>
            hit ||
            fetch(req).then((res) => {
              if (res.ok) c.put(req, res.clone());
              return res;
            }),
        ),
      ),
    );
    return;
  }

  if (req.mode === 'navigate') {
    event.respondWith(
      caches.open(PAGES).then(async (c) => {
        const key = url.pathname; // bez parametrów — strony i tak czytają je po stronie klienta
        const hit = await c.match(key);
        const network = fetch(req)
          .then((res) => {
            if (res.ok && !res.redirected) c.put(key, res.clone());
            return res;
          })
          .catch(() => null);
        if (hit) {
          event.waitUntil(network);
          return hit;
        }
        return (await network) || (await c.match('/')) || Response.error();
      }),
    );
  }
});

// Zmień numer wersji przy każdej zmianie strony, żeby telefon pobrał nową wersję.
const CACHE = "obiady-uj-v15";
const FILES = [
  "/", "/app.js", "/logo.svg", "/manifest.webmanifest",
  "/fonts/marcellus-latin.woff2", "/fonts/marcellus-latin-ext.woff2",
  "/icons/touch-180.png", "/icons/app-192.png", "/icons/app-512.png", "/icons/favicon-32.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function store(req, res) {
  if (res && res.ok && res.type === "basic") {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy));
  }
  return res;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Strona: najpierw sieć (świeża wersja), bez internetu – kopia z telefonu.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => store("/", res))
        .catch(() => caches.match("/").then((hit) => hit || Response.error()))
    );
    return;
  }

  // Skrypt strony: najpierw sieć, żeby zmiany były od razu widoczne.
  if (url.pathname === "/app.js") {
    e.respondWith(
      fetch(req)
        .then((res) => store("/app.js", res))
        .catch(() => caches.match("/app.js").then((hit) => hit || Response.error()))
    );
    return;
  }

  // Pliki (czcionki, ikony, logo): z pamięci, w tle odświeżane.
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      const net = fetch(req).then((res) => store(req, res));
      if (hit) {
        e.waitUntil(net.catch(() => {}));
        return hit;
      }
      return net.catch(() => Response.error());
    })
  );
});

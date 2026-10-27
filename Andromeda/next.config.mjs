import { execSync } from 'node:child_process';
/** @type {import('next').NextConfig} */
// Numer wersji (budowy) — aplikacja z ekranu głównego porównuje go z serwerem i sama się odświeża.
function wersja() {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA;
  try {
    return execSync('git rev-parse HEAD').toString().trim();
  } catch {
    return 'lokalna';
  }
}
const WERSJA = wersja();

const nextConfig = {
  reactStrictMode: true,
  env: { NEXT_PUBLIC_WERSJA: WERSJA },
  // Metadane (ikony) od razu w <head> dla każdej przeglądarki, a nie doklejane później w treści —
  // inaczej iPhone/iPad przy „Do ekranu początkowego” nie widzi nowej ikony i bierze starą.
  htmlLimitedBots: /.*/,
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
};

export default nextConfig;

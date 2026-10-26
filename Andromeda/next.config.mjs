/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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

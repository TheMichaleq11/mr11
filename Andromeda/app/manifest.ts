import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Andromeda — Twój USOS',
    short_name: 'Andromeda',
    description: 'Czytelny plan zajęć, oceny i przedmioty z USOS UJ.',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#E8E6F3',
    theme_color: '#E8E6F3',
    lang: 'pl',
    icons: [
      { src: '/icons/icon-192.png?v=2', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png?v=2', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png?v=2', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

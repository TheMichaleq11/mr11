import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/inter';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import RegisterSW from '@/components/RegisterSW';
import { motywScript } from '@/lib/motyw';
import './globals.css';

export const metadata: Metadata = {
  title: 'Andromeda',
  description: 'Czytelny plan zajęć, oceny i przedmioty z USOS UJ.',
  applicationName: 'Andromeda',
  appleWebApp: { capable: true, title: 'Andromeda', statusBarStyle: 'black-translucent' },
  icons: {
    icon: [
      { url: '/icons/favicon.svg?v=5', type: 'image/svg+xml' },
      { url: '/icons/favicon-32.png?v=5', sizes: '32x32', type: 'image/png' },
      // większe ikonki bez tła — Chrome i Safari na iPadzie/iPhonie biorą największą, więc w karcie nie będzie tła
      { url: '/icons/icon-192.png?v=5', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png?v=5', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png?v=5', sizes: '180x180' }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#050812' },
    { media: '(prefers-color-scheme: dark)', color: '#050812' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: motywScript }} />
      </head>
      <body>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}

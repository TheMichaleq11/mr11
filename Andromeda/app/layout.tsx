import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/inter';
import '@fontsource/bricolage-grotesque/600.css';
import '@fontsource/bricolage-grotesque/700.css';
import RegisterSW from '@/components/RegisterSW';
import './globals.css';

export const metadata: Metadata = {
  title: 'Andromeda',
  description: 'Czytelny plan zajęć, oceny i przedmioty z USOS UJ.',
  applicationName: 'Andromeda',
  appleWebApp: { capable: true, title: 'Andromeda', statusBarStyle: 'default' },
  icons: {
    icon: [{ url: '/icons/icon-192.png?v=2', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/icons/apple-touch-icon.png?v=2', sizes: '180x180' }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F3F4F1' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0D14' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}

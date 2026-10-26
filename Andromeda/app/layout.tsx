import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/inter';
import RegisterSW from '@/components/RegisterSW';
import SpaceBackdrop from '@/components/SpaceBackdrop';
import './globals.css';

export const metadata: Metadata = {
  title: 'Andromeda',
  description: 'Czytelny plan zajęć, oceny i przedmioty z USOS UJ.',
  applicationName: 'Andromeda',
  appleWebApp: { capable: true, title: 'Andromeda', statusBarStyle: 'black-translucent' },
  icons: {
    icon: [
      { url: '/icons/favicon.svg?v=4', type: 'image/svg+xml' },
      { url: '/icons/favicon-32.png?v=4', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png?v=4', sizes: '180x180' }],
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
      <body>
        <SpaceBackdrop />
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}

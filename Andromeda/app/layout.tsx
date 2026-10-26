import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/inter';
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
    { media: '(prefers-color-scheme: light)', color: '#E8E6F3' },
    { media: '(prefers-color-scheme: dark)', color: '#E8E6F3' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <head>
        {/* kolor tła: ?tlo=piasek|blekit|szalwia|lawenda (zapamiętany na urządzeniu) */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var q=new URLSearchParams(location.search).get('tlo'),k='andro:tlo',v=['lawenda','piasek','blekit','szalwia'];if(q&&v.indexOf(q)>-1)localStorage.setItem(k,q);var t=localStorage.getItem(k);if(t&&v.indexOf(t)>-1)document.documentElement.dataset.tlo=t}catch(e){}",
          }}
        />
      </head>
      <body>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}

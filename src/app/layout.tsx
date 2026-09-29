import { BuildStamp } from '@/components/ui/build-stamp';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Taza Greens',
    template: '%s | Taza Greens',
  },
  description:
    'Ethiopian breakfast and brunch café in Bole Rwanda, Addis Ababa. Order your favorites — fetira, chechebsa, fata, genfo — for delivery or pickup.',
  keywords: ['Taza Greens', 'Ethiopian breakfast', 'Addis Ababa', 'delivery', 'brunch', 'Bole Rwanda'],
  openGraph: {
    title: 'Taza Greens',
    description: 'Ethiopian breakfast and brunch — delivered to you in Addis Ababa.',
    siteName: 'Taza Greens Delivery',
    locale: 'en_US',
    type: 'website',
  },
  robots: {
    index: false, // Mini App, not intended for search indexing
    follow: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // Prevents Telegram WebView zoom issues
  userScalable: false,
  themeColor: '#103d2b', // --color-forest, matches the brand primary
};
import { ThemeProvider } from '@/components/providers/theme-provider';
import { TelegramProvider } from '@/components/providers/telegram-provider';
import { AppShell } from '@/components/ui/app-shell';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
          <meta name="color-scheme" content="light dark" />
          <meta name="supported-color-schemes" content="light dark" />
        {/* Load Telegram WebApp SDK — must be first so window.Telegram.WebApp is available */}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      

</head>
      <body className="bg-bg text-text" suppressHydrationWarning>
        
        <ThemeProvider>
        <TelegramProvider>
          <AppShell>
        <BuildStamp commitSha={process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev'} buildTime={new Date().toISOString()} />
        {children}</AppShell>
        </TelegramProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

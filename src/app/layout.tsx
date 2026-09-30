import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { TelegramProvider } from '@/components/providers/telegram-provider';
import { AppShell } from '@/components/ui/app-shell';

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
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-white" style={{ backgroundColor: '#ffffff' }} suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        {/* Force white background on Telegram native shell BEFORE first paint */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              // Paint the html element white immediately — before CSS loads
              document.documentElement.style.backgroundColor = '#ffffff';
              document.documentElement.style.background = '#ffffff';
            } catch(e) {}
          })();
        ` }} />
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        {/* Tell Telegram native shell to use white background — runs after SDK loads */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var tg = window.Telegram && window.Telegram.WebApp;
              if (tg) {
                tg.setBackgroundColor('#ffffff');
                tg.setHeaderColor('#ffffff');
                tg.ready();
              }
            } catch(e) {}
          })();
        ` }} />
      </head>
      <body className="bg-white text-black min-h-screen" style={{ backgroundColor: '#ffffff' }} suppressHydrationWarning>
        <ThemeProvider>
          <TelegramProvider>
            <AppShell>{children}</AppShell>
          </TelegramProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

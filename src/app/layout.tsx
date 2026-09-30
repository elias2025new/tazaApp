import type { Metadata, Viewport } from 'next';
import { Source_Serif_4, Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { TelegramProvider } from '@/components/providers/telegram-provider';
import { AppShell } from '@/components/ui/app-shell';

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-source-serif',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

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
  viewportFit: 'cover',
  themeColor: '#FBF8F3',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${sourceSerif.variable} ${inter.variable}`}
      style={{ backgroundColor: '#FBF8F3' }}
      suppressHydrationWarning
    >
      <head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        {/* Paint cream background on Telegram native shell synchronously before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (typeof document !== 'undefined' && document.documentElement) {
                    document.documentElement.style.backgroundColor = '#FBF8F3';
                    document.documentElement.style.background = '#FBF8F3';
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        {/* Safely set Telegram native shell colors if Telegram WebApp is present */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (typeof window !== 'undefined') {
                    var tg = window.Telegram && window.Telegram.WebApp;
                    if (tg) {
                      if (typeof tg.ready === 'function') tg.ready();
                      if (typeof tg.expand === 'function') tg.expand();
                      if (typeof tg.setBackgroundColor === 'function') tg.setBackgroundColor('#FBF8F3');
                      if (typeof tg.setHeaderColor === 'function') tg.setHeaderColor('#FBF8F3');
                      if (typeof tg.setBottomBarColor === 'function') tg.setBottomBarColor('#FBFAF6');
                    }
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className="min-h-screen text-[#111111] antialiased"
        style={{
          backgroundColor: '#FBF8F3',
          fontFamily: 'var(--font-sans)',
        }}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <TelegramProvider>
            <AppShell>{children}</AppShell>
          </TelegramProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

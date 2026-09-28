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
        <script dangerouslySetInnerHTML={{ __html: "!function(){try {var t = localStorage.getItem('taza-theme-storage');var e = 'system';if(t) {var o = JSON.parse(t);if (o && o.state && o.state.theme) {e = o.state.theme;}}var a = false;if (e === 'system') {var isDark = false;// 1. Try URL Hash (100% synchronous, always available in Telegram)var hash = window.location.hash.substring(1);var params = new URLSearchParams(hash);var themeParamsStr = params.get('tgWebAppThemeParams');if (themeParamsStr) {try {var themeParams = JSON.parse(decodeURIComponent(themeParamsStr));// If text color is light or bg color is darkif (themeParams.bg_color) {// simple hex brightness checkvar hex = themeParams.bg_color.replace('#', '');if (hex.length === 6) {var r = parseInt(hex.substr(0, 2), 16);var g = parseInt(hex.substr(2, 2), 16);var b = parseInt(hex.substr(4, 2), 16);var brightness = (r * 299 + g * 587 + b * 114) / 1000;isDark = brightness < 128;}}} catch(e) {}}// 2. Try window.Telegram.WebApp (might not be ready)if (!isDark && window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.colorScheme === 'dark') {isDark = true;}// 3. Fallback to OSif (!isDark && !themeParamsStr) {isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;}a = isDark;} else {a = e === 'dark';}if(a){document.documentElement.setAttribute('data-theme','dark');} else {document.documentElement.removeAttribute('data-theme');}} catch(t) {}}();" }} />
        <ThemeProvider>
        <TelegramProvider>
          <AppShell>{children}</AppShell>
        </TelegramProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

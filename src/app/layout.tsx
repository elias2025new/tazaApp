import type { Metadata, Viewport } from 'next';
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
import { TelegramProvider } from '@/components/providers/telegram-provider';
import { BottomNav } from '@/components/ui/bottom-nav';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[--tg-theme-bg-color,var(--color-sand)] text-[--tg-theme-text-color,var(--color-ink)]">
        <TelegramProvider>
          <main className="mx-auto max-w-md bg-white min-h-screen shadow-xl relative overflow-hidden pb-16">
            {children}
            <BottomNav />
          </main>
        </TelegramProvider>
      </body>
    </html>
  );
}

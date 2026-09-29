'use client';

import { useEffect, useState } from 'react';

// Declare the global Telegram WebApp type so TypeScript doesn't complain
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        disableVerticalSwipes?: () => void;
        requestFullscreen?: () => void;
        platform: string;
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
        };
        colorScheme: 'light' | 'dark';
        themeParams: Record<string, string>;
        onEvent?: (eventType: string, eventHandler: () => void) => void;
        offEvent?: (eventType: string, eventHandler: () => void) => void;
        MainButton: { text: string; show: () => void; hide: () => void };
        close: () => void;
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
      };
    };
  }
}

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    // Check if we are inside Telegram
    if (!tg) {
      if (process.env.NEXT_PUBLIC_DEV_MOCK_TELEGRAM === 'true') {
        console.warn('Telegram WebApp not detected — using dev mock mode.');
        return;
      }
      setError('This app must be opened inside Telegram.');
      return;
    }

    // 1. Signal to Telegram that the app is ready
    tg.ready();

    // 2. Expand to full height
    tg.expand();

    // Prevent pull-to-close gesture
    try {
      if (typeof tg.disableVerticalSwipes === 'function') {
        tg.disableVerticalSwipes();
      }
    } catch (e) {
      console.warn('disableVerticalSwipes not supported', e);
    }
    
    // Attempt to request full screen
    try {
      if (typeof tg.requestFullscreen === 'function' && ['android', 'ios'].includes(tg.platform)) {
        tg.requestFullscreen();
      }
    } catch (e) {
      console.warn('requestFullscreen not supported on this platform', e);
    }

    // 3. Authenticate with backend in background if initData is available
    if (tg.initData) {
      fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initDataRaw: tg.initData }),
      })
        .then((res) => res.json())
        .catch((err) => {
          console.error('Auth network error:', err);
        });
    }
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <p className="text-xl font-semibold text-red-500 mb-2">⚠️ Open in Telegram</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

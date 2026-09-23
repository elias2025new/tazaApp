'use client';

import { useEffect, useState } from 'react';

// Declare the global Telegram WebApp type so TypeScript doesn't complain
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        requestFullscreen?: () => void;
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
        MainButton: { text: string; show: () => void; hide: () => void };
        close: () => void;
      };
    };
  }
}

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    // Check if we are inside Telegram
    if (!tg) {
      // Allow dev mode fallback if enabled
      if (process.env.NEXT_PUBLIC_DEV_MOCK_TELEGRAM === 'true') {
        console.warn('Telegram WebApp not detected — using dev mock mode.');
        setIsReady(true);
        return;
      }
      setError('This app must be opened inside Telegram.');
      return;
    }

    // 1. Signal to Telegram that the app is ready
    tg.ready();

    // 2. Expand to full height
    tg.expand();
    
    // Attempt to request full screen (removes native telegram header and bottom bar on mobile)
    try {
      if (typeof tg.requestFullscreen === 'function' && ['android', 'ios'].includes(tg.platform)) {
        tg.requestFullscreen();
      }
    } catch (e) {
      console.warn('requestFullscreen not supported on this platform', e);
    }

    // 3. Authenticate with our backend (only if initData is available)
    if (!tg.initData) {
      // initData empty — still show app (happens in some Telegram Desktop versions)
      setIsReady(true);
      return;
    }

    fetch('/api/auth/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initDataRaw: tg.initData }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setIsReady(true);
        } else {
          console.error('Auth error:', data.error);
          // Still show the app even if auth fails for now
          // so users aren't locked out by edge cases
          setIsReady(true);
        }
      })
      .catch((err) => {
        console.error('Auth network error:', err);
        // Show the app anyway — auth will retry on next load
        setIsReady(true);
      });
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

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#103d2b] border-t-transparent" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

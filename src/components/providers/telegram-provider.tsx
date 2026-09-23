'use client';

import { useEffect, useState } from 'react';
import { init, retrieveLaunchParams, miniApp, themeParams } from '@telegram-apps/sdk';

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Determine if we are in Telegram or local dev
    let launchParams;
    try {
      launchParams = retrieveLaunchParams();
    } catch (e) {
      if (process.env.NEXT_PUBLIC_DEV_MOCK_TELEGRAM === 'true') {
        // Fallback for desktop browser testing if enabled
        console.warn('Telegram SDK: Using mock environment for browser testing.');
        setIsReady(true);
        return;
      }
      setError('This app must be opened inside Telegram.');
      return;
    }

    try {
      // 1. Initialize Telegram SDK
      init();

      // 2. Expand Mini App to full height
      if (miniApp.mount.isAvailable()) {
        miniApp.mount();
        if (miniApp.requestFullscreen.isAvailable()) {
          miniApp.requestFullscreen();
        } else if (miniApp.expand.isAvailable()) {
          miniApp.expand();
        }
      }

      // 3. Mount theme parameters (extracts Telegram's native colors into CSS variables)
      if (themeParams.mount.isAvailable()) {
        themeParams.mount();
        themeParams.bindCssVars();
      }

      // 4. Authenticate with backend using initDataRaw
      if (launchParams.initDataRaw) {
        fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initDataRaw: launchParams.initDataRaw }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.ok) {
              setIsReady(true);
            } else {
              setError(data.error || 'Failed to authenticate with Telegram.');
            }
          })
          .catch(() => setError('Network error during authentication.'));
      } else {
        setError('Missing Telegram initData.');
      }
    } catch (err) {
      console.error('Telegram init error:', err);
      setError('Failed to initialize Telegram Mini App.');
    }
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[--color-forest] border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}

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
        setBottomBarColor?: (color: string) => void;
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
      };
    };
  }
}

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tg = window.Telegram?.WebApp;

    if (!tg) {
      console.warn('Telegram WebApp not detected — running in browser preview mode.');
      return;
    }

    try {
      if (typeof tg.ready === 'function') tg.ready();
      if (typeof tg.expand === 'function') tg.expand();
      if (typeof tg.setHeaderColor === 'function') tg.setHeaderColor('#FBF8F3');
      if (typeof tg.setBackgroundColor === 'function') tg.setBackgroundColor('#FBF8F3');
      if (typeof tg.setBottomBarColor === 'function') tg.setBottomBarColor('#FBFAF6');
      if (typeof tg.disableVerticalSwipes === 'function') tg.disableVerticalSwipes();
      if (typeof tg.requestFullscreen === 'function' && ['android', 'ios'].includes(tg.platform)) {
        tg.requestFullscreen();
      }
    } catch (e) {
      console.warn('Telegram WebApp setup error:', e);
    }

    // Authenticate with backend in background if initData is available
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

  return <>{children}</>;
}

'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/lib/theme-store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    
    const applyTheme = () => {
      let isDark = false;
      if (theme === 'system') {
        // Use Telegram's native theme if available, otherwise match media
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
          isDark = window.Telegram.WebApp.colorScheme === 'dark';
        } else {
          isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
      } else {
        isDark = theme === 'dark';
      }

      if (isDark) {
        root.setAttribute('data-theme', 'dark');
      } else {
        root.removeAttribute('data-theme');
      }
    };

    applyTheme();

    // Listen to Telegram theme changes if we are on 'system'
    const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp as any : null;
    if (tg && typeof tg.onEvent === 'function') {
      const handleThemeChange = () => {
        if (useThemeStore.getState().theme === 'system') {
          applyTheme();
        }
      };
      tg.onEvent('themeChanged', handleThemeChange);
      return () => {
        if (typeof tg.offEvent === 'function') {
          tg.offEvent('themeChanged', handleThemeChange);
        }
      };
    }
  }, [theme]);

  return <>{children}</>;
}

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
          
          const hash = window.location.hash.substring(1);
          const params = new URLSearchParams(hash);
          const themeParamsStr = params.get('tgWebAppThemeParams');
          if (themeParamsStr) {
            try {
              const themeParams = JSON.parse(decodeURIComponent(themeParamsStr));
              if (themeParams.bg_color) {
                const hex = themeParams.bg_color.replace('#', '');
                if (hex.length === 6) {
                  const r = parseInt(hex.substr(0, 2), 16);
                  const g = parseInt(hex.substr(2, 2), 16);
                  const b = parseInt(hex.substr(4, 2), 16);
                  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                  isDark = brightness < 128;
                }
              }
            } catch (e) {}
          }
          if (!isDark) {
            isDark = window.Telegram.WebApp.colorScheme === 'dark';
          }

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

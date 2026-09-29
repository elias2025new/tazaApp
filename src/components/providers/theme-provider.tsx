'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/lib/theme-store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    
    const applyTheme = () => {
      // Per design rules, cream/green is the single source of truth.
      // We do not let Telegram's colorScheme override it anymore.
      const isDark = false; // Forced light mode per design rules

      if (isDark) {
        root.setAttribute('data-theme', 'dark');
      } else {
        root.removeAttribute('data-theme');
      }
    };

    applyTheme();
  }, [theme]);

  return <>{children}</>;
}
'use client';

import { usePathname } from 'next/navigation';
import { BottomNav } from './bottom-nav';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStaff = pathname?.startsWith('/staff');
  const isHome = pathname === '/';

  if (isStaff) {
    return <main className="min-h-screen">{children}</main>;
  }

  if (isHome) {
    // Home page manages its own full-height layout (sidebar + main panel)
    // BottomNav is rendered inside the page itself
    return <main style={{ height: '100dvh', overflow: 'hidden' }}>{children}</main>;
  }

  return (
    <main className="min-h-screen pb-16">
      {children}
      <BottomNav />
    </main>
  );
}

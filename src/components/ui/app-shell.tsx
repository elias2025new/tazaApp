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
    return (
      <main
        style={{
          height: '100dvh',
          overflow: 'hidden',
          position: 'relative',
          backgroundColor: '#03301C',
        }}
      >
        {children}
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-20">
      {children}
      <BottomNav />
    </main>
  );
}

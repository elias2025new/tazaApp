'use client';

import { usePathname } from 'next/navigation';
import { BottomNav } from './bottom-nav';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStaff = pathname?.startsWith('/staff');

  if (isStaff) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <main className="min-h-screen pb-16">
      {children}
      <BottomNav />
    </main>
  );
}

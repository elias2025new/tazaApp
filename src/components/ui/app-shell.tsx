'use client';

import { usePathname } from 'next/navigation';
import { BottomNav } from './bottom-nav';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStaff = pathname?.startsWith('/staff');

  if (isStaff) {
    return <main className="bg-white min-h-screen relative">{children}</main>;
  }

  return (
    <main className="mx-auto max-w-md bg-white min-h-screen shadow-xl relative overflow-hidden pb-16">
      {children}
      <BottomNav />
    </main>
  );
}

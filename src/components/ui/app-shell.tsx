'use client';

import { usePathname } from 'next/navigation';
import { BottomNav } from './bottom-nav';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStaff = pathname?.startsWith('/staff');

  if (isStaff) {
    // Staff pages handle their own full layout without TopNav
    return <main className="bg-white min-h-screen relative">{children}</main>;
  }

  // Customer pages now use mobile layout
  return (
    <main className="mx-auto max-w-md bg-white h-[100dvh] shadow-xl relative overflow-hidden pb-16">
      {children}
      <BottomNav />
    </main>
  );
}

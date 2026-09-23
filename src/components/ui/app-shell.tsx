'use client';

import { usePathname } from 'next/navigation';
import { BottomNav } from './bottom-nav';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStaff = pathname?.startsWith('/staff');

  if (isStaff) {
    // Staff pages handle their own full layout without TopNav
    // We add pt-12 to avoid the native Telegram close button in full-screen mode on mobile
    return <main className="bg-white min-h-screen relative pt-12">{children}</main>;
  }

  // Customer pages now use mobile layout
  return (
    <main className="mx-auto max-w-md bg-white min-h-screen shadow-xl relative overflow-hidden pt-12 pb-16">
      {children}
      <BottomNav />
    </main>
  );
}

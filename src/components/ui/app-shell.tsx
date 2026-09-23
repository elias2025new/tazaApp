'use client';

import { usePathname } from 'next/navigation';
import { TopNav } from './top-nav';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStaff = pathname?.startsWith('/staff');

  // Staff pages handle their own full layout without TopNav
  if (isStaff) {
    return <main className="bg-white min-h-screen relative">{children}</main>;
  }

  // Customer pages now use full-width desktop layout with TopNav
  return (
    <div className="bg-gray-50 min-h-screen flex flex-col relative">
      <TopNav />
      <main className="flex-1 w-full mx-auto pb-16">
        {children}
      </main>
    </div>
  );
}

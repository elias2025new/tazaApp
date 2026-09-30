'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ReceiptText, User } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Menu', icon: Home },
    { href: '/orders', label: 'Orders', icon: ReceiptText },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav
      className="shrink-0 border-t"
      style={{ backgroundColor: '#ffffff', borderColor: '#ece7d4' }}
    >
      <div className="flex h-16 items-center justify-around px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 w-full h-full relative"
              style={{ color: isActive ? '#103d2b' : '#5c7063' }}
            >
              <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div
                  className="absolute bottom-0 w-8 h-0.5 rounded-full"
                  style={{ backgroundColor: '#103d2b' }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

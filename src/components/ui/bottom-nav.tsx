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
      className="fixed bottom-0 left-0 right-0 z-40 w-full"
      style={{
        backgroundColor: '#FBFAF6',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        boxShadow: '0 -6px 20px rgba(0, 0, 0, 0.06)',
        paddingBottom:
          'var(--tg-content-safe-area-inset-bottom, var(--tg-safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)))',
      }}
    >
      <div className="flex h-[56px] items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 h-full relative"
              style={{
                color: isActive ? '#03301C' : '#48494D',
                fontFamily: 'var(--font-sans)',
                userSelect: 'none',
                WebkitUserSelect: 'none',
              }}
            >
              <div className="flex flex-col items-center gap-[2px]">
                <Icon
                  style={{
                    width: '24px',
                    height: '24px',
                    color: isActive ? '#03301C' : '#48494D',
                  }}
                  strokeWidth={1.75}
                />
                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#111111' : '#48494D',
                    lineHeight: 1.1,
                  }}
                >
                  {item.label}
                </span>
                {isActive && (
                  <div
                    style={{
                      width: '42px',
                      height: '3px',
                      backgroundColor: '#03301C',
                      borderRadius: '9999px',
                      marginTop: '2px',
                    }}
                  />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

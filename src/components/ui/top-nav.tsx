'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, User, Home } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';

export function TopNav() {
  const pathname = usePathname();
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm w-full">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-[#103d2b]">🌿 Taza Greens</span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className={`flex items-center gap-2 text-sm font-semibold transition-colors ${
              pathname === '/' ? 'text-[#103d2b]' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Home className="w-4 h-4" /> Menu
          </Link>

          <Link
            href="/cart"
            className={`flex items-center gap-2 text-sm font-semibold transition-colors relative ${
              pathname?.startsWith('/cart') ? 'text-[#103d2b]' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <ShoppingCart className="w-4 h-4" /> Cart
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </Link>

          <Link
            href="/profile"
            className={`flex items-center gap-2 text-sm font-semibold transition-colors ${
              pathname?.startsWith('/profile') ? 'text-[#103d2b]' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <User className="w-4 h-4" /> Profile
          </Link>
        </nav>
      </div>
    </header>
  );
}

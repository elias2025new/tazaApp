'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Plus, Minus, X, Loader2 } from 'lucide-react';
import { BottomNav } from '@/components/ui/bottom-nav';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice, calcOrderTotals } from '@/lib/money';

type Category = { id: string; name_en: string; emoji: string; sort_order: number };
type MenuItem = {
  id: string;
  category_id: string;
  name_en: string;
  description_en: string | null;
  base_price_santim: number;
  image_path: string | null;
  is_available: boolean;
};

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const mainRef = useRef<HTMLDivElement>(null);

  const { items: cartItems, addItem, removeItem, count, total } = useCartStore();
  const cartCount = count();
  const cartSubtotal = total();
  const { total: cartTotal } = calcOrderTotals(cartSubtotal);

  useEffect(() => {
    fetch('/api/menu', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        setCategories(d.categories || []);
        setItems(d.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const filteredItems = items.filter((item) => {
    const matchCat = activeCategory === 'all' || item.category_id === activeCategory;
    const matchSearch = item.name_en.toLowerCase().includes(debouncedSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  function getQty(itemId: string) {
    return cartItems.find((c) => c.id === itemId)?.quantity || 0;
  }

  const activeLabel =
    activeCategory === 'all'
      ? 'All'
      : categories.find((c) => c.id === activeCategory)?.name_en ?? 'All';

  const allNavItems = [
    { id: 'all', label: 'All' },
    ...categories.map((c) => ({ id: c.id, label: c.name_en })),
  ];

  return (
    /* Root: full height, no overflow — two columns side by side */
    <div className="flex h-[100dvh] overflow-hidden bg-[#103d2b]">

      {/* ─── LEFT SIDEBAR ───────────────────────────────────────────── */}
      <aside
        className="flex flex-col shrink-0 overflow-y-auto"
        style={{ width: '82px', backgroundColor: '#103d2b' }}
      >
        {/* Logo area */}
        <div className="flex flex-col items-center pt-5 pb-4 px-2 gap-1">
          {/* Logo mark */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo.jpg"
              alt="Taza Greens"
              className="w-10 h-10 rounded-full object-cover"
            />
          </div>
          <p className="text-white text-center leading-tight" style={{ fontSize: '10px', fontWeight: 600 }}>
            Taza Greens
          </p>
          <p className="text-center leading-tight" style={{ fontSize: '8px', color: 'rgba(255,255,255,0.55)' }}>
            Bole Rwanda,{'\n'}Addis Ababa
          </p>
        </div>

        {/* Divider */}
        <div className="mx-3 mb-2" style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.12)' }} />

        {/* Category nav */}
        <nav className="flex flex-col flex-1 gap-0.5 px-1 pb-4">
          {allNavItems.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full text-left px-2 py-2.5 rounded-lg transition-colors"
                style={{
                  backgroundColor: isActive ? 'rgba(255,255,255,0.18)' : 'transparent',
                  color: isActive ? '#ffffff' : 'rgba(255,255,255,0.65)',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '11px',
                  lineHeight: 1.3,
                  borderLeft: isActive ? '3px solid #ffffff' : '3px solid transparent',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ─── MAIN CONTENT PANEL ─────────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{
          backgroundColor: '#ffffff',
          borderTopLeftRadius: '20px',
          borderBottomLeftRadius: '20px',
        }}
      >
        {/* Scrollable content area */}
        <div ref={mainRef} className="flex-1 overflow-y-auto">
        {/* ── HERO BANNER ─────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden"
          style={{ minHeight: '180px', backgroundColor: '#d4e8d8' }}
        >
          {/* Hero background image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/hero.webp"
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover opacity-70"
          />

          {/* Cart pill — top right */}
          <button
            onClick={() => router.push('/cart')}
            className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-2 rounded-full shadow-md"
            style={{ backgroundColor: '#c8e72f', zIndex: 10 }}
          >
            <ShoppingCart className="w-4 h-4" style={{ color: '#103d2b' }} />
            <span className="text-sm font-bold" style={{ color: '#103d2b' }}>
              {cartCount > 0 ? `${cartCount} · ` : ''}{formatPrice(cartTotal)}
            </span>
          </button>

          {/* Hero text */}
          <div className="relative z-10 px-5 pt-5 pb-3">
            <h1
              className="font-bold leading-tight"
              style={{ fontSize: '26px', color: '#12291f' }}
            >
              Good Food<br />Brighter Days
            </h1>
            <p
              className="mt-1 font-semibold tracking-wide"
              style={{ fontSize: '10px', color: '#12291f', letterSpacing: '0.08em' }}
            >
              HEALTHY BITES, HAPPY HEARTS
            </p>
          </div>
        </div>

        {/* ── SEARCH BAR ──────────────────────────────────────────── */}
        <div className="px-4 -mt-5 mb-4 relative z-10">
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-2xl shadow-md"
            style={{ backgroundColor: '#ffffff' }}
          >
            <Search className="w-4 h-4 shrink-0" style={{ color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search menu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400"
              style={{ color: '#12291f' }}
            />
            {search.length > 0 && (
              <button type="button" onClick={() => setSearch('')}>
                <X className="w-4 h-4" style={{ color: '#9ca3af' }} />
              </button>
            )}
          </div>
        </div>

        {/* ── SECTION HEADING ─────────────────────────────────────── */}
        <div className="px-4 mb-3">
          <h2
            className="font-bold"
            style={{ fontSize: '18px', color: '#12291f', borderBottom: '2px solid #12291f', display: 'inline-block', paddingBottom: '2px' }}
          >
            {activeLabel}
          </h2>
          <p className="mt-1 text-sm" style={{ color: '#5c7063' }}>
            Start your day with something delicious
          </p>
        </div>

        {/* ── MENU GRID ───────────────────────────────────────────── */}
        <div className="px-4 pb-24">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#103d2b' }} />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16 text-sm" style={{ color: '#5c7063' }}>
              No items found
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredItems.map((item) => {
                const qty = getQty(item.id);
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl overflow-hidden"
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #ece7d4',
                      boxShadow: '0 2px 8px rgba(16,61,43,0.07)',
                    }}
                  >
                    {/* Item image */}
                    <div className="w-full aspect-[4/3] overflow-hidden bg-gray-100">
                      {item.image_path ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image_path}
                          alt={item.name_en}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: '#9ca3af' }}>
                          No photo
                        </div>
                      )}
                    </div>

                    {/* Item details */}
                    <div className="p-3">
                      <h3 className="font-bold text-sm leading-tight" style={{ color: '#12291f' }}>
                        {item.name_en}
                      </h3>
                      {item.description_en && (
                        <p
                          className="text-xs mt-0.5 line-clamp-2"
                          style={{ color: '#5c7063' }}
                        >
                          {item.description_en}
                        </p>
                      )}

                      {/* Price + Add button */}
                      <div className="flex items-center justify-between mt-2 gap-1">
                        <span className="text-sm font-bold" style={{ color: '#12291f' }}>
                          {formatPrice(item.base_price_santim)}
                        </span>

                        {qty === 0 ? (
                          <button
                            onClick={() =>
                              addItem({
                                id: item.id,
                                name_en: item.name_en,
                                base_price_santim: item.base_price_santim,
                              })
                            }
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold"
                            style={{ backgroundColor: '#103d2b', color: '#ffffff' }}
                          >
                            <Plus className="w-3 h-3" />
                            Add
                          </button>
                        ) : (
                          <div
                            className="flex items-center rounded-lg overflow-hidden"
                            style={{ backgroundColor: '#103d2b' }}
                          >
                            <button
                              onClick={() => removeItem(item.id)}
                              className="px-2 py-1.5 flex items-center justify-center"
                              style={{ color: '#ffffff' }}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs font-bold" style={{ color: '#ffffff' }}>
                              {qty}
                            </span>
                            <button
                              onClick={() =>
                                addItem({
                                  id: item.id,
                                  name_en: item.name_en,
                                  base_price_santim: item.base_price_santim,
                                })
                              }
                              className="px-2 py-1.5 flex items-center justify-center"
                              style={{ color: '#ffffff' }}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>{/* end px-4 pb-24 menu section */}
        </div>{/* end scrollable content */}

        {/* ── BOTTOM NAV — inside right panel only ─────────────────── */}
        <BottomNav />
      </div>{/* end main panel */}
    </div>
  );
}

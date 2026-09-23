'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, Search, Plus, Minus } from 'lucide-react';

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
type CartItem = MenuItem & { quantity: number };

function formatPrice(santim: number) {
  return `${(santim / 100).toFixed(0)} birr`;
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/menu')
      .then((r) => r.json())
      .then((d) => {
        setCategories(d.categories || []);
        setItems(d.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredItems = items.filter((item) => {
    const matchCat = activeCategory === 'all' || item.category_id === activeCategory;
    const matchSearch = item.name_en.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cart.reduce((sum, i) => sum + i.base_price_santim * i.quantity, 0);

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) return prev.map((c) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...item, quantity: 1 }];
    });
  }

  function removeFromCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (!existing) return prev;
      if (existing.quantity === 1) return prev.filter((c) => c.id !== item.id);
      return prev.map((c) => c.id === item.id ? { ...c, quantity: c.quantity - 1 } : c);
    });
  }

  function getQty(itemId: string) {
    return cart.find((c) => c.id === itemId)?.quantity || 0;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#103d2b] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-[#103d2b] tracking-tight">🌿 Taza Greens</h1>
              <p className="text-xs text-gray-400">Bole Rwanda, Addis Ababa</p>
            </div>
            {cartCount > 0 && (
              <button className="relative flex items-center gap-2 bg-[#103d2b] text-white text-sm font-semibold px-4 py-2 rounded-full shadow-md active:scale-95 transition-transform">
                <ShoppingBag className="w-4 h-4" />
                <span>{formatPrice(cartTotal)}</span>
                <span className="absolute -top-2 -right-2 bg-[#e8a838] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
                  {cartCount}
                </span>
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm outline-none focus:bg-gray-200 transition-colors"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveCategory('all')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeCategory === 'all'
                ? 'bg-[#103d2b] text-white shadow-md'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-[#103d2b] text-white shadow-md'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.name_en}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 py-3 space-y-6">
        {activeCategory === 'all' ? (
          // Grouped by category
          categories.map((cat) => {
            const catItems = filteredItems.filter((i) => i.category_id === cat.id);
            if (catItems.length === 0) return null;
            return (
              <section key={cat.id}>
                <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="text-base">{cat.emoji}</span>
                  {cat.name_en}
                </h2>
                <div className="space-y-2">
                  {catItems.map((item) => (
                    <MenuCard key={item.id} item={item} qty={getQty(item.id)} onAdd={addToCart} onRemove={removeFromCart} />
                  ))}
                </div>
              </section>
            );
          })
        ) : (
          <div className="space-y-2">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-2">🔍</p>
                <p className="text-sm">No items found</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <MenuCard key={item.id} item={item} qty={getQty(item.id)} onAdd={addToCart} onRemove={removeFromCart} />
              ))
            )}
          </div>
        )}

        {/* Bottom padding for nav */}
        <div className="h-4" />
      </div>
    </div>
  );
}

function MenuCard({
  item,
  qty,
  onAdd,
  onRemove,
}: {
  item: MenuItem;
  qty: number;
  onAdd: (item: MenuItem) => void;
  onRemove: (item: MenuItem) => void;
}) {
  return (
    <div className="flex items-center justify-between bg-white rounded-2xl p-3 shadow-sm border border-gray-50 active:scale-[0.99] transition-transform">
      <div className="flex-1 pr-3">
        <p className="text-sm font-semibold text-gray-800 leading-tight">{item.name_en}</p>
        {item.description_en && (
          <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2 leading-snug">{item.description_en}</p>
        )}
        <p className="text-sm font-bold text-[#103d2b] mt-1.5">{formatPrice(item.base_price_santim)}</p>
      </div>

      <div className="flex-shrink-0">
        {qty === 0 ? (
          <button
            onClick={() => onAdd(item)}
            className="w-9 h-9 flex items-center justify-center bg-[#103d2b] text-white rounded-full shadow-md active:scale-90 transition-transform"
          >
            <Plus className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onRemove(item)}
              className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-700 rounded-full active:scale-90 transition-transform"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-[#103d2b] w-4 text-center">{qty}</span>
            <button
              onClick={() => onAdd(item)}
              className="w-8 h-8 flex items-center justify-center bg-[#103d2b] text-white rounded-full active:scale-90 transition-transform"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

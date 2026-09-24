'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, Search, Plus, Minus } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const { items: cartItems, addItem, removeItem, count, total } = useCartStore();
  const cartCount = count();
  const cartSubtotal = total();
  const { total: cartTotal } = calcOrderTotals(cartSubtotal);

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


  function getQty(itemId: string) {
    return cartItems.find((c) => c.id === itemId)?.quantity || 0;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#103d2b] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm flex-shrink-0 z-40">
        <div className="px-4 pt-24 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-[#103d2b] tracking-tight">🌿 Taza Greens</h1>
              <p className="text-xs text-gray-400">Bole Rwanda, Addis Ababa</p>
            </div>
            {cartCount > 0 && (
              <button
                onClick={() => router.push('/cart')}
                className="relative flex items-center gap-2 bg-[#103d2b] text-white text-sm font-semibold px-4 py-2 rounded-full shadow-md active:scale-95 transition-transform"
              >
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
      </div>

      <div className="flex-1 flex overflow-hidden bg-white">
        {/* Vertical Category Nav Sidebar */}
        <div className="w-[84px] bg-gray-50/50 flex-shrink-0 overflow-y-auto scroll-smooth border-r border-gray-100 flex flex-col no-scrollbar">
          <button
            onClick={() => setActiveCategory('all')}
            className={`flex flex-col items-center justify-center py-4 px-2 border-l-4 transition-all ${
              activeCategory === 'all'
                ? 'bg-white border-[#103d2b]'
                : 'border-transparent text-gray-500'
            }`}
          >
            <span className="text-xl mb-1">🌟</span>
            <span className={`text-[10px] text-center leading-tight ${activeCategory === 'all' ? 'font-bold text-[#103d2b]' : 'font-medium'}`}>
              All
            </span>
          </button>
          
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex flex-col items-center justify-center py-4 px-2 border-l-4 transition-all ${
                activeCategory === cat.id
                  ? 'bg-white border-[#103d2b]'
                  : 'border-transparent text-gray-500'
              }`}
            >
              <span className="text-xl mb-1">{cat.emoji}</span>
              <span className={`text-[10px] text-center leading-tight ${activeCategory === cat.id ? 'font-bold text-[#103d2b]' : 'font-medium'}`}>
                {cat.name_en}
              </span>
            </button>
          ))}
          <div className="h-24" /> {/* Padding bottom */}
        </div>

        {/* Menu Items Grid */}
        <div className="flex-1 overflow-y-auto scroll-smooth p-3 pb-32">
          {activeCategory === 'all' ? (
            // Grouped by category
            <div className="space-y-6">
              {categories.map((cat) => {
                const catItems = filteredItems.filter((i) => i.category_id === cat.id);
                if (catItems.length === 0) return null;
                return (
                  <section key={cat.id}>
                    <h2 className="text-sm font-bold text-gray-800 mb-3 sticky top-0 bg-white/90 backdrop-blur-md py-1 z-10 flex items-center gap-1.5">
                      <span>{cat.name_en}</span>
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {catItems.map((item) => (
                        <MenuCard key={item.id} item={item} qty={getQty(item.id)}
                          onAdd={() => addItem({ id: item.id, name_en: item.name_en, base_price_santim: item.base_price_santim })}
                          onRemove={() => removeItem(item.id)}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filteredItems.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-400">
                  <p className="text-4xl mb-2">🔍</p>
                  <p className="text-sm">No items found</p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <MenuCard key={item.id} item={item} qty={getQty(item.id)}
                    onAdd={() => addItem({ id: item.id, name_en: item.name_en, base_price_santim: item.base_price_santim })}
                    onRemove={() => removeItem(item.id)}
                  />
                ))
              )}
            </div>
          )}
        </div>
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
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.98] transition-transform">
      {/* Image Container — strict 1:1 ratio using padding hack, never stretches */}
      <div className="relative w-full overflow-hidden bg-gray-50" style={{ paddingBottom: '100%' }}>
        <div className="absolute inset-0">
          {item.image_path ? (
            <img src={item.image_path} alt={item.name_en} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-3xl opacity-30">🥗</span>
            </div>
          )}
        </div>
      </div>

      {/* Name + Price row */}
      <div className="px-2 pt-1.5 pb-0">
        <p className="text-[11px] font-semibold text-gray-800 leading-tight line-clamp-2">{item.name_en}</p>
        <p className="text-[11px] font-bold text-[#103d2b] mt-0.5">{formatPrice(item.base_price_santim)}</p>
      </div>

      {/* Add / Qty controls — full-width row at bottom */}
      <div className="px-2 pb-2 pt-1 mt-auto">
        {qty === 0 ? (
          <button
            onClick={onAdd}
            className="w-full h-7 flex items-center justify-center gap-1 bg-[#103d2b] text-white rounded-lg text-[10px] font-bold active:scale-95 transition-transform"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        ) : (
          <div className="w-full h-7 flex items-center justify-between bg-[#103d2b] rounded-lg overflow-hidden">
            <button
              onClick={onRemove}
              className="h-full px-2 flex items-center justify-center text-white active:bg-[#0c2f21] transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-[11px] font-bold text-white">{qty}</span>
            <button
              onClick={onAdd}
              className="h-full px-2 flex items-center justify-center text-white active:bg-[#0c2f21] transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

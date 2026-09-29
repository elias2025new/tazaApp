'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Minus, ShoppingCart, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice, calcOrderTotals } from '@/lib/money';
import Image from 'next/image';

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
  const inputRef = useRef<HTMLInputElement>(null);

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
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
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

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Header & Cart Action */}
      <div className="flex items-center justify-between gap-4 mb-4 pb-2 border-b">
        <div>
          <h1 className="text-xl font-bold">Taza Greens</h1>
          <p className="text-xs text-gray-500">Bole Rwanda, Addis Ababa</p>
        </div>

        <button 
          onClick={() => router.push('/cart')}
          className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-semibold hover:bg-gray-100"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{formatPrice(cartTotal)}</span>
          {cartCount > 0 && (
            <span className="bg-black text-white text-xs px-1.5 py-0.5 rounded-full">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-2 border rounded-lg px-3 py-2 mb-4">
        <Search className="w-4 h-4 text-gray-400" />
        <input 
          ref={inputRef}
          type="text" 
          placeholder="Search menu..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm outline-none bg-transparent"
        />
        {search.length > 0 && (
          <button type="button" onClick={() => setSearch('')}>
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Categories (Horizontal Scroll) */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
        <button 
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md border whitespace-nowrap ${
            activeCategory === 'all' ? 'bg-black text-white border-black' : 'bg-transparent text-gray-700'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button 
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md border whitespace-nowrap ${
              activeCategory === cat.id ? 'bg-black text-white border-black' : 'bg-transparent text-gray-700'
            }`}
          >
            {cat.name_en}
          </button>
        ))}
      </div>

      {/* Items Section */}
      {loading ? (
        <div className="flex justify-center py-12 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">
          No items found
        </div>
      ) : (
        <div className="flex flex-col divide-y">
          {filteredItems.map((item) => {
            const qty = getQty(item.id);
            return (
              <div key={item.id} className="py-3 flex gap-3 items-center justify-between">
                <div className="flex gap-3 items-center flex-1 min-w-0">
                  {item.image_path ? (
                    <img 
                      src={item.image_path} 
                      alt={item.name_en} 
                      className="w-16 h-16 object-cover rounded border flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
                      No photo
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm truncate">{item.name_en}</h3>
                    {item.description_en && (
                      <p className="text-xs text-gray-500 line-clamp-1">{item.description_en}</p>
                    )}
                    <p className="text-xs font-bold mt-0.5">{formatPrice(item.base_price_santim)}</p>
                  </div>
                </div>

                <div className="flex-shrink-0 ml-2">
                  {qty === 0 ? (
                    <button 
                      onClick={() => addItem({ id: item.id, name_en: item.name_en, base_price_santim: item.base_price_santim })}
                      className="px-3 py-1 border rounded text-xs font-semibold hover:bg-gray-100"
                    >
                      Add
                    </button>
                  ) : (
                    <div className="flex items-center border rounded">
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="px-2 py-1 hover:bg-gray-100 text-xs font-bold"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-bold">{qty}</span>
                      <button 
                        onClick={() => addItem({ id: item.id, name_en: item.name_en, base_price_santim: item.base_price_santim })}
                        className="px-2 py-1 hover:bg-gray-100 text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

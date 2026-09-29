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

let cachedMenuData: { categories: Category[]; items: MenuItem[] } | null = null;

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>(cachedMenuData?.categories || []);
  const [items, setItems] = useState<MenuItem[]>(cachedMenuData?.items || []);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(!cachedMenuData);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(search);
    setIsSearching(false);
    inputRef.current?.blur();
  };

  const { items: cartItems, addItem, removeItem, count, total } = useCartStore();
  const cartCount = count();
  const cartSubtotal = total();
  const { total: cartTotal } = calcOrderTotals(cartSubtotal);

  useEffect(() => {
    if (cachedMenuData) return;

    fetch('/api/menu', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        const fetchedData = { categories: d.categories || [], items: d.items || [] };
        cachedMenuData = fetchedData;
        setCategories(fetchedData.categories);
        setItems(fetchedData.items);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setIsSearching(false);
    }, 400); // 400ms delay to simulate loading/searching and provide visual feedback
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

  // Find active category name
  const activeCategoryName = activeCategory === 'all' ? 'All' : categories.find(c => c.id === activeCategory)?.name_en || '';

  return (
    <>
      <div className="flex h-full bg-gradient-to-b from-primary to-primary font-body overflow-hidden pt-[70px]">
      
      {/* LEFT SIDEBAR (Dark Green) - Thinner on small screens */}
      <div className="w-[95px] min-[400px]:w-[110px] flex-shrink-0 flex flex-col pt-2 pb-24 overflow-y-auto no-scrollbar z-10">
        
        {/* Logo & Address */}
        <div className="px-2 mb-8 flex flex-col items-center">
          <div className="w-[45px] h-[45px] min-[400px]:w-[54px] min-[400px]:h-[54px] rounded-full mb-3 flex items-center justify-center overflow-hidden bg-surface/10">
             <Image 
               src="/brand/logo.jpg" 
               alt="Taza Greens Logo" 
               width={60} 
               height={60} 
               className="w-full h-full object-cover"
               priority
             />
          </div>
          <h1 className="text-white font-display text-[11px] min-[400px]:text-[13px] font-bold text-center leading-tight mb-1">Taza Greens</h1>
          <p className="text-[7px] min-[400px]:text-[8px] text-white opacity-70 text-center leading-[1.3]">Bole Rwanda,<br/>Addis Ababa</p>
        </div>

        {/* Categories List */}
        <div className="flex flex-col gap-0 relative">
          <SidebarItem 
            name="All" 
            isActive={activeCategory === 'all'} 
            onClick={() => setActiveCategory('all')} 
          />
          {categories.map((cat) => (
            <SidebarItem 
              key={cat.id} 
              name={cat.name_en} 
              isActive={activeCategory === cat.id} 
              onClick={() => setActiveCategory(cat.id)} 
            />
          ))}
        </div>
      </div>

      {/* RIGHT MAIN CONTENT AREA (Cream/Paper) */}
      <div className="flex-1 bg-gradient-to-b from-bg to-bg rounded-l-[24px] min-[400px]:rounded-l-[32px] shadow-[-5px_0_20px_rgba(0,0,0,0.15)] overflow-hidden relative flex flex-col z-20">
        
        {/* Top Floating Actions (Cart) */}
        <div className="absolute top-4 right-3 min-[400px]:right-4 z-50 flex items-center gap-2 min-[400px]:gap-3">
          <button 
            onClick={() => router.push('/cart')}
            className="h-9 px-3 min-[400px]:h-10 min-[400px]:px-[14px] bg-accent text-text rounded-full flex items-center gap-1.5 min-[400px]:gap-2 shadow-[0_4px_12px_rgba(200,231,47,0.4)] relative transition-transform active:scale-95"
          >
            <ShoppingCart className="w-[16px] h-[16px] min-[400px]:w-[18px] min-[400px]:h-[18px]" />
            <span className="text-[12px] min-[400px]:text-[13px] font-bold">{formatPrice(cartTotal)}</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-emphasis text-white text-[9px] min-[400px]:text-[10px] w-4 h-4 min-[400px]:w-5 min-[400px]:h-5 flex items-center justify-center rounded-full font-bold border-2 border-accent">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-8 no-scrollbar relative">
          
          {/* Hero Section */}
          <div className="relative w-full h-[180px] min-[400px]:h-[220px] bg-bg overflow-hidden">
             
             {/* Food image */}
             <div className="absolute inset-0 w-full h-full">
               <Image 
                 src="/brand/hero.webp" 
                 alt="Taza Greens Hero" 
                 fill
                 className="object-cover object-right"
                 priority
               />
             </div>
             
             {/* Gradient overlay to fade left to right */}
             <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/80 to-transparent flex flex-col justify-center pl-4 pr-8 min-[400px]:pl-5 min-[400px]:pr-10 pt-4">
                <h2 className="text-[20px] min-[400px]:text-[26px] font-bold font-display text-text leading-tight tracking-tight relative z-10">Good Food<br/>Brighter Days</h2>
                <div className="flex items-center mt-2 min-[400px]:mt-3 relative z-10">
                  <span className="text-[9px] min-[400px]:text-[10px] tracking-wide text-primary font-bold uppercase">Healthy Bites, Happy Hearts</span>
                </div>
             </div>
          </div>

          {/* Search Bar (Below Hero) */}
          <div className="px-4 min-[400px]:px-5 -mt-6 relative z-10">
            <form 
              onSubmit={handleSearchSubmit}
              className="bg-gradient-to-b from-surface to-surface rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center px-4 h-[52px] border-none outline-none focus-within:shadow-[0_8px_30px_rgb(16,61,43,0.12)]" 
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {isSearching ? (
                <Loader2 className="w-5 h-5 text-primary flex-shrink-0 animate-spin" />
              ) : (
                <Search className="w-5 h-5 text-text-muted flex-shrink-0" />
              )}
              <input 
                ref={inputRef}
                type="text" 
                enterKeyHint="search"
                placeholder="Search menu..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 w-full bg-transparent appearance-none border-none outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus:border-transparent ring-0 focus:shadow-none text-center text-[16px] text-text placeholder:text-text-muted/80 font-medium" 
                style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
              />
              {search.length > 0 ? (
                <button 
                  type="button" 
                  onClick={() => { setSearch(''); setDebouncedSearch(''); inputRef.current?.focus(); }}
                  className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-text-muted hover:text-text-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <div className="w-5 h-5 flex-shrink-0" />
              )}
            </form>
          </div>

          {/* Category Title Header */}
          <div className="px-3 min-[400px]:px-4 mt-6 min-[400px]:mt-8 mb-4 min-[400px]:mb-5">
            <div className="relative inline-block">
              <h3 className="text-[18px] min-[400px]:text-[22px] font-bold font-display text-text relative z-10 pb-1">
                {activeCategoryName}
              </h3>
              {/* Yellow underline */}
              <div className="absolute bottom-1 left-0 w-6 min-[400px]:w-8 h-[2px] min-[400px]:h-[3px] bg-emphasis rounded-full z-0"></div>
            </div>
            <p className="text-[10px] min-[400px]:text-[11px] text-text-muted mt-1 font-medium">Start your day with something delicious</p>
          </div>

          {/* Menu Grid - 2 cols on all screens */}
          <div className={`px-3 min-[400px]:px-4 grid grid-cols-2 gap-2 min-[400px]:gap-3 pb-8 transition-opacity duration-300 ${isSearching ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            {loading ? (
                 <div className="col-span-full flex justify-center py-10 text-text-muted">
                   <Loader2 className="w-6 h-6 animate-spin text-primary" />
                 </div>
              ) : filteredItems.length === 0 ? (
               <div className="col-span-full text-center py-10 text-text-muted">
                 <p className="text-sm">No items found</p>
               </div>
            ) : (
              filteredItems.map((item) => (
                <MenuCard 
                  key={item.id} 
                  item={item} 
                  qty={getQty(item.id)}
                  onAdd={() => addItem({ id: item.id, name_en: item.name_en, base_price_santim: item.base_price_santim })}
                  onRemove={() => removeItem(item.id)}
                />
              ))
            )}
          </div>
          
        </div>
      </div>
    </div>
    </>
  );
}

function SidebarItem({ name, isActive, onClick }: { name: string, isActive: boolean, onClick: () => void }) {
  if (isActive) {
    return (
      <div className="relative w-full">
        {/* Top inverse curve */}
        <div className="absolute -top-[12px] right-0 w-[12px] h-[12px] bg-gradient-to-b from-bg to-bg z-0">
          <div className="w-full h-full bg-gradient-to-b from-primary to-primary rounded-br-[12px]"></div>
        </div>
        
        {/* Bottom inverse curve */}
        <div className="absolute -bottom-[12px] right-0 w-[12px] h-[12px] bg-gradient-to-b from-bg to-bg z-0">
          <div className="w-full h-full bg-gradient-to-b from-primary to-primary rounded-tr-[12px]"></div>
        </div>

        <button 
          onClick={onClick}
          className="relative w-[calc(100%-8px)] min-[400px]:w-[calc(100%-12px)] ml-2 min-[400px]:ml-3 py-[12px] min-[400px]:py-[14px] px-2 text-left bg-gradient-to-b from-bg to-bg rounded-l-[12px] min-[400px]:rounded-l-[14px] flex flex-col justify-center z-10"
        >
          {/* Left Orange Bar */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[70%] bg-emphasis rounded-r-sm"></div>
          <span className="text-[12px]/[14px] min-[400px]:text-[13px]/[15px] font-bold text-text pl-2 min-[400px]:pl-3 pr-1">{name}</span>
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={onClick}
      className="w-full py-[10px] min-[400px]:py-[12px] pl-[16px] min-[400px]:pl-[24px] pr-2 text-left group relative z-10 text-white opacity-60 hover:opacity-100 transition-opacity"
    >
      <span className="text-[12px]/[14px] min-[400px]:text-[13px]/[15px] font-medium text-inherit">{name}</span>
    </button>
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
    <div className={`flex flex-col bg-surface rounded-[16px] min-[400px]:rounded-[18px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-border overflow-hidden transition-transform duration-200 ${!item.is_available ? 'opacity-75 grayscale-[0.2]' : ''}`}>
      {/* Image Container */}
      <div className="w-full aspect-[4/3] bg-surface-raised overflow-hidden relative">
        {item.image_path ? (
          <img src={item.image_path} alt={item.name_en} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/5 p-6">
             <Image 
               src="/brand/logo.jpg" 
               alt="Taza Greens Fallback" 
               fill
               className="object-contain opacity-20 p-6"
             />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-2.5 min-[400px]:p-3 pb-2.5 min-[400px]:pb-3 flex-1 flex flex-col">
        <h4 className="text-[12px] min-[400px]:text-[13px] font-bold text-text leading-[1.2] mb-1">{item.name_en}</h4>
        
        <p className="text-[9px] min-[400px]:text-[10px] text-text-muted leading-[1.3] line-clamp-2 mb-2 min-[400px]:mb-3 min-h-[22px] min-[400px]:min-h-[26px]">
          {item.description_en || 'Delicious freshly prepared meal.'}
        </p>
        
        <div className="mt-auto flex items-center justify-between gap-1">
          <span className="text-[11px] min-[400px]:text-[13px] font-bold text-text whitespace-nowrap">
            {formatPrice(item.base_price_santim)}
          </span>
          
          {qty === 0 ? (
            <button
              onClick={onAdd}
              disabled={!item.is_available}
              className="h-[24px] min-[400px]:h-[26px] min-h-[24px] min-[400px]:min-h-[26px] min-w-0 px-2 min-[400px]:px-3 bg-primary text-white rounded-[6px] min-[400px]:rounded-[8px] flex items-center justify-center gap-1 min-[400px]:gap-1.5 text-[10px] min-[400px]:text-[11px] font-bold disabled:opacity-50 flex-shrink-0"
            >
              <Plus className="w-2.5 h-2.5 min-[400px]:w-3 min-[400px]:h-3" />
              <span>Add</span>
            </button>
          ) : (
            <div className="h-[24px] min-[400px]:h-[26px] bg-primary rounded-[6px] min-[400px]:rounded-[8px] flex items-center overflow-hidden flex-shrink-0">
              <button onClick={onRemove} className="w-6 min-[400px]:w-7 min-h-0 min-w-0 h-full flex items-center justify-center text-white">
                <Minus className="w-2.5 h-2.5 min-[400px]:w-3 min-[400px]:h-3" />
              </button>
              <span className="text-[10px] min-[400px]:text-[11px] font-bold text-white min-w-[12px] min-[400px]:min-w-[14px] text-center">{qty}</span>
              <button onClick={onAdd} disabled={!item.is_available} className="w-6 min-[400px]:w-7 min-h-0 min-w-0 h-full flex items-center justify-center text-white disabled:opacity-50">
                <Plus className="w-2.5 h-2.5 min-[400px]:w-3 min-[400px]:h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Plus, Minus, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice, calcOrderTotals } from '@/lib/money';
import { BottomNav } from '@/components/ui/bottom-nav';

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

/* ── Brand tokens ──────────────────────────────────── */
const FOREST = '#103d2b';   // dark green — sidebar, buttons
const INK    = '#12291f';   // near-black text
const MUTED  = '#5c7063';   // secondary text
const CITRUS = '#c8e72f';   // yellow-green — cart pill
const PAPER  = '#fbf8ed';   // warm cream — content panel bg + active pill
const BORDER = '#d8d0bb';   // warm gray border

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems]           = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch]         = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading]       = useState(true);
  const router    = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { items: cartItems, addItem, removeItem, count, total } = useCartStore();
  const cartCount    = count();
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
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const filteredItems = items.filter((item) => {
    const matchCat    = activeCategory === 'all' || item.category_id === activeCategory;
    const matchSearch = item.name_en.toLowerCase().includes(debouncedSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  function getQty(id: string) {
    return cartItems.find((c) => c.id === id)?.quantity ?? 0;
  }

  const activeLabel =
    activeCategory === 'all'
      ? 'All'
      : (categories.find((c) => c.id === activeCategory)?.name_en ?? 'All');

  const navItems = [
    { id: 'all', label: 'All' },
    ...categories.map((c) => ({ id: c.id, label: c.name_en })),
  ];

  function selectCategory(id: string) {
    setActiveCategory(id);
    scrollRef.current?.scrollTo({ top: 0 });
  }

  /* ─────────────────────────────────────────────────────────────────── */
  return (
    <div
      style={{
        display: 'flex',
        height: '100dvh',
        overflow: 'hidden',
        backgroundColor: FOREST,   // fills the gap behind the sidebar
      }}
    >

      {/* ══════════════════════════════════════════════════════
          SIDEBAR — forest green, 105px wide
      ══════════════════════════════════════════════════════ */}
      <aside
        style={{
          width: '105px',
          flexShrink: 0,
          backgroundColor: FOREST,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* Logo block */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '22px 8px 14px',
            gap: '6px',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo.jpg"
              alt="Taza Greens logo"
              style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '50%' }}
            />
          </div>
          <p style={{
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 700,
            textAlign: 'center',
            lineHeight: 1.3,
            margin: 0,
          }}>
            Taza Greens
          </p>
          <p style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: '9px',
            textAlign: 'center',
            lineHeight: 1.4,
            margin: 0,
          }}>
            Bole Rwanda,<br />Addis Ababa
          </p>
        </div>

        {/* Divider */}
        <div style={{
          height: '1px',
          backgroundColor: 'rgba(255,255,255,0.12)',
          margin: '0 10px 4px',
        }} />

        {/* Category list */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '4px 0 16px' }}>
          {navItems.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => selectCategory(cat.id)}
                style={{
                  /* Full rounded pill, inset 8px from both edges */
                  display: 'block',
                  width: 'calc(100% - 16px)',
                  margin: '2px 8px',
                  padding: '9px 6px',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '9999px',
                  textAlign: 'center',
                  fontSize: '12.5px',
                  fontWeight: isActive ? 700 : 400,
                  lineHeight: 1.35,
                  /* Active: paper cream (same as content panel) → looks connected */
                  backgroundColor: isActive ? PAPER : 'transparent',
                  color: isActive ? FOREST : 'rgba(255,255,255,0.78)',
                  transition: 'background-color 0.15s, color 0.15s',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ══════════════════════════════════════════════════════
          MAIN PANEL — paper cream, rounded left edge
      ══════════════════════════════════════════════════════ */}
      <div
        style={{
          flex: 1,
          backgroundColor: PAPER,
          borderTopLeftRadius: '24px',
          borderBottomLeftRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        {/* Scrollable body */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>

          {/* ── HERO ─────────────────────────────────────────── */}
          <div
            style={{
              position: 'relative',
              height: '200px',
              backgroundColor: '#dff0e8',
              overflow: 'hidden',
              /* The top-left corner of the panel already has borderRadius from parent,
                 but the hero needs to clip inside it */
              borderRadius: '24px 0 0 0',
            }}
          >
            {/* Food image — positioned right so text reads on the lighter left */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/hero.webp"
              alt=""
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'right center',
                opacity: 0.9,
              }}
            />

            {/* Cart pill — top right */}
            <button
              onClick={() => router.push('/cart')}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: CITRUS,
                borderRadius: '9999px',
                padding: '8px 14px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
              }}
            >
              <ShoppingCart style={{ width: '16px', height: '16px', color: FOREST }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: FOREST }}>
                {cartCount > 0 ? `${cartCount} · ` : ''}{formatPrice(cartTotal)}
              </span>
            </button>

            {/* Hero text */}
            <div style={{ position: 'relative', zIndex: 1, padding: '22px 16px 28px' }}>
              <h1
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  lineHeight: 1.15,
                  color: INK,
                  margin: 0,
                }}
              >
                Good Food<br />Brighter Days
              </h1>
              <p
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: INK,
                  marginTop: '6px',
                  marginBottom: 0,
                }}
              >
                HEALTHY BITES, HAPPY HEARTS
              </p>
            </div>
          </div>

          {/* ── SEARCH BAR — floats below hero ───────────────── */}
          <div style={{ padding: '0 12px', marginTop: '-20px', position: 'relative', zIndex: 10 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                padding: '12px 16px',
                boxShadow: '0 4px 18px rgba(0,0,0,0.12)',
              }}
            >
              <Search style={{ width: '16px', height: '16px', color: '#9ca3af', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search menu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '15px',
                  color: INK,
                  backgroundColor: 'transparent',
                }}
              />
              {search.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <X style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
                </button>
              )}
            </div>
          </div>

          {/* ── SECTION HEADING ──────────────────────────────── */}
          <div style={{ padding: '20px 14px 10px' }}>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: INK,
                margin: '0 0 2px',
                display: 'inline-block',
                borderBottom: `2.5px solid ${INK}`,
                paddingBottom: '2px',
              }}
            >
              {activeLabel}
            </h2>
            <p style={{ fontSize: '13px', color: MUTED, margin: '4px 0 0' }}>
              Start your day with something delicious
            </p>
          </div>

          {/* ── MENU GRID ─────────────────────────────────────── */}
          <div style={{ padding: '4px 10px 24px' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                <Loader2 style={{ width: '24px', height: '24px', color: FOREST }} className="animate-spin" />
              </div>
            ) : filteredItems.length === 0 ? (
              <p style={{ textAlign: 'center', color: MUTED, fontSize: '14px', padding: '48px 0' }}>
                No items found
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {filteredItems.map((item) => {
                  const qty = getQty(item.id);
                  return (
                    <div
                      key={item.id}
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        border: `1px solid ${BORDER}`,
                        boxShadow: '0 2px 8px rgba(16,61,43,0.06)',
                      }}
                    >
                      {/* Square food image */}
                      <div
                        style={{
                          width: '100%',
                          aspectRatio: '1 / 1',
                          backgroundColor: '#f0ede4',
                          overflow: 'hidden',
                        }}
                      >
                        {item.image_path ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image_path}
                            alt={item.name_en}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{
                            width: '100%', height: '100%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', color: '#9ca3af',
                          }}>
                            No photo
                          </div>
                        )}
                      </div>

                      {/* Card body */}
                      <div style={{ padding: '10px' }}>
                        <p style={{
                          fontSize: '14px', fontWeight: 700, color: INK,
                          margin: '0 0 3px', lineHeight: 1.3,
                        }}>
                          {item.name_en}
                        </p>
                        {item.description_en && (
                          <p style={{
                            fontSize: '11px', color: MUTED, margin: '0 0 8px', lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}>
                            {item.description_en}
                          </p>
                        )}

                        {/* Price + Add */}
                        <div style={{
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between', gap: '4px',
                        }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: INK }}>
                            {formatPrice(item.base_price_santim)}
                          </span>

                          {qty === 0 ? (
                            <button
                              onClick={() => addItem({
                                id: item.id,
                                name_en: item.name_en,
                                base_price_santim: item.base_price_santim,
                              })}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '4px',
                                backgroundColor: FOREST, color: '#ffffff',
                                border: 'none', borderRadius: '8px',
                                padding: '6px 10px',
                                fontSize: '12px', fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              <Plus style={{ width: '12px', height: '12px' }} />
                              Add
                            </button>
                          ) : (
                            <div style={{
                              display: 'flex', alignItems: 'center',
                              backgroundColor: FOREST, borderRadius: '8px', overflow: 'hidden',
                            }}>
                              <button
                                onClick={() => removeItem(item.id)}
                                style={{
                                  background: 'none', border: 'none', color: '#fff',
                                  padding: '6px 8px', cursor: 'pointer',
                                  display: 'flex', alignItems: 'center',
                                }}
                              >
                                <Minus style={{ width: '12px', height: '12px' }} />
                              </button>
                              <span style={{
                                fontSize: '12px', fontWeight: 700, color: '#fff',
                                minWidth: '16px', textAlign: 'center',
                              }}>
                                {qty}
                              </span>
                              <button
                                onClick={() => addItem({
                                  id: item.id,
                                  name_en: item.name_en,
                                  base_price_santim: item.base_price_santim,
                                })}
                                style={{
                                  background: 'none', border: 'none', color: '#fff',
                                  padding: '6px 8px', cursor: 'pointer',
                                  display: 'flex', alignItems: 'center',
                                }}
                              >
                                <Plus style={{ width: '12px', height: '12px' }} />
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
          </div>

        </div>{/* end scrollable */}

        {/* Bottom nav inside the right panel */}
        <BottomNav />
      </div>
    </div>
  );
}

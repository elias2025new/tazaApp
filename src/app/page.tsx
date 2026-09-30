'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Plus, Minus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/money';
import { DESIGN_CONFIG, getCategorySubtitle } from '@/lib/design-config';

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

// Design tokens strictly from spec
const FOREST = '#03301C';
const CREAM = '#FBF8F3';
const CARD_BG = '#FDFCF9';
const AMBER = '#EBAA38';
const LIME = '#c4e32e';
const INK = '#111111';
const SECONDARY = '#3B3D41';
const PLACEHOLDER = '#6B6B6C';

// Telegram + CSS safe-area insets with 0 fallbacks
const SAFE_TOP =
  'var(--tg-content-safe-area-inset-top, var(--tg-safe-area-inset-top, env(safe-area-inset-top, 0px)))';
const SAFE_BOTTOM =
  'var(--tg-content-safe-area-inset-bottom, var(--tg-safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)))';

function triggerHaptic(style: 'light' | 'medium' = 'light') {
  try {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
    }
  } catch {}
}

function formatCategoryLabel(name: string) {
  const lower = name.toLowerCase().trim();
  if (lower === 'sandwiches & rolls' || lower === 'sandwiches and rolls') {
    return (
      <>
        Sandwiches
        <br />
        &amp; Rolls
      </>
    );
  }
  if (lower === 'breakfast specials') {
    return (
      <>
        Breakfast
        <br />
        Specials
      </>
    );
  }
  if (lower === 'hot drinks') {
    return (
      <>
        Hot
        <br />
        Drinks
      </>
    );
  }
  return name;
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);

  const { items: cartItems, addItem, removeItem, count, total } = useCartStore();
  const cartCount = count();
  const cartSubtotal = total();

  useEffect(() => {
    fetch('/api/menu', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        const fetchedCats: Category[] = d.categories || [];
        const fetchedItems: MenuItem[] = d.items || [];
        setCategories(fetchedCats);
        setItems(fetchedItems);
        setLoading(false);
        setActiveCategory('all');
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  function getQty(id: string) {
    return cartItems.find((c) => c.id === id)?.quantity ?? 0;
  }

  function handleSelectCategory(catId: string) {
    triggerHaptic('light');
    if (search) setSearch('');
    setActiveCategory(catId);
    rightScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Filter items
  const isSearching = debouncedSearch.trim().length > 0;
  const searchResults = isSearching
    ? items.filter((item) =>
        item.name_en.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (item.description_en && item.description_en.toLowerCase().includes(debouncedSearch.toLowerCase()))
      )
    : [];

  const navCategories = [
    { id: 'all', name_en: 'All' },
    ...categories,
  ];

  return (
    <div
      style={{
        display: 'flex',
        height: '100dvh',
        width: '100%',
        overflow: 'hidden',
        backgroundColor: FOREST,
      }}
    >
      {/* ══════════════════════════════════════════════════════════════════
          1) SIDEBAR (Left Column ~94px, 24% width, full height, scrolls itself)
      ══════════════════════════════════════════════════════════════════ */}
      <aside
        style={{
          width: '94px',
          minWidth: '94px',
          maxWidth: '94px',
          flexShrink: 0,
          backgroundColor: FOREST,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingBottom: `calc(72px + ${SAFE_BOTTOM})`, // Nav height + 16px
          borderRight: 'none',
        }}
      >
        {/* Brand block: left-aligned, 12px left padding, 90px top padding (clears Telegram overlay buttons) */}
        <div
          style={{
            paddingLeft: '12px',
            paddingRight: '6px',
            paddingTop: `calc(90px + ${SAFE_TOP})`,
            paddingBottom: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          <div
            style={{
              width: '66px',
              height: '66px',
              borderRadius: '50%',
              overflow: 'hidden',
              backgroundColor: 'rgba(251, 248, 243, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={DESIGN_CONFIG.brand.logo}
              alt={DESIGN_CONFIG.brand.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '15px',
              fontWeight: 700,
              color: CREAM,
              margin: '8px 0 0 0',
              lineHeight: 1.15,
            }}
          >
            {DESIGN_CONFIG.brand.name}
          </h1>

          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '10.5px',
              color: 'rgba(251, 248, 243, 0.85)',
              margin: '2px 0 0 0',
              lineHeight: 1.25,
            }}
          >
            {DESIGN_CONFIG.brand.locationLine1}
            <br />
            {DESIGN_CONFIG.brand.locationLine2}
          </p>
        </div>

        {/* Divider below brand block: white at 16% opacity, inset 12px left and 13px right */}
        <div
          style={{
            height: '1px',
            backgroundColor: 'rgba(255, 255, 255, 0.16)',
            marginLeft: '12px',
            marginRight: '13px',
            marginBottom: '4px',
          }}
        />

        {/* Category list */}
        <nav style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          {navCategories.map((cat, idx) => {
            const isActive = activeCategory === cat.id;
            const nextIsActive = activeCategory === navCategories[idx + 1]?.id;
            const hideDivider = isActive || nextIsActive;

            return (
              <React.Fragment key={cat.id}>
                <button
                  type="button"
                  onClick={() => handleSelectCategory(cat.id)}
                  style={{
                    position: 'relative',
                    width: isActive ? 'calc(100% - 5px)' : '100%',
                    minHeight: '46px',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: '16px',
                    paddingRight: '6px',
                    paddingTop: '6px',
                    paddingBottom: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'var(--font-serif)',
                    fontSize: '13px',
                    fontWeight: isActive ? 700 : 400,
                    lineHeight: 1.2,
                    backgroundColor: isActive ? CREAM : 'transparent',
                    color: isActive ? INK : CREAM,
                    borderRadius: isActive ? '0 12px 12px 0' : '0',
                    transition: 'transform 0.1s ease, background-color 0.15s ease',
                  }}
                  onPointerDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.97)';
                  }}
                  onPointerUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  onPointerLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {/* Active 3px-wide fully rounded amber bar, 6px from left edge, 70% height */}
                  {isActive && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '6px',
                        top: '15%',
                        height: '70%',
                        width: '3px',
                        backgroundColor: AMBER,
                        borderRadius: '9999px',
                      }}
                    />
                  )}

                  <span
                    style={{
                      display: 'block',
                      whiteSpace: 'normal',
                      wordBreak: 'normal',
                      overflowWrap: 'normal',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {formatCategoryLabel(cat.name_en)}
                  </span>
                </button>

                {/* 1px divider between rows, inset 12px left and 13px right */}
                {idx < navCategories.length - 1 && !hideDivider && (
                  <div
                    style={{
                      height: '1px',
                      backgroundColor: 'rgba(255, 255, 255, 0.16)',
                      marginLeft: '12px',
                      marginRight: '13px',
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </aside>

      {/* ══════════════════════════════════════════════════════════════════
          2) RIGHT PANEL (Cream #FBF8F3, full scroll, bottom padding for nav)
      ══════════════════════════════════════════════════════════════════ */}
      <div
        ref={rightScrollRef}
        style={{
          flex: 1,
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          backgroundColor: CREAM,
          position: 'relative',
          paddingBottom: `calc(72px + ${SAFE_BOTTOM})`, // Nav height + 16px
        }}
      >
        {/* ── HERO SECTION (~285px tall + top safe inset) ────────────────── */}
        <div
          style={{
            position: 'relative',
            height: `calc(285px + ${SAFE_TOP})`,
            width: '100%',
            overflow: 'hidden',
          }}
        >
          {/* Cover photo anchored right */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={DESIGN_CONFIG.hero.image}
            alt=""
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'right center',
            }}
          />

          {/* Left cream gradient for text legibility */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(to right, ${CREAM} 24%, rgba(251, 248, 243, 0.85) 50%, rgba(251, 248, 243, 0.15) 80%, transparent 100%)`,
            }}
          />

          {/* Bottom ~50px fade into panel cream */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '50px',
              background: `linear-gradient(to bottom, transparent 0%, ${CREAM} 100%)`,
            }}
          />

          {/* Title at top-left: 12px from edge, 90px from top (+ safe inset) */}
          <div
            style={{
              position: 'absolute',
              left: '12px',
              top: `calc(90px + ${SAFE_TOP})`,
              zIndex: 2,
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontWeight: 700,
                fontSize: '24px',
                lineHeight: 1.05,
                color: INK,
                margin: 0,
              }}
            >
              {DESIGN_CONFIG.hero.titleLine1}
              <br />
              {DESIGN_CONFIG.hero.titleLine2}
            </h2>

            {/* 52x3px rounded amber underline */}
            <div
              style={{
                width: '52px',
                height: '3px',
                backgroundColor: AMBER,
                borderRadius: '9999px',
                marginTop: '6px',
              }}
            />

            {/* Tagline directly over photo */}
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '9px',
                fontWeight: 600,
                letterSpacing: '0.12em',
                color: INK,
                textTransform: 'uppercase',
                margin: '6px 0 0 0',
              }}
            >
              {DESIGN_CONFIG.hero.tagline}
            </p>
          </div>
        </div>

        {/* Cart Pill (alone, placed directly above the search field) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '0 12px',
            marginTop: '-44px',
            marginBottom: '8px',
            position: 'relative',
            zIndex: 15,
          }}
        >
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                router.push('/cart');
              }}
              aria-label="Cart"
              style={{
                height: '32px',
                borderRadius: '9999px',
                backgroundColor: LIME,
                border: 'none',
                padding: '0 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(0, 0, 0, 0.14)',
                transition: 'transform 0.1s ease',
              }}
              onPointerDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.97)';
              }}
              onPointerUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <ShoppingCart style={{ width: '15px', height: '15px', color: FOREST }} strokeWidth={2.2} />
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: FOREST,
                  whiteSpace: 'nowrap',
                }}
              >
                {formatPrice(cartSubtotal)}
              </span>
            </button>

            {/* Item count badge (overlaps top-right corner) */}
            {cartCount > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '-7px',
                  right: '-6px',
                  minWidth: '19px',
                  height: '19px',
                  padding: '0 4px',
                  borderRadius: '9999px',
                  backgroundColor: FOREST,
                  border: '1.5px solid #ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#ffffff',
                    lineHeight: 1,
                  }}
                >
                  {cartCount}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── 3) SEARCH BAR ──────────────────────────────────────────────── */}
        <div
          style={{
            padding: '0 12px',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <div
            style={{
              height: '36px',
              borderRadius: '12px',
              backgroundColor: CARD_BG,
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              gap: '10px',
              border: '1px solid rgba(0, 0, 0, 0.04)',
            }}
          >
            <Search style={{ width: '16px', height: '16px', color: SECONDARY, flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search menu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                color: INK,
              }}
            />
            {search.length > 0 && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '2px',
                  cursor: 'pointer',
                  color: PLACEHOLDER,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X style={{ width: '14px', height: '14px' }} />
              </button>
            )}
          </div>
        </div>

        {/* ── CONTENT SECTIONS ────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ padding: '16px 12px' }}>
            <div style={{ height: '24px', width: '120px', backgroundColor: '#EDE7DC', borderRadius: '4px', marginBottom: '8px' }} />
            <div style={{ height: '3px', width: '52px', backgroundColor: AMBER, borderRadius: '9999px', marginBottom: '16px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: CARD_BG,
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06)',
                  }}
                >
                  <div style={{ width: '100%', aspectRatio: '6 / 5', backgroundColor: '#EDE7DC' }} />
                  <div style={{ padding: '10px' }}>
                    <div style={{ height: '14px', width: '80%', backgroundColor: '#EDE7DC', borderRadius: '4px', marginBottom: '6px' }} />
                    <div style={{ height: '10px', width: '100%', backgroundColor: '#EDE7DC', borderRadius: '4px', marginBottom: '12px' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ height: '16px', width: '40px', backgroundColor: '#EDE7DC', borderRadius: '4px' }} />
                      <div style={{ height: '28px', width: '54px', backgroundColor: '#EDE7DC', borderRadius: '10px' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : isSearching ? (
          /* Search results section */
          <div style={{ padding: '16px 0 24px' }}>
            <div style={{ padding: '0 12px 12px' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '24px',
                  fontWeight: 700,
                  color: INK,
                  margin: 0,
                  lineHeight: 1.1,
                }}
              >
                Search Results
              </h2>
              <div
                style={{
                  width: '52px',
                  height: '3px',
                  backgroundColor: AMBER,
                  borderRadius: '9999px',
                  marginTop: '6px',
                }}
              />
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  color: SECONDARY,
                  marginTop: '8px',
                  marginBottom: 0,
                }}
              >
                {searchResults.length} {searchResults.length === 1 ? 'dish' : 'dishes'} found
              </p>
            </div>

            {searchResults.length === 0 ? (
              <p
                style={{
                  textAlign: 'center',
                  padding: '36px 12px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  color: SECONDARY,
                }}
              >
                No dishes found
              </p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  padding: '0 12px',
                }}
              >
                {searchResults.map((item) => (
                  <DishCard
                    key={item.id}
                    item={item}
                    qty={getQty(item.id)}
                    onAdd={() => {
                      triggerHaptic('light');
                      addItem({
                        id: item.id,
                        name_en: item.name_en,
                        base_price_santim: item.base_price_santim,
                      });
                    }}
                    onRemove={() => {
                      triggerHaptic('light');
                      removeItem(item.id);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ) : activeCategory === 'all' ? (
          /* "All" active: Master Header + Quick-Jump Chips + Stack every category as its own section */
          <div style={{ padding: '16px 0 24px' }}>
            {/* Master "All Categories" Header */}
            <div style={{ padding: '0 12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '24px',
                    fontWeight: 700,
                    color: INK,
                    margin: 0,
                    lineHeight: 1.1,
                  }}
                >
                  All Categories
                </h2>
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: SECONDARY,
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    padding: '3px 10px',
                    borderRadius: '9999px',
                  }}
                >
                  {items.length} {items.length === 1 ? 'dish' : 'dishes'}
                </span>
              </div>
              <div
                style={{
                  width: '52px',
                  height: '3px',
                  backgroundColor: AMBER,
                  borderRadius: '9999px',
                  marginTop: '6px',
                }}
              />
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  color: SECONDARY,
                  marginTop: '8px',
                  marginBottom: 0,
                }}
              >
                {getCategorySubtitle('all')}
              </p>
            </div>

            {/* Quick-jump category chips */}
            <div
              style={{
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                padding: '0 12px 16px',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {categories.map((cat) => {
                const count = items.filter((it) => it.category_id === cat.id).length;
                if (count === 0) return null;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      const el = document.getElementById(`cat-section-${cat.id}`);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    style={{
                      flexShrink: 0,
                      padding: '5px 11px',
                      borderRadius: '9999px',
                      backgroundColor: CARD_BG,
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: INK,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cat.emoji && <span>{cat.emoji}</span>}
                    <span>{cat.name_en}</span>
                    <span style={{ fontSize: '10.5px', color: PLACEHOLDER }}>({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Stacked Category Sections */}
            {categories.map((cat, catIdx) => {
              const catItems = items.filter((it) => it.category_id === cat.id);
              if (catItems.length === 0) return null;

              return (
                <div key={cat.id} id={`cat-section-${cat.id}`} style={{ marginBottom: '28px' }}>
                  {/* Category Section Header */}
                  <div style={{ padding: '0 12px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h3
                        style={{
                          fontFamily: 'var(--font-serif)',
                          fontSize: '20px',
                          fontWeight: 700,
                          color: INK,
                          margin: 0,
                          lineHeight: 1.15,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {cat.emoji && <span>{cat.emoji}</span>}
                        <span>{cat.name_en}</span>
                      </h3>
                      <span
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: SECONDARY,
                          backgroundColor: 'rgba(0, 0, 0, 0.05)',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                        }}
                      >
                        {catItems.length} {catItems.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                    <div
                      style={{
                        width: '36px',
                        height: '2.5px',
                        backgroundColor: AMBER,
                        borderRadius: '9999px',
                        marginTop: '5px',
                      }}
                    />
                    <p
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '12px',
                        color: SECONDARY,
                        marginTop: '6px',
                        marginBottom: 0,
                      }}
                    >
                      {getCategorySubtitle(cat.name_en)}
                    </p>
                  </div>

                  {/* 2-column dish grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      padding: '0 12px',
                    }}
                  >
                    {catItems.map((item) => (
                      <DishCard
                        key={item.id}
                        item={item}
                        qty={getQty(item.id)}
                        onAdd={() => {
                          triggerHaptic('light');
                          addItem({
                            id: item.id,
                            name_en: item.name_en,
                            base_price_santim: item.base_price_santim,
                          });
                        }}
                        onRemove={() => {
                          triggerHaptic('light');
                          removeItem(item.id);
                        }}
                      />
                    ))}
                  </div>

                  {/* Divider between categories */}
                  {catIdx < categories.length - 1 && (
                    <div
                      style={{
                        height: '1px',
                        backgroundColor: 'rgba(0, 0, 0, 0.07)',
                        margin: '24px 12px 0',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Single category active */
          <div style={{ padding: '16px 0 24px' }}>
            {(() => {
              const currentCat = categories.find((c) => c.id === activeCategory);
              const catName = currentCat ? currentCat.name_en : 'Menu';
              const catItems = items.filter((it) => it.category_id === activeCategory);

              return (
                <>
                  <div style={{ padding: '0 12px 12px' }}>
                    <h2
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '24px',
                        fontWeight: 700,
                        color: INK,
                        margin: 0,
                        lineHeight: 1.1,
                      }}
                    >
                      {catName}
                    </h2>
                    <div
                      style={{
                        width: '52px',
                        height: '3px',
                        backgroundColor: AMBER,
                        borderRadius: '9999px',
                        marginTop: '6px',
                      }}
                    />
                    <p
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '13px',
                        color: SECONDARY,
                        marginTop: '8px',
                        marginBottom: 0,
                      }}
                    >
                      {getCategorySubtitle(catName)}
                    </p>
                  </div>

                  {catItems.length === 0 ? (
                    <p
                      style={{
                        textAlign: 'center',
                        padding: '36px 12px',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '13px',
                        color: SECONDARY,
                      }}
                    >
                      No items available in this category
                    </p>
                  ) : (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        padding: '0 12px',
                      }}
                    >
                      {catItems.map((item) => (
                        <DishCard
                          key={item.id}
                          item={item}
                          qty={getQty(item.id)}
                          onAdd={() => {
                            triggerHaptic('light');
                            addItem({
                              id: item.id,
                              name_en: item.name_en,
                              base_price_santim: item.base_price_santim,
                            });
                          }}
                          onRemove={() => {
                            triggerHaptic('light');
                            removeItem(item.id);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   5) DISH CARD COMPONENT (2 columns, 8px gap, 6:5 photos,
   one-line dish name, 2-line description clamp, 60x28 Add button
   with >=40px hit area)
══════════════════════════════════════════════════════════════════ */
function DishCard({
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
  const priceFormatted = `${Math.round(item.base_price_santim / 100)} birr`;
  const isLongTitle = item.name_en.length > 17;

  return (
    <div
      style={{
        backgroundColor: CARD_BG,
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 6:5 aspect ratio photo with top corners rounded */}
      <div
        style={{
          width: '100%',
          aspectRatio: '6 / 5',
          position: 'relative',
          backgroundColor: '#EDE7DC',
          overflow: 'hidden',
        }}
      >
        {item.image_path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_path}
            alt={item.name_en}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#EDE7DC',
              gap: '4px',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={DESIGN_CONFIG.brand.logo}
              alt=""
              style={{ width: '28px', height: '28px', borderRadius: '50%', opacity: 0.45, objectFit: 'cover' }}
            />
            <span
              style={{
                color: '#7A7468',
                fontFamily: 'var(--font-serif)',
                fontSize: '10.5px',
                fontWeight: 600,
              }}
            >
              Taza Greens
            </span>
          </div>
        )}
      </div>

      {/* Text area with 9-10px padding */}
      <div
        style={{
          padding: '9px 10px 10px',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          justifyContent: 'space-between',
        }}
      >
        <div>
          {/* Dish name: serif bold ~14px, ink, one line with tight tracking for long names */}
          <h3
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: isLongTitle ? '11.5px' : '13.5px',
              fontWeight: 700,
              letterSpacing: isLongTitle ? '-0.04em' : '-0.02em',
              color: INK,
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.2,
            }}
            title={item.name_en}
          >
            {item.name_en}
          </h3>

          {/* Description: sans ~11px, secondary text #3B3D41, line-height 1.25, clamped to 2 lines */}
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              color: SECONDARY,
              lineHeight: 1.25,
              margin: '3px 0 0 0',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '27px',
            }}
          >
            {item.description_en || 'Delicious freshly prepared dish.'}
          </p>
        </div>

        {/* Bottom row: Price on left, Add button on right */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '4px',
            marginTop: '8px',
          }}
        >
          {/* Price: serif bold ~16px, ink */}
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '15px',
              fontWeight: 700,
              color: INK,
              whiteSpace: 'nowrap',
            }}
          >
            {priceFormatted}
          </span>

          {/* Add button or Stepper: forest green, radius 10px, 54x28px */}
          {qty === 0 ? (
            <button
              type="button"
              onClick={onAdd}
              style={{
                position: 'relative',
                width: '54px',
                height: '28px',
                borderRadius: '10px',
                backgroundColor: FOREST,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                padding: 0,
                color: '#ffffff',
                fontFamily: 'var(--font-sans)',
                fontSize: '12.5px',
                fontWeight: 500,
                transition: 'transform 0.1s ease',
                flexShrink: 0,
              }}
              onPointerDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.97)';
              }}
              onPointerUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {/* Invisible tap area of at least 40px */}
              <span
                style={{
                  position: 'absolute',
                  inset: '-6px',
                  pointerEvents: 'none',
                }}
              />
              <Plus style={{ width: '12px', height: '12px', color: '#ffffff' }} strokeWidth={2.5} />
              <span>Add</span>
            </button>
          ) : (
            <div
              style={{
                width: '54px',
                height: '28px',
                borderRadius: '10px',
                backgroundColor: FOREST,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 3px',
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                onClick={onRemove}
                aria-label="Decrease quantity"
                style={{
                  position: 'relative',
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ position: 'absolute', inset: '-6px' }} />
                <Minus style={{ width: '11px', height: '11px' }} strokeWidth={2.5} />
              </button>

              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: '#ffffff',
                }}
              >
                {qty}
              </span>

              <button
                type="button"
                onClick={onAdd}
                aria-label="Increase quantity"
                style={{
                  position: 'relative',
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ position: 'absolute', inset: '-6px' }} />
                <Plus style={{ width: '11px', height: '11px' }} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

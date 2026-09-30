/**
 * src/lib/design-config.ts
 * Config for brand strings, hero content, and per-category subtitles.
 */

export const DESIGN_CONFIG = {
  brand: {
    name: 'Taza Greens',
    locationLine1: 'Bole Rwanda,',
    locationLine2: 'Addis Ababa',
    logo: '/brand/logo.jpg',
  },
  hero: {
    image: '/brand/hero.webp',
    titleLine1: 'Good Food',
    titleLine2: 'Brighter Days',
    tagline: 'FRESH • HEALTHY • DELICIOUS',
  },
  categorySubtitles: {
    all: 'Everything we serve, fresh every day',
    'breakfast specials': 'Start your day with something delicious',
    'sandwiches & rolls': 'Fresh, filling and made to order',
    traditional: 'Authentic Ethiopian flavors, made with love',
    pizza: 'Hot from the oven, made fresh',
    salads: 'Fresh, crisp and full of goodness',
    cake: 'Sweet slices for every moment',
    'hot drinks': 'Warm cups to brighten your day',
    teas: 'Soothing blends, brewed fresh',
    beverages: 'Cool, refreshing and natural',
    extras: 'A little extra flavor to complete your meal',
  } as Record<string, string>,
};

export function getCategorySubtitle(name: string): string {
  const normalized = name.trim().toLowerCase();
  return (
    DESIGN_CONFIG.categorySubtitles[normalized] ||
    'Fresh, delicious and made with love'
  );
}

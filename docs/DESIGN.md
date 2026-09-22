# Design system — Taza Greens Delivery

**Status: brand tokens extracted and confirmed.** Tokens were extracted from `cafe.tazagreens.org`
using browser inspection on 2026-09-22. All `EXTRACT` placeholders have been replaced with real values.
`src/styles/tokens.css` has been generated from these values.

## What we know about the brand (from the live site)
- Name: **Taza Greens**. Tagline: **"Fresh Starts Here."** Hero copy: **"Good mornings start here."**
- Subhead: *"Ethiopian favorites, generous brunch plates, fresh coffee, and a room made for lingering."*
- Ethiopian breakfast and brunch café — fetira, chechebsa, fata, genfo, omelettes, coffee — in Bole
  Rwanda, Addis Ababa. Described as a cozy neighborhood spot people also work/study from.
- "Greens" + "Fresh" signal produce-forward, clean, morning-light identity — not dark or nightlife.
- Audience: local, mobile-first, ordering in Birr, comfortable in Amharic and/or English.

## Extracted brand tokens (source: computed CSS, cafe.tazagreens.org, 2026-09-22)

### Color palette

| token | value | source |
|---|---|---|
| `--color-forest` | `#103d2b` | hero/section background, extracted from hero bg |
| `--color-forest-deep` | `#092a1d` | darker forest variant, derived |
| `--color-cream` | `#f5f0df` | nav/header bar background, extracted from nav computed bg |
| `--color-paper` | `#fbf8ed` | main page background (`<body>`), extracted |
| `--color-terracotta` | `#c66f45` | emphasis/"start here." text color, extracted from hero heading |
| `--color-citrus` | `#c8e72f` | CTA button fill ("See our favorites", "VISIT US"), extracted from button bg |
| `--color-ink` | `#12291f` | primary dark text on light backgrounds, extracted from headings on cream |
| `--color-text-muted` | `#5c7063` | secondary text, derived from ink |

### Semantic token mapping (light mode)

| semantic token | maps to | role |
|---|---|---|
| `--color-primary` | `#103d2b` (forest) | brand actions, active tracker step |
| `--color-accent` | `#c8e72f` (citrus) | primary CTA buttons only |
| `--color-emphasis` | `#c66f45` (terracotta) | one highlighted word per screen |
| `--color-bg` | `#fbf8ed` (paper) | app background |
| `--color-surface` | `#ffffff` | cards |
| `--color-surface-raised` | `#f5f0df` (cream) | nav, elevated surfaces |
| `--color-text` | `#12291f` (ink) | primary body text |
| `--color-text-muted` | `#5c7063` | secondary text, metadata |
| `--color-danger` | `#b3402b` | errors, rejected/cancelled, derived from terracotta-red |

### Typography (extracted from live site)

| role | font | source |
|---|---|---|
| Display/headings | **Fraunces** (variable, optical size 9–144) | confirmed from computed `font-family` on hero heading |
| Body/UI | **Instrument Sans** (variable, width 75–100) | confirmed from computed `font-family` on nav and body |
| Ethiopic (Amharic) | **Noto Sans Ethiopic** | added for i18n correctness; verify on real Android device |

**Type scale** (mobile base 16px): `xs 12 / sm 14 / base 16 / lg 18 / xl 20 / 2xl 24 / 3xl 30 / 4xl 36`
Headings use Fraunces 600+; body stays Instrument Sans 400–500.

### Buttons and shape

- **CTA button** ("See our favorites"): pill shape (`border-radius: 9999px`), citrus fill (`#c8e72f`), ink text (`#12291f`), no box-shadow, no border. Minimum height 44px.
- **Outline/ghost button** ("Get directions"): pill shape, transparent fill, ink border and text.
- **Card radius**: 16–24px.
- **No heavy shadows.** Surface elevation is achieved with background color difference, not drop shadows.

### Photography and visual style (observed from gallery/hero)
- Food photography: warm, natural, magazine-quality. Generous plating, real food, no heavy filters.
- Interior: warm Edison bulbs, green walls, earth-tone chairs. Cozy, neighborhood café feel.
- People appear occasionally (staff, diners) — natural, not stock.
- No scooter icons, no delivery-app clichés. This is a café, not a logistics brand.

## Logo and assets
- Logo mark: a square emblem with an illustrated mushroom/plant motif in a thin frame.
- Source URL: `https://cafe.tazagreens.org/assets/taza-emblem-transparent-BFloelCo.png`
- Saved to: `public/brand/logo-source.png` (download and save this before Phase 1 UI)
- Produce: `public/brand/logo.svg` / `logo.png` (header wordmark) and `logo-mark-512.png`, `logo-mark-128.png` (bot profile photo and app icon).
- **Never redraw the logo.** Export/download from the source URL only. Ask the owner if quality is insufficient.

## Menu (captured from site for seed data)
From the "Our Food" / "See our favorites" section visible on the site:
- Menu categories visible: Ethiopian Breakfast, Brunch Plates, Coffee & Drinks, Fresh Juice
- Sample items (exact prices to be confirmed by owner — ask before seeding):
  - Chechebsa, Fetira, Fata, Genfo (Ethiopian breakfast staples)
  - Omelettes, Full Breakfast plates (brunch)
  - Ethiopian coffee (traditional ceremony style), macchiato, fresh juice
- Dietary tags in scope: `vegan`, `fasting` (relevant for Ethiopian Orthodox fasting menus)

> **Owner action required:** Confirm the real menu categories, item names, and prices in ETB before Phase 2 seed data is loaded. The above are observed approximations, not the real menu.

## Layout decisions (confirmed from live site analysis)

**Menu screen**: Category chips (horizontal scroll) + vertical item list per category — the site uses
a list layout, not a grid. Match this pattern.

**Order tracker** (centerpiece — Domino's style):
```
┌ "Order #1042"                    Est. 12:55 ┐
│  ●──────●──────○──────○──────○               │
│ Received Preparing Ready  On the way  Delivered
│  12:41    12:44      —       —          —      │
├──────────────────────────────────────────────┤
│  Items (collapsed, tap to expand)             │
│  Delivery to: <landmark>                      │
│  Total: 745 ETB                               │
└──────────────────────────────────────────────┘
```
The active step pulses once (one deliberate animation). Completed steps show a check + timestamp. Future steps stay quiet/grey. This is the one place design gets a personality moment (rule 02).

## Theming
Tokens defined in `src/styles/tokens.css`. Tailwind v4 consumes them via `@theme inline`. Dark mode redefines the same variable names under `[data-theme="dark"]` using darker forest variants, not Telegram's generic dark colors. The Telegram `colorScheme` drives which attribute is set.

## Definition of "on-brand" for review
A screenshot of this app, shown next to a screenshot of `cafe.tazagreens.org`, should clearly read as the same restaurant: deep forest green hero/primary, citrus CTA, cream/paper background, Fraunces display serif, warm terracotta for emphasis. One accent, used sparingly.

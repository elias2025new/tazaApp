# /brand-extract

Populate `docs/DESIGN.md` and `public/brand/` from the client's real site. Never invent values.

1. Open https://cafe.tazagreens.org (and https://taza-greens.vercel.app if the first is thin) with the
   browser tool. Visit `/`, and any menu/about/gallery page it links to.
2. Take full-page screenshots at 1440px and 390px. Save under `public/brand/reference/`.
3. Inspect computed styles on the hero, buttons, and headings (devtools or a quick script) to read the
   **actual** rendered: primary/background/text/accent colors (hex), font-family stacks, base border-radius,
   button shadow style.
4. Download the logo (favicon, header logo, any `og:image`) at the highest resolution available. Save to
   `public/brand/logo-source.*`. Produce `logo.svg`/`logo.png` (trimmed, transparent) and a square
   `logo-mark` for the bot profile photo and app icon (512×512 and 128×128 PNG).
5. Note photography style (warm/bright/moody, plating style, whether people appear) and any repeated motif
   (leaf, plant, cup) — this drives icon and illustration choices.
6. Capture menu categories and 5–10 sample items with prices if visible, for seeding.
7. Fill every `EXTRACT:` placeholder in `docs/DESIGN.md` with the real value and a source note
   (`extracted from hero button, cafe.tazagreens.org, <date>`). If a token truly cannot be found on the
   site (e.g. no explicit error-state color), propose the closest sensible value *derived from* an
   extracted color and mark it `derived`, not `EXTRACT`.
8. If the site is unreachable or JS-blocked from this environment, tell the owner and ask him to drop
   files into `/brand` per `brand/README.md`, or paste computed colors/fonts himself. Do not proceed to
   full UI build with placeholder brand colors — build structure/logic first and flag it.
9. Generate `src/styles/tokens.css` from the finalized DESIGN.md. Show the owner a before/after screenshot
   of one real screen (menu grid) using the extracted tokens for approval before continuing.

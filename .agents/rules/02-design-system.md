# Design system rule (always on)

**Source of truth: `docs/DESIGN.md`.** Read it before touching any UI. Brand tokens live in
`src/styles/tokens.css` (generated from DESIGN.md) and are exposed to Tailwind through its theme.
Never hardcode a hex value, font name, radius, or shadow in a component. Use tokens.

## The brand comes from the client, not from you
- Colors, fonts, logo, and imagery style are extracted from https://cafe.tazagreens.org by `/brand-extract`.
- If extraction failed or a token is still marked `EXTRACT` in DESIGN.md, stop and ask the owner for
  `/brand` assets. Do not invent or "approximate" a brand palette.
- The app must feel like Taza Greens opened inside Telegram, not like a generic food-delivery template.

## Design stance
- Mobile-first, 360–430 px wide, one-handed. Primary actions live in the bottom thumb zone.
- Food photography carries the interface. Give images real space; keep chrome quiet.
- Spend boldness in one place per screen (the memorable element) and keep everything around it calm.
- Warm, local, fresh. Ethiopian breakfast culture, not corporate fast food.

## Avoid generic-template tells
- Identical rounded cards with the same soft grey shadow everywhere.
- Gradient washes as decoration; a tracked-out ALL-CAPS eyebrow above every heading.
- Meta strings joined with middle dots; arrows (→) appended to every button; monospace for small labels.
- A single accented word in every headline; numbered markers on content that isn't a sequence.
- Scattered hover/fade-in effects. Motion only when it answers a user action or marks one key moment.

## Typography
- Use the brand's typefaces from DESIGN.md. Ethiopic (Amharic) text must render with a proper Ethiopic
  font (e.g. Noto Sans Ethiopic) at a size and line-height that keep it legible; test both scripts.
- Type scale is defined once in tokens. Body ≥ 16 px. Line length < 75 characters.

## Components and screens
- Build on shadcn/ui primitives, restyled through tokens. Do not ship default shadcn look.
- Every interactive element has default, pressed, focus, disabled, and loading states.
- Every list has a skeleton loader and an empty state that tells the user what to do.
- Price format is set in `lib/money.ts` and DESIGN.md. Use it everywhere.
- Status is shown with icon + text + color together, never color alone.

## Telegram integration in the UI
- Respect safe-area insets (`env(safe-area-inset-*)` plus Telegram's content/safe area vars).
- Follow Telegram light/dark via `colorScheme`; use the brand's derived dark tokens, not Telegram's raw colors.
- Use the Telegram `MainButton` for the primary checkout action and `BackButton` for navigation depth;
  fall back to in-page buttons when running outside Telegram.
- Trigger haptics on add-to-cart, quantity change, order placed, and errors (`HapticFeedback`).

## Copy
- Sentence case. Active voice. Plain verbs: "Add to cart", "Place order", "Track order".
- The same action keeps the same name across the flow (button "Place order" → toast "Order placed").
- Errors never apologize and are never vague: say what happened and how to fix it.
- Tone comes from the brand section of DESIGN.md.

## Quality floor for any screen
Responsive 360–430 px, focus-visible, AA contrast, reduced-motion respected, no layout shift,
screenshot reviewed at 390×844 in light and dark before it counts as done.

# Roadmap

Work in phases. Each phase ends with `/review`, a summary, and owner approval before the next starts.
Check boxes as they're genuinely done (tested, reviewed), not just coded.

## Phase 0 — Foundations
- [ ] `/setup-project` complete: scaffold, deps, CI, lint/format, env validation
- [ ] `/telegram-setup` steps 1–4 (bot created, token stored, webhook secret generated, staff chat chosen)
- [ ] `/brand-extract` complete: real tokens in `docs/DESIGN.md`, logo assets in `public/brand/`
- [ ] Supabase project linked (dev), first migration (`profiles`, `staff_roles`) applied locally
- **Acceptance:** `pnpm dev` runs, CI is green on an empty-ish app, brand tokens are real not placeholder.

## Phase 1 — Identity & shell
- [ ] `initData` validation (`lib/telegram/validate-init-data.ts`) with unit tests: valid/tampered/expired/missing
- [ ] `/api/auth/telegram` issues session; client stores it in memory and re-authenticates on expiry
- [ ] App shell: theme (light/dark via Telegram colorScheme + brand tokens), locale detection (en/am), bottom nav shell
- [ ] Dev mock mode works outside Telegram; asserted off in production builds
- **Acceptance:** opening the bot's Mini App creates/loads a `profiles` row; app shell renders on-brand in both locales and themes.

## Phase 2 — Menu browsing
- [ ] `menu_categories`/`menu_items`/`menu_item_options` migrations + RLS + seed data (from `/brand-extract`'s captured menu or owner-provided list)
- [ ] Category + item list UI, item detail w/ options, sold-out state
- [ ] Image pipeline: Storage bucket, `next/image`, upload flow in admin (can stub admin upload with direct Storage upload first)
- **Acceptance:** the real Taza Greens menu (even if a first pass) is browsable and looks on-brand at 390px; Lighthouse/perf budget from rule `01` met.

## Phase 3 — Cart, checkout, order creation
- [ ] Cart (Zustand + persistence), quantity/options editing
- [ ] Address: map pin + required landmark text, saved addresses
- [ ] `create_order` function/route: server-computed pricing, idempotency key, closed/minimum-order handling
- [ ] Order confirmation screen
- **Acceptance:** an order can be placed end-to-end with a server-verified total; double-submit doesn't duplicate; closed/minimum-order errors are clear.

## Phase 4 — Live order tracking (the centerpiece)
- [ ] `order_events`, `transition_order_status` function, allowed-transitions map
- [ ] Domino's-style stepper UI (design in `docs/DESIGN.md`) wired to Realtime + polling fallback
- [ ] Bot notifications on each status change, with "Track order" deep link (`startapp=order_<id>`)
- **Acceptance:** changing status in the DB (or via a temporary admin action) updates the open tracker within ~2s and sends the right bot message.

## Phase 5 — Staff dashboard
- [ ] `staff_roles` management (owner-only invite/revoke)
- [ ] Kitchen board (accept/reject/preparing/ready)
- [ ] Rider view (ready → out for delivery → delivered), address/landmark/phone shown
- [ ] Orders overview + basic filters
- [ ] Staff-only bot alert on new order with inline Accept/Reject
- **Acceptance:** a full order can be run start-to-finish using only phones — customer app + staff dashboard — no other tool.

## Phase 6 — Menu & settings management, polish
- [ ] Admin menu CRUD (items, categories, options, sold-out toggle, photos)
- [ ] Restaurant settings screen (open/closed, hours, delivery fee, minimum order, pickup toggle)
- [ ] Profile screen (name/phone, saved addresses, order history/reorder, "delete my data")
- [ ] Full Amharic pass reviewed by a native speaker (owner or client contact)
- **Acceptance:** owner can run the business's daily settings without a developer; full `/review` pass clean.

## Phase 7 — Hardening & launch
- [ ] RLS audit across every table (rule 04's checklist)
- [ ] Rate limiting on auth + order creation
- [ ] Error monitoring hooked up (verify current recommended approach for Vercel + Next.js at build time)
- [ ] Production Supabase project + production bot; `/deploy` run for real
- [ ] Load a realistic seed of the full real menu; final on-brand screenshot review against the live site
- **Acceptance:** production URL works end-to-end with the production bot; owner has run one real test order.

## Phase 8 — Post-launch (not blocking launch)
- [ ] Online payment integration (provider TBD with owner)
- [ ] Loyalty/repeat-customer incentives
- [ ] Analytics for the owner (best sellers, peak hours)

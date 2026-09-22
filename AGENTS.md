# Taza Greens Delivery — Telegram Mini App

Production-grade food ordering and delivery Telegram Mini App for **Taza Greens**
(Ethiopian breakfast and brunch café, Bole Rwanda, Addis Ababa). This is a real client
project shown first as a showcase. Build every part as shippable software, not a demo.

## Read order (binding)
1. `docs/PRD.md` — what we build and why
2. `docs/ARCHITECTURE.md` — stack, ADRs, auth flow, folder structure
3. `docs/DATABASE.md` — data model, RLS intent, functions
4. `docs/DESIGN.md` — brand and UI system (single source of truth for all UI)
5. `docs/ROADMAP.md` — phases and acceptance criteria
6. `docs/TELEGRAM_SETUP.md` — BotFather steps the owner performs

Rules in `.agents/rules/` are always on. Workflows in `.agents/workflows/` are slash commands:
`/setup-project` `/brand-extract` `/telegram-setup` `/new-feature` `/db-migration` `/review` `/deploy`

## Stack (decided)
Next.js App Router + React + TypeScript (strict) · Tailwind CSS + shadcn/ui · Zustand + TanStack Query ·
Zod + React Hook Form · Supabase (Postgres, RLS, Realtime, Storage) · grammY (bot webhook) ·
Telegram Mini Apps SDK · next-intl (English + Amharic) · Vercel · GitHub Actions · pnpm.

## Surfaces
- Customer Mini App: `/` (menu, cart, checkout, order tracking)
- Staff dashboard: `/admin` (order board, kitchen, rider, menu, settings) — role-gated
- Bot: `/api/telegram/webhook` (commands, notifications, staff inline buttons)

## Non-negotiables
- Never invent brand assets. Tokens come from `docs/DESIGN.md`, extracted from the client's site.
- The server recomputes every price and total. Never trust client-sent money values.
- RLS on for every table. Service-role key is server-only. No secret ever reaches the client bundle.
- Never print, log, or commit secrets. Ask the owner for credentials by name (see rule 05).
- Work in phases. Plan → owner approval → build → `/review` → owner approval → next phase.
- Ask the owner for product decisions, with a recommended default. Do not guess business rules.

## Commands (available after `/setup-project`)
`pnpm dev` · `pnpm build` · `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm test:e2e`
`supabase db reset` · `supabase migration new <name>` · `supabase gen types typescript --local`

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

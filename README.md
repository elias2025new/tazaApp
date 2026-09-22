# Taza Greens Delivery — starter kit

Everything here is prep for building the Taza Greens Telegram Mini App in **Antigravity**. Nothing in
this folder is application code yet — it's the spec, rules, and workflows that make Antigravity build it
like a senior engineer would, on the first try, without you re-explaining the project every session.

## How to use this
1. Unzip this folder somewhere on your machine and open it **as the workspace root** in Antigravity
   (File → Open Folder → this folder, not a parent folder).
2. Open `prompts/START_HERE.md`, copy the whole thing, paste it as your first message in Antigravity.
3. Follow along — it will confirm it's read everything, ask you a short batch of product questions with
   recommended defaults, then start building in phases, showing you real screens after each one.
4. When it asks for your Telegram bot token, follow `docs/TELEGRAM_SETUP.md` to create the bot in
   BotFather first, then paste the token when asked (never earlier, never anywhere else).

## What's in here
```
AGENTS.md                    Project map — read first (Antigravity reads this automatically)
.agents/rules/                Always-on rules: project context, engineering, design, Telegram, Supabase/security, collaboration
.agents/workflows/             Slash-command workflows for each phase
docs/
  PRD.md                      What we're building and why — the "Domino's app, single restaurant" concept
  ARCHITECTURE.md              Stack choices, ADRs, system diagram
  DATABASE.md                  Full data model (single-tenant), RLS intent
  DESIGN.md                    Design system — brand tokens are placeholders until /brand-extract runs
  ROADMAP.md                   Phase-by-phase build plan with acceptance criteria
  TELEGRAM_SETUP.md             For you — BotFather steps
brand/README.md                Where to drop logo/screenshots if auto-extraction can't reach the live site
prompts/START_HERE.md          The prompt to paste into Antigravity
.env.example                   Every credential the project will need, with notes on where to get it
.gitignore                     Already set up to never commit secrets
```

## Stack (already decided, see docs/ARCHITECTURE.md for reasoning)
Next.js (App Router, TypeScript) · Tailwind + shadcn/ui · Zustand + TanStack Query · Supabase
(Postgres + RLS + Realtime + Storage) · grammY (Telegram bot, webhook) · Telegram Mini Apps SDK ·
next-intl (English + Amharic) · Vercel · GitHub Actions.

## A note on the brand
I pulled what I could from `cafe.tazagreens.org`, but it's a JavaScript-rendered site, so a plain fetch
only returned page metadata (name, tagline, description) — not the real colors, fonts, or logo file.
`docs/DESIGN.md` has a grounded design *direction* based on what the brand clearly is (Ethiopian
breakfast café, "Fresh Starts Here", produce-forward), but every actual color/font value is marked
`EXTRACT` — a placeholder, not a real brand color. The `/brand-extract` workflow is the first thing
Antigravity should run: it has real browser access and can visit the live site, read its actual styles,
and pull the real logo. If that still doesn't work (site down, blocked, redesigned), drop files into
`/brand` per `brand/README.md` and tell the agent.

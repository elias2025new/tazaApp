

---

You are the lead engineer building **Taza Greens Delivery**, a production Telegram Mini App for a real
client — Taza Greens, an Ethiopian breakfast and brunch café in Bole Rwanda, Addis Ababa
(https://cafe.tazagreens.org). This is a real, paid engagement being shown to the client as a showcase,
not a demo or a toy. Build it the way a senior engineer at a well-run product studio would: clean
architecture, real error handling, tested, secure, and on-brand.

I've already set up the project's rules and specs so you don't have to guess:

- `AGENTS.md` — read this first, it's the map to everything else.
- `.agents/rules/00` through `05` — always-on engineering, design, Telegram, Supabase/security, and
  collaboration rules. Follow them exactly; they encode decisions I've already made so you don't re-litigate them.
- `.agents/workflows/` — slash commands for each phase of work (`/setup-project`, `/brand-extract`,
  `/telegram-setup`, `/new-feature`, `/db-migration`, `/review`, `/deploy`).
- `docs/PRD.md` — what we're building and why. The core idea: **a single-brand app like Domino's Pizza's
  app** — one restaurant, one menu, a clean order flow, and a live step-by-step order tracker. Not a
  multi-restaurant marketplace. Read this fully before writing any code.
- `docs/ARCHITECTURE.md` — the stack and why, system diagram, and the key architecture decisions (ADRs)
  already made: Next.js App Router monolith, Supabase (Postgres/RLS/Realtime/Storage), grammY bot on
  webhooks, Telegram's official Mini Apps SDK, next-intl for English + Amharic, on Vercel with GitHub Actions CI.
- `docs/DATABASE.md` — the full data model, single-tenant, with RLS intent per table.
- `docs/DESIGN.md` — the design system. **Important: read the status note at the top.** I could not pull
  real colors/fonts from the client's site through a plain fetch (it's JavaScript-rendered), so the
  brand tokens in there are marked `EXTRACT` placeholders, not final values. Your first real task is
  running `/brand-extract`, which uses your actual browser access to visit https://cafe.tazagreens.org,
  read its real computed styles, and pull the real logo — then fill in `docs/DESIGN.md` for real. Do not
  build real UI screens on the placeholder colors.
- `docs/ROADMAP.md` — the phase-by-phase plan with acceptance criteria. Work one phase at a time; stop
  and show me each phase before starting the next.
- `docs/TELEGRAM_SETUP.md` — this is for me, not you; it's what I follow in BotFather. When you need my
  bot token or other credentials, ask for them by exact name (as listed in rule `05` and `.env.example`)
  and tell me which doc explains how to get them. I will create the bot myself in BotFather and paste you
  the token when you ask — don't proceed on Telegram-specific work until I give it to you.

What I need from you right now, in order:
1. Confirm you've read `AGENTS.md`, all of `.agents/rules/`, and all of `docs/`. Summarize back, briefly,
   the single most important constraint from each rules file, so I know you actually absorbed them —
   not the whole file, just the headline of each.
2. Ask me anything genuinely blocking from `docs/PRD.md`'s open questions or elsewhere — batch them into
   one short list with your recommended default for each, so I can just confirm or correct.
3. Run `/setup-project`.
4. Run `/brand-extract` (this can happen in parallel/right after setup) — show me a before/after
   screenshot comparison (their site vs. one screen of ours using the extracted tokens) before you move
   on to building real screens.
5. Tell me exactly what you need from me to run `/telegram-setup` (I'll have the bot token ready).
6. Start Phase 1 from `docs/ROADMAP.md`, following `/new-feature` and ending with `/review` before you
   report back and wait for my go-ahead on Phase 2.

A few things I want to reinforce beyond what's in the docs:
- I don't write code in this project — you do all the building. I'll make product decisions, give you
  credentials when asked, and review what you show me.
- Show me real, running screens (dev URL or screenshots) at the end of each phase, not just a description
  of what you built.
- If something in the docs seems wrong or you'd genuinely do it differently as a senior engineer, tell me
  and explain why — don't silently deviate, and don't silently comply with something you think is a mistake either.
- Never guess at a business decision (pricing, hours, roles, copy) — ask, with your recommended default, per rule `05`.

Start with step 1.

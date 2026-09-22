# Architecture

## Stack and why

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) + React + TypeScript | One codebase serves the customer Mini App, the staff dashboard, and the bot webhook as API routes. Server Components keep the menu screen fast on cheap Android phones; Vercel is built for it. |
| Styling/UI | Tailwind CSS + shadcn/ui | Fast to theme entirely from tokens (needed to look like Taza Greens, not a template); shadcn primitives are copied into the repo, so the owner isn't locked into a component library he can't change. |
| Client state | Zustand (cart, UI state) + TanStack Query (server state) | Cart needs simple local state with persistence; orders/menu need caching, refetch, and optimistic UI — different tools for different jobs, kept small and explicit rather than one heavy framework. |
| Forms/validation | React Hook Form + Zod | One schema validates the form client-side and the API server-side. |
| Backend/data | Supabase (Postgres + RLS + Realtime + Storage) | Managed Postgres with row-level security fits "customers see only their orders, staff see by role" naturally; Realtime drives the live order tracker without a separate WebSocket service; Storage holds menu photos. Matches the owner's chosen stack. |
| Bot | grammY (webhook, not polling) | Modern, typed, lightweight Telegram framework; webhook mode fits serverless (Vercel) far better than long polling, which needs an always-on process. |
| Mini App SDK | `@telegram-apps/sdk-react` (official Telegram Mini Apps SDK) | Handles theme params, viewport, haptics, back button, main button, cloud storage, without hand-rolling `window.Telegram.WebApp` calls everywhere. |
| i18n | next-intl | English + Amharic, App Router-native. |
| Hosting | Vercel | Owner's choice; Preview deploys double as a safe staging environment per bot. |
| CI | GitHub Actions | Owner's choice (GitHub); typecheck/lint/test/build gate every PR. |

Before installing, check each package's current docs/README for the latest stable version and any
breaking API changes since this document was written — pin real current versions, don't assume old ones.

## System diagram

```
┌────────────────────────┐        ┌──────────────────────────┐
│   Telegram client      │        │   Telegram Bot API        │
│  (Mini App WebView)    │◄──────►│  (sendMessage, webhook)   │
└───────────┬─────────────┘        └─────────────┬────────────┘
            │ HTTPS (initData)                    │ HTTPS webhook
            ▼                                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js app on Vercel                     │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────┐ │
│  │ Customer UI    │  │ Admin UI      │  │ /api/telegram/     │ │
│  │ (App Router)   │  │ (App Router)  │  │  webhook (grammY)  │ │
│  └───────┬───────┘  └───────┬───────┘  └──────────┬──────────┘ │
│          │                  │                     │            │
│  ┌───────▼──────────────────▼─────────────────────▼─────────┐ │
│  │        /api/* route handlers + server actions            │ │
│  │   auth/telegram · orders · admin/*  (Zod-validated)       │ │
│  └───────────────────────────┬────────────────────────────────┘ │
└──────────────────────────────┼──────────────────────────────────┘
                                ▼
                    ┌───────────────────────┐
                    │       Supabase          │
                    │  Postgres + RLS         │
                    │  Realtime · Storage     │
                    └───────────────────────┘
```

## Key architecture decisions (ADRs)

### ADR-001: Next.js App Router monolith, not separate frontend/backend repos
One deploy target, one CI pipeline, shared types end-to-end. The bot webhook is just another route
handler. Revisit only if traffic or team size genuinely demands splitting services.

### ADR-002: Supabase over a hand-rolled Postgres + custom API
RLS gives per-row access control matching "customer sees own orders, staff sees by role" directly in the
database, Realtime removes the need for a separate pub/sub layer for the order tracker, and it matches
what the owner already chose. Trade-off: some Supabase-specific patterns (RLS, generated types) to learn;
accepted because it removes far more custom auth/API code than it adds.

### ADR-003: Telegram identity → verified session, not raw `initData` per request
`initData` is only trustworthy immediately after validation; re-validating on every request is wasteful
and re-parses a payload that can go stale. On first load, validate `initData` server-side (rule `03`),
upsert the `profiles` row, and issue a short-lived JWT the client holds in memory and sends as a bearer
token to route handlers, which verify it and (if Supabase's signing keys support it in the version being
used) set it as the Supabase session so RLS policies apply automatically; otherwise, route handlers use
the service-role client after verifying the JWT themselves and enforce access rules in code identically
to what the RLS policies describe. **Check current Supabase Auth docs for custom/third-party JWT support
before implementing** and record which path was taken here. Either way: no long-lived token, re-validate
`initData` and reissue when the in-memory token expires or the app is relaunched.

### ADR-004: Bot runs on webhooks, not long polling
Long polling needs an always-on process; Vercel functions are request-scoped. A single `/api/telegram/webhook`
route, secured with the Telegram secret-token header (rule 03), fits serverless directly and scales with the app.

### ADR-005: Order status is a server-enforced state machine, not a free-text field
Status lives as a Postgres enum with a single server-side transition function that checks the current
state, the requested next state against an allow-list, and the caller's role, then writes an
`order_events` row. This is what makes the Domino's-style tracker safe to trust and impossible to
corrupt from the client (rule 04).

### ADR-006: Realtime for the tracker, with a polling fallback
Supabase Realtime pushes status changes to the open tracking screen instantly. Because Telegram WebViews
on flaky mobile data can drop a socket silently, the tracker also polls every 15s as a fallback so the
customer's view never goes stale.

## Auth/session sequence

```
Mini App loads → telegram-apps SDK exposes initData
      │
      ▼
POST /api/auth/telegram { initData }
      │  server: verify HMAC signature + auth_date freshness (rule 03)
      │  server: upsert profiles row (telegram_id, name, language_code)
      ▼
Response: { token, profile }             (token = short-lived signed session)
      │
      ▼
Client holds token in memory (Zustand), attaches as Authorization: Bearer <token>
to every subsequent request. Re-authenticates silently on 401 or app relaunch.
```

## Environment strategy
- **Local dev**: `NEXT_PUBLIC_DEV_MOCK_TELEGRAM=true` + a dev Supabase project + a dev Telegram bot,
  webhook via tunnel.
- **Preview (Vercel PR deploys)**: same dev Supabase project (or a second one if data collisions become a
  problem), dev bot pointed at the current preview URL for manual testing.
- **Production**: production Supabase project, production bot, production domain. Never share credentials
  between dev and prod.

## What to verify before building (things that change over time)
- Current Next.js App Router recommended project setup and caching defaults.
- Current Supabase JS client + Auth guidance for third-party/custom JWTs (drives ADR-003's exact shape).
- Current Telegram Bot API rate limits and the exact `initData` validation algorithm (Telegram's own docs
  are canonical over any summary, including this one).
- Current `@telegram-apps/sdk-react` API surface (it has moved fast; don't assume method names from memory).

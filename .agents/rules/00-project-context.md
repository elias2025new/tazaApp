# Project context (always on)

**Product:** Taza Greens Delivery — a Telegram Mini App where customers browse the Taza Greens menu,
order for delivery (pickup optional), and track the order live. Staff run the kitchen and deliveries
from a role-gated dashboard in the same app. One restaurant, one bot, one codebase.

**Client:** Taza Greens, Ethiopian breakfast and brunch café, Bole Rwanda, Addis Ababa. Tagline on their
site: "Fresh Starts Here". Currency ETB (Birr). Users are mostly on mid-range Android phones and
variable mobile data. Design and code for that reality.

**Owner (the person you talk to):** a freelance developer/designer who does not write code in this
project. He makes product decisions, creates the Telegram bot in BotFather, and supplies credentials.
You write and ship the code. Explain decisions briefly, in plain language.

## Users and roles
- `customer` — default for any Telegram user who opens the app
- `kitchen` — sees incoming orders, marks preparing/ready
- `rider` — sees ready orders, marks out for delivery/delivered
- `manager` — everything kitchen + rider + menu + settings
- `owner` — everything + staff role management

## Order lifecycle (state machine, enforced server-side)
`pending → accepted → preparing → ready → out_for_delivery → delivered`
Side exits: `pending → rejected`, any pre-delivery state → `cancelled`. Every transition writes an
`order_events` row and triggers a bot message to the customer.

## Folder map (create exactly this in /setup-project)
```
src/app/(customer)/        menu, item/[id], cart, checkout, orders, orders/[id], profile
src/app/admin/             orders, kitchen, rider, menu, settings, staff
src/app/api/               auth/telegram, orders, admin/*, telegram/webhook
src/components/ui/         shadcn primitives themed by brand tokens
src/components/            shared components
src/features/<domain>/     menu, cart, checkout, orders, admin (components, hooks, queries, schemas, actions)
src/lib/                   supabase/, telegram/, auth/, i18n/, money.ts, env.ts, errors.ts
src/styles/tokens.css      generated from docs/DESIGN.md
supabase/                  migrations/, seed/, config.toml
public/brand/              logo and optimized brand assets
tests/                     unit/, e2e/
scripts/                   telegram-setup.ts, seed.ts
docs/  brand/  prompts/
```

## Conventions
- pnpm. Node LTS. Latest stable dependency versions; verify APIs against current docs when unsure.
- Money is an integer in santim (1 ETB = 100 santim). Format only at the UI edge via `lib/money.ts`.
- Dates stored UTC; displayed in `Africa/Addis_Ababa`.
- Phone numbers stored E.164 (`+251...`).
- All user-facing strings go through i18n (`en`, `am`). No hardcoded UI text in components.
- Feature code lives in `src/features/<domain>`; route files stay thin.

## Where to look
Spec: `docs/PRD.md`. Architecture: `docs/ARCHITECTURE.md`. Data: `docs/DATABASE.md`.
UI: `docs/DESIGN.md`. Plan: `docs/ROADMAP.md`. If a file contradicts these rules, stop and ask.

# Supabase and security rules (always on)

## Database
- Schema changes **only** through migrations in `supabase/migrations/` (Supabase CLI). Never edit schema in the dashboard.
- Every table has RLS enabled in the same migration that creates it. Default is deny; add the narrowest policy that works.
- Policy intent per table is in `docs/DATABASE.md`. Any deviation needs owner approval.
- Money: integer santim columns (`*_cents` naming is avoided; use `*_santim`). Never floats.
- Every table: `id uuid primary key default gen_random_uuid()`, `created_at timestamptz default now()`,
  `updated_at` maintained by trigger where rows are mutable.
- Add indexes for every foreign key and every column used in a filter or sort on a hot path.
- Generate TypeScript types after each migration: `supabase gen types typescript`. Commit them.
- Seed data lives in `supabase/seed/`. It must be idempotent and safe to re-run.

## Keys and clients
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is public by design and is only safe because RLS is on.
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS: server only, inside `lib/supabase/admin.ts` (`server-only`). Never in a client bundle,
  never in a `NEXT_PUBLIC_*` variable, never in logs.
- Three client factories, nothing else: `browser` (anon + user JWT), `server` (per-request, user JWT), `admin` (service role, used sparingly and audited).

## Session (see ADR-003 in docs/ARCHITECTURE.md)
- Telegram identity → verified server-side → short-lived Supabase-compatible JWT (`sub` = profile id, role `authenticated`, custom claim `app_role`).
- Keep the token in memory only. When it expires, silently re-authenticate from a fresh `initData`. No persistent tokens, no cookies.
- Before implementing, check current Supabase docs on JWT signing keys. If custom-signed JWTs are not supported for this project,
  use the documented fallback: all reads/writes go through server route handlers with the service role after verifying the session,
  and live updates use server-triggered Realtime Broadcast. Tell the owner which path you took.

## Order integrity
- Orders are created by a Postgres function (`create_order`) or a single server transaction. The server loads current prices and option
  prices from the DB, computes subtotal, delivery fee, and total, and **ignores any client-sent price**.
- Creation requires an idempotency key (client-generated uuid, unique index) so double taps and retries never create two orders.
- Reject orders when the restaurant is closed, an item is unavailable, or the subtotal is below the minimum. Return specific error codes.
- Status transitions run through one server function that checks: current state, allowed next state, caller's role. It writes `order_events`.
- Customers can read only their own orders/addresses. Staff read by role. Nobody but service role deletes orders (soft-cancel instead).

## PII
- Store the minimum: name (from Telegram), phone, delivery address/pin. Customers see only their data; staff see order-relevant data.
- Never log phone numbers or addresses. Redact in error reports.
- Provide a "delete my data" path in the Profile screen (Phase 6): anonymizes the profile, keeps order totals for accounting.

## Input and abuse
- Validate all inputs with Zod. Enforce max lengths (notes ≤ 300 chars, names ≤ 80).
- Rate-limit order creation and auth endpoints (per profile and per IP). Start with a Postgres-backed counter; Upstash is acceptable if the owner approves.
- Sanitize anything rendered into bot messages (Telegram HTML mode: escape `<`, `>`, `&`).
- Security headers via `next.config`: CSP that allows only Telegram's script origin, Supabase, tile provider, and own assets; `frame-ancestors` must permit Telegram web clients.

## Storage
- Bucket `menu-images`: public read, write only for `manager`/`owner`. Enforce file type (jpeg/png/webp) and ≤ 2 MB. Resize on upload or via `next/image`.

## Before every phase is closed
Run the RLS audit in `/review`: for each table, prove with a test that an anonymous user, a different customer, and a wrong-role staff member are denied.

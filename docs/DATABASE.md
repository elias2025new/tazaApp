# Database

Single-tenant by design: there is no `restaurants` table. One `restaurant_settings` row holds the
café's own configuration. Every table below is created with RLS **enabled in the same migration** that
creates it (rule 04). This doc states policy *intent*; the migration is the source of truth for exact SQL.

## Entity overview

```
profiles ──┬──< addresses
           ├──< orders ──< order_items ──> menu_item_options (snapshot, not FK-live)
           │       └──< order_events
           └──< staff_roles

menu_categories ──< menu_items ──< menu_item_options
restaurant_settings (single row)
```

## Tables

### profiles
One row per Telegram user who has opened the app.
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| telegram_id | bigint unique not null | from validated initData |
| first_name, last_name | text | from Telegram |
| username | text nullable | |
| phone | text nullable | E.164, collected via requestContact or manual entry |
| language_code | text default 'en' | 'en' \| 'am' |
| bot_blocked | boolean default false | set true on 403 from sendMessage |
| created_at, updated_at | timestamptz | |

**RLS intent:** a user can select/update only the row where `telegram_id` matches their verified session.
No insert from the client (the auth route handler, using the admin client, creates it after validating
initData).

### staff_roles
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| profile_id | uuid fk → profiles | |
| role | enum('kitchen','rider','manager','owner') | |
| created_at | timestamptz | |

**RLS intent:** only `owner` can insert/update/delete. Any authenticated staff member can select their
own row (to know their own role client-side); admin screens read the full list through a server route
that checks the caller is staff, rather than a broad client-side select policy.

### addresses
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| profile_id | uuid fk | |
| label | text | "Home", "Office" |
| lat, lng | double precision nullable | map pin |
| landmark | text not null | required — Addis addresses are landmark-based |
| notes | text nullable | gate code, floor, etc. |
| is_default | boolean default false | |

**RLS intent:** owner-of-row only (select/insert/update/delete where `profile_id` = caller's profile).

### menu_categories
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| name_en, name_am | text | |
| sort_order | int | |
| is_active | boolean default true | |

**RLS intent:** public select where `is_active`. Insert/update/delete: `manager`/`owner` only.

### menu_items
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| category_id | uuid fk | |
| name_en, name_am | text | |
| description_en, description_am | text nullable | |
| base_price_santim | integer not null | integer Birr santim, never float |
| image_path | text nullable | Supabase Storage path in `menu-images` |
| dietary_tags | text[] | e.g. `{vegan,fasting}` |
| is_available | boolean default true | sold-out toggle |
| sort_order | int | |

**RLS intent:** public select where `is_available` (unavailable items still fetched for display-as-disabled
via a server route, not the public policy, to avoid leaking upcoming/hidden items). Write: `manager`/`owner`.

### menu_item_options
Size/add-on choices with price deltas (e.g. "Large +30 ETB", "Extra egg +25 ETB").
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| menu_item_id | uuid fk | |
| group_name_en/am | text | e.g. "Size", "Add-ons" |
| name_en, name_am | text | |
| price_delta_santim | integer default 0 | |
| is_required | boolean | required within its group (e.g. size) |
| max_select | int nullable | null = single-select within group |

**RLS intent:** same as menu_items.

### orders
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| profile_id | uuid fk | |
| status | enum('pending','accepted','preparing','ready','out_for_delivery','delivered','rejected','cancelled') | |
| fulfillment_type | enum('delivery','pickup') | |
| address_id | uuid fk nullable | required if delivery |
| subtotal_santim, delivery_fee_santim, total_santim | integer | computed server-side at creation, never trusted from client |
| currency | text default 'ETB' | |
| customer_note | text nullable | ≤300 chars |
| rejection_reason | text nullable | |
| idempotency_key | uuid unique not null | prevents duplicate submits |
| placed_at, updated_at | timestamptz | |

**RLS intent:** select where `profile_id` = caller's profile, OR caller has any `staff_roles` row.
Insert: none directly from client — only via the `create_order` function/route running as the caller but
validating everything server-side. Update: only via the status-transition function, never a raw client update.

### order_items
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| order_id | uuid fk | |
| menu_item_id | uuid fk | |
| name_snapshot | text | menu item name at order time (menu can change later) |
| unit_price_santim | integer | price at order time |
| quantity | int | |
| options_snapshot | jsonb | chosen options + their price deltas, frozen at order time |
| line_total_santim | integer | |

**RLS intent:** readable wherever the parent order is readable; no direct client writes (created inside
the same transaction/function as the order).

### order_events
Append-only audit trail for the tracker and for support/debugging.
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| order_id | uuid fk | |
| from_status, to_status | enum nullable/not null | |
| actor_profile_id | uuid fk nullable | staff member, or null for system/customer-initiated |
| note | text nullable | e.g. rejection reason |
| created_at | timestamptz | |

**RLS intent:** same visibility as the parent order; insert only via the transition function.

### restaurant_settings
Single row (`id` fixed or enforced via a check/trigger to stay one row).
| column | type | notes |
|---|---|---|
| is_open | boolean | manual override switch |
| opening_hours | jsonb | per-weekday open/close, for the "closed" state even when `is_open` is true |
| delivery_fee_santim | integer | flat fee per PRD's default |
| minimum_order_santim | integer default 0 | |
| pickup_enabled | boolean default true | |
| estimated_prep_minutes | int | shown on the tracker |

**RLS intent:** public select (checkout needs it pre-auth-decision too). Write: `manager`/`owner`.

## Functions (SQL, `security definer` where they must cross RLS deliberately)

- `create_order(cart jsonb, fulfillment_type, address_id, idempotency_key, note) returns orders` —
  recomputes every price from current `menu_items`/`menu_item_options`, checks `restaurant_settings`
  (open, minimum order), inserts `orders` + `order_items` + the initial `order_events` row in one
  transaction. Rejects with a specific error code on: closed, item unavailable, below minimum, duplicate
  idempotency key (returns the existing order instead of erroring, so retries are safe).
- `transition_order_status(order_id, next_status, note) returns orders` — checks the caller's role against
  an explicit `allowed_transitions` map (rule 04/ADR-005), updates `orders.status`, inserts `order_events`,
  and is the single place that triggers the outbound Telegram notification (via a Postgres trigger calling
  a webhook, or immediately after in the route handler — decide based on current Supabase capabilities and
  document the choice here once made).

## Indexes (minimum)
`orders(profile_id)`, `orders(status)`, `orders(placed_at)`, `order_items(order_id)`,
`order_events(order_id)`, `menu_items(category_id)`, `staff_roles(profile_id)`, `addresses(profile_id)`.

## Money handling
All monetary columns are integers in santim (1 ETB = 100 santim). `lib/money.ts` is the only place that
formats to Birr for display or parses a Birr input back to santim. No table or API response ever carries
a float for money.

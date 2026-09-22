# Product Requirements — Taza Greens Delivery

## What this is
A single-brand Telegram Mini App for Taza Greens (Ethiopian breakfast/brunch café, Bole Rwanda, Addis
Ababa). Think **Domino's Pizza's app**, not Uber Eats: one restaurant, one menu, one clean ordering flow,
and a live, step-by-step order tracker the customer can watch after they order. There is no restaurant
list, no marketplace, no other vendor ever appears in this app. It opens inside Telegram from the bot's
menu button or a shared link, and works for a customer anywhere in Addis (or beyond) who wants Taza
Greens delivered.

A second surface, gated to staff, is the operational dashboard the restaurant runs the kitchen and
deliveries from. Same codebase, same Mini App, different screens by role.

This is a real, running product delivered to a paying client — built to showcase professional software
craft, not a prototype.

## Goals
- A customer can browse the real menu, build an order, check out, and watch it move through prep and
  delivery without leaving Telegram.
- Staff can see every incoming order the moment it lands, update its status, and never lose one.
- The app looks and feels like Taza Greens — warm, fresh, local — not like a generic delivery template.
- The system is trustworthy: correct prices, no lost orders, no double charges, clear status at every step.

## Non-goals (v1)
- No multi-restaurant support, ever — the schema and UI assume exactly one restaurant.
- No online payment gateway at launch — cash/transfer on delivery, confirmed by staff. Card/mobile-money
  payment is a tracked Phase 7 addition, not a blocker.
- No customer-to-customer features, reviews, or loyalty points in v1.
- No native iOS/Android app — Telegram Mini App only.

## Primary users
1. **Customer** — a Telegram user, usually on a mid-range Android phone. Wants to order fast, know the
   price up front, and know what's happening with their food.
2. **Kitchen staff** — needs a dead-simple queue: what to make now, in what order, mark it ready.
3. **Rider** — needs to know what's ready to go, where it's going (map pin + landmark), and confirm delivery.
4. **Manager/Owner** — needs menu control, visibility into the day, and staff management.

## Core user flows

### Customer: order and track (the Domino's-style flow)
1. Opens the Mini App from the bot → sees the Taza Greens menu (categories, photos, prices in Birr).
2. Taps an item → sees details/options (size, add-ons, notes) → adds to cart. Haptic feedback confirms.
3. Reviews cart → sets delivery address (map pin + required landmark text, or "pickup" if the owner
   enables it) → sees subtotal, delivery fee, and total computed by the server → places order.
4. Lands on an **order tracking screen that behaves like Domino's Pizza Tracker**: a horizontal/vertical
   stepper — *Order received → Preparing → Ready → Out for delivery → Delivered* — that updates live
   (Realtime) with a timestamp per step and an estimated time. The customer also gets a Telegram message
   at each step with a "Track order" button (deep link back into this screen via `startapp=order_<id>`).
5. Can view past orders and reorder in two taps.

### Staff: run the floor
1. **Kitchen board**: incoming orders as cards (item list, notes, time since placed), oldest first. One
   tap: Accept → Preparing → Ready. Rejecting requires a reason, shown to the customer.
2. **Rider view**: orders marked Ready, with address/pin/landmark and customer phone (tap to call via
   Telegram). One tap: Out for delivery → Delivered.
3. **Orders overview**: all of today's orders, filterable by status, for the manager.
4. **Menu management**: add/edit items, categories, prices, photos, mark items sold out (instantly hides
   from customers).
5. **Settings**: opening hours (open/closed toggle affects checkout immediately), delivery fee/zones,
   minimum order.
6. **Staff management** (owner only): invite staff by Telegram ID, assign role, revoke access.

## Functional requirements

### Menu
- Categories → items. Item: name, description, photo, base price, options (size/add-ons with price
  deltas), dietary tags (vegan/fasting — relevant for Ethiopian menus), available/sold-out toggle.
- Sold-out items are visibly disabled, not hidden (so customers still see what the café offers).

### Cart & checkout
- Cart persists across a session (survives closing and reopening the Mini App).
- Server is the source of truth for every price; the client only estimates until checkout confirms.
- Minimum order and delivery-closed states are enforced at checkout, with a clear explanation, not a
  silent failure.
- Order placement is idempotent (no duplicate orders from double-tapping or a flaky connection).

### Order tracking
- Status stepper as described above. Each step shows who/when where relevant ("Preparing since 12:41").
- If an order is rejected or cancelled, the screen explains why and offers "Order again" / "Contact us".

### Notifications (bot)
- Customer: order confirmed, accepted, preparing, ready (pickup) / out for delivery, delivered, rejected/cancelled.
- Staff: new order arrives, with Accept/Reject inline buttons right in the chat.

### Roles & access
- Role gating exactly as defined in rule `00-project-context.md`. A customer can never see `/admin`.

### Localization
- English and Amharic. Customer picks or it defaults from Telegram's `language_code`.

## Success criteria for v1 launch
- A real customer can complete a real order end-to-end on a phone, in Telegram, without confusion.
- Staff can run a full service period from the dashboard alone, no other tool needed.
- Zero known way to place an order with a wrong price or lose an order between "placed" and "delivered".
- Passes the full `/review` checklist (rule `01`) on every shipped phase.

## Open questions for the owner (bring these up per rule 05, with defaults; don't block on all of them)
- Delivery fee: flat citywide, or zone-based? *Default: flat fee, revisit if delivery volume grows.*
- Minimum order amount? *Default: none at launch.*
- Pickup option at launch, or delivery-only? *Default: both, pickup is simpler to build first.*
- Who delivers — Taza Greens' own riders, or a delivery partner? *Affects whether "rider" is even a
  staff role in v1 or just a status the manager toggles manually.*
- Payment at launch: cash on delivery only, or also bank transfer with a screenshot/reference field?

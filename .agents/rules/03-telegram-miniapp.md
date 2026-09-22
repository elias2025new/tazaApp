# Telegram Mini App rules (always on)

## Trust model
- `initData` from the client is **untrusted until validated server-side**. Validate with HMAC-SHA256
  (secret key = HMAC_SHA256("WebAppData", bot_token)) per the official Telegram docs, compare in constant
  time, and reject if `auth_date` is older than 24 h at login. Put this in `lib/telegram/validate-init-data.ts`
  with unit tests (valid, tampered, expired, missing hash).
- Never trust `initDataUnsafe` for anything that matters. Never trust a user id sent in a request body.
- Identity for all API calls comes from the verified session (see ADR-003), never from client payloads.

## Client behavior
- Use the official Telegram Mini Apps SDK for React. Wrap it in `lib/telegram/` so the rest of the app
  never touches `window.Telegram` directly and works outside Telegram (dev mock, plain browser).
- On launch: `ready()`, `expand()`, apply theme params, read `language_code` for the default locale.
- Enable closing confirmation while the cart is non-empty or checkout is in progress.
- Phone number: use `requestContact` (user consent), then store server-side. Allow manual entry as fallback.
- Location: offer Telegram location access if available; always allow a map pin plus a free-text landmark
  ("near Rwanda Bridge, blue gate"). Addis addresses are landmark-based; the landmark field is required.
- Deep links: support `startapp` params, e.g. `order_<uuid>` opens that order's tracking screen.
- Cart draft persists locally (localStorage, with Telegram CloudStorage as optional sync). Handle it being cleared.
- Local dev outside Telegram: `NEXT_PUBLIC_DEV_MOCK_TELEGRAM=true` injects signed-looking mock data
  **only in development**. Production builds must refuse to enable it (assert in `lib/env.ts`).

## Bot (grammY, webhook only — no long polling)
- Single route: `/api/telegram/webhook`. Verify the `X-Telegram-Bot-Api-Secret-Token` header equals
  `TELEGRAM_WEBHOOK_SECRET`; return 401 otherwise. Respond fast (< 2 s); do slow work after responding or in a queue-like server action.
- Commands: `/start` (welcome + "Order now" web_app button), `/orders` (last orders with status), `/help`.
  Staff also get `/admin`. Register with `setMyCommands`. Set the menu button with `setChatMenuButton` to open the Mini App.
- Customer messages on every status change (localized): accepted, preparing, ready, out for delivery, delivered, rejected/cancelled,
  each with a "Track order" web_app button linking to `startapp=order_<id>`.
- Staff: new-order alert to `TELEGRAM_STAFF_CHAT_ID` with inline buttons (Accept / Reject). Callback
  queries re-check the caller's staff role in the DB before mutating anything, then edit the message to show the new state.
- Handle `403 Forbidden: bot was blocked by the user` gracefully (mark the profile `bot_blocked`, do not retry).
- Respect Telegram rate limits (≈30 messages/second overall, 1/second per chat). Retry on 429 using `retry_after`.
- `allowed_updates`: `message`, `callback_query`, `my_chat_member` only.

## Hosting requirements
- Mini Apps require public HTTPS. For local dev use a tunnel (cloudflared or ngrok) and set the bot's web app URL to the tunnel.
- Vercel Preview deployments are used for testing with a **separate dev bot**. Production uses the production bot and domain.
  Ask the owner for a second bot token when it is time (see `/telegram-setup`).

## Security checklist for anything touching Telegram
- [ ] Token only from `process.env` on the server; never logged, never in error messages.
- [ ] Webhook secret header verified.
- [ ] initData validated before any session is issued.
- [ ] Staff actions re-authorize on every call.

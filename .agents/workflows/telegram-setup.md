# /telegram-setup

1. Point the owner to `docs/TELEGRAM_SETUP.md` and ask him to complete the BotFather steps there, then
   paste back exactly: bot token, bot username, and (optional but recommended) a second dev-bot token.
2. Write `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME` into `.env.local`. Never print the token back.
3. Generate `TELEGRAM_WEBHOOK_SECRET` (32+ random bytes, base64url) and store it in `.env.local` too.
4. Ask for the staff alert destination: a personal chat id (from @userinfobot) or a group — explain the
   trade-off (group = everyone sees it and can react; personal = simpler, single point of failure).
   Store as `TELEGRAM_STAFF_CHAT_ID`.
5. Implement `/api/telegram/webhook` per rule `03-telegram-miniapp.md` before registering it.
6. Once a public HTTPS URL exists (tunnel in dev, Vercel domain in prod), register the webhook with
   `secret_token` set, then confirm via `getWebhookInfo` that Telegram accepted it — check for a
   `last_error_message` and resolve it before moving on.
7. Run `setMyCommands` and `setChatMenuButton` (web_app button pointing at `NEXT_PUBLIC_APP_URL`).
8. Set the bot's profile photo to `public/brand/logo-mark.png` once `/brand-extract` has produced it.
9. Smoke test: `/start` in a real Telegram chat returns the welcome message with a working "Order now" button.

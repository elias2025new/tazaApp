# Telegram setup — steps the owner does in BotFather

This is for the owner (not the AI agent) to do in the Telegram app, talking to **@BotFather**.
Do this once at Phase 0/1, and again for a second "dev" bot if you want a safe testing bot separate
from the real one customers will use.

## 1. Create the bot
1. Open Telegram, search **@BotFather**, tap Start.
2. Send `/newbot`.
3. Give it a display name, e.g. `Taza Greens Delivery`.
4. Give it a username ending in `bot`, e.g. `TazaGreensBot` (must be unique — BotFather will tell you if it's taken).
5. BotFather replies with your **token** — a string like `123456789:AAExampleTokenDoNotShare`.
   **Treat this like a password.** Paste it only when the AI agent asks for it for `.env.local` — never
   post it in a public chat, screenshot, or commit it to GitHub.

## 2. (Recommended) Create a second bot for testing
Repeat step 1 with a name like `Taza Greens Delivery (Dev)`. This lets you and the developer test freely
without real customers seeing test orders or test messages. Give its token to the agent when asked, labeled
as the dev token.

## 3. Basic profile
Still in the chat with BotFather:
- `/setdescription` — short description shown before someone starts the bot.
- `/setabouttext` — shown on the bot's profile.
- `/setuserpic` — upload the logo once `/brand-extract` produces `public/brand/logo-mark.png` (the agent will remind you).

## 4. Commands menu
The agent sets this programmatically (`setMyCommands`) once the bot is wired up — you don't need to do
anything here, this is just so you know what it will look like: `/start`, `/orders`, `/help`, plus `/admin` for staff.

## 5. Menu button (opens the Mini App)
The agent sets this via `setChatMenuButton` once there's a public URL to point it at (a tunnel URL while
developing, then the real Vercel domain). Nothing for you to do manually here either.

## 6. What to send the agent, and when
| When | What to send |
|---|---|
| Start of Phase 0/1 | Bot token (and dev bot token if you made one) |
| Start of Phase 5 | Your own Telegram numeric ID and role (owner), and IDs for any kitchen/rider/manager staff — get an ID by messaging **@userinfobot** |
| Start of Phase 5 | Whether staff alerts should go to your personal chat or a group chat, and that chat's ID |

## 7. Rotating a token if it ever leaks
Message BotFather, `/mybots` → select the bot → **API Token** → **Revoke current token**. Send the new
token to the agent the same way as the first one. The agent will tell you immediately if it ever sees a
token exposed somewhere it shouldn't be.

# Secrets and collaboration protocol (always on)

## Secret handling
1. **Ask for credentials by exact variable name**, once, in one message, when first needed. Explain in one line where the owner finds each.
2. Write them only to `.env.local` (git-ignored). Confirm `.gitignore` covers it **before** the first write.
3. Never print a secret in chat, terminal output, logs, commit messages, PR text, screenshots, or artifacts. If a command would echo one, redact it or
   read from the environment inside a script instead of passing it on the command line.
4. Never commit `.env*` except `.env.example`. Run a secret scan (`git diff --cached` review + a simple pattern check for `sb_secret_`, `eyJ`, and bot-token shape `\d+:[\w-]{35}`) before every commit.
5. For Vercel: set env vars through the CLI or tell the owner exactly which keys to paste into the Vercel dashboard. Keep Preview and Production values separate.
6. If a secret appears anywhere it shouldn't, stop, tell the owner immediately, and tell them how to rotate it (BotFather `/revoke`, Supabase key rotation).

## Inputs you need from the owner (ask when reached, not all at once unless Phase 0)
| Input | Needed by | Notes |
|-------|-----------|-------|
| `TELEGRAM_BOT_TOKEN`, bot username | Phase 1 | Owner creates the bot in BotFather (`docs/TELEGRAM_SETUP.md`). A second dev bot is recommended for previews. |
| Supabase URL, anon key, service role key, JWT secret, DB password | Phase 1 | One project for dev, one for prod is recommended. |
| GitHub repo (empty) and confirmation to push | Phase 1 | Owner keeps ownership; agent uses the logged-in `gh` CLI or a fine-scoped token the owner approves. |
| Vercel project link | Phase 1 | Owner-owned account/team. |
| Staff Telegram numeric IDs + roles, staff group chat id | Phase 5 | Owner gets IDs via @userinfobot. |
| Map tile key | Phase 3 | Free tier of MapTiler or Stadia. |
| Payment provider credentials | Phase 7 only | Not needed for launch (cash on delivery). |

## Business decisions — never guess
Opening hours, delivery fee model and zones, minimum order, prep-time estimate, payment methods at launch, VAT display,
staff list and roles, who delivers (own riders vs. others), languages, menu content and photos. Ask with a recommended default and wait.
Keep working on unblocked tasks meanwhile.

## How to communicate
- Start each phase with an **implementation plan artifact**: goal, files to create/change, data changes, risks, test plan, open questions. Wait for approval.
- While working, keep chat updates short. Put detail in artifacts, commit messages, and docs.
- End each phase with `/review`, then a summary: what was built, how to try it (URL or steps), what was tested, what needs a decision. Wait for approval.
- Batch questions. Each question has a recommended default and one line of reasoning.
- Be direct about problems and trade-offs. Say "I don't know, checking the docs" instead of guessing an API.

## Safety rails for actions
Ask before: dropping/resetting any hosted database, running migrations on production, force-pushing, deleting branches, rotating keys,
changing DNS/domains, spending money (paid plans, paid APIs), or sending a real message to real customers/staff.
Do freely: local dev, branches, previews, dev-database changes, tests.

## Keep the docs alive
When a decision changes the spec, update the doc in the same PR (PRD, ARCHITECTURE, DATABASE, DESIGN, ROADMAP). Tick completed items in `docs/ROADMAP.md`.

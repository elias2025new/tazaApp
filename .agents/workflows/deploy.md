# /deploy

1. Confirm `/review` passed on the branch being deployed.
2. Confirm required env vars are set in Vercel for the target environment (list them from `.env.example`;
   don't ask the owner to paste secrets into chat — tell him which dashboard fields to fill, or set them
   yourself via `vercel env add` if the CLI is authenticated to his account).
3. Preview deploy first (`vercel` or automatic PR preview). Point the **dev** Telegram bot's web app URL
   at the preview URL and smoke test the full order flow there.
4. Only after the owner approves the preview: merge to `main`, let Vercel Production deploy run,
   point the **production** bot's web app URL at the production domain, re-run the webhook registration
   against production (`/telegram-setup` step 6) with the production secret.
5. Tag the release (`git tag vX.Y.Z`) and note it in `docs/ROADMAP.md`.
6. Never delete or overwrite a production Supabase project or repoint production DNS without the owner
   explicitly confirming in that message.

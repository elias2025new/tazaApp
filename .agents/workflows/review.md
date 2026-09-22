# /review

Run before ending any phase.

1. `pnpm typecheck && pnpm lint && pnpm test && pnpm build` — all green.
2. Manual pass at 390×844 (and once at desktop width) for every screen touched this phase: light and dark.
3. Screenshot each changed screen; compare against `docs/DESIGN.md`'s intent. Note and fix any drift.
4. RLS audit for any table touched: confirm anonymous / wrong-customer / wrong-role denial (rule 04).
5. Secret scan: `git diff` contains no token/key-shaped strings; `.env.local` still git-ignored.
6. Confirm both locales render without missing-key fallbacks.
7. Update `docs/ROADMAP.md` checkboxes and any doc a decision this phase changed.
8. Write the phase summary: what shipped, how to try it, what's tested, what needs an owner decision —
   then stop and wait for approval before starting the next phase.

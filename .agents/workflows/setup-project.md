# /setup-project

Run once, at the very start.

1. Confirm `AGENTS.md` and all `docs/*.md` have been read.
2. `pnpm create next-app@latest .` — TypeScript, Tailwind, App Router, `src/` dir, ESLint, no Turbopack
   surprises (verify current recommended flags against Next.js's own docs first, since defaults change).
3. Install: `zustand @tanstack/react-query zod react-hook-form @hookform/resolvers`
   `@supabase/supabase-js grammy @telegram-apps/sdk-react next-intl date-fns clsx tailwind-merge lucide-react`
   Dev: `vitest @vitejs/plugin-react @testing-library/react @playwright/test`
   `supabase` CLI as a dev dependency or documented global install.
4. `npx shadcn@latest init`, then add the primitives the PRD's Phase 1–3 screens need (button, card, sheet,
   dialog, input, badge, tabs, skeleton, toast/sonner).
5. Scaffold the folder map from rule `00-project-context.md` exactly.
6. Create `lib/env.ts` (Zod-validated `process.env`, fails fast, splits public vs server-only).
7. `supabase init`; do not link to a remote project until credentials arrive (see rule 05's table).
8. Add `next-intl` with `en` and `am` message files, even if `am` is placeholder-marked initially.
9. Set up Vitest + Playwright configs and one smoke test each so CI has something to run from commit one.
10. Write the GitHub Actions workflow (`.github/workflows/ci.yml`): install → typecheck → lint → unit tests → build.
11. First commit: "chore: project scaffold". Push only after the owner confirms the GitHub repo and that
    it's OK to push (rule 05).
12. Report back: what was installed, what's still needed from the owner, and the next workflow to run
    (`/telegram-setup` and `/brand-extract`, which can run in parallel).

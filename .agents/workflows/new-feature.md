# /new-feature <name>

1. Find the feature in `docs/ROADMAP.md`. If it isn't there, stop and ask whether to add it (scope creep check).
2. Write a short plan artifact: user story, screens touched, data touched, API/server actions added,
   edge cases, test plan. Wait for owner approval before writing code.
3. Scaffold under `src/features/<name>/`: `components/`, `hooks/`, `schemas.ts`, `queries.ts` or `actions.ts`.
4. Schema first (Zod), then server logic, then UI. Reuse existing tokens/components from `docs/DESIGN.md`
   and `src/components/ui`; don't invent new visual patterns without a reason.
5. Cover loading/empty/error/offline states and both locales.
6. Add unit tests for logic, an e2e happy-path test if it's a full user flow.
7. Self-review against `01-engineering-standards.md`'s Definition of Done before reporting back.

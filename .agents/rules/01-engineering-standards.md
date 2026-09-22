# Engineering standards (always on)

## TypeScript and structure
- `strict: true`, `noUncheckedIndexedAccess: true`. No `any`, no `@ts-ignore` (use `@ts-expect-error` with a reason).
- Validate every boundary with Zod: API inputs, env vars (`lib/env.ts`, fail fast at boot), Telegram payloads, DB rows you don't control.
- Share Zod schemas between client forms and server handlers. One schema, one source of truth.
- Server-only code starts with `import 'server-only'`. Never import server modules into client components.
- Prefer Server Components and Route Handlers for data. Client components only for interactivity.
- Small files, single responsibility. Extract when a file passes ~250 lines or does two jobs.
- No dead code, no commented-out blocks, no `console.log` in committed code (use `lib/logger.ts`).
- No TODO without an issue reference or an entry in `docs/ROADMAP.md`.

## Errors
- Typed error results at boundaries: `{ ok: true, data } | { ok: false, error: { code, message } }`.
- Never leak stack traces or DB errors to the client. Log server-side with a request id.
- Every screen has loading (skeleton), empty, and error states. Error copy says what happened and what to do next.

## Data fetching
- TanStack Query for client server-state. Query keys in one `queryKeys.ts` per feature.
- Optimistic updates only for reversible, low-risk actions (cart edits). Orders are confirmed by the server.
- Realtime subscriptions are cleaned up on unmount. Always pair with a polling fallback.

## Testing
- Vitest for unit tests: money, pricing, state machine, initData validation, Zod schemas. These are mandatory.
- Playwright for e2e at 390×844 mobile viewport: browse → add to cart → checkout → order tracking; staff accepts order.
- A phase is not done until its acceptance criteria in `docs/ROADMAP.md` have a passing test or a recorded manual check.

## Performance budgets (mobile, mid-range Android, 3G-ish)
- Initial customer route JS ≤ 170 kB gzipped. Check with `next build` output.
- LCP ≤ 2.5 s on the menu screen. Images via `next/image` with explicit sizes, WebP/AVIF, blur placeholders.
- No layout shift on the menu grid (reserve image aspect ratio).
- Add a dependency only if it earns its weight. State the reason in the PR description.

## Accessibility
- WCAG AA contrast, 44×44 px minimum touch targets, visible focus rings, semantic HTML, labels on all inputs.
- Respect `prefers-reduced-motion`. Never rely on color alone to convey order status.

## Git and CI
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`). One logical change per commit.
- Branches: `feat/<phase>-<topic>`. Open a PR per phase or feature; `main` is always deployable.
- GitHub Actions on every PR: install (frozen lockfile), typecheck, lint, unit tests, build.
- Never force-push `main`. Never rewrite published history without asking.

## Definition of done (every task)
1. Typecheck, lint, unit tests, and build pass.
2. Behavior verified in the browser at 390×844 and screenshots compared against `docs/DESIGN.md`.
3. States covered: loading, empty, error, offline/slow.
4. Strings in both `en` and `am` (Amharic may use a clearly marked draft until reviewed by a native speaker).
5. No secrets, no unrelated changes, docs updated if behavior or config changed.

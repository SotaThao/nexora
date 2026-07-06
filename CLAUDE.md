# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Treat this as an engineering playbook, not a product brief.

## Operating Principles

- Start from the current code. Read nearby files, tests, and existing patterns before designing a change.
- Preserve observable behavior unless the task explicitly asks for a behavior change.
- Keep edits narrow. Avoid opportunistic refactors, dependency churn, or formatting-only rewrites outside the requested scope.
- Prefer boring, reversible architecture over clever abstractions.
- Make state ownership explicit. Do not create parallel sources of truth for the same domain data.
- Verify the path you changed with the smallest meaningful test first, then broaden when the blast radius is larger.
- No `console.*` in app code. Use the project logger where runtime logging is needed.
- Do not commit unless explicitly asked.

## Repo Profile

- Frontend: React 18 + Vite.
- Language: TypeScript/TSX (`strict: true` but `noImplicitAny` and `strictNullChecks` are off — typed-where-helpful, not enforced everywhere).
- Import alias: `@/*` → `src/*` (configured in `tsconfig.json`).
- Styling: Tailwind utility classes with custom design tokens (see `tailwind.config.js`). Run `pnpm lint:tokens` to validate token usage.
- Server-state cache: TanStack Query v5.
- Current persistence mode: API-backed (REST API at `VITE_API_BASE_URL`).
- HTTP client: `src/lib/httpClient.js` with JWT Bearer auth, 401 refresh interceptor.
- Bilingual: EN + VI. All user-visible strings go in `src/locales/en.json` and `src/locales/vi.json`. Use `useTranslation()` from `LanguageContext` in components; supports `{{variable}}` interpolation.

Useful commands:

```bash
pnpm install
pnpm dev                # local dev on port 3000
pnpm dev:staging        # dev server against staging env
pnpm build              # production build (alias for build:prod)
pnpm build:staging      # staging build
pnpm typecheck          # tsc --noEmit (no test runner, just types)
pnpm test               # vitest run (unit tests)
pnpm test:watch         # vitest watch mode
pnpm test:e2e           # browser e2e via scripts/run-e2e.cjs
pnpm lint:tokens        # verify design token usage
pnpm seed:staff-demo    # seed staff demo data locally
```

To run a single test file: `pnpm vitest run src/data/repositories/notifications.test.ts`

## API Integration Workflow (goal-driven, mandatory)

Every API feature integration starts from a user story — never integrate "vu vơ" without a goal.

1. **User story first.** Each story is one file in `user-story/` (`US-XXX-<slug>.md`, copy `user-story/_TEMPLATE.md`). If the user gives a raw requirement, draft the story (Story + AC + API Mapping + FE Surface) and get it approved before writing code. Status lifecycle: Draft → Approved → Integrated → Tested → Done.
2. **Contract from live Swagger.** Source of truth is `https://test-api.nexoratouch.com/api/` (spec: `/api/specification.json`). `API/update/<latest>/api-integration-guide-v4.md` is a snapshot — when in doubt, re-check the live spec. Never code against guessed field names; unresolved contract questions go in the story's "cần hỏi BE" section and block implementation.
3. **OpenSpec for large changes.** A feature touching ≥3 files or any shared layer (auth adapter, httpClient, shared repository/context) requires an OpenSpec change in `openspec/changes/` whose `design.md` maps US ↔ endpoints ↔ FE files. Small single-owner fixes may skip OpenSpec but still need a story.
4. **Integrate along the data boundary** (components → hooks → repositories → adapter). Normalization of API DTOs lives in the repository only.
5. **Verify against the story.** DoD in the story file is the gate: AC pass on dev API, network trace shows the mapped calls (method + status), mutations invalidate the right query keys, no console errors, 3-layer tests (feature-focused-tester). A feature that "looks working" in UI but fires no API call is a failure (see US-009 lesson).
6. **Close the loop.** Update the story status + TC links, and record bugs/deviations in the story's execution notes.

## Principal Workflow

For every task:

1. Identify the owning surface: UI component, hook, repository, adapter, auth, test, or docs.
2. Inspect the owner and its nearest callers/tests.
3. Decide whether the change is behavior, structure, or documentation.
4. Patch only the owner and required integration points.
5. Run verification proportional to risk.
6. Report changed files, verification, and any residual risk.

Verification guide:

- Docs-only change: run `npx openspec validate <change> --strict` when an OpenSpec change is involved.
- Narrow logic change: run the targeted test file plus `pnpm build`.
- Shared hook/repository/auth change: run targeted tests, `pnpm build`, and `pnpm test`.
- User-flow change: add or run browser/e2e smoke for the affected flow.

## Provider Stack

`main.tsx` mounts providers in this order (inner providers depend on outer ones):

```
QueryClientProvider → LanguageProvider → AuthProvider → NotificationProvider
  → BrowserRouter → SkeletonProvider → App (KybGateProvider wraps AppRouter)
```

Key rules:
- `AuthProvider` requires `QueryClientProvider` above it (auth state is TanStack Query-backed).
- `LanguageProvider` must wrap everything that uses `useTranslation()`.
- `KybGateContext` sits inside `App`, so it has access to auth and routing.

## Architecture Rules

### Data Boundary

Domain data must flow through this path:

`components -> data hooks -> repositories -> adapter`

Responsibilities:

- Components render UI and call hooks. They should not parse storage or know transport details.
- Data hooks own TanStack Query integration: query keys, loading/error state, mutations, invalidation.
- Repositories own domain operations and object-shape normalization. They should not contain React code.
- Adapters own transport details: API calls via httpClient.

Do not add new direct domain reads/writes from components, contexts, or feature hooks using `storage.*`, `localStorage.*`, or manual `JSON.parse` for persisted domain keys.

### Query Ownership

- TanStack Query owns cached domain data.
- Query keys come from `src/data/queryKeys.js`.
- Mutations must invalidate or update the relevant query cache.
- Cross-tab freshness will use query refetch / websocket in the API phase.

### Auth Boundary

- UI reads auth through `src/auth/useAuth.js`.
- Session lifecycle belongs in `src/auth/AuthProvider.jsx`.
- Adapter-specific behavior belongs in `src/auth/adapters/`.
- Components should not import mock auth/session helpers directly.

### API Configuration

The app uses a single API backend:

```env
VITE_API_BASE_URL=https://nexora-dev-api.vlinkhub.com
```

- All domain data flows through REST API endpoints.
- Auth uses JWT Bearer tokens stored in `tokenStore` (localStorage).
- The `httpClient` handles automatic token refresh on 401.
- Repositories call `httpClient` directly for API operations.
- Repositories without implemented API endpoints return empty data with `TODO` markers.

## Domain Workflow Notes

This repo has merchant, staff, customer, registration, notification, review, transaction, profile, and auth flows. Treat them as domain workflows with persisted object shapes, not isolated screens.

When changing one of these flows:

- Preserve stored object shapes and identifier formats.
- Check both owner and staff/customer side effects when a registration or setup action changes data.
- Keep notification side effects intact when staff/account flows create requests.
- Confirm route/view transitions after login, demo seed, onboarding completion, and staff invite flows.
- For persistence-sensitive tests, remember test setup may seed Query cache from storage before render.

## File Map

| Area | Where to look |
|------|---------------|
| App shell/routing | `src/App.tsx`, `src/app/AppRouter.tsx` |
| Route components | `src/components/dashboard/routes/index.tsx` |
| Auth state | `src/auth/AuthProvider.tsx`, `src/auth/useAuth.ts` |
| Auth adapters | `src/auth/adapters/` |
| Token store | `src/auth/tokenStore.ts` |
| Shared contexts | `src/contexts/` (LanguageContext, NotificationContext, KybGateContext, StaffAccountContext) |
| Locales (i18n) | `src/locales/en.json`, `src/locales/vi.json` |
| Data hooks | `src/data/hooks/` |
| Repositories | `src/data/repositories/` |
| Query keys | `src/data/queryKeys.ts` |
| Query client | `src/lib/queryClient.ts` |
| HTTP client | `src/lib/httpClient.js` |
| Error codes | `src/data/errorCodes.ts` |
| Storage (token persistence) | `src/utils/storage.ts` |
| Logger | `src/utils/logger.ts` |
| Dashboard sidebar menu config | `src/components/dashboard/constants.tsx` |
| Shared UI primitives | `src/components/ui/` |
| Type definitions | `src/types/` |
| Tests (co-located) | `src/data/repositories/*.test.ts`, `src/components/**/*.test.tsx` |
| Test setup | `src/setupTests.ts`, `vitest.config.ts`, `vitest.e2e.config.ts` |
| OpenSpec work | `openspec/changes/` |
| User stories (integration goals) | `user-story/` (template: `_TEMPLATE.md`) |
| API contract snapshot | `API/update/<latest>/api-integration-guide-v4.md` (truth: live Swagger) |

## Code Standards

- Match the surrounding file style and naming.
- Prefer direct, readable code over generic helpers.
- Add comments only for non-obvious intent or constraints.
- Avoid new global state unless it is the actual owner of the concern.
- Do not hide async ordering changes inside callbacks without checking caller behavior.
- Use repository APIs for non-React contexts that cannot call hooks.
- Hooks must only be called at the top level of React components or custom hooks.

## Mobile-Responsive Modals & Dialogs

Any new modal, dialog, drawer, or wizard component must handle these two mobile failure modes from the first implementation pass — do not wait for a bug report:

- **Height overflow with variable-length content** (e.g. a list that can grow to N items). A `fixed inset-0 flex items-center justify-center` overlay with an unbounded-height card pushes content off-screen with no way to scroll. Fix: the card gets `flex max-h-[90vh] flex-col`; the scrollable body gets `flex-1 overflow-y-auto`; header/footer stay outside that scrollable div so they stay pinned. Prefer `dvh` over `vh` for the max-height, declared as a fallback pair in the *same* CSS rule (`max-height: 90vh; max-height: 90dvh;`, e.g. in a `.nexora-modal-card` component class in `index.css`) rather than as two competing Tailwind utility classes on one element — class order in the generated stylesheet is not reliable. Real mobile Safari/Chrome compute `100vh` against the address-bar-collapsed viewport, so `vh`-only sizing can clip content on initial load in a way that desktop-browser viewport-resize testing will never reproduce.
- **Width truncation from fixed multi-column grids.** A `grid grid-cols-2` (or more) used to lay out form fields side-by-side (e.g. vendor/date, amount/category) truncates content at ~375px phone widths. Fix: default to `grid-cols-1` and only widen at `sm:` and up (`grid-cols-1 sm:grid-cols-2`).

When testing such components, resize the browser (or Playwright viewport) to a phone width (e.g. 375×667) and take a screenshot as part of self-verification — `tsc`/`build` passing does not catch layout overflow.

## Security And Reliability

- Never commit secrets, tokens, or environment-specific credentials.
- Validate user-controlled URLs and inputs at the boundary that consumes them.
- Avoid raw HTML injection. If unavoidable, sanitize before rendering.
- Keep runtime errors observable through logger/error boundaries rather than silent failure.
- Keep build and tests green; note any command you could not run.

## Completion Checklist

Before finishing a substantive task, confirm:

- The changed path follows the existing ownership boundary.
- No unrelated user changes were reverted.
- Tests/build appropriate to the risk have run.
- Documentation or OpenSpec tasks were updated when the task changed architecture or workflow.
- Final response names changed files, verification, and any known gap.

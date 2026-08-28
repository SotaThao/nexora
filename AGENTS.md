# AGENTS.md

This file provides guidance to any AI coding agent (Claude Code, Cursor, Codex, Copilot, Gemini, etc.) working in this repository.

Treat this as an engineering playbook, not a product brief.

Also read [ARCHITECTURE.md](./ARCHITECTURE.md) — the codebase's structural map (folders, data boundary, domain modules) — and [CULTURE.md](./CULTURE.md) — the US product-culture rule. CULTURE.md applies to every role (design, engineering, QA, PM, support, content) on every task in this repo, not just this file's engineering rules.

**Contents**:

- [Content Lifecycle](#content-lifecycle)
- [Operating Principles](#operating-principles)
- [Domain Principle: Module Independence & Shared Data](#domain-principle-module-independence--shared-data)
- [Repo Profile](#repo-profile)
- [API Integration Workflow](#api-integration-workflow-goal-driven-mandatory)
- [Principal Workflow](#principal-workflow)
  - [Verification Guide](#verification-guide)
- [Provider Stack](#provider-stack)
  - [Key Rules](#key-rules)
- [Architecture Rules](#architecture-rules)
  - [Data Boundary](#data-boundary)
  - [Query Ownership](#query-ownership)
  - [Auth Boundary](#auth-boundary)
  - [API Configuration](#api-configuration)
- [Domain Workflow Notes](#domain-workflow-notes)
- [File Map](#file-map)
- [Code Standards](#code-standards)
- [Mobile-Responsive Modals & Dialogs](#mobile-responsive-modals--dialogs)
- [Form Field Conventions](#form-field-conventions)
- [Image & Static Asset Optimization](#image--static-asset-optimization)
- [Removing an Intermediate Step From an Async Flow](#removing-an-intermediate-step-from-an-async-flow)
- [POS iPad Design Standard](#pos-ipad-design-standard)
- [Security And Reliability](#security-and-reliability)
- [Completion Checklist](#completion-checklist)

## Content Lifecycle

The sections below are evergreen rules. If you add a dated note (e.g. "Follow-Up Note (YYYY-MM-DD)") to document a specific incident or one-time fix, that note belongs in this file only until its lesson is folded into a standing rule elsewhere — at that point, delete the dated note (git history keeps the incident) rather than leaving both to accumulate. Don't let this file become an append-only log.

## Operating Principles

- Start from the current code. Read nearby files, tests, and existing patterns before designing a change.
- Preserve observable behavior unless the task explicitly asks for a behavior change.
- Keep edits narrow. Avoid opportunistic refactors, dependency churn, or formatting-only rewrites outside the requested scope.
- Prefer boring, reversible architecture over clever abstractions.
- Make state ownership explicit. Do not create parallel sources of truth for the same domain data.
- Verify the path you changed with the smallest meaningful test first, then broaden when the blast radius is larger.
- No `console.*` in app code. Use the project logger where runtime logging is needed.
- Do not commit unless explicitly asked.
- **No hardcoded backend enum/status strings.** Any string literal that mirrors a backend enum (`PosOrderStatus`, `TipStatus`, etc. — e.g. `'Waiting'`, `'InService'`, `'Completed'`, `'Cancelled'`, `'Pending'`, `'Confirmed'`) must be compared/assigned via a shared TS `enum`/const object in `src/constants/`, never as an inline string literal in a component, hook, or repository. Check `src/constants/` for an existing constant (e.g. `posOrderStatus.ts`, `tipStatus.ts`) before adding a new comparison — add a new value to the existing enum rather than a parallel literal. When a repository maps a raw API string to a discriminated union type, that mapping is the one allowed place to reference the literal.
- **No links/references to files that don't exist in the project.** Every file reference/citation/link written into anything committed — user stories, OpenSpec `design.md`/`proposal.md`, code comments, commit messages — must resolve to a path that actually exists inside this repo. Verify the path exists before citing it; never assume. The most common violation is a personal local absolute path (e.g. `C:\Users\<name>\...`, `/Users/<name>/...`, a personal Obsidian vault, `.claude/plans/...`, a Downloads folder) — these can never exist for another teammate or agent, so they must never be embedded as if they were a valid project reference. If a source doc (a plan, a PDF, a spec) genuinely needs citing, copy it into the repo first at a path every teammate/agent can resolve (e.g. `user-story/report/`, `docs/archive/`) and cite that repo-relative path instead. If asked to add such a reference and the file isn't in the repo, don't fabricate or embed a path that doesn't exist — ask the user to bring the file into the repo first, or flag it as unresolved.

## Domain Principle: Module Independence & Shared Data

NEXORA TOUCH has three core modules built on the same Business/Staff foundation: the **Tip system** (QR/NFC tipping, reviews), **TaxIQ** (tax filing, payroll-adjacent data), and **POS** (point of sale, staff pay/role/tips-at-checkout). Follow this when designing or building any staff-related screen in either module:

- **Feature-independent**: a module's staff-setup screen must not hard-fail or block just because another module hasn't been set up yet (e.g. POS staff-profile setup must fully work even if TaxIQ has never been configured for the business — see US-019/backend US-07's `taxYearAvailable` flag for the precedent).
- **Data-shared**: when a field is a real-world fact about the staff member rather than module-specific (e.g. SSN/EIN, W-2/1099 tax filing type), it is **not** needed for Tips setup, but **is** needed by both TaxIQ and POS — so both modules' staff-setup screens must expose **view and update** for it against the same backend entity, not a per-module copy or a read-only mirror in one of the two. Do not build a field as "read-only in POS, editable only in TaxIQ" (or vice versa) when both modules genuinely need to edit it — confirm the write path exists/is exposed for both before treating one module as read-only-by-default.
- Before treating a shared field as read-only in a module's screen, check whether that's a deliberate scope decision or an oversight — if the other module already has (or should have) write access, this module's screen should too.

## Repo Profile

- Frontend: React 18 + Vite.
- Language: TypeScript/TSX (`strict: true` but `noImplicitAny` and `strictNullChecks` are off — typed-where-helpful, not enforced everywhere).
- Import alias: `@/*` → `src/*` (configured in `tsconfig.json`).
- Styling: Tailwind utility classes with custom design tokens (see `tailwind.config.js`). Run `pnpm lint:tokens` to validate token usage.
- Server-state cache: TanStack Query v5.
- Current persistence mode: API-backed (REST API at `VITE_API_BASE_URL`).
- HTTP client: `src/lib/httpClient.ts` with JWT Bearer auth, 401 refresh interceptor.
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

Every API feature integration starts from a user story — never integrate a feature aimlessly, without a clear goal to work toward.

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

### Verification Guide

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

### Key Rules

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
- Query keys come from `src/data/queryKeys.ts`.
- Mutations must invalidate or update the relevant query cache.
- Cross-tab freshness will use query refetch / websocket in the API phase.

### Auth Boundary

- UI reads auth through `src/auth/useAuth.ts`.
- Session lifecycle belongs in `src/auth/AuthProvider.tsx`.
- Adapter-specific behavior belongs in `src/auth/adapters/`.
- Components should not import mock auth/session helpers directly.

### API Configuration

The app has one backend per environment, set via `VITE_API_BASE_URL` in the matching `.env.*` file:

| Environment | `.env.*` file | `VITE_API_BASE_URL` |
|---|---|---|
| development | `.env.development` | `https://test-api.nexoratouch.com` |
| test | `.env.test` | `https://test-api.nexoratouch.com` |
| staging | `.env.staging` | `https://staging-api.nexoratouch.com` |
| production | `.env.production` | `https://api.nexoratouch.com` |

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
| HTTP client | `src/lib/httpClient.ts` |
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
| Codebase architecture map | `ARCHITECTURE.md` |
| Design system | `DESIGN.md` |
| POS iPad design standard | `docs/standard/pos-ipad-design-standard.md` |
| Product/spec docs & historical artifacts | `docs/` (see `docs/README.md`) |

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

## Form Field Conventions

Apply these on every new or refactored form field — do not wait for a bug report:

- **Phone number inputs must use the shared formatter**, never a bare `<input type="tel">`. Import `formatNationalNumber`, `getNationalPhonePlaceholder`, `PhoneDialCode` from `src/components/CountryCodeSelect.tsx`: `onChange={(e) => onChange(formatNationalNumber(e.target.value, PhoneDialCode.US))}`, `placeholder={getNationalPhonePlaceholder(PhoneDialCode.US)}`. This is the existing convention across staff/customer forms — matching it is not optional polish.
- **A CUSTOMER phone input must additionally render `CountryCodeSelect` and submit `normalizePhoneE164(value, dialCode)`** — hard-coding `PhoneDialCode.US` is not allowed on these forms. Since the 2026-08-13 phone refactor the backend is the single phone parser (`PhoneHelper.TryParse`, default region `US`) and stores `PhoneCountryCode` separately from the national number; a value sent without its dial code is either stamped as US or, for a genuinely foreign number, left unresolved — and an unresolved customer is silently excluded from every SMS. Applies to check-in, POS booking, public booking, and Booking Hub customer forms. **Staff / business / payout** phone inputs keep the plain `PhoneDialCode.US` convention above — they are not affected by that refactor.
- **Never display a customer phone from the `phone` / `customerPhone` field alone** — since the same refactor it holds the national number with no country code. Format off the matching `*E164` field (see `formatCustomerPhone` in `views/pos/customer/customerFormatters.ts`), and send `*E164` back to any API that re-parses it (e.g. `receiptPhone` on Complete Order).
- **Every text/tel/email input needs a `placeholder`.** Follow the existing "e.g. ..." convention (see `staff_phone_placeholder`, `staff_email_placeholder` in the locales) — add the key to both `en.json` and `vi.json`, never hardcode the string inline.
- **When extracting an existing form into a new component** (e.g. pulling a form out of a parent into its own file), treat the original JSX as the spec: explicitly check it for formatters, placeholders, `inputMode`/`autoComplete` attributes, and validation before considering the extraction done. Moving the visual structure (labels, layout, styling) while silently dropping these is the most common way this kind of refactor regresses — it will not show up in `tsc`/`build`, only in manual testing.

## Image & Static Asset Optimization

New images and other binary static assets live in `public/` and are referenced by plain `<img src="/assets/...">` — there is no bundler-driven image pipeline (`vite.config.ts` has no image-optimization plugin, and nothing under `src/` imports a raster asset for Vite to process). Whatever gets committed ships byte-for-byte; nothing downstream shrinks it. Apply these on every new or replaced image:

- **Compress before committing.** Run any new PNG/JPEG through a compressor (Squoosh, TinyPNG, `pnpm dlx @squoosh/cli`) before adding it under `public/`. Prefer WebP for photos/screenshots; reserve PNG for assets that genuinely need lossless transparency (icons, logos). Treat a single new raster asset over ~150KB as a signal to re-export smaller or switch format, not something to add as-is — check `public/assets/` for an existing near-duplicate first.
- **Reuse `lucide-react` for icons/glyphs** instead of adding a one-off PNG/SVG file. The build already code-splits it into its own chunk (`manualChunks` in `vite.config.ts`); a new icon file bypasses that and ships an extra, uncached request.
- **Lazy-load anything not on first paint.** `<img>` elements below the fold (gallery/list thumbnails, secondary sections) need `loading="lazy"` — see `NewsLibraryView.tsx` for the existing convention. Logos and above-the-fold hero images should stay eager (no `loading` attribute) so they aren't delayed.
- **Set explicit dimensions.** Give every new `<img>` a `width`/`height` (or a Tailwind `aspect-[…]` class) so layout doesn't shift while it loads — most existing `<img>` tags in this repo omit this; don't propagate the gap into new ones.

## Removing an Intermediate Step From an Async Flow

Before deleting a loading/interstitial step (or otherwise keeping a form mounted while a request is in flight), work through both of these — neither is caught by `tsc`, `build`, or tests written after the fact:

- **Ask what the removed screen was unmounting.** An interstitial that covered the form was also *disabling* every input on it, silently. Once the form stays mounted, every field on it is editable for the entire duration of the request. Give each one `disabled={isPending}` explicitly. (Verified case: US-105 — removing the "Processing" step left a payment amount input live and auto-focused during an in-flight mutation.)
- **After a mutation, display the value the server confirmed, not the live input state.** Passing a derived-from-input value (`activeAmount`) into the post-submit screen means any later edit rewrites history. Read the amount back out of the mutation response and prefer it. Mind the operator: repositories here normalize a missing numeric to `0` (`Number(readField(...) ?? 0)` in `publicDirectPayment.ts` / `publicStaffPayment.ts`), and `0 ?? fallback === 0`, so the fallback must be `confirmedAmount || activeAmount`. `DIRECT_PAYMENT_MIN_AMOUNT = 1` makes `0` provably invalid, so `||` is correct here rather than sloppy.
- **Re-entrancy must be explicit.** Do not rely on an unrelated `setState` happening to flush before the mutation flag updates — that ordering is incidental and vanishes the moment someone moves the line. Guard the handler directly (`if (mutation.isPending) return`), matching `handleConfirmPayment` in the same hooks.

## POS iPad Design Standard

The POS module (`src/components/dashboard/views/pos/`) has its own iPad-specific layout conventions (radius scale, touch targets, spacing, font scale, interaction patterns) and a tracked redesign backlog — see [`docs/standard/pos-ipad-design-standard.md`](./docs/standard/pos-ipad-design-standard.md). POS does **not** have its own color tokens: use the plain `nexora*` tokens like every other dashboard screen (see `DESIGN.md`) — do not reintroduce a `posFd*` or any other POS-only color prefix.

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

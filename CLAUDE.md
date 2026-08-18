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
- **No hardcoded backend enum/status strings.** Any string literal that mirrors a backend enum (`PosOrderStatus`, `TipStatus`, etc. — e.g. `'Waiting'`, `'InService'`, `'Completed'`, `'Cancelled'`, `'Pending'`, `'Confirmed'`) must be compared/assigned via a shared TS `enum`/const object in `src/constants/`, never as an inline string literal in a component, hook, or repository. Check `src/constants/` for an existing constant (e.g. `posOrderStatus.ts`, `tipStatus.ts`) before adding a new comparison — add a new value to the existing enum rather than a parallel literal. When a repository maps a raw API string to a discriminated union type, that mapping is the one allowed place to reference the literal.

## Follow-Up Note (2026-08-05)

`PosOrderStatus` hardcoding was found and fixed across `PosFrontDeskView.tsx`, `PosOrderWorkspace.tsx`, `bookingFormatters.ts`, `BookingTab.tsx`, `BookingCalendar.tsx`, `BookingCards.tsx`, `BookingTable.tsx`, `ManageBookingPage.tsx`, and `ConfirmationScreen.tsx` — all now import `PosOrderStatus`/`POS_BOOKING_STATUS_OPTIONS` from `src/constants/posOrderStatus.ts`. Other status domains (Tip transaction status in `useTipsData.ts`/`TipsSavingsTab.tsx`, staff invite status in `merchantStaff.ts`/`Dashboard.tsx`/`StaffView.mobile.tsx`, direct payment status in `directPaymentStatus.ts`) were left as-is — out of scope for that pass, but the same "no hardcoded enum string" rule above applies if they are touched next.

## Domain Principle: Module Independence & Shared Data (Tip system / TaxIQ / POS)

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

## Form Field Conventions

Apply these on every new or refactored form field — do not wait for a bug report:

- **Phone number inputs must use the shared formatter**, never a bare `<input type="tel">`. Import `formatNationalNumber`, `getNationalPhonePlaceholder`, `PhoneDialCode` from `src/components/CountryCodeSelect.tsx`: `onChange={(e) => onChange(formatNationalNumber(e.target.value, PhoneDialCode.US))}`, `placeholder={getNationalPhonePlaceholder(PhoneDialCode.US)}`. This is the existing convention across staff/customer forms — matching it is not optional polish.
- **Every text/tel/email input needs a `placeholder`.** Follow the existing "e.g. ..." convention (see `staff_phone_placeholder`, `staff_email_placeholder` in the locales) — add the key to both `en.json` and `vi.json`, never hardcode the string inline.
- **When extracting an existing form into a new component** (e.g. pulling a form out of a parent into its own file), treat the original JSX as the spec: explicitly check it for formatters, placeholders, `inputMode`/`autoComplete` attributes, and validation before considering the extraction done. Moving the visual structure (labels, layout, styling) while silently dropping these is the most common way this kind of refactor regresses — it will not show up in `tsc`/`build`, only in manual testing.

## POS iPad Design Standard

The POS module (`src/components/dashboard/views/pos/`) is optimized for iPad touch use (nail salon front desk) but, as of 2026-08-10, **shares its color tokens with the rest of the dashboard** — there is no separate POS color identity anymore. History: POS originally had its own warm pink/coral/lavender palette under a `posFd*` token prefix; a 2026-08-10 pass first tried aligning `posFd*` to a teal `#00D5BE` belonging to a *different* Nexora Touch app in a separate repo (wrong — that app isn't this one), then corrected `posFd*` to alias this app's own `nexoraBrand` indigo `#4648D8` + neutral canvas/border/text, and finally — since the values were now identical to `nexora*` anyway — the `posFd*` token block was deleted entirely and every usage renamed back to the plain `nexora*` tokens. **Use `nexoraBrand`/`nexoraBrandDark`/`nexoraCanvas`/`nexoraSurface`/`nexoraBorder`/`nexoraText`/`nexoraMuted`/`nexoraDanger`/`nexoraWarning`/`nexoraLavender` directly in `pos/` — do not reintroduce a `posFd*` (or any other POS-only) token prefix for color.** The iPad-specific parts of this standard are the *non-color* conventions below (radius, touch targets, spacing, font scale, interaction patterns) — those remain POS-specific.

- **Color tokens** (`tailwind.config.js`, "Nexora Touch Admin semantic tokens" block): `nexoraBrand` `#4648D8` (primary accent, filled buttons/active chips — dark enough to keep `text-white` on fills, never switch fill text to `nexoraText`), `nexoraBrandDark` `#393BC8` (hover/pressed), `nexoraCanvas` `#F7F9FC` (page background), `nexoraSurface` `#FFFFFF` (cards), `nexoraBorder` `#DDE5EF`, `nexoraText` `#0B1220`, `nexoraMuted` `#4D5870`, `nexoraDanger` `#EF4444`, `nexoraWarning` `#F59E0B` (secondary highlight), `nexoraLavender` `#A8A9F3` (tertiary accent). There is no `nexoraDangerBg` token — a light-red hover/tint background pairs with `nexoraDanger` via the plain Tailwind `bg-red-50` (which happens to equal the same hex, `#FEF2F2`), not a custom token. Destructive actions (delete line, remove staff, etc.) still fall back to plain `rose-50`/`rose-600` in some screens rather than `nexoraDanger`/`bg-red-50` — an accepted, pre-existing gap, out of scope for the palette unification.
- **Radius scale**: `rounded-2xl` for primary containers and line-item rows, `rounded-xl` for card/list wrapper shells, `rounded-lg` for standalone buttons/inputs, `rounded-full` for pills (chips, avatars, toggle segments). Keep this 4-tier scale as-is across new POS work — don't introduce a 5th radius value or swap `rounded-lg` buttons to `rounded-xl` without checking with the team, since the 3 non-pill tiers are already load-bearing across 6 shipped tickets.
- **Touch targets**: `h-11` is the default interactive control height (primary inputs, CTA buttons) and meets the 44pt touch-target guideline. `h-9` (36px) is used for icon buttons/steppers/avatars and is *below* the 44pt guideline — this is an accepted trade-off for dense, secondary actions with adequate spacing between them, not an oversight; don't "fix" it in isolation without confirming with the team, since widening it is a layout-affecting change across every row that uses it. `h-14`/`h-20` are reserved for the PIN pad's oversized digit buttons — don't reuse these sizes for regular controls.
- **Spacing**: `p-3`/`p-4` for card padding, `gap-2`/`gap-3` between elements. Chips use two sizes by convention — larger touch-friendly (`px-3.5 py-2`) and compact (`px-2.5 py-1`) — pick based on whether the chip is a primary tap target or a secondary/meta tag, not arbitrarily.
- **Font scale**: `text-sm font-bold` for row labels/prices, `text-xs` for secondary labels, `text-[10px]`/`text-[11px]` for uppercase micro-labels/meta, `text-2xl font-black` for PIN-pad digits. The bracket (arbitrary) values are a known inconsistency versus Tailwind's token philosophy — acceptable to keep matching them for now, but if `pnpm lint:tokens` gains support for a named micro-label scale, prefer that over adding more arbitrary bracket sizes.
- **Page title/description** (2026-08-10, matched to `BookingHubView.tsx`'s AI Hub page, the app's heaviest-weight page-header treatment): every `pos/` view's `<h1>` is `text-2xl font-bold leading-tight text-nexoraText` (was `text-base font-semibold`) and its description `<p>` is `text-sm font-medium text-nexoraMuted` (was `text-xs` with no weight class). Applies to `PosFrontDeskView.tsx`, `PosCategoriesView.tsx`, `PosGeneralSettingsView.tsx`, `PosProductsView.tsx`, `PosRolesView.tsx`, `PosServicesView.tsx`, `PosStaffProfileView.tsx`, `PosOrderWorkspace.tsx`. `PhoneCheckInStep.tsx`'s `text-xl font-black` step-heading is a different, already-heavier pattern for a full-screen step flow — left as-is, not part of this alignment.
- **Table headers** (`<th>` in `PosFrontDeskView.tsx`, `PosCompletedOrdersPanel.tsx`, `booking/BookingTable.tsx`): each `<th>` carries `text-xs font-black` directly (12px, was inherited `text-[10px]` at an effectively-700 weight). The weight/size/uppercase/tracking classes were previously only on the parent `<tr>` — harmless for the inherited properties, but **font-weight on `<th>` does not inherit**: the browser's built-in `th { font-weight: bold }` (700) silently wins over an ancestor's `font-black` (900) because it's a rule on the element itself, not an inherited value. Always put `font-*` directly on the `<th>`, never rely on a `<tr>`/`<thead>` ancestor for it — this bit real screens before the 2026-08-10 fix (both table headers were rendering at 700 despite the JSX saying `font-black`).
- **Reusable interaction patterns** (established in `CategoryGroupedCatalogPicker.tsx` and `PosOrderWorkspace.tsx`, reuse rather than reinvent):
  - Category/tag filtering: a **wrapping** chip row (`flex-wrap`), never a horizontal-scroll chip strip. "All" shows every group under a **sticky** section header; a specific chip filters to just that group.
  - Item listing: an auto-fill card grid (`grid-cols-2 sm:grid-cols-3`-equivalent, `repeat(auto-fill, minmax(...))` when not using fixed breakpoints), not tall single/double-column cards and not thin table rows.
  - Quantity steppers (`−`/qty/`+`) mutate directly on tap (`applyQuantityDelta`-style) — no draft-state-then-blur-commit dance. Only use draft/blur-commit for free-text numeric inputs where a stepper isn't viable.
  - Staff/technician identity in a row: avatar with initials, not a photo placeholder or a bare name string.
- **Consistency rule**: `pos/` components use the shared `nexora*` tokens like every other dashboard screen — there is nothing POS-specific to keep separate for color anymore, so there's no "stray token" risk left to guard against here. The remaining POS-specific conventions are the non-color ones above (radius/touch-target/spacing/font scale) and the interaction patterns below.

## POS iPad Redesign — Remaining Scope

**Color tokens are fully unified as of 2026-08-10** (see "POS iPad Design Standard" above) — every file in `pos/`, `pos/booking/`, and `pos/modals/` uses the plain `nexora*` tokens directly, same as the rest of the dashboard; the `posFd*` token prefix that used to exist has been deleted. The list and priority order below is about **layout/component-pattern** adoption (radius scale, spacing, chip/card-grid patterns, sticky headers, avatar-with-initials, etc.), which is a separate, still-pending effort — color unification did not include restyling these screens' structure. As of 2026-08-01, only these files had adopted the full POS iPad layout/component pattern (not just color): `PosFrontDeskView.tsx` (partially), `PosOrderWorkspace.tsx`, `CustomerHeaderBar.tsx`, `PhoneCheckInStep.tsx`, `CategoryGroupedCatalogPicker.tsx`, `modals/SelectTechniciansModal.tsx`. Everything else in `pos/` and adjacent POS-relevant screens still uses the old generic dashboard layout (color is now unified either way, since color is no longer POS-specific). Suggested priority order for future sessions (highest-value / lowest-risk first):

1. ~~**Consistency cleanup in already-shipped screens**~~ — done 2026-08-10, and superseded the same day: color tokens are no longer POS-specific at all (see above), so there's no `posFd*`/`nexora*` mixing to clean up anymore.
2. **Turn Board tab** (`PosFrontDeskView.tsx:555-569`) — still a plain grid with no `rounded-2xl`/card-pattern adoption. High-traffic screen, same file as already-migrated code, natural next step for the layout pass.
3. **`PosCompletedOrdersPanel.tsx`** — still a plain `<table>` structurally. Candidate for the same row-based redesign already applied to the Order Detail panel.
4. **Settings/catalog admin screens** — `PosGeneralSettingsView.tsx`, `PosCategoriesView.tsx`, `PosServicesView.tsx`, `PosProductsView.tsx`, `PosRolesView.tsx`, `PosStaffProfileView.tsx`, `WeeklyScheduleEditor.tsx`, `PosBookingSettingsPanel.tsx`, and their `modals/Create*Modal.tsx`. Staff use these less often than check-in/order-workspace, but they're still hands-on-iPad screens.
5. **Booking screens** (`booking/BookingTab.tsx`, `BookingTable.tsx`, `BookingCards.tsx`, `BookingCalendar.tsx`, `NewBookingForm.tsx`, `RescheduleServicesEditor.tsx`, `BookingLinkShare.tsx`) — note `CategoryGroupedCatalogPicker`'s `variant` prop already lets Booking's catalog pickers opt in later without touching POS; Booking's own modals/tables are still unmigrated by design (they weren't part of the original design review and live in more space-constrained modal contexts, so re-check touch-target sizing before just copying the POS pattern wholesale).
6. **Owner/Manager Dashboard & Reports** (`src/components/dashboard/overview/*`, `ReportsView.tsx`) — previously explicitly deferred by the team as a separate session; confirm that's still the intent before starting.
7. **Weekly Payroll / staff clock-in** — `WeeklyPayrollView.tsx` lives under `taxiq/`, not `pos/`, and has no POS iPad layout styling. No dedicated POS clock-in/out screen exists anywhere in the repo yet — this is a missing feature, not a restyle, and needs its own design pass before a visual standard applies.
8. **Manual Staff PIN Access** — a real functional gap, not cosmetic: `AddManualStaffTab.tsx` lets an Owner add a staff member with no login account (payout config only), and no component anywhere implements PIN-based POS operator login for them. Recommend treating this as a feature-design task (brainstorm first) rather than folding it into a styling pass, since it needs new auth/session design, not just new classNames.

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

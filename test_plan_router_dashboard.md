# Test Plan — React Router migration, Business (Owner) Dashboard

Feature under test: the `migrate-to-react-router` change as it applies to the **owner/business dashboard** — nested routes under `/dashboard`, route guards, auth-based landing, URL-derived active menu, settings tab param, and tips/touchpoints sub-tab query params.

Scope is the addressing/navigation mechanism only. Per the OpenSpec proposal, no `src/data/**`, `httpClient`, or `auth` behavior changes — so the data boundary (Layer 2) is largely **N/A** for this feature and is documented as such rather than padded with synthetic API tests.

## Acceptance Criteria / Definition of Done

- [ ] All **P0** cases pass (mandatory).
- [ ] All **P1** cases pass (document exceptions).
- [ ] No console errors during Layer 1 render or Layer 3 flow.
- [ ] `pnpm build` succeeds.
- [ ] Routing changes keep TanStack Query caches untouched (no new domain reads/writes introduced by routing).
- [ ] P2/P3 may be deferred.

## Owning files

| Layer | Files |
|-------|-------|
| Routes tree / guards | `src/app/AppRouter.jsx`, `src/app/RequireAuth.jsx`, `src/app/RootRedirect.jsx`, `src/app/LoadingScreen.jsx` |
| Dashboard layout + route wrappers | `src/components/Dashboard.jsx`, `src/components/dashboard/routes/index.jsx` |
| Nav derivation | `src/components/dashboard/hooks/useDashboardNavigation.js` |
| Nav callbacks | `src/components/dashboard/layout/{DashboardSidebar,MobileMenuDrawer,DashboardHeader}.jsx` |
| Onboarding gate handoff | `src/components/SetupWizard.jsx` |

## Layer 1 — Test UI / routing units

| ID | Pri | Precondition | Steps | Expected |
|----|-----|--------------|-------|----------|
| L1-GUARD-1 | P0 | anonymous | render `RequireAuth role=owner` on `/protected` | redirect to `/login` |
| L1-GUARD-2 | P0 | `status=loading` | render guard | no redirect; LoadingScreen (neither protected nor login renders) |
| L1-GUARD-3 | P0 | owner session | render `RequireAuth role=owner` | protected content renders |
| L1-GUARD-4 | P0 | staff session | render `RequireAuth role=owner` | redirect to `/staff` |
| L1-GUARD-5 | P0 | owner session | render `RequireAuth role=staff` | redirect to `/dashboard` |
| L1-GUARD-6 | P1 | staff session | render `RequireAuth role=staff` | protected content renders |
| L1-GUARD-7 | P1 | `flag='!personal'`, no role | render `RequireAuth role=owner` | treated as staff → `/staff` |
| L1-NAVHOOK-1 | P0 | path `/dashboard/settings` | read `activeMenu` | `'settings'` |
| L1-NAVHOOK-2 | P0 | path `/dashboard` | read `activeMenu` | `'overview'` |
| L1-NAVHOOK-3 | P0 | path `/dashboard/settings/kyb` | read `activeMenu` | `'settings'` |
| L1-NAVHOOK-4 | P0 | path `/dashboard/staff` | read `activeMenu` | `'staff'` |
| L1-NAVHOOK-5 | P0 | mobile menu open | `navigateMenu('overview')` | `navigate('/dashboard')` + mobile menu closes |
| L1-NAVHOOK-6 | P0 | — | `navigateMenu('reports')` | `navigate('/dashboard/reports')` |
| L1-NAVHOOK-7 | P1 | — | `handleNavigateMenu('touchpoints')` | `navigate('/dashboard/touchpoints')` |
| L1-NAVHOOK-8 | P1 | path `/dashboard/tips` | read `isTipsMobileExpanded` | `true` |

Files: `tests/unit/RequireAuth.test.jsx` (new), `tests/unit/useDashboardNavigation.test.jsx` (extended).

## Layer 2 — Data boundary

**N/A for this feature.** Routing introduces no repository/adapter/query-key changes. Existing data-layer suites (`tests/unit/dataHooks.test.jsx`, `tests/unit/repositories.test.js`, `src/data/repositories/__tests__/*`) remain the owners of that contract and should stay green as a non-regression check.

## Layer 3 — Flow (E2E, real browser) — already executed live

| ID | Pri | Steps | Expected | Status |
|----|-----|-------|----------|--------|
| L3-LAND-1 | P0 | open `/` anonymous | redirect `/login` | Pass |
| L3-LAND-2 | P0 | owner login | land on `/dashboard` | Pass |
| L3-NAV-1 | P0 | walk all `/dashboard/*` sub-routes | each renders + sidebar highlight | Pass |
| L3-NAV-2 | P0 | `/dashboard/settings/kyb` | KYB tab active | Pass |
| L3-NAV-3 | P1 | `/dashboard/settings` no tab | default ACCOUNT/profile | Pass |
| L3-NAV-4 | P0 | `/dashboard/staff/<bad-id>` | redirect to `/dashboard/staff` | Pass |
| L3-SUBTAB-1 | P1 | `/dashboard/tips?tab=...`, click sub-tab | URL `?tab=` updates (replace) | Pass |
| L3-BACK-1 | P0 | dashboard→staff→reviews, Back×2, Forward | correct view each step | Pass |
| L3-REFRESH-1 | P0 | refresh on `/dashboard/settings/kyb` | stays, no 404 (dev SPA fallback) | Pass |
| L3-GUARD-1 | P0 | anonymous open `/dashboard/*` | redirect `/login` | Pass |
| L3-KYB-1 | P1 | trigger KYB gate, click "Verify Now" | navigate `/dashboard/settings/kyb` | Deferred (gated state not reproduced live; path present in `KybGateContext`) |

Existing project E2E: `tests/e2e/routingMigration.test.js` (smoke), `tests/e2e/merchantDashboard.test.js`, `tests/e2e/dashboard.test.js` — run via `pnpm test:e2e`.

## Known test debt (surfaced by this migration)

- `tests/unit/SetupWizard.test.jsx` is **stale**: it renders `<SetupWizard onComplete onBackToLogin initialBusinessInfo .../>` (old prop contract) with no Router. The migrated `SetupWizard` takes no props and calls `useNavigate`/`useLocation`/`useAuth`, so these tests now mount outside a Router. Needs rewrite to wrap in `MemoryRouter` + `AuthProvider` and drive prefill via `location.state`. This file also would have caught the `onBackToLogin` runtime crash had it been kept in sync.

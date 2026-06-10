# Walkthrough — React Router migration QA (Business Dashboard)

Date: 2026-06-10 · Branch: `feat/integrate-staff-invite-api` · Tester: feature-focused-tester

## Summary

The React Router migration was tested live in a real browser (owner account `testbiz3@mail.com`) and reinforced with focused unit tests for the routing core. One **P0 runtime crash** was found and fixed during testing. All other owner-dashboard routing scenarios pass.

P0 gate: **PASS** (after the `onBackToLogin` fix). One P1 (KYB-gate "Verify Now") deferred — see below.

## Bug found & fixed (P0)

**`src/components/SetupWizard.jsx:109`** referenced the removed prop `onBackToLogin` as a bare identifier (`{onBackToLogin && (…)}`). The migration removed that prop (replaced by a local `handleBackToLogin` using `useAuth().logout()` + `navigate('/login')`), so the reference threw `ReferenceError: onBackToLogin is not defined` and the onboarding screen crashed into the error boundary right after a new owner registered (route correctly went to `/onboarding`, but the component crashed).

Fix: `{onBackToLogin && (` → `{handleBackToLogin && (`. Verified live: `/onboarding` renders the full Step-1 wizard with the "Back to Login" button, console clean.

## Layer 1 — routing unit tests (added, run on dev machine)

- `tests/unit/RequireAuth.test.jsx` (new) — 7 cases: anonymous→/login, loading→no redirect, owner ok, staff→/staff, owner→/dashboard, staff ok, `!personal` treated as staff.
- `tests/unit/useDashboardNavigation.test.jsx` (extended from 1→8 cases) — `activeMenu` derivation across `/dashboard`, `/dashboard/staff`, `/dashboard/settings`, `/dashboard/settings/kyb`; `navigateMenu`/`handleNavigateMenu` route building; mobile-menu close; tips accordion auto-expand.

> Not executed in this session: the agent sandbox cannot run vitest (the mounted `node_modules` was installed on Windows; pnpm's platform-specific store fails to resolve `@vitest/utils` under Linux). Run on the dev machine — commands below. Tests mirror the repo's existing proven patterns (`AppRouter.test.jsx`, the prior `useDashboardNavigation.test.jsx`).

## Layer 2 — data boundary

N/A for routing. No repository/adapter/query-key changes. Existing data suites remain the owners and should stay green.

## Layer 3 — live browser flow (executed this session)

| ID | Result | Notes |
|----|--------|-------|
| L3-LAND-1 anonymous `/`→`/login` | Pass | |
| L3-LAND-2 owner login→`/dashboard` | Pass | account onboarded |
| L3-NAV-1 all `/dashboard/*` sub-routes | Pass | overview, staff, tips, reviews, reports(="Transactions" by design), touchpoints, analytics, settings, support, subscriptions(ComingSoon) — sidebar highlight correct |
| L3-NAV-2 `/dashboard/settings/kyb` | Pass | KYB tab active |
| L3-NAV-3 `/dashboard/settings` default | Pass | ACCOUNT/profile |
| L3-NAV-4 `/dashboard/staff/<bad-id>` | Pass | redirects to `/dashboard/staff` |
| L3-SUBTAB-1 tips/touchpoints `?tab=` | Pass | URL updates on tab click; `replace` per code |
| L3-BACK-1 back/forward | Pass | dashboard→staff→reviews, Back→staff→dashboard, Forward→staff |
| L3-REFRESH-1 refresh on `/dashboard/settings/kyb` | Pass | stays, no 404 (Vite dev SPA fallback) |
| L3-GUARD-1 anonymous `/dashboard/*`,`/staff/*`,`/onboarding`,unknown | Pass | all redirect to `/login` |
| L3-KYB-1 KYB-gate "Verify Now" | Deferred | could not reproduce the gated state on this account; target route `/dashboard/settings/kyb` works directly, navigation path present in `KybGateContext` |

Console was checked at each step — no errors after the `onBackToLogin` fix (only benign React Router v7 future-flag warnings).

Note: also confirmed earlier — public deep-links `/touch/:biz/:tp`, `/invite/:token`, and legacy `/staff/invite/:token` render without auth and are not captured by the authed `/staff` dashboard (route-ordering D9).

## Definition of Done status

- P0: **PASS** (after fix). P1: pass except L3-KYB-1 (deferred, documented).
- No console errors in L3 after fix.
- `pnpm build` / `pnpm test`: **not run in sandbox** — pending on dev machine (commands below).
- Query caches untouched by routing.

## Run on the dev machine

```bash
# Layer 1 (targeted)
pnpm vitest run tests/unit/RequireAuth.test.jsx tests/unit/useDashboardNavigation.test.jsx

# Build gate
pnpm build

# Layer 3 routing smoke
pnpm test:e2e   # or: pnpm vitest run tests/e2e/routingMigration.test.js

# Full QA report (HTML+MD in reports/), optional Telegram Thread 735
pnpm test:qa
# pnpm test:qa:telegram
```

## Follow-ups

1. Rewrite stale `tests/unit/SetupWizard.test.jsx` to the new propless + Router contract (would have caught the crash).
2. Reproduce and live-test the KYB-gate "Verify Now" path (L3-KYB-1).
3. Optional: grep `src/` for other removed-prop references left over from the migration.

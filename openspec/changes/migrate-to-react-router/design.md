## Context

`src/App.jsx` is a custom `view` useState state-machine (values: `login | register-wizard | onboarding | dashboard | customer | staff-portal | staff-dashboard | forgot-password | reset-password`) that passes a large prop-bag plus `setView` into `src/app/AppRouter.jsx`, which conditionally renders each screen. Deep-links are hand-parsed in one mount `useEffect` (`App.jsx:60-132`), and a `deepLinkHandledRef` prevents session-restore from hijacking public routes. Dashboard sub-navigation (`activeMenu`, `settingsTab`, `tipsTab`, `touchpointsTab`, `viewingStaffDetailId`) and staff-dashboard (`activeScreen`) are internal `useState`. React Router is not installed.

Constraints: React 18 + Vite, JS/JSX (no TS). Data flows `components → data hooks → repositories → adapter`; identity/server-state live in `useAuth()` (`{ session, status, login, logout }`) and TanStack Query hooks (`useMerchantSetup()`). The repo data-boundary rule forbids new parallel sources of truth. APIs and the `/touch`, `/invite` deep-link contracts must not change.

## Goals / Non-Goals

**Goals:**
- Declarative React Router v6 (`<BrowserRouter>`) with a URL for every page and every nested dashboard/staff sub-view.
- Browser back/forward/refresh/bookmark/deep-link work everywhere.
- Auth-based landing + route guards replace imperative `applySessionToView`.
- Backward-compatible handling of existing externally-issued links.
- Identity/server-state read from hooks at the route components, shrinking App's prop-bag.

**Non-Goals:**
- Capacitor/iOS (`HashRouter`, native deep-links) — deferred.
- Fixing the 11 broken `?flow=customer` link generators — separate task (needs real API slugs).
- Rewriting sub-view components (`Overview`, `StaffView`, `TipsView`, `SettingsView`, staff screens) — their props stay the same.
- Changing any `src/data/**`, `src/lib/httpClient.js`, `src/auth/**`, or `useCustomerFlow.js` behavior.

## Decisions

**D1 — Component API (`<BrowserRouter>` + `<Routes>`) over data-router (`createBrowserRouter`).** No loaders/actions are needed; the component API is the smaller, less disruptive migration and keeps lazy/`Suspense` patterns intact. *Alternative:* data-router with loaders — rejected as over-engineering for this migration.

**D2 — `BrowserRouter` (history API) over `HashRouter`.** Existing public links are path-based (`/touch/...`, `/invite/...`) and already work, implying SPA fallback exists on the host; hashes would change those URLs. Capacitor is out of scope. *Trade-off:* production host must rewrite unknown paths to `index.html`.

**D3 — Guards as wrapper components, not loaders.** `RequireAuth({ role })` reads `useAuth()`: `status==='loading'` → `LoadingScreen`; anonymous → `<Navigate to="/login" replace>`; role mismatch → `<Navigate>` to the correct dashboard. A `RootRedirect` at `/` performs auth-based landing and hosts the legacy-query compatibility shim. This replaces the `applySessionToView` branching (`App.jsx:175-227`). *Alternative:* per-route loaders — rejected (D1).

**D4 — Layout + `<Outlet context>` for dashboards; sub-views keep current props.** `Dashboard.jsx` keeps all data hooks, sidebar/header/mobile-drawer, and all modals, and renders `<Outlet context={dashboardCtx}>` where `renderContent()` was. Each former `if (activeMenu===X)` branch becomes a ~10-line route component in `src/components/dashboard/routes/*` that pulls shared data via `useOutletContext()` and renders the unchanged sub-view. *Alternative:* push data hooks into each route component — rejected (would duplicate ~15 queries or force prop-drilling through the router).

**D5 — `activeMenu`/`activeScreen` derived from the URL.** `useDashboardNavigation` computes `activeMenu` from `useLocation().pathname.split('/')[2] || 'overview'`; `navigateMenu`/`handleNavigateMenu` become `navigate()` wrappers; only genuine UI state stays `useState` (`isMobileMenuOpen`, `isProfileExpanded`, `isTips/TouchpointsMobileExpanded`). The accordion `useEffect` (dep `activeMenu`) is kept verbatim; the two `initialMenu`/`initialSettingsTab` sync effects are deleted. StaffDashboard derives `screen` similarly and passes `onNavigate=(s)=>navigate(...)`.

**D6 — Settings tab = nested param; tips/touchpoints sub-tabs = query param.** Settings/KYB is an external deep-link landing target → bookmarkable path `/dashboard/settings/:tab` feeding the existing `SettingsView initialTab` prop (`useSettingsForm` already syncs). Tips/touchpoints sub-tabs are in-screen filters with no external links → `useSearchParams` `?tab=` with `{ replace:true }` to avoid back-button noise. *Alternative:* everything as nested paths — rejected (param-vs-static-segment collisions, history noise).

**D7 — Staff detail via `/dashboard/staff/:staffId`, replacing `viewingStaffDetailId`.** `StaffView.onViewDetail(id)` → `navigate('/dashboard/staff/'+id)` (signature unchanged); detail route reads `useParams().staffId`; back → `navigate('/dashboard/staff')`. `useStaffManagement` is repointed: its `viewingStaffDetailId` becomes the route param and `setViewingStaffDetailId` becomes a navigate-to-list callback, preserving the hook's delete-cleanup contract.

**D8 — Cross-route state: `location.state` + a tiny `KybGateContext`.** Register→onboarding handoff (`ssoPrefillData`, `isNewRegistration`) is a one-shot → `navigate('/onboarding', { state })` read via `useLocation().state` (refresh re-derives from session — correct). The KYB-required modal is genuinely shared cross-route UI → `KybGateContext` (`requireKyb()`, `isOpen`, `dismiss()`) provided above the routes; "Verify Now" navigates to `/dashboard/settings/kyb`. `preKybView` is removed. Login form state moves into `LoginScreen` local state. *Alternative:* a large app-flow context — rejected (parallel source of truth; violates data-boundary rule).

**D9 — Route ordering resolves `/staff` collision.** Declare public `/staff/invite/:token` (and canonical `/invite/:token`) as siblings ordered before the authenticated `/staff/*` dashboard so the legacy invite path is not captured by the staff dashboard.

## Risks / Trade-offs

- **Production SPA fallback** → refresh on `/dashboard/settings/kyb` etc. 404s without host rewrite to `index.html`. Mitigation: document a host rule (Netlify `_redirects` `/* /index.html 200` or nginx `try_files`); Vite dev already handles it. Not FE code.
- **`/staff` vs `/staff/invite/:token` capture** → wrong screen. Mitigation: D9 ordering + explicit static segments (no `:screen` param on `/staff`).
- **Auth race on refresh of protected routes** → flash/blank or wrong redirect. Mitigation: guard renders `LoadingScreen` while `status==='loading'`; redirect only after resolve.
- **`window.history.replaceState` desync** (`AppRouter.jsx:188`, `App.jsx:75`) → router out of sync. Mitigation: replace with `navigate(..., { replace:true })`.
- **Tests coupled to navigation** → some unit/E2E specs assert via DOM text (mostly survive); E2E entry uses `?flow=customer`/`/invite` (re-verify). Mitigation: compare failing-test *names* vs the ~65 baseline, not counts.
- **StrictMode double effects** (`main.jsx`) → effects run twice in dev; keep them idempotent, never `navigate()` in render.

## Migration Plan

1. Add `react-router-dom`; mount `<BrowserRouter>` in `main.jsx`.
2. Build the route tree + guards + compat shim in `AppRouter.jsx`; reduce `App.jsx` to providers + routes.
3. Convert `Dashboard.jsx` to layout + Outlet and add `dashboard/routes/*`; refactor `useDashboardNavigation`.
4. Convert `StaffDashboard.jsx` to layout + Outlet.
5. Repoint supporting components' callbacks to `navigate`; add `KybGateContext`; move login form state local.
6. Verify: `pnpm build`, `pnpm test` (vs baseline), manual route walk via preview tools.

Rollback: the change is additive at the dependency level; reverting the branch restores the state-machine. No data migration involved.

## Open Questions

- None blocking. The two KYB modals (App/AppRouter-level and the in-`Dashboard` `showKybWarningModal`) may be consolidated into `KybGateContext`; minimum required is that "Verify Now" navigates to `/dashboard/settings/kyb`. Consolidation is optional and can be a follow-up.

## Why

The app navigates through a custom `view` useState state-machine in `src/App.jsx` with no URLs: pages, dashboard sub-menus, and staff screens are not addressable, so browser back/forward, refresh, bookmarking, and shareable links don't work — every refresh drops the user back to login. Deep-links are hand-parsed in one mount effect, which is fragile and couples public links to internal view state. Moving to React Router gives every screen a real URL while preserving all integrated API behavior.

## What Changes

- Add `react-router-dom` v6 and mount a `<BrowserRouter>` (web-app only; Capacitor/iOS deferred).
- **BREAKING (internal architecture, not user-facing)**: Replace the `view`/`setView` state-machine in `src/App.jsx` and the conditional renderer in `src/app/AppRouter.jsx` with a declarative `<Routes>` tree. The `view` string state and its prop-bag are removed.
- Give every page a URL: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/onboarding`, plus public `/touch/:businessSlug/:touchPointSlug`, `/invite/:token`.
- **Full nested routing** for both dashboards: owner sub-menus become `/dashboard/{overview,staff,staff/:staffId,tips,reviews,reports,touchpoints,analytics,settings,settings/:tab,subscriptions,support}`; staff screens become `/staff/{index,qr,tips,reviews,pay,profile,notifications}`.
- Add **route guards** (`RequireAuth` for owner/staff + onboarding gate) that read `useAuth()` — replacing the imperative `applySessionToView` landing logic.
- Add a **compatibility layer** so existing externally-issued links keep working unchanged: `?action=verify-email`, `?action=reset-password`, `?flow=staff-invite&biz=`, and legacy path `/staff/invite/:token`.
- Read identity/server-state from hooks (`useAuth()`, `useMerchantSetup()`) inside route components instead of lifting into App, per the repo data-boundary rule.
- Replace cross-route lifted state with router primitives: register→onboarding handoff via `location.state`; the KYB-required modal via a small `KybGateContext`.
- Replace `window.history.replaceState` calls (`AppRouter.jsx:188`, `App.jsx:75`) with `navigate(..., { replace: true })`.

## Capabilities

### New Capabilities
- `app-routing`: URL route structure for all pages and nested dashboard/staff sub-views; route guards and auth-based landing redirects; deep-link compatibility contract for existing externally-issued links; browser back/forward/refresh/bookmark support.

### Modified Capabilities
<!-- None. Existing functional specs (authentication-login, merchant-dashboard, onboarding-setup-wizard, register-wizard, staff-registration-portal, customer-tipping-review, merchant-settings-kyb) keep their behavior unchanged — only the addressing/navigation mechanism changes, which is owned by the new app-routing capability. No API or data-layer requirements change. -->

## Impact

- **Dependencies**: adds `react-router-dom` (^6).
- **Core files**: `src/main.jsx` (mount router), `src/App.jsx` (retire state-machine), `src/app/AppRouter.jsx` (declarative routes + guards + compat), `src/components/Dashboard.jsx` + `src/components/dashboard/hooks/useDashboardNavigation.js` + new `src/components/dashboard/routes/*` (nested owner dashboard), `src/components/staff-dashboard/StaffDashboard.jsx` (nested staff dashboard).
- **Supporting files** (callbacks repointed to `navigate`, props otherwise unchanged): `LoginScreen.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`, `RegisterWizard.jsx`, `DashboardSidebar.jsx`, `MobileMenuDrawer.jsx`, `DashboardHeader.jsx`, `useStaffManagement.js`; new `src/contexts/KybGateContext.jsx`.
- **Unchanged**: all `src/data/**` repositories/hooks/adapters, `src/lib/httpClient.js`, `src/auth/**`, `useCustomerFlow.js`, `SettingsView.jsx`/`useSettingsForm.js`.
- **Out of scope**: the 11 broken `?flow=customer` QR/share link generators (Overview, ReportsView, SetupWizard, Step2/Step3, TransactionDetailModal) — tracked separately; they require real API slugs.
- **Deployment note (not FE code)**: production host must rewrite unknown paths to `index.html` (SPA fallback) or refresh on nested routes 404s. Vite dev already handles this.

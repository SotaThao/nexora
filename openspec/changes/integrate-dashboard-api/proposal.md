## Why

`integrate-api-foundation` wired the entry flows — authentication, merchant onboarding, staff payment-method setup, and personal onboarding — against the live Nexora Touch REST backend, and the app is now **API-only** (storage/mock adapter switching was removed in `src/auth/adapters/index.js`).

The next surfaces a user reaches after login are the **dashboards**, and they are still backed by TODO stubs that return empty data:

- `src/data/repositories/transactions.js`, `reviews.js`, `notifications.js`, `staffAccounts.js` all return `[]` / `null` with `// TODO: Wire to API` markers.
- `src/data/repositories/profileSettings.js` `get()` returns `null` (read path not wired).

This change wires the **dashboard read surfaces + notifications** for both roles so a real merchant sees real metrics/reviews and a real staff member sees their real profile, payment methods, and notifications:

- **Business (merchant)** — Overview metrics, Reviews/Private-feedback inbox (+ resolve), Staff performance analytics, Touch-point performance analytics, and notifications.
- **Personal (staff)** — Profile (read), payment-methods (read), and notifications.

## What Changes

- **New**: `src/data/repositories/dashboard.js` — merchant dashboard reads against `/api/v1/merchant/dashboard/overview`, `/staff`, `/touchpoints`, `/reviews`, plus `resolveReview()` → `PUT /reviews/{id}/resolve`.
- **Implemented** (replaces stub): `src/data/repositories/reviews.js` — `list(filters)` → `GET /api/v1/merchant/dashboard/reviews`, `resolve(id, dto)` → `PUT /api/v1/merchant/dashboard/reviews/{id}/resolve`. (Reviews on the merchant side are dashboard-scoped.)
- **Implemented** (replaces stub): `src/data/repositories/notifications.js` — `list()` → `GET /api/v1/notifications`, `unreadCount()` → `GET /api/v1/notifications/unread-count`, `markRead(id)` → `PUT /api/v1/notifications/{id}/read`, `markAllRead()` → `PUT /api/v1/notifications/read-all`.
- **Implemented** (replaces stub): `src/data/repositories/profileSettings.js` `get()` → `GET /api/v1/userprofile/me`; add `getVerifiedStatus()` → `GET /api/v1/userprofile/verified-status`.
- **Implemented** (replaces stub): `src/data/repositories/staffAccounts.js` — compose the staff account view from `/api/v1/userprofile/me` + `/api/v1/staff/payment-methods` (read) for the personal dashboard; tips/reviews/KPIs remain empty (see deferral below).
- **New hooks** in `src/data/hooks/`: `useDashboardOverview`, `useDashboardStaff`, `useDashboardTouchpoints`, `useDashboardReviews`, `useResolveReview`. Extend `useNotifications.js` with `useUnreadCount` and `useMarkAllNotificationsRead`. Extend `useProfileSettings.js` / `useStaffAccount.js` read paths.
- **Extended**: `src/data/queryKeys.js` — add `dashboardOverview`, `dashboardStaff`, `dashboardTouchpoints`, `dashboardReviews(filters)`, `notificationsUnreadCount`, `userProfile`, `verifiedStatus` keys.
- **Component wiring (reads)**:
  - Merchant: `Overview.jsx`, `ReportsView.jsx`, `StaffView.jsx` (analytics overlay), `ReviewsView.jsx` (+ resolve), `TouchpointsView.jsx` (analytics overlay), `DashboardHeader.jsx` (notification bell + unread badge).
  - Staff: `StaffProfile.jsx` (profile read), `StaffPay.jsx` (payment-methods read), `StaffNotifications.jsx` (feed + mark-read), `StaffHeader.jsx` (bell). `StaffHome.jsx` / `StaffTips.jsx` / `StaffReviews.jsx` render explicit empty states pending backend (see deferral).
- **Extended**: `src/data/errorCodes.js` + `src/locales/en.json` / `vi.json` — add dashboard/notification error keys and empty-state copy.

### Deferred (backend dependency — flagged, not in scope)

The API spec (`API/nexora-touch-end-user-ai-coding-spec.md`, §4.10, §7) exposes **only aggregated** merchant dashboard metrics and **no list endpoints** for:

- Individual merchant transactions/tips (no `GET /api/v1/merchant/transactions`). → `transactionsRepository` stays a stub; merchant `TipsView` and transaction-detail views render empty states.
- Any staff-facing tips/earnings/reviews (no `GET /api/v1/staff/dashboard/*`). → staff `StaffHome` KPIs, `StaffTips`, `StaffReviews` render empty states.

These are tracked as Open Questions for the backend team; the FE renders intentional empty states until those endpoints exist.

## Capabilities

### New Capabilities

- `api-merchant-dashboard`: Merchant dashboard read surfaces — overview metrics, staff performance metrics, and touch-point performance metrics — via a new dashboard repository against `/api/v1/merchant/dashboard/{overview,staff,touchpoints}`.
- `api-merchant-reviews`: Merchant Reviews / Private-feedback inbox — list with rating/source/resolution filters and a resolve mutation — against `/api/v1/merchant/dashboard/reviews` and `.../reviews/{id}/resolve`.
- `api-notifications`: Shared notification center for both roles — list, unread count, mark-one-read, mark-all-read — against `/api/v1/notifications/*`.
- `api-staff-dashboard`: Personal (staff) dashboard reads — profile (`/userprofile/me` + `/userprofile/verified-status`) and staff payment methods (`/staff/payment-methods`) — plus explicit empty-state behavior for tips/reviews/KPIs that have no backend endpoint yet.

## Impact

- **Files new**: `src/data/repositories/dashboard.js`; `src/data/hooks/useDashboard.js` (or per-hook additions to existing files).
- **Files modified**: `src/data/repositories/reviews.js`, `notifications.js`, `profileSettings.js`, `staffAccounts.js`; `src/data/hooks/useNotifications.js`, `useReviews.js`, `useProfileSettings.js`, `useStaffAccount.js`; `src/data/queryKeys.js`; `src/data/errorCodes.js`; merchant components (`Overview.jsx`, `ReportsView.jsx`, `StaffView.jsx`, `ReviewsView.jsx`, `TouchpointsView.jsx`, `dashboard/layout/DashboardHeader.jsx`); staff components (`StaffProfile.jsx`, `StaffPay.jsx`, `StaffNotifications.jsx`, `staff-dashboard/layout/StaffHeader.jsx`, and empty-state edits to `StaffHome.jsx` / `StaffTips.jsx` / `StaffReviews.jsx`); `src/contexts/StaffAccountContext.jsx`; `src/locales/en.json` / `vi.json`.
- **Endpoint casing** is lowercase throughout (`/api/v1/merchant/dashboard/*`, `/api/v1/notifications/*`, `/api/v1/userprofile/*`, `/api/v1/staff/*`) per the AI coding spec.
- **API dependency**: `https://nexora-dev-api.vlinkhub.com` (Dev) must be running for live smoke tests, with a merchant account that has data (tips/reviews/scans) and a staff account that has notifications.
- **No TypeScript** — JSX only; no type files added.
- **Out of scope** (deferred to follow-up changes): merchant/staff transaction & tip list views (no list endpoint), staff tips/earnings/reviews dashboards (no endpoint), staff management mutations (invite/status/reorder/unlink), touch-point CRUD (create/download/delete), business & staff payment-method edit/toggle from the dashboard, customer touch page, multi-staff tips, push-notification subscription.

## 1. Query Keys & Scaffolding

- [ ] 1.1 Extend `src/data/queryKeys.js` with `dashboardOverview()`, `dashboardStaff()`, `dashboardTouchpoints()`, `dashboardReviews(filters)`, `notificationsUnreadCount()`, `userProfile()`, `verifiedStatus()` (keep existing keys for backward compatibility)
- [ ] 1.2 Confirm `httpClient` GET helper returns parsed JSON and that ProblemDetails errors surface as `{ status, errorCode, errors, retryAfter }` (already done in foundation — no change expected)

## 2. Dashboard Repository (Merchant)

- [ ] 2.1 Create `src/data/repositories/dashboard.js` with `createDashboardRepository(client = httpClient)`
- [ ] 2.2 `getOverview()` → `GET /api/v1/merchant/dashboard/overview` → map raw DTO to the metric shape `Overview.jsx`/`ReportsView.jsx` consume (total tip amount, tip count, avg tip, scans, conversion rate, total/public/private reviews, avg rating, Google/Yelp clicks)
- [ ] 2.3 `getStaffMetrics()` → `GET /api/v1/merchant/dashboard/staff` → array of per-staff metrics
- [ ] 2.4 `getTouchpointMetrics()` → `GET /api/v1/merchant/dashboard/touchpoints` → array of per-touch-point metrics
- [ ] 2.5 `resolveReview(id, dto)` → `PUT /api/v1/merchant/dashboard/reviews/{id}/resolve` (body shape pending Open Question 5 — send `{}` until confirmed)
- [ ] 2.6 Export singleton `dashboardRepository`
- [ ] 2.7 Vitest: DTO→domain mapping for overview/staff/touchpoints, error propagation (mock `fetch`)

## 3. Reviews Repository Wiring

- [ ] 3.1 Replace `reviewsRepository.list()` stub with `list(filters)` → `GET /api/v1/merchant/dashboard/reviews` (encode supported filter params as query string; fall back to client-side filtering if params unconfirmed)
- [ ] 3.2 Add `resolve(id, dto)` → delegate to `PUT /api/v1/merchant/dashboard/reviews/{id}/resolve`
- [ ] 3.3 Normalize review DTO → existing review item shape (id, rating, routingType, text, staff, resolved, timestamp)
- [ ] 3.4 Remove/neutralize legacy `add()` / `update()` stubs (review creation is customer-touch, out of scope)
- [ ] 3.5 Vitest: list mapping, filter param building, resolve call shape, 404/403 propagation (mock `fetch`)

## 4. Notifications Repository Wiring

- [ ] 4.1 `list()` → `GET /api/v1/notifications` → normalize to `{ id, type, title, body, isRead, createdAt }`
- [ ] 4.2 `unreadCount()` → `GET /api/v1/notifications/unread-count` → return numeric count
- [ ] 4.3 `markRead(id)` → `PUT /api/v1/notifications/{id}/read`
- [ ] 4.4 `markAllRead()` → `PUT /api/v1/notifications/read-all`
- [ ] 4.5 Remove `add()` / `replaceAll()` client-side mutation stubs (notifications originate server-side)
- [ ] 4.6 Vitest: list mapping, unread-count, markRead/markAllRead call shapes (mock `fetch`)

## 5. Profile / Staff Account Repository Wiring

- [ ] 5.1 `profileSettingsRepository.get()` → `GET /api/v1/userprofile/me` → map to profile object (replace `null` stub)
- [ ] 5.2 Add `profileSettingsRepository.getVerifiedStatus()` → `GET /api/v1/userprofile/verified-status`
- [ ] 5.3 `staffAccountsRepository.get()` → compose from `profileSettingsRepository.get()` + `staffPaymentMethodsRepository.getAll()`; return `{ profile, paymentMethods, tips: [], staffReviews: [], kpis: { ...zeros, isPending: true } }`
- [ ] 5.4 Keep `staffAccountsRepository.save()` mapping to existing `updateUserProfile`/`updateStaffProfile` (already wired in onboarding) — confirm no regression
- [ ] 5.5 Vitest: profile mapping, composed staff account shape including `isPending` flag (mock `fetch`)

## 6. Hooks — Merchant Dashboard

- [ ] 6.1 Create `useDashboardOverview()` query hook (`qk.dashboardOverview()`) → `dashboardRepository.getOverview()`
- [ ] 6.2 Create `useDashboardStaff()` query hook (`qk.dashboardStaff()`)
- [ ] 6.3 Create `useDashboardTouchpoints()` query hook (`qk.dashboardTouchpoints()`)
- [ ] 6.4 Create `useDashboardReviews(filters)` query hook (`qk.dashboardReviews(filters)`) → `reviewsRepository.list(filters)`
- [ ] 6.5 Create `useResolveReview()` mutation hook → `reviewsRepository.resolve(id, dto)`, invalidate `qk.dashboardReviews()` (all) on success
- [ ] 6.6 Place hooks in `src/data/hooks/useDashboard.js` (or extend `useReviews.js` for the reviews ones); export consistently

## 7. Hooks — Notifications

- [ ] 7.1 Update `useNotifications()` to consume real `notificationsRepository.list()` (already keyed `qk.notifications()`)
- [ ] 7.2 Add `useUnreadCount()` query hook (`qk.notificationsUnreadCount()`) with `refetchInterval` ≈ 60s and `refetchOnWindowFocus: true`
- [ ] 7.3 Update `useMarkNotificationRead()` to call `markRead(id)`, invalidate `qk.notifications()` + `qk.notificationsUnreadCount()`
- [ ] 7.4 Add `useMarkAllNotificationsRead()` → `markAllRead()`, invalidate both keys
- [ ] 7.5 Remove `useAddNotification()` / `useReplaceAllNotifications()` (or make them no-op + deprecate) and migrate callers off them

## 8. Hooks — Staff Dashboard

- [ ] 8.1 Update `useProfileSettings()` to read from `profileSettingsRepository.get()` (`qk.userProfile()`)
- [ ] 8.2 Add `useVerifiedStatus()` query hook (`qk.verifiedStatus()`)
- [ ] 8.3 Update `useStaffAccount()` to resolve the composed account object from `staffAccountsRepository.get()`
- [ ] 8.4 Update `StaffAccountContext` to expose `account.profile`, `account.paymentMethods`, and `kpis.isPending` / empty `tips` / `staffReviews`

## 9. Component Wiring — Merchant

- [ ] 9.1 `src/components/dashboard/overview/Overview.jsx` → consume `useDashboardOverview()`; add loading + error + zero-activity states; remove transaction-derived KPI computation
- [ ] 9.2 `src/components/dashboard/views/ReportsView.jsx` → consume `useDashboardOverview()` (+ staff/touchpoint metrics); empty-state any chart that needed per-transaction data (deferred)
- [ ] 9.3 `src/components/dashboard/views/StaffView.jsx` → overlay `useDashboardStaff()` metrics onto the staff list; empty state when no metrics
- [ ] 9.4 `src/components/dashboard/views/ReviewsView.jsx` → consume `useDashboardReviews(filters)`; wire filter controls to the key; wire resolve button to `useResolveReview()`
- [ ] 9.5 `src/components/TouchpointsView.jsx` → overlay `useDashboardTouchpoints()` metrics; empty state when none
- [ ] 9.6 `src/components/TipsView.jsx` + `TransactionDetailModal.jsx` → render explicit empty state (no transaction-list endpoint — Open Question 1)
- [ ] 9.7 `src/components/dashboard/layout/DashboardHeader.jsx` → notification bell uses `useUnreadCount()` badge; panel uses `useNotifications()` + mark-read hooks

## 10. Component Wiring — Staff (Personal)

- [ ] 10.1 `src/components/staff-dashboard/views/StaffProfile.jsx` → render real profile from `useStaffAccount().profile` / `useProfileSettings()`
- [ ] 10.2 `src/components/staff-dashboard/views/StaffPay.jsx` → render payment methods from `staffPaymentMethodsRepository.getAll()` via the account/composed read; "configure a method" prompt when none active+configured
- [ ] 10.3 `src/components/staff-dashboard/views/StaffNotifications.jsx` → use `useNotifications()` + `useMarkNotificationRead()` + `useMarkAllNotificationsRead()`
- [ ] 10.4 `src/components/staff-dashboard/layout/StaffHeader.jsx` → bell uses `useUnreadCount()`
- [ ] 10.5 `src/components/staff-dashboard/views/StaffHome.jsx` → KPI tiles render `isPending` empty state (no fabricated earnings)
- [ ] 10.6 `src/components/staff-dashboard/views/StaffTips.jsx` → empty state pending `/staff/dashboard/tips` (Open Question 2)
- [ ] 10.7 `src/components/staff-dashboard/views/StaffReviews.jsx` → empty state pending `/staff/dashboard/reviews` (Open Question 2)

## 11. Error Codes & i18n

- [ ] 11.1 Extend `src/data/errorCodes.js` with any dashboard/notification/profile codes not already mapped (`COMMON_NOT_FOUND`, `COMMON_FORBIDDEN`, `COMMON_RATE_LIMIT_EXCEEDED`, `COMMON_INTERNAL_SERVER_ERROR` reuse foundation entries)
- [ ] 11.2 Add i18n strings (en + vi) for empty-state / "coming soon" copy: overview no-activity, reviews empty, notifications empty, staff tips/reviews/Home pending, transaction-history-unavailable
- [ ] 11.3 Add i18n for review-resolve success/error and notification mark-all-read

## 12. Verification

- [ ] 12.1 Run `pnpm test` — all existing + new Vitest pass
- [ ] 12.2 Run `pnpm build` — build succeeds
- [ ] 12.3 Run `pnpm lint:tokens` — no token violations
- [ ] 12.4 Live smoke (Dev, merchant w/ data): sign in → Overview shows real metrics → Reviews list loads → resolve a private feedback → Staff/Touchpoint metrics render → notification bell badge + mark-read works
- [ ] 12.5 Live smoke (Dev, staff account): sign in → Profile shows real data → Pay shows payment methods → Notifications feed + mark-all-read → Home/Tips/Reviews show intentional empty states (no console errors, no fake numbers)
- [ ] 12.6 Confirm no `console.*` left in touched app code; runtime logging goes through the project logger
- [ ] 12.7 `npx openspec validate integrate-dashboard-api --strict` passes

## Context

`integrate-api-foundation` established the HTTP/auth plumbing (`tokenStore`, Bearer injection, 401→refresh→retry, ProblemDetails error shape) and wired auth + onboarding. The app is now **API-only**: `src/auth/adapters/index.js` exports `apiAuthAdapter` directly; there is no `VITE_DATA_SOURCE` storage branch left in the auth path. Repositories call `httpClient` directly (the repository layer is the API boundary — Decision D1 of the foundation change).

The data-access boundary is unchanged: `components → data hooks (TanStack Query) → repositories → httpClient`. This change only fills the **dashboard read surfaces** that are still TODO stubs.

Scope: merchant dashboard reads (overview, staff metrics, touch-point metrics), merchant reviews inbox (+ resolve), shared notifications, and staff dashboard reads (profile, payment methods). Everything that needs a list endpoint the backend does not yet expose is rendered as an empty state and tracked as an Open Question.

## Goals / Non-Goals

**Goals:**
- Merchant dashboard tabs (Overview, Staff, Touch points, Reviews) display real aggregated metrics from `/api/v1/merchant/dashboard/*`.
- Merchant can filter private/unresolved reviews and mark them resolved.
- Both roles see a real notification feed with an accurate unread badge and can mark notifications read.
- Staff dashboard Profile and Pay views read real data from `/userprofile/me` and `/staff/payment-methods`.
- All reads are cached and invalidated through TanStack Query using `qk.*` keys.
- Views with no backing endpoint degrade to a clear, intentional empty state — never a crash or a fake number.

**Non-Goals:**
- Transaction/tip **list** views for either role (no list endpoint in the spec).
- Staff-facing tips/earnings/reviews analytics (no `/staff/dashboard/*` endpoint).
- Any write/mutation beyond review-resolve and notification read (staff management, touch-point CRUD, payment-method edit/toggle from the dashboard are deferred).
- Real-time push / websockets — unread count is refetched, not pushed.
- TypeScript migration.

## Decisions

### D1 — Dashboard metrics come from aggregated endpoints, not a transaction list

**Decision:** Add a dedicated `dashboardRepository` (`src/data/repositories/dashboard.js`) that calls the four `/api/v1/merchant/dashboard/*` endpoints and returns the aggregated metric DTOs. The merchant `Overview` / `ReportsView` consume these aggregates directly instead of computing KPIs client-side from a transaction list.

**Rationale:** The backend (§4.10) returns pre-aggregated metrics: total tip amount, tip count, average tip, total scans, conversion rate, total reviews, average rating, public/private review counts, Google/Yelp click counts. There is **no** `GET /merchant/transactions` endpoint. The current FE derives KPIs from a `transactions` array; that array can no longer be populated. Consuming the aggregate endpoint is both correct and cheaper than fetching and reducing a (non-existent) list.

**Consequence:** `transactionsRepository.list()` stays a stub returning `[]`. Components that listed individual transactions (`TipsView`, `TransactionDetailModal`, per-tx charts in `ReportsView`) render empty states. This is flagged as a backend dependency (Open Question 1).

### D2 — Merchant reviews are dashboard-scoped; wire `reviewsRepository` to the dashboard reviews endpoint

**Decision:** `reviewsRepository.list(filters)` → `GET /api/v1/merchant/dashboard/reviews` (supports rating/source/resolution filters as query params); `reviewsRepository.resolve(id, dto)` → `PUT /api/v1/merchant/dashboard/reviews/{id}/resolve`. The legacy `add()`/`update()` stubs are removed or left no-op (review creation is a customer-touch concern, out of scope).

**Rationale:** The only merchant-facing review endpoints in the spec are under `/merchant/dashboard/reviews`. Keeping reviews in the existing `reviewsRepository` preserves the `qk.reviews()` key and the `useReviews` consumer wiring; we extend the key to carry filters.

### D3 — Notifications: refetch-based unread count, no push

**Decision:** Wire `notificationsRepository` to all four `/api/v1/notifications/*` endpoints. Add a separate lightweight `useUnreadCount` query (`qk.notificationsUnreadCount()`) that the header bell consumes, with a modest `refetchInterval` (e.g. 60s) and refetch-on-focus. `markRead`/`markAllRead` mutations invalidate both `qk.notifications()` and `qk.notificationsUnreadCount()`.

**Rationale:** The spec exposes an explicit `unread-count` endpoint and no push channel. A cheap polled count keeps the badge fresh without fetching the full list; the full list is fetched only when the notification panel opens.

### D4 — Staff dashboard composes existing endpoints; tips/reviews are empty-state placeholders

**Decision:** `staffAccountsRepository.get()` composes the personal-dashboard account object from `GET /api/v1/userprofile/me` (identity/profile) + `GET /api/v1/staff/payment-methods` (Pay view). The composed object exposes `tips: []`, `staffReviews: []`, and zeroed `kpis` with an `isPending: true` flag so views can render "coming soon"/empty states deliberately rather than showing fake zeros as if they were real.

**Rationale:** There is no staff-facing tips/earnings/reviews endpoint (§4 lists none under `/staff/*` beyond payment-methods, profile, and invite). The `StaffAccountContext` already derives these from merchant data in storage mode; in API-only mode that source is gone. Composing the parts that *do* have endpoints lets Profile, Pay, and Notifications work today, while Home/Tips/Reviews show honest empty states until the backend ships `/staff/dashboard/*` (Open Question 2).

### D5 — Query-key additions, no key reshaping

**Decision:** Add new keys to `qk` rather than restructuring existing ones:
```js
dashboardOverview:        () => ['dashboard', 'overview'],
dashboardStaff:           () => ['dashboard', 'staff'],
dashboardTouchpoints:     () => ['dashboard', 'touchpoints'],
dashboardReviews:         (filters) => ['dashboard', 'reviews', filters ?? {}],
notificationsUnreadCount: () => ['notifications', 'unreadCount'],
userProfile:              () => ['userProfile'],
verifiedStatus:           () => ['userProfile', 'verifiedStatus'],
```
Existing `qk.transactions()`, `qk.reviews()`, `qk.notifications()`, `qk.staffAccount()` are kept for backward compatibility with current consumers; reviews list moves to `qk.dashboardReviews(filters)` where filtering is needed.

**Rationale:** Additive keys avoid touching unrelated consumers and keep invalidation explicit per the project's Query Ownership rule.

### D6 — DTO → domain normalization lives in repositories

**Decision:** Each repository maps the raw API DTO to the shape the existing components already expect (e.g. overview metric field names, review item shape, notification shape). Components are not rewritten around new DTO field names; the repository adapts.

**Rationale:** Matches the foundation pattern (`merchantsRepository.getSetup()` maps `BusinessDto` → the existing setup blob). Keeps component diffs minimal and the blast radius small.

## Risks / Trade-offs

**[Risk] Exact dashboard DTO field names** → §4.10 lists the metric *names* but not the JSON schema. Confirm field names (e.g. `totalTipAmount` vs `total_tip_amount`, nested vs flat) against the live Swagger before mapping in `dashboardRepository`. Mapping is isolated to the repository, so a rename is a one-file fix.

**[Risk] Reviews filter query-param contract** → The filter params (rating range, source, resolved flag) are not specified in the doc. Start with no params (full list) + client-side filtering as a fallback, and switch to server params once confirmed; the `qk.dashboardReviews(filters)` key already carries them.

**[Risk] Staff empty states read as "broken"** → Mitigate with explicit "Coming soon" / "No data yet" copy (i18n) and a short note, not a blank panel, so the Product Owner demo reads as intentional.

**[Risk] Unread-count polling cost** → 60s interval + refetch-on-focus is a balance; tune if the Dev backend rate-limits. Polling is paused when the tab is hidden (TanStack default).

**[Risk] Notification DTO shape** → Confirm whether `read` state is `isRead` boolean and whether timestamps are ISO strings; normalize in the repository.

## Migration Plan

1. Frontend-only change; backend is already deployed. No DB migration.
2. Land repository + hook wiring behind the existing query layer — no env flag needed (app is already API-only).
3. Verify with a seeded Dev merchant account (has tips/reviews/scans) and a staff account (has notifications).
4. Rollback: revert the repository/hook/component edits; the stubs returned empty data, so reverting degrades gracefully to empty dashboards rather than breaking.

## Open Questions

1. **Merchant transaction/tip list** — Is there (or will there be) a `GET /api/v1/merchant/dashboard/transactions` (or `/merchant/tips`) list endpoint to back `TipsView` and transaction-detail views? Until then they stay empty.
2. **Staff dashboard** — Will the backend expose staff-facing `/api/v1/staff/dashboard/overview`, `/staff/dashboard/tips`, `/staff/dashboard/reviews` so a staff member can see their own earnings and ratings? The personal Home/Tips/Reviews screens depend on this.
3. **Dashboard metrics DTO** — Confirm exact JSON field names and any date-range query params for `/merchant/dashboard/overview`.
4. **Reviews filters** — Confirm supported query params for `/merchant/dashboard/reviews` (rating, source, resolved/unresolved).
5. **Resolve review payload** — Does `PUT /reviews/{id}/resolve` take a body (e.g. `{ resolutionNote }`) or is it a bare state transition?

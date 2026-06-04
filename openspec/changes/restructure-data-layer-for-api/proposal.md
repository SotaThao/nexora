## Why

The app is a demo: there is no real backend. Every screen reads and writes domain data directly through `src/utils/storage.js` (a `localStorage` + `sessionStorage` + in-memory KV that mirrors an allowlist of keys into a single generic Supabase table `public.nexora_sync`). Cross-component freshness is achieved by dispatching and listening to `window` `storage` events, and `JSON.parse(localStorage...)` is scattered across components (17 occurrences in `Dashboard.jsx` alone). Authentication is mocked (`src/app/mockSso.js`, plain-text passwords in `nexora_pending_accounts`).

The real product will **remove `storage.js` + `supabase.js` and integrate a real backend API**. That swap is a later phase. This change is the **prerequisite FE restructure**: introduce the seams (a data-access layer, a server-state layer, an auth abstraction, and an HTTP client scaffold) so that components stop touching `storage`/`localStorage`/`window 'storage'` directly. After this phase, wiring the real API becomes a localized change behind stable interfaces — not a rewrite of 16 components.

This change is **behavior-preserving** (a regression-only refactor): the current Supabase/`storage` mechanism remains the implementation *behind* the new boundary. No endpoints are called yet.

## What Changes

- Add a **data-access layer** (`src/data/`): one repository module per domain entity (`merchants`, `transactions`, `reviews`, `notifications`, `staffAccounts`, `pendingAccounts`, `profileSettings`) exposing async CRUD methods. Each repository delegates to a single `storageAdapter` that wraps the existing `storage` util. The repository interface is the seam the future `apiAdapter` will satisfy.
- Add **TanStack Query** as the server-state layer: a `QueryClientProvider`, a central query-key registry (`src/data/queryKeys.js`), and per-domain query/mutation hooks (`src/data/hooks/`) that call the repositories. Components consume these hooks instead of reading `storage` and parsing JSON inline.
- **Replace `window 'storage'` event sync** (8 files) with Query cache + `invalidateQueries`. A single `storageEventBridge` (one listener) translates external/cross-tab `storage` events into targeted query invalidations during this phase, so the realtime behavior is preserved without per-component listeners.
- Add an **auth-session abstraction** (`src/auth/`): `AuthProvider` + `useAuth()` exposing `session`, `login`, `logout`, `status`. The current mock SSO becomes a `mockAuthAdapter` behind this interface; routing and components depend on `useAuth()`, not `mockSso` directly. Designed for an httpOnly-cookie session in the API phase.
- Add an **HTTP client foundation** (`src/lib/httpClient.js`) + env config (`VITE_API_BASE_URL`) + normalized error shape. Scaffolded and unit-covered but **not yet wired** to screens — it is the seam the future `apiAdapter`/`apiAuthAdapter` will use.
- Migrate the 16 storage-consuming files and 8 storage-event files to the new hooks/abstractions incrementally, one domain at a time, keeping the build green at each step.

## Capabilities

### New Capabilities
- `data-access-layer`: Per-domain repository modules with a stable async interface, backed by a swappable adapter (`storageAdapter` now, `apiAdapter` later). Single boundary for all domain reads/writes.
- `server-state-query`: TanStack Query setup, query-key registry, per-domain query/mutation hooks, and a single `storageEventBridge` replacing per-component `window 'storage'` listeners.
- `auth-session-abstraction`: `AuthProvider`/`useAuth()` wrapping the mock SSO behind a stable interface, with route/component dependence on the abstraction rather than `mockSso` directly.
- `api-client-foundation`: A `fetch`-based HTTP client, `VITE_API_BASE_URL` config, request/response/error normalization, and auth-token transport hook points — scaffolded for the API phase, not wired to screens.

### Modified Capabilities
<!-- No user-facing behavior in existing specs (merchant-dashboard, customer-tipping-review, register-wizard, etc.) changes. This is an implementation-boundary refactor; the affected components are listed under Impact. Behavior parity is asserted by the existing `verify-*` specs remaining green. -->

## Impact

- **New code**:
  - `src/data/adapters/storageAdapter.js` (+ `apiAdapter.js` stub), `src/data/repositories/{merchants,transactions,reviews,notifications,staffAccounts,pendingAccounts,profileSettings}.js`, `src/data/queryKeys.js`, `src/data/hooks/*`, `src/data/storageEventBridge.js`.
  - `src/auth/AuthProvider.jsx`, `src/auth/useAuth.js`, `src/auth/adapters/mockAuthAdapter.js` (+ `apiAuthAdapter.js` stub).
  - `src/lib/httpClient.js`, `src/lib/queryClient.js`.
  - Tests: repository + hook + httpClient + auth unit tests under `tests/unit/`.
- **Modified code**: `src/main.jsx` (wrap in `QueryClientProvider` + `AuthProvider`); the 16 files calling `storage.*`/`localStorage.*` directly and the 8 files using `window 'storage'` events (notably `Dashboard.jsx`, `App.jsx`, `AppRouter.jsx`, `useCustomerFlow.js`, `useStaffManagement.js`, `StaffAccountContext.jsx`, `useSettingsForm.js`, `useRegisterForm.js`, `useStaffRegistration.js`, `useSetupWizard.js`, `StaffMyQR.jsx`, `StaffReviews.jsx`, `StaffModal.jsx`, `DashboardHeader.jsx`, `SetupWizard.jsx`). `LanguageContext.jsx` keeps using `storage` directly for the language preference (client-only setting — intentionally NOT a server resource).
- **Dependencies**: Add `@tanstack/react-query` (+ optional `@tanstack/react-query-devtools` in dev). No other new runtime deps.
- **Data/backend**: None. `storage.js` + `supabase.js` + the `nexora_sync` table stay exactly as-is, now reached only via `storageAdapter`/`mockAuthAdapter`.
- **Out of scope (this phase)**:
  - Calling any real API endpoint (the `apiAdapter`/`apiAuthAdapter` remain stubs; wiring them is the next phase).
  - Removing `storage.js`/`supabase.js` (removed in the API phase once `apiAdapter` is live).
  - Fixing the transaction money-loss / RLS / monitoring BLOCKERs — those are server-side and land with the real API. This phase only ensures every transaction read/write already flows through `transactionsRepository` so the fix is a one-file swap.
  - Migrating the 596 inline `currentLanguage === 'vi' ? …` strings to `t()` (tracked separately).

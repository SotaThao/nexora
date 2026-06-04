## 1. Foundation (no behavior change)

- [ ] 1.1 Add `@tanstack/react-query` (and `@tanstack/react-query-devtools` as dev dep) to `package.json`; run install
- [ ] 1.2 Create `src/lib/queryClient.js` exporting a configured `QueryClient` (list `staleTime` ~30s, `gcTime` ~5min, mutations `retry: 0`)
- [ ] 1.3 Wrap the app in `src/main.jsx` with `QueryClientProvider` (devtools only in dev)
- [ ] 1.4 Create `src/lib/httpClient.js`: `fetch` wrapper with `VITE_API_BASE_URL`, JSON encode/decode, `credentials: 'include'`, normalized error `{ status, code, message, details }`, and request/response interceptor hook points
- [ ] 1.5 Add `VITE_API_BASE_URL` + `VITE_DATA_SOURCE` to `.env.example`; document defaults (`VITE_DATA_SOURCE=storage`)
- [ ] 1.6 Unit-test `httpClient` against a mocked `fetch` (success, 4xx/5xx → normalized error, network error)

## 2. Data-access layer (repositories + adapters)

- [ ] 2.1 Create `src/data/adapters/storageAdapter.js` wrapping the `storage` util (`get(key)`, `set(key, value)`, `remove(key)` with JSON serialize/parse — the ONLY domain `JSON.parse` site)
- [ ] 2.2 Create `src/data/adapters/apiAdapter.js` as a stub whose methods throw `NotImplemented` (future API phase)
- [ ] 2.3 Create `src/data/adapters/index.js` `getAdapter()` selecting by `import.meta.env.VITE_DATA_SOURCE` (default `storageAdapter`)
- [ ] 2.4 Create `src/data/queryKeys.js` central key factory (`qk.transactions`, `qk.merchantSetup`, `qk.profileSettings`, `qk.reviews`, `qk.notifications`, `qk.staffAccount`, `qk.pendingAccounts`)
- [ ] 2.5 Implement `src/data/repositories/transactions.js` (`list`, `add`, `update`) over the adapter
- [ ] 2.6 Implement `merchants.js` (`getSetup`, `saveSetup`, staff-list helpers), `profileSettings.js`, `reviews.js`, `notifications.js`, `staffAccounts.js`, `pendingAccounts.js`
- [ ] 2.7 Unit-test each repository against an in-memory fake adapter (round-trip, empty/missing key, malformed value fallback)

## 3. Server-state hooks & event bridge

- [ ] 3.1 Create per-domain hooks in `src/data/hooks/` (`useTransactions`, `useMerchantSetup`, `useProfileSettings`, `useReviews`, `useNotifications`, `useStaffAccount`, `usePendingAccounts`) wrapping `useQuery`/`useMutation` over repositories, with mutations calling `invalidateQueries`
- [ ] 3.2 Create `src/data/storageEventBridge.js`: single `window 'storage'` listener mapping changed key → `queryClient.invalidateQueries([qk…])`
- [ ] 3.3 Mount `storageEventBridge` once at app root (in a small effect in `App.jsx` or a dedicated provider)
- [ ] 3.4 Unit-test a representative hook (mocked repository) and the bridge key→queryKey mapping

## 4. Per-domain migration (one domain at a time; build + verify after each)

- [ ] 4.1 **Transactions** — replace direct `storage`/parse in `useCustomerFlow.js`, `Dashboard.jsx`, `tips/hooks/useTipsData.js` consumers, `StaffAccountContext.jsx` with `useTransactions`; remove their `window 'storage'` handling for tx; delete dead parse code
- [ ] 4.2 **Merchant setup** — migrate `Dashboard.jsx`, `useStaffManagement.js`, `SetupWizard.jsx`/`useSetupWizard.js`, `StaffModal.jsx`, `DashboardHeader.jsx` to `useMerchantSetup`
- [ ] 4.3 **Staff account** — migrate `StaffAccountContext.jsx`, `StaffMyQR.jsx`, `StaffReviews.jsx` to `useStaffAccount`
- [ ] 4.4 **Reviews** — migrate consumers to `useReviews`
- [ ] 4.5 **Notifications** — migrate consumers to `useNotifications`
- [ ] 4.6 **Profile settings** — migrate `useSettingsForm.js` to `useProfileSettings`
- [ ] 4.7 **Pending accounts** — migrate `useRegisterForm.js`, `useStaffRegistration.js` to `usePendingAccounts` (transitional; see auth phase)
- [ ] 4.8 After each domain: run `pnpm build` + the domain's `verify-*` checks; confirm no `window 'storage'` listener remains for that domain

## 5. Auth-session abstraction

- [ ] 5.1 Create `src/auth/adapters/mockAuthAdapter.js` porting `mockSso` logic verbatim (validate vs pending accounts, `!personal`/`!business` flag)
- [ ] 5.2 Create `src/auth/adapters/apiAuthAdapter.js` stub (cookie login/logout/`me` via `httpClient`) throwing `NotImplemented`
- [ ] 5.3 Create `src/auth/AuthProvider.jsx` + `src/auth/useAuth.js` exposing `{ session, status, login, logout }`, adapter selected by `VITE_DATA_SOURCE`
- [ ] 5.4 Wrap app in `AuthProvider` (`main.jsx`); route in `App.jsx`/`AppRouter.jsx` on `useAuth().session` instead of importing `mockSso`
- [ ] 5.5 Remove direct `mockSso` imports from components (`StaffModal.jsx`, `useRegisterForm.js`, `useSettingsForm.js`, `useStaffRegistration.js`, `StaffAccountContext.jsx`)
- [ ] 5.6 Unit-test `mockAuthAdapter` + `useAuth` against the `verify-authentication-login` scenarios (login success/failure, flag routing)

## 6. Gate, QA & docs

- [ ] 6.1 Grep gate: no `storage.getItem/setItem` or `localStorage.*` for domain keys, no `window 'storage'` listener, and no `mockSso` import OUTSIDE `src/data/adapters/`, `src/auth/adapters/`, `src/utils/storage.js`, and `src/contexts/LanguageContext.jsx`
- [ ] 6.2 Confirm `src/utils/supabase.js` is still reached only via `storage.js` (unchanged)
- [ ] 6.3 Run full `pnpm build` + `pnpm test`; all existing unit/e2e green (behavior parity)
- [ ] 6.4 Manual smoke: merchant dashboard, customer tip flow, staff dashboard, register, settings — verify no regressions (data loads, edits persist, cross-view freshness still works via bridge)
- [ ] 6.5 Update `CLAUDE.md` "Architecture" + this repo's data-flow notes: components → hooks → repositories → adapter; document `VITE_DATA_SOURCE` and the future API swap
- [ ] 6.6 Run `openspec validate restructure-data-layer-for-api` and confirm it passes

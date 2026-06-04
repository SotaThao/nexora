## Context

VLinkNexora is a React 18 + Vite (JSX, no TypeScript) SPA whose shell (`src/App.jsx`) is a `view` state machine. There is no real backend. Domain data lives in 7 logical keys (`nexora_merchant_setup`, `nexora_profile_settings`, `nexora_transactions`, `nexora_reviews`, `nexora_notifications`, `nexora_pending_accounts`, `nexora_staff_account`) accessed through `src/utils/storage.js`, which mirrors them into the generic Supabase KV table `public.nexora_sync` and emits/consumes `window 'storage'` events for cross-component/realtime freshness. Today **16 files call `storage.*`/`localStorage.*` directly, 8 files attach `window 'storage'` listeners, and `JSON.parse(localStorage…)` appears 60+ times** (17× in `Dashboard.jsx`). Auth is mocked in `src/app/mockSso.js` with plain-text passwords.

The product will replace `storage`/`supabase` with a real API. To make that a localized swap rather than a 16-component rewrite, this phase introduces the seams **now**, while the mock/storage implementation still backs them. The audited choices apply: **TanStack Query** for server state, **httpOnly-cookie** auth for the API phase, one consolidated change with phased tasks.

## Goals / Non-Goals

**Goals:**
- A single data-access boundary (repositories) so no component imports `storage`/`localStorage`/`supabase` for domain data.
- Server state owned by TanStack Query: components read via hooks; freshness via cache invalidation, not `window` events.
- One auth abstraction (`useAuth`) that hides whether auth is mock or real.
- An HTTP-client + env scaffold ready for the API phase, with the future adapter swap touching only `src/data/adapters/` and `src/auth/adapters/`.
- Zero user-facing behavior change; all existing `verify-*` specs stay green.

**Non-Goals:**
- Calling real endpoints, or removing `storage.js`/`supabase.js` (next phase).
- Server-side fixes (transaction integrity, RLS, monitoring) — these need the real API.
- Replacing React Context for `Language`/`Notification` (those stay; only domain data moves to Query).
- i18n string migration, TypeScript migration, list virtualization (tracked separately).

## Decisions

### D1: Repository + Adapter boundary (`src/data/`)
Each domain gets a repository (`src/data/repositories/<domain>.js`) exposing async methods (e.g. `transactionsRepository.list()`, `.add(tx)`; `merchantsRepository.getSetup()`, `.saveSetup(s)`). Repositories contain **no storage/JSON logic** — they call an injected `adapter`. The default `storageAdapter` (`src/data/adapters/storageAdapter.js`) wraps the existing `storage` util (get/set/remove + JSON serialization, the only place `JSON.parse` for domain data lives). A sibling `apiAdapter.js` ships as a stub throwing `NotImplemented`. **Rationale:** one seam; the API phase implements `apiAdapter` and flips a single factory. **Alternative considered:** put `fetch` calls directly in hooks — rejected (couples React to transport, can't unit-test data logic headless, no clean mock swap).

### D2: Adapter selection via one factory, env-gated
`src/data/adapters/index.js` exports `getAdapter()` returning `storageAdapter` unless `import.meta.env.VITE_DATA_SOURCE === 'api'` (default `'storage'`). Repositories import the resolved adapter once. **Rationale:** the API phase sets `VITE_DATA_SOURCE=api` to flip the whole app; during transition a per-domain override is possible. **Alternative:** compile-time import swap — rejected (no runtime/test toggle).

### D3: TanStack Query owns server state; React Context keeps only UI state
Add `@tanstack/react-query`. `src/lib/queryClient.js` configures the client (`staleTime` ~30s for lists, retry off for mutations). `src/main.jsx` wraps the tree in `QueryClientProvider`. Per-domain hooks in `src/data/hooks/` (`useTransactions`, `useMerchantSetup`, `useReviews`, `useNotifications`, `useStaffAccount`, …) wrap `useQuery`/`useMutation` over the repositories, with mutations calling `queryClient.invalidateQueries`. `LanguageContext`/`NotificationContext` remain (UI-only). **Rationale:** removes hand-rolled `localStorage`-as-state and the `window 'storage'` sync; gives caching, dedup, loading/error states for free; matches the project's frontend-code-standards. **Alternative:** keep Context + manual reducers — rejected (re-implements Query badly; doesn't address the event-sync anti-pattern).

### D4: `storageEventBridge` replaces 8 per-component `window 'storage'` listeners
A single module mounted once at app root listens for `window 'storage'` events (still emitted by `storage.js`/Supabase realtime this phase) and maps each changed key → `queryClient.invalidateQueries([queryKey])`. Per-component `addEventListener('storage', …)` blocks are deleted. **Rationale:** one listener, no cascade re-renders, and the bridge is the only thing that knows about `window` events — in the API phase it is replaced by Query refetch/websocket without touching components. **Alternative:** keep events per component — rejected (the current anti-pattern: races, cascades, duplicated parse logic).

### D5: Query-key registry (`src/data/queryKeys.js`)
Central exported factory (`qk.transactions()`, `qk.merchantSetup()`, `qk.staffAccount(staffId)`, …) so hooks, mutations, and the bridge reference identical keys. **Rationale:** invalidation correctness; one place maps storage keys ↔ query keys.

### D6: Auth abstraction (`src/auth/`) wrapping mock now, cookie-ready later
`AuthProvider` + `useAuth()` expose `{ session, status: 'loading'|'authenticated'|'anonymous', login(credentials), logout() }`. A `mockAuthAdapter` reproduces today's `mockSso` behavior (validate against `pendingAccounts`, flag `!personal`/`!business`); routing in `App.jsx`/`AppRouter.jsx` switches on `useAuth().session` instead of importing `mockSso`. The future `apiAuthAdapter` performs cookie-based login/logout/`me` via `httpClient`; `useAuth` does not change. **Rationale:** isolates the biggest BLOCKER (mock auth, plain-text passwords) behind one interface; the API phase swaps the adapter and stops persisting passwords. **Alternative:** leave `mockSso` imports in components — rejected (auth swap would touch every consumer; security fix can't be localized).

### D7: HTTP client scaffold, not wired (`src/lib/httpClient.js`)
A thin `fetch` wrapper: base URL from `VITE_API_BASE_URL`, JSON encode/decode, `credentials: 'include'` (for the cookie session), a normalized error `{ status, code, message, details }`, and a place to attach request/response interceptors (CSRF header, 401 → logout). Unit-tested against a mocked `fetch`. **Not imported by any screen this phase** — only the future `apiAdapter`/`apiAuthAdapter` will use it. **Rationale:** lets the API phase start from a tested transport; keeps the seam explicit.

### D8: `transactionsRepository` is the integrity choke point
All tip/transaction reads and writes (today scattered: `useCustomerFlow.js`, `Dashboard.jsx`, `TipsView` data, `StaffAccountContext.jsx`) route through `transactionsRepository`. The known money-loss bug (RAM + fire-and-forget Supabase push in `storage.js`) is **not** fixed here, but after this phase the fix is a single change inside `apiAdapter.addTransaction` (awaited server write) rather than spread across components. **Rationale:** make the future correctness fix one-file-localized; documented explicitly so it is not mistaken as fixed.

### D9: Decommission is deferred, not done
`storage.js`, `supabase.js`, and the `window 'storage'` emit side stay this phase (they back `storageAdapter` and the bridge). They are deleted in the API phase once `apiAdapter` + `apiAuthAdapter` are live and `VITE_DATA_SOURCE=api`. **Rationale:** keeps each phase shippable and behavior-preserving; avoids a big-bang.

## Risks / Trade-offs

- **Large surface (16 + 8 files)** → Mitigation: phased tasks, one domain at a time, build green after each; existing `verify-*` specs guard behavior.
- **Double source of truth during transition** (a component half-migrated reading both `storage` and a hook) → Mitigation: migrate per domain end-to-end; a domain is "done" only when no direct `storage` access for its keys remains (grep gate in tasks).
- **Query cache vs `_client_updated_at` last-write guard** could double-handle freshness → Mitigation: the bridge invalidates (refetch through adapter, which still honors the guard); no parallel reconciliation added.
- **TanStack Query bundle (~12kb gz)** → Acceptable; offset by deleting hand-rolled sync code and enabling future code-split.
- **Over-abstraction risk** (repos that are thin pass-throughs now) → Accepted deliberately: the thinness *is* the seam; value realizes at the API swap.
- **Auth adapter parity** — mock behavior must match exactly or login regresses → Mitigation: port `mockSso` logic verbatim into `mockAuthAdapter`; cover with the existing `verify-authentication-login` scenarios.

## Migration Plan

1. **Foundation (no behavior change):** add `@tanstack/react-query`; create `queryClient`, `QueryClientProvider`, `httpClient` (+ tests), `queryKeys`, `storageAdapter`, `apiAdapter` stub, adapter factory.
2. **Repositories:** implement all 7 repositories over `storageAdapter` (+ unit tests) — nothing consumes them yet.
3. **Hooks + bridge:** add per-domain Query hooks and `storageEventBridge`; mount the bridge once.
4. **Per-domain migration:** for each domain (start with `transactions`, then `merchantSetup`, `staffAccount`, `reviews`, `notifications`, `profileSettings`, `pendingAccounts`): replace direct `storage` reads/writes and `window 'storage'` listeners in its consumers with the hooks; delete the now-dead parse/sync code; build + verify.
5. **Auth:** introduce `AuthProvider`/`useAuth` + `mockAuthAdapter`; route via `useAuth`; remove direct `mockSso` imports from components.
6. **Gate:** grep confirms no domain `storage`/`localStorage`/`window 'storage'`/`mockSso` access outside `src/data/adapters/`, `src/auth/adapters/`, and `LanguageContext.jsx`.
- **Rollback:** the change is additive until each domain's consumers are switched; revert per-domain commits to fall back to direct `storage` access. The providers in `main.jsx` are inert if no hook is used.

## Open Questions

- **Cross-tab freshness in the API phase:** keep a `BroadcastChannel`-based bridge, rely on Query `refetchOnWindowFocus`, or add websockets? (This phase: keep the `window 'storage'` → invalidate bridge.)
- **Profile/language split:** `LanguageContext` persists language via `storage` directly and stays out of the repository layer — confirm language remains a pure client preference (not a server-synced user setting) when the API lands.
- **`pendingAccounts` fate:** in the API phase, registration likely becomes a server endpoint and `pendingAccounts`/plain-text passwords disappear entirely — confirm the repository is a transitional shim, not a long-lived resource.
- **Optimistic updates:** which mutations (tip confirm, staff edits) warrant optimistic cache updates vs invalidate-and-refetch? (Default this phase: invalidate-and-refetch.)

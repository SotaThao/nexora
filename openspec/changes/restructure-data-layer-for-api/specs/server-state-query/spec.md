## ADDED Requirements

### Requirement: Server state owned by TanStack Query
Domain server state SHALL be managed by TanStack Query. The app SHALL be wrapped in a `QueryClientProvider`, and components SHALL read domain data via per-domain Query hooks (`src/data/hooks/`) rather than reading `storage`/`localStorage` and parsing JSON inline.

#### Scenario: Component consumes a query hook
- **WHEN** a component needs merchant setup
- **THEN** it calls `useMerchantSetup()` and receives `{ data, isLoading, error }` from the Query cache, with no inline `JSON.parse(localStorage…)`

#### Scenario: Reads are cached and deduped
- **WHEN** two components mount and both request the same domain query in the same render cycle
- **THEN** the underlying repository is invoked once and both components read from the shared cache entry

### Requirement: Mutations invalidate affected queries
Writes SHALL go through Query mutations that, on success, invalidate the affected query keys so dependent views refresh, instead of components manually re-reading storage.

#### Scenario: Editing data refreshes dependents
- **WHEN** a mutation updates a domain entity (e.g. adds a transaction or edits a staff member)
- **THEN** the related query keys are invalidated and any mounted view showing that data re-renders with fresh data

### Requirement: Single storage-event bridge replaces per-component listeners
A single `storageEventBridge` SHALL listen for `window 'storage'` events and translate each changed key into targeted `invalidateQueries` calls. No component SHALL register its own `window 'storage'` listener.

#### Scenario: External change refreshes via the bridge
- **WHEN** a `window 'storage'` event fires for a domain key (cross-tab or Supabase realtime)
- **THEN** the bridge invalidates the mapped query key and the relevant views refetch, with exactly one global `storage` listener active

#### Scenario: No per-component storage listeners remain
- **WHEN** the migration is complete
- **THEN** the 8 previously identified files no longer attach `addEventListener('storage', …)`; only `storageEventBridge` does

### Requirement: Central query-key registry
Query keys SHALL be defined once in `src/data/queryKeys.js` and reused by hooks, mutations, and the bridge so invalidation targets match exactly.

#### Scenario: Hook and bridge use the same key
- **WHEN** a hook reads `qk.transactions()` and the bridge invalidates on a `nexora_transactions` change
- **THEN** both reference the identical key from the registry and the invalidation hits the hook's cache entry

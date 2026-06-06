## ADDED Requirements

### Requirement: Domain data accessed only through repositories
All domain data (merchant setup, profile settings, transactions, reviews, notifications, pending accounts, staff accounts) SHALL be read and written exclusively through per-domain repository modules under `src/data/repositories/`. No component, page, or feature hook outside `src/data/` SHALL call `storage`, `localStorage`, `sessionStorage`, or `supabase` for domain data.

#### Scenario: A screen reads transactions via the repository
- **WHEN** a screen needs tip/transaction data
- **THEN** it obtains it from `transactionsRepository` (via its Query hook), and no direct `storage`/`localStorage` read for `nexora_transactions` exists in that screen

#### Scenario: Grep gate passes
- **WHEN** the repository migration is complete
- **THEN** searching the codebase finds no `storage.getItem`/`setItem` or `localStorage.*` for domain keys outside `src/data/adapters/`, `src/utils/storage.js`, and `src/contexts/LanguageContext.jsx`

### Requirement: Repositories delegate to a swappable adapter
Each repository SHALL contain no storage or JSON-serialization logic and SHALL delegate persistence to an injected adapter resolved by `getAdapter()`. The default adapter SHALL be `storageAdapter` (wrapping the existing `storage` util); an `apiAdapter` stub SHALL exist for the future API phase.

#### Scenario: Default adapter is storage-backed
- **WHEN** `VITE_DATA_SOURCE` is unset or `'storage'`
- **THEN** `getAdapter()` returns `storageAdapter` and repositories persist via the existing `storage` util with unchanged behavior

#### Scenario: API adapter is selectable but not implemented
- **WHEN** `VITE_DATA_SOURCE` is `'api'`
- **THEN** `getAdapter()` returns `apiAdapter`, whose methods throw `NotImplemented` until the API phase

### Requirement: Repository interface is transport-agnostic
Repository method signatures SHALL express domain intent (e.g. `list()`, `add(entity)`, `getSetup()`, `saveSetup(setup)`) and SHALL NOT leak storage keys, JSON strings, or `window` events to callers, so that swapping `storageAdapter` for `apiAdapter` requires no change to repository consumers.

#### Scenario: Adapter swap does not change consumers
- **WHEN** the adapter behind a repository changes from `storageAdapter` to `apiAdapter`
- **THEN** no repository consumer (hook or component) requires code changes for that swap

### Requirement: Behavior parity with the current storage mechanism
The repository layer SHALL preserve current observable behavior while backed by `storageAdapter`, including the `_client_updated_at` last-write guard and Supabase mirroring performed inside `storage.js`.

#### Scenario: Existing flows behave identically
- **WHEN** the app runs with `storageAdapter` after migration
- **THEN** all existing `verify-*` specs (authentication, merchant dashboard, customer tipping, register, settings, staff) remain green

## ADDED Requirements

### Requirement: Staff data persisted via the sync store
Staff-owned data SHALL be stored under a `nexora_staff_account` key through the `storage` util so it is persisted to the `public.nexora_sync` table when Supabase is configured, with no new database schema.

#### Scenario: Staff key syncs to Supabase
- **WHEN** the staff account data is written through the `storage` util and Supabase is configured
- **THEN** the value is upserted into `nexora_sync` under the `nexora_staff_account` key

#### Scenario: Falls back to local storage when Supabase is absent
- **WHEN** Supabase is not configured
- **THEN** the staff account data is read from and written to local/session storage without errors

### Requirement: Staff key registered as a dynamic key
The `nexora_staff_account` key SHALL be registered in the `DYNAMIC_KEYS` allowlist in `src/utils/storage.js` so it participates in migration, pull, and realtime sync like other dynamic keys.

#### Scenario: Realtime update propagates
- **WHEN** the `nexora_staff_account` row changes in Supabase
- **THEN** the app receives the realtime update and refreshes the staff state, subject to the `_client_updated_at` last-write guard

### Requirement: Single source of truth with merchant data
Tip and KPI data SHALL be derived from the shared `nexora_transactions` data filtered by `staffId`, and profile/linked-business basics from `nexora_merchant_setup`, rather than duplicated into the staff key.

#### Scenario: Merchant-generated tip appears for the staff
- **WHEN** a transaction for the staff's `staffId` is present in `nexora_transactions`
- **THEN** it is reflected in the staff's Home KPIs and Tips list

### Requirement: Repeatable demo seed script
A Node script `scripts/seed-staff-demo.js` SHALL upsert demo data (merchant setup, transactions, and one staff account) into `nexora_sync` using the anon key from `.env`, and SHALL be safe to run repeatedly.

#### Scenario: Seeding prepares the demo
- **WHEN** `node scripts/seed-staff-demo.js` is run with Supabase configured
- **THEN** the demo merchant setup, transactions, and staff account exist in `nexora_sync`

#### Scenario: Re-running does not duplicate
- **WHEN** the seed script is run more than once
- **THEN** existing demo rows are upserted (overwritten) rather than duplicated

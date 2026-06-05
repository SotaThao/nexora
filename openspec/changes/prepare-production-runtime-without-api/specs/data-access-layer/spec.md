## MODIFIED Requirements

### Requirement: Domain data accessed only through repositories

All domain data (merchant setup, profile settings, transactions, reviews, notifications, pending accounts, staff accounts) SHALL be read, written, and removed exclusively through per-domain repository modules under `src/data/repositories/`. No component, app shell, context, or feature hook outside the allowed boundaries SHALL call `storage`, `localStorage`, `sessionStorage`, or `supabase` for domain data.

Allowed boundaries are `src/data/adapters/`, `src/auth/adapters/` during the mock-auth transition, `src/utils/storage.js`, `src/utils/supabase.js`, `src/setupTests.js`, and `src/contexts/LanguageContext.jsx` for client language preference only.

#### Scenario: Expanded grep gate passes
- **WHEN** production-runtime hardening is complete
- **THEN** searching `src` for domain-key usage with `getItem`, `setItem`, or `removeItem` outside allowed boundaries returns no results

### Requirement: Feature writes use one mutation ownership path

Feature hooks and components SHALL write domain data through Query mutation hooks or repository APIs when hooks cannot be used. A single user action SHALL NOT perform both a direct repository save and an equivalent mutation for the same domain write.

#### Scenario: Registration adds staff through one write path
- **WHEN** a registration flow adds a staff member to merchant setup
- **THEN** it persists the setup through one mutation/repository path
- **AND** it does not manually dispatch a storage event

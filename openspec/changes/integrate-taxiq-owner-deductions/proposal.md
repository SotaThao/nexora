## Why

`/dashboard/taxiq/deductions` currently renders the shared `ComingSoon` placeholder via `makeTaxIqRoute('taxiq-deductions')`. The Owner has no way to record business expenses, get an AI deductibility read, or manage the CPA-review/receipt-missing workflow described in the business spec (§QT-02).

This change implements the Deduction Center per `docs/plan/tasks/taxiq/fe-tasks/US-02-taxiq-fe-owner-deduction-center.md`: a filterable deduction list with running total, a 5-step "Add Deduction" flow (category/amount → business-use % → receipt → AI review → save), and per-record actions (submit, re-analyze, approve CPA review).

## What Changes

- Add `taxiqDeductionCategories` repository + hook — read-only category list for the Step 1 dropdown, filtered by `applicableRole`.
- Add `taxiqOwnerDeductions` repository + hooks — list (with running total), create (Draft), update, submit (triggers AI evaluation), reanalyze, approve-cpa.
- Add `taxiqReceipts` repository + hook — upload a receipt against an `OwnerTaxYearId`, then link it to a deduction record. Scoped to only the two operations this ticket needs (upload + link); the full Receipt Vault (list/resolve-duplicate) is a separate future ticket.
- Build `DeductionCenterView.tsx` — status/category filter, status badges, running `DeductibleAmount` total (excludes Draft per DR-CORE-001), empty state, loading skeleton, per-row actions (Submit, Re-analyze, Approve, Edit).
- Build `AddDeductionWizard.tsx` — 5-step modal: (1) category + description + amount + date + vendor, (2) business-use % (only when `category.requiresBusinessUsePercent`), (3) receipt upload or skip, (4) AI review result + mandatory disclaimer, (5) review + Save-as-Draft / Submit.
- Build `shared/ReceiptUploadStep.tsx` — new shared component (no prior "Receipt Vault" component exists to reuse, despite the ticket's wording).
- Wire `TaxIqDeductionsRoute` in `routes/index.tsx` to the real view, gated on an existing `OwnerTaxYear` (falls back to a "complete Tax IQ setup first" prompt if the Owner hasn't onboarded yet).
- Branch all mutation failures on `error.errorCode`, not HTTP status — this backend feature returns `400` uniformly (see Decisions).

## Capabilities

### New Capabilities

- `taxiq-owner-deductions`: create/list/update/submit/reanalyze/approve-cpa deduction records for the current Owner tax year; read deduction categories; upload and link a receipt to a deduction.

## Impact

- **Files likely new**: `src/data/repositories/taxiqOwnerDeductions.ts`, `src/data/repositories/taxiqDeductionCategories.ts`, `src/data/repositories/taxiqReceipts.ts`, `src/data/hooks/useTaxiqOwnerDeductions.ts`, `src/data/hooks/useTaxiqDeductionCategories.ts`, `src/data/hooks/useTaxiqReceipts.ts`, `src/components/dashboard/views/taxiq/DeductionCenterView.tsx`, `src/components/dashboard/views/taxiq/AddDeductionWizard.tsx`, `src/components/dashboard/views/taxiq/shared/ReceiptUploadStep.tsx`.
- **Files likely modified**: `src/data/queryKeys.ts`, `src/components/dashboard/routes/index.tsx`, `src/locales/en.json`, `src/locales/vi.json`.
- **Data boundary**: components -> data hooks -> repository -> `httpClient`. No direct `fetch`/storage access from components.
- **Non-goals**: Admin category management UI (US-03, backend-only in this phase); the full Receipt Vault screen (`/dashboard/taxiq/receipts`, separate ticket — stays on `ComingSoon`); generic `SmartFieldSchema`-driven dynamic fields (no defined JSON contract exists yet; Step 2 only handles the one concretely-specified smart field, Business-use %, via the typed `requiresBusinessUsePercent` flag — deferred to a follow-up once BE/Admin defines the schema shape); Adjustment flow for locked tax years (US-08, linked out to only).

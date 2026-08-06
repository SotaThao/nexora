## Why

Tax IQ currently has no way for a Business Owner to record Gross Sales/Income — every existing
Owner-side entity (`DeductionRecord`, `PayoutRecord`, `EquipmentAsset`, `GiftCardLiability`) is a
cost or liability, never a revenue figure. CPAs need Gross Receipts as the starting point for
Schedule C / Form 1120-S / 1065 (`Net Income = Gross Receipts − Deductions`), so without this the
Owner CPA package is missing a required input (see
`vlink-nexora/docs/business/taxiq/NEXORA_TaxIQ_Enhancement_CPA_Data_Sufficiency.md`, gap 🔴 #0/#3).

Backend now supports this (Enhancement Ticket 1, built this session — see
`vlink-nexora/docs/business/taxiq/NEXORA_TaxIQ_Enhancement_Tickets.md` and
`vlink-nexora/docs/plan/tasks/taxiq/be-tasks/test-cases/ENH-TICKET-01-taxiq-owner-income-summary-test.md`):
a new `OwnerIncomeRecord` entity + `OwnerIncomeController` (`api/v1/taxiq/owner/incomes`), mirroring
the existing Staff `SelfReportedIncome` feature almost 1:1 (same $2,000 no-receipt threshold, same
CRUD + link-receipt shape), scoped by `OwnerTaxYearId` instead of `StaffTaxYearId`.

## What Changes

- Add `taxiqOwnerIncome` repository + `useTaxiqOwnerIncome` hooks + `qk.taxiqOwnerIncome` query
  key — parallel to the existing Staff-only `taxiqSelfReportedIncome`, not merged into it (same
  convention already used for `taxiqOwnerDeductions`/`taxiqStaffDeductions`).
- Add `OwnerIncomeSummaryListView.tsx` + `OwnerIncomeWizard.tsx` under
  `src/components/dashboard/views/taxiq/`, mirroring `IncomeSummaryListView.tsx` +
  `SelfReportedIncomeWizard.tsx` (Staff side), with `incomeType` options swapped to the Owner set
  (`ServiceRevenue`/`ProductRetailRevenue`/`Other` instead of Staff's
  `CashFromClient`/`OtherSalonIncome`/`BoothRentFromSubRenter`/`Other`).
- Generalize `ReceiptUploadStep.tsx` to accept an optional `ownerIncomeRecordId` prop, parallel to
  the existing `selfReportedIncomeId` prop (same dual-id generalization pattern already applied
  there for US-13).
- Add a new Owner Tax IQ sidebar entry + route (`/dashboard/taxiq/income` →
  `TaxIqIncomeRoute`), mirroring `TaxIqDeductionsRoute`.

## Capabilities

### New Capabilities

- `taxiq-owner-income-summary`: create/list/edit/delete Owner Gross Income records for the
  current `OwnerTaxYear`, with the same $2,000 no-receipt-required-review threshold and
  Locked-tax-year read-only behavior already established for Staff Self-Reported Income.

## Impact

- **Files likely new**: `src/data/repositories/taxiqOwnerIncome.ts`,
  `src/data/hooks/useTaxiqOwnerIncome.ts`,
  `src/components/dashboard/views/taxiq/OwnerIncomeSummaryListView.tsx`,
  `src/components/dashboard/views/taxiq/OwnerIncomeWizard.tsx`.
- **Files likely modified**: `src/data/queryKeys.ts`, `src/data/errorCodes.ts`,
  `src/components/dashboard/views/taxiq/shared/ReceiptUploadStep.tsx`,
  `src/components/dashboard/routes/index.tsx`, `src/app/AppRouter.tsx`,
  `src/components/dashboard/constants.tsx`, `src/locales/en.json`, `src/locales/vi.json`.
- **Data boundary**: components -> data hooks -> repository -> `httpClient`. No direct
  `fetch`/storage access from components.
- **Non-goals**: an Owner Gross Income total on the Tax IQ home dashboard card (backend
  `OwnerTaxYearDto` does not expose an aggregate — matches the existing precedent where
  `StaffTaxYearDto` also has no Self-Reported Income total); any Sales-Tax or POS-style
  payment-method breakdown (explicitly out of scope per the BE enhancement doc); wiring this
  feature to an `EnabledModules` toggle (backend has no corresponding `TaxIqModule` entry for it,
  same as `equipment`/`cpa-access` today).

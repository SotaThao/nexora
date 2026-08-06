## Why

`StaffYearEndExportView.tsx` currently shows a static "locked" banner once `StaffTaxYear.Status
=== 'Locked'` and offers no way to correct a mistaken value afterward. Owner already has this
capability (US-06, `YearEndExportView.tsx` + `CreateAdjustmentModal.tsx`), but Staff hits a
permanent dead end — `AddDeductionWizard.tsx` (scope="staff"), `SelfReportedIncomeWizard.tsx`,
`CashTipLogTab.tsx`, and `MileageLogTab.tsx` all catch `TAXIQ_STAFF_TAX_YEAR_LOCKED` and show a
message-only banner with no action button.

Backend now supports this (see `vlink-nexora/docs/plan/tasks/taxiq/be-tasks/test-cases/US-18-taxiq-staff-adjustment-test.md`):
`CreateAdjustmentRecordCommand`/`GetAdjustmentHistoryQuery` were generalized to accept
`StaffTaxYearId` alongside `OwnerTaxYearId`, `StaffTaxYearController` now exposes
`POST/GET tax-years/{id}/adjustments`, and `GenerateFinalExportCommand` was extended so Staff
also gets Amended Export v2/v3 when a new Adjustment is created after a prior export — matching
Owner's behavior.

## What Changes

- Add `taxiqStaffAdjustments` repository (`STAFF_ADJUSTMENT_ENTITY_FIELD_MAP` covering
  `DeductionRecord`/`MileageLog`/`CashTipLog`/`SelfReportedIncome`, `createAdjustment`,
  `listAdjustments`) + `useTaxiqStaffAdjustments` hooks + `qk.taxiqStaffAdjustments` query key —
  parallel to the existing Owner-only `taxiqOwnerAdjustments`/`useTaxiqOwnerTaxYearLock`, reusing
  shared DTO/type shapes rather than duplicating them.
- Generalize `CreateAdjustmentModal.tsx` to accept dual optional `ownerTaxYearId?`/
  `staffTaxYearId?` (mirrors the existing `ReceiptUploadStep.tsx` dual-id precedent, not the
  `scope` prop pattern used by `AddDeductionWizard`), selecting the Owner or Staff field map/hook
  based on which id is present.
- Add a Create Adjustment section + adjustment history list to `StaffYearEndExportView.tsx`,
  inside the `isLocked` branch — mirrors `YearEndExportView.tsx`'s existing Adjustment card.
- Add an action button (navigate to `/staff/taxiq/export`) to the Locked banners in
  `AddDeductionWizard.tsx` (relax the existing `!isStaff` guard), `SelfReportedIncomeWizard.tsx`,
  and `CashTipLogTab.tsx`/`MileageLogTab.tsx` (via the shared banner in `LogsView.tsx`).

## Capabilities

### New Capabilities

- `taxiq-staff-adjustment`: create/list Adjustment Records for the current Staff tax year once
  Locked; surface an action button from every Staff Locked-error banner to reach the Adjustment
  UI.

## Impact

- **Files likely new**: `src/data/repositories/taxiqStaffAdjustments.ts`,
  `src/data/hooks/useTaxiqStaffAdjustments.ts`.
- **Files likely modified**: `src/data/queryKeys.ts`,
  `src/data/repositories/taxiqOwnerAdjustments.ts` (export the shared `normalizeAdjustment` and
  widen `AdjustmentRecordApiDto`/`AdjustmentRecord` to the dual-nullable `ownerTaxYearId`/
  `staffTaxYearId` shape the BE now returns),
  `src/components/dashboard/views/taxiq/modals/CreateAdjustmentModal.tsx`,
  `src/components/staff-dashboard/views/taxiq/StaffYearEndExportView.tsx`,
  `src/components/dashboard/views/taxiq/AddDeductionWizard.tsx`,
  `src/components/staff-dashboard/views/taxiq/SelfReportedIncomeWizard.tsx`,
  `src/components/staff-dashboard/views/taxiq/IncomeSummaryListView.tsx` (discovered during live
  testing — this is the screen's actually-reachable locked banner, not the wizard),
  `src/components/staff-dashboard/views/taxiq/tabs/CashTipLogTab.tsx`,
  `src/components/staff-dashboard/views/taxiq/tabs/MileageLogTab.tsx`,
  `src/components/staff-dashboard/views/taxiq/LogsView.tsx`,
  `src/locales/en.json`, `src/locales/vi.json`.
- **Data boundary**: components -> data hooks -> repository -> `httpClient`. No direct
  `fetch`/storage access from components.
- **Non-goals**: changing Owner's existing Adjustment UI/behavior beyond the type widening noted
  above; a full multi-version Export history list (BE only ever surfaces the latest
  `ExportPackage`, same limitation already accepted for Owner); CPA/Owner creating an Adjustment
  on a Staff's behalf (BE only allows the Staff themselves, per TL decision).

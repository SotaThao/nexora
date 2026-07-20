## ADDED Requirements

### Requirement: Owner Income Data Layer
The frontend SHALL provide a repository and hooks for creating, listing, updating, deleting, and
linking receipts to Owner Income Records scoped to an `OwnerTaxYearId`.

#### Scenario: Create income record
- **WHEN** `useCreateOwnerIncome().mutateAsync` is called with an `ownerTaxYearId` and income fields
- **THEN** the frontend SHALL call `POST /api/v1/taxiq/owner/incomes`
- **AND** on success SHALL invalidate `qk.taxiqOwnerIncome(ownerTaxYearId)`

#### Scenario: List income records
- **WHEN** `useTaxiqOwnerIncomeList(ownerTaxYearId)` is used with a known id
- **THEN** the frontend SHALL call `GET /api/v1/taxiq/owner/incomes?ownerTaxYearId=...`
- **AND** normalize each item's `receipts` array into a `hasReceipt` boolean, same convention as
  `taxiqSelfReportedIncome.ts`

#### Scenario: Link a receipt
- **WHEN** `useLinkReceiptToOwnerIncome().mutateAsync` is called with `{ id, ownerTaxYearId, receiptId }`
- **THEN** the frontend SHALL call `POST /api/v1/taxiq/owner/incomes/{id}/receipts`
- **AND** on success SHALL invalidate `qk.taxiqOwnerIncome(ownerTaxYearId)`

### Requirement: Owner Income Type Options
The Owner Income wizard SHALL offer exactly the Owner-side income type set and SHALL NOT offer
Staff-only income types.

#### Scenario: Income type selector
- **WHEN** `OwnerIncomeWizard` renders its details step
- **THEN** the income type selector SHALL offer exactly `ServiceRevenue`, `ProductRetailRevenue`,
  `Other`
- **AND** SHALL NOT offer `CashFromClient`, `OtherSalonIncome`, or `BoothRentFromSubRenter`
  (Staff-only)

### Requirement: Receipt Upload Step Supports Owner Income Records
`ReceiptUploadStep` SHALL support linking an uploaded receipt to an Owner Income Record via a
third optional id, alongside its existing Deduction and Self-Reported Income support.

#### Scenario: Uploaded with ownerIncomeRecordId
- **WHEN** `ReceiptUploadStep` receives `ownerIncomeRecordId` set and `deductionRecordId`/
  `selfReportedIncomeId` unset
- **THEN** after upload it SHALL call the Owner Income link-receipt mutation
- **AND** existing behavior for `deductionRecordId`/`selfReportedIncomeId` SHALL remain unchanged

### Requirement: Owner Income Summary Sidebar Entry And Route
The Owner dashboard SHALL expose an always-visible "Income Summary" entry under the Tax IQ
sidebar section, independent of any `EnabledModules` toggle.

#### Scenario: Sidebar visibility
- **WHEN** the Owner dashboard sidebar renders the Tax IQ section
- **THEN** it SHALL show an "Income Summary" child item unconditionally (no module-gate check),
  same as `equipment` and `cpa-access` today

#### Scenario: Route resolves to the list view
- **WHEN** the Owner navigates to `/dashboard/taxiq/income` with an existing `OwnerTaxYear`
- **THEN** the frontend SHALL render `OwnerIncomeSummaryListView` scoped to that `ownerTaxYearId`

#### Scenario: No Owner tax year yet
- **WHEN** the Owner navigates to `/dashboard/taxiq/income` with no `OwnerTaxYear` for the current
  tax year
- **THEN** the frontend SHALL show the same "complete Tax IQ setup" prompt used by
  `TaxIqDeductionsRoute` today, linking back to `/dashboard/taxiq`

### Requirement: Locked Tax Year Blocks Owner Income Mutations
`OwnerIncomeSummaryListView` SHALL disable create/edit/delete actions once
`OwnerTaxYear.Status === 'Locked'` and provide a path to the Export screen.

#### Scenario: Locked tax year
- **WHEN** `ownerTaxYearStatus === 'Locked'`
- **THEN** the Add button SHALL be disabled and row Edit/Delete actions SHALL be replaced by a
  Locked indicator
- **AND** a banner SHALL render with an action button navigating to `/dashboard/taxiq/export`

#### Scenario: Backend rejects a mutation after lock (race condition)
- **WHEN** a create/update/delete/link-receipt call returns `400 TAXIQ_OWNER_TAX_YEAR_LOCKED`
- **THEN** the frontend SHALL show an inline Locked banner with the same action button, not a
  generic error toast

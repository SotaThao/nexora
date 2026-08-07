## ADDED Requirements

### Requirement: Staff Adjustment Data Layer
The frontend SHALL provide a repository and hooks for creating and listing Adjustment Records
scoped to a `StaffTaxYearId`, parallel to the existing Owner-scoped implementation.

#### Scenario: Create adjustment
- **WHEN** `useCreateStaffAdjustment().mutateAsync` is called with a `staffTaxYearId` and
  `CreateAdjustmentParams`
- **THEN** the frontend SHALL call `POST /api/v1/taxiq/staff/tax-years/{staffTaxYearId}/adjustments`
- **AND** on success SHALL invalidate `qk.taxiqStaffAdjustments(staffTaxYearId)`

#### Scenario: List adjustment history
- **WHEN** `useStaffAdjustments(staffTaxYearId)` is used with a known id
- **THEN** the frontend SHALL call `GET /api/v1/taxiq/staff/tax-years/{staffTaxYearId}/adjustments`
- **AND** normalize each item through the same `normalizeAdjustment` mapping used for Owner

### Requirement: Staff-Adjustable Entity Field Whitelist
`STAFF_ADJUSTMENT_ENTITY_FIELD_MAP` SHALL mirror the backend's whitelist exactly for the four
Staff-owned entity types, and SHALL NOT include Owner-only entity types.

#### Scenario: Supported entity types
- **WHEN** the Create Adjustment modal is opened for a `staffTaxYearId`
- **THEN** the entity type selector SHALL offer exactly `DeductionRecord`, `MileageLog`,
  `CashTipLog`, `SelfReportedIncome`
- **AND** SHALL NOT offer `PayoutRecord`, `EquipmentAsset`, `GiftCardLiability`, or
  `MembershipCredit` (Owner-only)

### Requirement: Create Adjustment Modal Supports Both Owner and Staff Scope
`CreateAdjustmentModal` SHALL select its entity-type field map and create-adjustment hook based
on which of `ownerTaxYearId`/`staffTaxYearId` is provided, without a separate `scope` prop.

#### Scenario: Opened with staffTaxYearId
- **WHEN** the modal receives `staffTaxYearId` set and `ownerTaxYearId` unset
- **THEN** it SHALL use `STAFF_ADJUSTMENT_ENTITY_FIELD_MAP` and `useCreateStaffAdjustment`

#### Scenario: Opened with ownerTaxYearId (existing behavior preserved)
- **WHEN** the modal receives `ownerTaxYearId` set and `staffTaxYearId` unset
- **THEN** it SHALL use `ADJUSTMENT_ENTITY_FIELD_MAP` and `useCreateOwnerAdjustment`, unchanged
  from current behavior

### Requirement: Staff Year-End Export Surfaces Adjustment After Lock
`StaffYearEndExportView` SHALL show a Create Adjustment entry point and adjustment history once
`StaffTaxYear.Status === 'Locked'`.

#### Scenario: Locked staff tax year
- **WHEN** the view renders with `staffTaxYear.status === 'Locked'`
- **THEN** it SHALL render a Create Adjustment card with a button that opens
  `CreateAdjustmentModal` scoped to `staffTaxYearId`
- **AND** SHALL render the adjustment history list via `useStaffAdjustments(staffTaxYear.id)`

#### Scenario: Not yet locked
- **WHEN** `staffTaxYear.status !== 'Locked'`
- **THEN** the Create Adjustment card SHALL NOT render

### Requirement: Locked-State Banners Provide a Path to the Adjustment Flow
Every Staff screen where a Staff can actually encounter a locked-tax-year message SHALL include
an action button navigating to `/staff/taxiq/export`, not a message-only banner.

#### Scenario: Deduction wizard locked banner (reachable — Add/Edit buttons are never disabled)
- **WHEN** `AddDeductionWizard` (scope="staff") catches `TAXIQ_STAFF_TAX_YEAR_LOCKED`
- **THEN** the banner SHALL show both the existing message and a button navigating to
  `/staff/taxiq/export`

#### Scenario: Mileage/cash tip logs shared banner (reachable — always rendered by LogsView)
- **WHEN** `LogsView` renders its shared locked banner for `CashTipLogTab`/`MileageLogTab`
- **THEN** it SHALL show the same action button navigating to `/staff/taxiq/export`

#### Scenario: Self-reported income list banner (reachable — Add/Edit buttons disabled instead)
- **WHEN** `IncomeSummaryListView` renders its locked banner (shown because its own Add/Edit
  buttons are disabled instead of surfacing a `TAXIQ_STAFF_TAX_YEAR_LOCKED` API error)
- **THEN** it SHALL show the same action button navigating to `/staff/taxiq/export`

#### Scenario: Self-reported income wizard banner (defense-in-depth, not normally reachable)
- **WHEN** `SelfReportedIncomeWizard` itself catches `TAXIQ_STAFF_TAX_YEAR_LOCKED` (only possible
  via a race condition, since its parent list normally prevents the wizard from opening while
  locked)
- **THEN** it SHALL still show the same action button, for defense-in-depth

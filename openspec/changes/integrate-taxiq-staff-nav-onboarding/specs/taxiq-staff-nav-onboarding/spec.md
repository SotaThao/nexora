## ADDED Requirements

### Requirement: Staff Tax IQ Nav Shell
The Staff App SHALL expose a "Tax IQ" menu group with expandable children in `StaffSidebar.tsx`, and register `/staff/taxiq` plus 6 sub-routes in `AppRouter.tsx` under the existing `RequireAuth role="staff"` branch.

#### Scenario: Sub-routes without a real screen yet render ComingSoon
- **WHEN** a Staff user navigates to `/staff/taxiq/deductions`, `/staff/taxiq/receipts`, `/staff/taxiq/logs`, `/staff/taxiq/income`, `/staff/taxiq/export`, or `/staff/taxiq/cpa-access`
- **THEN** the frontend SHALL render the shared `ComingSoon` placeholder with Staff-scoped copy
- **AND** SHALL NOT error or fall through to the `*` fallback route

### Requirement: Onboarding vs Home Detection
The `/staff/taxiq` route SHALL determine whether to render the onboarding wizard or the Staff Tax IQ Home dashboard by calling `GET /api/v1/taxiq/staff/tax-years?TaxYear=`, scoped entirely by the caller's JWT (no `businessId` parameter).

#### Scenario: No StaffTaxYear exists yet
- **WHEN** the list endpoint returns `totalCount: 0` for the current calendar year
- **THEN** the frontend SHALL render the onboarding wizard

#### Scenario: StaffTaxYear already exists
- **WHEN** the list endpoint returns `totalCount > 0`
- **THEN** the frontend SHALL render Staff Tax IQ Home using `items[0]`
- **AND** SHALL fetch the dashboard aggregate separately via `GET /api/v1/taxiq/staff/tax-years/{id}/dashboard`

### Requirement: Staff Tax Year Creation
The onboarding wizard SHALL create a `StaffTaxYear` through `POST /api/v1/taxiq/staff/tax-years` with `taxYear`, `contractType`, `w9Status`, and `enabledModules`, and SHALL display the mandatory privacy banner before submission.

#### Scenario: Successful creation
- **WHEN** the Staff user completes the wizard and submits
- **THEN** the frontend SHALL call `POST /api/v1/taxiq/staff/tax-years`
- **AND** invalidate the staff-tax-year list query on success
- **AND** the route SHALL then render Staff Tax IQ Home without requiring manual navigation

#### Scenario: Duplicate tax year
- **WHEN** the endpoint returns `400` with `errorDetail[0].errorCode === "TAXIQ_STAFF_TAX_YEAR_ALREADY_EXISTS"`
- **THEN** the wizard SHALL show an inline error
- **AND** SHALL NOT close or reset the wizard

### Requirement: Module Selection Limited to Real Backend Values
The onboarding wizard and edit-configuration modal SHALL only offer module toggles for values that exist in the backend `TaxIqModule` enum (`DeductionTracking`, `ReceiptManagement`, `MileageLog`, `CPAExport` for the Staff flow), not the full BA-document module list.

#### Scenario: Attempting to enable a non-existent module
- **WHEN** a module name is not one of the 4 real enum values used by this flow
- **THEN** the frontend SHALL NOT offer it as a checkbox
- **AND** the corresponding feature area (Income Summary, Cash Tip Log co-located under Mileage Log's page, Tax Estimate, Year-End Package's own screen) SHALL remain always-visible in navigation rather than gated

### Requirement: Module Configuration Update
Staff Tax IQ Home SHALL allow editing the enabled module set and contract/W9 status through `PUT /api/v1/taxiq/staff/tax-years/{id}/modules`, disabled once the tax year is no longer `Active`.

#### Scenario: Edit modules while Active
- **WHEN** `StaffTaxYear.status === "Active"`
- **THEN** the "Edit configuration" action SHALL be enabled
- **AND** submitting SHALL call `PUT /api/v1/taxiq/staff/tax-years/{id}/modules`
- **AND** invalidate both the list query and the dashboard query for that record

#### Scenario: Edit blocked after lock
- **WHEN** `StaffTaxYear.status` is not `Active`
- **THEN** the "Edit configuration" action SHALL be disabled

### Requirement: Module-Driven Sidebar Visibility
The Staff Tax IQ sidebar sub-menu SHALL only show children corresponding to modules the Staff user has enabled, computed at render time without mutating the shared `STAFF_MENU_ITEMS` constant.

#### Scenario: Module enabled
- **WHEN** a module (e.g. `DeductionTracking`) is present in `StaffTaxYear.enabledModules`
- **THEN** its mapped sidebar sub-item (`deductions`) SHALL be visible

#### Scenario: Module disabled
- **WHEN** a module is absent from `enabledModules`
- **THEN** its mapped sidebar sub-item SHALL be hidden

#### Scenario: No StaffTaxYear yet or still loading
- **WHEN** the Staff user hasn't completed onboarding yet, or the query is still loading
- **THEN** all Tax IQ sub-items SHALL remain visible (fail-open)

### Requirement: Error Code Discrimination
All error handling for `StaffTaxYear` endpoints SHALL branch on `errorDetail[0].errorCode`, never on HTTP status code alone.

#### Scenario: Locked record
- **WHEN** any `StaffTaxYear` mutation returns `errorDetail[0].errorCode === "TAXIQ_STAFF_TAX_YEAR_LOCKED"`
- **THEN** the frontend SHALL show a generic error
- **AND** SHALL NOT treat this the same as a validation error on the current form

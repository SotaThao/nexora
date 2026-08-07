## ADDED Requirements

### Requirement: Onboarding vs Home Detection
The `/dashboard/taxiq` route SHALL determine whether to render the onboarding wizard or the Tax IQ Home dashboard by calling `GET /api/v1/taxiq/owner/tax-years?businessId=&taxYear=`, not by calling `GET /api/v1/taxiq/owner/tax-years/{id}`.

#### Scenario: No OwnerTaxYear exists yet
- **WHEN** the list endpoint returns `totalCount: 0` for the current business and calendar year
- **THEN** the frontend SHALL render the 4-step onboarding wizard

#### Scenario: OwnerTaxYear already exists
- **WHEN** the list endpoint returns `totalCount > 0`
- **THEN** the frontend SHALL render Tax IQ Home using `items[0]` directly
- **AND** SHALL NOT make an additional `GET /api/v1/taxiq/owner/tax-years/{id}` call for this purpose

### Requirement: Owner Tax Year Creation
The onboarding wizard SHALL create an `OwnerTaxYear` through `POST /api/v1/taxiq/owner/tax-years` with `businessId`, `taxYear`, `salonName`, `employeeTypeConfig`, and `enabledModules`.

#### Scenario: Successful creation
- **WHEN** the Owner completes all 4 wizard steps and submits
- **THEN** the frontend SHALL call `POST /api/v1/taxiq/owner/tax-years`
- **AND** invalidate the owner-tax-year list query on success
- **AND** the route SHALL then render Tax IQ Home without requiring manual navigation

#### Scenario: Duplicate tax year
- **WHEN** the endpoint returns `400` with `errorDetail[0].errorCode === "TAXIQ_OWNER_TAX_YEAR_ALREADY_EXISTS"`
- **THEN** the wizard SHALL show an inline error at Step 1
- **AND** SHALL NOT close or reset the wizard

#### Scenario: CPA Export requires tax year
- **WHEN** the Owner enables the `CPAExport` module at Step 3 without a `TaxYear` filled at Step 1
- **THEN** the wizard SHALL block advancing past Step 1 with a validation error

### Requirement: Error Code Discrimination
All error handling for `OwnerTaxYear` endpoints SHALL branch on `errorDetail[0].errorCode`, never on HTTP status code alone, since this backend feature returns `400` uniformly for not-found, duplicate, and unauthorized-business failures.

#### Scenario: Unauthorized business access
- **WHEN** any `OwnerTaxYear` endpoint returns `errorDetail[0].errorCode === "TAXIQ_UNAUTHORIZED_BUSINESS"`
- **THEN** the frontend SHALL show a generic error and redirect to `/dashboard`
- **AND** SHALL NOT treat this the same as a validation error on the current form

### Requirement: Module Configuration Update
Tax IQ Home SHALL allow editing the enabled module set and employee type config through `PUT /api/v1/taxiq/owner/tax-years/{id}/modules`, disabled once the tax year is no longer `Active`.

#### Scenario: Edit modules while Active
- **WHEN** `OwnerTaxYear.status === "Active"`
- **THEN** the "Edit module config" action SHALL be enabled
- **AND** submitting the modal SHALL call `PUT /api/v1/taxiq/owner/tax-years/{id}/modules`
- **AND** invalidate both the list query and the by-id query for that record

#### Scenario: Edit blocked after lock/export
- **WHEN** `OwnerTaxYear.status` is `Locked` or `Exported`
- **THEN** the "Edit module config" action SHALL be disabled

### Requirement: Module-Driven Sidebar Visibility
The Tax IQ sidebar sub-menu SHALL only show children corresponding to modules the Owner has enabled, computed at render time without mutating the shared `MENU_ITEMS` constant.

#### Scenario: Module enabled
- **WHEN** a module (e.g. `DeductionCenter`) is present in `OwnerTaxYear.enabledModules`
- **THEN** its mapped sidebar sub-item (e.g. `deductions`) SHALL be visible in both `DashboardSidebar.tsx` and `MobileMenuDrawer.tsx`

#### Scenario: Module disabled
- **WHEN** a module is absent from `enabledModules`
- **THEN** its mapped sidebar sub-item SHALL be hidden

#### Scenario: No OwnerTaxYear yet or still loading
- **WHEN** the Owner hasn't completed onboarding yet, or the query is still loading
- **THEN** all Tax IQ sub-items SHALL remain visible (fail-open), rather than hiding everything

### Requirement: businessId Reuse
The feature SHALL source `businessId` from the existing `useMerchantSetup()` query and SHALL NOT introduce a new query to fetch it.

#### Scenario: businessId not yet loaded
- **WHEN** `useMerchantSetup()` has not yet resolved `businessInfo.businessId`
- **THEN** `useOwnerTaxYearByBusiness` SHALL NOT fire its request (`enabled: false`)

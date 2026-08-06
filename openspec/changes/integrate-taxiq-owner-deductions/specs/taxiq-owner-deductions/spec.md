## ADDED Requirements

### Requirement: Deduction List with Running Total
The Deduction Center SHALL list deduction records for the current `OwnerTaxYear`, filterable by `RecordStatus` and `CategoryId`, and SHALL display a running `DeductibleAmount` total that excludes `Draft` records.

#### Scenario: List loads
- **WHEN** the view mounts with a known `ownerTaxYearId`
- **THEN** the frontend SHALL call `GET /api/v1/taxiq/owner/deductions?ownerTaxYearId=`
- **AND** render `totalDeductibleAmount` from the response directly, without re-summing client-side

#### Scenario: Filter by status or category
- **WHEN** the Owner selects a `RecordStatus` or `CategoryId` filter
- **THEN** the frontend SHALL re-query with the corresponding query params
- **AND** the total SHALL reflect the filtered response's `totalDeductibleAmount`

#### Scenario: Empty state
- **WHEN** the filtered list has zero items
- **THEN** the frontend SHALL show an empty-state message, not an empty table

### Requirement: Deduction Creation Flow
The "Add Deduction" wizard SHALL create the deduction record at Step 1 completion (not only at final submit), so that receipt upload and edits in later steps operate on a real record id.

#### Scenario: Step 1 completion creates a Draft
- **WHEN** the Owner completes Step 1 (category, description, amount, date, vendor) and advances
- **THEN** the frontend SHALL call `POST /api/v1/taxiq/owner/deductions`
- **AND** use the returned id for all subsequent steps in the same wizard session

#### Scenario: Business-use % shown conditionally
- **WHEN** the selected category has `requiresBusinessUsePercent: true`
- **THEN** Step 2 SHALL show a Business-use % input
- **AND** SHALL display `DeductibleAmount = Amount * BusinessUsePercent / 100` in real time before submit

#### Scenario: Business-use % not applicable
- **WHEN** the selected category has `requiresBusinessUsePercent: false`
- **THEN** Step 2 SHALL be skipped

#### Scenario: Receipt optional
- **WHEN** the Owner reaches Step 3
- **THEN** the frontend SHALL allow uploading a receipt (linked immediately to the created deduction id) OR skipping the step entirely

#### Scenario: Save as Draft
- **WHEN** the Owner selects "Save as Draft" at Step 5
- **THEN** the frontend SHALL NOT call the submit endpoint
- **AND** the record SHALL remain `RecordStatus: Draft`, excluded from the running total

#### Scenario: Submit evaluates status and AI
- **WHEN** the Owner selects "Submit" at Step 5
- **THEN** the frontend SHALL call `POST /api/v1/taxiq/owner/deductions/{id}/submit`
- **AND** SHALL refetch the deduction list to display the server-evaluated `RecordStatus` and `AiDeductionStatus`

### Requirement: High-Risk No-Receipt Routes to CPA Review
When a High-risk-level category deduction is submitted without a receipt, the record SHALL be flagged for CPA Review with an explanation shown to the Owner.

#### Scenario: High risk, no receipt
- **WHEN** a submitted deduction's category has `RiskLevel: High` and `ReceiptCount: 0`
- **THEN** the frontend SHALL display a "CPA Review" badge
- **AND** a short explanation of why (missing receipt on a high-risk category)

### Requirement: AI Review Display with Mandatory Disclaimer
Every AI-evaluated deduction SHALL display its `AiDeductionStatus` and `AiExplanation` together with the disclaimer, and SHALL never show one without the other.

#### Scenario: AI result present
- **WHEN** `aiExplanation` is non-null on a deduction record
- **THEN** the frontend SHALL render `aiDeductionStatus`, `aiExplanation`, and `aiDisclaimer` (server-supplied) together
- **AND** SHALL fall back to a local translated disclaimer string only if `aiDisclaimer` is unexpectedly null

#### Scenario: Not Deductible excluded from totals
- **WHEN** `aiDeductionStatus === "NotDeductible"`
- **THEN** the frontend SHALL display that this record does not count toward the total or export
- **AND** the record's contribution to `totalDeductibleAmount` SHALL be 0 (enforced server-side; the frontend does not need to zero it client-side)

#### Scenario: Partially Deductible shown with computed amount
- **WHEN** `aiDeductionStatus === "PartiallyDeductible"`
- **THEN** the frontend SHALL display the computed `DeductibleAmount` from the server response

### Requirement: Re-analyze and Approve CPA Review Actions
Each deduction record SHALL support re-triggering AI analysis, and CPA-Review records SHALL support Owner self-approval to Ready.

#### Scenario: Re-analyze after edit
- **WHEN** the Owner clicks "Re-analyze with AI" on any record
- **THEN** the frontend SHALL call `POST /api/v1/taxiq/owner/deductions/{id}/reanalyze`
- **AND** invalidate the deduction list query on success

#### Scenario: Approve CPA Review
- **WHEN** a record has `RecordStatus: "CPAReview"` and the Owner clicks "Approve"
- **THEN** the frontend SHALL call `POST /api/v1/taxiq/owner/deductions/{id}/approve-cpa`
- **AND** on success the record SHALL move to `Ready` and count toward the total

#### Scenario: Approve not offered outside CPAReview
- **WHEN** a record's `RecordStatus` is not `"CPAReview"`
- **THEN** the "Approve" action SHALL NOT be shown for that record

### Requirement: Locked Tax Year Blocks Edits with Specific UX
Editing or submitting a deduction when the owning `OwnerTaxYear.Status` is `Locked` SHALL show a specific message directing the Owner to Year-End Export, never a generic error.

#### Scenario: Locked year edit attempt
- **WHEN** an edit/create/submit call returns `400` with `errorCode: "TAXIQ_OWNER_TAX_YEAR_LOCKED"`
- **THEN** the frontend SHALL show a toast explaining the tax year is locked and adjustments must go through Year-End Export
- **AND** SHALL provide a navigable action to `/dashboard/taxiq/export`
- **AND** SHALL NOT show a generic "something went wrong" error for this specific `errorCode`

### Requirement: Error Discrimination by errorCode, Not HTTP Status
All error handling for deduction/category/receipt endpoints SHALL branch on `error.errorCode`, since this backend feature returns `400` uniformly for locked-year, not-found, invalid-status, and unauthorized-business failures.

#### Scenario: Invalid status transition
- **WHEN** `POST .../approve-cpa` returns `errorCode: "TAXIQ_DEDUCTION_INVALID_STATUS"`
- **THEN** the frontend SHALL show an inline error, not treat it as a network/generic failure

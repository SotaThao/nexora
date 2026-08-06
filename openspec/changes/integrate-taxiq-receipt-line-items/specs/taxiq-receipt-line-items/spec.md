## ADDED Requirements

### Requirement: Receipt Analysis Is Stateless
Analyzing a receipt SHALL upload the file and return candidate line items without creating any `Receipt` or `DeductionRecord` row.

#### Scenario: Analyze succeeds
- **WHEN** the Owner uploads a receipt image
- **THEN** the frontend SHALL call `POST /api/v1/taxiq/owner/deductions/analyze-receipt`
- **AND** the response SHALL contain extracted items with category-match results
- **AND** no database row SHALL be created for items not yet confirmed

### Requirement: Category Matching Never Auto-Creates
Extracted line items SHALL be matched against the existing active `DeductionCategory` list only; the system SHALL NOT create a new category automatically.

#### Scenario: Exact match found
- **WHEN** an extracted item's `suggestedCategory` exactly matches an active category name (case-insensitive)
- **THEN** `matchedCategoryId` SHALL be populated with that category

#### Scenario: No match or ambiguous match
- **WHEN** an extracted item's `suggestedCategory` matches zero or more than one active category
- **THEN** `matchedCategoryId` SHALL be `null`
- **AND** the frontend SHALL require the Owner to select a category manually before that item can be confirmed

### Requirement: Confirm Creates and Evaluates in One Batch Pass
Confirming selected line items SHALL create their deduction records, link their receipts, and evaluate deductibility as three batched operations (one call each), not per-item repeated calls.

#### Scenario: Confirm returns computed deductibility
- **WHEN** the Owner confirms N reviewed items
- **THEN** the frontend SHALL call `POST /api/v1/taxiq/owner/deductions/confirm-receipt` once with all N items
- **AND** the response SHALL include each item's `recordStatus`, `aiDeductionStatus`, and `aiExplanation` already computed — no follow-up fetch required

#### Scenario: Discarded items are never persisted
- **WHEN** the Owner unchecks an extracted item before confirming
- **THEN** that item SHALL NOT appear in the `confirm-receipt` request payload
- **AND** no `Receipt` or `DeductionRecord` row SHALL exist for it

### Requirement: Batch Size Is Capped
Both analysis and confirmation SHALL cap the number of line items processed per receipt.

#### Scenario: Analysis returns more than the cap
- **WHEN** the AI extracts more than 10 line items from one receipt
- **THEN** the response SHALL include only the first 10 (by value) and SHALL set `truncated: true`

#### Scenario: Confirm exceeds the cap
- **WHEN** a confirm request includes more than 10 items
- **THEN** the backend SHALL reject it with `400 { errorCode: "TAXIQ_DEDUCTION_BATCH_LIMIT_EXCEEDED" }`

### Requirement: Existing Single-Item Endpoints Remain Wire-Compatible
Converting `CreateDeductionCommand`, `LinkReceiptToDeductionCommand`, and `SubmitDeductionCommand` to list-based internals SHALL NOT change the request/response shape of their existing single-item HTTP endpoints.

#### Scenario: Manual wizard still works unmodified
- **WHEN** the existing `AddDeductionWizard` calls `POST /deductions`, `POST /deductions/{id}/submit`, or `POST /receipts/{id}/link-deduction`
- **THEN** the request and response shapes SHALL be identical to before this change
- **AND** no frontend code for the manual wizard SHALL require modification

## MODIFIED Requirements

### Requirement: Staff Selection & Flow Entry
The system SHALL display the staff directory or pre-select staff based on public touch page data returned by the API.

#### Scenario: Renders active staff directory from API
- **WHEN** the user opens `/touch/{businessSlug}/{touchPointSlug}` and the API returns multiple staff
- **THEN** the system SHALL display the select_staff screen containing the returned public staff entries

#### Scenario: Pre-select staff for StaffCard touch point
- **WHEN** the API returns `touchPoint.type = "StaffCard"` and one assigned staff member
- **THEN** the system SHALL skip the staff selection step and navigate directly to the tip amount step for that staff

#### Scenario: Public route entry
- **WHEN** the user opens `/touch/{businessSlug}/{touchPointSlug}`
- **THEN** the system SHALL route to the customer flow and load the public touch page by slug

### Requirement: Payment Methods Display
The system SHALL resolve payment methods from the public API contract rather than local merchant setup data.

#### Scenario: Display staff-specific method names
- **WHEN** a single staff member is selected
- **THEN** the system SHALL display only method names present in `staff.availablePaymentMethods`

#### Scenario: Display business payment methods for multi-staff
- **WHEN** two or more staff members are selected and `business.id` is available
- **THEN** the system SHALL fetch and display public business payment methods from `/api/v1/public/businesses/{businessId}/payment-methods`

#### Scenario: Multi-staff methods unavailable without business id
- **WHEN** two or more staff members are selected and no public `business.id` exists
- **THEN** the system SHALL render an explicit unavailable state and SHALL NOT call the public business payment-method endpoint

### Requirement: Wallet Details Display & Confirmation
The system SHALL present payment instructions using API-returned payment redirect or public business payment method details.

#### Scenario: Single-staff wallet details use PaymentRedirectDto
- **WHEN** the customer selects a single-staff payment method
- **THEN** the system SHALL use `PaymentRedirectDto` to render redirect or copy-payment instructions

#### Scenario: Multi-staff wallet details use business method
- **WHEN** the customer selects a business payment method for a multi-staff tip
- **THEN** the system SHALL render the selected public business payment method `accountInfo` and optional `imageUrl`

### Requirement: Transaction and Review Records Persistence
The system SHALL register completed tips and reviews through the public API, not local storage transaction/review/notification writes.

#### Scenario: Single-staff tip persistence
- **WHEN** the user starts and confirms a single-staff tip
- **THEN** the system SHALL call `POST /api/v1/touch/tip` and `POST /api/v1/touch/tip/{tipId}/confirm`
- **AND** SHALL NOT write a local transaction or notification record directly from the customer component

#### Scenario: Multi-staff tip persistence
- **WHEN** the user starts and confirms a multi-staff tip
- **THEN** the system SHALL call `POST /api/v1/tips/multi-staff` and `PATCH /api/v1/tips/{tipId}/confirm`

#### Scenario: Review persistence
- **WHEN** the user submits feedback
- **THEN** the system SHALL call `POST /api/v1/touch/review`
- **AND** SHALL NOT write a local review or notification record directly from the customer component

#### Scenario: Skip-tip persistence
- **WHEN** the user clicks the Skip Tip action
- **THEN** the system SHALL call `POST /api/v1/touch/tip/skip`
- **AND** continue to the review step

### Requirement: External Reviews & Final Reset
The system SHALL present third-party review links only when public review routing destinations are available.

#### Scenario: External links available
- **WHEN** the API provides public Google or Yelp review links and the submitted rating is 4 or higher
- **THEN** the system SHALL display those external review buttons

#### Scenario: External links unavailable
- **WHEN** no public Google or Yelp review links are available
- **THEN** the system SHALL skip external review buttons and route to the final thank-you page


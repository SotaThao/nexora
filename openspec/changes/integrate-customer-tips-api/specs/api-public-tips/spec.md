## ADDED Requirements

### Requirement: Multi-Staff Tip Creation
The frontend SHALL create multi-staff tips through `POST /api/v1/tips/multi-staff` when a customer tips two or more staff members through a business payment method.

#### Scenario: Multi-staff tip initiated
- **WHEN** the customer selects at least two distinct active staff members, valid amounts, and an active business payment method
- **THEN** the frontend SHALL call `POST /api/v1/tips/multi-staff`
- **AND** include `businessId`, `touchPointId`, `businessPaymentMethodId`, and `tipItems`

#### Scenario: Multi-staff validation
- **WHEN** fewer than two staff members are selected, duplicate staff members are present, any item amount is below `$1.00`, or total amount exceeds `$500.00`
- **THEN** the frontend SHALL block submission and show a validation error before calling the API

#### Scenario: Business payment method unavailable
- **WHEN** no active configured public business payment method is available
- **THEN** the frontend SHALL show a no-payment-method empty state for the multi-staff flow

### Requirement: Multi-Staff Tip Confirmation
The frontend SHALL confirm a multi-staff tip through `PATCH /api/v1/tips/{id}/confirm` after the customer indicates they paid.

#### Scenario: Multi-staff tip confirmed
- **WHEN** the customer taps "Yes, I paid" after a multi-staff tip payment instruction
- **THEN** the frontend SHALL call `PATCH /api/v1/tips/{tipId}/confirm`

### Requirement: Multi-Staff Review Linkage
The frontend SHALL pass the multi-staff `tipId` to the customer review endpoint after multi-staff confirmation.

#### Scenario: Multi-staff review submitted
- **WHEN** the customer submits a review after a confirmed multi-staff tip
- **THEN** the frontend SHALL call `POST /api/v1/touch/review` with `touchPointId`, `tipId`, rating, and comment fields


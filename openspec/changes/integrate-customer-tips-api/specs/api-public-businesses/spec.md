## ADDED Requirements

### Requirement: Public Business Payment Methods
The public business API SHALL expose only active and configured business payment methods that are safe for guests to use in the multi-staff tip flow.

#### Scenario: List public business payment methods
- **WHEN** the customer has selected two or more staff members and the touch page has a `businessId`
- **THEN** the frontend SHALL call `GET /api/v1/public/businesses/{businessId}/payment-methods`
- **AND** the API SHALL return only active methods with non-empty `accountInfo`

#### Scenario: Public payment method detail
- **WHEN** the frontend needs details for one selected business payment method
- **THEN** it MAY call `GET /api/v1/public/businesses/{businessId}/payment-methods/{id}`
- **AND** the API SHALL return `PublicPaymentMethodDto`

#### Scenario: No business id available
- **WHEN** the public touch page response does not include `business.id`
- **THEN** the frontend SHALL NOT call `/api/v1/public/businesses/{businessId}/payment-methods`
- **AND** the multi-staff flow SHALL render an intentional unavailable state

### Requirement: Public Business Privacy Boundary
The public business payment API MAY expose business payment `accountInfo` for guest payment instructions, but SHALL NOT expose raw staff payment account information.

#### Scenario: Business payment info is visible for multi-staff tips
- **WHEN** the customer chooses a business payment method for a multi-staff tip
- **THEN** the frontend MAY display the returned public business `accountInfo`

#### Scenario: Staff payment info stays hidden
- **WHEN** the customer views the touch page staff list
- **THEN** the frontend SHALL display only `availablePaymentMethods` and SHALL NOT display raw staff payment account info


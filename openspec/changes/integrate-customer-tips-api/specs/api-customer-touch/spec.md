## ADDED Requirements

### Requirement: Public Touch Page Load
The frontend SHALL load customer touch page data from `GET /api/v1/touch/{businessSlug}/{touchPointSlug}` using an optional `sessionId` query parameter.

#### Scenario: Touch page loads
- **WHEN** a customer opens `/touch/{businessSlug}/{touchPointSlug}`
- **THEN** the frontend SHALL call `GET /api/v1/touch/{businessSlug}/{touchPointSlug}?sessionId={uuid}` with `{ anonymous: true }`
- **AND** render business info, touch point info, and staff from `TouchPageDataDto`

#### Scenario: Touch point unavailable
- **WHEN** the API returns `404 TOUCHPOINT_NOT_FOUND`
- **THEN** the frontend SHALL render an unavailable touch point state instead of showing a broken customer flow

#### Scenario: StaffCard touch point
- **WHEN** `touchPoint.type = "StaffCard"`
- **THEN** the frontend SHALL treat the single returned staff member as pre-selected

### Requirement: Single-Staff Payment Link
The frontend SHALL request a payment link or copy-payment detail for selected single-staff tips.

#### Scenario: Customer selects payment method
- **WHEN** the customer selects one staff member, an amount, and a payment method
- **THEN** the frontend SHALL call `GET /api/v1/touch/payment-link?staffId={staffProfileId}&method={PaymentMethod}&amount={amount}`

#### Scenario: Redirect payment method
- **WHEN** `PaymentRedirectDto.redirectUrl` is present
- **THEN** the frontend SHALL present an affordance to open the payment destination

#### Scenario: Copy-only payment method
- **WHEN** the selected method is Zelle or AppleCash and no `redirectUrl` is returned
- **THEN** the frontend SHALL show copyable `zellePhone`, `zelleEmail`, or `appleCashPhone` instructions

### Requirement: Single-Staff Tip Lifecycle
The frontend SHALL create and confirm single-staff tip records through the public touch API.

#### Scenario: Tip initiated
- **WHEN** the customer taps Pay for a single-staff tip
- **THEN** the frontend SHALL call `POST /api/v1/touch/tip`
- **AND** include `touchPointId`, `staffProfileId`, `amount`, `paymentMethod`, and `sessionId`

#### Scenario: Tip confirmed
- **WHEN** the customer taps "Yes, I paid"
- **THEN** the frontend SHALL call `POST /api/v1/touch/tip/{tipId}/confirm`

### Requirement: Skip-Tip Review Flow
The frontend SHALL record skipped tips before collecting a review when the customer chooses not to tip.

#### Scenario: Customer skips tip
- **WHEN** the customer taps "Skip tip"
- **THEN** the frontend SHALL call `POST /api/v1/touch/tip/skip`
- **AND** continue to the review step

### Requirement: Customer Review Submission
The frontend SHALL submit reviews through `POST /api/v1/touch/review`.

#### Scenario: Review submitted after tip
- **WHEN** a customer submits a review after a tip flow
- **THEN** the frontend SHALL include `touchPointId`, `tipId`, `staffProfileId`, `rating`, `comment`, `customerEmail`, and `customerName` where available

#### Scenario: Review submitted without tip
- **WHEN** a customer submits review-only feedback after skipping tip
- **THEN** the frontend SHALL include `touchPointId`, optional `staffProfileId`, and rating/comment fields without requiring a `tipId`

### Requirement: External Review Click Tracking
The frontend SHALL track Google and Yelp review clicks after a public review is created.

#### Scenario: Google click tracked
- **WHEN** a customer clicks the Google review button after creating a review
- **THEN** the frontend SHALL call `POST /api/v1/touch/review/{reviewId}/track-google`

#### Scenario: Yelp click tracked
- **WHEN** a customer clicks the Yelp review button after creating a review
- **THEN** the frontend SHALL call `POST /api/v1/touch/review/{reviewId}/track-yelp`

### Requirement: Public Business Context Gap
The public touch page SHALL expose `business.id` before the frontend can continue into the public multi-staff tip flow.

#### Scenario: Business id is returned
- **WHEN** `TouchPageDataDto.business.id` is present
- **THEN** the frontend SHALL use it for public business payment methods and multi-staff tip creation

#### Scenario: Business id is absent
- **WHEN** `TouchPageDataDto.business.id` is absent
- **THEN** the frontend SHALL block multi-staff tips with an intentional unavailable state

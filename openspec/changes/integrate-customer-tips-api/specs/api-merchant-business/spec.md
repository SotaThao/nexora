## ADDED Requirements

### Requirement: Merchant Business Source of Truth
The Merchant business API SHALL remain the authenticated source of truth for a merchant's business profile, including `BusinessDto.id`, slug, public profile data, and review routing links.

#### Scenario: Merchant reads business profile
- **WHEN** an authenticated merchant calls `GET /api/v1/merchant/business`
- **THEN** the API SHALL return `BusinessDto` containing `id`, `name`, `slug`, `logoUrl`, `description`, `googleReviewUrl`, `yelpUrl`, `facebookUrl`, and `feedbackEmail`

#### Scenario: Anonymous customer flow must not call Merchant endpoint
- **WHEN** an anonymous customer opens `/touch/{businessSlug}/{touchPointSlug}`
- **THEN** the frontend SHALL NOT call `GET /api/v1/merchant/business` to obtain `businessId` or review links

### Requirement: Review Link Management
The Merchant business API SHALL allow merchants to update public review routing destinations via `PUT /api/v1/merchant/business/review-links`.

#### Scenario: Merchant updates review links
- **WHEN** a merchant submits Google, Yelp, Facebook, or private feedback email values
- **THEN** the frontend SHALL call `PUT /api/v1/merchant/business/review-links` with only those business-owned fields


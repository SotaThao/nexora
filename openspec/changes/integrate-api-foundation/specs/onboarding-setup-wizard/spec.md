## ADDED Requirements

### Requirement: API-Mode Step Handlers
In `api` mode, each onboarding wizard step SHALL call its dedicated API endpoint instead of writing to the storage blob.

#### Scenario: Step 1 — Create business via API
- **WHEN** the user completes Step 1 in api mode and submits the business info form
- **THEN** the wizard SHALL call `useCreateBusiness(dto)` which posts to `POST /api/v1/merchant/business`, receive `{ businessId, slug }`, and advance to Step 2

#### Scenario: Step 2 — Review links via API
- **WHEN** the user completes Step 2 in api mode and saves review links
- **THEN** the wizard SHALL call `useUpdateReviewLinks(dto)` which puts to `PUT /api/v1/merchant/business/review-links` and advance to Step 3

#### Scenario: Step 5 — Complete onboarding via API
- **WHEN** the user reaches the final step in api mode and confirms
- **THEN** the wizard SHALL call `useCompleteOnboarding()` which posts to `POST /api/v1/merchant/business/complete-onboarding` and transition the app to the dashboard view

### Requirement: Real-Time Slug Validation
In `api` mode, the onboarding wizard Step 1 SHALL validate slug availability in real time by calling the backend check-slug endpoint on each keystroke (debounced).

#### Scenario: Slug available indicator
- **WHEN** the user types a slug that is available
- **THEN** the wizard SHALL display a green availability indicator next to the slug field

#### Scenario: Slug taken with suggestion
- **WHEN** the user types a slug that is taken
- **THEN** the wizard SHALL display a "taken" indicator and show the server-suggested alternative

## MODIFIED Requirements

### Requirement: Store Information Input (Step 1)
The system SHALL collect and validate business and review routing details in Step 1. In `api` mode, submission calls `POST /api/v1/merchant/business`; in `storage` mode the existing blob-save behavior is unchanged.

#### Scenario: Required business fields
- **WHEN** the user attempts to advance from Step 1 with empty business name, address, or phone fields
- **THEN** the system SHALL display validation errors and block navigation

#### Scenario: Store payment method selection
- **WHEN** the user leaves all store payment methods blank
- **THEN** the system SHALL display a payment required error and block navigation

#### Scenario: Industry selection options
- **WHEN** the user interacts with the industry dropdown
- **THEN** the system SHALL provide Nail Salon, Restaurant, Cafe, Spa, and Other options

#### Scenario: Store logo upload
- **WHEN** the user uploads a valid image file as the store logo
- **THEN** the system SHALL display a preview of the logo; in api mode the file is uploaded via `PUT /api/v1/merchant/business/logo` and the returned URL is used in the business creation payload

#### Scenario: Google Review URL format
- **WHEN** the user inputs an invalid Google Review URL format (not starting with http)
- **THEN** the system SHALL show an invalid URL format error

#### Scenario: Feedback email format validation
- **WHEN** the user enters an invalid feedback email address format
- **THEN** the system SHALL display a validation error

#### Scenario: Auto-generate default touchpoints
- **WHEN** the user advances from Step 1 to Step 2 for the first time
- **THEN** in storage mode the system SHALL automatically create default general lobby and front desk touchpoints; in api mode touchpoints are deferred to a later integration phase

#### Scenario: Prefill demo data
- **WHEN** the user selects the prefill demo data action
- **THEN** the system SHALL populate the form with mock business details, review links, 4 staff members, and 6 touchpoints

#### Scenario: SSO-locked business profile
- **WHEN** the user accesses onboarding with an SSO-prefilled profile
- **THEN** the system SHALL lock the business details fields as read-only

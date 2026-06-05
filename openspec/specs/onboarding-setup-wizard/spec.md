# Specification: Onboarding Setup Wizard

## Purpose
This specification defines the onboarding setup wizard for new merchants, detailing store information input, payment methods configuration, staff and touchpoint setup, and final consent/launch steps. It supports standard self-onboarding and Single Sign-On (SSO) locked profiles.

## Requirements

### Requirement: Store Information Input (Step 1)
The system SHALL collect and validate business and review routing details in Step 1.

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
- **THEN** the system SHALL display a preview of the logo

#### Scenario: Google Review URL format
- **WHEN** the user inputs an invalid Google Review URL format (not starting with http)
- **THEN** the system SHALL show an invalid URL format error

#### Scenario: Feedback email format validation
- **WHEN** the user enters an invalid feedback email address format
- **THEN** the system SHALL display a validation error

#### Scenario: Auto-generate default touchpoints
- **WHEN** the user advances from Step 1 to Step 2 for the first time
- **THEN** the system SHALL automatically create default general lobby and front desk touchpoints

#### Scenario: Prefill demo data
- **WHEN** the user selects the prefill demo data action
- **THEN** the system SHALL populate the form with mock business details, review links, 4 staff members, and 6 touchpoints

#### Scenario: SSO-locked business profile
- **WHEN** the user accesses onboarding with an SSO-prefilled profile
- **THEN** the system SHALL lock the business details fields as read-only

### Requirement: Staff Directory and QR Touchpoints (Step 2)
The system SHALL support managing staff and customized QR touchpoints in Step 2.

#### Scenario: Add staff name validation
- **WHEN** the user attempts to add staff with a blank full name or nickname
- **THEN** the system SHALL display name validation errors

#### Scenario: Add staff email validation
- **WHEN** the user enters an invalid email format for a new staff member
- **THEN** the system SHALL show an email validation error

#### Scenario: Add staff payment method validation
- **WHEN** the user attempts to add a staff member without enabling at least one payment method or filling VLINKPAY
- **THEN** the system SHALL display a staff payment method validation error

#### Scenario: Payout wallet configuration modal
- **WHEN** the user configures a payment wallet in the staff modal
- **THEN** the system SHALL save the wallet's configuration details and set its enabled state

#### Scenario: Staff add side effects
- **WHEN** a valid staff member is successfully added
- **THEN** the system SHALL display them in the directory and automatically generate a custom staff QR touchpoint

#### Scenario: Remove staff from directory
- **WHEN** the user deletes a staff member from the directory
- **THEN** the system SHALL remove them from the list and delete their corresponding staff QR touchpoint

#### Scenario: Staff requirements to proceed
- **WHEN** the user attempts to advance from Step 2 with an empty staff directory in standard mode
- **THEN** the system SHALL block navigation until at least one staff member is added

#### Scenario: Add touchpoint validation
- **WHEN** the user attempts to add a custom touchpoint with a blank name
- **THEN** the system SHALL show a touchpoint name validation error

#### Scenario: Touchpoint type selection
- **WHEN** the user selects a touchpoint type
- **THEN** the system SHALL provide Table QR, Front Desk, and Receipt QR options

#### Scenario: Touchpoint inline edit
- **WHEN** the user modifies and saves a touchpoint name or type
- **THEN** the system SHALL update the touchpoint configuration accordingly

#### Scenario: QR thumbnail zoom modal
- **WHEN** the user clicks on a touchpoint QR thumbnail
- **THEN** the system SHALL display an enlarged zoom modal showing the QR code containing the encoded customer flow URL

#### Scenario: SSO-locked Step 2 display
- **WHEN** an SSO-locked merchant views Step 2
- **THEN** the system SHALL display only the QR touchpoints configuration panel and hide the staff directory form

### Requirement: Print, Consent, and Launch (Step 3)
The system SHALL handle the final review, consent, and launch steps in Step 3.

#### Scenario: Display QR card preview
- **WHEN** the user reaches Step 3
- **THEN** the system SHALL render a preview card displaying the business name, touchpoint name, QR code, and scanning instruction

#### Scenario: Print QR cards
- **WHEN** the user clicks the Print action
- **THEN** the system SHALL open the browser's print dialog and apply print-specific CSS rules

#### Scenario: Consent checkbox gates launch
- **WHEN** the consent checkbox is unchecked
- **THEN** the system SHALL disable the Launch Dashboard button

#### Scenario: Launch dashboard persistence
- **WHEN** the user checks consent and clicks Launch Dashboard
- **THEN** the system SHALL persist the merchant setup configurations to local storage and route to the merchant dashboard

### Requirement: Onboarding Navigation and Localization
The system SHALL support backward navigation and full localization across the onboarding wizard.

#### Scenario: Back navigation data retention
- **WHEN** the user navigates back to a previous onboarding step
- **THEN** the system SHALL retain all previously entered data

#### Scenario: Language toggle on onboarding
- **WHEN** the user switches the active language during onboarding
- **THEN** the system SHALL translate all wizard steps, fields, validation messages, and default touchpoint names

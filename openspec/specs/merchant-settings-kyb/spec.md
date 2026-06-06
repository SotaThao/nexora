# Specification: Merchant Settings & KYB

## Purpose
This specification defines the merchant settings view requirements, including profile cards, payout methods toggles, basic/address/business info editing (gated by KYB verification status), payout account configuration, KYB status monitoring, KYB portal submission, and read-only compliance dossiers.

## Requirements

### Requirement: Owner Profile Management (Profile Tab)
The system SHALL display the owner's profile details and allow managing general settings.

#### Scenario: Display owner profile card
- **WHEN** the user opens the Profile tab in Settings
- **THEN** the system SHALL display the avatar, "Business Owner" badge, read-only username and email, and a copyable Referral ID

#### Scenario: Avatar upload preview
- **WHEN** the user hovers over the avatar and uploads a new image
- **THEN** the system SHALL update the avatar preview with the uploaded image

#### Scenario: Email change placeholder toast
- **WHEN** the user clicks the Change email button
- **THEN** the system SHALL show a "feature under development" toast and keep the email unchanged

#### Scenario: Copy Referral ID
- **WHEN** the user clicks the Copy button on the Referral ID card
- **THEN** the system SHALL copy the Referral ID to the clipboard

#### Scenario: Payout method toggles and VLINKPAY badge
- **WHEN** the user toggles payout methods or views VLINKPAY ID
- **THEN** the system SHALL update the active payout toggles and display a "Pending KYB" badge if VLINKPAY is unset

#### Scenario: Edit basic info (unverified)
- **WHEN** the user clicks Edit on Basic Info on an unverified account
- **THEN** the system SHALL allow editing and saving Full Name, DOB, and Phone

#### Scenario: Hide basic info edit when verified
- **WHEN** a KYB-verified user views the Basic Info card
- **THEN** the system SHALL hide the Edit button and display the info as read-only

#### Scenario: Edit address details
- **WHEN** the user edits and saves address fields
- **THEN** the system SHALL validate the required fields (Street, City, Zip, Country) and persist the address data

#### Scenario: Edit business profile details
- **WHEN** the user edits and saves business info fields
- **THEN** the system SHALL validate the email format and save the business name, phone, email, and website

#### Scenario: Location map rendering
- **WHEN** the user views the location map card
- **THEN** the system SHALL display the embedded Google Map frame

#### Scenario: Edit external review links
- **WHEN** the user updates and saves external review URLs
- **THEN** the system SHALL update the review links and truncate long URLs for display

#### Scenario: Profile changes sync propagation
- **WHEN** the user saves any profile change
- **THEN** the system SHALL dispatch a storage event to synchronize the updated profile across all open dashboard tabs

### Requirement: Payout Account Configuration Modal
The system SHALL provide a modal configuration dialog to edit details for each payout method.

#### Scenario: Open payout modal
- **WHEN** the user edits a specific payout method
- **THEN** the system SHALL display the configuration modal with the method logo and auto-focus the identifier input field

#### Scenario: Require identifier input
- **WHEN** the user attempts to save a payout configuration with a blank identifier
- **THEN** the system SHALL display a modal validation error

#### Scenario: QR code photo or upload
- **WHEN** the user uploads a payout QR code or takes a mock photo
- **THEN** the system SHALL render the QR preview image

#### Scenario: Save updates and auto-toggle
- **WHEN** the user saves a valid payout account configuration
- **THEN** the system SHALL update the merchant setup payment accounts, toggle the method state on, and close the modal

#### Scenario: Cancel payout modal edit
- **WHEN** the user clicks Cancel in the payout configuration modal
- **THEN** the system SHALL close the modal without persisting changes

### Requirement: KYB Verification Status Card (KYB Tab)
The system SHALL display the merchant's KYB verification status and guide them through completion steps.

#### Scenario: Basic account status
- **WHEN** a user with a "basic" verification status views the KYB tab
- **THEN** the system SHALL show a blue status card and a "Complete Business Verification" CTA button

#### Scenario: Verification pending status
- **WHEN** a user with a "kyb_pending" verification status views the KYB tab
- **THEN** the system SHALL show an indigo status card and hide the verification CTA button

#### Scenario: Verification approved status
- **WHEN** a user with a "kyb_approved" verification status views the KYB tab
- **THEN** the system SHALL show an emerald verified badge, verification date, certificate ID, and a read-only dossier

#### Scenario: Rejected or suspended status
- **WHEN** a user with a "rejected" or "suspended" status views the KYB tab
- **THEN** the system SHALL show a rejected alert with a re-submit action, or a suspended alert with no CTAs

### Requirement: KYB Submission Portal
The system SHALL collect legal and financial details through a simulated verification portal to process KYB applications.

#### Scenario: Launch KYB portal
- **WHEN** the user clicks the verification CTA button
- **THEN** the system SHALL open the mock verification portal prefilled with their merchant email

#### Scenario: Form fields validation
- **WHEN** the user submits the KYB form with any empty required fields
- **THEN** the system SHALL display validation errors on routing, bank, account, legal name, or tax ID fields

#### Scenario: Business structure selection
- **WHEN** the user configures structure and account numbers in the portal
- **THEN** the system SHALL offer LLC, Corp, Sole, and Partnership options and mask the account number field

#### Scenario: Submit KYB success
- **WHEN** the user submits a fully populated KYB form
- **THEN** the system SHALL display a loading spinner, update the pending accounts record, mark the status as verified, and trigger the success callback

#### Scenario: Cancel portal submission
- **WHEN** the user cancels the KYB portal dialog
- **THEN** the system SHALL close the portal without changing the verification status

### Requirement: Verified Compliance Dossier
The system SHALL display a read-only compliance dossier once the merchant is KYB verified.

#### Scenario: Company dossier details
- **WHEN** a verified merchant views the KYB tab
- **THEN** the system SHALL display read-only legal entity details, representative names, addresses, and settlement targets

#### Scenario: Compliance document list
- **WHEN** the user views compliance documents by status
- **THEN** the system SHALL show a list of PDF downloads on verified accounts, or an empty state message on unverified accounts

### Requirement: Settings Localization
The system SHALL support full localization and display legal disclosures across the settings views.

#### Scenario: Localization and disclosures
- **WHEN** the user toggles the language switch or views disclosures
- **THEN** the system SHALL display translated settings labels and keep the 1099-K, savings disclaimer, and ToS disclosures visible

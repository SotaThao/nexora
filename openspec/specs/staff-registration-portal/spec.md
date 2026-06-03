# Specification: Staff Registration Portal

## Purpose
This specification defines the staff registration portal wizard (view `staff-portal`), detailing invite acceptance, path selection, linking existing profiles (with live search and QR scans), registering new technician credentials with OTP verification, profile configuration, payout methods setup, and final activation submission.

## Requirements

### Requirement: Invite Acceptance & Path Selection (Step 0)
The system SHALL process invitation links and present appropriate routing paths based on the entry parameters.

#### Scenario: Display prefilled invite
- **WHEN** the user opens the portal via a prefilled invitation link
- **THEN** the system SHALL show the business details and provide "Accept Invite & Continue", "Decline Request", and "I already have Staff ID" actions

#### Scenario: Decline invite redirect
- **WHEN** the user clicks the Decline button on an invite
- **THEN** the system SHALL return them to the merchant dashboard view

#### Scenario: Self-serve path selection
- **WHEN** the user enters the portal without an invite
- **THEN** the system SHALL display "I already have a Profile" and "I am a new Technician" path options

### Requirement: Link Existing Profile
The system SHALL support searching, scanning, and linking an existing staff profile.

#### Scenario: Live search Staff ID
- **WHEN** the user inputs an existing Staff ID and submits
- **THEN** the system SHALL perform a search, display a success indicator, and render the staff profile card

#### Scenario: Staff ID not found validation
- **WHEN** the user inputs a non-existent Staff ID
- **THEN** the system SHALL display a search error message and hide profile cards

#### Scenario: QR code scan to prefill Staff ID
- **WHEN** the user simulates scanning a profile QR code
- **THEN** the system SHALL prefill the Staff ID field and load the profile details

#### Scenario: Accept and link profile
- **WHEN** the user links a found profile to the salon
- **THEN** the system SHALL register the staff entry as "Pending Acceptance" with status and skip to the success page

### Requirement: Register New Staff - Credentials & OTP (Step 1)
The system SHALL gather registration credentials and perform simulated OTP verification.

#### Scenario: Email format validation
- **WHEN** the user submits a blank or invalid email address on Step 1
- **THEN** the system SHALL display email format validation errors

#### Scenario: Confirm email matching
- **WHEN** the user enters mismatching emails
- **THEN** the system SHALL show an email mismatch error

#### Scenario: Password length validation
- **WHEN** the user submits a password shorter than 6 characters
- **THEN** the system SHALL display a password length error

#### Scenario: Referral and salon locked
- **WHEN** the user is invited to register for a specific business
- **THEN** the system SHALL prefill and disable the referral business field

#### Scenario: OTP verification code validation
- **WHEN** the user submits an incorrect verification code versus the correct simulated code (1234)
- **THEN** the system SHALL shake the input and show a validation error, or advance to Step 2 upon success

#### Scenario: OTP resend countdown timer
- **WHEN** the user accesses the OTP verification screen
- **THEN** the system SHALL display a 30-second countdown timer and enable the Resend action when it expires

### Requirement: Register New Staff - Profile Setup (Step 2)
The system SHALL collect profile information and generate unique Staff and payment identifiers.

#### Scenario: Avatar presets and upload
- **WHEN** the user selects an avatar preset or uploads a photo
- **THEN** the system SHALL update and display the profile avatar preview

#### Scenario: Identity name validation
- **WHEN** the user leaves the full name field blank
- **THEN** the system SHALL disable the Next button and auto-generate the nickname when name is populated

#### Scenario: Prefilled contact locking
- **WHEN** an invited technician accesses Step 2
- **THEN** the system SHALL lock and disable the prefilled email and phone fields

#### Scenario: Auto-generate Staff ID and VLINKPAY ID
- **WHEN** the user accesses Step 2
- **THEN** the system SHALL auto-generate and display a unique Staff ID and a default VLINKPAY ID

#### Scenario: VLINKPAY ID lookup prefill
- **WHEN** the user inputs a valid VLINKPAY ID or scans a VLINKPAY QR code
- **THEN** the system SHALL fetch and prefill their profile from the mock registry

#### Scenario: Profile bio optional field
- **WHEN** the user submits the profile step with or without a bio
- **THEN** the system SHALL accept the submission and display the bio on customer screens if populated

### Requirement: Register New Staff - Payout Methods & Activation
The system SHALL allow configuring personal payout wallets and submitting the activation request.

#### Scenario: Configure payout methods
- **WHEN** the user configures payment wallets (e.g. Zelle, Venmo, Cash App, PayPal, Apple Cash)
- **THEN** the system SHALL validate the input, save the configuration, and render a configured badge

#### Scenario: Payout configuration modal validation
- **WHEN** the user attempts to save a payout method with an empty identifier
- **THEN** the system SHALL display a validation error in the modal

#### Scenario: Upload payout QR code image
- **WHEN** the user uploads a QR photo in the payout configuration modal
- **THEN** the system SHALL render a thumbnail preview of the QR code

#### Scenario: Proceed with empty payout configuration
- **WHEN** the user clicks Save & Activate without configuring any payout methods
- **THEN** the system SHALL proceed with activation without blocking the wizard

#### Scenario: Submit Save and Activate registration
- **WHEN** the user submits registration details on Step 3
- **THEN** the system SHALL write a pending acceptance staff record to the merchant setup list and append an alert notification

#### Scenario: De-duplicate registration records
- **WHEN** a registration is submitted with an email that matches an existing roster staff
- **THEN** the system SHALL update the existing record instead of creating a duplicate

#### Scenario: Display join request success
- **WHEN** registration is completed
- **THEN** the system SHALL display the success view showing the Staff ID, a copyable staff link, and a return action

#### Scenario: Copy personal staff link
- **WHEN** the user clicks the Copy Link action on the success page
- **THEN** the system SHALL copy their personal staff link to the clipboard

#### Scenario: Return action reloads dashboard
- **WHEN** the user returns to the merchant dashboard from the portal
- **THEN** the system SHALL clear the portal parameters and reload the dashboard roster list to display the pending staff request

### Requirement: Portal Navigation and Localization
The system SHALL support backward navigation and full translation across all portal steps.

#### Scenario: Back navigation values preservation
- **WHEN** the user navigates back to a previous portal step
- **THEN** the system SHALL retain all values entered in the form inputs

#### Scenario: Localization across portal wizard
- **WHEN** the user toggles the language switch during portal registration
- **THEN** the system SHALL immediately translate all fields, validation messages, and wizard labels

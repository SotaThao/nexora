# Specification: Register Wizard

## Purpose
This specification defines the registration wizard requirements for both technicians (personal role) and business owners (business role), detailing role selection, input validation, account persistence, and the simulated KYB verification process.

## Requirements

### Requirement: Role Selection
The system SHALL support role selection during the first step (Step 0) of the registration process.

#### Scenario: Selection toggle and default
- **WHEN** the user opens the registration wizard
- **THEN** the system SHALL default to the "business" role, show the step indicator, and allow toggling between "Technician (Personal)" and "Business Owner" roles

#### Scenario: Back navigation from Step 0
- **WHEN** the user clicks the Back button on Step 0
- **THEN** the system SHALL return them to the login view

#### Scenario: Next navigation from Step 0
- **WHEN** the user clicks the Next button on Step 0
- **THEN** the system SHALL advance to Step 1 without validation errors

### Requirement: Registration Credentials Input
The system SHALL collect and validate credentials during Step 1 of the registration process.

#### Scenario: Full name validation for personal role
- **WHEN** the user selects the "personal" role and leaves the full name field blank
- **THEN** the system SHALL display a full name validation error

#### Scenario: Email format validation
- **WHEN** the user submits an empty or invalid email address
- **THEN** the system SHALL display email validation errors accordingly

#### Scenario: Confirm email matching
- **WHEN** the user enters mismatching emails (case-insensitive) or leaves the confirm email field blank
- **THEN** the system SHALL display email match validation errors

#### Scenario: Password strength validation
- **WHEN** the user submits an empty or short password (less than 6 characters)
- **THEN** the system SHALL display password validation errors

#### Scenario: Password visibility toggle
- **WHEN** the user clicks the password visibility toggle
- **THEN** the system SHALL switch the input visibility between text and password modes

#### Scenario: Referral code processing
- **WHEN** the user submits a referral code
- **THEN** the system SHALL trim and store it as an optional value

#### Scenario: SSO email locking
- **WHEN** the user enters registration via SSO redirect
- **THEN** the system SHALL lock and display the prefilled email field as disabled

### Requirement: Account Data Persistence
The system SHALL persist successfully submitted registration records in local storage.

#### Scenario: Persistence under pending accounts
- **WHEN** the user completes Step 1 submission
- **THEN** the system SHALL save the account record under the pending accounts list in local storage

#### Scenario: Deduplicate emails
- **WHEN** the user registers an email that already exists in pending accounts
- **THEN** the system SHALL overwrite the existing record to prevent duplicates

### Requirement: Technician (Personal) Success Flow
The system SHALL complete registration and generate credentials for personal accounts.

#### Scenario: Personal account auto-verification
- **WHEN** a personal account registration is submitted
- **THEN** the system SHALL auto-verify the account, generate a Staff ID, and display a success page with a copy option

#### Scenario: Copy Staff ID
- **WHEN** the user clicks the Copy button on the personal success page
- **THEN** the system SHALL copy the Staff ID to the clipboard and show confirmation feedback

#### Scenario: Auto-verified login
- **WHEN** the user logs in using the newly registered personal account credentials
- **THEN** the system SHALL route them to the staff dashboard

### Requirement: Business Owner Success Flow
The system SHALL process and simulate verification for business owner accounts.

#### Scenario: Business account success page
- **WHEN** a business account registration is completed
- **THEN** the system SHALL display a success page showing a "KYB PENDING" badge and simulation controls

#### Scenario: Simulated admin verification
- **WHEN** the user clicks the simulated admin verification action
- **THEN** the system SHALL mark the account as verified and update the state to KYB approved

#### Scenario: Redirect callback on verification
- **WHEN** the user simulates verification and was redirected from a session
- **THEN** the system SHALL trigger the success callback and return to the prior view

#### Scenario: Skip verification simulation
- **WHEN** the user returns to login without simulating verification
- **THEN** the system SHALL keep the account unverified and route them to a basic status dashboard on login

### Requirement: Registration Localization
The system SHALL support English and Vietnamese localization across all registration steps.

#### Scenario: Language toggle on registration
- **WHEN** the user toggles the language switch during any registration step
- **THEN** the system SHALL immediately translate all fields, labels, buttons, and validation messages

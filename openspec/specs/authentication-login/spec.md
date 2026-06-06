# Specification: Authentication & Login

## Purpose
This specification defines the requirements and scenarios for authentication and login in VLinkNexora, covering manual email/password login, simulated Single Sign-On (SSO), Simulation Panel actions, simulated accounts management, localization, and deep-link routing.

## Requirements

### Requirement: Manual Login Authentication
The system SHALL authenticate users using an email and password (minimum 6 characters).

#### Scenario: Successful login without prior setup
- **WHEN** the user logs in with valid credentials and no prior merchant setup exists
- **THEN** the system SHALL redirect them to the onboarding wizard

#### Scenario: Successful login with existing setup
- **WHEN** the user logs in with valid credentials and a prior merchant setup exists
- **THEN** the system SHALL redirect them directly to the merchant dashboard

#### Scenario: Missing credentials
- **WHEN** the user attempts to log in with an empty email or password
- **THEN** the system SHALL display a validation error and prevent navigation

#### Scenario: Invalid format credentials
- **WHEN** the user enters an invalid email format or password shorter than 6 characters
- **THEN** the system SHALL display a format error and prevent navigation

### Requirement: Single Sign-On (SSO) Simulation
The system SHALL simulate SSO login scenarios via the Simulation Panel.

#### Scenario: SSO with KYB
- **WHEN** the user selects the SSO with KYB simulation scenario
- **THEN** the system SHALL prefill the onboarding fields and lock them

#### Scenario: SSO without KYB
- **WHEN** the user selects SSO without KYB with a specific verification status
- **THEN** the system SHALL route the user to the merchant dashboard with that status applied

### Requirement: Demo Simulation Actions
The system SHALL provide quick simulation actions for demoing different flows.

#### Scenario: Quick dashboard entry
- **WHEN** the user selects the quick dashboard entry action
- **THEN** the system SHALL write demo merchant data and route to the dashboard

#### Scenario: Simulate staff portal
- **WHEN** the user selects the staff portal simulation action
- **THEN** the system SHALL route to the staff registration portal with invite data prefilled

#### Scenario: Staff login
- **WHEN** the user selects the staff login simulation action
- **THEN** the system SHALL log in as the demo staff and route to the staff dashboard

### Requirement: Simulated Accounts Management
The system SHALL allow managing simulated accounts via the Simulated Accounts Database panel.

#### Scenario: Auto-login from accounts list
- **WHEN** the user clicks login on a simulated account row
- **THEN** the system SHALL autofill credentials and log in to the corresponding dashboard based on the account type

#### Scenario: Cycle verification status
- **WHEN** the user cycles the verification status of a simulated business account
- **THEN** the system SHALL advance the status through the verification lifecycle

#### Scenario: Delete simulated account
- **WHEN** the user deletes a simulated account
- **THEN** the system SHALL remove it from the simulated accounts list

### Requirement: Multi-language Support
The system SHALL support English and Vietnamese localization across the authentication interface.

#### Scenario: Language toggle updates text
- **WHEN** the user toggles the language switch between English and Vietnamese
- **THEN** the system SHALL immediately translate all login text and simulation labels

### Requirement: Sign Out Navigation
The system SHALL allow users to sign out from any dashboard view.

#### Scenario: Sign out returns to login
- **WHEN** the user clicks the sign out action
- **THEN** the system SHALL clear the active session and return to the login view

### Requirement: Deep Link Access
The system SHALL support deep linking to direct entry points bypassing the login view.

#### Scenario: Route via deep link query
- **WHEN** the user accesses the app with a valid flow query parameter (e.g., `?flow=customer` or `?flow=staff-invite`)
- **THEN** the system SHALL route directly to the specified flow view

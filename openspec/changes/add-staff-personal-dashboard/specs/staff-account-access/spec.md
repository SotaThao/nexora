## ADDED Requirements

### Requirement: Account-type flag distinguishes staff from owner
The system SHALL associate every account with an account-type flag — `!personal` for staff or `!business` for merchant owners — and SHALL use this flag to determine which dashboard the account sees after login.

#### Scenario: Personal account resolves to staff context
- **WHEN** an account flagged `!personal` is loaded
- **THEN** the system treats it as a staff account and selects the staff dashboard experience

#### Scenario: Business account is unaffected
- **WHEN** an account flagged `!business` is loaded
- **THEN** the system continues to show the existing merchant dashboard, unchanged

### Requirement: Login routes a staff account to the staff dashboard
The system SHALL route a successful login for a `!personal` account to the `staff-dashboard` view, separate from the merchant `dashboard` view.

#### Scenario: Staff login lands on staff dashboard
- **WHEN** a `!personal` account completes login
- **THEN** the app renders the `staff-dashboard` view with that staff's data loaded

### Requirement: Demo entry from the Simulation Panel
For the Product Owner demo, the login Simulation Panel SHALL provide a "Staff Login" action that opens the staff dashboard signed in as the seeded demo staff.

#### Scenario: Simulation Panel opens staff dashboard
- **WHEN** the user clicks the "Staff Login" action in the Simulation Panel
- **THEN** the app switches to the `staff-dashboard` view as the demo staff without requiring credentials

### Requirement: Staff can sign out
The staff dashboard SHALL provide a sign-out action that returns the app to the login view.

#### Scenario: Sign out returns to login
- **WHEN** a signed-in staff selects sign out
- **THEN** the app returns to the login view and clears the active staff session

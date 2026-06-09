## ADDED Requirements

### Requirement: API-Mode Signup Submission
In `api` mode, the registration wizard Step 1 submission SHALL call `POST /api/v1/Authentication/signup` instead of persisting to `pendingAccounts` in localStorage.

#### Scenario: Successful signup in api mode
- **WHEN** the user submits valid credentials in api mode
- **THEN** the system SHALL call `POST /api/v1/Authentication/signup` with `{ email, password, confirmPassword, firstName, lastName, profileType:"Merchant" }` and advance to the email-verification prompt view

#### Scenario: Email already taken (api)
- **WHEN** the signup endpoint returns 400 with `errorCode: "USER_EMAIL_ALREADY_EXISTS"`
- **THEN** the system SHALL display an "email already registered" error on the email field without advancing

#### Scenario: Rate limited signup
- **WHEN** the signup endpoint returns 429 with `errorCode: "COMMON_RATE_LIMIT_EXCEEDED"`
- **THEN** the system SHALL display a "too many attempts" message

### Requirement: Email Verification Screen
In `api` mode, after successful signup the system SHALL show an email verification prompt and allow the user to verify via a token from the email link or resend the verification email.

#### Scenario: Verification link opened
- **WHEN** the user opens the email verification link (containing token + email as query params)
- **THEN** the system SHALL call `POST /api/v1/Authentication/verify-email` with `{ token, email }` and, on success, redirect the user to the sign-in screen with a success toast

#### Scenario: Verification token expired
- **WHEN** the verify-email endpoint returns 400 with `errorCode: "USER_EMAIL_VERIFICATION_TOKEN_EXPIRED"`
- **THEN** the system SHALL display an "link expired" message and offer a "Resend email" action

#### Scenario: Resend verification email
- **WHEN** the user clicks "Resend verification email"
- **THEN** the system SHALL call `POST /api/v1/Authentication/send-verification-email` with the user's email and display a confirmation toast

## MODIFIED Requirements

### Requirement: Account Data Persistence
In `storage` mode the system SHALL persist successfully submitted registration records in local storage unchanged. In `api` mode the system SHALL call the backend signup endpoint instead; no localStorage persistence of the account is performed.

#### Scenario: Persistence under pending accounts (storage mode)
- **WHEN** in storage mode the user completes Step 1 submission
- **THEN** the system SHALL save the account record under the pending accounts list in local storage

#### Scenario: API mode — no local persistence
- **WHEN** in api mode the user completes Step 1 submission
- **THEN** the system SHALL NOT write to `nexora_pending_accounts`; account creation is handled entirely by the backend

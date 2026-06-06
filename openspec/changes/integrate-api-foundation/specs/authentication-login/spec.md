## ADDED Requirements

### Requirement: API-Mode Login via Bearer Token
In `api` mode (`VITE_DATA_SOURCE=api`), the system SHALL authenticate users against the real backend using JWT Bearer tokens instead of the mock pendingAccounts list.

#### Scenario: Successful API login
- **WHEN** the user submits valid credentials in api mode
- **THEN** the system SHALL call `POST /api/v1/Authentication/signin`, store tokens via `tokenStore`, fetch `/UserProfile/me`, and route to dashboard or onboarding based on whether a business profile exists

#### Scenario: Rate limit on signin
- **WHEN** the signin endpoint returns 429 with `errorCode: "COMMON_RATE_LIMIT_EXCEEDED"`
- **THEN** the system SHALL display a "too many attempts" message with a retry countdown using `retryAfter` seconds

### Requirement: Automatic Token Refresh on Session Restore
In `api` mode, the system SHALL silently restore a session from persisted tokens on page load without requiring the user to log in again.

#### Scenario: Page reload with valid tokens
- **WHEN** the user reloads the page and valid tokens exist in `tokenStore`
- **THEN** `AuthProvider` SHALL call `getSession()`, reconstruct the session from `/UserProfile/me`, and restore the authenticated state with no login prompt

#### Scenario: Refresh token expired on reload
- **WHEN** the user reloads the page, the access token is stale, the refresh call returns `USER_INVALID_REFRESH_TOKEN`
- **THEN** `AuthProvider` SHALL clear tokens, set status to `anonymous`, and show the login screen

### Requirement: Logout Clears API Tokens
In `api` mode, sign-out SHALL clear the JWT token store in addition to clearing the React session state.

#### Scenario: Sign out in api mode
- **WHEN** the user triggers sign out in api mode
- **THEN** the system SHALL call `tokenStore.clear()`, set session to `null`, set status to `anonymous`, and navigate to the login view

## MODIFIED Requirements

### Requirement: Manual Login Authentication
The system SHALL authenticate users using an email and password. In `storage` mode the existing mock pendingAccounts flow is used unchanged. In `api` mode the system SHALL call the real backend endpoint.

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

#### Scenario: API-mode wrong credentials
- **WHEN** in api mode the backend returns `USER_LOGIN_INVALID_USERNAME_OR_PASSWORD`
- **THEN** the system SHALL display the same invalid-credentials error message as storage mode

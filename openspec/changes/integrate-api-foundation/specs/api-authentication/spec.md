## ADDED Requirements

### Requirement: API Sign-In
In `api` mode, the system SHALL authenticate users by calling `POST /api/v1/authentication/signin`, storing the returned JWT pair, and fetching `/api/v1/userprofile/me` to build the session object.

#### Scenario: Successful sign-in
- **WHEN** `apiAuthAdapter.login({ email, password })` is called with valid credentials
- **THEN** the adapter SHALL call `POST /api/v1/authentication/signin`, store `{ accessToken, refreshToken }` via `tokenStore.set()`, call `GET /api/v1/userprofile/me`, and resolve with a session object matching the shape `{ id, email, accountType, flag, displayName, role, staffId, verificationStatus }`

#### Scenario: Invalid credentials
- **WHEN** the signin endpoint returns 400 with `errorCode: "USER_LOGIN_INVALID_USERNAME_OR_PASSWORD"`
- **THEN** `apiAuthAdapter.login()` SHALL reject with the normalized ProblemDetails error; no tokens SHALL be stored

#### Scenario: Inactive account
- **WHEN** the signin endpoint returns 400 with `errorCode: "USER_ACCOUNT_INACTIVE"`
- **THEN** `apiAuthAdapter.login()` SHALL reject with the error; the UI SHALL display an appropriate i18n message

### Requirement: API Sign-Up
In `api` mode, the system SHALL register a new merchant account by calling `POST /api/v1/authentication/signup`.

#### Scenario: Successful signup
- **WHEN** `apiAuthAdapter.signup({ email, password, confirmPassword, firstName, lastName, profileType:"Merchant" })` is called with valid data
- **THEN** the adapter SHALL call `POST /api/v1/authentication/signup` and resolve with `{ userId, email, message }`; NO tokens are stored (email verification required first)

#### Scenario: Email already taken
- **WHEN** the signup endpoint returns 400 with `errorCode: "USER_EMAIL_ALREADY_EXISTS"`
- **THEN** the adapter SHALL reject with the normalized error so the UI can display "Email already registered"

#### Scenario: Password mismatch
- **WHEN** the signup endpoint returns 400 with `errorCode: "AUTH_PASSWORDS_DO_NOT_MATCH"`
- **THEN** the adapter SHALL reject with the normalized error

#### Scenario: Feature flag disabled
- **WHEN** the signup endpoint returns 400 with `errorCode: "USER_FEATURE_SIGNUP_DISABLED"`
- **THEN** the adapter SHALL reject with the normalized error so the UI can inform the user that sign-up is currently unavailable

### Requirement: Email Verification
In `api` mode, the system SHALL verify a user's email using the token from the verification link.

#### Scenario: Successful verification
- **WHEN** `apiAuthAdapter.verifyEmail({ token, email })` is called with a valid token
- **THEN** the adapter SHALL call `POST /api/v1/authentication/verify-email` and resolve on `200 OK`

#### Scenario: Expired token
- **WHEN** the verify-email endpoint returns 400 with `errorCode: "USER_EMAIL_VERIFICATION_TOKEN_EXPIRED"`
- **THEN** the adapter SHALL reject with the error so the UI can prompt the user to request a new link

#### Scenario: Invalid token
- **WHEN** the verify-email endpoint returns 400 with `errorCode: "USER_INVALID_EMAIL_VERIFICATION_TOKEN"`
- **THEN** the adapter SHALL reject with the normalized error so the UI can inform the user the token is invalid (distinct from expired)

#### Scenario: Resend verification email
- **WHEN** `apiAuthAdapter.resendVerificationEmail({ email })` is called
- **THEN** the adapter SHALL call `POST /api/v1/authentication/send-verification-email` and resolve on `200`

### Requirement: Email Already Verified (Resend)
In `api` mode, when the user requests a resend of the verification email but the account is already verified or does not exist, the adapter SHALL reject with the appropriate normalized error.

#### Scenario: Email already verified
- **WHEN** the send-verification-email endpoint returns 400 with `errorCode: "USER_EMAIL_ALREADY_VERIFIED"`
- **THEN** the adapter SHALL reject with the normalized error so the UI can inform the user their email is already verified

#### Scenario: User not found on resend
- **WHEN** the send-verification-email endpoint returns 404 with `errorCode: "USER_NOT_FOUND"`
- **THEN** the adapter SHALL reject with the normalized error

### Requirement: Password Reset
In `api` mode, the system SHALL support forgot-password and reset-password flows.

#### Scenario: Forgot password request
- **WHEN** `apiAuthAdapter.forgotPassword({ email })` is called
- **THEN** the adapter SHALL call `POST /api/v1/authentication/forgot-password`; the endpoint always returns 200 to prevent enumeration

#### Scenario: Password reset with token
- **WHEN** `apiAuthAdapter.resetPassword({ token, email, newPassword, confirmPassword })` is called with a valid token
- **THEN** the adapter SHALL call `POST /api/v1/authentication/reset-password` and resolve on `200 OK`

#### Scenario: Reset token expired
- **WHEN** the reset-password endpoint returns 400 with `errorCode: "USER_PASSWORD_RESET_TOKEN_EXPIRED"`
- **THEN** the adapter SHALL reject with the normalized error

### Requirement: Session Restore on Page Load
In `api` mode, `getSession()` SHALL restore the session from persisted tokens without requiring a re-login.

#### Scenario: Valid tokens present
- **WHEN** `apiAuthAdapter.getSession()` is called and `tokenStore.get()` returns a non-null token pair
- **THEN** the adapter SHALL call `GET /api/v1/userprofile/me` and resolve with the reconstructed session object

#### Scenario: No tokens present
- **WHEN** `apiAuthAdapter.getSession()` is called and `tokenStore.get()` returns `null`
- **THEN** the adapter SHALL resolve with `null` (anonymous)

#### Scenario: Stale access token but valid refresh token
- **WHEN** `apiAuthAdapter.getSession()` is called and the `GET /api/v1/userprofile/me` call returns 401 because the access token is stale, but a refresh token is present
- **THEN** the 401 interceptor in `httpClient` SHALL transparently call `POST /api/v1/authentication/refresh-token`, store the new token pair, retry `GET /api/v1/userprofile/me` with the new access token, and resolve with the reconstructed session object

### Requirement: Profile Type to Session Shape Mapping
The adapter SHALL map the API `profileType` field to the frontend session `accountType`/`role`/`flag` fields used by route guards and components.

**Note:** The api adapter SHALL set `ssoPrefillData: null` explicitly on every session object it returns. Mock-only flags (`clearMerchantSetup`, `clearProfileSettings`, `routeToDashboard`) SHALL NOT be set by the api adapter; they exist only in the storage/mock adapters.

#### Scenario: Merchant profile mapping
- **WHEN** `/userprofile/me` returns `{ profileType: "Merchant" }`
- **THEN** the session SHALL have `accountType: "business"`, `flag: "!business"`, `role: "owner"`

#### Scenario: User profile mapping
- **WHEN** `/userprofile/me` returns `{ profileType: "User" }`
- **THEN** the session SHALL have `accountType: "personal"`, `flag: "!personal"`, `role: "staff"`, `staffId: null` (staffId populated in a later domain integration)

#### Scenario: ssoPrefillData always null in api mode
- **WHEN** the api adapter builds any session object from a `/userprofile/me` response
- **THEN** the session object SHALL always contain `ssoPrefillData: null` and SHALL NOT include `clearMerchantSetup`, `clearProfileSettings`, or `routeToDashboard`

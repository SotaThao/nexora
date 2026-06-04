## ADDED Requirements

### Requirement: Authentication accessed only through `useAuth`
Authentication state and actions SHALL be exposed through a single `AuthProvider` + `useAuth()` hook providing `{ session, status, login, logout }`. No component, page, or routing logic SHALL import `mockSso` or read `nexora_pending_accounts` for auth directly.

#### Scenario: Routing depends on the abstraction
- **WHEN** the app decides which view to render for the signed-in user
- **THEN** it reads `useAuth().session` (and its account flag) rather than importing `mockSso` or parsing storage

#### Scenario: No direct mock imports remain
- **WHEN** the auth migration is complete
- **THEN** no file outside `src/auth/adapters/` imports `mockSso`

### Requirement: Auth implementation behind a swappable adapter
`useAuth` SHALL delegate to an auth adapter resolved by `VITE_DATA_SOURCE`. The default `mockAuthAdapter` SHALL reproduce the current mock SSO behavior; an `apiAuthAdapter` stub SHALL exist for the future httpOnly-cookie session, using `httpClient`.

#### Scenario: Mock adapter preserves current login behavior
- **WHEN** `VITE_DATA_SOURCE` is `'storage'` and valid demo credentials are submitted
- **THEN** `login` authenticates exactly as the current `mockSso` does, including `!personal` vs `!business` routing

#### Scenario: API auth adapter is selectable but not implemented
- **WHEN** `VITE_DATA_SOURCE` is `'api'`
- **THEN** `useAuth` uses `apiAuthAdapter`, whose methods throw `NotImplemented` until the API phase

### Requirement: Session shape is transport-agnostic
The `session` object exposed by `useAuth` SHALL describe the user (id, account type/flag, display fields) without exposing passwords, tokens, or storage internals, so the cookie-based API adapter can satisfy the same shape.

#### Scenario: Adapter swap does not change consumers
- **WHEN** the auth adapter changes from `mockAuthAdapter` to `apiAuthAdapter`
- **THEN** components reading `useAuth()` require no changes, and no password or raw token is present on `session`

### Requirement: Behavior parity for authentication flows
The abstraction SHALL preserve current login/logout/registration-routing behavior while backed by `mockAuthAdapter`.

#### Scenario: Existing auth verification stays green
- **WHEN** the app runs with `mockAuthAdapter` after migration
- **THEN** the `verify-authentication-login` scenarios pass unchanged

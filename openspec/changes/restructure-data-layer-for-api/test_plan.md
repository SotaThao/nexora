# Feature-Focused Test Plan: Data Layer/Auth Cleanup

## Scope

Validate the remaining OpenSpec tasks:

- 5.6: Direct unit coverage for `mockAuthAdapter` and `useAuth`.
- 6.4: Manual smoke coverage for merchant dashboard, customer tip flow, staff dashboard, register, and settings after the data-layer migration.

## Test Cases

### Auth Adapter Unit Tests

- Preconditions: `pendingAccountsRepository.list()` is mocked per scenario.
- Actions:
  - Login with missing credentials.
  - Login with registered business credentials.
  - Login with registered staff/personal credentials.
  - Login with incorrect password.
  - Login with SSO no-KYB simulated status.
  - Login with a staff email found in `nexora_merchant_setup`.
- Expected results:
  - Failures throw stable error codes.
  - Business sessions return `flag: '!business'`, owner role, and expected verification/prefill data.
  - Staff/personal sessions return `flag: '!personal'` or staff role with staff id.
  - Session payloads do not expose passwords.

### Auth Provider Hook Unit Tests

- Preconditions: provider mounted in a test render tree.
- Actions:
  - Wait for initial session restore.
  - Call `login()`.
  - Call `logout()`.
- Expected results:
  - Initial status becomes `anonymous`.
  - Successful login sets `authenticated` and exposes the session.
  - Logout resets status to `anonymous` and clears session.

### Browser Smoke Tests

- Preconditions: Vite dev server running, clean browser storage per flow.
- Actions:
  - Load owner dashboard via quick demo login.
  - Open Settings from dashboard.
  - Load customer flow via `?flow=customer`.
  - Load staff invite flow via `?flow=staff-invite`.
  - Trigger staff dashboard from login simulation panel.
- Expected results:
  - Screens load without runtime console errors.
  - Core migrated data appears after route changes.
  - No obvious blank screens or broken navigation.

## Execution Strategy

- Unit/integration: Vitest targeted test file plus full suite.
- Browser smoke: Playwright-driven browser script against local Vite dev server, desktop and mobile-sized checkpoints where practical.

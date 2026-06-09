## ADDED Requirements

### Requirement: Staff Profile Read
The personal (staff) dashboard SHALL read the signed-in staff member's profile from `GET /api/v1/userprofile/me` via `profileSettingsRepository.get()` and the `useProfileSettings()` / `useStaffAccount()` read path, so `StaffProfile.jsx` displays real identity and profile fields.

#### Scenario: Profile loads
- **WHEN** a staff member opens the Profile screen
- **THEN** the read path SHALL call `GET /api/v1/userprofile/me` and render the real first/last name, email, phone, position, photo, and bio

#### Scenario: Profile read replaces null stub
- **WHEN** `profileSettingsRepository.get()` is called
- **THEN** it SHALL return the mapped profile object from `/userprofile/me` (no longer `null`)

### Requirement: Staff Verified Status
The staff dashboard SHALL read verification status from `GET /api/v1/userprofile/verified-status` via `profileSettingsRepository.getVerifiedStatus()` and a `useVerifiedStatus()` hook keyed by `qk.verifiedStatus()`, to drive any "verify your email/account" prompts.

#### Scenario: Verified status loads
- **WHEN** the staff dashboard mounts
- **THEN** it SHALL call `GET /api/v1/userprofile/verified-status` and expose the verification flags to the UI

### Requirement: Staff Payment Methods Read
The staff Pay screen (`StaffPay.jsx`) SHALL read the staff member's payment methods from `GET /api/v1/staff/payment-methods` via `staffPaymentMethodsRepository.getAll()`, displaying each method's type, configured state, and active state.

Raw `accountInfo` SHALL only be shown to the owning staff member (per the privacy rules in the API spec §3).

#### Scenario: Payment methods load
- **WHEN** a staff member opens the Pay screen
- **THEN** it SHALL call `GET /api/v1/staff/payment-methods` and render each method with its `isConfigured` / `isActive` state

#### Scenario: No method configured
- **WHEN** all returned methods are inactive/unconfigured
- **THEN** the Pay screen SHALL prompt the staff member to configure at least one method (mirroring the "visible on touch page only after one active+configured method" rule)

### Requirement: Composed Staff Account Object
`staffAccountsRepository.get()` SHALL compose the personal-dashboard account object from `/api/v1/userprofile/me` (identity/profile) and `/api/v1/staff/payment-methods` (Pay), replacing the `null`-returning stub. `StaffAccountContext` SHALL consume this composed object.

#### Scenario: Account composition
- **WHEN** `useStaffAccount()` resolves in the personal dashboard
- **THEN** the composed object SHALL include real `profile` and `paymentMethods`, and SHALL expose `tips: []`, `staffReviews: []`, and zeroed `kpis` carrying an `isPending: true` marker for the not-yet-available surfaces

### Requirement: Deferred Staff Tips / Reviews / KPIs (Backend Dependency)
Because no staff-facing tips/earnings/reviews endpoint exists in the API spec, the staff `Home`, `Tips`, and `Reviews` screens SHALL render explicit, intentional empty states — never fabricated numbers — until the backend exposes `/api/v1/staff/dashboard/*`.

#### Scenario: Staff Home KPIs pending
- **WHEN** a staff member opens Home and `kpis.isPending` is true
- **THEN** Home SHALL render the KPI tiles in a "coming soon / no data yet" state with explanatory copy, not zeros presented as earnings

#### Scenario: Staff Tips screen pending
- **WHEN** a staff member opens the Tips screen and no tips endpoint is available
- **THEN** the screen SHALL render an empty state ("Your tip history will appear here") and SHALL NOT call a non-existent endpoint

#### Scenario: Staff Reviews screen pending
- **WHEN** a staff member opens the Reviews screen and no staff-reviews endpoint is available
- **THEN** the screen SHALL render an empty state and SHALL NOT call a non-existent endpoint

### Requirement: Staff Notifications
The staff dashboard SHALL consume the shared notification capability (`api-notifications`): the feed, unread badge, and mark-read actions in `StaffNotifications.jsx` / `StaffHeader.jsx` SHALL use the same `/api/v1/notifications/*` endpoints as the merchant dashboard.

#### Scenario: Staff notifications load
- **WHEN** a staff member opens the Notifications screen
- **THEN** it SHALL call `GET /api/v1/notifications` and render the feed, with the header bell reflecting `GET /api/v1/notifications/unread-count`

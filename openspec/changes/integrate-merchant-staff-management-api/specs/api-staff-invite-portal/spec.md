## ADDED Requirements

### Requirement: Staff Invite Token Load
The staff invite portal SHALL load invite metadata from `GET /api/v1/staff/invite/{token}` using an anonymous request.

#### Scenario: Invite metadata loads
- **WHEN** a staff invitee opens a real invite token URL
- **THEN** the frontend SHALL call `GET /api/v1/staff/invite/{token}` with `{ anonymous: true }`
- **AND** render `businessName`, `invitedName`, and `invitedPosition` from `InviteInfoDto`

#### Scenario: Invite token missing
- **WHEN** the staff invite portal opens without a token
- **THEN** the frontend SHALL render an invalid invite state and SHALL NOT call the invite endpoint

#### Scenario: Invite token invalid or expired
- **WHEN** the endpoint returns `400` or `404`
- **THEN** the portal SHALL render an expired or unavailable invite state instead of prefilled demo data

### Requirement: Staff Invite Acceptance
The staff invite portal SHALL accept invite tokens through `POST /api/v1/staff/invite/{token}/accept`.

#### Scenario: Accept invite
- **WHEN** the invitee submits profile acceptance data
- **THEN** the frontend SHALL call `POST /api/v1/staff/invite/{token}/accept` with `{ anonymous: true }`
- **AND** send `displayName`, optional `position`, optional `bio`, and optional `photoUrl`
- **AND** treat `204` as successful acceptance

#### Scenario: Accept invite validation fails
- **WHEN** the endpoint returns `400 ProblemDetails`
- **THEN** the portal SHALL keep the user on the current step and display the mapped validation error

### Requirement: Invite Token Ownership
The invite token SHALL be parsed from the route/path layer and passed into staff invite hooks; components SHALL NOT construct invite state from `CustomEvent` details or `biz` query parameters in API-backed flows.

#### Scenario: Real token path
- **WHEN** the URL contains `/staff/invite/{token}`
- **THEN** the app shell SHALL route to the staff invite portal with that token

#### Scenario: Simulation query ignored in API-backed flow
- **WHEN** the URL contains only `?flow=staff-invite&biz=...`
- **THEN** the API-backed invite portal SHALL NOT treat the business name query parameter as trusted invite metadata

### Requirement: Invite Acceptance Follow-up
After a successful invite acceptance, the staff setup flow SHALL continue through the existing staff-owned profile/payment setup surfaces and SHALL NOT let the merchant edit staff-owned payment data.

#### Scenario: Acceptance succeeds
- **WHEN** `POST /api/v1/staff/invite/{token}/accept` returns `204`
- **THEN** the portal SHALL advance to the appropriate next staff setup state without creating local merchant staff rows

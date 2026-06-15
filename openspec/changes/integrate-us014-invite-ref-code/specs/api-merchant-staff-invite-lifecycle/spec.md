## ADDED Requirements

### Requirement: List Staff Invites
The merchant staff surface SHALL load pending/historic invites from `GET /api/v1/merchant/staff/invites` via a repository and TanStack Query hook, supporting `Keyword`, `StatusFilter`, `PageNumber`, and `PageSize` query params.

#### Scenario: Invites list loads
- **WHEN** an authenticated merchant requests the invite list
- **THEN** the frontend SHALL call `GET /api/v1/merchant/staff/invites`
- **AND** normalize each `StaffInviteListItemDto` into `{ inviteId, invitedName, invitedEmail, invitedPhone, invitedPosition, status, expiresAt, invitedAt, acceptedAt, acceptedByUserProfileId }`

#### Scenario: Query params omitted
- **WHEN** no query params are provided
- **THEN** the frontend SHALL call `GET /api/v1/merchant/staff/invites` without a query string

### Requirement: Staff Invite Detail
The frontend SHALL fetch a single invite from `GET /api/v1/merchant/staff/invites/{inviteId}` when an invite detail is requested.

#### Scenario: Invite detail loads
- **WHEN** an invite detail is requested with a valid `inviteId`
- **THEN** the frontend SHALL call `GET /api/v1/merchant/staff/invites/{inviteId}`
- **AND** normalize the `StaffInviteDetailDto`, preserving `acceptedByUserProfileId`

### Requirement: Cancel Staff Invite
A merchant SHALL cancel/revoke a pending invite through `DELETE /api/v1/merchant/staff/invites/{inviteId}`, and the staff roster/invite caches SHALL refresh afterward.

#### Scenario: Cancel a pending invite
- **WHEN** a merchant confirms cancelling a pending invite row
- **THEN** the frontend SHALL call `DELETE /api/v1/merchant/staff/invites/{inviteId}`
- **AND** invalidate `qk.merchantStaff()` so the roster and invite list re-fetch

#### Scenario: Delete routes invites to the dedicated endpoint
- **WHEN** `deleteStaff` is invoked on a row with `itemType = "invite"` and an `inviteId`
- **THEN** the frontend SHALL use `DELETE /api/v1/merchant/staff/invites/{inviteId}` rather than `DELETE /api/v1/merchant/staff/{staffLinkId}`

### Requirement: Staff Detail By Code
The frontend SHALL fetch full staff detail from `GET /api/v1/merchant/staff/{staffCode}` and normalize it with the existing staff-list normalizer.

#### Scenario: Fetch staff by code
- **WHEN** a staff detail is requested by `staffCode`
- **THEN** the frontend SHALL call `GET /api/v1/merchant/staff/{staffCode}`
- **AND** return a normalized staff row preserving `staffCode` and `displayName`

### Requirement: Referral & Invite Error Messaging
Invite and public-join failures SHALL surface localized, human-readable messages mapped from the server `errorCode`, falling back to a generic message for unmapped codes.

#### Scenario: Friendly message for a mapped code
- **WHEN** an invite or public-join request fails with a mapped referral/invite `errorCode` (invalid, expired, revoked, disabled link, or duplicate)
- **THEN** the UI SHALL display the corresponding `errors.*` translation in the active language

#### Scenario: Fallback for unmapped code
- **WHEN** the failure carries an `errorCode` not present in the map
- **THEN** the UI SHALL display `errors.unknown_error`

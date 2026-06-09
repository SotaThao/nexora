## ADDED Requirements

### Requirement: Merchant Staff List
The merchant Staff screen SHALL load staff links and pending invites from `GET /api/v1/merchant/staff` via a repository and TanStack Query hook, not from `merchantSetup.staffList` or component-local seed data.

#### Scenario: Staff list loads
- **WHEN** an authenticated merchant opens the Staff screen
- **THEN** the frontend SHALL call `GET /api/v1/merchant/staff`
- **AND** render both `itemType = "link"` accepted staff rows and `itemType = "invite"` pending invite rows

#### Scenario: Staff list empty
- **WHEN** the endpoint returns an empty array
- **THEN** the Staff screen SHALL render an intentional empty state prompting the merchant to invite or link staff

### Requirement: Staff List DTO Normalization
The merchant staff repository SHALL normalize `StaffListItemDto` into the existing dashboard staff row shape while preserving API identifiers required for follow-up actions.

#### Scenario: Link item normalization
- **WHEN** the API returns a row with `itemType = "link"`
- **THEN** the normalized row SHALL preserve `staffLinkId`, `staffProfileId`, `staffCode`, `sortOrder`, `isProfileComplete`, `tipCount`, and `averageRating`
- **AND** map `displayName` to `fullName`, `photoUrl` to `avatar`, and active state from server `status`

#### Scenario: Invite item normalization
- **WHEN** the API returns a row with `itemType = "invite"`
- **THEN** the normalized row SHALL preserve `inviteId`
- **AND** render as a pending invite action row without fabricating a staff profile id

### Requirement: Staff Invite
The merchant Staff screen SHALL create pending staff invites through `POST /api/v1/merchant/staff/invite` using `InviteStaffCommand`.

#### Scenario: Invite by email
- **WHEN** the merchant submits an invite with a name, email contact, and position
- **THEN** the frontend SHALL call `POST /api/v1/merchant/staff/invite`
- **AND** send `{ invitedName, invitedEmail, invitedPhone: null, invitedPosition }`
- **AND** invalidate the merchant staff list after the `201 { inviteId }` response

#### Scenario: Invite by phone
- **WHEN** the merchant submits an invite with a name, phone contact, and position
- **THEN** the frontend SHALL send `{ invitedName, invitedPhone, invitedEmail: null, invitedPosition }`

#### Scenario: Invite validation fails
- **WHEN** the endpoint returns `400 ProblemDetails`
- **THEN** the UI SHALL keep the invite form open and display the mapped validation error

### Requirement: Resend Invite
The merchant Staff screen SHALL resend pending invite links through `POST /api/v1/merchant/staff/{inviteId}/resend`.

#### Scenario: Resend pending invite
- **WHEN** the merchant clicks resend on an invite row
- **THEN** the frontend SHALL call `POST /api/v1/merchant/staff/{inviteId}/resend`
- **AND** show success only after the `204` response
- **AND** invalidate the merchant staff list

### Requirement: Search Existing Staff
The merchant Staff screen SHALL search existing staff profiles through `GET /api/v1/merchant/staff/search?q=...` instead of using `MOCK_NEXORA_STAFF_PROFILES`.

#### Scenario: Search returns matches
- **WHEN** the merchant enters a non-empty staff search query
- **THEN** the frontend SHALL call `GET /api/v1/merchant/staff/search?q={query}`
- **AND** render `StaffSearchResultDto` rows with `staffProfileId`, `staffCode`, `displayName`, `photoUrl`, and `position`

#### Scenario: Search query empty
- **WHEN** the staff search query is empty
- **THEN** the frontend SHALL NOT call the search endpoint

### Requirement: Link Existing Staff
The merchant Staff screen SHALL send a link request for an existing staff profile through `POST /api/v1/merchant/staff/link-request/{staffProfileId}`.

#### Scenario: Link request sent
- **WHEN** the merchant selects a search result and confirms linking
- **THEN** the frontend SHALL call `POST /api/v1/merchant/staff/link-request/{staffProfileId}`
- **AND** invalidate the merchant staff list after `204`

#### Scenario: Link request conflict
- **WHEN** the endpoint returns `400` or `404`
- **THEN** the UI SHALL display the mapped error and SHALL NOT add a local staff row

### Requirement: Staff Status Update
The merchant Staff screen SHALL update active/inactive/rejected staff link state through `PUT /api/v1/merchant/staff/{staffLinkId}/status`.

#### Scenario: Deactivate staff link
- **WHEN** the merchant toggles an active staff link off
- **THEN** the frontend SHALL call `PUT /api/v1/merchant/staff/{staffLinkId}/status`
- **AND** send `{ staffLinkId, status: "Inactive" }`
- **AND** invalidate the merchant staff list after `204`

#### Scenario: Activate staff link
- **WHEN** the merchant toggles an inactive staff link on
- **THEN** the frontend SHALL send `{ staffLinkId, status: "Active" }`

### Requirement: Staff Reorder
The merchant Staff screen SHALL persist staff ordering through `PUT /api/v1/merchant/staff/reorder` using the Swagger `ReorderStaffCommand` shape.

#### Scenario: Reorder staff links
- **WHEN** the merchant changes staff display order
- **THEN** the frontend SHALL call `PUT /api/v1/merchant/staff/reorder`
- **AND** send `{ items: [{ staffLinkId, sortOrder }] }`
- **AND** invalidate the merchant staff list after `204`

### Requirement: Remove Staff Link
The merchant Staff screen SHALL unlink staff through `DELETE /api/v1/merchant/staff/{staffLinkId}`.

#### Scenario: Remove linked staff
- **WHEN** the merchant confirms deleting or unlinking a staff link
- **THEN** the frontend SHALL call `DELETE /api/v1/merchant/staff/{staffLinkId}`
- **AND** remove the row only after the `204` response or staff list refetch

### Requirement: Server State Boundary
Merchant staff management SHALL use the repository/hook boundary for all API-backed data and mutations.

#### Scenario: No local-only staff mutation
- **WHEN** the staff-management integration is complete
- **THEN** invite, resend, link, status, reorder, and remove actions SHALL NOT create temporary staff rows with local `setStaff()` as the source of truth
- **AND** components SHALL NOT call `httpClient`, `fetch`, storage APIs, or mock registries directly

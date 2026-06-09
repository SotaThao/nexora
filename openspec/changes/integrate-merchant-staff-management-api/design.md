## Context

`integrate-dashboard-api` explicitly deferred staff-management mutations. The current implementation still uses local client state in `src/components/dashboard/hooks/useStaffManagement.js`:

- `sendSetupLinkFromModal()` creates a local pending member and dispatches `showSimulationInvite`.
- `handleInviteStaff()` creates a local pending member and dispatches `showSimulationInvite`.
- `handleLinkStaff()` appends a local pending member.
- `saveStaff()`, `handleAcceptJoinRequest()`, `deleteStaff()`, `toggleStaff()`, and `toggleStaffTipsFlow()` only mutate local React state.

`src/components/dashboard/views/StaffView.jsx` also searches `MOCK_NEXORA_STAFF_PROFILES`, while API mode has no real `merchantSetup.staffList` source because `merchantsRepository.getSetup()` maps business data with `staffList: []`.

## Source Contract

### Docs

`API/nexora-touch-end-user-ai-coding-spec.md` section 4.3 lists the staff-management endpoints and requires the staff list to show both accepted staff links and pending invites via `itemType = link | invite`.

Section 4.4 says staff invite tokens expire after 7 days and are read from the URL path.

### Swagger

`spec.json` confirms these operations:

| Operation | Request | Success |
| --- | --- | --- |
| `POST /api/v1/merchant/staff/invite` | `InviteStaffCommand { invitedName, invitedPhone?, invitedEmail?, invitedPosition? }` | `201 InviteStaffResponseDto { inviteId }` |
| `POST /api/v1/merchant/staff/{inviteId}/resend` | no body | `204` |
| `GET /api/v1/merchant/staff` | no body | `200 StaffListItemDto[]` |
| `GET /api/v1/merchant/staff/search?q=...` | query `q` | `200 StaffSearchResultDto[]` |
| `POST /api/v1/merchant/staff/link-request/{staffProfileId}` | no body | `204` |
| `PUT /api/v1/merchant/staff/{staffLinkId}/status` | `UpdateStaffStatusCommand { staffLinkId, status }` | `204` |
| `PUT /api/v1/merchant/staff/reorder` | `ReorderStaffCommand { items: [{ staffLinkId, sortOrder }] }` | `204` |
| `DELETE /api/v1/merchant/staff/{staffLinkId}` | no body | `204` |
| `GET /api/v1/staff/invite/{token}` | no body, anonymous | `200 InviteInfoDto { invitedName, invitedPosition?, businessName }` |
| `POST /api/v1/staff/invite/{token}/accept` | `AcceptInviteCommand { token, displayName, position?, bio?, photoUrl? }` | `204` |

## Decisions

### D1 - Create a dedicated merchant staff repository

Add `src/data/repositories/merchantStaff.js` with methods matching domain intent:

- `list()`
- `invite({ name, email, phone, position })`
- `resendInvite(inviteId)`
- `search(q)`
- `sendLinkRequest(staffProfileId)`
- `updateStatus(staffLinkId, status)`
- `reorder(items)`
- `remove(staffLinkId)`

The repository maps existing UI field names to Swagger DTOs and normalizes `StaffListItemDto` into the shape the dashboard uses, while preserving API ids:

- `id`: keep as existing row id for React keys.
- `staffLinkId`: set when `itemType === "link"`.
- `inviteId`: set when `itemType === "invite"`.
- `staffProfileId`, `staffCode`, `itemType`, `sortOrder`, `isProfileComplete`, `tipCount`, `averageRating`: preserve for actions and metrics.
- `fullName`: map from `displayName`.
- `avatar`: map from `photoUrl`.
- `isActive`: derive from `status === "Active"` or `status === "Accepted"`.
- `showInTipsFlow`: derive from active status; do not persist separately because the backend status is the source of truth.

### D2 - Query keys and hooks own server state

Add query keys:

```js
merchantStaff: () => ['merchantStaff']
merchantStaffSearch: (q) => ['merchantStaff', 'search', q]
staffInvite: (token) => ['staffInvite', token]
```

Add hooks:

- `useMerchantStaff()`
- `useInviteStaff()`
- `useResendStaffInvite()`
- `useSearchMerchantStaff(q)`
- `useSendStaffLinkRequest()`
- `useUpdateMerchantStaffStatus()`
- `useReorderMerchantStaff()`
- `useRemoveMerchantStaff()`
- `useStaffInvite(token)`
- `useAcceptStaffInvite()`

Every mutation invalidates `qk.merchantStaff()` or `qk.staffInvite(token)` as appropriate. Components do not write staff rows directly after successful mutations; they refetch the canonical list.

### D3 - Use Swagger reorder shape, not the docs prose

Docs mention `orderedLinkIds`, but Swagger defines `ReorderStaffCommand.items[{ staffLinkId, sortOrder }]`. Use the Swagger body because it is the executable contract.

### D4 - Treat invite tokens as path-owned

The docs say the token is read from the URL path and must not be included in the body. Swagger currently includes `token` in `AcceptInviteCommand`.

Implementation should keep the token source in the route/path and hide this mismatch inside `staffInvitesRepository.accept(token, dto)`. The repository can include `token` in the request body only if the live API requires the Swagger shape; components must not duplicate token handling.

### D5 - Remove simulation event dependency from API flows

`CustomEvent('showSimulationInvite')` and query-string links such as `?flow=staff-invite&biz=...` are demo mechanics. API mode should rely on the backend to send magic-link email/SMS after `POST /merchant/staff/invite`, then render pending status from `GET /merchant/staff`.

The staff invite portal should support real token URLs, ideally `/staff/invite/{token}`. If the current SPA shell cannot add route segments immediately, a transitional parser may support `?flow=staff-invite&token=...`, but the URL-path token remains the target behavior.

### D6 - Direct staff profile editing is out of scope

Swagger does not expose a merchant endpoint to create or edit staff profile/payment details. The merchant can invite, link, status-update, reorder, resend, and unlink. Staff-owned profile/payment edits stay in the staff self-setup and staff dashboard flows.

The existing `StaffModal` edit/save experience must be narrowed so it does not imply the merchant can mutate profile/payment data that the API does not support.

## Open Questions

1. Allowed values for `UpdateStaffStatusCommand.status`: docs list `Pending`, `Active`, `Inactive`, `Rejected`, `Accepted`, `Expired`, `Cancelled`, but Swagger uses plain string.
2. `POST /merchant/staff/link-request/{staffProfileId}` has no body. Can the merchant-selected role/position be sent, or should the UI remove that role selector for link requests?
3. Does `POST /staff/invite/{token}/accept` require `token` in the JSON body despite docs saying not to include it?
4. Does invite delivery support both email and phone/SMS, or does backend send only email when `invitedEmail` is present?
5. Should an invite acceptance also create credentials/sign-in, or is it only a profile acceptance step followed by existing auth/payment-method flows?

## Migration Plan

1. Add repository + hooks + tests for exact endpoint calls and DTO normalization.
2. Wire merchant Staff screen reads to `useMerchantStaff()` and replace mock search with backend search.
3. Replace invite/link/resend/status/delete handlers with mutations and query invalidation.
4. Add real token loading/acceptance in staff invite portal.
5. Remove production dependency on simulation invite events and local temporary staff ids.
6. Run targeted tests, `pnpm build`, and `npx openspec validate integrate-merchant-staff-management-api --strict`.

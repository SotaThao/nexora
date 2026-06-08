## Why

The merchant Staff screen still behaves as a local simulator. Staff invite, link, status, delete, and resend actions update React `useState`, create temporary `NEX-STAFF-*` ids, and dispatch `CustomEvent('showSimulationInvite')` instead of calling the REST API.

The API docs and local Swagger already expose the required backend surface:

- Docs: `API/nexora-touch-end-user-ai-coding-spec.md`, section 4.3 Merchant Staff Management and section 4.4 Staff Self-Setup.
- Swagger: `spec.json` paths under `MerchantStaff` and `Staff`.

This change plans the API integration so merchant staff management becomes server-backed and the staff invite portal loads/accepts real invite tokens instead of query-string demo data.

## What Changes

- Add a staff-management repository and hooks for:
  - `GET /api/v1/merchant/staff`
  - `POST /api/v1/merchant/staff/invite`
  - `POST /api/v1/merchant/staff/{inviteId}/resend`
  - `GET /api/v1/merchant/staff/search?q=...`
  - `POST /api/v1/merchant/staff/link-request/{staffProfileId}`
  - `PUT /api/v1/merchant/staff/{staffLinkId}/status`
  - `PUT /api/v1/merchant/staff/reorder`
  - `DELETE /api/v1/merchant/staff/{staffLinkId}`
- Add staff invite portal repository/hooks for:
  - `GET /api/v1/staff/invite/{token}`
  - `POST /api/v1/staff/invite/{token}/accept`
- Wire `Dashboard.jsx`, `useStaffManagement.js`, `StaffView.jsx`, `StaffModal.jsx`, and `InviteShareModal.jsx` to TanStack Query mutations instead of local-only staff mutations.
- Replace mock staff search (`MOCK_NEXORA_STAFF_PROFILES`) in the merchant staff surface with backend search.
- Stop persisting staff list through `merchantSetup.staffList`; in API mode `merchantSetup.getSetup()` intentionally returns `staffList: []`.
- Remove simulation invite events from production API flows.

## Capabilities

### New Capabilities

- `api-merchant-staff-management`: merchant staff list, invite, resend, search, link request, status update, reorder, and unlink through the `MerchantStaff` API.
- `api-staff-invite-portal`: staff invite landing and invite acceptance through tokenized public staff endpoints.

## Impact

- **Files likely new**: `src/data/repositories/merchantStaff.js`, `src/data/repositories/staffInvites.js`, `src/data/hooks/useMerchantStaff.js`, `src/data/hooks/useStaffInvites.js`.
- **Files likely modified**: `src/data/queryKeys.js`, `src/components/Dashboard.jsx`, `src/components/dashboard/hooks/useStaffManagement.js`, `src/components/dashboard/views/StaffView.jsx`, `src/components/dashboard/modals/StaffModal.jsx`, `src/components/dashboard/modals/InviteShareModal.jsx`, `src/components/StaffRegistrationWizard.jsx`, `src/components/staff-registration/hooks/useStaffRegistration.js`, `src/App.jsx`, `src/locales/en.json`, `src/locales/vi.json`, and focused repository/hook tests.
- **Data boundary**: components -> data hooks -> repositories -> `httpClient`; no direct `fetch`, storage, mock registry, or `CustomEvent` simulation in components.
- **Non-goal**: direct-add/save of arbitrary staff profile data from the merchant UI. Docs/swagger do not expose a merchant endpoint to create or edit staff profile/payment data. The UI should move direct-add into invite/link flows or make unsupported edits read-only.

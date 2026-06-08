## 1. Contract and Query Keys

- [ ] 1.1 Add `qk.merchantStaff()`, `qk.merchantStaffSearch(q)`, and `qk.staffInvite(token)` to `src/data/queryKeys.js`
- [ ] 1.2 Confirm `httpClient.del()` is used for `DELETE /api/v1/merchant/staff/{staffLinkId}` and `anonymous: true` is passed for public invite endpoints
- [ ] 1.3 Add i18n/error mapping for common staff-management API failures (`COMMON_VALIDATION_ERROR`, `COMMON_FORBIDDEN`, `COMMON_NOT_FOUND`, invite expired/not found if backend returns specific codes)

## 2. Merchant Staff Repository

- [ ] 2.1 Create `src/data/repositories/merchantStaff.js` with `createMerchantStaffRepository(client = httpClient)`
- [ ] 2.2 Implement `list()` -> `GET /api/v1/merchant/staff`
- [ ] 2.3 Implement `invite({ name, email, phone, position })` -> `POST /api/v1/merchant/staff/invite` with `InviteStaffCommand`
- [ ] 2.4 Implement `resendInvite(inviteId)` -> `POST /api/v1/merchant/staff/{inviteId}/resend`
- [ ] 2.5 Implement `search(q)` -> `GET /api/v1/merchant/staff/search?q={q}`
- [ ] 2.6 Implement `sendLinkRequest(staffProfileId)` -> `POST /api/v1/merchant/staff/link-request/{staffProfileId}`
- [ ] 2.7 Implement `updateStatus(staffLinkId, status)` -> `PUT /api/v1/merchant/staff/{staffLinkId}/status` with both path id and body `staffLinkId`
- [ ] 2.8 Implement `reorder(items)` -> `PUT /api/v1/merchant/staff/reorder` with `{ items: [{ staffLinkId, sortOrder }] }`
- [ ] 2.9 Implement `remove(staffLinkId)` -> `DELETE /api/v1/merchant/staff/{staffLinkId}`
- [ ] 2.10 Normalize `StaffListItemDto` and `StaffSearchResultDto` to existing dashboard-friendly domain shapes while preserving API ids
- [ ] 2.11 Vitest repository tests: endpoint/method/body for each operation, query param encoding, list/search normalization, error propagation

## 3. Merchant Staff Hooks

- [ ] 3.1 Create `src/data/hooks/useMerchantStaff.js`
- [ ] 3.2 Add `useMerchantStaff()` query keyed by `qk.merchantStaff()`
- [ ] 3.3 Add invite/resend/link/status/reorder/delete mutation hooks that invalidate `qk.merchantStaff()`
- [ ] 3.4 Add `useSearchMerchantStaff(q)` with debounce or enabled guard for non-empty search terms
- [ ] 3.5 Vitest hook tests with QueryClient: successful mutation invalidates staff list; failed mutation leaves cache unchanged

## 4. Merchant Staff UI Wiring

- [ ] 4.1 Replace staff initialization from `merchantSetupData.staffList` with `useMerchantStaff()` data in `Dashboard.jsx`
- [ ] 4.2 Stop the staff/touchpoint autosave effect from calling `useSaveMerchantSetup()` for staff-list mutations in API mode
- [ ] 4.3 Refactor `useStaffManagement.js` so invite/link/resend/status/delete handlers call mutation hooks instead of `setStaff()`
- [ ] 4.4 Remove temporary `NEX-STAFF-*` invite ids for API-backed rows; use `inviteId`, `staffLinkId`, and `staffProfileId`
- [ ] 4.5 Replace `StaffView.jsx` mock search with `useSearchMerchantStaff(q)` results
- [ ] 4.6 Wire `handleResendInvite()` to `useResendStaffInvite()` instead of a toast-only simulator
- [ ] 4.7 Map active/inactive toggles to `useUpdateMerchantStaffStatus(staffLinkId, status)`
- [ ] 4.8 Map delete/unlink actions to `useRemoveMerchantStaff(staffLinkId)` after confirmation
- [ ] 4.9 Disable or redesign direct-add/save profile editing that has no backend endpoint; direct creation should become invite or link request
- [ ] 4.10 Ensure all loading, pending, error, and empty states are explicit in the Staff screen

## 5. Staff Invite Portal Repository and Hooks

- [ ] 5.1 Create `src/data/repositories/staffInvites.js`
- [ ] 5.2 Implement `getInfo(token)` -> `GET /api/v1/staff/invite/{token}` with `{ anonymous: true }`
- [ ] 5.3 Implement `accept(token, dto)` -> `POST /api/v1/staff/invite/{token}/accept` with `{ displayName, position, bio, photoUrl }`; include body `token` only if live Swagger requires it
- [ ] 5.4 Create `src/data/hooks/useStaffInvites.js` with `useStaffInvite(token)` and `useAcceptStaffInvite()`
- [ ] 5.5 Vitest tests for anonymous requests, token encoding, invite-info mapping, accept body shape, 400/404 handling

## 6. Staff Invite Portal UI Wiring

- [ ] 6.1 Update `App.jsx` routing/parser to detect real invite token URLs (`/staff/invite/{token}` target; optional transitional `?flow=staff-invite&token=...`)
- [ ] 6.2 Load invite metadata in `StaffRegistrationWizard.jsx` / `useStaffRegistration()` from `useStaffInvite(token)` instead of relying on `CustomEvent` detail or `biz` query params
- [ ] 6.3 Map `InviteInfoDto` to portal display fields (`businessName`, `invitedName`, `invitedPosition`)
- [ ] 6.4 Submit acceptance through `useAcceptStaffInvite()` and handle `204` success
- [ ] 6.5 Render expired/not-found invite states for 400/404 instead of allowing a blank wizard
- [ ] 6.6 Keep staff-owned payment-method configuration in the existing `/api/v1/staff/payment-methods` flow after acceptance

## 7. Cleanup and Guardrails

- [ ] 7.1 Remove merchant Staff screen dependency on `MOCK_NEXORA_STAFF_PROFILES`
- [ ] 7.2 Remove production API path dependency on `showSimulationInvite` events
- [ ] 7.3 Ensure no component calls `httpClient`, `fetch`, `storage`, `localStorage`, or manual domain `JSON.parse`
- [ ] 7.4 Ensure no new `console.*`; use `src/utils/logger.js` only if logging is needed
- [ ] 7.5 Keep touched components under the project size limit by extracting focused subcomponents if needed

## 8. Verification

- [ ] 8.1 Run targeted repository/hook tests for merchant staff and staff invites
- [ ] 8.2 Run affected UI/component tests for Dashboard Staff and StaffRegistrationWizard
- [ ] 8.3 Run `pnpm build`
- [ ] 8.4 Run `pnpm lint:tokens`
- [ ] 8.5 Run `npx openspec validate integrate-merchant-staff-management-api --strict`
- [ ] 8.6 Live smoke: merchant signs in -> Staff list loads -> invite staff -> pending invite appears -> resend -> search existing staff -> send link request -> toggle status -> delete/unlink
- [ ] 8.7 Live smoke: staff opens real invite token URL -> invite metadata loads -> accept succeeds -> expired/invalid token states render correctly

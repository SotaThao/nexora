# Design — US-014 invite ref code (v3.3)

## US ↔ Endpoint ↔ FE file map

| US-014 AC / Task | Endpoint (v3.3) | FE file(s) | Status |
|---|---|---|---|
| Public link/QR has `ref` + `source=public_link` (AC #7) | `GET/PUT /merchant/settings/invite-link`; `POST /staff/join-public-invite` | `merchantSettings.ts`, `staffInvites.ts`, `useMerchantSettings.ts`, `utils/inviteRef.ts` | Done (pre-existing) |
| New-account keeps refCode to join (AC #4) | `POST /staff/join-public-invite` | `AppRouter.tsx`, `useStaffRegistration.ts` | Done (pre-existing) |
| Existing account accept/reject staff-code (AC #6) | `PUT /merchant/staff/links/{linkId}/approve\|reject`; `PUT /staff/link-requests/{linkId}/accept\|reject` | `merchantStaff.ts`, `staffSelf.ts` | Done (PUT confirmed) |
| Invite lifecycle / list + revoke (Task: invite mgmt; AC #11 status, #12 revoked) | `GET /merchant/staff/invites`, `GET /merchant/staff/invites/{inviteId}`, `DELETE /merchant/staff/invites/{inviteId}` | `merchantStaff.ts`, `useMerchantStaff.ts`, `queryKeys.ts`, `useStaffManagement.ts` | This change |
| Staff detail by code (Case B support) | `GET /merchant/staff/{staffCode}` | `merchantStaff.ts`, `useMerchantStaff.ts` | This change |
| Invalid/expired/revoked/disabled + duplicate error display (AC #11, #12) | error codes on join/invite responses | `errorCodes.ts`, `en.json`, `vi.json`, `useStaffManagement.ts` | This change |
| refCode + `source=email_invite` on email invite (AC #1, #2, #10) | `POST /merchant/staff/invite` (no such fields) | — | **BE-blocked** |
| refCode + `source=staff_code` on link-request (AC #1, #5, #10) | `POST /merchant/staff/link-request/{staffProfileId}` (no body) | — | **BE-blocked** |
| Public landing shows business info (AC #8) | none by slug/refCode in v3.3 | — | **BE-blocked** |
| One valid join per staff / duplicate enforcement (AC #9) | backend-enforced | — | **BE-blocked** |

## Decisions

- **Reuse `normalizeStaffListItem` for `getByStaffCode`.** `StaffDetailByCodeDto` is a superset of `StaffListItemDto`; the shared fields normalize identically, avoiding a parallel normalizer.
- **Single invalidation key.** All new keys are prefixed with `merchantStaff`, so `invalidateQueries({ queryKey: qk.merchantStaff() })` refreshes the roster, invite list, and detail caches together.
- **Cancel via dedicated endpoint.** `deleteStaff` now branches: `itemType === 'invite'` → `cancelInvite(inviteId)` (`DELETE /invites/{inviteId}`); linked staff → `remove(staffLinkId)`. Observable outcome unchanged.
- **Error codes are provisional.** Exact server `errorCode` strings for invalid/expired/revoked referral are not in the v3.3 doc. Mapped optimistically; unmapped codes fall back to `errors.unknown_error`. Confirm against live Swagger and adjust.

## Risk / verification

- `pnpm test src/data/repositories/merchantStaff.test.ts` and `pnpm build` (could not run in sandbox — pnpm store unavailable; run on dev box).
- Network trace should show `DELETE /merchant/staff/invites/{inviteId}` when cancelling a pending invite.

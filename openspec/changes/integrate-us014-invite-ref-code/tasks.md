## 1. Query keys & types

- [x] 1.1 Add `merchantStaffInvites`, `merchantStaffInvite(inviteId)`, `merchantStaffByCode(staffCode)` to `src/data/queryKeys.ts`
- [x] 1.2 Add `StaffInviteListItemApiDto`, `StaffInviteDetailApiDto`, `MerchantStaffInvite`, `StaffInvitesQuery` to `src/types/repositories.ts`

## 2. Repository (`merchantStaff.ts`)

- [x] 2.1 `normalizeStaffInvite(dto)` → `MerchantStaffInvite`
- [x] 2.2 `listInvites(query)` → `GET /merchant/staff/invites` (builds `Keyword/StatusFilter/PageNumber/PageSize`)
- [x] 2.3 `getInvite(inviteId)` → `GET /merchant/staff/invites/{inviteId}`
- [x] 2.4 `cancelInvite(inviteId)` → `DELETE /merchant/staff/invites/{inviteId}`
- [x] 2.5 `getByStaffCode(staffCode)` → `GET /merchant/staff/{staffCode}` (reuse list normalizer)

## 3. Hooks (`useMerchantStaff.ts`)

- [x] 3.1 `useMerchantStaffInvites(query)`
- [x] 3.2 `useMerchantStaffInvite(inviteId)`
- [x] 3.3 `useCancelStaffInvite()` (invalidates `qk.merchantStaff()`)

## 4. Error mapping (AC #11, #12)

- [x] 4.1 Add referral/invite codes to `src/data/errorCodes.ts`
- [x] 4.2 Add `errors.*` strings to `src/locales/en.json` and `vi.json`
- [x] 4.3 Translate invite/link error toasts in `useStaffManagement.ts` via `getErrorI18nKey`

## 5. Cancel-invite wiring (`useStaffManagement.ts`)

- [x] 5.1 Add `handleCancelInvite(member)` using `useCancelStaffInvite`
- [x] 5.2 Route `deleteStaff` invite items through the dedicated cancel endpoint
- [x] 5.3 Expose `handleCancelInvite` + `cancelInviteMutation`

## 6. Tests & verification

- [x] 6.1 Extend `merchantStaff.test.ts` for list/detail/cancel/by-code
- [ ] 6.2 Run `pnpm test src/data/repositories/merchantStaff.test.ts` (run on dev box — sandbox lacks pnpm store)
- [ ] 6.3 Run `pnpm build` (run on dev box)
- [ ] 6.4 Browser network trace: cancel invite fires `DELETE /merchant/staff/invites/{inviteId}`

## 6b. Public invite landing + source labeling (AC #8, #10)

- [x] 6b.1 `staffInvites.getPublicMerchantInvite(ref)` → `GET /api/v1/public/merchant-invite?ref=` (ANON) + `normalizeMerchantPublicInvite`
- [x] 6b.2 Hook `usePublicMerchantInvite(ref)` + query key `publicMerchantInvite`
- [x] 6b.3 Wire into `useStaffRegistration`: merge public invite info into `apiInviteInfo` for the landing
- [x] 6b.4 `buildPublicInviteLink` accepts/derives `source` (`email_invite` when email present); `InviteShareModal` source chip
- [x] 6b.5 Tests: `staffInvites.test.ts` (merchant-invite), `inviteRef.test.ts` (source labeling)
- [ ] 6b.6 Confirm `MerchantPublicInviteDto` field names against live Swagger (`components/schemas`) — normalizer is tolerant pending this

## 7. Backend follow-ups (blocking remaining AC)

- [x] 7.1 ~~email invite refCode~~ — RESOLVED: new-account email uses business referralCode in the public-invite URL; AC #2 satisfied on FE. (Optional: BE store `source` for analytics — `join-public-invite` has no `source` field.)
- [x] 7.2 ~~staff_code refCode/source~~ — DECISION (2026-06-15): `staff_code` link-request does NOT carry refCode; account linking is tracked by `linkId`. AC #5 closed by design.
- [x] 7.3 Public business-info endpoint CONFIRMED: `GET /api/v1/public/merchant-invite?ref={referralCode}` → `MerchantPublicInviteDto`. Implemented (AC #8). Sub-item below.
- [ ] 7.3a Confirm exact `MerchantPublicInviteDto` field names against live Swagger `components/schemas` (normalizer tolerant pending this)
- [ ] 7.4 Confirm exact `errorCode` strings for invalid/expired/revoked referral + duplicate invite (AC #11, #12)
- [ ] 7.5 BE: enforce one valid join per staff for public link (AC #9)

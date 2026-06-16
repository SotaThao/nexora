## Why

US-014 ("Owner mời thợ bằng ref code qua Email Invite, Staff Code hoặc Public Link") covers three invite channels. The audit (2026-06-15) found:

- **Case C (public link/QR)** is fully integrated against the API and carries a backend `referralCode` end-to-end.
- **Case A (email invite)** and **Case B (staff code)** call real endpoints but do **not** carry a ref code or `source` tag.

Against API guide **v3.3** (live Swagger, 2026-06-15), the `referralCode`/`source` gap on email and staff-code invites is a **backend contract gap**: `POST /merchant/staff/invite` and `POST /merchant/staff/link-request/{staffProfileId}` accept no such fields. Those AC are therefore blocked on BE and cannot be closed from the frontend.

v3.3 does add a new, FE-implementable surface that advances the remaining AC:

- `MerchantSettings — Invite Link` (already integrated).
- `MerchantStaff +4`: `GET /merchant/staff/{staffCode}`, `GET /merchant/staff/invites`, `GET /merchant/staff/invites/{inviteId}`, `DELETE /merchant/staff/invites/{inviteId}`.
- Method fix: `PUT /merchant/staff/links/{linkId}/approve|reject` (already on PUT in the repo).

## What Changes

- Add merchant-staff invite lifecycle to the data layer:
  - `GET /api/v1/merchant/staff/invites` (list, paged) — `listInvites(query)`
  - `GET /api/v1/merchant/staff/invites/{inviteId}` (detail) — `getInvite(inviteId)`
  - `DELETE /api/v1/merchant/staff/invites/{inviteId}` (cancel/revoke) — `cancelInvite(inviteId)`
  - `GET /api/v1/merchant/staff/{staffCode}` (detail by code) — `getByStaffCode(staffCode)`
- Add query keys `merchantStaffInvites`, `merchantStaffInvite`, `merchantStaffByCode` (prefixed with `merchantStaff` so existing invalidation covers them).
- Add hooks `useMerchantStaffInvites`, `useMerchantStaffInvite`, `useCancelStaffInvite`.
- Route pending-invite deletes in `useStaffManagement` through the dedicated `DELETE /invites/{inviteId}` endpoint; add `handleCancelInvite`.
- Add referral/invite error-code → i18n mapping (invalid / expired / revoked / disabled link / duplicate) so invite and public-join failures show friendly messages (US-014 AC #11, #12).

## Clarification: email-invite ref code is NOT a backend gap

For a **new-account email invite**, the ref code is the business `referralCode` (from `/merchant/settings/invite-link`) embedded in the public-invite URL with the invitee `email` (`buildPublicInviteLink({ email })` → `/invite/public/{slug}?ref=...&email=...`). `AppRouter` reads `ref`, and `useStaffRegistration` sends it to `join-public-invite` after signup. So AC #2 is satisfied on the FE today; `POST /merchant/staff/invite` does not need a `referralCode` field.

## Out of Scope (depends on backend / PO)

- `source` label distinguishing email vs public in analytics (AC #10) — `join-public-invite` does not accept `source`.
- ref code on the `staff_code` link-request flow for existing accounts (AC #5) — currently identity-tracked by `linkId`; confirm with PO/BE whether a refCode is needed.
- Public landing business info fetched from a real endpoint by `businessSlug`/`referralCode` (AC #8) — no such endpoint in v3.3.
- Server-side duplicate-join enforcement (AC #9) — backend responsibility.

## Capabilities

### New Capabilities

- `api-merchant-staff-invite-lifecycle`: list / detail / cancel staff invites + staff detail by code through the v3.3 `MerchantStaff` endpoints, with localized referral/invite error messaging.

## Impact

- **Files changed**: `src/data/repositories/merchantStaff.ts`, `src/data/hooks/useMerchantStaff.ts`, `src/data/queryKeys.ts`, `src/types/repositories.ts`, `src/data/errorCodes.ts`, `src/locales/en.json`, `src/locales/vi.json`, `src/components/dashboard/hooks/useStaffManagement.ts`, `src/data/repositories/merchantStaff.test.ts`.
- **Behavior**: pending invites are now cancelled via the dedicated endpoint; observable "delete invite" outcome is preserved.

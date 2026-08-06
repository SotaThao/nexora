## 1. Contract and Query Keys

- [x] 1.1 Add `qk.taxiqStaffW4Invite(token?)` to `src/data/queryKeys.ts` (anonymous context query)
- [x] 1.2 Add new error codes to `src/data/errorCodes.ts`: `TAXIQ_STAFF_W4_INVITE_STAFF_NOT_LOCAL`,
      `TAXIQ_STAFF_W4_INVITE_EMAIL_REQUIRED`, `TAXIQ_STAFF_W4_INVITE_STAFF_LINK_NOT_ACTIVE`,
      `TAXIQ_STAFF_W4_INVITE_TOKEN_INVALID`, `TAXIQ_STAFF_W4_INVITE_LINK_EXPIRED`,
      `TAXIQ_STAFF_W4_INVITE_LINK_REVOKED`

## 2. Owner Staff List — W-4 Badges + Local Staff Support (US-027)

- [x] 2.1 Widen `StaffTaxIqItemApiDto`/`StaffTaxIqItem` in `taxiqOwnerPayouts.ts`:
      `businessStaffLinkId: string`, `userProfileId: string | null`, `w4Status: string | null`,
      `stateMismatch: boolean`
- [x] 2.2 `StaffTaxProfileTab.tsx`: row key → `businessStaffLinkId`; add W-4 status pill column;
      add state-mismatch indicator (icon/tooltip) next to Contract Type
- [x] 2.3 Audit `AddPayoutModal.tsx` and `PayoutsTab.tsx` (both consume this list) — skip/disable
      rows where `userProfileId` is null (local staff cannot receive a `PayoutRecord`)

## 3. Owner Strict-Mode Toggle (US-027)

- [x] 3.1 Add `requireW4ForLock: boolean` to `OwnerTaxYearApiDto`/`OwnerTaxYear` and
      `UpdateOwnerTaxYearModulesParams` in `taxiqOwnerTaxYear.ts`
- [x] 3.2 Add toggle checkbox to `EditModuleConfigModal.tsx` (default `true`, own section with
      tooltip explaining Lock-blocking behavior)

## 4. Staff Self-Service W-4 Form (US-027)

- [x] 4.1 Widen `StaffTaxYearApiDto`/`StaffTaxYear` in `taxiqStaffTaxYear.ts` with the 7 W-4 fields
- [x] 4.2 Add `upsertW4(id, params)` repository method (`PUT .../tax-years/{id}/w4`)
- [x] 4.3 Add `useUpsertStaffW4` hook in `useTaxiqStaffTaxYear.ts`, invalidates
      `qk.taxiqStaffTaxYear`/`taxiqStaffTaxYearById`
- [x] 4.4 New `StaffW4FormCard.tsx` (filing status select, dependents/withholding number inputs,
      residence/work state inputs, prefilled from existing data, generic validation-error toast
      per D-validation) — mount next to `StaffTaxProfileCard.tsx` on the Staff tax profile screen
- [x] Verify: build clean, live smoke test submitting a real W-4 via local backend — confirmed with
      `quanpersonal02@mailinator.com` on a fresh 2031 OwnerTaxYear/StaffTaxYear; `PUT
      .../tax-years/{id}/w4` returned 204, form re-rendered saved values with no reload, no
      console errors.

## 5. Staff W-4 Invite — Owner Side (US-028)

- [x] 5.1 New `src/data/repositories/taxiqStaffW4Invite.ts`: `createOrResendInvite` (Owner JWT),
      `getContext(token)` + `submit(params)` (both `{ anonymous: true }`)
- [x] 5.2 New `src/data/hooks/useTaxiqStaffW4Invite.ts`: `useCreateStaffW4Invite` (Owner),
      `useStaffW4InviteContext(token)`, `useSubmitStaffW4ViaInvite(token)`
- [x] 5.3 New `StaffW4InviteModal.tsx` (Owner picks expiry 7/15/30 + reminder cadence, calls
      create — same call again from the same row = resend, no extra UI state needed)
- [x] 5.4 Add "Invite / Resend W-4" action to `StaffTaxProfileTab.tsx` rows where
      `userProfileId === null`; surface `TAXIQ_STAFF_W4_INVITE_EMAIL_REQUIRED` /
      `..._STAFF_LINK_NOT_ACTIVE` as toast (no FE fix-it flow — Owner must go edit the staff
      profile elsewhere, out of scope here)

## 6. Staff W-4 Invite — Public Page (US-028)

- [x] 6.1 New `src/components/taxiq/W4Invite/StaffW4InvitePage.tsx` — copy `CpaViewerPage.tsx`'s
      shape: `useSearchParams()` for token, generic error state for missing/invalid/expired/
      revoked token, combined SSN/EIN + W-4 form, submit via anonymous repository call
- [x] 6.2 Register `/w4-invite` route in `AppRouter.tsx` outside `<RequireAuth>`, lazy-loaded via
      `lazyWithRetry` (mirrors `/cpa/access` registration exactly)
- [x] Verify: build clean, live smoke test — create invite as Owner (Chloe, local staff on a fresh
      2031 OwnerTaxYear), opened `/w4-invite?token=...` with no session, submitted SSN + W-4 (204),
      confirmed reloading the same token now shows the generic invalid-link error (single-use
      consumption via `RevokedAt`), confirmed Owner's staff list badge updated to `Current` and
      Contract Type to `W2` on refresh.

## 7. i18n

- [x] 7.1 Add all new user-visible strings to `src/locales/en.json` and `vi.json`: W-4 status
      pill labels, filing status option labels, W-4 form field labels, invite modal labels,
      public invite page labels/errors
- [x] 7.2 Verify en/vi key parity (existing repo script/convention) — both files validated as
      well-formed JSON; keys added in parallel by hand in matching locations.

## 8. Verification

- [x] 8.1 `npx tsc --noEmit` — zero new errors (105 pre-existing errors in unrelated files,
      confirmed none in any file touched this change)
- [x] 8.2 `npx vite build --mode development` — clean, `StaffW4InvitePage` code-splits into its
      own lazy chunk as expected
- [x] 8.3 Live smoke test against local backend (`https://localhost:5005`,
      `ASPNETCORE_ENVIRONMENT=Test`) + local FE dev server — both US-027 and US-028 flows,
      network trace confirms correct method/status per D1-D4, zero console errors. Found and
      fixed one real backend bug during this pass: `GetOwnerTaxYearsQueryHandler` (list query
      backing `useOwnerTaxYearByBusiness`, used by the entire Owner TaxIQ Home screen) never
      mapped `RequireW4ForLock` into `OwnerTaxYearDto`, so the strict-mode toggle always rendered
      unchecked regardless of the real persisted value — fixed in
      `vlink-nexora/backend/src/Application/Features/TaxIq/Owner/Queries/GetOwnerTaxYearsQuery.cs`
      (added the missing `RequireW4ForLock = t.RequireW4ForLock` line), rebuilt, re-verified.
- [x] 8.4 Update both user-story files' status (Draft → Approved → Integrated → Tested → Done)

## Why

Backend (`vlink-nexora` repo, same session) added W-4 support to TaxIQ Employees in two tickets,
verified end-to-end via live curl against a local backend instance — see
`docs/plan/tasks/taxiq/be-tasks/test-cases/US-19-taxiq-employees-staff-w4-test.md` and
`US-20-taxiq-employees-staff-w4-invite-link-test.md` there. FE currently has zero W-4 surface:
`StaffTaxProfileTab.tsx` only shows Contract Type + W-9 status, `taxiqStaffTaxYear.ts` has no W-4
fields, and local staff (`IsLocalStaff = true`, no login account) are invisible to TaxIQ entirely
today (backend used to filter them out; that filter is now removed).

## What Changes

- Extend `StaffTaxIqItemApiDto`/`StaffTaxIqItem` (`taxiqOwnerPayouts.ts`) with
  `businessStaffLinkId`, `userProfileId: string | null`, `w4Status: string | null`,
  `stateMismatch: boolean`. Update `StaffTaxProfileTab.tsx`'s table: row key switches from
  `userProfileId` to `businessStaffLinkId` (now that `userProfileId` can be null for local
  staff), add a W-4 status badge column, add a state-mismatch indicator.
- Extend `OwnerTaxYearApiDto`/`OwnerTaxYear` (`taxiqOwnerTaxYear.ts`) and
  `UpdateOwnerTaxYearModulesParams` with `requireW4ForLock: boolean`. Add a toggle to
  `EditModuleConfigModal.tsx`.
- Extend `StaffTaxYearApiDto`/`StaffTaxYear` (`taxiqStaffTaxYear.ts`) with the 7 new W-4 fields;
  add `upsertW4` repository method (`PUT .../tax-years/{id}/w4`). New self-service W-4 form
  component under `src/components/staff-dashboard/views/taxiq/` (new `StaffW4FormCard.tsx`),
  wired into the existing Staff tax profile screen next to `StaffTaxProfileCard.tsx`.
- New `taxiqStaffW4Invite` repository (Owner-authenticated create/resend + anonymous
  context/submit, mirrors `taxiqCpaViewer.ts`'s `anonymous: true` pattern) + hooks + query key.
- New public route `/w4-invite` (outside `RequireAuth`, mirrors `/cpa/access` →
  `CpaViewerPage.tsx` exactly) rendering a new `StaffW4InvitePage.tsx`: reads `token` from
  `useSearchParams()`, shows business/staff context, a combined SSN/EIN + W-4 form, submits via
  the anonymous repository method.
- Add an "Invite / Resend W-4" action to `StaffTaxProfileTab.tsx`'s row for staff with
  `userProfileId === null` (local staff) — opens a small modal to pick expiry/reminder cadence,
  calls the create-invite endpoint (same endpoint call again = resend, per BE design).

## Capabilities

### New Capabilities

- `taxiq-staff-w4-selfservice`: Owner sees W-4/state-mismatch status per staff (real + local) in
  the existing staff list; Owner toggles the Lock-blocking strict mode; Staff (with an account)
  self-submits their own W-4.
- `taxiq-staff-w4-invite-link`: Owner invites/resends a secure link for local staff (no login
  account) to submit SSN/EIN + W-4 without authenticating; a public unauthenticated page handles
  the submission.

## Impact

- **Files likely new**: `src/data/repositories/taxiqStaffW4Invite.ts`,
  `src/data/hooks/useTaxiqStaffW4Invite.ts`,
  `src/components/staff-dashboard/views/taxiq/StaffW4FormCard.tsx`,
  `src/components/taxiq/W4Invite/StaffW4InvitePage.tsx`,
  `src/components/dashboard/views/taxiq/modals/StaffW4InviteModal.tsx`.
- **Files likely modified**: `src/data/repositories/taxiqOwnerPayouts.ts`,
  `src/data/repositories/taxiqOwnerTaxYear.ts`, `src/data/repositories/taxiqStaffTaxYear.ts`,
  `src/data/hooks/useTaxiqOwnerTaxYear.ts`, `src/data/hooks/useTaxiqStaffTaxYear.ts`,
  `src/data/queryKeys.ts`, `src/data/errorCodes.ts`,
  `src/components/dashboard/views/taxiq/tabs/StaffTaxProfileTab.tsx`,
  `src/components/dashboard/views/taxiq/modals/EditModuleConfigModal.tsx`,
  `src/components/staff-dashboard/views/taxiq/StaffTaxProfileCard.tsx` (or its parent route, to
  mount the new `StaffW4FormCard`), `src/app/AppRouter.tsx`, `src/locales/en.json`,
  `src/locales/vi.json`.
- **Data boundary**: components -> data hooks -> repository -> `httpClient`.
- **Non-goals**: Owner reveal/edit of a local staff's SSN (backend has no such endpoint — only
  the local staff themselves can submit it via the invite link); actual scheduled-reminder-email
  UI (the reminder job is backend-only, cron-driven, nothing to build in FE); risk-score display
  (backend deliberately exposes discrete badges, not a composite score).

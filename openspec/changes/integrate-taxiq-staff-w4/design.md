## Context

Same-session work: backend (`vlink-nexora` repo) added W-4 support to TaxIQ Employees across two
tickets. Both were implemented and live-curl-tested against a local backend instance
(`https://localhost:5005`, `ASPNETCORE_ENVIRONMENT=Test`) in this session — no test project exists
in that repo (policy), so this is the only verification that ran. Full trace:
`vlink-nexora/docs/plan/tasks/taxiq/be-tasks/test-cases/US-19-taxiq-employees-staff-w4-test.md`
and `US-20-taxiq-employees-staff-w4-invite-link-test.md`.

**Not yet verified against a shared dev/staging deployment** — `https://test-api.nexoratouch.com/api/specification.json`
was checked during this change's research and currently has **zero** `/api/v1/taxiq/*` paths at
all (not just the new ones), so the whole TaxIQ module is apparently not deployed there yet. This
repo's own `.env.development` already points `VITE_API_BASE_URL` at `https://localhost:5005`, so
local dev integration is unaffected — just don't expect `pnpm dev:staging`/test-api to have these
endpoints.

## Source Contract (BE-verified via live curl, this session)

### D1 — Owner staff list gets W-4 badges + starts including local staff

`GET /api/v1/taxiq/owner/staff?ownerTaxYearId=` — `StaffTaxIqItemDto` gains:

```
businessStaffLinkId: string        // NEW — stable key; use instead of userProfileId for row key/actions
userProfileId: string | null       // CHANGED from always-string — null for local staff (IsLocalStaff, no login)
w4Status: string | null            // NEW — "Missing" | "Stale" | "Current" | null (null = not ContractType W2)
stateMismatch: boolean             // NEW — residenceState != workState, both non-empty
```

Local staff rows now appear in this list (backend removed its `!IsLocalStaff` filter). Existing
consumers (`AddPayoutModal.tsx`, `PayoutsTab.tsx`) filter/use `userProfileId` for payout entry —
**local staff have no `userProfileId` and cannot receive a `PayoutRecord`** (backend requires a
non-null `StaffUserId`), so those two screens must skip/disable rows where `userProfileId` is
null. This is a real behavior change, not just a type widening — confirm both call sites are
updated, not just the type.

### D2 — Owner strict-mode toggle

`GET /api/v1/taxiq/owner/tax-years/{id}` and `PUT .../modules` (`UpdateOwnerModuleConfigCommand`)
both gain `requireW4ForLock: boolean` (default `true` server-side on create). When `true`,
`POST .../lock` hard-blocks if any W-2 staff (who has a `PayoutRecord` in that tax year) has
missing/stale W-4. Stale = `StaffTaxYear.TaxYear - W4TaxYear >= 1`.

### D3 — Staff self-service W-4 (account holders)

`GET /api/v1/taxiq/staff/tax-years` (`StaffTaxYearDto`) gains 7 fields, all nullable until
submitted once: `w4TaxYear: number | null`, `filingStatus: string | null` (`Single` |
`MarriedFilingJointly` | `MarriedFilingSeparately` | `HeadOfHousehold` |
`QualifyingSurvivingSpouse`), `dependentsClaimed: number | null`,
`extraWithholdingPerPayPeriod: number | null`, `residenceState: string | null`,
`workState: string | null`, `stateExtraWithholding: number | null`.

`PUT /api/v1/taxiq/staff/tax-years/{id}/w4` (new) — request is all 7 fields **required** (this
endpoint always writes a full row, no partial update):

```json
{ "w4TaxYear": 2029, "filingStatus": "Single", "dependentsClaimed": 0,
  "extraWithholdingPerPayPeriod": 0, "residenceState": "TX", "workState": "TX",
  "stateExtraWithholding": 0 }
```

Success: `204`. Failure: `400 TAXIQ_STAFF_TAX_YEAR_NOT_FOUND` (not this Staff's own tax year),
`400 TAXIQ_STAFF_TAX_YEAR_LOCKED` (not Active), plus FluentValidation 400s (message text, no
stable error code per field — e.g. `"DependentsClaimed cannot be negative"`; surface via generic
validation-error toast, not per-field `errorCodes.ts` mapping since there's no code).

### D4 — Staff W-4 invite link (local staff, no login)

Three endpoints, all under `/api/v1/taxiq/staff-w4-invites`:

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| POST | `` | Owner JWT | `{ businessStaffLinkId, ownerTaxYearId, expiryDays: 7\|15\|30, reminderCadence: "Every3Days"\|"Once"\|"Every7Days" }` | `201 { id, businessStaffLinkId, ownerTaxYearId, accessToken, expiresAt, reminderCadence }` |
| GET | `/context?token=` | none (anonymous) | — | `200 { businessName, staffDisplayName, taxYear, expiresAt }` |
| POST | `/submit` | none (anonymous) | `{ accessToken, ssn?, ein?, w4TaxYear, filingStatus, dependentsClaimed, extraWithholdingPerPayPeriod, residenceState, workState, stateExtraWithholding }` (ssn/ein: at least one required) | `204` |

Calling `POST ''` again for the same `(businessStaffLinkId, ownerTaxYearId)` pair **is** "Resend"
— server auto-revokes the previous still-active link for that pair before minting a new token. No
separate resend endpoint.

Error codes (all `400`): `TAXIQ_STAFF_W4_INVITE_STAFF_NOT_LOCAL` (staff has a login account — use
D3 instead), `TAXIQ_STAFF_W4_INVITE_EMAIL_REQUIRED` (no `StaffProfile.Email` on file — Owner must
add one first; **no FE flow to add it exists in this change**, out of scope — surface the error
and tell the Owner to edit the staff profile elsewhere), `TAXIQ_STAFF_W4_INVITE_STAFF_LINK_NOT_ACTIVE`,
`TAXIQ_UNAUTHORIZED_BUSINESS`, `TAXIQ_STAFF_W4_INVITE_TOKEN_INVALID`,
`TAXIQ_STAFF_W4_INVITE_LINK_EXPIRED`, `TAXIQ_STAFF_W4_INVITE_LINK_REVOKED` (also fires once the
staff has already submitted — the same token is deliberately single-use, reused as the
"consumed" signal; the public page shows this as a generic "link no longer valid" state, same
spirit as `CpaViewerPage.tsx`'s deliberately-generic error).

Public page auth pattern: exact copy of `CpaViewerPage.tsx`/`taxiqCpaViewer.ts` — repository calls
pass `{ anonymous: true }` so `httpClient` skips the Bearer token and the 401-refresh loop; page
component does not call `useAuth()` and is registered outside `<RequireAuth>` in `AppRouter.tsx`.

## Decisions

- **D-key**: Row key in `StaffTaxProfileTab.tsx` switches to `businessStaffLinkId` (always
  present) rather than `userProfileId` (now nullable). Any other place keying off this list's
  `userProfileId` must be audited (see D1's note on `AddPayoutModal.tsx`/`PayoutsTab.tsx`).
- **D-badge**: `w4Status` renders as a colored pill (`Missing` = rose, `Stale` = amber, `Current`
  = emerald, `null` = em-dash "not applicable"), matching the existing `w9Status` column's visual
  language in the same table — no new design pattern invented.
- **D-invite-route**: New public route path is `/w4-invite` (not nested under `/taxiq/...`) to
  mirror `/cpa/access`'s flat top-level convention exactly, not the authenticated app's nested
  paths.
- **D-validation**: The W-4 submit endpoints (both D3 and D4) return FluentValidation message
  strings, not stable `errorCodes.ts`-mappable codes, for field-level violations (negative
  numbers, missing state, invalid enum). Treat these as a single generic
  "check your input" toast rather than trying to map each message string to an i18n key —
  consistent with how `errorCodes.ts`'s `getErrorI18nKey` already falls back to
  `errors.unknown_error` for unmapped codes.
- **Non-goal reaffirmed**: no composite risk score, no Owner-editable SSN for local staff, no
  reminder-email UI (backend cron-only).

## Open Questions

None outstanding — full contract came from this session's own backend implementation + live curl
verification, not from guessing against a spec. If FE integration surfaces a mismatch against the
actual running local backend, fix the mismatch and note it in `tasks.md`, don't silently work
around it.

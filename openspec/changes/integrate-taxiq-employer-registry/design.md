## Context

Backend (`vlink-nexora` repo) implemented the Employer Registry (ticket US-21) same-day, verified
via live curl (no test project exists in that repo — policy) — full trace:
`vlink-nexora/backend/docs/plan/tasks/taxiq/be-tasks/test-cases/US-21-taxiq-employer-registry-test.md`.

**Not yet verified against a shared dev/staging deployment** — same situation as
`integrate-taxiq-staff-w4`: `test-api.nexoratouch.com` has zero `/api/v1/taxiq/*` paths. This
repo's `.env.development` already points `VITE_API_BASE_URL` at `https://localhost:5005`, so local
dev is unaffected.

## Source Contract (BE-verified via live curl, backend session)

### D1 — List Employers for a business

`GET /api/v1/taxiq/owner/employers?BusinessId=&PageNumber=&PageSize=` — query params are
`PagingRequestBase<PaginatedList<EmployerDto>>` + optional `BusinessId`. ASP.NET model binding is
case-insensitive so `businessId=`/`pageSize=` (matching this repo's existing lowercase convention,
e.g. `taxiqOwnerTaxYear.ts`'s `businessId=&taxYear=`) works identically to PascalCase.

```
PaginatedList<EmployerDto>: { items: EmployerDto[], pageNumber, totalPages, totalCount, hasPreviousPage, hasNextPage }

EmployerDto:
  id: string (guid)
  businessId: string (guid)
  businessName: string
  einMasked: string | null       // decrypted+masked from Business.Ein, not a separate field
  industry: string | null
  primaryState: string | null    // from Business.State
  employeeCount: number          // active BusinessStaffLink count for the business
  registrationsSummary: string   // e.g. "FED, TX" — "US-" prefix stripped, joined
  federalDepositSchedule: string // "Semiweekly" | "Monthly" | "Quarterly"
  nextDeposit: string | null     // ISO date, earliest non-null registration.NextDue
  healthPercent: number          // 100 if zero registrations; else % of registrations at RegistrationStatus=Active
  status: string                 // "Active" | "Degraded" | "Inactive" | "Suspended"
  enableStrictFinalization: boolean
  createdAt: string
  lastModified: string | null
```

Omitting `BusinessId` aggregates across all of the Owner's businesses (mirrors
`GetOwnerTaxYearsQuery`'s pattern) — this FE integration always passes the current business's id
since the Owner dashboard is single-business-scoped per session.

### D2 — Create Employer

`POST /api/v1/taxiq/owner/employers` — request:
`{ businessId, industry?: string, federalDepositSchedule: 'Semiweekly'|'Monthly'|'Quarterly', enableStrictFinalization: boolean }`.
Response: `201` with the new `Guid` (raw, not wrapped in an object — matches
`taxiqOwnerPayoutsRepository.createStaffTaxYear`'s `client.post<string>` pattern).

Server always auto-creates one `US-FED` registration at `MissingSetup`, so the employer starts at
`Status: "Degraded"`, `healthPercent: 0` — **the create form does not ask for federal registration
details up front**; the Owner fills those in via the Registrations modal right after. This is a
deliberate two-step flow per the backend's own design decision (see backend memory
`project_taxiq_employer_registry.md`), not a bug to route around client-side.

Error: `400 TAXIQ_EMPLOYER_ALREADY_EXISTS` if the business already has an `Employer` row (1:1
constraint — `UNIQUE INDEX IX_Employer_BusinessId`).

### D3 — Get / Update Employer

`GET /api/v1/taxiq/owner/employers/{id}` → single `EmployerDto` (same shape as D1's list item).

`PUT /api/v1/taxiq/owner/employers/{id}` — request:
`{ industry?, federalDepositSchedule, enableStrictFinalization, status: 'Active'|'Inactive'|'Suspended' }`.
`status: 'Degraded'` is rejected with `400` (FluentValidation `NotEqual`) — the Status dropdown in
`AddEditEmployerModal.tsx`'s edit mode must not offer `Degraded` as an option at all, and must
default the select to the employer's *current* status, falling back to `Active` only if the
current status happens to be `Degraded` (edit mode is precisely the escape hatch for an Owner who
wants to force-`Inactive`/`Suspended` a Degraded employer — but re-selecting the still-computed
`Degraded` value itself is not a legal PUT payload). Response: `204`.

### D4 — Get / Upsert Employer Registrations

`GET /api/v1/taxiq/owner/employers/{id}/registrations` → `EmployerRegistrationDto[]`, ordered by
jurisdiction:

```
EmployerRegistrationDto:
  id: string (guid)
  employerId: string (guid)
  jurisdiction: string            // e.g. "US-FED", "US-TX" — always "US-" prefixed, uppercase
  accountNumberMasked: string | null
  registrationStatus: string      // "Active" | "Review" | "MissingSetup"
  depositSchedule: string         // "Semiweekly" | "Monthly" | "Quarterly"
  nextDue: string | null
  registeredDate: string | null
```

`PUT /api/v1/taxiq/owner/employers/{id}/registrations` — request:
`{ jurisdiction: string, accountNumber?: string, registrationStatus, depositSchedule, nextDue?, registeredDate? }`.
Upsert by `(EmployerId, Jurisdiction)` — the same call is "Add" for a new jurisdiction and "Edit"
for an existing one (no separate endpoints), matching this repo's existing
`taxiqStaffW4Invite`-style "same POST = create-or-resend" precedent. `jurisdiction` must be
uppercase (backend validator: `Must(v => v == v.ToUpperInvariant())`) and prefixed `US-` by
convention (not enforced by validator, but every doc example and the auto-created row use it —
the Add Registration sub-form should present a fixed jurisdiction list: `US-FED`, `US-TX`, `US-CA`,
`US-NY`, per the doc's example screens, plus a free-text fallback for other states) — **decision
needed from Owner-side dev before coding the sub-form's jurisdiction input**, see Decisions below.
`accountNumber` omitted (undefined) leaves the existing encrypted value untouched (only overwrites
when a non-null value is sent — mirrors `SetStaffTinParams`'s "fill when provided" semantics, not
"always required" like the W-4 submit endpoint). Response: `204`.

Side effect on the server: after any registration upsert, `Employer.Status` is recomputed to
`Active` (if all registrations are now `Active`) or `Degraded` (otherwise) — **only** when the
employer's current status is `Active` or `Degraded`; an `Inactive`/`Suspended` employer's status is
left untouched by a registration change. The registrations modal's mutation must invalidate the
Employers list query (not just its own registrations query) so the Status/Health columns refresh
on close.

Error: `400 TAXIQ_EMPLOYER_NOT_FOUND` (unknown `EmployerId` — shouldn't happen from this UI since
the id always comes from a row already on screen, but the generic error toast covers it anyway).

## Decisions

- **D-scope**: `EmployerRegistryView` is a new top-level TaxIQ sidebar page (`employers`), not a
  tab inside `PayoutDisputeCenterView` — Employer is 1:1 with `Business`, independent of
  `OwnerTaxYear`, so it doesn't fit that tab shell's `ownerTaxYearId` prop contract at all. New
  `TaxIqEmployersRoute` resolves only `businessId` (via `useMerchantSetup()`) — no
  `useOwnerTaxYearByBusiness` call, no "no OwnerTaxYear yet" empty state.
- **D-list-scope**: Always pass `businessId` (never omit it) since the Owner dashboard is
  single-business per session — no cross-business aggregation UI needed even though the backend
  supports it.
- **D-jurisdiction-input**: The Add Registration sub-form uses a fixed `<select>` of
  `US-FED, US-TX, US-CA, US-NY` (matching the doc's illustrated jurisdictions) plus a manual
  uppercase-enforced text input as a fallback for any other state, filtered to exclude
  jurisdictions the employer already has a row for (those go through the "Edit" affordance
  instead, i.e. clicking an existing table row, not the Add sub-form).
- **D-ein**: No EIN field anywhere in the new Employer forms — `einMasked` is read-only display
  data on the list/detail view; editing it continues to go through the existing
  `BusinessEinCard`/`useUpdateBusinessEin` on the Payout & Dispute Center's Staff Tax Profile tab
  (same `Business.Ein`, per Module Independence & Shared Data — not duplicated here).
- **D-badge**: `status` renders as a colored pill reusing the exact visual language of
  `W4StatusBadge`/`PayoutStatusBadge` (`Record<status, tailwindClasses>` + rounded pill):
  `Active` = emerald, `Degraded` = amber, `Inactive` = slate/gray, `Suspended` = rose.
  `registrationStatus` pill: `Active` = emerald, `Review` = amber, `MissingSetup` = rose (matches
  the doc's "red-flag Missing setup" language).
- **D-no-pagination**: Fetch with `pageSize: 100` and ignore `totalPages`/`hasNextPage` — realistic
  data volume is 0-1 row per business; no pagination controls built. If a future multi-business
  Owner UI needs this, revisit then.
- **Non-goal reaffirmed**: no "Create audit workspace" toggle, no Employer-level TIN/W-4 strict-mode
  sub-toggles (reuses `requireW4ForLock` from OwnerTaxYear instead), no Recent Payroll Runs/Activity
  panel, no reveal-plaintext for registration account numbers.

## Open Questions

None outstanding — full contract came from this session's backend implementation + live curl
verification (13/13 cases), not from guessing against a spec. If FE integration surfaces a mismatch
against the actual running local backend, fix the mismatch and note it in `tasks.md`, don't
silently work around it.

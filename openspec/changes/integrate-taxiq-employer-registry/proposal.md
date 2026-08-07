## Why

Backend (`vlink-nexora` repo, same-day session) implemented the TaxIQ Employer Registry — mục 10
"Employers" of `docs/business/taxiq/taxiq-nexora-phan-2-payroll.md`, ticket US-21 — verified
end-to-end via live curl against a local backend instance (13/13 test cases pass, see
`docs/plan/tasks/taxiq/be-tasks/test-cases/US-21-taxiq-employer-registry-test.md` in that repo).
FE currently has zero surface for it: no `Employer`/`EmployerRegistration` repository, no route, no
sidebar entry. This is the payroll legal-entity registry that every future Payroll Run/Pay Engine
feature will read (`Employer.EnableStrictFinalization` + registration completeness gate
finalization), so it needs its own screen now even though those downstream features don't exist
yet.

## What Changes

- New standalone TaxIQ sidebar page "Employers" (not a tab under Payout & Dispute Center — this is
  a different resource scoped to `Business`, not `OwnerTaxYear`; a business has at most one
  `Employer` row, independent of tax year).
- New `EmployerRegistryView.tsx`: table of Employers for the current business (in practice 0 or 1
  row, since `Employer` is 1:1 with `Business` — the doc's example of 3 rows is a multi-tenant
  admin illustration, not a per-Owner reality), each row showing Industry, Employees, Registrations
  (short jurisdiction list), Federal Deposit Schedule, Next Deposit, Health%, Status pill, and
  actions (`View`/`Edit`/`Registrations`).
- `Add Employer` opens `AddEditEmployerModal.tsx` (create mode: Industry, Federal Deposit Schedule,
  Enable Strict Finalization — no EIN field here, EIN already lives on `Business` and is set via
  the existing `BusinessEinCard` pattern in `StaffTaxProfileTab.tsx`, reused as-is per Module
  Independence & Shared Data).
- `Edit` opens the same modal in edit mode, adding a `Status` selector restricted to
  Active/Inactive/Suspended (Degraded is compute-only, rejected by the backend if sent).
- `Registrations` opens `EmployerRegistrationsModal.tsx`: table of jurisdictions with masked
  account number, registration status, deposit schedule, next due; an inline add/edit sub-form for
  a single jurisdiction (upsert semantics — same call for both "Add" and "Edit" per backend
  design).
- New `taxiqEmployer.ts` repository + `useTaxiqEmployer.ts` hooks, following the exact
  `taxiqOwnerTaxYear.ts`/`taxiqOwnerPayouts.ts` shape (components → hooks → repository →
  httpClient, DTO normalization owned by the repository).
- New `TaxIqEmployersRoute` in `routes/index.tsx` — simpler than the other TaxIQ routes: only needs
  `businessId` from `useMerchantSetup()`, no `OwnerTaxYear` resolution, since Employer is not
  tax-year-scoped.

## Capabilities

### New Capabilities

- `taxiq-employer-registry`: Owner creates/views/edits the payroll legal-entity record for their
  business (EIN reused from `Business`, industry, deposit schedule, strict-finalization switch)
  and manages per-jurisdiction tax registrations, seeing a computed health score and
  Active/Degraded status.

## Impact

- **Files likely new**: `src/data/repositories/taxiqEmployer.ts`,
  `src/data/hooks/useTaxiqEmployer.ts`,
  `src/components/dashboard/views/taxiq/EmployerRegistryView.tsx`,
  `src/components/dashboard/views/taxiq/modals/AddEditEmployerModal.tsx`,
  `src/components/dashboard/views/taxiq/modals/EmployerRegistrationsModal.tsx`.
- **Files likely modified**: `src/data/queryKeys.ts`, `src/data/errorCodes.ts`,
  `src/components/dashboard/routes/index.tsx` (new `TaxIqEmployersRoute`),
  `src/app/AppRouter.tsx` (register `taxiq/employers` route),
  `src/components/dashboard/constants.tsx` (new `employers` sidebar sub-item, always visible — no
  `TaxIqModule` enum value exists for this feature so it is not added to
  `TAXIQ_MENU_CHILD_MODULE`), `src/locales/en.json`, `src/locales/vi.json`.
- **Data boundary**: components -> data hooks -> repository -> `httpClient`.
- **Non-goals**: "Create audit workspace" toggle (dropped by backend, no consumer), "Require TIN
  verification"/"Require W-4 current year" under Employer's own Strict Mode section (backend
  deliberately reused the existing per-`OwnerTaxYear` `requireW4ForLock` toggle instead of
  duplicating it at the Employer level — see backend's design notes), "Recent Payroll Runs"/"Recent
  Activity" tabs on Employer Detail (no Payroll Runs feature exists yet), reveal-plaintext for
  registration account numbers (masked-only, same as backend), pagination UI for the Employers list
  (fetched with a generous single page since realistically 0-1 row per business today).

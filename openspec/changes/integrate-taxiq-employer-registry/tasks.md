## 1. Contract and Query Keys

- [x] 1.1 Add `qk.taxiqEmployers(businessId?)` and `qk.taxiqEmployerRegistrations(employerId?)` to
      `src/data/queryKeys.ts` (also `qk.taxiqEmployerById(id?)` for the single-detail cache)
- [x] 1.2 Add error codes to `src/data/errorCodes.ts`: `TAXIQ_EMPLOYER_NOT_FOUND`,
      `TAXIQ_EMPLOYER_ALREADY_EXISTS`, `TAXIQ_EMPLOYER_REGISTRATION_NOT_FOUND`

## 2. Repository + Hooks

- [x] 2.1 New `src/data/repositories/taxiqEmployer.ts`: `EmployerApiDto`/`Employer`,
      `EmployerRegistrationApiDto`/`EmployerRegistration` normalization; `listByBusiness`, `create`,
      `getById`, `update`, `listRegistrations`, `upsertRegistration`
- [x] 2.2 New `src/data/hooks/useTaxiqEmployer.ts`: `useTaxiqEmployers(businessId)`,
      `useTaxiqEmployer(employerId)`, `useCreateEmployer()`, `useUpdateEmployer(businessId)`,
      `useTaxiqEmployerRegistrations(employerId)`, `useUpsertEmployerRegistration(businessId)` —
      mutations invalidate both the employers list and (for registrations) the registrations query

## 3. Employers List Page

- [x] 3.1 New `src/components/dashboard/views/taxiq/EmployerRegistryView.tsx`: table (Employer name
      = Business name, Industry, Employees, Registrations summary, Deposit Schedule, Next Deposit,
      Health%, Status pill, actions), empty state with `Add Employer` button
- [x] 3.2 New `TaxIqEmployersRoute` in `src/components/dashboard/routes/index.tsx` — resolves only
      `businessId` via `useMerchantSetup()`, no OwnerTaxYear
- [x] 3.3 Register `taxiq/employers` route in `src/app/AppRouter.tsx`
- [x] 3.4 Add `{ id: 'employers', labelKey: 'dashboard.menu.taxiq_employers' }` to `taxiq.children`
      in `src/components/dashboard/constants.tsx` (no `TAXIQ_MENU_CHILD_MODULE` entry — always
      visible; confirmed `DashboardSidebar.tsx`/`MobileMenuDrawer.tsx` fail-open for ids with no
      module mapping, no edit needed there)

## 4. Add / Edit Employer Modal

- [x] 4.1 New `src/components/dashboard/views/taxiq/modals/AddEditEmployerModal.tsx` — create mode
      (Industry, Federal Deposit Schedule select, Enable Strict Finalization checkbox); edit mode
      adds Status select (Active/Inactive/Suspended only, defaults to current status or Active if
      currently Degraded)
- [x] 4.2 Mobile-responsive per CLAUDE.md modal rules (`nexora-modal-card`, `grid-cols-1 sm:grid-cols-2`)

## 5. Registrations Modal

- [x] 5.1 New `src/components/dashboard/views/taxiq/modals/EmployerRegistrationsModal.tsx` — table
      of existing registrations (masked account number, status pill, deposit schedule, next due,
      registered date) + inline add-new-jurisdiction sub-form (fixed select `US-FED/US-TX/US-CA/US-NY`
      + manual fallback input, filtered to exclude jurisdictions already present) + edit-existing via
      clicking a row
- [x] 5.2 Upsert mutation invalidates both `qk.taxiqEmployerRegistrations(employerId)` and
      `qk.taxiqEmployers(businessId)` (Status/Health columns on the list must refresh) — verified
      live

## 6. i18n

- [x] 6.1 Add all new strings to `src/locales/en.json` and `vi.json` under `taxiq.employerRegistry.*`
      plus `dashboard.menu.taxiq_employers`
- [x] 6.2 Verify en/vi key parity — both validated as well-formed JSON via `node -e "JSON.parse(...)"`;
      also added the 3 new `errors.taxiq_employer_*` string keys that `errorCodes.ts` referenced
      (caught live when the duplicate-employer error toast fell back to the raw server message
      instead of the translated string)

## 7. Verification

- [x] 7.1 `npx tsc --noEmit` — zero new errors (105 pre-existing errors in unrelated files,
      confirmed none in any file touched this change)
- [x] 7.2 `npx vite build --mode development` — clean
- [x] 7.3 Live smoke test against local backend + local FE dev server: business "QuanATM" already
      had an Employer from the backend session (Degraded/50%, FED Active + TX MissingSetup) — used
      it directly. Verified: duplicate-employer create → 400 toast (correct code path, also fixed
      the missing i18n strings this surfaced); completed TX registration → 204, list + registrations
      both refetch, Health 50%→100%, Status Degraded→Active; added new US-CA (MissingSetup) → Health
      100%→67%, Status Active→Degraded, summary "CA, FED, TX"; Edit Employer prefill correct
      (Degraded defaults Status select to Active, no Degraded option offered); changed Status to
      Inactive then back to Active — both persisted correctly. Zero console errors from new code.
      One environment gap found and fixed along the way: Docker Desktop wasn't running (Postgres/
      RabbitMQ/Redis down, backend health 503) — likely the host machine restarted since the earlier
      backend session; restarted Docker Desktop (confirmed with user first) and confirmed backend
      health before testing — not a defect in this feature.
- [x] 7.4 Update `US-029` status (Draft → Approved → Integrated → Tested → Done)

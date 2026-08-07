## 1. Contract and Query Keys

- [x] 1.1 Add `qk.taxiqOwnerTaxYear(businessId?, taxYear?)` and `qk.taxiqOwnerTaxYearById(id?)` to `src/data/queryKeys.ts`
- [x] 1.2 Verify live field casing for `OwnerTaxYearDto` — confirmed via live `GET`/`PUT` calls against the dev API during manual testing
- [x] 1.3 Verify exact `enabledModules` enum string values — **guessed values from the business spec were wrong** (`400 TAXIQ_INVALID_MODULE`); corrected to the real backend enum (`DeductionTracking`, `ReceiptManagement`, `PayoutTracking`, `MileageLog`, `TaxReminders`, `CPAExport`) and reverified live (`204`, sidebar updates correctly)

## 2. `taxiqOwnerTaxYear` Repository

- [x] 2.1 Create `src/data/repositories/taxiqOwnerTaxYear.ts` with `createTaxiqOwnerTaxYearRepository(client = httpClient)`
- [x] 2.2 Implement `listByBusiness(businessId, taxYear)` -> `GET /api/v1/taxiq/owner/tax-years?businessId=&taxYear=`, return normalized `{ items, totalCount }`
- [x] 2.3 Implement `getById(id)` -> `GET /api/v1/taxiq/owner/tax-years/{id}`
- [x] 2.4 Implement `create({ businessId, taxYear, salonName, employeeTypeConfig, enabledModules })` -> `POST /api/v1/taxiq/owner/tax-years`, `JSON.stringify(employeeTypeConfig)` per D2
- [x] 2.5 Implement `updateModules(id, { employeeTypeConfig, enabledModules })` -> `PUT /api/v1/taxiq/owner/tax-years/{id}/modules` — live-tested, `204`
- [x] 2.6 Normalize `OwnerTaxYearDto` -> domain shape: `JSON.parse` `employeeTypeConfig` back into an object, keep `enabledModules` as string array, map `status`/`lockedAt`/`exportedAt`
- [x] 2.7 Let failures propagate as-is (`httpClient` already normalizes `errorCode` from `errorDetail[0]` per D3) — no extra error parsing in the repository; callers switch on `error.errorCode`

## 3. `taxiqOwnerTaxYear` Hooks

- [x] 3.1 Create `src/data/hooks/useTaxiqOwnerTaxYear.ts`
- [x] 3.2 Add `useOwnerTaxYearByBusiness(businessId, taxYear)` query, `enabled: !!businessId`, keyed by `qk.taxiqOwnerTaxYear(businessId, taxYear)`
- [x] 3.3 Add `useOwnerTaxYear(id)` query, `enabled: !!id`, keyed by `qk.taxiqOwnerTaxYearById(id)`
- [x] 3.4 Add `useCreateOwnerTaxYear()` mutation, invalidate `qk.taxiqOwnerTaxYear()` (all business/year combos) on success
- [x] 3.5 Add `useUpdateOwnerTaxYearModules()` mutation, invalidate both `qk.taxiqOwnerTaxYear()` and `qk.taxiqOwnerTaxYearById(id)` on success — live-verified: sidebar re-renders with updated modules immediately after save, no manual refresh

## 4. Module-Driven Menu Visibility

- [x] 4.1 Export `TAXIQ_MENU_CHILD_MODULE` mapping table from `src/components/dashboard/constants.tsx` per D5, using the real backend enum values (`deductions`→`DeductionTracking`, `receipts`→`ReceiptManagement`, `payroll`→`PayoutTracking`, `reminders`→`TaxReminders`, `export`→`CPAExport`; `equipment`/`cpa-access` have no gate — always visible)
- [x] 4.2 In `src/components/dashboard/layout/DashboardSidebar.tsx`, compute filtered `taxiq` children from `useOwnerTaxYearByBusiness`'s `enabledModules` at render time — fail-open (show all) while loading or before onboarding completes
- [x] 4.3 Mirror the same filtering logic in `src/components/dashboard/layout/MobileMenuDrawer.tsx`
- [x] 4.4 Confirm no mutation of the shared `MENU_ITEMS` array (filter into a local variable only)

## 5. Onboarding Wizard UI

- [x] 5.1 Create `src/components/dashboard/views/taxiq/TaxIqOnboardingWizard.tsx` — 4 steps (salon name + tax year, employee type config, module toggles, review/submit)
- [x] 5.2 Step 1 validation: block Next if Step 3's `CPAExport` toggle is on and `taxYear` is empty
- [x] 5.3 Step 4 Submit calls `useCreateOwnerTaxYear()`; on `TAXIQ_OWNER_TAX_YEAR_ALREADY_EXISTS` show inline error at Step 1, do not close wizard
- [x] 5.4 On create success: invalidate query cache (3.4 already does this) and let the route re-render into Tax IQ Home — no manual `navigate()` needed since both states live at the same route
- [x] 5.5 All labels/errors through `t()`, no hardcoded strings
- [ ] 5.6 **Not yet live-tested**: the full wizard flow (no test business without an existing `OwnerTaxYear` was available in this session — only the Home/edit-modules path was exercised against real data). Verify Steps 1–4 end-to-end, including the `CPAExport`-without-`taxYear` validation jump and the duplicate-year error path, before considering this ticket Done.

## 6. Tax IQ Home UI

- [x] 6.1 Create `src/components/dashboard/views/taxiq/TaxIqHomeView.tsx` — render salon name, tax year, enabled module list directly from the `useOwnerTaxYearByBusiness` list item (no extra `GET /{id}` call per D1) — live-verified against real data
- [x] 6.2 Add "Chỉnh sửa cấu hình module" button opening `src/components/dashboard/views/taxiq/modals/EditModuleConfigModal.tsx`
- [x] 6.3 `EditModuleConfigModal` calls `useUpdateOwnerTaxYearModules()`; disable the trigger button when `status !== 'Active'` (Locked/Exported) — logic in place, not exercised against a Locked/Exported record in this session
- [x] 6.4 Add a CTA linking to the existing Staff Management screen for staff invites (QT-01 step 6)
- [x] 6.5 Reserve a slot for `TaxReadinessScoreWidget` (US-09) — placeholder text in place

## 7. Route Wiring

- [x] 7.1 In `src/components/dashboard/routes/index.tsx`, replace `TaxIqOverviewRoute = makeTaxIqRoute('taxiq')` with a real component branching Wizard vs Home
- [x] 7.2 No changes needed to `src/app/AppRouter.tsx` route paths — only the element behind `taxiq` changes
- [x] 7.3 Handle the loading state (skeleton) while `useOwnerTaxYearByBusiness` is pending, before branching

## 8. i18n

- [x] 8.1 Add `taxiq.onboarding.*` keys to `src/locales/en.json` and `src/locales/vi.json`
- [x] 8.2 Add `taxiq.home.*` keys to both locale files
- [x] 8.3 Confirm key parity between `en.json`/`vi.json` — verified via a manual Node script (`pnpm lint:tokens`'s underlying script, `scripts/verify-tokens.cjs`, does not exist on this branch checkout — see note below)

## 9. Verification

- [x] 9.1 Run `pnpm build` (ran as `npx vite build --mode development`, since `pnpm` was unavailable in the shell) — clean
- [ ] 9.2 `pnpm lint:tokens` — **could not run**: `scripts/verify-tokens.cjs` does not exist on this branch (`feature/taxiq`, which is behind `origin/master` — see repo state note). Ran an equivalent manual key-parity check instead (see 8.3).
- [x] 9.3 Run `pnpm typecheck` (ran as `npx tsc --noEmit`) — zero errors in any file touched by this change (pre-existing unrelated errors elsewhere in the repo were left as-is)
- [ ] 9.4 `npx openspec validate integrate-taxiq-owner-onboarding --strict` — **could not run**: no `openspec` CLI is installed or resolvable via `npx` in this environment; artifacts were authored by hand to mirror the exact structure/format of the existing `integrate-merchant-staff-management-api` change
- [ ] 9.5 Live smoke (fresh business, no `OwnerTaxYear` yet) — **not exercised**, no such test account was available this session; see 5.6
- [x] 9.6 Live smoke (business already has `OwnerTaxYear`): open `/dashboard/taxiq` -> Home renders directly -> edit module config -> save -> sidebar sub-items update immediately, no reload needed — **passed against the real dev API**, uncovered the wrong-module-enum bug fixed in this session
- [ ] 9.7 Live smoke: duplicate `OwnerTaxYear` creation error path — not exercised (depends on 9.5)
- [x] 9.8 No console errors/warnings during the exercised flows (9.6)

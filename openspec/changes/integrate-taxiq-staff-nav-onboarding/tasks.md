## 1. Contract and Query Keys

- [ ] 1.1 Add `qk.taxiqStaffTaxYear(taxYear?)` and `qk.taxiqStaffTaxYearById(id?)` to `src/data/queryKeys.ts`
- [ ] 1.2 Confirm field casing for `StaffTaxYearDto`/`StaffDashboardDto` against `specification.json` (done during design — camelCase confirmed)

## 2. `taxiqStaffTaxYear` Repository

- [ ] 2.1 Create `src/data/repositories/taxiqStaffTaxYear.ts` with `createTaxiqStaffTaxYearRepository(client = httpClient)`
- [ ] 2.2 Implement `listByYear(taxYear)` -> `GET /api/v1/taxiq/staff/tax-years?TaxYear=`, return normalized `{ items, totalCount }`
- [ ] 2.3 Implement `create({ taxYear, contractType, w9Status, enabledModules })` -> `POST /api/v1/taxiq/staff/tax-years`, returns the new id (`Guid` body, not a DTO)
- [ ] 2.4 Implement `getDashboard(id)` -> `GET /api/v1/taxiq/staff/tax-years/{id}/dashboard`
- [ ] 2.5 Implement `updateModules(id, { enabledModules, contractType?, w9Status? })` -> `PUT /api/v1/taxiq/staff/tax-years/{id}/modules`
- [ ] 2.6 Normalize `StaffTaxYearDto`/`StaffDashboardDto` -> domain shapes; keep `enabledModules` as string array
- [ ] 2.7 Let failures propagate as-is (`httpClient` already normalizes `errorCode`) — no extra error parsing in the repository

## 3. `taxiqStaffTaxYear` Hooks

- [ ] 3.1 Create `src/data/hooks/useTaxiqStaffTaxYear.ts`
- [ ] 3.2 Add `useStaffTaxYearByYear(taxYear)` query, keyed by `qk.taxiqStaffTaxYear(taxYear)`
- [ ] 3.3 Add `useStaffTaxYearDashboard(id)` query, `enabled: !!id`, keyed by `qk.taxiqStaffTaxYearById(id)`
- [ ] 3.4 Add `useCreateStaffTaxYear()` mutation, invalidate `qk.taxiqStaffTaxYear()` on success
- [ ] 3.5 Add `useUpdateStaffTaxYearModules()` mutation, invalidate both `qk.taxiqStaffTaxYear()` and `qk.taxiqStaffTaxYearById(id)` on success

## 4. Nav Shell (Phần A)

- [ ] 4.1 Add a `taxiq` entry with `children` (`deductions`, `receipts`, `logs`, `income`, `export`, `cpa-access`) to `STAFF_MENU_ITEMS` in `src/components/staff-dashboard/constants.tsx`
- [ ] 4.2 Export `STAFF_TAXIQ_MENU_CHILD_MODULE` mapping table per design D3 (`deductions`→`DeductionTracking`, `receipts`→`ReceiptManagement`, `logs`→`MileageLog`, `export`→`CPAExport`; `income`/`cpa-access` ungated)
- [ ] 4.3 Port expand/collapse (`isTaxIqExpanded`) + path-segment active-state logic into `StaffSidebar.tsx`, filtering children by enabled modules (fail-open while loading/no `StaffTaxYear` yet)
- [ ] 4.4 Reuse `public/assets/menu/tax-iq.svg` for the menu icon
- [ ] 4.5 Confirm no mutation of the shared `STAFF_MENU_ITEMS` array (filter into a local variable only)

## 5. Onboarding Wizard UI (Phần B)

- [ ] 5.1 Create `src/components/staff-dashboard/views/taxiq/StaffTaxIqOnboardingWizard.tsx` — steps: ContractType + W9Status, module toggles (+ mandatory privacy banner, verbatim business-spec copy), review/submit
- [ ] 5.2 Step submit calls `useCreateStaffTaxYear()`; on `TAXIQ_STAFF_TAX_YEAR_ALREADY_EXISTS` show inline error, do not close the wizard
- [ ] 5.3 On create success: invalidate query cache (3.4 already does this) so the route re-renders into Staff Tax IQ Home — no manual `navigate()` needed
- [ ] 5.4 All labels/errors through `t()`, keys added to both locales

## 6. Staff Tax IQ Home UI (Phần B)

- [ ] 6.1 Create `src/components/staff-dashboard/views/taxiq/StaffTaxIqHomeView.tsx` — render `OwnerReportedIncome`/`SelfReportedIncome` as two separate lines, `GrossIncome` total, `PendingPayoutsCount` badge linking to US-14, `TotalDeductions`, `EstimatedNetIncome`
- [ ] 6.2 Embed `TaxReadinessScoreWidget` with `scope="staff"` and `taxYearId={staffTaxYear.id}`
- [ ] 6.3 Add "Edit configuration" action opening `src/components/staff-dashboard/views/taxiq/modals/EditStaffModuleConfigModal.tsx`; disable when `status !== 'Active'`
- [ ] 6.4 `EditStaffModuleConfigModal` calls `useUpdateStaffTaxYearModules()`

## 7. Route Wiring

- [ ] 7.1 In `src/app/AppRouter.tsx`, add `<Route path="taxiq" .../>` (real component, branches Wizard vs Home) plus 6 `ComingSoon`-backed stub routes (`taxiq/deductions`, `taxiq/receipts`, `taxiq/logs`, `taxiq/income`, `taxiq/export`, `taxiq/cpa-access`) under the existing `/staff` route tree
- [ ] 7.2 Add matching `coming_soon.staff_taxiq_*` copy keys consumed by `ComingSoon.tsx`'s `copyMap`
- [ ] 7.3 Handle the loading state (skeleton) while the existence-probe query is pending, before branching Wizard vs Home

## 8. i18n

- [ ] 8.1 Add `taxiq.staffOnboarding.*` keys to `src/locales/en.json` and `src/locales/vi.json`, including the verbatim privacy banner copy from the business spec
- [ ] 8.2 Add `taxiq.staffHome.*` keys to both locale files
- [ ] 8.3 Add `staff_dashboard.nav.taxiq` + child labels, `staff_dashboard.titles.taxiq`, `coming_soon.staff_taxiq_*` to both locale files
- [ ] 8.4 Confirm key parity between `en.json`/`vi.json`

## 9. Verification

- [ ] 9.1 Run `pnpm build`
- [ ] 9.2 Run `pnpm lint:tokens`
- [ ] 9.3 Run `pnpm typecheck`
- [ ] 9.4 Manual smoke: fresh staff account (no `StaffTaxYear` yet) sees the wizard at `/staff/taxiq`
- [ ] 9.5 Manual smoke: after submit, Home renders with dashboard aggregates, sidebar sub-items reflect enabled modules
- [ ] 9.6 Manual smoke: duplicate-year creation shows inline error, wizard stays open
- [ ] 9.7 No console errors/warnings during the exercised flows

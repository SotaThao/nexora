## Why

`/dashboard/taxiq` and its 7 sub-routes (`deductions`, `receipts`, `equipment`, `payroll`, `reminders`, `cpa-access`, `export`) currently exist only as sidebar navigation wired to a shared `ComingSoon` placeholder (`makeTaxIqRoute()` factory in `src/components/dashboard/routes/index.tsx`). The Owner has no way to create an `OwnerTaxYear` record or configure which TaxIQ modules are active — nothing behind the menu is real yet.

This change implements the first real TaxIQ screen: `/dashboard/taxiq` itself, per `docs/plan/tasks/taxiq/fe-tasks/US-01-taxiq-fe-owner-onboarding-tax-year-setup.md`. It gates between an onboarding wizard (no `OwnerTaxYear` yet for the current business/year) and a Tax IQ Home dashboard (record already exists), and lets the Owner edit module configuration afterward.

## What Changes

- Add `taxiqOwnerTaxYear` repository + hooks: list-by-business (existence check), get-by-id, create, update-modules.
- Replace `TaxIqOverviewRoute`'s `ComingSoon` with real branching logic: Wizard vs Home, based on `GET /api/v1/taxiq/owner/tax-years?businessId=&taxYear=`.
- Build a 4-step onboarding wizard (salon name + tax year → employee type config → module toggles → review/submit) calling `POST /api/v1/taxiq/owner/tax-years`.
- Build a Tax IQ Home view rendering directly from the list-endpoint DTO (no second `GET /{id}` call needed — confirmed identical DTO shape) with an "Edit module config" modal calling `PUT /api/v1/taxiq/owner/tax-years/{id}/modules`.
- Filter the Tax IQ sidebar sub-menu (`DashboardSidebar.tsx`, `MobileMenuDrawer.tsx`) to only the modules the Owner has enabled, computed at render time — not by mutating the shared `MENU_ITEMS` constant.
- Source `businessId` from the existing `useMerchantSetup()` query (already used by `Dashboard.tsx` for `businessSlug`/`businessName`) — no new profile fetch.
- Normalize backend errors by `errorDetail[0].errorCode` (this feature's backend uses `BadRequestException` → HTTP 400 uniformly for not-found/duplicate/unauthorized — there is no 404/409 to switch on).

## Capabilities

### New Capabilities

- `taxiq-owner-onboarding`: create/read `OwnerTaxYear`, gate onboarding wizard vs home dashboard, update module configuration, module-driven sidebar visibility.

## Impact

- **Files likely new**: `src/data/repositories/taxiqOwnerTaxYear.ts`, `src/data/hooks/useTaxiqOwnerTaxYear.ts`, `src/components/dashboard/views/taxiq/TaxIqOnboardingWizard.tsx`, `src/components/dashboard/views/taxiq/TaxIqHomeView.tsx`, `src/components/dashboard/views/taxiq/modals/EditModuleConfigModal.tsx`.
- **Files likely modified**: `src/data/queryKeys.ts`, `src/components/dashboard/routes/index.tsx`, `src/app/AppRouter.tsx` (no route path change, only element), `src/components/dashboard/constants.tsx` (module↔menu-child mapping table), `src/components/dashboard/layout/DashboardSidebar.tsx`, `src/components/dashboard/layout/MobileMenuDrawer.tsx`, `src/locales/en.json`, `src/locales/vi.json`.
- **Data boundary**: components -> data hooks -> repository -> `httpClient`. No direct `fetch`/storage access from components.
- **Non-goals**: inviting staff (link out to existing Staff Management flow only, no new invite UI); `TaxReadinessScoreWidget` (separate ticket, US-09); any of the other 6 TaxIQ sub-screens (US-02 onward) — those stay on `ComingSoon` after this change.

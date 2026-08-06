## Why

The Staff App (`/staff`) has no Tax IQ presence at all today — `StaffSidebar.tsx`/`StaffBottomNav.tsx` only expose Home, Link & Tip, Tips, Reviews, Payout Setup, Profile, and there is no `/staff/taxiq*` route in `AppRouter.tsx`. Six other Staff TaxIQ tickets (US-05, US-10, US-11, US-12, US-13, US-14, US-15) depend on a nav shell and a real `/staff/taxiq` route existing first.

This change implements `docs/plan/tasks/taxiq/fe-tasks/US-04-taxiq-fe-staff-onboarding-tax-year-setup.md`: it adds the Tax IQ menu group + 7 routes to the Staff App (Phần A), and builds the first real screen behind it — `/staff/taxiq` itself, gating between a Staff onboarding wizard (no `StaffTaxYear` yet for the current year) and a Staff Tax IQ Home dashboard (Phần B). The other 6 sub-routes stay on `ComingSoon` until their own tickets land.

## What Changes

- Add a "Tax IQ" menu group with expandable children to the Staff sidebar (`StaffSidebar.tsx`), porting the expand/collapse + path-based active-state pattern already used by the Owner Dashboard's `DashboardSidebar.tsx` — the Staff sidebar currently has no children/nested-menu concept at all.
- Register `/staff/taxiq`, `/staff/taxiq/deductions`, `/staff/taxiq/receipts`, `/staff/taxiq/logs`, `/staff/taxiq/income`, `/staff/taxiq/export`, `/staff/taxiq/cpa-access` in `AppRouter.tsx` under the existing `RequireAuth role="staff"` branch. Only `taxiq` (home) gets a real component; the other 6 render `ComingSoon`.
- Add `taxiqStaffTaxYear` repository + hooks: list-by-year (existence check, no `businessId` needed — Staff TaxYear is scoped by JWT `userId` only), create, update-modules. Mirrors the shape of `taxiqOwnerTaxYear.ts`/`useTaxiqOwnerTaxYear.ts` file-for-file.
- Build a Staff onboarding wizard (`ContractType` + `W9Status` → module toggles + mandatory privacy banner → review/submit) calling `POST /api/v1/taxiq/staff/tax-years`.
- Build a Staff Tax IQ Home view rendering from `GET /api/v1/taxiq/staff/tax-years/{id}/dashboard` (owner-reported vs self-reported income split, pending payout count, deduction total, net income estimate), embedding the already-scope-aware `TaxReadinessScoreWidget` with `scope="staff"`, with an "Edit configuration" action calling `PUT /api/v1/taxiq/staff/tax-years/{id}/modules` (disabled once `status !== 'Active'`).
- Module-gate the Tax IQ sidebar sub-items using a Staff-side equivalent of `TAXIQ_MENU_CHILD_MODULE`, fail-open until the module state is known.

## Capabilities

### New Capabilities

- `taxiq-staff-nav-onboarding`: Tax IQ nav shell for the Staff App, create/read `StaffTaxYear`, gate onboarding wizard vs home dashboard, update module configuration, module-driven sidebar visibility.

## Impact

- **Files likely new**: `src/data/repositories/taxiqStaffTaxYear.ts`, `src/data/hooks/useTaxiqStaffTaxYear.ts`, `src/components/staff-dashboard/views/taxiq/StaffTaxIqOnboardingWizard.tsx`, `src/components/staff-dashboard/views/taxiq/StaffTaxIqHomeView.tsx`, `src/components/staff-dashboard/views/taxiq/modals/EditStaffModuleConfigModal.tsx`.
- **Files likely modified**: `src/data/queryKeys.ts`, `src/app/AppRouter.tsx`, `src/components/staff-dashboard/constants.tsx` (menu group + module↔menu-child mapping table), `src/components/staff-dashboard/layout/StaffSidebar.tsx`, `src/components/dashboard/views/ComingSoon.tsx` (staff-scoped copy keys), `src/locales/en.json`, `src/locales/vi.json`.
- **Data boundary**: components -> data hooks -> repository -> `httpClient`. No direct `fetch`/storage access from components.
- **Non-goals**: the 6 stub sub-screens' real implementations (US-05/US-10/US-11/US-12/US-13/US-14/US-15 own those); `StaffBottomNav.tsx` (Tax IQ is reachable via the sidebar/mobile drawer only, same as Owner's Tax IQ is sidebar-only with no bottom-nav equivalent); any change to `DashboardSidebar.tsx` (Owner side, already shipped).

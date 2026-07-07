## Context

The Owner Dashboard already ships a real Tax IQ nav shell + onboarding flow (`integrate-taxiq-owner-onboarding`). The Staff App has none of it: `StaffSidebar.tsx`'s `STAFF_MENU_ITEMS` is a flat list with no `children`/expand-collapse concept, and `AppRouter.tsx`'s `/staff` route tree has no `taxiq*` entries. This change ports the Owner pattern into the Staff App and implements the first real screen (`/staff/taxiq`) per `docs/plan/tasks/taxiq/fe-tasks/US-04-taxiq-fe-staff-onboarding-tax-year-setup.md`.

## Source Contract

### Docs

`docs/plan/tasks/taxiq/fe-tasks/US-04-taxiq-fe-staff-onboarding-tax-year-setup.md`, cross-checked against the BE ticket (`docs/plan/tasks/taxiq/US-07-taxiq-staff-onboarding-tax-year-setup.md`) and the live backend source (`backend/src/Web/Controllers/TaxIq/Staff/StaffTaxYearController.cs`, `CreateStaffTaxYearCommand.cs`, `UpdateStaffModuleConfigCommand.cs`, `GetStaffDashboardQuery.cs`, `DomainErrorCode.cs`) and the committed `specification.json` swagger snapshot, since the FE ticket's own "cần hỏi BE" section was answerable directly from backend source without needing to ask.

### Backend behavior (verified against backend source + `specification.json`)

| Operation | Request | Success | Failure |
|---|---|---|---|
| `GET /api/v1/taxiq/staff/tax-years?TaxYear=&Status=&PageNumber=&PageSize=` | query params, **no `businessId`** — filtered server-side by JWT `userId` | `200 PaginatedList<StaffTaxYearDto>` (`items`, `totalCount`, ...) — empty `items` when none exist yet | — |
| `POST /api/v1/taxiq/staff/tax-years` | `{ taxYear, contractType, w9Status, enabledModules }` | `201`, body is the new record's **`Guid` id only** (not a full DTO — confirmed via controller `CreatedAtAction(..., id)` and swagger response schema `{ type: "string", format: "guid" }`) | `400 { errorDetail: [{ errorCode: "TAXIQ_STAFF_TAX_YEAR_ALREADY_EXISTS" }] }` on duplicate `(userId, taxYear)` |
| `GET /api/v1/taxiq/staff/tax-years/{id}/dashboard` | — | `200 StaffDashboardDto` | — |
| `PUT /api/v1/taxiq/staff/tax-years/{id}/modules` | `{ enabledModules, contractType?, w9Status? }` (server overwrites `staffTaxYearId` from the route `{id}`, so the client does not need to send it) | `204` | `400 TAXIQ_STAFF_TAX_YEAR_NOT_FOUND` (wrong id / not owner) or `TAXIQ_STAFF_TAX_YEAR_LOCKED` (status != Active) |

`StaffTaxYearDto` fields: `id`, `taxYear`, `status`, `contractType`, `w9Status`, `enabledModules` (`string[]`), `createdAt`, `lastModified`.

`StaffDashboardDto` fields (confirmed via `specification.json`): `staffTaxYearId`, `taxYear`, `contractType`, `w9Status`, `status`, `enabledModules`, `ownerReportedIncome`, `selfReportedIncome`, `cashTipTotal`, `grossIncome`, `pendingPayoutsCount`, `totalDeductions`, `estimatedNetIncome`.

Enum wire values (backend registers a global `JsonStringEnumConverter` — confirmed in `Web/ConfigureServices.cs`, enums serialize as C# member names, not `[Description]` text):
- `ContractType`: `W2` | `C1099` | `BoothRenter`
- `W9Status`: `NotRequired` | `Pending` | `Received`
- `TaxIqModule` (shared with Owner, `backend/src/Domain/Enums/TaxIq/TaxIqModule.cs`): `DeductionTracking` | `ReceiptManagement` | `PayoutTracking` | `MileageLog` | `TaxReminders` | `CPAExport` — **only 6 values**, strictly validated server-side (`Enum.TryParse<TaxIqModule>`, rejects anything else with `400 TAXIQ_INVALID_MODULE`).

## Decisions

### D1 — Detect Wizard vs Home via the list endpoint, no `businessId` needed

Mirrors the Owner pattern (`useOwnerTaxYearByBusiness`), but simpler: `GET /tax-years?TaxYear=` is scoped entirely by the caller's JWT, so `useStaffTaxYearByYear(taxYear)` takes no business/user id parameter at all. `items.length === 0` → wizard; `items[0]` → render Home directly (`StaffTaxYearDto` already carries every field the Home view needs except the dashboard aggregates, which come from a separate call — see D2).

### D2 — Home view needs two calls, not one

Unlike Owner Home (list DTO alone is enough), Staff Home also needs the dashboard aggregate (`ownerReportedIncome`, `selfReportedIncome`, `grossIncome`, etc.), which only exists on a separate endpoint (`GET .../{id}/dashboard`) — `StaffTaxYearDto` from the list endpoint does not carry these fields. `useStaffTaxYearDashboard(id)` is a second query, `enabled: !!id`, fired once the existence-probe query resolves an id.

### D3 — Module list: follow the Owner precedent, not the literal BA/ticket wording

The BA doc (`NEXORA_TaxIQ_Business_Spec.md` §QT-03) and the FE ticket both list 7 toggleable Staff modules: Income Summary, Deduction Center, Cash Tip Log, Mileage Log, Receipt Vault, Tax Estimate, Year-End Package. The real `TaxIqModule` enum has no `CashTipLog`, `IncomeSummary`, `TaxEstimate`, or `YearEndPackage` value — sending any of those fails validation with `400 TAXIQ_INVALID_MODULE`.

The Owner ticket (US-01) hit the identical mismatch (BA-listed "Gift Card Liability" doesn't exist either) and resolved it, already shipped and live-tested, by: only offering checkboxes for real enum values, and treating menu items with no real enum counterpart as **always-visible** (see `TAXIQ_MENU_CHILD_MODULE`'s comment in `dashboard/constants.tsx`). This change applies the same rule for Staff, confirmed with the ticket owner before implementation:

- Toggleable in the wizard: `DeductionTracking` ("Deduction Center"), `ReceiptManagement` ("Receipt Vault"), `MileageLog` ("Mileage Log" — also covers the combined mileage+cash-tip "logs" page, since there is no separate enum value for cash tip), `CPAExport` (gates the `export`/Year-End Package nav item, same mapping precedent as Owner's `export` → `CPAExport`).
- Always-visible, not gated: `taxiq` (home), `income` (self-reported income), `cpa-access`.
- Not used for Staff at all: `PayoutTracking`, `TaxReminders` (no Staff nav route needs them; contrast Owner's `payroll`/`reminders`).

### D4 — Branch errors on `error.errorCode`, never on HTTP status alone

Same as Owner (D3 in `integrate-taxiq-owner-onboarding/design.md`): this backend feature returns `400` uniformly for not-found/duplicate/locked. `httpClient`'s `buildError()` already normalizes `errorCode` from `errorDetail[0].errorCode`. Codes used here: `TAXIQ_STAFF_TAX_YEAR_ALREADY_EXISTS` (wizard duplicate-year inline error), `TAXIQ_STAFF_TAX_YEAR_LOCKED` / `TAXIQ_STAFF_TAX_YEAR_NOT_FOUND` (defensive — should not occur in normal flows).

### D5 — Staff sidebar gains an expand/collapse pattern it didn't have

`StaffSidebar.tsx`'s `STAFF_MENU_ITEMS` is flat (no `children`). This change adds a single `taxiq` entry with `children` (mirroring Owner's `MENU_ITEMS` shape) and ports `DashboardSidebar.tsx`'s `isTaxIqExpanded` + `location.pathname.split('/')[2]`-based active-state logic into `StaffSidebar.tsx` (Staff's URL depth is one segment shallower than Owner's — `/staff/taxiq/<child>` vs `/dashboard/taxiq/<child>` — both still put the sub-route segment at index 2 relative to their respective mount, adjusted accordingly). `StaffBottomNav.tsx` is not touched — Tax IQ is sidebar/drawer-only, matching how Owner's Tax IQ has no bottom-nav equivalent either.

### D6 — Wizard renders full-page, not a modal

Same as Owner (D6 in `integrate-taxiq-owner-onboarding/design.md`) — matches `TaxIqOnboardingWizard.tsx`'s existing full-page pattern.

## Migration Plan

1. Add `qk.taxiqStaffTaxYear(taxYear?)` / `qk.taxiqStaffTaxYearById(id?)` to `src/data/queryKeys.ts`.
2. Add `src/data/repositories/taxiqStaffTaxYear.ts` (`listByYear`, `create`, `getDashboard`, `updateModules`; error-code normalization per D4).
3. Add `src/data/hooks/useTaxiqStaffTaxYear.ts` (`useStaffTaxYearByYear`, `useStaffTaxYearDashboard`, `useCreateStaffTaxYear`, `useUpdateStaffTaxYearModules`).
4. Add the Tax IQ menu group + `STAFF_TAXIQ_MENU_CHILD_MODULE` mapping table to `staff-dashboard/constants.tsx`, per D3/D5.
5. Port expand/collapse + module-gated filtering into `StaffSidebar.tsx`, per D5.
6. Build `StaffTaxIqOnboardingWizard.tsx` (ContractType/W9Status → modules + privacy banner → review/submit) and `StaffTaxIqHomeView.tsx` + `EditStaffModuleConfigModal.tsx`.
7. Wire `/staff/taxiq` (real) and 6 `ComingSoon` stub routes in `AppRouter.tsx`.
8. Add i18n keys (`taxiq.staffOnboarding.*`, `taxiq.staffHome.*`, `staff_dashboard.nav.taxiq`, `staff_dashboard.titles.taxiq`, `coming_soon.staff_taxiq_*`) to `en.json`/`vi.json`.
9. Run `pnpm build`, `pnpm lint:tokens`, then live smoke test against dev API.

## Open Questions

None blocking — all contract details were resolved directly from backend source + swagger before implementation (no guessed field/enum names, per the module-mismatch decision in D3, confirmed with the ticket owner rather than silently deviating).

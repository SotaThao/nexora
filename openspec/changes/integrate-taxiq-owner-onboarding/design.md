## Context

The Owner Dashboard sidebar already has a "Tax IQ" menu group with 7 children (`deductions`, `receipts`, `equipment`, `payroll`, `reminders`, `cpa-access`, `export`) all rendering a shared `ComingSoon` placeholder via the `makeTaxIqRoute()` factory in `src/components/dashboard/routes/index.tsx`. This change implements the first real screen: `/dashboard/taxiq` itself (`TaxIqOverviewRoute`, currently `makeTaxIqRoute('taxiq')`), which must branch between an onboarding wizard and a Tax IQ Home dashboard depending on whether the Owner's current business already has an `OwnerTaxYear` row for the current calendar year.

## Source Contract

### Docs

`docs/plan/tasks/taxiq/fe-tasks/US-01-taxiq-fe-owner-onboarding-tax-year-setup.md` — goal-driven FE ticket, cross-checked against the backend BE ticket (`docs/plan/tasks/taxiq/US-04-taxiq-owner-onboarding-tax-year-setup.md`) AND the live backend source (`backend/src/Web/Controllers/TaxIq/Owner/OwnerTaxYearController.cs`, `GetOwnerTaxYearQuery.cs`, `GetOwnerTaxYearsQuery.cs`, `OwnerTaxYearDto.cs`, `GlobalExceptionMiddleware.cs`) since the BE ticket document under-specified the actual controller surface and error shape.

### Backend behavior (verified against backend source — MUST still re-verify wire field casing against live `https://test-api.nexoratouch.com/api/specification.json` before finalizing the repository normalizer, since C# DTOs above are PascalCase but the API serializes camelCase)

| Operation | Request | Success | Failure |
|---|---|---|---|
| `GET /api/v1/taxiq/owner/tax-years?businessId=&taxYear=&pageNumber=&pageSize=` | query params | `200 PaginatedList<OwnerTaxYearDto>` (`items`, `totalCount`, ...) | `400 { errorDetail: [{ errorCode: "TAXIQ_UNAUTHORIZED_BUSINESS" }] }` if `businessId` isn't owned by caller |
| `POST /api/v1/taxiq/owner/tax-years` | `{ businessId, taxYear, salonName, employeeTypeConfig, enabledModules }` | assume `OwnerTaxYearDto` (verify) | `400 { errorDetail: [{ errorCode: "TAXIQ_OWNER_TAX_YEAR_ALREADY_EXISTS" }] }` on duplicate `(businessId, taxYear)` |
| `GET /api/v1/taxiq/owner/tax-years/{id}` | — | `200 OwnerTaxYearDto` | `400 { errorDetail: [{ errorCode: "TAXIQ_OWNER_TAX_YEAR_NOT_FOUND" }] }` or `TAXIQ_UNAUTHORIZED_BUSINESS` — **not 404** |
| `PUT /api/v1/taxiq/owner/tax-years/{id}/modules` | `{ enabledModules, employeeTypeConfig }` | assume `204` (matches repo-wide PUT convention — verify) | 400 variants as above |

`OwnerTaxYearDto` fields (confirmed identical between the list and single-item endpoints — no lighter/summary DTO exists): `id`, `businessId`, `taxYear`, `status`, `salonName`, `employeeTypeConfig` (string), `enabledModules` (`string[]`), `lockedAt`, `exportedAt`, `createdAt`, `lastModified`.

## Decisions

### D1 — Detect Wizard vs Home via the list endpoint, not `GET /{id}`

`GET /tax-years?businessId=&taxYear=` returns `200` with an empty `items` array when no record exists yet — the only endpoint on this controller that represents "doesn't exist" without throwing. `GET /{id}` requires already knowing the id, and throws a domain-coded 400 (`TAXIQ_OWNER_TAX_YEAR_NOT_FOUND`) if wrong — not usable as an existence probe.

`useOwnerTaxYearByBusiness(businessId, taxYear)` is the single source of truth for the Wizard/Home branch. When `items.length > 0`, `items[0]` is used directly to render Tax IQ Home — no follow-up `GET /{id}` call, since the DTO is confirmed identical between list and single-item responses.

### D2 — `employeeTypeConfig` is an opaque JSON string on the wire

The backend stores `EmployeeTypeConfig` as a raw string column (same pattern as `EnabledModules`, which the backend deserializes server-side into `string[]` for the DTO but stores as a JSON string internally). The wizard builds a typed object client-side (`{ w2Count, contractor1099Count, boothRenterCount }`) and the **repository** — not the component — `JSON.stringify`s it into the `employeeTypeConfig` field before `POST`/`PUT`, and `JSON.parse`s it back when normalizing a response for display.

### D3 — Branch errors on `error.errorCode`, never on HTTP status alone

This feature's backend uses `BadRequestException` (HTTP 400) uniformly for not-found, duplicate, and unauthorized-business cases — there is no 404/409 to distinguish them by status. `httpClient`'s `buildError()` (`src/lib/httpClient.ts:78-126`) already normalizes rejections into `ApiError { status, errorCode, message, errors, retryAfter }`, reading `errorCode` from `body.errorDetail[0].errorCode` when the top-level `errorCode` field is absent — **no extra parsing needed in the repository**. Components/hooks just catch the rejected `ApiError` and switch on `.errorCode`:

- `TAXIQ_OWNER_TAX_YEAR_ALREADY_EXISTS` → inline error at wizard Step 1, do not close the wizard.
- `TAXIQ_OWNER_TAX_YEAR_NOT_FOUND` / `TAXIQ_UNAUTHORIZED_BUSINESS` → generic toast + redirect to `/dashboard` (should not occur in normal user-driven flows for this ticket; these are defensive branches).

### D4 — `businessId` comes from the existing `useMerchantSetup()` query

`useMerchantSetup()` (`src/data/hooks/useMerchantSetup.ts`) already exposes `data?.businessInfo?.businessId` — the same source `Dashboard.tsx` uses today for `businessSlug`/`businessName` (`Dashboard.tsx:301-306`). `useOwnerTaxYearByBusiness` takes `businessId` as a parameter (call sites derive it from `useMerchantSetup()`), does not fetch it itself, and sets `enabled: !!businessId`.

### D5 — Module-driven menu visibility filters at render time, does not mutate shared constants

`MENU_ITEMS` in `src/components/dashboard/constants.tsx` is a module-level constant shared by `DashboardSidebar.tsx` and `MobileMenuDrawer.tsx` (and read by `useDashboardNavigation.ts`). It must not be mutated at runtime (would leak across renders and any future tests). Instead:

- Add and export a `TAXIQ_MODULE_TO_MENU_CHILD` mapping table from `constants.tsx`, e.g. `{ DeductionCenter: 'deductions', StaffPayout: 'payroll', GiftCardLiability: 'equipment', TaxPaymentReminder: 'reminders', CPAExport: 'export' }` (`receipts` and `cpa-access` sub-items are not toggleable — Receipt Vault has no corresponding module flag in QT-01 Bước 3, and CPA Access grant management is always visible per business spec; verify this against actual enum values per Open Question 2 before finalizing the mapping).
- `DashboardSidebar.tsx`/`MobileMenuDrawer.tsx` compute a filtered children array at render: `item.children?.filter(child => !isTaxiqChild(child.id) || enabledModuleSlugs.includes(child.id))`.
- Before an `OwnerTaxYear` exists (still in Wizard) or while the query is loading, show **all** children (fail-open) rather than hiding everything and looking broken.

### D6 — Wizard renders full-page, not a modal

Per direct confirmation: `TaxIqOnboardingWizard` fully replaces the content area at `/dashboard/taxiq` (sidebar/header stay visible), matching the existing `SetupWizard.tsx` pattern used for merchant onboarding elsewhere in this app — not an overlay/modal.

## Open Questions

1. Exact success response shape for `POST`/`PUT` (full `OwnerTaxYearDto` body, or empty `201`/`204`?) — verified live against the dev API for `PUT .../modules` (`204`, confirmed working end-to-end). `POST` response shape not yet exercised in manual testing; repository already handles both cases defensively (§ `create()` returns `OwnerTaxYear | null`).
2. ~~Exact `enabledModules` string values~~ — **resolved via live testing, not guessing.** The values assumed from the business spec prose (`DeductionCenter`, `StaffPayout`, `GiftCardLiability`, `TaxPaymentReminder`) do not exist — a real `PUT .../modules` call with `enabledModules: ["DeductionCenter"]` returned `400 { errorCode: "TAXIQ_INVALID_MODULE" }`. The actual enum (`backend/src/Domain/Enums/TaxIq/TaxIqModule.cs`) is: `DeductionTracking`, `ReceiptManagement`, `PayoutTracking`, `MileageLog`, `TaxReminders`, `CPAExport` — 6 values, no `GiftCardLiability`. `TAXIQ_MENU_CHILD_MODULE` (`constants.tsx`) and all module pickers have been corrected to these real values and confirmed working live (`204`, sidebar updates on save). Note: `GiftCardLiability`/`MembershipCredit` (US-04 ticket, equipment tracker) have no corresponding module toggle in this enum — that sidebar item stays always-visible (fail-open), not gated.
3. Whether `taxYear` sent to `POST`/queried via `GET` should be `new Date().getFullYear()` unconditionally, or whether the backend has its own "current tax year" concept (e.g. a fiscal-year offset) — `GET ...?businessId=&taxYear=2026` against the dev API returned the expected existing record using calendar year directly, so this assumption holds for at least one real account; not exhaustively verified across fiscal-year edge cases.

## Migration Plan

1. Add `qk.taxiqOwnerTaxYear` entries to `src/data/queryKeys.ts`.
2. Add `src/data/repositories/taxiqOwnerTaxYear.ts` (`listByBusiness`, `getById`, `create`, `updateModules`; error-code normalization per D3; `employeeTypeConfig`/`enabledModules` (de)serialization per D2).
3. Add `src/data/hooks/useTaxiqOwnerTaxYear.ts` (`useOwnerTaxYearByBusiness`, `useOwnerTaxYear`, `useCreateOwnerTaxYear`, `useUpdateOwnerTaxYearModules`).
4. Add `TAXIQ_MODULE_TO_MENU_CHILD` + filtered-children logic to `constants.tsx`/`DashboardSidebar.tsx`/`MobileMenuDrawer.tsx` per D5.
5. Build `TaxIqOnboardingWizard.tsx` (4 steps) and `TaxIqHomeView.tsx` + `EditModuleConfigModal.tsx`.
6. Wire `TaxIqOverviewRoute` in `routes/index.tsx` to branch Wizard vs Home via `useOwnerTaxYearByBusiness`.
7. Add i18n keys (`taxiq.onboarding.*`, `taxiq.home.*`) to `en.json`/`vi.json`.
8. Run `pnpm build`, `pnpm lint:tokens`, `npx openspec validate integrate-taxiq-owner-onboarding --strict`, then live smoke test against dev API.

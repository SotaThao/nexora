## Context

Staff's Self-Reported Income (`taxiqSelfReportedIncome.ts` + `useTaxiqSelfReportedIncome.ts` +
`IncomeSummaryListView.tsx` + `SelfReportedIncomeWizard.tsx`) is the direct precedent this change
mirrors, following the BE work completed in the `vlink-nexora` backend repo this same session
(see `docs/plan/tasks/taxiq/be-tasks/test-cases/ENH-TICKET-01-taxiq-owner-income-summary-test.md`
there for full BE verification detail, and
`docs/business/taxiq/NEXORA_TaxIQ_Enhancement_Tickets.md` Ticket 1 for the TL-approved design).

## Source Contract

### Backend behavior (verified against backend source + `dotnet build` this session — **not yet
verified against a shared dev/staging deployment**, since this is a brand-new endpoint not yet
deployed there)

| Operation | Request | Success | Failure |
|---|---|---|---|
| `POST /api/v1/taxiq/owner/incomes` | `{ ownerTaxYearId, amount, transactionDate, periodEndDate?, periodType?, source, incomeType?, incomeTypeNote?, notes? }` | `201 Guid` | `400 { errorCode }` — `TAXIQ_OWNER_TAX_YEAR_NOT_FOUND`, `TAXIQ_UNAUTHORIZED_BUSINESS`, `TAXIQ_OWNER_TAX_YEAR_LOCKED` |
| `GET /api/v1/taxiq/owner/incomes?ownerTaxYearId=` | — | `200 OwnerIncomeRecordDto[]` | `400 TAXIQ_OWNER_TAX_YEAR_NOT_FOUND \| TAXIQ_UNAUTHORIZED_BUSINESS` |
| `GET /api/v1/taxiq/owner/incomes/{id}` | — | `200 OwnerIncomeRecordDto` | `400 TAXIQ_OWNER_INCOME_RECORD_NOT_FOUND \| TAXIQ_UNAUTHORIZED_BUSINESS` |
| `PUT /api/v1/taxiq/owner/incomes/{id}` | `{ amount, transactionDate, periodEndDate?, periodType?, source, incomeType?, incomeTypeNote?, notes? }` | `204` | same as POST + `TAXIQ_OWNER_INCOME_RECORD_NOT_FOUND` |
| `DELETE /api/v1/taxiq/owner/incomes/{id}` | — | `204` | `TAXIQ_OWNER_INCOME_RECORD_NOT_FOUND \| TAXIQ_UNAUTHORIZED_BUSINESS \| TAXIQ_OWNER_TAX_YEAR_LOCKED` |
| `POST /api/v1/taxiq/owner/incomes/{id}/receipts` | `{ receiptId }` | `204` | above + `TAXIQ_RECEIPT_NOT_FOUND` |

`OwnerIncomeRecordDto` fields (BE-verified from `OwnerIncomeRecordDto.cs`): `id`,
`ownerTaxYearId`, `amount`, `transactionDate`, `periodEndDate?`, `periodType?`
(`'Week'|'Month'|'Quarter'|'Year'|'Day'`), `source`, `incomeType?`
(`'ServiceRevenue'|'ProductRetailRevenue'|'Other'`), `incomeTypeNote?`, `notes?`, `status`
(`'MissingInfo'|'Ready'|'MissingReceipt'|'CPAReview'|'Locked'`), `receipts: [{id, fileName, url}]`,
`createdAt`, `lastModified?`.

Status derivation (BE-enforced, mirrored client-side only for optimistic UI — server response is
always the source of truth after a mutation): no receipt + `amount > 2000` → `CPAReview`; no
receipt + `amount <= 2000` → `MissingReceipt`; has receipt → `Ready`.

## Decisions

### D1 — Separate `taxiqOwnerIncome.ts` repository, not merged into `taxiqSelfReportedIncome.ts`

Same rationale as `taxiqStaffAdjustments.ts` vs `taxiqOwnerAdjustments.ts` (see
`integrate-taxiq-staff-adjustment/design.md` D1): Owner and Staff income records are scoped by a
different tax-year id and have a different `incomeType` enum, so a parallel file avoids a
conditional-shape repository. `qk.taxiqOwnerIncome`/`qk.taxiqOwnerIncomeDetail` are new, separate
keys — same convention as `taxiqOwnerDeductions`/`taxiqStaffDeductions`.

### D2 — `ReceiptUploadStep` gets a third optional id, not a `parentType` enum prop

`ReceiptUploadStep.tsx` already generalized once (US-13) from Deduction-only to
`{ deductionRecordId?, selfReportedIncomeId? }`. This change adds `ownerIncomeRecordId?` as a
third optional prop rather than introducing a `parentType: 'deduction' | 'selfReportedIncome' |
'ownerIncome'` discriminator — keeps the existing two call sites (`AddDeductionWizard`,
`SelfReportedIncomeWizard`) completely unchanged, and the new `OwnerIncomeWizard` call site passes
exactly one of the three ids (caller convention, same as today — no client-side XOR validation,
backend's own validators are the real guardrail).

### D3 — Owner income type options are a fixed local array, not fetched from a backend enum endpoint

`SelfReportedIncomeWizard.tsx` hardcodes `INCOME_TYPE_OPTIONS` as a local const array (not fetched
from any BE metadata endpoint — there isn't one). `OwnerIncomeWizard.tsx` follows the exact same
pattern with its own 3-value array (`ServiceRevenue`, `ProductRetailRevenue`, `Other`), matching
the enum in `backend/src/Domain/Enums/TaxIq/OwnerIncomeType.cs`. No tooltip map is added (Owner's
income types are self-explanatory revenue categories, unlike Staff's, which needed tooltips to
disambiguate booth-rent-from-sub-renter vs. other salon income).

### D4 — List/Wizard component names are `OwnerIncome*`, not reusing `IncomeSummary*`/`SelfReportedIncome*`

Considered making `IncomeSummaryListView`/`SelfReportedIncomeWizard` accept a dual
`ownerTaxYearId?`/`staffTaxYearId?` prop pair (the `CreateAdjustmentModal` precedent, D3 in
`integrate-taxiq-staff-adjustment`). Rejected: unlike Adjustment's single shared modal, Income
Summary's list/wizard already differ in non-trivial ways beyond just the id (different
`incomeType` option set + labels, different locked-banner target route
`/dashboard/taxiq/export` vs `/staff/taxiq/export`, different empty-state/title copy). A parallel
`OwnerIncome*` pair avoids threading two more conditionals through an already 3-step wizard
component, at the cost of the incomeType option array being duplicated in two files — an
acceptable tradeoff given the two Wizard already diverge by more than that one array.

## Open Questions

None outstanding — BE contract fully verified against source + successful `dotnet build` in the
same working session (BE and this FE change done by the same person, back-to-back). This backend
endpoint has not yet been deployed to the shared `test-api.nexoratouch.com` dev environment this
repo's CLAUDE.md names as the live-Swagger source of truth. Local-to-local is the verification
path for this change (run backend locally, point `VITE_API_BASE_URL` at it via
`.env.development`), same as the `integrate-taxiq-staff-adjustment` precedent.

## Migration Plan

1. Add `qk.taxiqOwnerIncome(ownerTaxYearId?)` / `qk.taxiqOwnerIncomeDetail(id?)` to
   `src/data/queryKeys.ts`.
2. Add `TAXIQ_OWNER_INCOME_RECORD_NOT_FOUND` to `src/data/errorCodes.ts`.
3. Add `src/data/repositories/taxiqOwnerIncome.ts` (D1).
4. Add `src/data/hooks/useTaxiqOwnerIncome.ts` (list/detail/create/update/remove/linkReceipt).
5. Generalize `ReceiptUploadStep.tsx` with `ownerIncomeRecordId?` (D2).
6. Add `src/components/dashboard/views/taxiq/OwnerIncomeSummaryListView.tsx` (D4).
7. Add `src/components/dashboard/views/taxiq/OwnerIncomeWizard.tsx` (D3, D4).
8. Add `TaxIqIncomeRoute` to `src/components/dashboard/routes/index.tsx`, wire lazy import +
   `<Route path="taxiq/income">` in `src/app/AppRouter.tsx`.
9. Add sidebar child `{ id: 'income', label: 'Income Summary' }` to `MENU_ITEMS.taxiq.children`
   in `src/components/dashboard/constants.tsx`.
10. Add i18n keys (`taxiq.ownerIncome.*`, `errors.taxiq_owner_income_record_not_found`) to
    `en.json`/`vi.json`.
11. Run `npx tsc --noEmit`, `npx vite build --mode development`; local-to-local smoke test once
    the UI pieces exist.

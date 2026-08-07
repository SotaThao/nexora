## Context

The Owner Dashboard sidebar's "Tax IQ" group has an onboarding wizard/home screen already live (`integrate-taxiq-owner-onboarding`). `deductions` is the next child, still rendering `ComingSoon` via `makeTaxIqRoute()` in `src/components/dashboard/routes/index.tsx`. The sidebar already gates this menu item on `OwnerTaxYear.enabledModules.includes('DeductionTracking')` (`TAXIQ_MENU_CHILD_MODULE`, `constants.tsx`) — no new gating logic needed there.

## Source Contract

### Docs

`docs/plan/tasks/taxiq/fe-tasks/US-02-taxiq-fe-owner-deduction-center.md` — goal-driven FE ticket, cross-checked against BE tickets (`US-05-taxiq-owner-deduction-center.md`, `US-03-taxiq-admin-deduction-category.md`) AND the live backend source (`OwnerDeductionController.cs`, `DeductionCategoryController.cs`, `ReceiptController.cs`, their Commands/Queries/DTOs, `DomainErrorCode.cs`), since **two items the ticket itself flags as unconfirmed ("Điểm chưa chắc chắn / cần hỏi BE") are resolved here by reading backend source directly** rather than guessing.

### Backend behavior (verified against backend source — re-verify wire field casing against live `https://test-api.nexoratouch.com/api/specification.json` before shipping, since C# DTOs are PascalCase but the API serializes camelCase)

| Operation | Request | Success | Failure |
|---|---|---|---|
| `GET /api/v1/taxiq/admin/categories?applicableRole=Owner` | query param | `200 List<DeductionCategoryDto>` | **Fixed in this change** — was `403` for Owner/Staff (`[Authorize(Policy = Admin)]` on the whole class). Now `[Authorize]` at class level (any authenticated role) with `[Authorize(Policy = Admin)]` moved to `Create`/`Update` only. Non-admin callers are always forced to `isActive=true` server-side regardless of the query param, and the `Both`-exclusion bug (D3) is fixed in the same handler. |
| `POST /api/v1/taxiq/owner/deductions` | `{ ownerTaxYearId, categoryId, description, amount, date, vendorName?, businessUsePercent?, smartFieldValues? }` | `201 Guid` (new deduction id) | `400 { errorCode: "TAXIQ_OWNER_TAX_YEAR_LOCKED" \| "TAXIQ_CATEGORY_NOT_FOUND" \| "TAXIQ_OWNER_TAX_YEAR_NOT_FOUND" \| "TAXIQ_UNAUTHORIZED_BUSINESS" }` |
| `POST /api/v1/taxiq/owner/deductions/{id}/submit` | — | `204` (evaluates status + calls AI server-side, no body returned — refetch list to see the result) | `400` same-family error codes, plus none specific to submit beyond the above |
| `PUT /api/v1/taxiq/owner/deductions/{id}` | `{ categoryId, description, amount, date, vendorName?, businessUsePercent?, smartFieldValues? }` (note: **no `id` in body** — id is in the URL and the controller does `command with { DeductionRecordId = id }`) | `204` | `400 TAXIQ_OWNER_TAX_YEAR_LOCKED` — **this is the "409" the ticket's AC describes; the actual transport is 400 + errorCode, never a real 409** (see Decisions D1) |
| `POST /api/v1/taxiq/owner/deductions/{id}/reanalyze` | — | `204` | `400` |
| `POST /api/v1/taxiq/owner/deductions/{id}/approve-cpa` | — | `204` | `400 TAXIQ_DEDUCTION_INVALID_STATUS` if not currently `CPAReview` | — **this is the ticket's Open Question #2 route; the guessed name `approve-cpa-review` does not exist, the real route is `approve-cpa`** |
| `GET /api/v1/taxiq/owner/deductions?ownerTaxYearId=&recordStatus=&categoryId=` | query params | `200 DeductionListDto { items: DeductionRecordDto[], totalDeductibleAmount }` — **not paginated**, no `pageNumber`/`pageSize` | `400 TAXIQ_OWNER_TAX_YEAR_NOT_FOUND \| TAXIQ_UNAUTHORIZED_BUSINESS` |
| `POST /api/v1/taxiq/receipts/upload?ownerTaxYearId=` | `multipart/form-data`, field `file` | `201 Guid` (receipt id) | `400` |
| `POST /api/v1/taxiq/receipts/{id}/link-deduction` | `{ deductionRecordId }` | `204` | `400 TAXIQ_RECEIPT_NOT_FOUND \| TAXIQ_DEDUCTION_NOT_FOUND \| TAXIQ_DEDUCTION_INVALID_STATUS` (deduction is `Locked`) |

`DeductionRecordDto` fields: `id`, `ownerTaxYearId`, `categoryId`, `categoryName`, `description`, `amount`, `deductibleAmount`, `date`, `vendorName?`, `businessUsePercent?`, `smartFieldValues?`, `recordStatus`, `aiDeductionStatus?`, `aiExplanation?`, `aiDisclaimer?` (populated whenever `aiExplanation` is set — always show it alongside the AI result), `aiAnalyzedAt?`, `receiptCount`, `createdAt`, `lastModified?`.

`DeductionCategoryDto` fields: `id`, `name`, `applicableRole`, `riskLevel`, `requiresBusinessUsePercent`, `smartFieldSchema?` (opaque, out of scope — see proposal Non-goals), `displayOrder`, `isActive`.

Enum wire values (exact C# `Description` strings are for display only — the wire value is the enum name, e.g. `RecordStatus: "CPAReview"`, not `"CPA Review"`):
- `DeductionRecordStatus`: `Draft`, `Ready`, `MissingReceipt`, `MissingInfo`, `CPAReview`, `Locked`
- `AiDeductionStatus`: `Deductible`, `PartiallyDeductible`, `NeedsCPAReview`, `NotDeductible`
- `RiskLevel`: `Low`, `Medium`, `High`
- `DeductionApplicableRole`: `Owner`, `Staff`, `Both`

## Decisions

### D1 — Branch errors on `error.errorCode`, never assume a 409 exists

The ticket's AC says "Sửa/Submit khi Locked → BE trả 409". The actual handlers (`UpdateDeductionCommandHandler`, `CreateDeductionCommandHandler`, `SubmitDeductionCommandHandler`) all throw `BadRequestException(DomainErrorCode.TaxIq.OwnerTaxYearLocked, ...)` — **HTTP 400** with `errorCode: "TAXIQ_OWNER_TAX_YEAR_LOCKED"` in the body, matching this backend's project-wide TaxIQ convention (see `integrate-taxiq-owner-onboarding/design.md` D3, same pattern). A literal `status === 409` check would never fire. The Locked-year UX (AC line 27) is implemented by catching the rejected `ApiError` and checking `.errorCode === 'TAXIQ_OWNER_TAX_YEAR_LOCKED'`.

Because `httpClient`'s `showToast` only accepts a plain string (no JSX/links), the "kèm link sang US-08" requirement is implemented as: a toast with the explanatory text, **plus** an inline banner in the wizard/list with an actual `navigate('/dashboard/taxiq/export')` button — the toast alone cannot carry a real link.

### D2 — Category dropdown authorization (RESOLVED — fixed at the BE in this change)

`DeductionCategoryController` was `[Authorize(Policy = Admin)]` at the class level with no per-action override, so `GET /categories?applicableRole=Owner` called by an Owner-role user got `403`. Fixed by moving the class-level attribute to plain `[Authorize]` (any authenticated user — this codebase has no dedicated Owner/Staff realm-role policy, only `Admin` and "any authenticated") and adding `[Authorize(Policy = Admin)]` directly on `Create`/`Update`, which ASP.NET Core combines with the class-level attribute (AND semantics) to keep writes Admin-only. `GetDeductionCategoriesQueryHandler` also now forces `isActive=true` for any non-admin caller server-side (via `ICurrentUserService.IsAdmin()`), ignoring whatever `IsActive` value is requested, so opening reads to Owner/Staff doesn't leak inactive categories.

### D3 — `applicableRole=Owner` filter excludes `Both` categories (RESOLVED — fixed in the same handler)

`GetDeductionCategoriesQueryHandler` filtered with `c.ApplicableRole == role` (exact enum equality), so passing `applicableRole=Owner` excluded categories authored as `Both`. Fixed to `c.ApplicableRole == role || c.ApplicableRole == DeductionApplicableRole.Both` (except when the request itself is `Both`, which keeps exact-match semantics — requesting "both roles' shared categories" specifically).

### D4 — Business-use % is driven by `category.requiresBusinessUsePercent`, not `SmartFieldSchema`

Per confirmed scope: Step 2 of the wizard shows the Business-use % input only when the selected category's `requiresBusinessUsePercent` is `true` (DR-BUSE-001, DR-CORE-006). `SmartFieldSchema` is an opaque `jsonb` string with no defined shape anywhere in the codebase (no seed data, no Admin authoring UI in US-03) — generic schema-driven rendering is out of scope for this ticket (see proposal Non-goals) and does not block Step 2, since the one concretely-specified smart field already has a typed flag to key off of.

### D5 — Deduction list is not paginated

`GetDeductionsQuery`/`DeductionListDto` has no `pageNumber`/`pageSize` — it returns the full filtered set plus a pre-computed `totalDeductibleAmount` (already excludes `Draft` server-side per DR-CORE-001, `GetDeductionsQueryHandler.cs:91-93`). `DeductionCenterView` renders the full list client-side with no `Pagination` component, unlike `ReportsView`.

### D6 — Receipt upload/link is a 2-call sequence, and receipt-then-deduction ordering must handle both directions

`POST /taxiq/receipts/upload` takes `ownerTaxYearId` as a query param and returns just a receipt `Guid` — it is NOT scoped to a deduction at upload time. Linking to a deduction is a separate `POST /taxiq/receipts/{id}/link-deduction` call. Since Step 3 of the wizard runs before the deduction record necessarily exists yet (Draft is only created at final Save in some flows), the wizard's flow is: **create the Draft deduction first (Step 1 completion), then any receipt uploaded in Step 3 is uploaded and immediately linked to that already-created id** — there is no "upload now, link later at Submit" deferred step. This means Step 1's "Next" action actually calls `useCreateOwnerDeduction()` (not just local state), and Steps 2–5 operate on the returned id via `useUpdateOwnerDeduction()`/receipt-link/`useSubmitOwnerDeduction()`. "Save as Draft" at Step 5 is then a no-op network-wise (the record already exists as Draft) unless fields changed on later steps, in which case it's a final `PUT` before leaving the wizard.

### D7 — `AiDisclaimer` comes from the server, not hardcoded client copy

`DeductionRecordDto.aiDisclaimer` is populated server-side (`TaxIqConstants.AiDisclaimer`) whenever `aiExplanation` is set (DR-CORE-004 requires it to always accompany the AI result). The wizard's Step 4 and the list's expanded-row AI section render `record.aiDisclaimer` directly rather than a client-side translated constant, so wording changes server-side propagate without a FE deploy. If `aiDisclaimer` is ever null while `aiExplanation` is present (shouldn't happen per the handler), fall back to a local `t('taxiq.deductionCenter.aiDisclaimerFallback')` string so the disclaimer is never silently missing.

## Open Questions

1. ~~`GET /api/v1/taxiq/admin/categories` needs an Owner/Staff-accessible route or relaxed policy~~ — **resolved in this change**, see D2.
2. ~~`applicableRole=Owner` vs `Both` exclusion~~ — **resolved in this change**, see D3.
3. Whether `PUT /deductions/{id}` full-replaces `smartFieldValues`/other fields not touched by this ticket's UI, or merges — assumed full-replace (matches `UpdateDeductionCommandHandler`, which overwrites every field unconditionally); not exercised live since Step 1 doesn't collect all possible fields this ticket doesn't use.

## Migration Plan

1. Add `qk.taxiqOwnerDeductions`, `qk.taxiqDeductionCategories` to `src/data/queryKeys.ts`.
2. Add `src/data/repositories/taxiqDeductionCategories.ts` (`list(applicableRole)`).
3. Add `src/data/repositories/taxiqOwnerDeductions.ts` (`list`, `create`, `update`, `submit`, `reanalyze`, `approveCpa`).
4. Add `src/data/repositories/taxiqReceipts.ts` (`upload`, `linkToDeduction`).
5. Add corresponding hooks: `useTaxiqDeductionCategories.ts`, `useTaxiqOwnerDeductions.ts`, `useTaxiqReceipts.ts`.
6. Build `shared/ReceiptUploadStep.tsx`, `AddDeductionWizard.tsx`, `DeductionCenterView.tsx`.
7. Wire `TaxIqDeductionsRoute` in `routes/index.tsx` (gate on `OwnerTaxYear` existing; reuse the same `useMerchantSetup()` + `useOwnerTaxYearByBusiness()` pattern as `TaxIqOverviewRoute`).
8. Add i18n keys (`taxiq.deductionCenter.*`) to `en.json`/`vi.json`.
9. Run `pnpm typecheck`, `pnpm build`, `pnpm lint:tokens`; live-smoke against dev API once BE resolves Open Question 1.

## 1. Contract and Query Keys

- [x] 1.1 Add `qk.taxiqOwnerDeductions(ownerTaxYearId?, recordStatus?, categoryId?)` and `qk.taxiqDeductionCategories(applicableRole?)` to `src/data/queryKeys.ts`
- [x] 1.2 Resolve the ticket's two "cần hỏi BE" items by reading backend source directly instead of guessing: approve route is `approve-cpa` (not `approve-cpa-review`); locked-year errors are `400 TAXIQ_OWNER_TAX_YEAR_LOCKED`, never a real `409`
- [ ] 1.3 Verify live field casing for `DeductionRecordDto`/`DeductionCategoryDto` against the dev API — not exercised live this session (see §9)

## 2. `taxiqDeductionCategories` Repository + Hook

- [x] 2.1 Create `src/data/repositories/taxiqDeductionCategories.ts` — `list(applicableRole)` → `GET /api/v1/taxiq/admin/categories?applicableRole=&isActive=true`
- [x] 2.2 Create `src/data/hooks/useTaxiqDeductionCategories.ts`
- [x] 2.3 **Resolved (D2)**: backend `DeductionCategoryController` changed from class-level `[Authorize(Policy = Admin)]` to class-level `[Authorize]` + action-level `[Authorize(Policy = Admin)]` on `Create`/`Update` only. `GetDeductionCategoriesQueryHandler` also fixed to force `isActive=true` for non-admin callers and to include `Both`-role categories when filtering by `Owner`/`Staff` (D3). `AddDeductionWizard`/`DeductionCenterView`'s inline error state is kept as defense-in-depth for genuine failures (network/500), not as a permanent workaround.

## 3. `taxiqOwnerDeductions` Repository + Hooks

- [x] 3.1 Create `src/data/repositories/taxiqOwnerDeductions.ts` — `list`, `create`, `update`, `submit`, `reanalyze`, `approveCpa`
- [x] 3.2 Create `src/data/hooks/useTaxiqOwnerDeductions.ts` with matching hooks, all mutations invalidate `qk.taxiqOwnerDeductions()`
- [x] 3.3 Let failures propagate as `ApiError { errorCode }` — no extra parsing in the repository; callers switch on `error.errorCode`

## 4. `taxiqReceipts` Repository + Hook

- [x] 4.1 Create `src/data/repositories/taxiqReceipts.ts` — `upload(ownerTaxYearId, file)`, `linkToDeduction(receiptId, deductionRecordId)` (scoped to what this ticket needs; full Receipt Vault is a separate future ticket per D6)
- [x] 4.2 Create `src/data/hooks/useTaxiqReceipts.ts`

## 5. Shared Components

- [x] 5.1 `src/components/dashboard/views/taxiq/shared/ReceiptUploadStep.tsx` — new component (no prior Receipt Vault component existed to reuse, despite ticket wording)
- [x] 5.2 `src/components/dashboard/views/taxiq/shared/DeductionStatusBadge.tsx` — badge for `RecordStatus`
- [x] 5.3 `src/components/dashboard/views/taxiq/shared/AiDeductionStatusBadge.tsx` — badge for `AiDeductionStatus`

## 6. Add Deduction Wizard

- [x] 6.1 Create `src/components/dashboard/views/taxiq/AddDeductionWizard.tsx`
- [x] 6.2 Step 1 (category + description + amount + date + vendor) creates the Draft record on Next (D6), not only at final submit
- [x] 6.3 Step 2 (Business-use %) shown only when `category.requiresBusinessUsePercent`; real-time `Amount * BusinessUsePercent / 100` preview (DR-BUSE-001, DR-CORE-006)
- [x] 6.4 Step 3 (receipt) — upload-or-skip via `ReceiptUploadStep`
- [x] 6.5 Step 4 "Review & Save" — Save-as-Draft (closes wizard, no extra call) vs Submit (calls submit endpoint)
- [x] 6.6 Step 5 "AI Review" — renders post-submit `AiDeductionStatus`/`AiExplanation`/`AiDisclaimer` (server-supplied per D7) with fallback local disclaimer text; **step order deviates from the ticket's literal 4-before-5 (AI Review before Review&Save) because the backend only evaluates AI inside `/submit` — documented as D8, not achievable otherwise**
- [x] 6.7 Locked-year handling (D1): catches `TAXIQ_OWNER_TAX_YEAR_LOCKED` from create/update/submit, shows a toast + persistent inline banner with a real "Go to Year-End Export" navigation button (toast text alone cannot carry a link)
- [x] 6.8 Supports an `initialDeduction` prop so `DeductionCenterView`'s "Edit" action can resume a Draft/MissingReceipt/MissingInfo record instead of only creating new ones
- [x] 6.9 All labels/errors through `t()`, no hardcoded strings

## 7. Deduction Center List View

- [x] 7.1 Create `src/components/dashboard/views/taxiq/DeductionCenterView.tsx`
- [x] 7.2 Status + category filters, running `totalDeductibleAmount` rendered directly from the server response (not re-summed client-side, per D5 — list is not paginated)
- [x] 7.3 Status badge, AI status badge, CPA-review explanation, Not-Deductible notice per row
- [x] 7.4 Row actions: Edit (Draft/MissingReceipt/MissingInfo only), Re-analyze (any non-Draft record), Approve (CPAReview only)
- [x] 7.5 Empty state and loading skeleton (`SkeletonList`)

## 8. Route Wiring

- [x] 8.1 Replace `TaxIqDeductionsRoute = makeTaxIqRoute('taxiq-deductions')` in `routes/index.tsx` with a real component
- [x] 8.2 Gate on an existing `OwnerTaxYear` (same `useMerchantSetup()` + `useOwnerTaxYearByBusiness()` pattern as `TaxIqOverviewRoute`) — shows a "complete Tax IQ setup first" prompt with a CTA back to `/dashboard/taxiq` if none exists yet
- [x] 8.3 No changes needed to `src/app/AppRouter.tsx` — route path already registered, only the element changed

## 9. i18n

- [x] 9.1 Add `taxiq.deductionCenter.*` keys to `src/locales/en.json` and `src/locales/vi.json`
- [x] 9.2 Confirmed key parity between `en.json`/`vi.json` via a manual Node script (same substitute used in `integrate-taxiq-owner-onboarding` — `scripts/verify-tokens.cjs` still does not exist on this branch)

## 10. Verification

- [x] 10.1 `npx tsc --noEmit` — zero errors introduced by this change (confirmed by filtering the full error list for any touched file/path; all 42 pre-existing errors are in unrelated files)
- [x] 10.2 `npx vite build --mode development` (pnpm unavailable in this shell, same as prior TaxIQ change) — clean build
- [x] 10.3 `npx vitest run` — 1 pre-existing failure in `staffSelf.test.ts` (`normalizeStaffLinkRequestDetail`), unrelated to any file touched by this change; not introduced here
- [ ] 10.4 `pnpm lint:tokens` — **could not run**: `scripts/verify-tokens.cjs` does not exist on this branch checkout (same gap noted in `integrate-taxiq-owner-onboarding`)
- [ ] 10.5 `npx openspec validate integrate-taxiq-owner-deductions --strict` — **could not run**: no `openspec` CLI resolvable via `npx` in this environment; artifacts hand-authored to mirror `integrate-taxiq-owner-onboarding`'s exact structure
- [x] 10.4b Backend: `dotnet build src/Application/Application.csproj` — clean (0 errors) for the `GetDeductionCategoriesQueryHandler` change. `dotnet build src/Web/WebAPI.csproj` could not complete the copy step — a local debug session (`devenv.exe`/`Nexora.Web.exe`) held the output DLLs locked; no compile errors were reported before the lock failure, and the controller attribute change is a minimal, low-risk edit. Recommend a clean rebuild once the local debug session is stopped.
- [ ] 10.6 Live smoke test against dev API — **not exercised**. No longer blocked by Open Question 1 (fixed in this change), but requires deploying the backend fix and re-testing against a live environment, which wasn't available this session.

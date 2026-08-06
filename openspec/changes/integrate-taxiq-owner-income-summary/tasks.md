## 1. Contract and Query Keys

- [x] 1.1 Add `qk.taxiqOwnerIncome(ownerTaxYearId?)` / `qk.taxiqOwnerIncomeDetail(id?)` to
      `src/data/queryKeys.ts`
- [x] 1.2 Add `TAXIQ_OWNER_INCOME_RECORD_NOT_FOUND` to `src/data/errorCodes.ts`

## 2. `taxiqOwnerIncome` Repository + Hooks

- [x] 2.1 Create `src/data/repositories/taxiqOwnerIncome.ts` — normalize shape mirroring
      `taxiqSelfReportedIncome.ts` (D1)
- [x] 2.2 Create `src/data/hooks/useTaxiqOwnerIncome.ts` — list/detail/create/update/remove/linkReceipt,
      mutations invalidate `qk.taxiqOwnerIncome(ownerTaxYearId)`
- [x] Verified: `npx tsc --noEmit` introduces zero new errors; `npx vite build --mode development` clean

## 3. Generalize `ReceiptUploadStep`

- [x] 3.1 Add optional `ownerIncomeRecordId?: string` prop (D2)
- [x] 3.2 Wire `useLinkReceiptToOwnerIncome` mutation, called when `ownerIncomeRecordId` is set
- [x] Verified: existing two call sites (`AddDeductionWizard`, `SelfReportedIncomeWizard`) unchanged —
      confirmed no `ownerIncomeRecordId` reference added to their call sites, only the new
      `OwnerIncomeWizard` passes it

## 4. Owner Income Summary List + Wizard

- [x] 4.1 Create `OwnerIncomeSummaryListView.tsx` (D4) — mirror `IncomeSummaryListView.tsx`:
      table, empty state, Locked banner → `/dashboard/taxiq/export`
- [x] 4.2 Create `OwnerIncomeWizard.tsx` (D3, D4) — 3-step wizard mirroring
      `SelfReportedIncomeWizard.tsx`, `INCOME_TYPE_OPTIONS = ['ServiceRevenue', 'ProductRetailRevenue', 'Other']`.
      Reuses the Staff-folder `PeriodPicker.tsx` as-is (cross-boundary import, same precedent
      already set by `ReceiptUploadStep` living under `dashboard/` but imported from
      `staff-dashboard/`) — its period-type/period-picker i18n strings stay under the
      `taxiq.selfReportedIncome.*` namespace since the text is generic (Day/Week/Month/etc.),
      not Staff-specific; not duplicated under `taxiq.ownerIncome.*`.
- [x] Verified: `npx tsc --noEmit` and build clean

## 5. Routing + Sidebar

- [x] 5.1 Add `TaxIqIncomeRoute` to `src/components/dashboard/routes/index.tsx` (mirror
      `TaxIqDeductionsRoute`, using `ownerTaxYear.taxYear` from the fetched record, not
      `new Date().getFullYear()` — matches the `StaffTaxIqIncomeRoute` precedent)
- [x] 5.2 Add `TaxIqIncomeRoute` to the existing Owner-route import list + `<Route path="taxiq/income">`
      in `src/app/AppRouter.tsx`. **Deviation from plan**: no lazy import added — Owner's
      `dashboard/routes/index.tsx` exports (`TaxIqDeductionsRoute` etc.) are already imported
      synchronously as a group in `AppRouter.tsx`, unlike Staff's per-file `lazyWithRetry` routes;
      followed the existing Owner convention instead of introducing a new lazy-loading pattern
      for just this one route.
- [x] 5.3 Add `{ id: 'income', label: 'Income Summary' }` to `MENU_ITEMS.taxiq.children` in
      `src/components/dashboard/constants.tsx` (no `TAXIQ_MENU_CHILD_MODULE` entry — always
      visible, same as `equipment`/`cpa-access`). **Discovered while wiring** (not in original
      plan): the sidebar renders the label via `t('dashboard.menu.taxiq_' + sub.id)`, not the
      `label` field on the `MENU_ITEMS` object — added `dashboard.menu.taxiq_income` to both
      locale files too (§6).

## 6. i18n

- [x] 6.1 Add `taxiq.ownerIncome.*` namespace to `en.json`/`vi.json` (mirror
      `taxiq.selfReportedIncome.*` keys, income-type sub-keys swapped to the Owner set, no
      `incomeTypeTooltips`/`dashboard`/`periodPicker` sub-keys since those aren't needed — see 4.2)
- [x] 6.2 Add `errors.taxiq_owner_income_record_not_found` to both locale files
- [x] 6.3 Add `dashboard.menu.taxiq_income` to both locale files (discovered in 5.3, not
      originally planned)
- [x] Key parity confirmed by construction (each key added to both `en.json` and `vi.json` in
      the same edit pass); no automated parity script run this session

## 7. Verification

- [x] 7.1 `npx tsc --noEmit` — zero errors introduced by this change (confirmed by grepping the
      full error output for every file touched: `OwnerIncome`, `ReceiptUploadStep`, `queryKeys.ts`,
      `errorCodes.ts`, `dashboard/routes/index`, `AppRouter.tsx`, `dashboard/constants` — no
      matches; all ~50 pre-existing errors are in unrelated files)
- [x] 7.2 `npx vite build --mode development` — clean build (2719 modules transformed, only a
      pre-existing "large chunk" warning on `DashboardOwnerShell`, unrelated to this change)
- [ ] 7.3 Local-to-local smoke test (backend local + `pnpm dev`/`npx vite`) — **not performed
      this session** (no local backend instance running in this environment). Residual
      verification gap, same category as noted in `integrate-taxiq-staff-adjustment` before its
      own live-testing pass — should be done before merge: run `vlink-nexora/backend`
      (`dotnet run --project src/Web --environment Development` or `Test`, see the CORS note in
      that change's design.md) + `npx vite --port 3000` here, then exercise the AC in
      `US-014-owner-income-summary.md` end-to-end.

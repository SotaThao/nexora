## 1. Types & Constants

- [x] 1.1 Add `TransactionCategory`, `IncomeByCategoryStat`, `IncomeByCategoryStats` to
      `src/types/domain.ts`; add `categoryId?`/`categoryName?` to `TransactionRecord`,
      `MerchantPaymentRecord`, `StaffPaymentRecord`, `StaffTipItem`, `PayoutRecord`,
      `StaffPayoutDetailRecord`
- [x] 1.2 Add `TransactionCategoryApiDto`, `IncomeByCategoryStat(s)ApiDto` to
      `src/types/repositories.ts`; add `categoryId?`/`categoryName?` to `TipApiDto`
- [x] 1.3 Add `src/constants/incomeCategoryPeriod.ts` (`IncomeCategoryPeriod` + `buildPeriodValueOptions`)

## 2. Repository Layer

- [x] 2.1 Create `src/data/repositories/transactionCategories.ts` (D1) — 404 on `list`/
      `getIncomeStats` degrades to empty, matching `myCertificates.ts`
- [x] 2.2 Add `setCategory` to `merchantPayments.ts` + `staffPayments.ts`; normalizers read
      `categoryId`/`categoryName` (D2)
- [x] 2.3 Add `setTipCategory` to `staffSelf.ts` (D3, not `transactions.ts`) — normalizer +
      `staffTipToTransactionRecord` both carry the field through
- [x] 2.4 Add `setCategory` to the **staff** factory only in `payouts.ts`; both normalizers
      (`normalizePayoutRecord`, `normalizeStaffPayoutDetail`) read `categoryId`/`categoryName`

## 3. Query Keys & Hooks

- [x] 3.1 Add 4 new query keys to `src/data/queryKeys.ts`
- [x] 3.2 Create `src/data/hooks/useTransactionCategories.ts` — list/create/update/delete/stats,
      both scopes
- [x] 3.3 Add `useSetMerchantPaymentCategory` to `useMerchantPayments.ts`
- [x] 3.4 Add `useSetStaffPaymentCategory` to `useStaffPayments.ts`
- [x] 3.5 Add `useSetTipCategory` to `useStaffSelf.ts`
- [x] 3.6 Add `useSetStaffPayoutCategory` to `useStaffPayouts.ts`

## 4. Shared UI Components

- [x] 4.1 `src/components/dashboard/categories/CategorySelect.tsx` — native `<select>`, literal
      `__create_new__` option
- [x] 4.2 `src/components/dashboard/categories/AddEditCategoryModal.tsx` — shared create/rename
      modal, mobile-safe (`92dvh`, `overflow-y-auto`)
- [x] 4.3 `src/components/dashboard/charts/IncomeByCategoryPanel.tsx` (D4) — self-fetching, period
      + period-value selects, bar list

## 5. Wire Into Existing Detail Modals

- [x] 5.1 `MerchantPaymentDetailModal.tsx` — Category block + create-and-attach flow
- [x] 5.2 `TransactionDetailModal.tsx` — Category block gated on `audience === 'staff'`
- [x] 5.3 `StaffPaymentDetailModal.tsx` — Category block
- [x] 5.4 `StaffPayouts.tsx`'s inline `StaffPayoutDetailModal` — Category `<dt>/<dd>` row

## 6. Merchant Category Management

- [x] 6.1 `src/components/dashboard/views/CategoryManagementView.tsx` — list + CRUD + embedded panel
- [x] 6.2 `constants.tsx` — `DASHBOARD_MENU_ID.categoryManagement`, submenu entry, extended
      `isPaymentsPayoutsRouteActive` guard
- [x] 6.3 `PaymentsPayoutsHeader.tsx` — conditional `?tab=` (D5)
- [x] 6.4 `dashboard/routes/index.tsx` + `AppRouter.tsx` — `CategoryManagementRoute` wired
- [x] 6.5 `TipsOverviewTab.tsx` — embedded panel + "Manage categories" button

## 7. Staff Category Management

- [x] 7.1 `src/components/staff-dashboard/views/StaffCategoryManagement.tsx`
- [x] 7.2 `AppRouter.tsx` — lazy import + `/staff/categories` route
- [x] 7.3 `StaffMyEarnings.tsx` — embedded panel (separate from existing breakdown-by-source) +
      "Manage categories" button

## 8. i18n

- [x] 8.1 Add `transaction_categories.*` (27 keys) to `en.json` and `vi.json`; validated both
      files parse and the key exists exactly once at the top level in each

## 9. Process Artifacts

- [x] 9.1 `user-story/US-049-income-payout-categories.md`
- [x] 9.2 This OpenSpec change (`proposal.md`, `design.md`, `tasks.md`, `specs/`)

## 10. Verification

- [ ] 10.1 `npx openspec validate integrate-income-payout-categories --strict`
- [ ] 10.2 `pnpm typecheck` — confirm no new errors vs. the pre-existing baseline
- [ ] 10.3 `pnpm build`
- [ ] 10.4 Manual dev-server smoke test: all 4 modals + both management screens + both Overview
      panels, desktop and 375px width — expected: empty-category-list state (BE not deployed),
      no `console.*` errors
- [ ] 10.5 Local-to-local against the sibling backend once its controller ships (residual gap,
      same category as other pre-BE-deploy changes in this repo)

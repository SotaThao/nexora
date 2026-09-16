## Why

Staff and Merchant currently see only raw transaction totals (Tips, StaffDirectPayment, Payout,
Customer Payments) with no way to classify what a given payment was *for*. GitHub issue #584 (BA/PO
requirement) asks for a self-defined "Category" label (Rent, Salary, Tip, Bonus, Commission, Other,
or custom) attachable to any money transaction, plus an "Income by category" breakdown, so both
audiences can track cash flow by purpose instead of only by aggregate amount. See
`user-story/US-049-income-payout-categories.md` and the technical design doc referenced there
(sibling repo `vlink-nexora`, `docs/business/income-payout-categories/`).

This change touches 5+ new files and 2 shared layers (query keys, 4 existing repositories/hooks),
so per AGENTS.md's API Integration Workflow it requires an OpenSpec change.

## What Changes

- Add a `transactionCategories` repository + hooks (list/create/update/delete + income-by-category
  stats), scoped separately for Merchant (`BusinessId`) and Staff (`StaffProfileId`) — two thin
  instances of one factory, mirroring the existing `payouts.ts` two-factory shape.
- Add `setCategory`/`setTipCategory` methods to the 4 existing repositories that own a
  categorizable entity (`merchantPayments.ts`, `staffPayments.ts`, `staffSelf.ts` for Tips,
  `payouts.ts` staff factory) — category assignment stays with the owning entity, not bundled into
  the new categories repository.
- Add `CategorySelect` (native `<select>`) and `AddEditCategoryModal` shared components, wired into
  the 4 existing transaction detail modals (`MerchantPaymentDetailModal`, `TransactionDetailModal`
  — staff audience only, `StaffPaymentDetailModal`, the inline `StaffPayoutDetailModal`).
- Add `IncomeByCategoryPanel` (period-filterable breakdown), reused by the Merchant Overview tab,
  a new Merchant `CategoryManagementView`, the Staff Earnings Overview tab, and a new Staff
  `StaffCategoryManagement` view.
- Add a `category-management` entry to the Merchant Payments & Payouts sidebar/route group, and a
  `/staff/categories` route.

## Capabilities

### New Capabilities

- `income-payout-categories`: Merchant and Staff can create/rename/delete their own transaction
  categories, assign one to a transaction they own, and view an income-by-category breakdown
  filterable by period.

## Impact

- **Files new**: `src/data/repositories/transactionCategories.ts`,
  `src/data/hooks/useTransactionCategories.ts`, `src/constants/incomeCategoryPeriod.ts`,
  `src/components/dashboard/categories/CategorySelect.tsx`,
  `src/components/dashboard/categories/AddEditCategoryModal.tsx`,
  `src/components/dashboard/charts/IncomeByCategoryPanel.tsx`,
  `src/components/dashboard/views/CategoryManagementView.tsx`,
  `src/components/staff-dashboard/views/StaffCategoryManagement.tsx`.
- **Files modified**: `src/types/domain.ts`, `src/types/repositories.ts`, `src/data/queryKeys.ts`,
  `src/data/repositories/{merchantPayments,staffPayments,staffSelf,payouts}.ts`,
  `src/data/hooks/{useMerchantPayments,useStaffPayments,useStaffSelf,useStaffPayouts}.ts`,
  `src/components/dashboard/modals/{MerchantPaymentDetailModal,TransactionDetailModal}.tsx`,
  `src/components/staff-dashboard/modals/StaffPaymentDetailModal.tsx`,
  `src/components/staff-dashboard/views/{StaffPayouts,StaffMyEarnings}.tsx`,
  `src/components/tips/tabs/TipsOverviewTab.tsx`, `src/components/dashboard/constants.tsx`,
  `src/components/dashboard/PaymentsPayoutsHeader.tsx`,
  `src/components/dashboard/routes/index.tsx`, `src/app/AppRouter.tsx`,
  `src/locales/en.json`, `src/locales/vi.json`.
- **Data boundary**: components -> data hooks -> repository -> `httpClient`. No direct
  `fetch`/storage access from components.
- **Backend readiness**: the sibling `vlink-nexora` repo (`feature/584-category` branch) started
  with only a draft `TransactionCategory` entity, but is now fully implemented and running locally
  at `https://localhost:5005` — which `.env.development` already points at — though not yet on the
  shared `test-api.nexoratouch.com`. The repository layer's contract has been verified directly
  against that local backend's source and generated API client (see `design.md`'s "Bugs found and
  fixed" for two real mismatches this caught and corrected), and still degrades reads to empty
  state on 404 for the not-yet-deployed-anywhere case.
- **Non-goals**: backend work (entity/migration/CQRS/controllers — sibling repo, out of scope for
  this FE-only repo); Merchant visibility into a Staff's Tip category (explicitly excluded by
  Business Rule 1 in the business doc); any change to POS/Service category taxonomy
  (`MerchantCategoriesController` / `posCategories.ts` — a separate, unrelated domain that this
  change does not reuse or touch).

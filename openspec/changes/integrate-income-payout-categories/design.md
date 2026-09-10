## Context

Issue #584's technical design doc (sibling repo `vlink-nexora`,
`docs/business/income-payout-categories/income-payout-categories-technical.md`) specifies a new
backend `TransactionCategory` entity and per-audience controllers, driving both a backend
implementation (in progress on the same `feature/584-category` branch) and this FE change.

**Update 2026-09-10**: the backend is now fully implemented and running locally
(`https://localhost:5005`, which `.env.development` already points at). The contract below is
verified directly against that source — read `MerchantTransactionCategoriesController.cs`/
`StaffTransactionCategoriesController.cs`/`GetIncomeByCategoryStatsQuery.cs` and the generated
`backend/src/Web/wwwroot/api/web-api-client.ts` in the sibling repo. It corrected two FE-authored
assumptions that were wrong (see "Bugs found and fixed" below) — not yet deployed to the shared
`test-api.nexoratouch.com`.

## Source Contract (verified against backend source, running locally)

| Operation | Request | Success |
|---|---|---|
| `GET /api/v1/{merchant\|staff}/transaction-categories` | — | `200 TransactionCategoryDto[]` |
| `POST /api/v1/{merchant\|staff}/transaction-categories` | `{ name }` | `201 Guid` (id only, not the full DTO) |
| `PUT .../transaction-categories/{id}` | `{ name }` | `200 bool` |
| `DELETE .../transaction-categories/{id}` | — | `200 bool` |
| `GET .../transaction-categories/stats` | `?period=AllTime\|Week\|Month\|Year&year=&month=&week=` | `IncomeByCategoryStatsDto` |
| `PUT /api/v1/merchant/payments/{id}/category` | `{ categoryId }` | `200 bool` |
| `PUT /api/v1/staff/tips/{id}/category` | `{ categoryId }` | `200 bool` |
| `PUT /api/v1/staff/payments/{id}/category` | `{ categoryId }` | `200 bool` |
| `PUT /api/v1/staff/payouts/{id}/category` | `{ categoryId }` | `200 bool` |

`TransactionCategoryDto`: `{ id, name, displayOrder }`. `IncomeByCategoryStatsDto`:
`{ period, from, to, totalAmount, items: [{ categoryId, categoryName, amount, transactionCount }] }`
— `categoryId: null` means "Uncategorized" (a virtual value, never a real row). `period` is a
string enum (`"AllTime"|"Week"|"Month"|"Year"`); `year`/`month`/`week` are separate optional ints,
not one opaque `periodValue`.

### Bugs found and fixed (2026-09-10, after the user reported the Overview panel showing no amounts)

1. **Wrong item field name** — the FE-authored contract assumed `totalAmount` per item; the real
   `IncomeByCategoryItemDto` field is `amount` (plus `transactionCount`, not modeled before). This
   was the actual root cause of every category showing `$0.00`: the normalizer read a field that
   never existed on the response and silently defaulted to `0`.
2. **Wrong period params** — the FE-authored contract used `period=all|week|month|year` +
   `periodValue` (one string); the real query is `period` (PascalCase string enum) + `year`/
   `month`/`week` (separate ints). `src/constants/incomeCategoryPeriod.ts` was rewritten around
   this — `buildPeriodValueOptions` now returns `{year?, month?, week?}` per option instead of one
   opaque string.
3. **Create/Update don't return the full DTO** — `create` returns just the new `Guid`; `update`
   returns `bool`. `transactionCategoriesRepository.create`/`update` return `{id: string}`/
   `boolean` respectively now, not a normalized `TransactionCategory`. The 4 call sites that create
   a category inline from a transaction detail (`MerchantPaymentDetailModal`,
   `TransactionDetailModal`, `StaffPaymentDetailModal`, `StaffPayouts`) only ever read `.id` from
   the result, so this needed no further change there.

Business rules enforced server-side (FE only mirrors them for UX, never re-implements ownership
checks client-side): exactly one owner per transaction (Business XOR Staff); Staff's category set
is personal, shared across every business they work at; deleting a category in-use fans out to
`categoryId = null` on referencing rows, not blocked; category assignment is allowed regardless of
a transaction's confirmation status.

## Decisions

### D1 — One `createTransactionCategoriesRepository(client, basePath)` factory, two instances

Mirrors `payouts.ts`'s `createMerchantPayoutsRepository`/`createStaffPayoutsRepository` shape: the
CRUD + stats operations are identical between Merchant and Staff, differing only in the URL
prefix and the caller's session role (enforced by each hook via `useSessionRole()`), so one factory
parameterized by `basePath` avoids duplicating five near-identical methods.

### D2 — Category *assignment* lives in the owning entity's repository, not in
`transactionCategories.ts`

`setCategory`/`setTipCategory` are added to `merchantPayments.ts`, `staffPayments.ts`,
`staffSelf.ts` (Tips), and `payouts.ts` (staff factory only) rather than centralized in the new
categories repository. Rationale: assigning a category to a Payment/Tip/Payout is a mutation on
that entity (same shape as `acknowledge`/`confirm` already living there), and the Architecture
Rules' "Repositories own domain operations" would be violated by a categories repository reaching
into another entity's endpoint. This also keeps invalidation local — `useSetMerchantPaymentCategory`
invalidates payment list/detail keys the same hook file already owns.

### D3 — Tip category assignment belongs to `staffSelf.ts`, not `transactions.ts`

`transactions.ts` (`transactionsRepository`) is Merchant-scoped — it calls
`GET /api/v1/merchant/dashboard/tips` for the Merchant's own dashboard aggregate. The Tip category
endpoint (`PUT /api/v1/staff/tips/{id}/category`) is a Staff action on `/api/v1/staff/tips`, which
`staffSelf.ts` already owns (`getTips`, `confirmTipsReceipt`). Placing `setTipCategory` in
`transactions.ts` would have hit the wrong audience's endpoint from the wrong repository — corrected
during implementation before this became load-bearing.

### D4 — `IncomeByCategoryPanel` self-fetches; no new prop threaded through `TipsView`/`useTipsData`

`TipsOverviewTab.tsx` currently receives all its data as props from `TipsView.tsx` via the
`useTipsData` hook. Rather than extending that chain (`TipsView` → `useTipsData` → `TipsOverviewTab`)
with category stats, `IncomeByCategoryPanel` calls its own `useMerchantIncomeByCategoryStats`/
`useStaffIncomeByCategoryStats` hook directly wherever it's mounted (Merchant Overview, Merchant/
Staff Category Management, Staff Earnings Overview) — a self-contained component, not a
prop-drilled one, keeping the existing prop chain untouched (AGENTS.md: "keep edits narrow").

### D5 — `PaymentsPayoutsHeader`'s tab-bar `navigate()` becomes conditional on `params.tab`

The new "Category Management" entry in `PAYMENTS_PAYOUTS_SUBMENU` is a standalone route, not a tab
within Tips/Reports, so it carries no `params.tab`. `PaymentsPayoutsHeader.tsx`'s click handler
previously always appended `?tab=${item.params.tab}`; changed to a ternary that only appends when
`item.params?.tab` is set. All 6 existing entries always have a `tab`, so this is a no-op for them
— only the new entry takes the other branch. `isPaymentsPayoutsSubActive` already handled a missing
tab correctly (`if (!tab) return true`), so it needed no change; `isPaymentsPayoutsRouteActive`'s
allow-list gained the new `categoryManagement` menu id so sidebar highlighting still recognizes the
screen as part of the Payments & Payouts area.

## Open Questions

Resolved against the local backend (see "Bugs found and fixed" above and US-049's API Mapping,
now tagged (L) verified). Remaining: this has only been verified against a **local** backend
instance, not the shared `test-api.nexoratouch.com` — re-run the AC in US-049 once that
environment has the endpoint too, in case a deploy-time config differs from the local run.

## Migration Plan

1. Add types (`TransactionCategory`, `IncomeByCategoryStat(s)`, wire DTOs) + `categoryId`/
   `categoryName` fields on the 5 existing record types that need them.
2. Add `src/constants/incomeCategoryPeriod.ts`.
3. Add `src/data/repositories/transactionCategories.ts` (D1) + `setCategory`/`setTipCategory` on
   the 4 owning repositories (D2, D3).
4. Add `qk.merchantTransactionCategories`/`merchantIncomeByCategoryStats`/
   `staffTransactionCategories`/`staffIncomeByCategoryStats` to `queryKeys.ts`.
5. Add `src/data/hooks/useTransactionCategories.ts` + assignment mutations on the 4 existing hook
   files.
6. Add `CategorySelect`, `AddEditCategoryModal`, `IncomeByCategoryPanel` (D4).
7. Wire the Category block into the 4 existing detail modals.
8. Add `CategoryManagementView` (Merchant) + route/menu wiring (D5); add `StaffCategoryManagement`
   + `/staff/categories` route.
9. Embed `IncomeByCategoryPanel` in `TipsOverviewTab` and `StaffMyEarnings`.
10. Add `transaction_categories.*` i18n namespace to both locale files.
11. Add `user-story/US-049-income-payout-categories.md`; run `npx openspec validate
    integrate-income-payout-categories --strict`, `pnpm typecheck`, `pnpm build`.

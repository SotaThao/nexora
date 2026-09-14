## ADDED Requirements

### Requirement: Category Data Layer
The frontend SHALL provide a repository and hooks for creating, listing, renaming, and deleting
transaction categories, scoped separately for Merchant (`BusinessId`) and Staff (`StaffProfileId`).

#### Scenario: List categories
- **WHEN** `useMerchantCategories()` (or `useStaffCategories()`) is used
- **THEN** the frontend SHALL call `GET /api/v1/{merchant|staff}/transaction-categories`
- **AND** SHALL treat a `404` response as an empty list, not an error state

#### Scenario: Create a category
- **WHEN** `useCreateMerchantCategory().mutate(name)` (or the Staff equivalent) is called
- **THEN** the frontend SHALL call `POST .../transaction-categories` with `{ name }`
- **AND** on success SHALL invalidate the categories list query key for that scope

#### Scenario: Delete a category
- **WHEN** `useDeleteMerchantCategory().mutate(categoryId)` (or the Staff equivalent) is called
- **THEN** the frontend SHALL call `DELETE .../transaction-categories/{id}`
- **AND** on success SHALL invalidate both the categories list and the income-by-category stats
  query keys for that scope (deleting an in-use category changes the stats breakdown)

### Requirement: Category Assignment Stays With The Owning Entity
Assigning a category to a transaction SHALL be a mutation on that transaction's own repository/hook
file, not on the categories repository.

#### Scenario: Merchant assigns a category to a Customer Payment
- **WHEN** `useSetMerchantPaymentCategory().mutate({ paymentId, categoryId })` is called
- **THEN** the frontend SHALL call `PUT /api/v1/merchant/payments/{id}/category` with
  `{ categoryId }`
- **AND** on success SHALL invalidate that payment's detail query key

#### Scenario: Staff assigns a category to a Tip
- **WHEN** `useSetTipCategory().mutate({ tipId, categoryId })` is called
- **THEN** the frontend SHALL call `PUT /api/v1/staff/tips/{id}/category` with `{ categoryId }`
- **AND** SHALL NOT route this call through the Merchant-scoped tips repository
  (`transactions.ts`, which calls `/api/v1/merchant/dashboard/tips`)

#### Scenario: Staff assigns a category to a Payout
- **WHEN** `useSetStaffPayoutCategory().mutate({ payoutId, categoryId })` is called
- **THEN** the frontend SHALL call `PUT /api/v1/staff/payouts/{id}/category` with `{ categoryId }`
- **AND** Merchant repositories/hooks SHALL NOT expose an equivalent payout-category mutation

### Requirement: Merchant Cannot View Or Edit A Tip's Category
`TransactionDetailModal` is shared by both audiences; the Category block SHALL render only for the
Staff audience.

#### Scenario: Merchant views a Tip detail
- **WHEN** `TransactionDetailModal` renders with `audience="merchant"`
- **THEN** it SHALL NOT render a Category dropdown or any category value for that Tip

#### Scenario: Staff views a Tip detail
- **WHEN** `TransactionDetailModal` renders with `audience="staff"`
- **THEN** it SHALL render a Category dropdown sourced from the Staff's own category list

### Requirement: Create-and-Attach From A Transaction Detail
Choosing "+ Create new" from a `CategorySelect` SHALL create the category and immediately assign it
to the transaction being viewed, in one user action.

#### Scenario: Create new from a detail modal
- **WHEN** the user picks "+ Create new" in any transaction detail modal's `CategorySelect`, enters
  a name, and saves
- **THEN** the frontend SHALL first call the create-category mutation for the caller's scope
- **AND** on success SHALL immediately call that transaction's set-category mutation with the new
  category's id

### Requirement: Income By Category Panel
`IncomeByCategoryPanel` SHALL fetch its own data independently of any parent component's props, and
SHALL support filtering by period.

#### Scenario: Period filter change
- **WHEN** the user changes the period selector (All time/Week/Month/Year) or the specific period
  value
- **THEN** the frontend SHALL re-call `GET .../transaction-categories/stats` with the new
  `period`/`periodValue` query params

#### Scenario: Reused across four screens
- **WHEN** `IncomeByCategoryPanel` is mounted on the Merchant Overview tab, Merchant Category
  Management, Staff Earnings Overview, or Staff Category Management
- **THEN** it SHALL render correctly using only its own props (`stats`, `period`, callbacks) without
  requiring any change to the host screen's existing data-fetching chain

### Requirement: Category Management Screens
Merchant and Staff each get a standalone screen to create, rename, and delete their own categories.

#### Scenario: Merchant reaches Category Management from the sidebar
- **WHEN** the Merchant selects "Category Management" from the Payments & Payouts sidebar group
- **THEN** the frontend SHALL navigate to `/dashboard/category-management` without requiring a
  `?tab=` query param
- **AND** the Payments & Payouts tab bar SHALL still highlight it as active

#### Scenario: Staff reaches Category Management from My Earnings
- **WHEN** the Staff selects "Manage categories" from the My Earnings Overview panel
- **THEN** the frontend SHALL navigate to `/staff/categories`

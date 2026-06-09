## ADDED Requirements

### Requirement: Dashboard Overview Metrics
The merchant Overview SHALL display real aggregated metrics fetched from `GET /api/v1/merchant/dashboard/overview` via `dashboardRepository.getOverview()` and the `useDashboardOverview()` hook, keyed by `qk.dashboardOverview()`.

The overview SHALL surface, at minimum: total tip amount, tip count, average tip amount, total scans, conversion rate, total reviews, average rating, public review count, private review count, Google click count, and Yelp click count.

#### Scenario: Overview loads with data
- **WHEN** a merchant opens the dashboard Overview and the account has activity
- **THEN** `useDashboardOverview()` SHALL call `GET /api/v1/merchant/dashboard/overview` and render the returned metrics (tip total, tip count, average tip, scans, conversion rate, review counts, rating, click counts)

#### Scenario: Overview loading state
- **WHEN** the overview query is in flight
- **THEN** the Overview SHALL render a loading state (skeleton/spinner) and SHALL NOT render placeholder numbers as if they were real

#### Scenario: Overview for a brand-new merchant (zeros)
- **WHEN** the endpoint returns all-zero metrics for a merchant with no activity yet
- **THEN** the Overview SHALL render the zero values with a "no activity yet" affordance rather than an error

#### Scenario: Overview fetch error
- **WHEN** `GET /api/v1/merchant/dashboard/overview` returns a non-2xx ProblemDetails response
- **THEN** `useDashboardOverview()` SHALL expose the error to the component, which SHALL render a retry affordance and SHALL NOT crash

### Requirement: Staff Performance Metrics
The merchant Staff view SHALL display per-staff performance metrics fetched from `GET /api/v1/merchant/dashboard/staff` via `dashboardRepository.getStaffMetrics()` and the `useDashboardStaff()` hook, keyed by `qk.dashboardStaff()`.

#### Scenario: Staff metrics load
- **WHEN** the merchant opens the Staff view
- **THEN** `useDashboardStaff()` SHALL call `GET /api/v1/merchant/dashboard/staff` and render each staff member's metrics (e.g. tip count, average rating) alongside the staff list

#### Scenario: No staff yet
- **WHEN** the endpoint returns an empty staff metrics list
- **THEN** the Staff view SHALL render an empty state prompting the merchant to invite staff

### Requirement: Touch Point Performance Metrics
The merchant Touch Points view SHALL display per-touch-point performance metrics fetched from `GET /api/v1/merchant/dashboard/touchpoints` via `dashboardRepository.getTouchpointMetrics()` and the `useDashboardTouchpoints()` hook, keyed by `qk.dashboardTouchpoints()`.

#### Scenario: Touch point metrics load
- **WHEN** the merchant opens the Touch Points view
- **THEN** `useDashboardTouchpoints()` SHALL call `GET /api/v1/merchant/dashboard/touchpoints` and render scan/conversion metrics per touch point

#### Scenario: No touch points yet
- **WHEN** the endpoint returns an empty list
- **THEN** the view SHALL render an empty state (no metrics, no error)

### Requirement: DTO Normalization in Dashboard Repository
`dashboardRepository` SHALL map each raw dashboard DTO to the shape the existing components already consume, so component code is not rewritten around new field names.

#### Scenario: Metric field mapping
- **WHEN** `dashboardRepository.getOverview()` receives the raw overview DTO
- **THEN** it SHALL return an object whose keys match what `Overview.jsx` / `ReportsView.jsx` already reference (normalizing any casing/nesting differences inside the repository)

### Requirement: Deferred Transaction List (Backend Dependency)
Because no merchant transaction/tip **list** endpoint exists, `transactionsRepository.list()` SHALL remain a stub returning `[]`, and views that list individual transactions SHALL render an explicit empty state.

#### Scenario: Tips/transaction list view with no endpoint
- **WHEN** the merchant opens a view that lists individual tips/transactions (e.g. `TipsView`, transaction detail)
- **THEN** the view SHALL render an intentional empty state (e.g. "Detailed transaction history is not available yet") and SHALL NOT call a non-existent endpoint

## Purpose

Enable an authenticated staff member to view a trustworthy summary of their own income across linked businesses and independent work for a selected reporting period.

## ADDED Requirements

### Requirement: Staff income is loaded from the authenticated report API
The system SHALL load the signed-in staff member's report from `GET /api/v1/staff/reports/income` and SHALL NOT send a staff identifier or frontend timezone.

#### Scenario: Report screen loads real income data
- **WHEN** an authenticated staff member opens the Report screen
- **THEN** the system requests the staff income report and presents values from the returned `summary`

### Requirement: Staff can select an income source scope
The system SHALL allow the staff member to report across all sources, one active linked business, or independent income only.

#### Scenario: All income sources are selected
- **WHEN** the staff member selects all sources
- **THEN** the request includes `scope=All` without a `businessId`

#### Scenario: One linked business is selected
- **WHEN** the staff member selects an active linked business
- **THEN** the request includes `scope=Business` and that business's `businessId`

#### Scenario: Independent income is selected
- **WHEN** the staff member selects independent income
- **THEN** the request includes `scope=Independent` without a `businessId`

### Requirement: Staff can select a report period
The system SHALL support Daily, Weekly, Monthly, and Yearly requests using the backend's period-specific parameters.

#### Scenario: Daily report is selected
- **WHEN** the staff member selects a date in the Daily tab
- **THEN** the request includes `period=Daily` and the selected ISO date as `date`

#### Scenario: Weekly report is selected
- **WHEN** the staff member selects an ISO week and year in the Weekly tab
- **THEN** the request includes `period=Weekly` and the Monday of that ISO week as `weekStart`

#### Scenario: Selected ISO year has only 52 weeks
- **WHEN** the staff member changes from Week 53 to an ISO year without Week 53
- **THEN** the week selection clamps to Week 52 and the request uses that valid week's Monday

#### Scenario: Monthly report is selected
- **WHEN** the staff member selects a month and year in the Monthly tab
- **THEN** the request includes `period=Monthly`, `month`, and `year`

#### Scenario: Yearly report is selected
- **WHEN** the staff member selects a year in the Yearly tab
- **THEN** the request includes `period=Yearly` and `year`

### Requirement: Report summary presents scope-specific metrics safely
The system SHALL choose the visible summary metrics from the selected income-source scope.

#### Scenario: All income sources are displayed
- **WHEN** the selected scope is All
- **THEN** the screen displays Income, Pay, Tip, Other Income, and Paid Amount in that order using `summary.income`, `summary.pay`, `summary.tip`, `summary.otherIncome`, and `summary.paidAmount`

#### Scenario: Independent income is displayed
- **WHEN** the selected scope is Independent
- **THEN** the screen displays Income, Direct Payments, and Self-Reported Income in that order using `summary.income`, `sources.directPayments`, and `sources.selfReportedIncome`

#### Scenario: One business is displayed
- **WHEN** the selected scope is Business and the report summary contains numeric POS metrics
- **THEN** the screen displays Turns, Hours, Service, Pay, Commission, Commission Percent, Tip, and Tech Takes in that order using `summary.turns`, `summary.totalHours`, `summary.service`, `summary.pay`, `summary.commission`, `summary.commissionPercent`, `summary.tip`, and `summary.techTakes` respectively
- **AND** the screen formats counts, hours, currency, and percentage values according to their metric types

#### Scenario: Vietnamese metric terminology is displayed
- **WHEN** the application language is Vietnamese
- **THEN** the visible metric labels use Thu nhập, Tiền công, Tiền tip, Thu nhập khác, Đã thanh toán, Lượt, Giờ làm, Doanh thu dịch vụ, Tiền hoa hồng, Tỷ lệ hoa hồng, Thợ nhận, Thanh toán trực tiếp, and Thu nhập tự khai báo for their corresponding English metrics

### Requirement: Report translations follow the approved canonical dictionary
The system SHALL expose the approved 48 flat English/Vietnamese keys under `staff_salon_report` for report scope, period, controls, metrics, sections, and request states, and the current Report screen SHALL use those canonical keys for visible copy.

#### Scenario: Canonical translations are resolved in English and Vietnamese
- **WHEN** the application language is English or Vietnamese
- **THEN** each of the 48 approved report keys resolves to its exact approved value rather than returning a missing-key path or a legacy phrase

#### Scenario: Existing locale consumers remain compatible
- **WHEN** another screen still reads an existing nested `staff_salon_report` alias
- **THEN** that alias remains available while the Report screen uses the canonical flat key

### Requirement: Report source totals preserve the deployed response contract
The system SHALL model `sources` as an object containing `posPay`, `posTips`, `qrTips`, `manualTips`, `directPayments`, and `selfReportedIncome`, and SHALL preserve the same source object on each business breakdown item.

#### Scenario: Independent source totals are displayed
- **WHEN** the report response contains direct-payment and self-reported totals
- **THEN** the screen reads those totals directly from the top-level `sources` object without deriving them from `summary` or `breakdown`

#### Scenario: POS metrics do not apply
- **WHEN** a visible POS metric is `null`, including a Business report for a staff member without a POS profile
- **THEN** the screen displays an unavailable marker instead of zero or malformed text

### Requirement: Report request states are understandable and recoverable
The system SHALL distinguish loading, successful, and failed report requests without showing stale preview values.

#### Scenario: Report request is pending
- **WHEN** a report request has not completed
- **THEN** the report panel presents a loading state

#### Scenario: Report request fails
- **WHEN** the report API returns an error
- **THEN** the report panel presents a localized error state with an action to retry the request

#### Scenario: Staff changes a filter
- **WHEN** the staff member changes source scope or reporting period
- **THEN** the system requests and presents the report for the new filter combination

### Requirement: Cached income is isolated by authenticated staff
The system SHALL partition staff income report cache entries by authenticated session identity in addition to report filters.

#### Scenario: A different staff member signs in on the same browser
- **WHEN** the current Staff session changes while the report filters remain the same
- **THEN** the system loads a separate report entry and does not display the previous Staff member's cached income

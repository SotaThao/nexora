## Context

See `proposal.md` for motivation. `StaffSalonReport.tsx` already owns the Report route, source selector, period tabs, and date controls, but its metric row comes from a hard-coded `PREVIEW_REPORT`. The application data boundary is `component -> TanStack Query hook -> repository -> httpClient`, backend enum strings must come from shared constants, and user-visible text must be localized.

The approved contract is the requirement supplied for `GET /api/v1/staff/reports/income`. As of 2026-08-20, staging Swagger does not list the route, but a direct unauthenticated request returns `401`, consistent with a deployed authenticated endpoint. Automated tests verify the approved request/response boundary with complete fixtures until a Staff token and suitable staging data are available for a `200` payload check. Development mode targets the staging API by explicit user request.

## Goals / Non-Goals

**Goals:**

- Replace preview metrics with API-backed summary values.
- Keep scope and period state deterministic, URL-compatible, and cache-safe.
- Preserve the response sections even though the current screen consumes only `summary`.
- Make nullable POS fields visibly unavailable rather than coercing them to zero.
- Cover component, hook, and repository behavior with targeted tests.

**Non-Goals:**

- Rendering `sources`, daily `breakdown`, or `businessBreakdown` as additional tables.
- Recomputing income, commission, turns, pay, tips, or timezone boundaries in the frontend.
- Adding a timezone selector or sending a browser timezone.
- Changing staff authentication, route registration, or business-link retrieval.

## Decisions

### Model report scope and period as discriminated parameter unions

The repository accepts a scope union (`All`, `Business` with `businessId`, or `Independent`) and a period union (`Daily`, `Weekly`, `Monthly`, or `Yearly` with only the relevant fields). Query construction uses `URLSearchParams`, so irrelevant parameters and timezone cannot leak into a request. Shared constant objects under `src/constants/` supply backend enum values in accordance with the repository rule against inline backend enum strings.

Alternative considered: accept a loose record of optional parameters. Rejected because invalid combinations such as Business without `businessId` or Daily with `month` would be representable and could fragment cache keys.

### Keep report data server-owned

The repository returns the complete response structure and normalizes nullable metric fields without performing business calculations. The component reads `summary` for All and Business metrics, and combines `summary.income` with the top-level `sources.directPayments` and `sources.selfReportedIncome` for Independent. `isEstimatedPay`, `breakdown`, and the remaining source totals remain available to future consumers without changing the current UI scope.

Alternative considered: derive summary values from `breakdown`. Rejected because the backend explicitly owns rounding, fixed-pay allocation, timezone aggregation, and order de-duplication.

### Derive API filters from the existing screen state

All sources remains the default. Active business IDs preserve the existing `salon` URL parameter; Independent uses the reserved URL value `independent`. Period tabs keep their existing URL behavior. Weekly UI state remains ISO week number plus ISO week-year, and small pure helpers convert that pair to the ISO Monday expected by `weekStart`. Week choices are limited to the 52 or 53 weeks that actually exist in the selected ISO year and clamp safely when the year changes.

Alternative considered: replace the week control with a date input. Rejected to preserve the approved existing UI and observable route behavior.

### Represent unavailable POS metrics explicitly

The metric view model accepts `number | null`. Numeric zero is formatted normally; only `null` renders an em dash. This prevents Independent reports and staff without a POS profile from looking like confirmed zero activity.

### Choose metrics by source scope

All reports show Income, Pay, Tip, Other Income, and Paid Amount from `summary`. Business reports show Turns, Hours, Service, Pay, Commission, Comm %, Tip, and Tech Takes from `summary`. Independent reports show Income from `summary` followed by Direct Payments and Self-Reported Income from the top-level `sources` object. The same metric view model drives desktop and mobile layouts so column visibility cannot drift between breakpoints.

Metric keys remain language-neutral in the view model. EN/VI dictionaries own the approved labels, including the domain-specific Vietnamese wording `Giờ làm`, `Doanh thu dịch vụ`, `Tỷ lệ hoa hồng`, and `Thu nhập tự khai báo`.

### Use the approved flat report translation contract

The 48 approved translation keys live directly under `staff_salon_report`, including scope, period, control, metric, section, and request-state labels. The current Report screen reads these flat canonical keys so its visible English and Vietnamese copy matches the product table exactly. Existing nested `tabs`, `filters`, `metrics`, and `states` entries remain as compatibility aliases for consumers outside this change; no unrelated locale lookup is removed.

Alternative considered: replace the nested dictionaries and update every possible consumer at once. Rejected because the supplied table defines the new contract but does not authorize breaking legacy lookups outside the Report screen.

### Preserve the deployed sources object

The response model represents `sources` as a named object rather than an array. The same type is reused for top-level `sources` and `businessBreakdown[].sources`. The repository returns these values unchanged; the component does not infer direct-payment or self-reported totals from other summary fields.

### Isolate request states in the report panel

The existing filter controls remain usable while the report query changes. Pending state replaces the metric content with a localized loading treatment; error state supplies a localized retry button that invokes the query's refetch operation. Previous preview data is removed so it cannot be mistaken for real income.

### Isolate financial cache entries by authenticated staff

The query key includes the authenticated session ID before the complete report parameter object. The query remains disabled until a Staff session identity exists. This prevents a later Staff login in the same browser from observing another Staff member's cached income while still allowing normal caching within one session.

## Risks / Trade-offs

- **[Published Swagger does not yet contain the endpoint]** → Treat the approved requirement as the contract, use complete boundary fixtures, and record live API verification as pending rather than claiming it passed.
- **[Backend response field nullability may differ when Swagger is published]** → Keep POS fields nullable and avoid frontend coercion; revisit DTO types during live verification.
- **[The reserved `salon=independent` value could theoretically match a business ID]** → Resolve active business IDs before the reserved value and keep API scope construction explicit.
- **[Current UI does not expose breakdown sections]** → Preserve them in the response model so a later, separately designed detail view does not require a transport rewrite.
- **[Authenticated staging payload not available in this session]** → Verify route reachability at the auth boundary, keep live `200` verification pending, and do not infer payload correctness from `401`.

## Migration Plan

1. Ship the new read-only data boundary and tests.
2. Switch the existing Report screen from preview values to the query hook.
3. Verify against the live API once the endpoint is published and authenticated test data is available.
4. Roll back by reverting the screen integration and data-boundary files; no persisted frontend data or backend mutation is introduced.

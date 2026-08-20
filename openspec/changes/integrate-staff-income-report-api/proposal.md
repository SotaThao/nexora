## Why

The staff Report screen currently renders hard-coded preview metrics, so signed-in staff cannot see their actual income activity. The backend now exposes a self-scoped income report endpoint that can supply real totals for all income sources, one linked business, or independent work across daily, weekly, monthly, and yearly periods.

## What Changes

- Add a typed frontend data boundary for `GET /api/v1/staff/reports/income` with explicit report scope and period parameters.
- Replace the Report screen's preview values with the API `summary`, including nullable POS metrics and `totalHours`.
- Extend the source filter with Independent income while preserving the existing all-salons and per-salon behavior.
- Map the existing date, week, month, and year controls to the backend query contract without sending a frontend timezone.
- Add localized loading, error, retry, and unavailable-value presentation.
- Isolate cached income by authenticated staff identity and validate ISO week choices.
- Present scope-specific metrics: All uses Income, Pay, Tip, Other Income, Paid Amount; Business uses Turns, Hours, Service, Pay, Commission, Comm %, Tip, Tech Takes; Independent uses Income, Direct Payments, Self-Reported Income.
- Model the deployed `sources` response as an object and use its independent-income totals without recomputing them in the frontend.
- Use the approved English/Vietnamese metric terminology consistently across all source scopes.
- Add the approved flat 48-key English/Vietnamese report dictionary and migrate visible report labels to that canonical contract while retaining nested aliases for compatibility.
- Add targeted repository, hook, and component coverage for query construction and the user-visible report states.

## Capabilities

### New Capabilities

- `staff-income-reporting`: Staff can view their own summarized income report by source scope and reporting period using the authenticated staff income API.

### Modified Capabilities

<!-- No existing capability requirements change. -->

## Impact

- **API**: `GET /api/v1/staff/reports/income`; no request body and no frontend timezone parameter.
- **Data boundary**: new constants, repository and TanStack Query hook; a new query-key factory in `src/data/queryKeys.ts`.
- **UI**: `src/components/staff-dashboard/views/StaffSalonReport.tsx` and its EN/VI locale entries.
- **Tests/docs**: US-045, a feature test plan and walkthrough, repository/hook/component tests, and this OpenSpec change.
- **Environment**: development API base URL targets staging per the explicit integration request.
- **Dependencies**: no new runtime dependency.

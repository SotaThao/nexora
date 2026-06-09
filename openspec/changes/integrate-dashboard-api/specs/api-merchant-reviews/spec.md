## ADDED Requirements

### Requirement: Reviews Inbox List
The merchant Reviews view SHALL fetch the reviews / private-feedback list from `GET /api/v1/merchant/dashboard/reviews` via `reviewsRepository.list(filters)` and the `useDashboardReviews(filters)` hook, keyed by `qk.dashboardReviews(filters)`.

Each review item SHALL carry at least: id, rating, routing type (Public / Private / Skipped), reviewer-provided text (if any), associated staff (if any), resolution state, and timestamp.

#### Scenario: Reviews list loads
- **WHEN** the merchant opens the Reviews view
- **THEN** `useDashboardReviews()` SHALL call `GET /api/v1/merchant/dashboard/reviews` and render the returned reviews, distinguishing public reviews (4–5★) from private feedback (1–3★)

#### Scenario: Empty reviews
- **WHEN** the endpoint returns an empty list
- **THEN** the view SHALL render a "no reviews yet" empty state

#### Scenario: Reviews fetch error
- **WHEN** the reviews endpoint returns a non-2xx ProblemDetails response
- **THEN** the hook SHALL expose the error and the view SHALL render a retry affordance without crashing

### Requirement: Reviews Filtering
The Reviews view SHALL support filtering by rating bucket (public vs private), source, and resolution state. The active filter SHALL be encoded in the query key `qk.dashboardReviews(filters)` so each filter combination is cached independently.

#### Scenario: Filter to unresolved private feedback
- **WHEN** the merchant selects the "unresolved private feedback" filter
- **THEN** the hook SHALL request that subset (server-side query params when supported, otherwise client-side filtering) under a distinct cache key and render only matching items

#### Scenario: Switching filters reuses cache
- **WHEN** the merchant switches back to a previously selected filter
- **THEN** the previously cached result SHALL be served immediately (subject to staleness) without a duplicate fetch

### Requirement: Resolve Private Feedback
The merchant SHALL be able to mark a private feedback item resolved via `PUT /api/v1/merchant/dashboard/reviews/{id}/resolve` through `reviewsRepository.resolve(id, dto)` and the `useResolveReview()` mutation hook.

#### Scenario: Successful resolve
- **WHEN** `useResolveReview()` is invoked for an unresolved review id
- **THEN** the hook SHALL call `PUT /api/v1/merchant/dashboard/reviews/{id}/resolve`, and on `200 OK` SHALL invalidate `qk.dashboardReviews()` (all filters) so the item reflects its resolved state

#### Scenario: Resolve not found
- **WHEN** the resolve endpoint returns 404 (`COMMON_NOT_FOUND` / review not found)
- **THEN** the hook SHALL reject with the error and the UI SHALL surface a message; the list SHALL be refetched to reconcile state

#### Scenario: Resolve forbidden
- **WHEN** the resolve endpoint returns 403 (`COMMON_FORBIDDEN`)
- **THEN** the hook SHALL reject and the UI SHALL display a permission message

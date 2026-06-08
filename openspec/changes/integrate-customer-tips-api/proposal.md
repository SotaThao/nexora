## Why

The customer-facing tipping flow is still largely simulation-driven in the frontend. The live API and the v2 integration guide now expose public endpoints for:

- loading a customer touch page,
- creating and confirming a single-staff tip,
- recording skipped tips,
- creating reviews and tracking external review clicks,
- listing public business payment methods,
- creating and confirming multi-staff tips.

The frontend should replace local/mock transaction/review/notification writes in the customer flow with API-backed mutations while preserving the existing data boundary:

```text
components -> data hooks -> repositories -> httpClient
```

## What Changes

- Add public customer-touch repository and hooks for `PublicTouch`, `PublicBusinesses`, and `PublicTips` endpoints.
- Add query-param serialization to `httpClient`, because customer endpoints require `sessionId`, `staffId`, `method`, and `amount` query params.
- Support public route `/touch/{businessSlug}/{touchPointSlug}` in addition to the existing `?flow=customer` simulation entry.
- Load touch page data from `GET /api/v1/touch/{businessSlug}/{touchPointSlug}?sessionId={uuid}`.
- Replace simulated customer transaction/review writes with:
  - `POST /api/v1/touch/tip`
  - `POST /api/v1/touch/tip/{tipId}/confirm`
  - `POST /api/v1/touch/tip/skip`
  - `POST /api/v1/touch/review`
  - `POST /api/v1/touch/review/{reviewId}/track-google`
  - `POST /api/v1/touch/review/{reviewId}/track-yelp`
- Add multi-staff integration against:
  - `GET /api/v1/public/businesses/{businessId}/payment-methods`
  - `GET /api/v1/public/businesses/{businessId}/payment-methods/{id}`
  - `POST /api/v1/tips/multi-staff`
  - `PATCH /api/v1/tips/{id}/confirm`

## Capabilities

### New Capabilities

- `api-merchant-business`: documents the Merchant-auth business source of truth and why it cannot be used by anonymous customer QR flows.
- `api-public-businesses`: guest-visible business payment method endpoints used by multi-staff tips.
- `api-customer-touch`: guest-visible touch page, single-staff tip, skip-tip, review, and review click tracking.
- `api-public-tips`: guest-visible multi-staff tip creation and confirmation.

### Modified Capabilities

- `api-http-client`: adds first-class query-param serialization.
- `customer-tipping-review`: replaces local transaction/review/notification persistence with API-backed customer-tip mutations.

## Impact

- **Files likely new**:
  - `src/data/repositories/publicTouch.js`
  - `src/data/hooks/usePublicTouch.js`

- **Files likely modified**:
  - `src/lib/httpClient.js`
  - `src/data/queryKeys.js`
  - `src/App.jsx`
  - `src/app/AppRouter.jsx`
  - `src/components/CustomerFlow.jsx`
  - `src/components/customer-flow/hooks/useCustomerFlow.js`
  - customer-flow step components under `src/components/customer-flow/steps/`

- **API dependency**:
  - Dev backend at `https://nexora-dev-api.vlinkhub.com`
  - Public touch page data must be available for QR slugs.

- **Backend contract gap**:
  - `businessId` is required for multi-staff tips but is not currently returned by `TouchPageDataDto.business`.

## Non-Goals

- No TypeScript migration.
- No payment processor verification; customers still self-confirm "I paid".
- No merchant dashboard analytics integration in this change; that is covered by `integrate-dashboard-api`.
- No staff payment method management work in this change; this change only consumes public method availability.


# Customer Tips API Integration Report

Date: 2026-06-07

## Scope

This report consolidates the Customer Touch / Customer Tips API integration findings from:

- `C:\Users\AD\Downloads\Telegram Desktop\02. api-integration-guide-v2.pdf`
- `C:\Users\AD\Documents\GitHub\vlink-nexora-fe\API\nexora-touch-end-user-ai-coding-spec.md`
- `C:\Users\AD\Documents\GitHub\vlink-nexora-fe\spec.json`
- Swagger UI: `https://nexora-dev-api.vlinkhub.com/api/`

Goal: define the correct frontend integration plan for Customer tips, single-staff tips, multi-staff tips, skip-tip review, review routing, and the `businessId` dependency.

## Executive Summary

The API contract is mostly complete for the customer-facing flow:

- Single-staff tips can be integrated now.
- Skip-tip + review-only can be integrated now.
- Review submit and Google/Yelp click tracking can be integrated now.
- Multi-staff tips are blocked unless the frontend can obtain `businessId` in the anonymous QR flow.

The key gap is that `businessId` is required by:

```http
GET /api/v1/public/businesses/{businessId}/payment-methods
POST /api/v1/tips/multi-staff
```

But the anonymous touch-page endpoint currently returns only:

```json
{
  "business": {
    "name": "Bitcoin Nail Bar",
    "logoUrl": "https://...",
    "description": "Premium nail salon..."
  }
}
```

The only confirmed endpoint returning `business.id` is:

```http
GET /api/v1/merchant/business
```

That endpoint requires Merchant authentication, so it cannot be used by the customer QR flow.

## Recommendation

Backend should add `business.id` to `TouchPageDataDto.business`.

Recommended public DTO:

```json
{
  "business": {
    "id": "guid",
    "slug": "bitcoin-nail-bar",
    "name": "Bitcoin Nail Bar",
    "logoUrl": "https://...",
    "description": "Premium nail salon...",
    "googleReviewUrl": "https://...",
    "yelpUrl": "https://...",
    "facebookUrl": "https://...",
    "feedbackEmail": "owner@example.com"
  },
  "touchPoint": {
    "id": "guid",
    "name": "Table 1",
    "type": "Table",
    "assignedStaffProfileId": null
  },
  "staff": []
}
```

If backend does not want to expose `business.id`, one of these alternatives is required:

1. Add a slug-based public endpoint:

   ```http
   GET /api/v1/public/businesses/by-slug/{businessSlug}/payment-methods
   ```

2. Remove `businessId` from `POST /api/v1/tips/multi-staff` and infer the business from `touchPointId`.

3. Add `businessPaymentMethods` directly to `GET /api/v1/touch/{businessSlug}/{touchPointSlug}` for the multi-staff flow.

Preferred option: add `business.id` to `TouchPageDataDto.business`. The touch-page endpoint already resolves business by `businessSlug` + `touchPointSlug`, so this is the smallest and cleanest contract change.

## Endpoint Matrix

### Merchant Business

Authenticated Merchant endpoints:

| Method | Path | Auth | Frontend usage |
|---|---|---|---|
| `POST` | `/api/v1/merchant/business` | Merchant | Onboarding business creation |
| `GET` | `/api/v1/merchant/business` | Merchant | Business settings/profile; returns `id`, review links |
| `GET` | `/api/v1/merchant/business/check-slug` | Merchant | Slug availability |
| `PUT` | `/api/v1/merchant/business/review-links` | Merchant | Configure Google/Yelp/Facebook/private feedback email |
| `PUT` | `/api/v1/merchant/business/logo` | Merchant | Logo upload |
| `POST` | `/api/v1/merchant/business/complete-onboarding` | Merchant | Complete onboarding |

Important: `GET /api/v1/merchant/business` returns `BusinessDto.id`, but cannot be called from the anonymous customer QR flow.

### Public Touch

Anonymous endpoints:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/touch/{businessSlug}/{touchPointSlug}?sessionId={uuid}` | Load public touch page |
| `GET` | `/api/v1/touch/payment-link?staffId={id}&method={method}&amount={amount}` | Get deep link/copy info for single-staff payment |
| `POST` | `/api/v1/touch/tip` | Create single-staff initiated tip |
| `POST` | `/api/v1/touch/tip/{tipId}/confirm` | Confirm single-staff tip |
| `POST` | `/api/v1/touch/tip/skip` | Record skipped tip |
| `POST` | `/api/v1/touch/review` | Submit customer review |
| `POST` | `/api/v1/touch/review/{reviewId}/track-google` | Track Google review click |
| `POST` | `/api/v1/touch/review/{reviewId}/track-yelp` | Track Yelp review click |

### Public Multi-Staff Tips

Anonymous endpoints:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/public/businesses/{businessId}/payment-methods` | List active business payment methods for guests |
| `GET` | `/api/v1/public/businesses/{businessId}/payment-methods/{id}` | Get one active business payment method detail |
| `POST` | `/api/v1/tips/multi-staff` | Create initiated multi-staff tip |
| `PATCH` | `/api/v1/tips/{id}/confirm` | Confirm multi-staff tip |

## Confirmed DTOs

### TouchPageDataDto

Swagger currently exposes:

```json
{
  "business": {
    "name": "string",
    "logoUrl": "string | null",
    "description": "string | null"
  },
  "touchPoint": {
    "id": "guid",
    "name": "string",
    "type": "string",
    "assignedStaffProfileId": "guid | null"
  },
  "staff": [
    {
      "id": "guid",
      "displayName": "string",
      "photoUrl": "string | null",
      "position": "string | null",
      "bio": "string | null",
      "availablePaymentMethods": ["CashApp", "Venmo"]
    }
  ]
}
```

Privacy rule: `availablePaymentMethods` must list method names only. Raw staff `accountInfo` must not be exposed on this endpoint.

### PaymentRedirectDto

```json
{
  "redirectUrl": "string | null",
  "zellePhone": "string | null",
  "zelleEmail": "string | null",
  "appleCashPhone": "string | null"
}
```

### CreateTipCommand

```json
{
  "touchPointId": "guid",
  "staffProfileId": "guid | null",
  "amount": 20.0,
  "paymentMethod": "CashApp",
  "sessionId": "uuid"
}
```

### CreateMultiStaffTipCommand

```json
{
  "businessId": "guid",
  "touchPointId": "guid",
  "businessPaymentMethodId": "guid",
  "tipItems": [
    { "staffProfileId": "guid-linh", "amount": 15.0 },
    { "staffProfileId": "guid-maria", "amount": 10.0 }
  ]
}
```

### CreateReviewCommand

```json
{
  "touchPointId": "guid",
  "tipId": "guid | null",
  "staffProfileId": "guid | null",
  "rating": 5,
  "comment": "Great service",
  "customerEmail": "optional@example.com",
  "customerName": "Optional Name"
}
```

## Swagger vs PDF Differences

### PaymentMethod enum format

PDF says `PaymentMethod` is an integer enum:

| Value | Name |
|---:|---|
| `0` | `CashApp` |
| `1` | `Venmo` |
| `2` | `Zelle` |
| `3` | `PayPal` |
| `4` | `Other` |
| `5` | `AppleCash` |

Swagger `spec.json` exposes `PaymentMethod` as a string enum:

```json
["CashApp", "Venmo", "Zelle", "PayPal", "Other", "AppleCash"]
```

Implementation recommendation: centralize this mapping in `publicTouchRepository`. Prefer Swagger string values unless backend explicitly confirms that runtime expects integer enum values.

### Touch page business payload

PDF and Swagger agree that public `TouchPageBusinessDto` currently has only:

```json
{ "name": "...", "logoUrl": "...", "description": "..." }
```

This is insufficient for multi-staff tips because `businessId` is required later.

### Public business payment method detail endpoint

Swagger confirms both endpoints:

```http
GET /api/v1/public/businesses/{businessId}/payment-methods
GET /api/v1/public/businesses/{businessId}/payment-methods/{id}
```

The second endpoint should be added to the OpenSpec change even if the UI only needs the list initially.

## Frontend Architecture Plan

Follow the existing repo boundary:

```text
components -> data hooks -> repositories -> httpClient
```

Recommended files:

```text
src/data/repositories/publicTouch.js
src/data/hooks/usePublicTouch.js
src/data/queryKeys.js
src/lib/httpClient.js
src/components/CustomerFlow.jsx
src/components/customer-flow/hooks/useCustomerFlow.js
```

`src/lib/httpClient.js` must support query params because existing repository calls use `{ params }`, and Customer Touch needs query strings for `sessionId`, `staffId`, `method`, and `amount`.

## Implementation Flow

### Single-staff tip

1. Generate or reuse `sessionId`.
2. Load touch page:

   ```http
   GET /api/v1/touch/{businessSlug}/{touchPointSlug}?sessionId={uuid}
   ```

3. Customer selects one staff member and amount.
4. Customer chooses payment method.
5. Call payment link:

   ```http
   GET /api/v1/touch/payment-link?staffId={staffProfileId}&method={PaymentMethod}&amount={amount}
   ```

6. Create tip:

   ```http
   POST /api/v1/touch/tip
   ```

7. Show redirect/copy payment instruction.
8. Customer taps "Yes, I paid".
9. Confirm tip:

   ```http
   POST /api/v1/touch/tip/{tipId}/confirm
   ```

10. Submit review:

   ```http
   POST /api/v1/touch/review
   ```

### Multi-staff tip

1. Load touch page.
2. Customer selects at least two distinct staff members.
3. Frontend needs `business.id`.
4. Load public business payment methods:

   ```http
   GET /api/v1/public/businesses/{businessId}/payment-methods
   ```

5. Create multi-staff tip:

   ```http
   POST /api/v1/tips/multi-staff
   ```

6. Show business payment instruction using selected public business payment method.
7. Customer taps "Yes, I paid".
8. Confirm multi-staff tip:

   ```http
   PATCH /api/v1/tips/{tipId}/confirm
   ```

9. Submit review.

### Skip-tip review-only

1. Load touch page.
2. Customer taps "Skip tip".
3. Call:

   ```http
   POST /api/v1/touch/tip/skip
   ```

4. Submit review:

   ```http
   POST /api/v1/touch/review
   ```

## Open Questions for Backend

1. Can backend add `business.id` to `TouchPageDataDto.business`?
2. Should `TouchPageDataDto.business` also include `slug`, `googleReviewUrl`, `yelpUrl`, `facebookUrl`, and `feedbackEmail`?
3. Should frontend send `PaymentMethod` as string enum (`"CashApp"`) or integer enum (`0`) at runtime?
4. Should multi-staff `POST /api/v1/tips/multi-staff` continue requiring `businessId`, or should backend infer it from `touchPointId`?
5. For review routing, where should the public QR flow read Google/Yelp/Facebook/private feedback destinations if they are not included in `TouchPageDataDto`?

## OpenSpec Update

Created OpenSpec change:

```text
openspec/changes/integrate-customer-tips-api/
```

Capabilities included:

- `api-http-client`
- `api-merchant-business`
- `api-public-businesses`
- `api-customer-touch`
- `api-public-tips`
- `customer-tipping-review`


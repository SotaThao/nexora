# Customer Tips API Mock Data Removal - Test Plan and QA Report

Date: 2026-06-07

Scope:
- Remove customer tips mock-data dependency from the production customer flow.
- Keep implementation aligned with `API/customer-tips-api-integration-report.md`, Swagger at `https://nexora-dev-api.vlinkhub.com/api/`, and `openspec/changes/integrate-customer-tips-api`.
- Focus business endpoint dependency on Merchant/Public Business ownership, especially where `businessId` is required.

## Executive Status

Status: Not ready for release.

The API integration structure exists, but current QA found P0 gaps that can still create duplicate tips, hide valid payment methods, or keep production API mode partially dependent on simulation/local mock behavior.

Validated:
- OpenSpec change `integrate-customer-tips-api` passes strict validation.
- Existing merchant/dashboard repository tests pass.
- New repository/hook structure exists for public customer touch and public business payment methods.

Blocking:
- `WalletDetails` still confirms by calling `handlePay(...)`, which can create a second tip in API mode instead of confirming the existing tip.
- `GET /public/touch/{businessSlug}/{touchPointSlug}/payment-link` exists in the repository but is not wired into the customer payment flow.
- Single-staff payment buttons still rely on `staff.paymentAccounts`, while API staff data exposes `availablePaymentMethods`.
- Public business payment method mapping reads `handle/address/value`, but Swagger DTO uses `accountInfo`.
- Existing `httpClient` and `CustomerFlow` tests still assert old mock/demo contracts and fail against the current API contract.

## Current Implementation Inventory

Implemented API-facing modules:
- `src/data/repositories/publicTouch.js`
- `src/data/repositories/publicBusinesses.js`
- `src/data/hooks/usePublicTouch.js`
- `src/data/queryKeys.js`
- `src/components/customer-flow/hooks/useCustomerFlow.js`
- `src/components/CustomerFlow.jsx`
- `src/components/customer-flow/steps/Payment.jsx`
- `src/components/customer-flow/steps/WalletDetails.jsx`
- `src/components/customer-flow/steps/ReviewRouting.jsx`

Remaining mock/simulation surfaces to audit:
- `src/components/customer-flow/hooks/useCustomerFlow.js`
- `src/components/customer-flow/hooks/useSimulationHandlers.js`
- `src/components/dashboard/data/mockData.js`
- `src/components/staff-dashboard/data/staffMockData.js`
- `src/app/mockSso.js`
- `src/contexts/StaffAccountContext.jsx`

## API Contract Notes

Business ownership:
- The customer touch page should obtain `businessId` from backend touch-page data: `touchPageData.business.id`.
- Do not derive `businessId` from client-side mock merchant setup, local profile state, or route slugs.
- Public business methods must be disabled until a real `businessId` is available.
- If backend touch-page data does not return `business.id`, multi-staff/business payment flows must show a blocking UI state instead of calling `/public/businesses/{businessId}/...`.

Payment method ownership:
- Single-staff payment methods should come from `StaffForTipDto.availablePaymentMethods`.
- Business-level payment methods should come from `GET /public/businesses/{businessId}/payment-methods`.
- `PublicPaymentMethodDto.accountInfo` is the display/account field, not `handle`, `address`, or `value`.

Tip lifecycle:
- Create tip with `POST /public/touch/{businessSlug}/{touchPointSlug}/tips`.
- Get payment redirect/detail with `GET /public/touch/{businessSlug}/{touchPointSlug}/payment-link`.
- Confirm external payment with `POST /public/touch/{businessSlug}/{touchPointSlug}/tips/{tipId}/confirm`.
- Skip tip with `POST /public/touch/{businessSlug}/{touchPointSlug}/tips/skip`.

## Findings

### P0 - Duplicate Tip Risk in Wallet Confirmation

File: `src/components/customer-flow/steps/WalletDetails.jsx`

`WalletDetails` does not accept or call `handleConfirmTip`. Its confirmation button calls `handlePay(selectedWalletObj.name)`, which is the create-tip path. In API mode, this can create another tip instead of confirming the existing tip.

Expected:
- API mode: button calls `handleConfirmTip()`.
- Simulation/demo mode: button can keep existing local simulation behavior.

Required tests:
- L1 verifies the wallet confirmation button calls confirm mutation once.
- L2 verifies confirm mutation endpoint path includes `tips/{tipId}/confirm`.

### P0 - Payment Link Endpoint Is Not Used

File: `src/components/customer-flow/hooks/useCustomerFlow.js`

Repository has `getPaymentLink`, but `handlePay` creates a tip and moves to `wallet_details` without calling the payment-link endpoint.

Expected:
- After create tip, use backend payment redirect/detail response from `GET /payment-link`.
- Wallet details should render backend-provided account/payment data, not inferred mock account fields.

Required tests:
- L2 repository test for `getPaymentLink`.
- L1 CustomerFlow API test for create tip -> payment link -> wallet details.

### P0 - API Staff Payment Methods Can Be Hidden

Files:
- `src/components/customer-flow/hooks/useCustomerFlow.js`
- `src/components/customer-flow/steps/Payment.jsx`

API mode uses `availablePaymentMethods`, but UI filtering checks `staff.paymentAccounts`. Valid API payment methods can be hidden for single-staff tips.

Expected:
- Payment buttons use `availablePaymentMethods` in API mode.
- UI should not depend on local mock `paymentAccounts` for API staff.

Required tests:
- L1 renders payment buttons from `availablePaymentMethods`.
- L1 asserts no local staff mock data is needed for API route.

### P0 - Business Payment Account Mapping Uses Wrong Fields

File: `src/components/customer-flow/hooks/useCustomerFlow.js`

Business payment methods are mapped from `pm.handle || pm.address || pm.value`, but Swagger DTO uses `accountInfo`.

Expected:
- Map `accountInfo` as the primary account display/detail field.

Required tests:
- L2 repository/hook fixture verifies `accountInfo` reaches UI payment account state.

### P1 - Tests Still Assert Old Mock Contracts

Files:
- `tests/unit/httpClient.test.js`
- `tests/unit/CustomerFlow.test.jsx`

Current targeted tests fail because they still expect old URL/error/mock behavior:
- `httpClient` tests expect relative `/api/test` and `credentials: include`.
- Current HTTP client uses API base URL and a newer error shape.
- Error mocks omit `headers.get`, which currently causes TypeError in error tests.
- `CustomerFlow` test expects local seed staff `Mia Tran`, but current flow does not load that mock staff list in the tested state.

Expected:
- Update tests to current API contract.
- Add API-mode CustomerFlow tests instead of relying on demo seed names.

## Test Plan

### L1 - Test UI

| ID | Priority | Target | Scenario | Expected |
| --- | --- | --- | --- | --- |
| L1-P0-01 | P0 | `CustomerFlow` | `/touch/:businessSlug/:touchPointSlug` loading/success/error | UI renders API route states without mock merchant setup dependency |
| L1-P0-02 | P0 | `CustomerFlow` | Touch page returns API staff list | Staff cards render from `TouchPageDataDto.staff` only |
| L1-P0-03 | P0 | `Payment` | Single staff has `availablePaymentMethods` | Payment buttons render from API method list |
| L1-P0-04 | P0 | `WalletDetails` | API mode confirm click | Calls confirm handler, does not call create-tip handler again |
| L1-P0-05 | P0 | `CustomerFlow` | API mode completes tip/review/skip | No local transactions/reviews/notifications are written |
| L1-P1-01 | P1 | `Payment` | Multi-staff selected but no `businessId` | Shows blocking/disabled state, no public business request |
| L1-P1-02 | P1 | `ReviewRouting` | External review URLs absent | External review buttons are hidden or disabled cleanly |
| L1-P2-01 | P2 | Demo flow | Non-API/demo route | Simulation handlers work only in explicitly demo/local mode |

Suggested files:
- `tests/unit/CustomerFlow.api.test.jsx`
- `tests/unit/Payment.api.test.jsx`
- `tests/unit/WalletDetails.api.test.jsx`

### L2 - Test Call API

| ID | Priority | Target | Scenario | Expected |
| --- | --- | --- | --- | --- |
| L2-P0-01 | P0 | `httpClient` | Query params | Serializes `params`, strips internal config, sends expected URL |
| L2-P0-02 | P0 | `httpClient` | Error response with/without headers | Returns stable `{ status, errorCode, errors, retryAfter }` |
| L2-P0-03 | P0 | `publicTouchRepository` | get page, create tip, payment link, confirm, skip, review, track | Paths and payloads match Swagger |
| L2-P0-04 | P0 | `publicBusinessesRepository` | payment methods, multi-staff create/confirm | Paths require `businessId`; missing ID throws before network |
| L2-P0-05 | P0 | `usePublicTouch` | mutations and invalidation | Uses query keys from `src/data/queryKeys.js`; invalidates customer touch after confirm |
| L2-P1-01 | P1 | method mapping | UI method labels -> Swagger enums | Mapping sends backend string enum, not UI display label |
| L2-P1-02 | P1 | business methods | `accountInfo` mapping | `accountInfo` reaches customer payment UI |

Suggested files:
- `src/data/repositories/__tests__/publicTouch.test.js`
- `src/data/repositories/__tests__/publicBusinesses.test.js`
- `tests/unit/usePublicTouch.test.jsx`
- Update `tests/unit/httpClient.test.js`

### L3 - Test Flow

| ID | Priority | Target | Scenario | Expected |
| --- | --- | --- | --- | --- |
| L3-P0-01 | P0 | Customer touch E2E | Single-staff tip happy path | Load touch page, select staff, create tip, get payment link, confirm tip |
| L3-P0-02 | P0 | Customer touch E2E | Skip tip then review | Calls skip endpoint and review endpoint once |
| L3-P1-01 | P1 | Customer touch E2E | Multi-staff without businessId | Flow blocks safely and explains unavailable payment setup |
| L3-P1-02 | P1 | Customer touch E2E | Multi-staff with businessId | Creates and confirms multi-staff tip via public business endpoints |
| L3-P2-01 | P2 | Error handling | 404/rate limit/backend error | Shows stable error state, no local fallback writes |

Suggested file:
- `tests/e2e/customerTouchApi.test.js`

## Commands Run

```powershell
cmd /c pnpm test:impact
cmd /c pnpm vitest run tests/unit/CustomerFlow.test.jsx tests/unit/httpClient.test.js
cmd /c pnpm vitest run src/data/repositories/__tests__/merchants.test.js src/data/repositories/__tests__/dashboard.test.js
cmd /c npx openspec validate integrate-customer-tips-api --strict
```

Results:
- `pnpm test:impact`: completed impact analysis and identified affected UI/API test targets.
- `CustomerFlow.test.jsx` + `httpClient.test.js`: failed, 8 failed / 6 passed.
- `merchants.test.js` + `dashboard.test.js`: passed, 19 passed.
- `openspec validate --strict`: passed.

## Acceptance Gates

Release can proceed only when:
- P0 and P1 tests in this plan pass.
- `WalletDetails` confirms API tips through `confirmTip`, not `createTip`.
- `payment-link` endpoint is called in the payment flow.
- Single-staff API payment methods use `availablePaymentMethods`.
- Business payment display uses `PublicPaymentMethodDto.accountInfo`.
- API mode has no dependency on dashboard/staff mock data or simulation handlers.
- `httpClient` tests are updated to the documented API base URL, params, anonymous calls, and error shape.
- `CustomerFlow` tests use API fixtures instead of local seed staff.
- `cmd /c pnpm build` passes.
- `cmd /c npx openspec validate integrate-customer-tips-api --strict` passes.

## Recommended Execution Order

1. Fix P0 API flow wiring: payment methods, payment link, wallet confirmation.
2. Remove or gate mock/simulation writes from API mode.
3. Add L2 repository tests for `publicTouch` and `publicBusinesses`.
4. Update `httpClient` tests to current documented contract.
5. Add L1 CustomerFlow API tests with API fixtures.
6. Add L3 happy-path E2E after unit/API boundary tests are stable.
7. Re-run build, targeted tests, and OpenSpec validation.

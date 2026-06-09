## 1. HTTP Client

- [x] 1.1 Add query-param serialization support to `src/lib/httpClient.js` for `params` options
- [x] 1.2 Ensure `anonymous: true` still skips Bearer token injection for public requests
- [x] 1.3 Preserve FormData behavior and existing JSON methods
- [ ] 1.4 Add Vitest coverage for query serialization, arrays/null omission, and anonymous public requests

## 2. Query Keys

- [x] 2.1 Add `customerTouch(slugs, sessionId)` to `src/data/queryKeys.js`
- [x] 2.2 Add `publicBusinessPaymentMethods(businessId)` to `src/data/queryKeys.js`
- [x] 2.3 Add any mutation invalidation helpers only where a read query needs refresh

## 3. Public Touch Repository

- [x] 3.1 Create `src/data/repositories/publicTouch.js`
- [x] 3.2 Implement `getTouchPage({ businessSlug, touchPointSlug, sessionId })`
- [x] 3.3 Implement `getPaymentLink({ staffId, method, amount })`
- [x] 3.4 Implement `createTip({ touchPointId, staffProfileId, amount, paymentMethod, sessionId })`
- [x] 3.5 Implement `confirmTip(tipId)`
- [x] 3.6 Implement `skipTip({ touchPointId, staffProfileId, sessionId })`
- [x] 3.7 Implement `createReview({ touchPointId, tipId, staffProfileId, rating, comment, customerEmail, customerName })`
- [x] 3.8 Implement `trackGoogle(reviewId)` and `trackYelp(reviewId)`
- [x] 3.9 Keep `PaymentMethod` wire-format mapping centralized in this repository

## 4. Public Businesses / Public Tips Repository Methods

- [x] 4.1 Implement `getPublicBusinessPaymentMethods(businessId)`
- [x] 4.2 Implement `getPublicBusinessPaymentMethodDetail(businessId, id)`
- [x] 4.3 Implement `createMultiStaffTip({ businessId, touchPointId, businessPaymentMethodId, tipItems })`
- [x] 4.4 Implement `confirmMultiStaffTip(tipId)`
- [x] 4.5 Return clear errors when `businessId` is unavailable in the public touch payload

## 5. Public Touch Hooks

- [x] 5.1 Create `src/data/hooks/usePublicTouch.js`
- [x] 5.2 Add `useCustomerTouchPage({ businessSlug, touchPointSlug, sessionId })`
- [x] 5.3 Add mutations for create/confirm/skip single-staff tips
- [x] 5.4 Add mutations for review submit and Google/Yelp click tracking
- [x] 5.5 Add `usePublicBusinessPaymentMethods(businessId)` with `enabled: !!businessId`
- [x] 5.6 Add mutations for create/confirm multi-staff tips

## 6. Routing

- [x] 6.1 Detect `/touch/{businessSlug}/{touchPointSlug}` in `src/App.jsx`
- [x] 6.2 Preserve `?flow=customer` as a demo/simulation fallback if still needed
- [x] 6.3 Pass `businessSlug`, `touchPointSlug`, and `sessionId` into `CustomerFlow`
- [x] 6.4 Generate a UUID session id client-side if the URL does not provide one

## 7. Customer Flow Wiring

- [x] 7.1 Replace merchant setup-derived staff list with `TouchPageDataDto.staff`
- [x] 7.2 Normalize staff shape for existing customer-flow steps
- [x] 7.3 Render loading, 404/unavailable, empty staff, and rate-limit states
- [x] 7.4 Validate tip amount min `$1.00`, max `$500.00`
- [x] 7.5 Validate multi-staff requires at least two distinct staff and total <= `$500.00`
- [x] 7.6 Replace local transaction/review/notification writes in `useCustomerFlow`
- [x] 7.7 Use `PaymentRedirectDto` to show redirect/copy payment instruction
- [x] 7.8 Confirm the correct endpoint based on single-staff vs multi-staff tip
- [x] 7.9 Submit review after tip confirmation, skipped tip, or review-only flow
- [x] 7.10 Show external review buttons only when public review links are available

## 8. Multi-Staff Business ID Gate

- [x] 8.1 If `touchPage.business.id` is absent, disable or hide multi-staff payment method selection
- [x] 8.2 Show an explicit "multi-staff tips unavailable" empty state instead of silently failing
- [ ] 8.3 Remove the gate once backend exposes `business.id` or a public equivalent

## 9. Tests

- [x] 9.1 Repository tests for every public endpoint path, method, query, and payload (33 tests)
- [x] 9.2 Hook tests for query keys and mutation calls (13 tests)
- [x] 9.3 Component tests for loading touch page, single-staff tip, skip-tip review, and unavailable multi-staff state (12 tests)
- [x] 9.4 Add regression tests for `PaymentMethod` mapping (included in 9.1)

## 10. Verification

- [x] 10.1 Run `pnpm test` (84/84 pass)
- [x] 10.2 Run `pnpm build` (success, 0 errors)
- [ ] 10.3 Run `pnpm lint:tokens`
- [ ] 10.4 Run `npx openspec validate integrate-customer-tips-api --strict`
- [ ] 10.5 Live smoke: open `/touch/{businessSlug}/{touchPointSlug}` and complete a single-staff tip flow
- [ ] 10.6 Live smoke: skip tip and submit review
- [ ] 10.7 Live smoke: verify multi-staff gate until `businessId` is available

## 11. QA Findings / Mock Removal Follow-up

- [ ] 11.1 Fix API-mode wallet confirmation so `WalletDetails` calls `confirmTip` instead of creating another tip
- [ ] 11.2 Wire `GET /public/touch/{businessSlug}/{touchPointSlug}/payment-link` into the payment flow
- [ ] 11.3 Render single-staff payment buttons from `StaffForTipDto.availablePaymentMethods` in API mode
- [ ] 11.4 Map public business payment methods from `PublicPaymentMethodDto.accountInfo`
- [ ] 11.5 Gate simulation/local transaction, review, and notification writes out of API mode
- [ ] 11.6 Add repository tests for `publicTouchRepository` and `publicBusinessesRepository`
- [ ] 11.7 Update `httpClient` tests to current API base URL, params, anonymous calls, and error shape
- [ ] 11.8 Update `CustomerFlow` tests to API fixtures instead of local mock seed staff

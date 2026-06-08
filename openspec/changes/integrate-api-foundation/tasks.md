## 1. Config & Environment

- [ ] 1.1 Update `.env.example`: document `VITE_API_BASE_URL=https://nexora-dev-api.vlinkhub.com` and clarify `VITE_DATA_SOURCE=api` usage
- [ ] 1.2 Verify `VITE_DATA_SOURCE` env switch is read correctly in Vite build (check `import.meta.env.VITE_DATA_SOURCE` in `src/data/adapters/index.js` and `src/auth/adapters/index.js`)

## 2. Token Store

- [ ] 2.1 Create `src/auth/tokenStore.js` with `get()`, `set({ accessToken, refreshToken })`, `clear()`, and `subscribe(fn)` API
- [ ] 2.2 Persist tokens to localStorage via `storage.js` under key `nexora_auth_tokens`
- [ ] 2.3 Implement subscriber list in `tokenStore`: `subscribe` returns an unsubscribe function; `clear` calls all registered subscribers
- [ ] 2.4 Write Vitest unit tests for `tokenStore`: persist/restore, clear, subscriber called on clear, unsubscribe removes listener

## 3. HTTP Client Upgrades

- [ ] 3.1 Rewrite `buildError` in `src/lib/httpClient.js` to parse RFC-9110 ProblemDetails: read `errorCode`, `errors{}`, `retryAfter` from the response body
- [ ] 3.2 Add `upload(path, formData, method?)` helper to `httpClient` that sends FormData without setting `Content-Type` (lets browser set multipart boundary); `method` defaults to `'POST'` but accepts `'PUT'` (required for logo upload at `PUT /api/v1/merchant/business/logo`)
- [ ] 3.3 Add Bearer token request interceptor: inject `Authorization: Bearer <accessToken>` from `tokenStore.get()` for all requests that don't pass `anonymous: true`
- [ ] 3.4 Remove forced `credentials: 'include'` from the default request init (Bearer-based, not cookie-based); make it opt-in via options
- [ ] 3.5 Implement single-flight 401 → refresh → retry interceptor using a module-level `refreshPromise` sentinel; on refresh failure call `tokenStore.clear()` and emit a logout event
- [ ] 3.6 Guard Bearer interceptor registration behind `VITE_DATA_SOURCE=api` check so storage mode code paths are unaffected
- [ ] 3.7 Write Vitest unit tests for `httpClient`: ProblemDetails parsing, Bearer injection, FormData upload, upload with `'PUT'` method, single-flight 401 refresh, NETWORK_ERROR normalization (mock `fetch`)
- [ ] 3.8 Normalize the NETWORK_ERROR catch branch: when `fetch` throws a network exception, reject with `{ status: 0, errorCode: "NETWORK_ERROR", errors: {}, retryAfter: null }` (same shape as HTTP errors)

## 4. Error Code Mapping

- [ ] 4.1 Create `src/data/errorCodes.js` mapping `errorCode` strings → i18n key names for all error codes in scope:
  - Auth: `USER_LOGIN_INVALID_USERNAME_OR_PASSWORD`, `USER_ACCOUNT_INACTIVE`, `USER_EMAIL_ALREADY_EXISTS`, `AUTH_PASSWORDS_DO_NOT_MATCH`, `USER_FEATURE_SIGNUP_DISABLED`, `USER_INVALID_EMAIL_VERIFICATION_TOKEN`, `USER_EMAIL_VERIFICATION_TOKEN_EXPIRED`, `USER_EMAIL_ALREADY_VERIFIED`, `USER_NOT_FOUND`, `USER_PASSWORD_RESET_TOKEN_EXPIRED`, `USER_INVALID_REFRESH_TOKEN`, `AUTH_USER_NOT_AUTHENTICATED`
  - Business: `BUSINESS_ALREADY_EXISTS`, `BUSINESS_NAME_REQUIRED`, `BUSINESS_INVALID_SLUG_FORMAT`, `USER_NOT_MERCHANT`
  - Image: `IMAGE_FILE_SIZE_EXCEEDED`, `IMAGE_UNSUPPORTED_FILE_TYPE`, `IMAGE_UPLOAD_FAILED`, `BUSINESS_LOGO_UPLOAD_FAILED`
  - Common: `COMMON_VALIDATION_ERROR`, `COMMON_NOT_FOUND`, `COMMON_UNAUTHORIZED`, `COMMON_FORBIDDEN`, `COMMON_RATE_LIMIT_EXCEEDED`, `COMMON_INTERNAL_SERVER_ERROR`
- [ ] 4.2 Add corresponding i18n strings to `src/locales/en.json` and `src/locales/vi.json` for each new error key

## 5. API Auth Adapter

- [ ] 5.1 Implement `apiAuthAdapter.login({ email, password })` in `src/auth/adapters/apiAuthAdapter.js`: POST `/api/v1/authentication/signin` → store tokens → GET `/api/v1/userprofile/me` → return session object
- [ ] 5.2 Implement `apiAuthAdapter.getSession()`: if `tokenStore.get()` is non-null call `/api/v1/userprofile/me` and return session; else return `null`
- [ ] 5.3 Implement `apiAuthAdapter.logout()`: call `tokenStore.clear()`
- [ ] 5.4 Implement `apiAuthAdapter.signup({ email, password, confirmPassword, firstName, lastName, profileType })`: POST `/api/v1/authentication/signup`
- [ ] 5.5 Implement `apiAuthAdapter.verifyEmail({ token, email })`: POST `/api/v1/authentication/verify-email`
- [ ] 5.6 Implement `apiAuthAdapter.resendVerificationEmail({ email })`: POST `/api/v1/authentication/send-verification-email`
- [ ] 5.7 Implement `apiAuthAdapter.forgotPassword({ email })`: POST `/api/v1/authentication/forgot-password`
- [ ] 5.8 Implement `apiAuthAdapter.resetPassword({ token, email, newPassword, confirmPassword })`: POST `/api/v1/authentication/reset-password`
- [ ] 5.9 Implement profileType → session shape mapping (`Merchant` → `accountType:"business"`, `flag:"!business"`, `role:"owner"`; `User` → `accountType:"personal"`, `flag:"!personal"`, `role:"staff"`)
- [ ] 5.10 Write Vitest unit tests for `apiAuthAdapter`: login→session mapping, getSession with/without tokens, logout clears store, signup error codes (mock `fetch`); assert session shape parity: every field in mockAuthAdapter session (`id, email, accountType, flag, displayName, role, staffId, verificationStatus, ssoPrefillData`) must be present in apiAuthAdapter session (mock-only flags excluded)
- [ ] 5.11 Set `ssoPrefillData: null` explicitly on every session object returned by `apiAuthAdapter`; do NOT set mock-only flags (`clearMerchantSetup`, `clearProfileSettings`, `routeToDashboard`) — these are storage-mode-only control flags

## 6. AuthProvider Integration

- [ ] 6.1 Subscribe `AuthProvider` to `tokenStore.subscribe()` on mount so a `clear()` event transitions `status` to `anonymous` without a page reload
- [ ] 6.2 Unsubscribe on component unmount
- [ ] 6.3 Verify `authAdapter` index selects `apiAuthAdapter` when `VITE_DATA_SOURCE=api` (already wired; confirm no change needed)

## 7. Merchants API Repository

- [ ] 7.1 Add an API repository branch to `src/data/repositories/merchants.js` (selected when `VITE_DATA_SOURCE=api`) with `getSetup()` → GET `/api/v1/merchant/business` → return domain shape (stub `staffList:[]`, `touchPoints:[]`)
- [ ] 7.2 Add `checkSlug(slug)` → GET `/api/v1/merchant/business/check-slug?slug=<slug>` → return `{ isAvailable, suggestion }`
- [ ] 7.3 Add `createBusiness(dto)` → POST `/api/v1/merchant/business` → return `{ businessId, slug }`
- [ ] 7.4 Add `uploadLogo(file)` → `httpClient.upload('/api/v1/merchant/business/logo', formData, 'PUT')` with field name `logo` → return `{ logoUrl }`
- [ ] 7.5 Add `updateReviewLinks(dto)` → PUT `/api/v1/merchant/business/review-links`
- [ ] 7.6 Add `completeOnboarding()` → POST `/api/v1/merchant/business/complete-onboarding`
- [ ] 7.7 Handle `BUSINESS_NOT_FOUND` 404 in `getSetup()` by returning `null`
- [ ] 7.8 Write Vitest unit tests: DTO→domain mapping, 404→null, error propagation (mock `fetch`)

## 8. Onboarding Hooks

- [ ] 8.1 Add `useCheckSlug(slug)` hook to `src/data/hooks/useMerchantSetup.js` (or new `src/data/hooks/useOnboarding.js`): debounced query against `merchantsRepository.checkSlug()` in api mode, no-op in storage mode
- [ ] 8.2 Add `useCreateBusiness()` mutation hook: calls `merchantsRepository.createBusiness(dto)`, invalidates `qk.merchantSetup()`
- [ ] 8.3 Add `useUploadLogo()` mutation hook: calls `merchantsRepository.uploadLogo(file)`, returns `{ logoUrl }`
- [ ] 8.4 Add `useUpdateReviewLinks()` mutation hook: calls `merchantsRepository.updateReviewLinks(dto)`, invalidates `qk.merchantSetup()`
- [ ] 8.5 Add `useCompleteOnboarding()` mutation hook: calls `merchantsRepository.completeOnboarding()`, invalidates `qk.merchantSetup()`
- [ ] 8.6 Confirm all new hooks no-op or passthrough in storage mode (no api calls)

## 9. Onboarding Wizard — API Wiring

- [ ] 9.1 Locate the onboarding wizard step 1 handler (in `src/components/setup-wizard/` or `src/components/register/`): replace direct blob-save with `useCreateBusiness` call in api mode, keeping storage-mode path unchanged
- [ ] 9.2 Wire slug field to `useCheckSlug` with debounce in api mode; display availability indicator
- [ ] 9.3 Wire logo upload in step 1 to `useUploadLogo` in api mode; store returned `logoUrl` for inclusion in `createBusiness` payload
- [ ] 9.4 Wire step 2 review-links form to `useUpdateReviewLinks` in api mode
- [ ] 9.5 Wire final step confirmation to `useCompleteOnboarding` in api mode
- [ ] 9.6 Smoke test complete Flow 1 in api mode: create business → review links → complete → dashboard transition

## 10. Register Wizard — API Wiring

- [ ] 10.1 Locate the register wizard step 1 submit handler; add api-mode branch that calls `apiAuthAdapter.signup()` instead of `pendingAccountsRepository.add()`
- [ ] 10.2 After successful signup in api mode, navigate to an email-verification prompt screen (can be a new minimal view or reuse existing flow)
- [ ] 10.3 Add email verification view/screen: display "check your inbox" message, "Resend" button calling `apiAuthAdapter.resendVerificationEmail()`
- [ ] 10.4 Handle deep-link `?token=&email=` query params: call `apiAuthAdapter.verifyEmail({ token, email })` on mount, redirect to signin on success
- [ ] 10.5 Display i18n error messages for `USER_EMAIL_ALREADY_EXISTS`, `COMMON_RATE_LIMIT_EXCEEDED`, token-expired errors
- [ ] 10.6 Confirm storage-mode registration flow is unaffected (pendingAccounts still written in storage mode)

## 11. Login Screen — API Wiring

- [ ] 11.1 Confirm login form submit path uses `authAdapter.login()` (already abstracted via `AuthProvider`); no direct change needed if apiAuthAdapter is selected by the factory
- [ ] 11.2 Display i18n error for `USER_LOGIN_INVALID_USERNAME_OR_PASSWORD` and `USER_ACCOUNT_INACTIVE` in api mode
- [ ] 11.3 Display rate-limit message with `retryAfter` countdown for 429 responses

## 12. Verification

- [ ] 12.1 Run `pnpm test` — all existing Vitest tests must pass with `VITE_DATA_SOURCE=storage`
- [ ] 12.2 Run `pnpm build` — build must succeed with both `VITE_DATA_SOURCE=storage` and `VITE_DATA_SOURCE=api`
- [ ] 12.3 Run `pnpm lint:tokens` — no token violations
- [ ] 12.4 Live smoke test (api mode, Dev backend, test credentials): signup → verify-email → signin → check-slug → create business → review links → complete onboarding → confirm dashboard loads
- [ ] 12.5 Live smoke test — 401 refresh: sign in, wait for/force token expiry, confirm next request silently refreshes and succeeds
- [ ] 12.6 Live smoke test — refresh expired: clear accessToken, use expired refreshToken, confirm redirect to login
- [ ] 12.7 Regression: run storage-mode demo flow end-to-end to confirm no behavior change

## 13. Forgot Password & Reset Password UI

- [ ] 13.1 Create Forgot Password screen: email input form calling `apiAuthAdapter.forgotPassword({ email })`; display "check your email" confirmation on success (endpoint always returns 200 to prevent enumeration)
- [ ] 13.2 Create Reset Password screen: reads `token` and `email` from URL query params; form with `newPassword` + `confirmPassword` fields calling `apiAuthAdapter.resetPassword({ token, email, newPassword, confirmPassword })`
- [ ] 13.3 Handle `USER_PASSWORD_RESET_TOKEN_EXPIRED` on reset screen: display "link expired" with link back to Forgot Password
- [ ] 13.4 Wire Sign In screen to link to Forgot Password screen; wire Forgot Password success screen to link back to Sign In

## Why

The frontend currently runs entirely on a localStorage mock (storage adapter). The real Nexora Touch REST backend (.NET 8, CQRS, JWT) is now live on the Dev environment, and the app must begin calling real API endpoints to support production use. This change establishes the foundational API plumbing and wires the first critical flows — Authentication and Merchant Onboarding — so that real accounts can sign up, verify, log in, and complete the onboarding wizard end-to-end.

## What Changes

- **New**: `src/auth/tokenStore.js` — client-side JWT store (accessToken + refreshToken, persisted to localStorage via `storage.js`).
- **Modified**: `src/lib/httpClient.js` — add Bearer token injection, RFC-9110 ProblemDetails error parsing (`errorCode` + `errors{}`), FormData/multipart support, and single-flight 401 → refresh → retry interceptor.
- **New**: `src/data/errorCodes.js` — machine error code → i18n key mapping for auth and onboarding codes.
- **Implemented** (replaces stub): `src/auth/adapters/apiAuthAdapter.js` — `login`, `logout`, `getSession`, `signup`, `verifyEmail`, `resendVerificationEmail`, `forgotPassword`, `resetPassword`.
- **Minimal modify**: `src/auth/AuthProvider.jsx` — subscribe to httpClient logout signal so a failed token refresh transitions session to `anonymous`.
- **Extended**: `src/data/repositories/merchants.js` — add API repository branch (selected when `VITE_DATA_SOURCE=api`) with `getSetup()`, `checkSlug()`, `createBusiness()`, `updateReviewLinks()`, `uploadLogo()`, `completeOnboarding()`.
- **Extended**: `src/data/hooks/useMerchantSetup.js` (or new `useOnboarding.js`) — expose granular mutation hooks for each onboarding step with `qk.merchantSetup()` invalidation.
- **Mode-aware wiring**: onboarding wizard + register/verify screens call the API path in `api` mode; storage mode behavior is unchanged.
- **Modified**: `.env.example` — document `VITE_API_BASE_URL=https://nexora-dev-api.vlinkhub.com`.

All changes are gated by `VITE_DATA_SOURCE=api`. Storage (`VITE_DATA_SOURCE=storage`) remains the default and keeps working for demos and tests.

## Capabilities

### New Capabilities

- `api-http-client`: Upgraded httpClient with Bearer auth, ProblemDetails error parsing, FormData support, and 401→refresh→retry single-flight interceptor.
- `api-token-store`: Client-side JWT persistence module (`tokenStore`) that decouples token lifecycle from React state.
- `api-authentication`: Real API-backed sign-in, sign-up, email verification, password reset, token refresh — using `apiAuthAdapter` against `/api/v1/Authentication/*` and `/api/v1/UserProfile/me`.
- `api-merchant-onboarding`: Real API-backed Merchant Onboarding Flow 1 — check-slug, create business, update review links, upload logo, complete onboarding — via API merchant repository against `/api/v1/merchant/business/*` and `/api/v1/Images/upload`.

### Modified Capabilities

- `authentication-login`: Session shape and login/logout/getSession contract extended to support token-based API auth in `api` mode (same interface, new apiAuthAdapter implementation).
- `onboarding-setup-wizard`: Wizard step handlers become mode-aware; in `api` mode each step calls a dedicated API endpoint instead of writing to the storage blob.
- `register-wizard`: Signup and email-verification screens call real API endpoints in `api` mode.

## Impact

- **Files modified**: `src/lib/httpClient.js`, `src/auth/AuthProvider.jsx`, `src/auth/adapters/apiAuthAdapter.js`, `src/data/repositories/merchants.js`, `src/data/hooks/useMerchantSetup.js`, `.env.example`, `src/data/adapters/index.js`, `src/auth/adapters/index.js` (verification touchpoints for mode-selection factories).
- **Files new**: `src/auth/tokenStore.js`, `src/data/errorCodes.js`, optionally `src/data/hooks/useOnboarding.js`.
- Note: endpoint casing is **lowercase** throughout (`/api/v1/authentication/*`, `/api/v1/userprofile/*`, `/api/v1/images/*`) per the AI coding spec.
- **No component behavior change** when `VITE_DATA_SOURCE=storage` (all existing Vitest + e2e tests must continue to pass).
- **No TypeScript** — project is JSX only; no type annotation files added.
- **API dependency**: `https://nexora-dev-api.vlinkhub.com` (Dev) must be running for live smoke tests. Local backend (`https://localhost:7012`) is also supported via `VITE_API_BASE_URL`.
- **Out of scope** (deferred to follow-up branches): staff management, payment methods, touch points, customer touch page, multi-staff tips, dashboard, notifications.

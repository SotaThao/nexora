## Context

The frontend is a React 18 + Vite (JSX) single-page app built around a storage adapter that persists all domain data as JSON blobs in localStorage (with optional Supabase KV sync). The data-access layer follows: `components → hooks (TanStack Query) → repositories → adapter (get/set/remove)`.

The Nexora Touch backend (Clean Architecture .NET 8, CQRS via MediatR) is now live on Dev at `https://nexora-dev-api.vlinkhub.com`. It exposes a REST API with JWT Bearer auth (tokens returned in response body), RFC-9110 ProblemDetails errors, and multipart image upload. Two env variables already exist: `VITE_DATA_SOURCE` (`storage` default | `api`) and `VITE_API_BASE_URL`. Stubs exist for `httpClient.js`, `apiAdapter.js`, and `apiAuthAdapter.js`.

Scope: shared HTTP infrastructure + Authentication + Merchant Onboarding (Flow 1 per API spec). All other domains deferred.

## Goals / Non-Goals

**Goals:**
- Wire real Auth endpoints: sign-in, sign-up, email verify, token refresh, forgot/reset password.
- Wire Merchant Onboarding Flow 1: check-slug, create business, review links, logo upload, complete onboarding.
- Enable both modes simultaneously: `VITE_DATA_SOURCE=storage` (unchanged, default) and `VITE_DATA_SOURCE=api` (new).
- Production-ready token handling: Bearer injection, automatic 401→refresh→retry, secure logout on refresh expiry.
- No component behavior change in storage mode (all existing tests must pass).

**Non-Goals:**
- Staff management, payment methods, touch points, customer touch page, multi-staff tips, dashboard analytics, notifications — all deferred.
- Server-side session or httpOnly cookies — the backend returns tokens in body; client storage is the only option.
- TypeScript migration — project is JSX-only.
- Supabase KV removal or replacement.

## Decisions

### D1 — Repository layer is the API/storage swap point (not the KV adapter)

**Decision:** API repositories call `httpClient` directly. The KV `apiAdapter` stub is kept as a guard but never used in the API path.

**Rationale:** The existing KV interface (`get(key)/set(key)/remove(key)`) cannot model REST. One mock blob (`nexora_merchant_setup`) maps to multiple endpoints (`/merchant/business`, `/merchant/staff`, `/merchant/touchpoints`). Forcing REST calls through a KV adapter would require a per-key routing table and lose the ability to call granular endpoints like `PATCH /payment-methods/{id}/toggle`. The repository layer already owns domain operations — that is the natural boundary.

**Alternative considered:** Re-implement the KV adapter to dispatch GET/POST/PUT per key. Rejected: N:1 key→endpoint is ambiguous; mutations become opaque; error handling is harder.

### D2 — Token storage: both tokens persisted to localStorage

**Decision:** `tokenStore.js` stores `{accessToken, refreshToken}` in a single localStorage key (`nexora_auth_tokens`) via the existing `storage.js` helper. Tokens persist across reloads.

**Rationale:** Matches the UX of the current mock (login survives reload). The backend returns tokens in the JSON response body — httpOnly cookies are not an option with this API. Persisting the refresh token to localStorage is required to allow silent refresh on page reload. The risk (XSS access to tokens) is accepted because the entire platform is already localStorage-first; adding a refreshToken-in-memory-only approach would break the reload UX without meaningfully raising the security bar given the current threat model.

**Alternative considered:** accessToken in memory, refreshToken in localStorage. Rejected for this phase: complicates `tokenStore` API and reload flow; deferred security hardening can revisit.

### D3 — httpClient gains a single-flight 401→refresh→retry interceptor

**Decision:** When a protected request returns 401, `httpClient` pauses all concurrent requests, fires one `POST /api/v1/authentication/refresh-token`, stores the new token pair, then retries all queued requests with the new token. On `USER_INVALID_REFRESH_TOKEN` (or second 401), it clears tokens and emits a `logout` signal.

**Rationale:** This is a standard pattern. Without it, a burst of concurrent requests after token expiry would cause multiple simultaneous refresh calls (race to invalidate the refresh token) and confusing UX. The single-flight queue prevents the race.

**Implementation:** a module-level `refreshPromise` variable. If `refreshPromise` is non-null, concurrent 401s chain onto it. Once settled, `refreshPromise` is cleared.

### D4 — apiAuthAdapter builds the existing session shape by calling `/api/v1/userprofile/me`

**Decision:** After `POST /api/v1/authentication/signin`, `apiAuthAdapter.login()` calls `GET /api/v1/userprofile/me` to fetch `{id, email, firstName, lastName, profileType, status}` and maps to the existing session shape `{id, email, accountType, flag, displayName, role, staffId, verificationStatus, ssoPrefillData}`.

**Rationale:** `AuthProvider` and route guards consume `session.accountType`, `session.role`, and `session.verificationStatus`. These don't come from the signin response alone. The `/me` call adds one round-trip but ensures the session object is always consistent and components need no changes.

**Mapping:** `profileType: "Merchant"` → `accountType: "business"`, `flag: "!business"`, `role: "owner"`. `profileType: "User"` → `accountType: "personal"`, `flag: "!personal"`, `role: "staff"`. `staffId` is null until staff domains are implemented.

The api adapter must explicitly set `ssoPrefillData: null` on every session it returns — the onboarding wizard reads this field and the mock returns it; the api adapter must not leave it undefined.

The mock-only routing flags (`clearMerchantSetup`, `clearProfileSettings`, `routeToDashboard`) are NOT returned by the api adapter. They are mock-only control flags; the api adapter omits them entirely.

The `expiresIn` field from the token response (`AuthTokenResponse.expiresIn: number` per the DTO cheat sheet in Section 5 of the AI coding spec) must be stored in `tokenStore` alongside `accessToken` and `refreshToken` for future use.

### D5 — Error shape normalized to ProblemDetails

**Decision:** `httpClient.buildError()` is rewritten to parse the RFC-9110 ProblemDetails body: `{ status, errorCode, errors: {field: [codes]}, retryAfter? }`. The internal error object shape changes from `{status, code, message, details}` to `{status, errorCode, errors, retryAfter}`.

**Rationale:** The backend always returns ProblemDetails. Callers (repositories, auth adapter, components) should read `errorCode` for machine-readable codes and `errors` for field-level validation.

**Impact:** Any existing component that reads `err.code` must be updated to `err.errorCode`. In the storage path no real HTTP errors occur, so this only affects the api path. The NETWORK_ERROR catch branch (when `fetch` throws a network-level exception) will also be normalized to the `{ status: 0, errorCode: "NETWORK_ERROR", errors: {}, retryAfter: null }` shape for consistency.

### D6 — Onboarding wizard components become mode-aware via hook facade

**Decision:** Wizard step handlers in the onboarding components call new hook-level facades (`useCreateBusiness`, `useUpdateReviewLinks`, `useUploadLogo`, `useCompleteOnboarding`, `useCheckSlug`) that dispatch to API calls in `api` mode and to the existing blob-save in `storage` mode.

**Rationale:** This keeps component behavior identical in storage mode (no regression) while allowing each onboarding step to call its dedicated endpoint in api mode (instead of a single blob overwrite). The facades live in `useMerchantSetup.js` or a new `useOnboarding.js`.

## Risks / Trade-offs

**[Risk] CORS on Dev API** → Test CORS headers from localhost:5173 against `nexora-dev-api.vlinkhub.com` early. The httpClient will NOT send `credentials:'include'` for Bearer-based calls — this removes the preflight CORS friction, but the backend must allow the FE origin in its CORS policy.

**[Risk] `SignInResponseDto` field names** → The live OpenAPI JSON didn't fully expand the response schema inline. Confirm `accessToken`/`refreshToken` (snake or camel) from the swagger UI at `/api/index.html` before implementing `tokenStore.set()`.

**[Risk] Email verification on Dev** → If the Dev environment uses a real email provider, the signup→verify-email flow requires a real inbox. Clarify with the backend team whether Dev sends real emails or allows a bypass token.

**[Risk] XSS token exposure** → Both tokens in localStorage are readable by any injected script. Accepted for this phase. Future mitigation: httpOnly cookie-backed refresh + in-memory access token (requires backend change).

**[Risk] Storage mode regression** → Any change to `httpClient.js` must not break storage-mode code paths. `buildError` is never called in storage mode (no real HTTP), but `addRequestInterceptor` calls must be guarded (`VITE_DATA_SOURCE=api` check) so the Bearer interceptor isn't registered in storage mode.

## Migration Plan

1. Set `VITE_DATA_SOURCE=storage` (default): existing behaviour unchanged. No deploy action needed.
2. To enable API mode: set `VITE_DATA_SOURCE=api` and `VITE_API_BASE_URL=https://nexora-dev-api.vlinkhub.com` in the environment.
3. Test credentials must be provisioned on the Dev backend (or use self-service signup if email verify is bypassed).
4. No database migration — this is a frontend-only change. The backend is already deployed.
5. Rollback: set `VITE_DATA_SOURCE=storage` to revert to mock mode immediately.

## Open Questions

1. Does the Dev API support self-service signup + email verification (real inbox needed), or is there a bypass/pre-provisioned account we should use for smoke testing?
2. ~~Exact `SignInResponseDto` field names: `accessToken`/`refreshToken` (camelCase) or `access_token`/`refresh_token`?~~ **RESOLVED:** The AI Coding Spec DTO cheat sheet (Section 5) confirms camelCase: `accessToken`, `refreshToken`, `tokenType: 'Bearer'`, `expiresIn: number`.
3. Preferred token storage: confirm localStorage-for-both (as designed) or move to accessToken-in-memory for the access token?

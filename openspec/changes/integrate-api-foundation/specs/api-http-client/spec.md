## ADDED Requirements

### Requirement: Bearer Token Injection
The HTTP client SHALL automatically attach an `Authorization: Bearer <accessToken>` header to every request when a valid access token exists in the token store.

#### Scenario: Authenticated request
- **WHEN** a request is made and `tokenStore.get()` returns a non-null `accessToken`
- **THEN** the client SHALL set `Authorization: Bearer <accessToken>` in the request headers before sending

#### Scenario: Anonymous request opt-out
- **WHEN** a request is made with the `anonymous: true` flag in its options
- **THEN** the client SHALL NOT attach an Authorization header

#### Scenario: No token present
- **WHEN** a request is made and the token store contains no access token
- **THEN** the client SHALL send the request without an Authorization header (the server will return 401 if the endpoint requires auth)

### Requirement: RFC-9110 ProblemDetails Error Parsing
The HTTP client SHALL parse non-2xx responses as RFC-9110 ProblemDetails and normalize them to `{ status, errorCode, errors, retryAfter }`.

#### Scenario: Validation error response
- **WHEN** the server returns a 400 with body `{ status:400, errorCode:"COMMON_VALIDATION_ERROR", errors:{ field:["CODE"] } }`
- **THEN** `buildError` SHALL resolve to `{ status:400, errorCode:"COMMON_VALIDATION_ERROR", errors:{ field:["CODE"] }, retryAfter:null }`

#### Scenario: Rate limit response
- **WHEN** the server returns a 429 with body `{ status:429, errorCode:"COMMON_RATE_LIMIT_EXCEEDED", retryAfter:60 }`
- **THEN** `buildError` SHALL resolve to `{ status:429, errorCode:"COMMON_RATE_LIMIT_EXCEEDED", errors:{}, retryAfter:60 }`

#### Scenario: Non-JSON error body
- **WHEN** the server returns a non-2xx response with a non-JSON body
- **THEN** `buildError` SHALL resolve to `{ status:<http-status>, errorCode:"HTTP_ERROR", errors:{}, retryAfter:null }`

### Requirement: FormData / Multipart Upload
The HTTP client SHALL support sending `FormData` bodies for image upload endpoints without setting a `Content-Type` header (letting the browser set it with the correct boundary).

#### Scenario: FormData body detection
- **WHEN** the `upload(path, formData)` helper is called
- **THEN** the client SHALL NOT set `Content-Type` in the request headers and SHALL send the `FormData` as the request body unmodified

#### Scenario: JSON body unchanged
- **WHEN** the `post`, `put`, or `patch` helpers are called with a plain object body
- **THEN** the client SHALL set `Content-Type: application/json` and serialize the body as JSON

### Requirement: Single-Flight 401 Refresh and Retry
When a protected request returns 401, the HTTP client SHALL attempt a single token refresh and retry the original request. Concurrent 401 responses SHALL queue behind the single refresh attempt.

#### Scenario: Single 401 triggers refresh
- **WHEN** a request returns 401 and the token store contains a refresh token
- **THEN** the client SHALL call `POST /api/v1/authentication/refresh-token`, store the new token pair, and retry the original request with the new access token

#### Scenario: Concurrent 401s share one refresh
- **WHEN** multiple requests return 401 simultaneously
- **THEN** the client SHALL initiate only ONE refresh call; all other 401 requests SHALL queue and retry once the refresh resolves

#### Scenario: Refresh token expired
- **WHEN** the refresh call returns 400 with `errorCode: "USER_INVALID_REFRESH_TOKEN"`
- **THEN** the client SHALL clear the token store, emit a `logout` event, and reject all queued requests

#### Scenario: No refresh token available
- **WHEN** a request returns 401 and the token store contains no refresh token
- **THEN** the client SHALL immediately emit a `logout` event and reject the request without attempting a refresh

### Requirement: Configurable HTTP Method for Upload Helper
The `upload(path, formData, method?)` helper SHALL accept an optional `method` parameter defaulting to `'POST'` but supporting `'PUT'` so that logo upload can issue `PUT /api/v1/merchant/business/logo` as required by the API spec.

#### Scenario: Default method is POST
- **WHEN** `upload(path, formData)` is called without a method argument
- **THEN** the client SHALL send the request using the `POST` HTTP method

#### Scenario: PUT method override
- **WHEN** `upload(path, formData, 'PUT')` is called
- **THEN** the client SHALL send a `PUT` request with the `FormData` as the body

### Requirement: Network Error Normalization
When `fetch` throws a network-level exception (offline, DNS failure, etc.), the client SHALL reject with a normalized error object `{ status: 0, errorCode: "NETWORK_ERROR", errors: {}, retryAfter: null }` (same shape as HTTP errors) so callers do not need to handle two different error shapes.

#### Scenario: Network-level fetch failure
- **WHEN** `fetch` throws (e.g. network unreachable, DNS failure)
- **THEN** the client SHALL reject with `{ status: 0, errorCode: "NETWORK_ERROR", errors: {}, retryAfter: null }`

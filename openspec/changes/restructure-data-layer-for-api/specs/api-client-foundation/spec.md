## ADDED Requirements

### Requirement: Configured HTTP client scaffold
A single HTTP client (`src/lib/httpClient.js`) SHALL be provided, built on `fetch`, reading its base URL from `VITE_API_BASE_URL`, sending `credentials: 'include'` for the future cookie session, and encoding/decoding JSON. It SHALL be unit-tested but SHALL NOT be imported by any screen in this phase.

#### Scenario: Client targets the configured base URL
- **WHEN** `httpClient` issues a request with `VITE_API_BASE_URL` set
- **THEN** the request goes to that base URL with `credentials: 'include'` and JSON headers

#### Scenario: Not wired to screens this phase
- **WHEN** the change is complete
- **THEN** only future API-phase adapters reference `httpClient`; no screen or feature hook imports it yet

### Requirement: Normalized error shape
The HTTP client SHALL convert non-2xx responses and network failures into a normalized error object `{ status, code, message, details }` so future repositories/adapters handle errors uniformly.

#### Scenario: HTTP error is normalized
- **WHEN** the server returns a 4xx/5xx response
- **THEN** the client rejects with `{ status, code, message, details }` rather than a raw `Response`

#### Scenario: Network failure is normalized
- **WHEN** the underlying `fetch` throws (network/offline)
- **THEN** the client rejects with a normalized error whose `status` indicates a transport/network failure

### Requirement: Interceptor hook points for auth transport
The HTTP client SHALL expose request/response interceptor hook points so the API phase can attach a CSRF header, handle `401 → logout`, and refresh sessions without changing call sites.

#### Scenario: Interceptors can be registered
- **WHEN** a request or response interceptor is registered on the client
- **THEN** it runs for subsequent requests/responses without modifying individual call sites

### Requirement: Environment configuration documented
`VITE_API_BASE_URL` and `VITE_DATA_SOURCE` SHALL be added to `.env.example` with documented defaults (`VITE_DATA_SOURCE=storage`), so the API phase flips the data source and base URL via environment only.

#### Scenario: Defaults keep storage mode
- **WHEN** a developer copies `.env.example` without overrides
- **THEN** the app runs in `storage` mode with no real API calls

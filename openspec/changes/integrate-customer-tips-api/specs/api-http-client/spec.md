## MODIFIED Requirements

### Requirement: Query Parameter Serialization
The HTTP client SHALL support a `params` option on request helpers and serialize it into the URL query string before calling `fetch`.

#### Scenario: GET with query params
- **WHEN** `client.get('/api/v1/touch/payment-link', { params: { staffId: 's1', method: 'CashApp', amount: 20 } })` is called
- **THEN** the client SHALL call `fetch` with `/api/v1/touch/payment-link?staffId=s1&method=CashApp&amount=20`

#### Scenario: Optional null params are omitted
- **WHEN** `params` contains `null` or `undefined` values
- **THEN** the client SHALL omit those keys from the query string

#### Scenario: Existing anonymous behavior is preserved
- **WHEN** a public customer request is made with `{ anonymous: true }`
- **THEN** the client SHALL NOT attach an `Authorization` header


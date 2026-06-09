## ADDED Requirements

### Requirement: Token Persistence Across Reloads
The token store SHALL persist `{ accessToken, refreshToken }` to localStorage via `storage.js` under the key `nexora_auth_tokens` so that authenticated sessions survive page reloads.

#### Scenario: Tokens saved after login
- **WHEN** `tokenStore.set({ accessToken, refreshToken })` is called
- **THEN** both tokens SHALL be written to localStorage under `nexora_auth_tokens` as a JSON object

#### Scenario: Tokens restored on load
- **WHEN** `tokenStore.get()` is called on a fresh page load
- **THEN** the store SHALL read and return the previously persisted `{ accessToken, refreshToken }` object, or `null` if none exists

#### Scenario: Tokens cleared on logout
- **WHEN** `tokenStore.clear()` is called
- **THEN** the `nexora_auth_tokens` key SHALL be removed from localStorage and `tokenStore.get()` SHALL return `null`

### Requirement: Subscriber Notification
The token store SHALL allow the `AuthProvider` (or any consumer) to subscribe to token-clear events so the session can be transitioned to `anonymous` without a manual poll.

#### Scenario: Subscriber called on clear
- **WHEN** `tokenStore.clear()` is called after a subscriber has been registered via `tokenStore.subscribe(fn)`
- **THEN** the subscriber function SHALL be called immediately

#### Scenario: Multiple subscribers
- **WHEN** multiple subscribers are registered
- **THEN** ALL subscribers SHALL be called when `tokenStore.clear()` is invoked

#### Scenario: Subscriber cleanup
- **WHEN** the function returned by `tokenStore.subscribe(fn)` is called (unsubscribe)
- **THEN** that subscriber SHALL NOT be called on subsequent `clear()` calls

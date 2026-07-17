## ADDED Requirements

### Requirement: Persist accountName on payment-method updates
For payment methods whose UI key is in `ACCOUNT_NAME_UI_KEYS` (zelle, cashapp, paypal), every payment-method update SHALL include `accountName` in the PUT body — a trimmed non-empty string, or `null` to clear. For all other method types the `accountName` key SHALL be omitted from the body entirely.

#### Scenario: Merchant updates a supported method with a name
- **WHEN** a merchant saves a Zelle/CashApp/PayPal payout account with an account-holder name
- **THEN** the frontend SHALL call `PUT /api/v1/merchant/payment-methods/{id}` with body `{accountInfo, accountName, imageUrl}`

#### Scenario: Staff updates a supported method
- **WHEN** a staff saves a Zelle/CashApp/PayPal payout account
- **THEN** the frontend SHALL call `PUT /api/v1/staff/payment-methods/{id}` with body `{accountInfo, accountName, imageUrl}`

#### Scenario: Owner updates a local-staff method
- **WHEN** a merchant saves a local-staff Zelle/CashApp/PayPal payout account
- **THEN** the frontend SHALL call `PUT /api/v1/merchant/local-staff/{staffProfileId}/payment-methods/{paymentMethodId}` including `accountName`

#### Scenario: Unsupported method omits the key
- **WHEN** a Venmo/AppleCash/VlinkPay/BankWire/Crypto method is updated
- **THEN** the PUT body SHALL NOT contain an `accountName` key

#### Scenario: Clearing the name
- **WHEN** the user clears the account-holder name of a supported method and saves
- **THEN** the PUT body SHALL carry `"accountName": null`

### Requirement: Bulk payout-config saves carry accountName
Wizard/onboarding bulk saves (merchant setup wizard, personal onboarding, staff registration, local-staff creation) SHALL forward `accountName` from the payout config for supported methods, and SHALL treat an accountName-only change as dirty (an update still fires when only the name changed and accountInfo is non-empty).

#### Scenario: Name-only change still saves
- **WHEN** a merchant re-runs the setup wizard changing only the account-holder name of a configured Zelle method
- **THEN** the frontend SHALL still call `PUT /api/v1/merchant/payment-methods/{id}` with the new `accountName`

### Requirement: Normalize accountName defensively on reads
All payment-method normalizers (merchant, staff, local-staff, merchant-staff roster, public direct-payment, public staff-payment, touch page, tips payment-methods) SHALL map `accountName` as `raw.accountName ?? null`, so the UI works both before and after the backend starts returning the field.

#### Scenario: Backend does not return the field yet
- **WHEN** a GET payment-methods response has no `accountName` property
- **THEN** normalized DTOs SHALL carry `accountName: null` and no UI surface SHALL crash or change layout

### Requirement: Editable account-holder name in payout modals
All five payout edit surfaces (merchant settings inline modal, shared dashboard PayoutSetupModal, setup-wizard PayoutSetupModal, register PayoutEditModal, staff-registration PayoutEditModal) SHALL show an optional account-holder-name input for zelle/cashapp/paypal only, prefilled with the persisted `accountName` and falling back to the existing display-name behavior.

#### Scenario: Field visibility
- **WHEN** the payout modal opens for zelle, cashapp, or paypal
- **THEN** the account-holder-name input SHALL be visible
- **WHEN** it opens for any other wallet
- **THEN** the input SHALL NOT render

### Requirement: Display accountName
Configured payout lists (merchant settings, staff Pay view) SHALL show the account-holder name next to the account identifier when present. On customer-facing wallet detail pages (tip flow, merchant/staff direct payment), the recipient name rendered in the title, subtitle, and payment instructions SHALL be the selected method's `accountName` when the API returns it, falling back to the existing display name (staff nickname / business name) otherwise.

#### Scenario: Customer sees the wallet account-holder name
- **WHEN** a customer opens a wallet payment step and the selected payment method carries `accountName`
- **THEN** the title ("Send $X to {name} with {wallet}"), subtitle, and instruction steps SHALL use that `accountName` as the recipient name

#### Scenario: Fallback when accountName is absent
- **WHEN** the selected payment method has no `accountName`
- **THEN** the recipient name SHALL remain the staff nickname or business name (current behavior)
- **AND** the tip note reference (`TIP-<NICKNAME>-<ref>`) SHALL remain nickname-based in both cases

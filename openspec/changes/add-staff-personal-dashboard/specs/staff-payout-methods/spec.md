## ADDED Requirements

### Requirement: Staff self-manages payout methods
The Pay screen SHALL let the staff view and manage their own receiving/payout methods (e.g., Cash App, Venmo, Zelle, VLINKPAY Wallet, Crypto Wallet), including the handle/value and an enabled toggle per method.

#### Scenario: Toggle a payout method on or off
- **WHEN** the staff toggles a payout method
- **THEN** that method's enabled state is updated and persisted to the staff's account data

#### Scenario: Edit a payout handle
- **WHEN** the staff edits the handle/value of a payout method and saves
- **THEN** the new value is persisted to the staff's account data

### Requirement: Owner cannot edit staff payout methods
Payout methods SHALL be owned by the staff account only; the merchant owner SHALL NOT be able to edit them through this surface.

#### Scenario: Payout methods are staff-owned
- **WHEN** the Pay screen renders
- **THEN** the payout methods are read from and written to the staff-owned data store, not the merchant-editable store

### Requirement: Payout method branding
Each payout method SHALL be displayed using the shared `WalletLogos` brand marks for consistency with the rest of the app.

#### Scenario: Methods show brand logos
- **WHEN** the Pay screen lists payout methods
- **THEN** each method shows its corresponding `WalletLogos` icon

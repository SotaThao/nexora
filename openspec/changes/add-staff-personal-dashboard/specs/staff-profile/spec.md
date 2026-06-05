## ADDED Requirements

### Requirement: Edit personal profile
The Profile screen SHALL let the staff view and edit their personal profile fields — full name, default display name, phone, email, and bio — and persist changes to the staff-owned account data.

#### Scenario: Save profile changes
- **WHEN** the staff edits profile fields and saves
- **THEN** the updated values are persisted to the staff's account data

### Requirement: Per-business display names
The Profile screen SHALL show the staff's display name (nickname) for each linked business and SHALL allow it to differ per business.

#### Scenario: Distinct display name per business
- **WHEN** the staff has different display names across linked businesses
- **THEN** the Profile screen shows each business with its own display name

### Requirement: Profile basics align with merchant record
The staff's identity basics (full name, Staff ID, linked business membership) SHALL be consistent with the merchant record in `nexora_merchant_setup.staffList` for the same `staffId`.

#### Scenario: Identity matches merchant staff entry
- **WHEN** the Profile screen loads
- **THEN** the staff's full name and Staff ID match the corresponding entry in the merchant's staff list

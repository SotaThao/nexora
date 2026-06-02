## ADDED Requirements

### Requirement: Home KPIs derived from the staff's transactions
The Home screen SHALL display KPI cards — Today's Tips, This Month, Pending count, and Rating — computed from `nexora_transactions` filtered to the signed-in staff's `staffId`.

#### Scenario: KPIs reflect the signed-in staff
- **WHEN** the Home screen loads for a signed-in staff
- **THEN** the KPI cards aggregate only transactions whose `staffId` matches that staff

#### Scenario: No transactions yet
- **WHEN** the signed-in staff has no matching transactions
- **THEN** the KPI cards show zero values without errors

### Requirement: Pending tip confirmations
The Home screen SHALL list tips that are awaiting the staff's confirmation of receipt, and SHALL allow the staff to confirm one or all pending tips.

#### Scenario: Confirm a pending tip
- **WHEN** the staff confirms a pending tip
- **THEN** that tip moves out of the pending list and its status updates to confirmed/received

#### Scenario: Confirm all pending tips
- **WHEN** the staff selects "Confirm All Received"
- **THEN** all currently pending tips are marked confirmed

### Requirement: Linked businesses on Home
The Home screen SHALL show the businesses the staff is linked to, each with the staff's per-business display name and link status.

#### Scenario: Linked businesses listed
- **WHEN** the Home screen loads
- **THEN** each linked business is shown with its display name and an active/inactive status

### Requirement: Tips activity list
The Tips screen SHALL list the staff's tip activity with amount, payment method, business, display name, and status (Pending, Completed, or Verified).

#### Scenario: Tip rows show status and source
- **WHEN** the Tips screen loads
- **THEN** each tip row shows its amount, method, business, display name, and current status

### Requirement: AI insight panel
The Tips screen SHALL display an informational AI insight summarizing the staff's tipping performance.

#### Scenario: Insight is shown
- **WHEN** the Tips screen loads with at least one tip
- **THEN** an AI insight summary is displayed

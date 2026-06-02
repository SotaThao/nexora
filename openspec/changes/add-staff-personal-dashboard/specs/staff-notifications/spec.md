## ADDED Requirements

### Requirement: Notification feed
The Notifications screen SHALL display the staff's notifications (e.g., new tip marked sent, business link request, new review) with a type, message, and read/unread state.

#### Scenario: Notifications are listed
- **WHEN** the Notifications screen loads
- **THEN** each notification shows its type, message, and unread indicator where applicable

#### Scenario: Reading a notification clears its unread state
- **WHEN** the staff opens or marks a notification as read
- **THEN** that notification's unread indicator is cleared and the state is persisted

### Requirement: Push notification preferences
The Notifications screen SHALL let the staff toggle push preferences for categories such as Tip Confirmations, Reviews, and Business Invites.

#### Scenario: Toggle a push preference
- **WHEN** the staff toggles a push preference category
- **THEN** the preference state is updated and persisted to the staff's account data

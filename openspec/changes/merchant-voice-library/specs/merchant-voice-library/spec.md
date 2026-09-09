## ADDED Requirements

### Requirement: Merchant voice catalog boundary
The frontend MUST normalize public merchant voice metadata in its repository and scope queries by account, business when available, and draft language.

#### Scenario: Older backend config
- **WHEN** config omits voiceSelections
- **THEN** the repository supplies an empty list without inventing an assignment

### Requirement: Separate pending, draft, and persisted voice choices
The frontend MUST keep modal pending choices separate from salon draft and server assignments.

#### Scenario: Apply and persist
- **WHEN** a merchant confirms a modal choice
- **THEN** only the draft changes until the full config PUT succeeds

#### Scenario: Active group disappears
- **WHEN** a previously applicable group disappears before Save
- **THEN** save preparation reports unavailable and preserves the draft

### Requirement: Accessible bounded preview dialog
The frontend MUST isolate sample playback, trap modal focus, restore opener focus, and keep its footer reachable on mobile.

#### Scenario: Preview ends or dialog closes
- **WHEN** playback ends or the dialog closes
- **THEN** playback stops and its event handlers are removed without changing the selected voice

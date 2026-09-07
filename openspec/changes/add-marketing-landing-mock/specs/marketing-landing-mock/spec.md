## ADDED Requirements

### Requirement: Explicit session demo
The Marketing UI SHALL identify sample data and explain that changes reset after reload.

#### Scenario: Open marketing
- **WHEN** the merchant opens Marketing
- **THEN** the UI SHALL expose AI Design, Landing Page, Campaign and Social Media tabs
- **AND** SHALL describe the session-only mock scope without claiming real publication or delivery

### Requirement: Banner-backed landing editor
The merchant SHALL be able to compose a landing page using a selected banner and preview its content.

#### Scenario: Use selected banner
- **WHEN** the merchant chooses the landing-page action for an AI banner
- **THEN** the landing editor SHALL show that banner and permit editing title, subtitle, offer and CTA

### Requirement: Separate draft and published snapshots
Mock draft saves SHALL NOT change previously published demo content.

#### Scenario: Edit after simulated publish
- **WHEN** a published page draft is edited and saved
- **THEN** its published preview SHALL retain the prior snapshot until the next simulated publish

### Requirement: Validated call to action
Landing publication SHALL reject invalid CTA configuration and invalid expiry values.

#### Scenario: Unsafe booking URL
- **WHEN** the merchant enters a non-HTTP(S) booking URL and publishes
- **THEN** validation SHALL prevent publication and explain the invalid field

### Requirement: Mock campaign linkage
The merchant SHALL be able to save an editable sample campaign draft using a published demo landing page.

#### Scenario: Save campaign
- **WHEN** a merchant selects a published demo page and saves campaign copy
- **THEN** a campaign draft SHALL be available in the current session
- **AND** no real marketing delivery request SHALL occur

### Requirement: Responsive and localized workflow
New Marketing controls SHALL support English and Vietnamese and remain usable on desktop, tablet and phone.

#### Scenario: Narrow viewport
- **WHEN** the editor is viewed at 375 pixels wide
- **THEN** content SHALL fit without horizontal page overflow and its actions SHALL remain reachable


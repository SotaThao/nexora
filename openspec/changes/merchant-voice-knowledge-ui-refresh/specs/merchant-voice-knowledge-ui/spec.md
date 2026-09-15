## ADDED Requirements

### Requirement: Knowledge library belongs to Salon Settings

The merchant UI SHALL render the Knowledge files library directly below Business FAQ while preserving its independent server-state lifecycle.

#### Scenario: Merchant opens Salon Settings

- **WHEN** Salon Settings is displayed
- **THEN** the Business FAQ field SHALL be followed by the Knowledge files library

### Requirement: Existing document workflows remain available

The refreshed library SHALL preserve upload, download, edit, regenerate, status update, delete, pagination, plan-lock, and error behavior through the existing data hook and repository.

#### Scenario: Merchant manages a document

- **WHEN** the merchant opens a document's action menu
- **THEN** the UI SHALL expose only actions valid for that document status
- **AND** SHALL invoke the existing action and confirmation behavior

### Requirement: One-file upload supports selection and drag/drop

The upload surface SHALL accept one TXT, DOCX, or PDF of no more than 5 MB by file picker or drag/drop and SHALL keep the five-document limit.

#### Scenario: Merchant drops multiple files

- **WHEN** more than one file is dropped
- **THEN** the UI SHALL process only the first file through the existing upload workflow

### Requirement: Layout remains usable across supported viewports

The library SHALL match the approved desktop structure and SHALL stack content, actions, guidance, and editing controls without horizontal clipping at 375×667.

#### Scenario: Merchant uses a phone-sized viewport

- **WHEN** the viewport is 375 pixels wide
- **THEN** document rows SHALL render as readable cards and all actions SHALL remain reachable

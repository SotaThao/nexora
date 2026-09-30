## ADDED Requirements

### Requirement: Merchant downloads the original knowledge document

The system SHALL let an authenticated merchant download the original file for any non-deleted knowledge document returned in that merchant's NexoraVoice knowledge-document list.

#### Scenario: Download a visible document

- **WHEN** a merchant selects **Download original** for a visible document
- **THEN** the frontend SHALL request `GET /api/v1/merchant/nexora-voice/knowledge-documents/{id}/original`
- **AND** the browser SHALL save the response using the document's original filename.

#### Scenario: Download is independent of processing status

- **WHEN** a visible document has status Processing, Active, Failed, Disabled, or HeldForReview
- **THEN** its download action SHALL remain available.

### Requirement: Original-file download is tenant scoped

The backend SHALL derive tenant scope from the authenticated merchant and SHALL return a document only when its ID belongs to that tenant and it is not deleted.

#### Scenario: Cross-tenant identifier

- **WHEN** a merchant requests a document ID owned by another tenant
- **THEN** the API SHALL not return that document or reveal its ownership.

#### Scenario: Deleted or missing original

- **WHEN** the document is deleted, absent, or its private storage object is missing
- **THEN** the API SHALL return the existing not-found response.

### Requirement: Download response remains private and safe

The backend SHALL stream the private object through the authenticated API with its stored content type and original filename, `Cache-Control: no-store`, and `X-Content-Type-Options: nosniff`.

#### Scenario: Successful response

- **WHEN** the authorized document and private object exist
- **THEN** the response SHALL be an attachment containing the original bytes, content type, and filename
- **AND** the response SHALL not expose a reusable private-storage URL.

### Requirement: Download progress and errors are clear

The merchant UI SHALL disable only the document currently being downloaded, show localized download progress, and display a localized retryable error when the request fails.

#### Scenario: Download request fails

- **WHEN** the network or storage request fails
- **THEN** the merchant SHALL see the existing localized request-error message
- **AND** SHALL be able to retry the download.

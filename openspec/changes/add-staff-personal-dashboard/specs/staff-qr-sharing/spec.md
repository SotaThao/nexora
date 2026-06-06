## ADDED Requirements

### Requirement: Personal staff QR and link
The My QR screen SHALL display the staff's personal QR and Staff ID, and SHALL provide actions to share the staff QR and copy the staff link.

#### Scenario: Personal QR shows Staff ID
- **WHEN** the My QR screen loads
- **THEN** it shows the staff's personal QR with the Staff ID in `NEX-STAFF-XXXX` format

#### Scenario: Copy staff link
- **WHEN** the staff selects "Copy Staff Link"
- **THEN** the staff's shareable link is copied to the clipboard

### Requirement: Per-business staff QR
The My QR screen SHALL list a separate staff QR for each linked business, identified by the business–staff link so QRs are not confused when the staff works at multiple businesses.

#### Scenario: One QR entry per linked business
- **WHEN** the staff is linked to multiple businesses
- **THEN** the My QR screen lists a distinct per-business QR entry for each, each tied to its business–staff link

### Requirement: QR rendering is a placeholder for the demo
QR images SHALL be rendered as a visual placeholder for this change; real QR encoding is out of scope and SHALL NOT be required.

#### Scenario: Placeholder QR renders
- **WHEN** a QR is displayed
- **THEN** a placeholder QR visual is shown without requiring a real QR-encoding service

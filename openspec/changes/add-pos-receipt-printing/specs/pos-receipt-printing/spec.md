## ADDED Requirements

### Requirement: Single receipt document feeds every renderer
A single resolved receipt document SHALL be the only source of receipt content. `buildPosReceiptDocument()` SHALL produce a fully resolved, serializable document — every string already translated and formatted, every amount a plain number — and both the on-screen preview renderer and the PassPRNT HTML renderer SHALL consume that same document. Neither renderer SHALL derive any receipt content from the order, the query cache, or the translation function directly.

#### Scenario: Preview and printed output carry identical content
- **WHEN** the same receipt document is rendered by the preview component and by the PassPRNT HTML builder
- **THEN** the normalized text content of both outputs SHALL be identical

#### Scenario: A print copy is not re-derived
- **WHEN** a multi-copy print job resumes after the app has fully remounted and the order query cache is cold
- **THEN** the later copies SHALL be printed from the document persisted with the job, not rebuilt from the order

### Requirement: Receipt shows subtotal, sales tax and customer identity
The printed receipt SHALL render, in order: ticket number, business name/address/phone, completion date-time, customer name, formatted customer phone, service lines grouped by technician (with add-ons and per-line discount badges), Subtotal, Discount, Order discount when greater than zero, Sales tax, Tip, Total, the paid-with method when paid, and a thank-you line.

Subtotal SHALL be `servicesSubtotal` plus `productsSubtotal` only when products are printed. The customer phone SHALL be formatted from the E.164 field, never rendered from the bare national number.

#### Scenario: Paid order with tax and tip
- **WHEN** a paid order with services, add-ons, a discount, a tip and a non-zero sales tax is printed
- **THEN** the receipt SHALL show a Subtotal row and a Sales tax row, and `Subtotal + Sales tax + Tip − Discount` SHALL equal the printed Total

#### Scenario: Customer phone formatting
- **WHEN** the order carries a customer phone
- **THEN** the receipt SHALL render it formatted from the E.164 value

### Requirement: Receipt settings are stored per device
Printer transport, paper width, last-test result, and the receipt options (`printProducts`, `sortServices`, `cardCopies`, `otherCopies`) SHALL be persisted per device, not per business. Copy counts SHALL be clamped to 0..3 inclusive. All reads, writes, normalization and clamping SHALL happen in a single repository; no component SHALL read or write device storage for these values directly.

#### Scenario: Settings survive a reload
- **WHEN** the operator changes a receipt option, saves, and reloads the page
- **THEN** the saved value SHALL be shown

#### Scenario: Settings are visible on another route without a reload
- **WHEN** receipt settings are saved on the printer setup route
- **THEN** the checkout screen SHALL read the new values without a page reload

#### Scenario: Corrupt or missing stored data
- **WHEN** the stored value is missing or is not valid JSON
- **THEN** the repository SHALL return the documented defaults and SHALL report the failure through the logger

#### Scenario: Out-of-range copy counts
- **WHEN** a stored copy count is negative or above 3
- **THEN** the repository SHALL clamp it into 0..3

### Requirement: Print options honored by the document, not the surface
`printProducts` and `sortServices` SHALL be applied inside `buildPosReceiptDocument()` so that every print surface honors them identically. With `printProducts` false the product detail group SHALL be omitted and `productsSubtotal` SHALL be excluded from Subtotal. With `sortServices` true the groups and their lines SHALL be ordered deterministically, so that repeated builds of the same order produce byte-identical output.

#### Scenario: Products excluded
- **WHEN** `printProducts` is false
- **THEN** the receipt SHALL NOT list product lines, and Subtotal SHALL NOT include `productsSubtotal`

#### Scenario: Deterministic ordering
- **WHEN** `sortServices` is true and the document is built twice from the same order
- **THEN** both documents SHALL have identical row ordering

### Requirement: PassPRNT invocation
When the selected transport is PassPRNT, printing SHALL navigate to `starpassprnt://v1/print/nopreview` with `back`, `html`, `size`, `cut`, `popup` and `timeout` parameters, each URL-encoded. `size` SHALL be expressed in printer dots (576 for an 80 mm roll, 406 for 58 mm), never in millimetres. `back` SHALL be an absolute application URL with a path only and no query string; all state needed to resume SHALL live in the persisted print job rather than in `back`.

#### Scenario: Receipt print URL
- **WHEN** a receipt is printed through PassPRNT on an 80 mm roll
- **THEN** the invoked URL SHALL carry `size=576` and a `back` value that decodes to the front-desk path with no query string

#### Scenario: Test print returns to the printer page
- **WHEN** a test print is started from the printer setup page
- **THEN** the `back` value SHALL decode to the printer setup path

#### Scenario: Oversized payload is not sent
- **WHEN** the encoded receipt HTML exceeds the configured length budget, or the estimated receipt height exceeds the configured pixel budget
- **THEN** the application SHALL NOT navigate to the PassPRNT scheme, SHALL report the condition through the logger, and SHALL fall back to browser printing for that job

### Requirement: Copy queue driven by the PassPRNT callback
Because PassPRNT prints one document per invocation, a multi-copy job SHALL be persisted and advanced only by the PassPRNT return callback. On a success code the completed-copy count SHALL be incremented and the next copy fired; on any other code the job SHALL be cleared without retrying. Each copy SHALL be fired at most once. The callback parameters SHALL be stripped from the URL using history replacement, and a job SHALL never be advanced by a page load that carries no callback code.

#### Scenario: Second copy prints
- **WHEN** PassPRNT returns a success code and the job still has copies remaining
- **THEN** the next copy SHALL be fired exactly once and the operator SHALL be told which copy is printing

#### Scenario: Failure does not retry
- **WHEN** PassPRNT returns a non-success code
- **THEN** the job SHALL be cleared, an error naming that code SHALL be surfaced, and no further copy SHALL be fired

#### Scenario: Manual reload does not reprint
- **WHEN** the operator reloads the page while a job is pending and the URL carries no callback code
- **THEN** nothing SHALL be printed

#### Scenario: Print never started
- **WHEN** a pending job is older than the configured staleness window and no callback has arrived
- **THEN** the job SHALL be cleared and the operator SHALL be prompted to check that the companion print app is installed

### Requirement: Automatic printing after checkout completion
When the operator selects the Print receipt option and the order completes successfully, the receipt SHALL be printed automatically without further interaction. The number of copies SHALL come from the card copy count for card payments and from the other copy count for every other payment method; a count of zero SHALL print nothing. Printed amounts SHALL be the values confirmed by the completion response, not the pre-submission screen state. Automatic printing SHALL happen at most once per completed order.

#### Scenario: Card payment prints the configured copies
- **WHEN** an order is completed by card with the Print option selected and a card copy count of 2
- **THEN** exactly one print job of 2 copies SHALL be started, after the completion result has been applied

#### Scenario: Zero copies prints nothing
- **WHEN** an order is completed by cash with the Print option selected and an other-copy count of 0
- **THEN** no print SHALL be started and the success screen SHALL still be shown

#### Scenario: Other receipt options do not print
- **WHEN** an order is completed with the SMS or No-receipt option
- **THEN** no print SHALL be started

#### Scenario: Repeated completion attempts
- **WHEN** the Complete action is triggered twice in rapid succession
- **THEN** the receipt SHALL be printed at most once

#### Scenario: Print failure leaves a manual path
- **WHEN** the print transport fails after a successful completion
- **THEN** the failure SHALL be surfaced and logged, and the success screen with its manual print action SHALL remain available

### Requirement: Manual prints are single-copy
Every operator-initiated print — the pre-payment preview, the post-payment print action, and re-printing a completed order — SHALL print exactly one copy and SHALL NOT create a resumable copy queue.

#### Scenario: Re-print from a completed order
- **WHEN** the operator re-prints a completed order
- **THEN** exactly one copy SHALL be printed and no pending job SHALL be persisted

### Requirement: Browser transport prints copies in one dialog
When the selected transport is browser printing, a multi-copy request SHALL be satisfied by a single browser print invocation whose document contains the copies separated by page breaks, rather than by repeated invocations. The printable document SHALL be mounted outside the application root so that the existing print rule hiding the application root does not hide it.

#### Scenario: Two copies, one dialog
- **WHEN** two copies are printed through the browser transport
- **THEN** the browser print dialog SHALL be opened once and the document SHALL contain two page-broken copies

#### Scenario: No trailing blank page
- **WHEN** a receipt is printed through the browser transport
- **THEN** the output SHALL NOT contain a trailing blank page

### Requirement: Printer setup page
The application SHALL provide a POS printer setup page, reachable from the POS navigation, that lets the operator choose the print transport, reach the companion app installation, run a test print, and edit the receipt options. The page SHALL show the outcome, code and timestamp of the last test print. It SHALL NOT claim to detect installed applications, SHALL NOT list discovered printers, and SHALL NOT display live printer status, because the web platform exposes none of those.

#### Scenario: Choosing browser printing
- **WHEN** the operator selects the browser print transport
- **THEN** the choice SHALL be persisted for this device and the companion-app steps SHALL be hidden

#### Scenario: Last test outcome
- **WHEN** a test print has previously succeeded
- **THEN** the page SHALL show a success outcome with the recorded timestamp

#### Scenario: Last test failure
- **WHEN** a test print has previously failed with a device connection error
- **THEN** the page SHALL show the message that corresponds to that error code

#### Scenario: Copy count bounds in the UI
- **WHEN** the operator tries to decrease a copy count below 0 or increase it above 3
- **THEN** the value SHALL stay within 0..3

#### Scenario: Unsaved changes are visible
- **WHEN** the operator changes a receipt option without saving
- **THEN** the page SHALL indicate that there are unsaved changes, and SHALL indicate all changes saved after a successful save

### Requirement: Receipt HTML is self-contained and injection-safe
The HTML handed to the companion print app SHALL be a self-contained HTML5 document with inline styles, sized in pixels derived from the configured printer dot width, and SHALL NOT depend on application stylesheets. Every interpolated value SHALL be HTML-escaped. The document SHALL disable automatic telephone-number detection.

#### Scenario: Markup in a customer name
- **WHEN** a customer name contains HTML markup
- **THEN** the generated document SHALL render it as literal text

#### Scenario: Phone number is not linkified
- **WHEN** the receipt document is generated
- **THEN** it SHALL declare that telephone-number detection is disabled

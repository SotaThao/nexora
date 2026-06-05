# Specification: Customer Tipping & Review Flow

## Purpose
This specification defines the customer-facing tipping and review flow (accessible via `?flow=customer`), detailing staff selection, tip amount input, payment method selection, wallet details display, transaction/review persistence, sentiment and tag chip calculations, and external review routing.

## Requirements

### Requirement: Staff Selection & Flow Entry
The system SHALL display the staff directory or pre-select staff based on entry query parameters.

#### Scenario: Renders active staff directory
- **WHEN** the user opens the customer flow without a pre-selected staff ID
- **THEN** the system SHALL display the select_staff screen containing only active staff members

#### Scenario: Pre-select staff via URL parameter
- **WHEN** the user opens the customer flow with a valid tech query parameter (e.g. `?tech=staff/MIA0123`)
- **THEN** the system SHALL skip the staff selection step and navigate directly to the tip amount step for that staff

#### Scenario: Search staff in directory
- **WHEN** the user enters search criteria in the staff selection search input
- **THEN** the system SHALL filter the list of staff members by name, nickname, or position

#### Scenario: Select multiple staff members
- **WHEN** the user selects multiple staff members in the directory
- **THEN** the system SHALL checkmark each selected provider and set the default tip amount for each

#### Scenario: Next disabled when no staff is selected
- **WHEN** no staff members are selected in the directory
- **THEN** the system SHALL disable the Next button

#### Scenario: Inactive touchpoint blocks flow
- **WHEN** the user enters the flow via a touchpoint query parameter whose station is inactive
- **THEN** the system SHALL display a station inactive error page and block the flow

### Requirement: Tip Amount Specification
The system SHALL allow configuring tip amounts per provider using preset or custom amounts.

#### Scenario: Preset tip amounts selection
- **WHEN** the user selects a preset tip amount button (e.g., $5, $10, $15, $20, $30) for a provider
- **THEN** the system SHALL update the tip amount for that provider

#### Scenario: Custom decimal tip amount
- **WHEN** the user enters a custom decimal value greater than 0
- **THEN** the system SHALL update the tip amount and allow proceeding to payment

#### Scenario: Invalid custom tip amount validation
- **WHEN** the user attempts to proceed with an invalid or empty custom tip amount (e.g., 0, negative, or text)
- **THEN** the system SHALL block navigation and show a validation error

#### Scenario: Responsive flow header title
- **WHEN** the user configures tips for a single versus multiple staff members
- **THEN** the system SHALL adjust the page title to display the single staff nickname or a generic multiple provider title

#### Scenario: Conditional back button availability
- **WHEN** the user accesses the tip amount step
- **THEN** the system SHALL display the Back button only if the staff was not pre-selected via URL parameters

### Requirement: Payment Methods Display
The system SHALL resolve payment methods based on the selected staff's accounts or merchant defaults.

#### Scenario: Display staff-specific payout accounts
- **WHEN** a single staff member with configured payment accounts is selected
- **THEN** the system SHALL display only that staff member's active wallet options

#### Scenario: Fallback to merchant payout accounts
- **WHEN** the selected staff has no payment accounts or when multiple staff members are selected
- **THEN** the system SHALL display the merchant's default wallet options

#### Scenario: Select wallet and generate reference
- **WHEN** the user selects a wallet method
- **THEN** the system SHALL generate a random reference number and advance to the wallet details view

#### Scenario: Graceful empty state when no wallets exist
- **WHEN** neither the staff nor the merchant has any configured payment accounts
- **THEN** the system SHALL render a graceful empty state message instead of crashing

### Requirement: Wallet Details Display & Confirmation
The system SHALL present settlement details and reference instructions to facilitate payments.

#### Scenario: Display recipient settlement details
- **WHEN** the user views the wallet details step
- **THEN** the system SHALL display the correct recipient name and configured payment identifier (or "N/A" if missing)

#### Scenario: Reference note format
- **WHEN** the user views the reference note instruction for single versus multiple tips
- **THEN** the system SHALL display `TIP-<NICKNAME>-<ref>` for single, or `TIP-NEXORA-<ref>` for multiple providers

#### Scenario: QR code preview display
- **WHEN** the user selects a payment method with a configured payout QR code
- **THEN** the system SHALL render the QR scan image on the details panel

#### Scenario: Copy payout details
- **WHEN** the user clicks copy on the recipient name, account number, or reference note
- **THEN** the system SHALL copy the value to the clipboard and show confirmation feedback

#### Scenario: Confirm payment sent
- **WHEN** the user clicks the "I Sent The Tip" confirmation button
- **THEN** the system SHALL display a processing screen for 1.8 seconds and then navigate to the success payment view

### Requirement: Transaction and Review Records Persistence
The system SHALL register completed tips and reviews to the local database and dispatch notifications.

#### Scenario: Success screen display
- **WHEN** the user completes a tip transaction
- **THEN** the system SHALL render the success view displaying checkmarks, provider names, and the tip total

#### Scenario: Transaction record persistence
- **WHEN** the user clicks "I Sent The Tip"
- **THEN** the system SHALL write a transaction success record under the transactions list in local storage for each provider

#### Scenario: Dispatch tip notifications
- **WHEN** a transaction is registered
- **THEN** the system SHALL write a new tip notification to the notifications list in local storage

#### Scenario: Touchpoint source label resolution
- **WHEN** a transaction is written
- **THEN** the system SHALL resolve the touchpoint name source as staff QR, custom touchpoint, or lobby welcome QR based on URL parameters

### Requirement: Customer Review Collection
The system SHALL gather customer ratings, tag selections, and feedback comments.

#### Scenario: Star rating selection and labels
- **WHEN** the user selects a star rating from 1 to 5
- **THEN** the system SHALL display the corresponding rating label (Terrible to Amazing)

#### Scenario: Sentiment threshold resets feedback form
- **WHEN** the user toggles the rating between high (4+) and low (<4) stars
- **THEN** the system SHALL clear the comment input and selected tags to prevent sentiment mismatch

#### Scenario: Tag chips and comment sync
- **WHEN** the user clicks tag chips or types matching text in the comment input
- **THEN** the system SHALL sync the selected tag state with the comment text

#### Scenario: Submit high rating review links
- **WHEN** the user submits a review rating of 4 stars or higher
- **THEN** the system SHALL redirect them to the external review links step

#### Scenario: Submit low rating feedback internal
- **WHEN** the user submits a review rating below 4 stars
- **THEN** the system SHALL bypass the external reviews step and navigate directly to the final thank you page

#### Scenario: Review record persistence
- **WHEN** the user submits feedback
- **THEN** the system SHALL write a review record under the reviews list in local storage and create a review notification

#### Scenario: Empty comment fallback default
- **WHEN** the user submits a review without entering a comment
- **THEN** the system SHALL write a default placeholder text based on the rating sentiment

#### Scenario: Skip review submission
- **WHEN** the user clicks the Skip button on the review step
- **THEN** the system SHALL navigate forward without writing a review record

### Requirement: External Reviews & Final Reset
The system SHALL present third-party review links and support resetting the flow.

#### Scenario: Google and Yelp review links redirection
- **WHEN** the user selects Google or Yelp links or clicks "Maybe later"
- **THEN** the system SHALL open the external page in a new browser tab or route to the final thank you page

#### Scenario: Final thank you page reset and localization
- **WHEN** the user clicks Reset on the final page or toggles the language switch
- **THEN** the system SHALL restore the flow to its initial state or translate all flow elements accordingly

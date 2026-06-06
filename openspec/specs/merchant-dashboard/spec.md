# Specification: Merchant Dashboard

## Purpose
This specification defines the merchant dashboard requirements for business owners, including navigation and shell layout, data overview, staff management, tip tracking across tabs, reviews management, reporting, touchpoint/device control, support tickets, and KYB gating.

## Requirements

### Requirement: Dashboard Shell & Navigation
The system SHALL provide a responsive navigation shell with a sidebar on desktop and a drawer on mobile to access the 9 core dashboard sections.

#### Scenario: Renders sidebar navigation on desktop
- **WHEN** the dashboard is loaded on a viewport width of 1024px or higher
- **THEN** the left sidebar SHALL display the profile card, current plan card, 9 navigation items, and a Sign Out button

#### Scenario: Navigate dashboard sections
- **WHEN** the user selects any dashboard section in the navigation menu
- **THEN** the system SHALL render the corresponding section view without a full page reload

#### Scenario: Expandable Tips submenu
- **WHEN** the user selects the Tips item in the navigation menu
- **THEN** the system SHALL expand the submenu to display Overview, Direct Savings, Tip Transactions, and Staff Payouts

#### Scenario: Expandable Touchpoints submenu
- **WHEN** the user selects the Touchpoints item in the navigation menu
- **THEN** the system SHALL expand the submenu to display QR Stations and Hardware Devices

#### Scenario: Sidebar drawer on mobile
- **WHEN** the user opens the menu on a viewport width below 1024px
- **THEN** the system SHALL open a slide-out drawer containing the same navigation menu and close it upon selecting a link or clicking the backdrop

#### Scenario: Profile card shortcuts
- **WHEN** the user clicks the profile card in the sidebar
- **THEN** the system SHALL expand it to show Business Settings and KYB Portal shortcuts

#### Scenario: Current Plan display by verification status
- **WHEN** the dashboard is loaded with kyb_approved status versus other statuses
- **THEN** the Current Plan card SHALL display "Pro Plan" for kyb_approved accounts and "No current plan" for other statuses

#### Scenario: Global search function
- **WHEN** the user enters a search term in the global header search input
- **THEN** the system SHALL display matches grouped by staff, transactions, reviews, or touchpoints, and navigate to the selected result on click

#### Scenario: Header notifications dropdown
- **WHEN** the user interacts with the notifications bell in the header
- **THEN** the system SHALL display unread notifications, mark them as read upon click or through "Mark All as Read", and persist this state

#### Scenario: Dashboard translation
- **WHEN** the user toggles the language switch in the header
- **THEN** the system SHALL translate the sidebar navigation, layout text, and active view content

#### Scenario: Sign out action
- **WHEN** the user clicks the Sign Out button
- **THEN** the system SHALL clear the active session and return to the login view

#### Scenario: Reset app simulation
- **WHEN** the user clicks the floating Reset App button and confirms
- **THEN** the system SHALL clear all merchant configurations and redirect to the login view

### Requirement: Business Metrics Overview
The system SHALL aggregate and display business KPIs and transaction charts on the primary Dashboard overview page.

#### Scenario: KPI metrics rendering
- **WHEN** the user opens the Dashboard overview page
- **THEN** the system SHALL display cards showing Total Tips, Transactions count, Avg Tip, Reviews, ratings, response rate, and returning customer metrics

#### Scenario: Tips-over-time trend chart
- **WHEN** the user switches the chart time range (e.g., 7, 30, 90, 180, 365 days)
- **THEN** the system SHALL re-render the trends line chart to reflect the selected time frame

#### Scenario: Staff performance leaderboard
- **WHEN** the user views the Dashboard overview page
- **THEN** the system SHALL show a staff leaderboard aggregating tip amounts and ratings, highlighting selected rows on click

#### Scenario: Overview quick action links
- **WHEN** the user clicks quick links like "View Touchpoints" or "View Reviews" on the overview
- **THEN** the system SHALL navigate to the corresponding dashboard section

### Requirement: Staff Directory Management
The system SHALL support managing active and pending staff members, setting payment information, and monitoring staff reviews.

#### Scenario: Staff KPIs listing
- **WHEN** the user opens the Staff section
- **THEN** the system SHALL display stats showing Total Linked, Pending Invites, Payment Setup %, and Self-Setup status

#### Scenario: Shareable staff signup link
- **WHEN** the user views the join invitation card
- **THEN** the system SHALL provide a copyable signup URL and a QR code that expands on click

#### Scenario: Approve pending staff request
- **WHEN** the user approves a pending staff member and saves the details form
- **THEN** the system SHALL update their status to Active and create their personal QR touchpoint

#### Scenario: Decline pending staff request
- **WHEN** the user declines a pending staff invitation
- **THEN** the system SHALL remove them from the pending list and delete any associated touchpoint

#### Scenario: Toggle staff active status
- **WHEN** the user switches a staff member's active toggle
- **THEN** the system SHALL persist the active state and block customer scans for inactive staff

#### Scenario: Toggle staff tip flow visibility
- **WHEN** the user toggles a staff member's visibility in the customer tipping flow
- **THEN** the system SHALL hide or show them in the customer-facing staff selection screen

#### Scenario: Edit active staff details
- **WHEN** the user edits and saves a staff member's details
- **THEN** the system SHALL validate the inputs (requiring full name and nickname) and persist the changes

#### Scenario: Staff avatar upload
- **WHEN** the user uploads a photo during staff configuration
- **THEN** the system SHALL render a circular preview of the image

#### Scenario: Staff payment configuration and VLINKPAY validation
- **WHEN** the user enters a VLINKPAY ID for a staff member
- **THEN** the system SHALL trigger a debounced validation check and display the status feedback

#### Scenario: Monitor staff reviews and ratings
- **WHEN** the user views the reviews tab in the staff configuration modal
- **THEN** the system SHALL show the staff member's average rating and support filtering by rating and source

#### Scenario: Delete staff member
- **WHEN** the user deletes an active staff member and confirms
- **THEN** the system SHALL remove the staff record and delete their personal QR touchpoint

#### Scenario: Link existing Staff ID
- **WHEN** the user searches for and links an existing Staff ID
- **THEN** the system SHALL create a pending link request and generate their personal QR touchpoint

#### Scenario: Link already-linked staff ID error
- **WHEN** the user attempts to link a Staff ID that is already on the salon's roster
- **THEN** the system SHALL display an error message

#### Scenario: Invite new staff via SMS or Email
- **WHEN** the user submits a new staff invitation with contact details
- **THEN** the system SHALL create a pending setup staff entry, generate a personal QR, and display a simulation toast

#### Scenario: Invite contact details validation
- **WHEN** the user submits a staff invitation with blank name or invalid contact format
- **THEN** the system SHALL display validation errors and block submission

#### Scenario: Simulation invite toast action
- **WHEN** the user clicks the action on the invitation simulation toast
- **THEN** the system SHALL route to the staff registration portal with the invite details prefilled

#### Scenario: View staff detail stats and charts
- **WHEN** the user views a staff member's detail page
- **THEN** the system SHALL show their tip trends chart, filterable reviews, and recent transactions list

#### Scenario: Preview and simulate touchpoint QR
- **WHEN** the user opens a touchpoint QR modal and clicks Simulate Customer View
- **THEN** the system SHALL open the customer tipping flow in a new browser tab with the touchpoint context

### Requirement: Tips Analysis Tabs
The system SHALL aggregate tips by overview statistics, savings calculation, transaction search, and payouts.

#### Scenario: Tips overview statistics
- **WHEN** the user views the Tips Overview tab
- **THEN** the system SHALL display cards for P2P/Card/Crypto splits, a weekly trends chart, and a payment-method distribution chart

#### Scenario: Fee savings calculator
- **WHEN** the user adjusts the volume and fee percentage sliders in the Savings tab
- **THEN** the system SHALL calculate and display the avoided fees and show the direct transaction table

#### Scenario: Search tip transactions
- **WHEN** the user enters search criteria in the Tip Transactions tab
- **THEN** the system SHALL perform a case-insensitive search across transaction IDs, staff, touchpoint, and payment methods

#### Scenario: Staff payouts aggregation
- **WHEN** the user views the Staff Payouts tab
- **THEN** the system SHALL display payout totals, methods, and status aggregated per staff member

### Requirement: Reviews Management
The system SHALL aggregate reviews and support source-based and rating-based filtering.

#### Scenario: Filter reviews list
- **WHEN** the user filters reviews by source, low stars, or staff member
- **THEN** the system SHALL display matching reviews showing ratings, comments, categories, and timestamps

#### Scenario: External review source link
- **WHEN** the user clicks on an external review card link (e.g. Google or Yelp)
- **THEN** the system SHALL open the review source page in a new browser tab

### Requirement: Transaction Reports
The system SHALL provide a table list of transactions with advanced filter controls and date presets.

#### Scenario: Filter transactions table
- **WHEN** the user filters transactions by date ranges, amounts, staff, touchpoint, payment methods, or status
- **THEN** the system SHALL update the data rows and display status-colored badges

#### Scenario: Reset transaction filters
- **WHEN** the user clicks the reset filters button
- **THEN** the system SHALL restore all filters to their default state

#### Scenario: Empty transaction state
- **WHEN** the user applies transaction filters that yield no matches
- **THEN** the system SHALL show a "no transactions matching" message

### Requirement: Touchpoint & Hardware Device Configuration
The system SHALL support configuring QR Stations and registering hardware devices.

#### Scenario: QR Stations listing and KPIs
- **WHEN** the user views the QR Stations tab
- **THEN** the system SHALL display cards showing Total Stations, Scans, and Revenue, alongside the stations list

#### Scenario: Add custom QR Station
- **WHEN** the user adds a new touchpoint station with a valid name and type
- **THEN** the system SHALL append it to the QR stations list

#### Scenario: Update or delete QR Station
- **WHEN** the user toggles a station's active state, links a hardware device, or deletes a station
- **THEN** the system SHALL update the station's configuration state or delete it from the listing

#### Scenario: Hardware devices registration
- **WHEN** the user adds a new device specifying its ID, location, and type (e.g. NFC Stand, Sticker, QR Card)
- **THEN** the system SHALL validate the inputs and append it to the hardware devices list

#### Scenario: Manage and export hardware devices
- **WHEN** the user toggles, deletes, or exports hardware devices
- **THEN** the system SHALL update the device list and show a success confirmation toast on export

### Requirement: Analytics & Support
The system SHALL display analytics charts and process support tickets.

#### Scenario: Analytics metrics and charts
- **WHEN** the user views the Analytics section
- **THEN** the system SHALL render metric cards, wallet share charts, and performance leaderboards

#### Scenario: Submit support ticket
- **WHEN** the user submits a support ticket with a valid subject and description
- **THEN** the system SHALL display a confirmation toast and clear the ticket form

#### Scenario: Display coming soon placeholders
- **WHEN** the user accesses features that are under development (e.g., Subscriptions)
- **THEN** the system SHALL render a coming soon placeholder card with a return action

### Requirement: KYB Gating and Realtime Storage Sync
The system SHALL restrict access to gated features based on KYB status and synchronize configurations in real time.

#### Scenario: Gate features by KYB verification status
- **WHEN** a user on an unverified account attempts to access a KYB-gated dashboard feature
- **THEN** the system SHALL block access and display the KYB Required modal

#### Scenario: Cross-tab dashboard synchronization
- **WHEN** a change is saved in one tab of the dashboard
- **THEN** the system SHALL synchronize and update the configuration state in other active dashboard tabs

## ADDED Requirements

### Requirement: Responsive staff shell
The staff dashboard SHALL present a left sidebar on desktop (≥1024px) and a bottom navigation bar on mobile (<1024px), reusing the NEXORA design tokens (not the raw reference HTML styling).

#### Scenario: Desktop shows sidebar
- **WHEN** the staff dashboard renders at a viewport ≥1024px
- **THEN** a left sidebar with brand, profile, navigation, and sign-out is shown and the bottom navbar is hidden

#### Scenario: Mobile shows bottom navbar
- **WHEN** the staff dashboard renders at a viewport <1024px
- **THEN** a fixed bottom navigation bar is shown and the desktop sidebar is hidden

### Requirement: Bottom navbar reflects the staff menu
The bottom navigation bar SHALL contain the tabs Home, My QR, Tips, Pay, and Profile, matching the reference app's menu content.

#### Scenario: Bottom navbar tabs
- **WHEN** the bottom navigation bar is shown
- **THEN** it lists exactly Home, My QR, Tips, Pay, and Profile, with the active tab visually highlighted

### Requirement: Header with brand, language, notifications, and profile
The staff dashboard SHALL show a header with the NEXORA brand, a VI/EN language switch, a notifications bell, and a profile control.

#### Scenario: Notifications open from the bell
- **WHEN** the user activates the notifications bell in the header
- **THEN** the Notifications screen (or its panel) opens

### Requirement: Navigation switches screens
Selecting a navigation item SHALL switch the active screen among Home, My QR, Tips, Pay, Profile, and Notifications without a full page reload.

#### Scenario: Switching tabs updates the active screen
- **WHEN** the user selects a different navigation item
- **THEN** the corresponding screen is shown and the selected item is marked active

### Requirement: Localized navigation labels
All navigation labels and screen titles SHALL be rendered via i18n in both English and Vietnamese, with no hardcoded strings.

#### Scenario: Switching language updates labels
- **WHEN** the user switches between VI and EN
- **THEN** all navigation labels and titles update to the selected language

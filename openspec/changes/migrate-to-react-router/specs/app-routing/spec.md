## ADDED Requirements

### Requirement: Top-level page routes

The system SHALL expose each top-level page at a stable URL using React Router v6 `<BrowserRouter>`, replacing the `view` useState state-machine. The routes SHALL be: `/login`, `/register`, `/forgot-password`, `/reset-password`, and `/onboarding`.

#### Scenario: Direct navigation to a page URL

- **WHEN** an unauthenticated user opens `/login`, `/register`, or `/forgot-password` directly
- **THEN** the corresponding screen renders without first showing any other screen

#### Scenario: Refresh preserves the current page

- **WHEN** the user is on `/register` and reloads the browser
- **THEN** the register screen renders again (not the login screen)

#### Scenario: Reset-password keeps its query contract

- **WHEN** the user opens `/reset-password?token=<t>&email=<e>`
- **THEN** the ResetPassword screen renders and reads `token` and `email` from the query string exactly as before

### Requirement: Authenticated landing redirect

The root path `/` SHALL redirect based on the authenticated session read from `useAuth()`: anonymous → `/login`; owner (`!business`) → `/dashboard`; staff (`!personal`/`role` staff) → `/staff`. While the auth status is resolving, a loading indicator SHALL be shown rather than a premature redirect.

#### Scenario: Anonymous visitor at root

- **WHEN** an unauthenticated user opens `/`
- **THEN** they are redirected to `/login`

#### Scenario: Owner session at root

- **WHEN** an authenticated owner opens `/`
- **THEN** they are redirected to `/dashboard`

#### Scenario: Staff session at root

- **WHEN** an authenticated staff user opens `/`
- **THEN** they are redirected to `/staff`

#### Scenario: Auth still resolving

- **WHEN** `/` is opened and `useAuth().status` is still `loading`
- **THEN** a loading screen is shown until the status resolves, and only then is the redirect applied

### Requirement: Route guards for protected areas

Protected routes SHALL be wrapped by a guard that reads `useAuth()`. An unauthenticated user reaching a protected route SHALL be redirected to `/login`. A user whose role does not match the area SHALL be redirected to their correct dashboard. The guard SHALL render a loading state while auth status is `loading`.

#### Scenario: Unauthenticated access to dashboard

- **WHEN** an unauthenticated user opens `/dashboard/staff`
- **THEN** they are redirected to `/login`

#### Scenario: Staff user accessing owner dashboard

- **WHEN** an authenticated staff user opens `/dashboard`
- **THEN** they are redirected to `/staff`

#### Scenario: Owner user accessing staff area

- **WHEN** an authenticated owner opens `/staff/qr`
- **THEN** they are redirected to `/dashboard`

### Requirement: Onboarding gate

An authenticated owner who has not completed onboarding SHALL be redirected to `/onboarding` when attempting to reach `/dashboard`. An owner who has completed onboarding SHALL reach `/dashboard` normally.

#### Scenario: Owner needs onboarding

- **WHEN** an authenticated owner who has not completed onboarding opens `/dashboard`
- **THEN** they are redirected to `/onboarding`

#### Scenario: Onboarding completion enters dashboard

- **WHEN** the owner finishes the onboarding wizard
- **THEN** the app navigates to `/dashboard`

### Requirement: Nested owner-dashboard routes

The owner dashboard SHALL render as a layout (sidebar, header, mobile drawer, modals) with an `<Outlet>` for the active section, and each sub-menu SHALL be addressable as a nested route under `/dashboard`: `overview` (index), `staff`, `staff/:staffId`, `tips`, `reviews`, `reports`, `touchpoints`, `analytics`, `settings`, `settings/:tab`, `subscriptions`, and `support`. The active sidebar menu SHALL be derived from the URL, and an unknown sub-path SHALL render the existing "coming soon" fallback.

#### Scenario: Navigating a sub-menu updates the URL

- **WHEN** the user clicks the "Staff" item in the dashboard sidebar
- **THEN** the URL becomes `/dashboard/staff` and the staff view renders with the sidebar highlighting "Staff"

#### Scenario: Direct deep-link to a sub-menu

- **WHEN** the user opens `/dashboard/touchpoints` directly
- **THEN** the dashboard layout renders with the touchpoints view active

#### Scenario: Staff detail drilldown

- **WHEN** the user opens a staff member's detail from the staff list
- **THEN** the URL becomes `/dashboard/staff/:staffId` and the staff detail view renders, and the back action returns to `/dashboard/staff`

#### Scenario: Hidden subscriptions target

- **WHEN** the user activates the "subscriptions" menu target
- **THEN** `/dashboard/subscriptions` renders the existing coming-soon view rather than a blank screen

#### Scenario: Settings tab as a nested param

- **WHEN** the user opens `/dashboard/settings/kyb`
- **THEN** the settings view renders with the KYB tab active (fed via the existing `initialTab` prop)

#### Scenario: Settings index defaults to profile

- **WHEN** the user opens `/dashboard/settings` with no tab segment
- **THEN** the settings view renders with the profile tab active

### Requirement: Dashboard sub-tabs as query params

The tips and touchpoints sub-tabs SHALL be encoded as the `tab` query parameter (e.g. `/dashboard/tips?tab=savings`, `/dashboard/touchpoints?tab=devices`) and SHALL default to the existing default tab when absent. Switching these sub-tabs SHALL replace the history entry to avoid back-button noise.

#### Scenario: Tips sub-tab via query

- **WHEN** the user opens `/dashboard/tips?tab=savings`
- **THEN** the tips view renders with the savings tab active

#### Scenario: Sub-tab default

- **WHEN** the user opens `/dashboard/tips` with no `tab` query
- **THEN** the tips view renders with its default tab active

#### Scenario: Sub-tab switch replaces history

- **WHEN** the user switches the touchpoints sub-tab from stations to devices
- **THEN** the URL gains `?tab=devices` using a history replace (a single browser back returns to the previous section, not the previous sub-tab)

### Requirement: Nested staff-dashboard routes

The staff dashboard SHALL render as a layout (sidebar, header, bottom nav) with an `<Outlet>`, and each screen SHALL be addressable: `/staff` (home index), `/staff/qr`, `/staff/tips`, `/staff/reviews`, `/staff/pay`, `/staff/profile`, `/staff/notifications`. The active screen SHALL be derived from the URL, and `staffId` SHALL be read from the authenticated session rather than passed from the app shell.

#### Scenario: Navigating a staff screen updates the URL

- **WHEN** the staff user taps "My QR" in the bottom nav
- **THEN** the URL becomes `/staff/qr` and the QR screen renders with the nav highlighting it

#### Scenario: Direct deep-link to a staff screen

- **WHEN** the staff user opens `/staff/pay` directly
- **THEN** the staff dashboard layout renders with the payments screen active

### Requirement: Public deep-link routes

Public routes SHALL be reachable without authentication and SHALL NOT be hijacked by session auto-restore: `/touch/:businessSlug/:touchPointSlug` (customer tipping/review), `/invite/:token` (canonical staff invite). The customer flow SHALL continue to read `businessSlug`, `touchPointSlug`, and `sessionId` exactly as the current `useCustomerFlow` does, with no API behavior change.

#### Scenario: Authenticated owner opens a customer touch link

- **WHEN** an authenticated owner opens `/touch/acme/station-1`
- **THEN** the customer tipping flow renders for that touchpoint (the owner is NOT redirected to their dashboard)

#### Scenario: Staff invite token link

- **WHEN** anyone opens `/invite/<token>`
- **THEN** the staff registration portal renders with the token available, regardless of authentication state

### Requirement: Legacy deep-link compatibility

The system SHALL preserve the behavior of externally-issued links that predate the route migration, so already-distributed emails/QRs keep working: `?action=verify-email&token=<t>&email=<e>`, `?action=reset-password`, `?flow=staff-invite&biz=<name>`, and the legacy path `/staff/invite/:token`. The legacy `/staff/invite/:token` route SHALL resolve to the staff invite portal and MUST NOT be captured by the authenticated `/staff` dashboard area.

#### Scenario: Email verification link

- **WHEN** a user opens `?action=verify-email&token=<t>&email=<e>`
- **THEN** the app calls the existing `verifyEmail` adapter and then lands on `/login`, with the action params removed from the URL

#### Scenario: Reset-password action link

- **WHEN** a user opens `?action=reset-password`
- **THEN** the app navigates to `/reset-password`

#### Scenario: Staff-invite query link

- **WHEN** a user opens `?flow=staff-invite&biz=<name>`
- **THEN** the staff invite portal renders carrying the business name, identical to the prior behavior

#### Scenario: Legacy staff invite path

- **WHEN** a user opens `/staff/invite/<token>`
- **THEN** the staff invite portal renders with the token, and the authenticated staff dashboard does NOT capture this path

### Requirement: Browser navigation support

Browser back, forward, and bookmarking SHALL work across all routes, including nested dashboard sub-views and staff screens. Imperative navigation SHALL use the router (`navigate`), and any prior `window.history.replaceState` usage SHALL be replaced with `navigate(..., { replace: true })` so the router stays in sync.

#### Scenario: Back button between sub-views

- **WHEN** the user navigates `/dashboard` → `/dashboard/staff` → `/dashboard/reports` and presses browser Back twice
- **THEN** they return to `/dashboard/staff` then `/dashboard`, with the correct view rendered at each step

#### Scenario: Return to merchant after staff portal

- **WHEN** the staff-portal "return to merchant" action runs
- **THEN** the app navigates to `/dashboard` via the router (replace) without a full page reload

### Requirement: KYB-required gate via router

The "KYB verification required" prompt SHALL be provided by a small shared context (`KybGateContext`) usable from both the onboarding and dashboard areas. Its "Verify Now" action SHALL navigate to `/dashboard/settings/kyb`. The obsolete `preKybView` return-tracking SHALL be removed (browser history handles return navigation).

#### Scenario: Verify Now navigates to KYB settings

- **WHEN** a feature triggers the KYB-required gate and the user clicks "Verify Now"
- **THEN** the app navigates to `/dashboard/settings/kyb`

#### Scenario: Dismiss keeps the user in place

- **WHEN** the user dismisses the KYB-required gate
- **THEN** the modal closes and the current route is unchanged

### Requirement: Code-splitting preserved

Route screens that are currently lazy-loaded (Dashboard, StaffDashboard, StaffRegistrationWizard, SetupWizard, CustomerFlow, RegisterWizard, ForgotPassword, ResetPassword) SHALL remain lazy-loaded behind a `<Suspense>` boundary with a loading fallback.

#### Scenario: Lazy chunk loads with fallback

- **WHEN** the user first navigates to `/dashboard`
- **THEN** the loading fallback shows while the dashboard chunk loads, then the dashboard renders

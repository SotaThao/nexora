# Desktop Staff Settings Tab Design

**Date:** 2026-08-12

## Goal

Move merchant Staff management from the desktop dashboard sidebar into a Staff tab under Settings, and refresh the full desktop Settings tab UI using the News Library visual language without changing the mobile Staff experience.

## Scope

### In scope

- Remove the Staff entry from the desktop owner sidebar only.
- Add a Staff tab to the desktop Settings page, immediately after Account.
- Restyle the complete desktop Settings tab bar and content shell using the established News Library patterns.
- Show the existing Staff list, pending requests, actions, pagination, and staff detail experience inside that tab.
- Add desktop Settings routes for the Staff list and detail views.
- Preserve existing Staff routes as compatibility and mobile routes.
- Preserve the mobile bottom navigation, mobile drawer, and mobile Staff UI.
- Add focused route, navigation, data-loading, and responsive-boundary tests.

### Out of scope

- Redesigning Staff list or detail UI.
- Adding icons to Settings tabs or forcing the tabs into equal-width grid columns.
- Changing Staff APIs, permissions, mutations, or business rules.
- Restyling mobile Settings.
- Changing any mobile bottom-navigation item.
- Moving POS Staff or personal staff-dashboard screens.

## Route Contract

The route behavior is responsive at the existing `lg` breakpoint used by `useIsMobileUI`.

| Route | Desktop (>= 1024px) | Mobile (< 1024px) |
| --- | --- | --- |
| `/dashboard/settings/staff` | Render Settings with the Staff tab active | Replace-navigate to `/dashboard/staff` |
| `/dashboard/settings/staff/:staffId` | Render Settings with Staff detail inside the Staff tab | Replace-navigate to `/dashboard/staff/:staffId` |
| `/dashboard/staff` | Replace-navigate to `/dashboard/settings/staff` | Render the existing mobile Staff screen |
| `/dashboard/staff/:staffId` | Replace-navigate to `/dashboard/settings/staff/:staffId` | Render the existing mobile Staff detail screen |

Redirects preserve `staffId` and use history replacement so legacy links do not add a redundant browser-history entry. Existing Staff links, bookmarks, notification targets, Tax IQ links, POS links, and mobile navigation therefore remain valid.

React Router will declare the two-segment detail route explicitly. The existing `/dashboard/settings/:tab` route continues to handle the Staff list route through `tab=staff`.

## Desktop Navigation and Settings UI

The desktop sidebar filters out Staff at render time. The shared `MENU_ITEMS` and `MERCHANT_SIDEBAR_MENU_ITEMS` collections remain unchanged because the mobile drawer still consumes them. The desktop Payments & Payouts group currently renders after Staff; move that desktop-only anchor to Dashboard so the group remains visible after Staff is removed.

Desktop Settings adds `staff` to its local tab resolver and renders the tab after Account. Selecting the tab navigates to `/dashboard/settings/staff`. The Staff content reuses the existing Staff list and detail components and their existing callbacks; it does not duplicate API or mutation logic.

### Settings tab visual design

Apply the News Library visual language to the complete desktop Settings tab set: Account, Staff, KYB, Affiliate, and Privacy. The optional Notification tab receives the same styling whenever its existing feature flag is enabled.

- Tabs contain text only; no tab icon is rendered.
- The tab list uses a wrapping flex layout rather than equal-width grid columns.
- Each tab is a compact rounded card with a light border, comfortable horizontal padding, and a clear hover/focus state.
- The active tab uses the NEXORA brand background, white text, a transparent border, and the existing soft NEXORA shadow.
- Inactive tabs use the surface background, muted text, and border; hover moves toward lavender border/text treatment.
- The page header, tab list, and content use the News Library `max-w-6xl` centered width so their edges align.
- The active panel is placed inside a rounded surface card with border, internal spacing, clipped overflow, and the existing card shadow. Existing Staff/Profile/KYB/Affiliate/Privacy content remains functionally unchanged inside that shell.

Use semantic tab behavior equivalent to News Library: `tablist`, `tab`, and `tabpanel` roles; `aria-selected`, `aria-controls`, and roving `tabIndex`; Left/Right arrow keys move focus and activate the adjacent route-backed tab. Clicking or keyboard activation uses the existing Settings route callback, keeping browser navigation and tab state in sync.

On Staff Settings routes:

- the Settings sidebar entry is active;
- the Staff Settings tab is active;
- list-to-detail navigation stays under `/dashboard/settings/staff/...`;
- an invalid detail ID returns to `/dashboard/settings/staff` on desktop and `/dashboard/staff` on mobile.

Mobile Settings does not display a Staff tab. Opening a desktop Staff Settings link on mobile transfers the user to the existing mobile Staff route.

## Data Loading and State

The dashboard currently gates Staff queries and pagination with `activeMenu === 'staff'`. Introduce one derived condition representing the Staff management screen:

- true for `/dashboard/staff...`; or
- true for `/dashboard/settings/staff...`.

Use this condition consistently for:

- merchant Staff list loading and pagination;
- pending and waiting Staff lists;
- invite-link settings;
- Staff-related review data used by Staff details;
- pagination reset behavior; and
- Staff query invalidation on route entry.

General Settings queries remain unchanged. Entering the Staff tab should invalidate/refetch the same Staff query keys as the existing Staff menu rather than broadening all Settings tabs to fetch Staff data.

## Internal Links and Compatibility

Shared links may continue targeting `/dashboard/staff...`; the responsive compatibility route sends desktop users to the Settings location while leaving mobile behavior unchanged. Desktop-only code may target the canonical Settings route directly where that makes the destination unambiguous.

Header search and notification navigation must issue one final Staff destination so a detail target is not overwritten by a subsequent list navigation. Other callers—Overview, leaderboard, Tax IQ, and POS—are covered by the compatibility routes.

## Error Handling

- Unknown Staff IDs use the existing not-found behavior and return to the platform-appropriate Staff list.
- Loading and API-error states continue to use the existing Staff components and query behavior.
- Responsive redirects preserve the current Staff ID and use `replace` to prevent back-button loops.
- A viewport change across the `lg` breakpoint transfers the active Staff list or detail route to its corresponding desktop/mobile location.

## Testing

Focused automated tests will cover:

1. Desktop sidebar omits Staff while the mobile drawer and bottom nav retain Staff.
2. Desktop Settings shows the Staff tab after Account and activates it from `/dashboard/settings/staff`.
3. Desktop Staff list and detail routes render inside Settings.
4. Legacy desktop Staff routes redirect to the corresponding Settings routes, preserving `staffId`.
5. Desktop Settings Staff routes redirect to the corresponding legacy Staff routes on mobile, preserving `staffId`.
6. Staff data gates are enabled for both route families and remain disabled on unrelated Settings tabs.
7. Invalid detail IDs return to the correct list route for the active layout.
8. Existing Staff actions and pagination remain wired to the current handlers.
9. All desktop Settings tabs use the text-only News Library-style tab treatment and render in the required order.
10. Mouse and Left/Right keyboard navigation update the active route-backed Settings tab and its ARIA state.
11. The active Settings panel uses the shared centered card shell while mobile Settings remains unchanged.
12. Removing desktop Staff does not remove the Payments & Payouts group.

After focused tests pass, run type checking and the relevant broader test suite selected by the repository's impact-test tooling.

## Acceptance Criteria

- Desktop users no longer see Staff as a top-level sidebar item.
- Desktop users can manage Staff and open Staff details from the Settings > Staff tab.
- Desktop Settings presents Account, Staff, KYB, Affiliate, and Privacy as text-only News Library-style tabs inside a centered `max-w-6xl` layout.
- The active desktop Settings panel is visually contained by the shared News Library-style card shell.
- Desktop Settings tabs support mouse and Left/Right keyboard navigation with correct tab ARIA state.
- Mobile bottom navigation, mobile drawer, and mobile Staff screens behave exactly as before.
- Mobile Settings styling remains unchanged.
- Payments & Payouts remains available in the desktop sidebar after Staff is removed.
- Existing `/dashboard/staff...` links continue to work on both layouts.
- No Staff query, pending request, invite, pagination, or action functionality regresses.

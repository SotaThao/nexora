# Desktop Staff Settings Tab Walkthrough

## Delivered behavior

- Desktop merchant sidebar hides Staff and keeps Payments & Payouts directly after Dashboard.
- Mobile bottom navigation, mobile drawer, mobile Settings, and mobile Staff views remain on the shared legacy Staff route family.
- Desktop Staff management uses `/dashboard/settings/staff` and `/dashboard/settings/staff/:staffId`.
- Legacy desktop Staff routes replace-navigate to the matching Settings route; Settings Staff routes replace-navigate to legacy Staff on mobile.
- Staff list/detail content and merchant query gates are shared across both route families.
- Desktop Settings renders Account, Staff, Business Verification, Affiliate Link, optional Notifications, and Terms & Privacy through one accessible text-only tab component.
- Desktop Staff search opens the detail destination once and no longer issues a second list navigation.

## Automated verification

- Focused feature suite: 8 files, 24 tests passed.
- Development build: 3,065 modules transformed; Vite build completed successfully.
- `git diff --check`: clean.
- Mobile implementation boundary diff: empty for `MobileBottomNav.tsx`, `DashboardHeader.mobile.tsx`, `StaffView.mobile.tsx`, and `SettingsView.mobile.tsx`.
- Typecheck: feature-introduced errors were removed; the repository command remains red on its pre-existing cross-project error set.
- Full Vitest suite: 53 passed and 12 unrelated assertions failed in existing Pricing, homepage Tax IQ, Manage Plan, Profile payment QR, and Staff payment QR tests.
- Impact and token scripts could not start because their configured repository files are absent:
  - `.agents/skills/feature-focused-tester/scripts/detect-changes.cjs`
  - `scripts/verify-tokens.cjs`

## Browser verification

Verified against the authenticated local desktop app:

- Sidebar contains Dashboard followed by Payments & Payouts and contains no Staff item.
- Settings tab order is Account, Staff, Business Verification, Affiliate Link, Terms & Privacy.
- Staff is selected at `/dashboard/settings/staff`; all five tabs contain text only and zero SVG nodes.
- Tab widths are intrinsic, the tablist wraps with flex behavior, and the active panel measures 1,152 px inside the centered `max-w-6xl` shell at the inspected viewport.
- Staff list content renders inside the shared active panel without redesigning the list itself.
- `/dashboard/staff` redirects to `/dashboard/settings/staff` with Staff selected.
- ArrowRight from Staff moves selection and route to `/dashboard/settings/kyb`.
- No app console errors or warnings were observed during the Staff screen inspection.

## Scope notes

- No Staff APIs, permissions, mutations, or business rules changed.
- No dependencies were added.
- Existing unrelated workspace edits and public News Library work were not staged or modified by this feature.
- The report remains local to the repository; no external message or vault export was authorized.

## Follow-up: active panel surface

- L1/P3 component test passed after first proving RED against the old border utility.
- Settings integration test remained green.
- Browser computed-style verification at `/dashboard/settings/staff` confirmed:
  - border width on all four sides: `0px`
  - padding on all four sides: `0px`
  - background: `rgba(0, 0, 0, 0)`
  - box shadow: `none`
  - panel classes: `overflow-hidden rounded-lg`
- No browser console warnings or errors were observed.

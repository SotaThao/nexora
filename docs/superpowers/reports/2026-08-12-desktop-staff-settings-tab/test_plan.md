# Desktop Staff Settings Tab Test Plan

## Scope

Move merchant Staff management into desktop Settings while retaining legacy Staff routes and all mobile navigation/UI behavior. Refresh every desktop Settings tab with the shared text-only News Library visual language.

## Risk priorities

- **P0:** Desktop/mobile responsive redirects preserve list/detail identity and replace incompatible route families.
- **P0:** Staff data remains enabled and refetches on both legacy and Settings Staff routes.
- **P0:** Desktop Staff search opens one detail destination without being overwritten by list navigation.
- **P1:** Desktop sidebar hides Staff while shared/mobile menu data and mobile bottom navigation retain it.
- **P1:** All desktop Settings tabs render in the approved order with text-only styling, accessible roles, and keyboard activation.
- **P1:** Removing the desktop Staff menu item does not remove Payments & Payouts.
- **P2:** Existing Account, KYB, Affiliate, Privacy, and optional Notification panel behavior remains intact inside the new shell.

## Test layers

### L1 — Pure contracts and component behavior

- Staff path builders for legacy and Settings list/detail paths, including encoded IDs.
- Strict Staff pathname classification and merchant data-menu resolution.
- Settings route normalization and desktop/shared menu collections.
- Responsive route boundary redirect/render behavior at the existing mobile breakpoint hook.
- Desktop Settings tab order, text-only markup, active/inactive tokens, ARIA, roving tab index, focus, arrow-key wrapping, and panel shell.

### L2 — Integration boundaries

- Shared Staff list content navigates within its supplied route family.
- Invalid Staff detail returns to the matching family list.
- Dashboard query gates treat both route families as Staff management. No repository/API contract changes are in scope.
- Settings view activates injected Staff content and emits the canonical Settings tab key.
- Desktop search calls the Staff detail callback without an additional Staff list navigation.

### L3 — User flows and regressions

- Desktop legacy Staff list/detail URLs resolve to canonical Settings Staff URLs.
- Mobile Settings Staff list/detail URLs resolve to the unchanged legacy Staff URLs.
- Desktop sidebar no longer shows Staff; Payments & Payouts remains after Dashboard.
- Mobile bottom navigation still shows Staff, and mobile implementation files receive no feature changes.
- Run focused tests, typecheck, impact detection, full Vitest suite, token lint, and development build.

## Exit criteria

- All P0 and P1 cases pass without unhandled errors.
- Full repository verification succeeds, or any unrelated pre-existing failure is captured with evidence.
- `git diff --check` is clean and mobile-only files show no feature diff.

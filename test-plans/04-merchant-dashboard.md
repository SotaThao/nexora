# Test Plan 04 — Merchant (Business Owner) Dashboard

**Surface:** `view === 'dashboard'` → `src/components/Dashboard.jsx` + `dashboard/` + feature views.
**Sidebar menu (9):** Dashboard · Staff · Tips (4 sub-tabs) · Reviews · Transactions · Touchpoints (2 sub-tabs) · Analytics · Settings · Support.
**Responsive:** desktop (≥lg) fixed sidebar; mobile hamburger → drawer.
**Data keys:** `nexora_merchant_setup`, `nexora_profile_settings`, `nexora_transactions`, `nexora_reviews`, `nexora_notifications`.

> Settings & KYB are covered in [05-merchant-settings-kyb.md](05-merchant-settings-kyb.md).

---

## A. Shell, navigation & header

### DASH-01: Sidebar renders all menu items (desktop) — P0 · Happy path
- **Steps**: 1. Open dashboard at ≥1024px.
- **Expected**: ✅ Sidebar with profile card, Current Plan card, 9 nav items, Sign Out.

### DASH-02: Navigate between menu items — P0 · Happy path
- **Steps**: 1. Click each menu item.
- **Expected**: ✅ Correct view renders; ✅ active item highlighted; ✅ no full reload.

### DASH-03: Expandable Tips submenu — P1 · Happy path
- **Steps**: 1. Click Tips.
- **Expected**: ✅ Expands to Overview / Direct Savings / Tip Transactions / Staff Payouts; ✅ selecting a sub-tab switches the Tips view.

### DASH-04: Expandable Touchpoints submenu — P1 · Happy path
- **Steps**: 1. Click Touchpoints.
- **Expected**: ✅ Expands to QR Stations / Hardware Devices.

### DASH-05: Mobile drawer — P0 · Responsive
- **Steps**: 1. At <1024px, tap hamburger.
- **Expected**: ✅ Drawer overlay (≤84vw) with same menu; ✅ closes on backdrop click and on item select (except Tips/Touchpoints toggle).

### DASH-06: Profile card expand → Business Setting / KYB — P1 · Happy path
- **Steps**: 1. Click profile card.
- **Expected**: ✅ Reveals Business Setting (Settings>profile) + KYB (Settings>kyb) shortcuts.

### DASH-07: Current Plan card by KYB — P2 · Edge case
- **Steps**: 1. View with `kyb_approved` then non-approved.
- **Expected**: ✅ "Pro Plan + renews date" when approved; ✅ "No current plan" otherwise; ✅ Manage Plan → subscriptions (ComingSoon).

### DASH-08: Header global search — P1 · Happy path
- **Steps**: 1. Type a staff name / txn id / review / touchpoint.
- **Expected**: ✅ Dropdown groups (max 3 each); ✅ clicking a result navigates to its view/detail; ✅ "no results" message when none.

### DASH-09: Notifications bell + dropdown — P1 · Happy path
- **Precondition**: `nexora_notifications` has unread items.
- **Steps**: 1. Open bell. 2. Click a notification. 3. Mark All as Read.
- **Expected**: ✅ Unread badge count; ✅ click marks read + navigates to `linkTab`; ✅ Mark All clears badge; ✅ persists.

### DASH-10: Language switch (VI/EN) — P1 · i18n
- **Steps**: 1. Toggle VI/EN.
- **Expected**: ✅ All menu/labels/views localized; ✅ no hardcoded strings.

### DASH-11: Sign out — P0 · Happy path
- **Steps**: 1. Click Sign Out.
- **Expected**: ✅ `onLogout()` → login view.

### DASH-12: Reset app FAB — P2 · Edge case
- **Steps**: 1. Click the floating reset button → confirm.
- **Expected**: ✅ Confirm dialog; ✅ on OK clears `nexora_merchant_setup` and returns to login.

## B. Overview / Dashboard

### DASH-13: KPI cards render — P0 · Happy path
- **Steps**: 1. Open Dashboard.
- **Expected**: ✅ Total Tips, Transactions, Avg Tip, Reviews, Google/Yelp rating, Response rate, Returning customers with deltas.

### DASH-14: Tips-over-time chart + range — P1 · Happy path
- **Steps**: 1. Change range (7/30/90/180/365 days). 2. Hover the line.
- **Expected**: ✅ Chart re-renders per range; ✅ tooltip shows value+label; ✅ localized range labels.

### DASH-15: Staff leaderboard — P1 · Happy path
- **Steps**: 1. View leaderboard; click a row.
- **Expected**: ✅ Top staff with tips + rating; ✅ selected row highlights.

### DASH-16: Quick actions — P2 · Navigation
- **Steps**: 1. Click "View Touchpoints" / "View Reviews".
- **Expected**: ✅ Navigates to respective views.

## C. Staff management

### DASH-17: Staff KPI row — P2 · Happy path
- **Steps**: 1. Open Staff.
- **Expected**: ✅ Total Linked, Pending Invites, Payment Setup %, Self-Setup status.

### DASH-18: Join link + QR — P1 · Happy path
- **Steps**: 1. View join card; click Copy.
- **Expected**: ✅ Referral URL `…?flow=staff-invite&biz=<name>`; ✅ copy toast; ✅ QR enlarges on click.

### DASH-19: Pending join requests — approve — P0 · Happy path
- **Precondition**: ≥1 pending staff (from staff portal).
- **Steps**: 1. Click Approve → fill/edit form → Save.
- **Expected**: ✅ Approval modal with editable fields (fullName+nickname required); ✅ on save status → Active, isActive:true; ✅ removed from pending list.

### DASH-20: Pending join requests — decline — P1 · Happy path
- **Steps**: 1. Click Decline → confirm.
- **Expected**: ✅ Confirm dialog; ✅ staff + associated personal QR touchpoint removed.

### DASH-21: Active staff — toggle active — P1 · Happy path
- **Steps**: 1. Toggle a staff's active switch.
- **Expected**: ✅ `isActive` flips; ✅ persisted to `nexora_merchant_setup`; ✅ inactive staff's personal QR is blocked.

### DASH-22: Active staff — toggle Show in Tips Flow — P1 · Happy path
- **Steps**: 1. Toggle the eye/showInTipsFlow control.
- **Expected**: ✅ `showInTipsFlow` flips; ✅ affects customer flow visibility.

### DASH-23: Edit staff (StaffModal) — P0 · Happy path
- **Steps**: 1. Click Edit → change fields → Save.
- **Expected**: ✅ Modal prefilled; ✅ fullName+nickname required; ✅ email validated if present; ✅ saved to list.

### DASH-24: Staff avatar upload — P2 · Happy path
- **Steps**: 1. In modal, Upload Photo.
- **Expected**: ✅ DataURL preview in circular frame.

### DASH-25: Staff payment methods + VLINKPAY verify — P1 · Happy path
- **Steps**: 1. Enable wallets / open PayoutSetup. 2. Type a VLINKPAY id.
- **Expected**: ✅ 6 wallet toggles with logos; ✅ VLINKPAY async status idle→checking→success/error (debounced ~1.5s).

### DASH-26: Staff reviews tab in modal — P2 · Happy path
- **Steps**: 1. Open a staff's Reviews tab.
- **Expected**: ✅ Avg rating + star breakdown; ✅ filters All/Google/Yelp/Internal + "only commented".

### DASH-27: Delete staff — P1 · Happy path
- **Steps**: 1. Click delete → confirm.
- **Expected**: ✅ Confirm dialog; ✅ staff + associated personal QR touchpoint removed.

### DASH-28: Link existing staff — found + link — P0 · Happy path
- **Steps**: 1. Link tab → search by id/name/email/phone → Link Request.
- **Expected**: ✅ Result card; ✅ creates pending staff (`flowType:'Link Existing Staff ID'`, isActive:false) + personal QR; ✅ fires `showSimulationInvite`.

### DASH-29: Link existing — already linked — P1 · Error handling
- **Steps**: 1. Link a staff already on the roster.
- **Expected**: ✅ Error toast "already linked to your salon."

### DASH-30: Invite new staff — SMS/Email — P0 · Happy path
- **Steps**: 1. Invite tab → name + toggle SMS/Email + contact → Send Invite Link.
- **Expected**: ✅ name+contact required; ✅ email validated when Email method; ✅ creates Pending Setup staff + personal QR; ✅ fires simulation invite toast.

### DASH-31: Invite validation — P1 · Validation
- **Steps**: 1. Blank name or contact → Send.
- **Expected**: ✅ Required errors; ✅ invalid email rejected (Email method).

### DASH-32: Simulation invite toast → open setup — P1 · Integration
- **Steps**: 1. After invite/link, click "Open Setup" on the toast.
- **Expected**: ✅ Routes to `staff-portal` prefilled with the invite data.

### DASH-33: Staff detail view — P1 · Happy path
- **Steps**: 1. Click a staff's Details.
- **Expected**: ✅ StaffDetailView: stats (tips, rating, reviews, specialty), 7-day chart, reviews (filters incl. Low Stars), recent transactions; ✅ Back returns to roster.

### DASH-34: QR modal preview + print + simulate customer — P1 · Happy path
- **Steps**: 1. Click a staff/touchpoint QR → enlarge → Print → "Simulate Customer View".
- **Expected**: ✅ QR card with branding + URL; ✅ inactive badge if staff inactive; ✅ print dialog; ✅ customer link opens `?flow=customer&tech=…&biz=…` in new tab.

## D. Tips view (4 tabs)

### DASH-35: Tips Overview — P1 · Happy path
- **Steps**: 1. Tips → Overview.
- **Expected**: ✅ KPIs (Total/P2P/Card/Crypto), weekly chart, payment-method donut with % legend.

### DASH-36: Savings calculator — P1 · Happy path
- **Steps**: 1. Tips → Savings. 2. Set Monthly Volume + Card Fee slider.
- **Expected**: ✅ Monthly + annual savings = volume×(fee/100); ✅ volume clamped ≥0; ✅ fee 1.0–5.0 step 0.1; ✅ recent direct txns table.

### DASH-37: Tip transactions search — P1 · Happy path
- **Steps**: 1. Tips → Transactions. 2. Search by id/staff/touchpoint/method.
- **Expected**: ✅ Case-insensitive filter across 4 fields; ✅ status badges; ✅ empty-state message when no match.

### DASH-38: Staff payouts aggregation — P1 · Happy path
- **Steps**: 1. Tips → Payouts.
- **Expected**: ✅ Per-staff totals (sum by staffId), method, status, last date.

## E. Reviews view

### DASH-39: Reviews list + filters — P1 · Happy path
- **Steps**: 1. Open Reviews. 2. Filter All/Google/Yelp/3★-or-below + staff dropdown.
- **Expected**: ✅ Cards (avatar, staff, stars, comment, category, time, source link); ✅ filters apply; ✅ empty-state when none.

### DASH-40: Review source link — P2 · Happy path
- **Steps**: 1. Click a review's external link.
- **Expected**: ✅ Opens review URL in new tab.

## F. Transactions / Reports

### DASH-41: Transactions table + filters — P1 · Happy path
- **Steps**: 1. Open Transactions. 2. Apply date preset, amount min/max, staff, touchpoint, method, status.
- **Expected**: ✅ Table filters correctly; ✅ status color badges; ✅ Custom date shows start/end inputs.

### DASH-42: Reset filters — P2 · Happy path
- **Steps**: 1. Click Reset.
- **Expected**: ✅ All filters cleared to defaults.

### DASH-43: Transactions empty state — P2 · Edge case
- **Steps**: 1. Apply a filter with no matches.
- **Expected**: ✅ "No transactions matching the filter criteria."

## G. Touchpoints / Devices

### DASH-44: QR Stations list + KPIs — P1 · Happy path
- **Steps**: 1. Touchpoints → QR Stations.
- **Expected**: ✅ KPIs (Total, Active NFC, Scans, Issues); ✅ station cards with QR, URL, scans, revenue.

### DASH-45: Add touchpoint — P1 · Validation
- **Steps**: 1. Add with blank name. 2. Add with name + type.
- **Expected**: ✅ Blank name blocked; ✅ valid add appends a station.

### DASH-46: Toggle / link device / delete station — P1 · Happy path
- **Steps**: 1. Toggle Active; 2. Link Device (inline edit → ✓); 3. Delete → confirm.
- **Expected**: ✅ Active state flips; ✅ device id saved (trimmed); ✅ delete confirm modal then removal; ✅ inactive QR shows grayscale "Disabled".

### DASH-47: Devices view — add/validate — P1 · Validation
- **Steps**: 1. Touchpoints → Hardware Devices → Add New Device. 2. Save with blank Device ID or Location.
- **Expected**: ✅ "Device ID is required" / "Location is required"; ✅ type select (NFC Stand/QR Card/NFC Sticker); ✅ valid add appends.

### DASH-48: Device toggle + delete + export — P2 · Happy path
- **Steps**: 1. Toggle a device; 2. Delete → confirm; 3. Export.
- **Expected**: ✅ Active/Inactive toggles; ✅ delete confirm then removal; ✅ Export shows success toast ~2.5s.

## H. Analytics / Support / placeholders

### DASH-49: Analytics view — P2 · Happy path
- **Steps**: 1. Open Analytics.
- **Expected**: ✅ KPIs (Volume/Count/Avg/Fees Avoided); ✅ daily trend chart with hover scrubber; ✅ wallet share donut; ✅ top staff + touchpoint leaderboards; ✅ zero-data safe (no divide-by-zero).

### DASH-50: Support — ticket + FAQ — P2 · Happy path
- **Steps**: 1. Open Support. 2. Submit blank ticket. 3. Submit valid ticket. 4. Expand FAQ items.
- **Expected**: ✅ Subject+Description required → error; ✅ valid submit shows success ~3s + clears; ✅ FAQ accordion one-open-at-a-time.

### DASH-51: Coming Soon placeholders — P3 · Happy path
- **Steps**: 1. Open Analytics/Subscriptions placeholder screens.
- **Expected**: ✅ Sparkles + title + description + Back to Dashboard.

## I. KYB gating & sync

### DASH-52: KYB-gated feature locks — P0 · Edge case
- **Precondition**: `verificationStatus !== 'kyb_approved'`.
- **Steps**: 1. Trigger a KYB-gated feature.
- **Expected**: ✅ KYB Required modal (Cancel / Verify Now → Settings>KYB); ✅ feature blocked until approved.

### DASH-53: Cross-tab storage sync — P1 · Persistence
- **Steps**: 1. Open dashboard in two tabs. 2. Approve/edit a staff in tab A.
- **Expected**: ✅ Tab B reflects change via `storage` event (no manual reload).

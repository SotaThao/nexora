# Test Cases: Staff Personal Dashboard

> Derived 1:1 from OpenSpec scenarios in `specs/*/spec.md`. Each TC maps to a capability + scenario.
> Priorities: **P0** (blocks release) · **P1** (degraded UX) · **P2** (workaround exists) · **P3** (cosmetic).
> Types: Happy path · Edge case · Error handling · Persistence/Sync · Responsive · i18n.

## Test Environment

```bash
pnpm install
node scripts/seed-staff-demo.js   # requires .env: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
pnpm dev                          # http://localhost:3000 (VITE_PORT)
```
Demo entry: Login screen → Simulation Panel → **Staff Login** (seeded staff `NEX-STAFF-MIA0123`).
Test data: 1 business + 1 staff + transactions across statuses (Pending / Completed / Verified).

---

## 1. Capability: staff-account-access

### TC-01: Personal account resolves to staff context — P0 · Happy path
- **Precondition**: An account flagged `!personal` exists/seeded.
- **Steps**: 1. Load the `!personal` account.
- **Expected**: ✅ App treats it as staff and selects the staff dashboard experience (not merchant).

### TC-02: Business account is unaffected — P0 · Regression
- **Precondition**: A `!business` account exists.
- **Steps**: 1. Load the `!business` account.
- **Expected**: ✅ The existing merchant `dashboard` renders unchanged (no staff shell).

### TC-03: Staff login lands on staff dashboard — P0 · Happy path
- **Steps**: 1. Complete login for a `!personal` account.
- **Expected**: ✅ App renders `staff-dashboard` view with that staff's data loaded.

### TC-04: Simulation Panel opens staff dashboard — P0 · Demo path
- **Steps**: 1. On login, open Simulation Panel. 2. Click **Staff Login**.
- **Expected**: ✅ App switches to `staff-dashboard` as the seeded demo staff with no credentials required.

### TC-05: Sign out returns to login — P0 · Happy path
- **Precondition**: Signed in as staff.
- **Steps**: 1. Select Sign Out (sidebar on desktop / profile control).
- **Expected**: ✅ App returns to `login` view and the active staff session is cleared.

---

## 2. Capability: staff-dashboard-navigation

### TC-06: Desktop shows sidebar — P0 · Responsive
- **Precondition**: Viewport ≥ 1024px (test at 1280px).
- **Steps**: 1. Render staff dashboard.
- **Expected**: ✅ Left sidebar (brand, profile, navigation, sign-out) visible; ✅ bottom navbar hidden.

### TC-07: Mobile shows bottom navbar — P0 · Responsive
- **Precondition**: Viewport < 1024px (test at 390px & 768px).
- **Steps**: 1. Render staff dashboard.
- **Expected**: ✅ Fixed bottom navbar visible; ✅ desktop sidebar hidden.

### TC-08: Bottom navbar tabs content — P1 · Happy path
- **Steps**: 1. View bottom navbar on mobile.
- **Expected**: ✅ Tabs are exactly **Home, My QR, Tips, Pay, Profile**; active tab visually highlighted.

### TC-09: Notifications open from the bell — P1 · Happy path
- **Steps**: 1. Activate the header notifications bell.
- **Expected**: ✅ Notifications screen/panel opens.

### TC-10: Switching tabs updates active screen — P0 · Happy path
- **Steps**: 1. Select each nav item in turn (Home → My QR → Tips → Pay → Profile → Notifications).
- **Expected**: ✅ Corresponding screen shows; ✅ selected item marked active; ✅ no full page reload.

### TC-11: Switching language updates labels — P1 · i18n
- **Steps**: 1. Toggle VI ↔ EN in header. 2. Inspect nav labels + screen titles on every screen.
- **Expected**: ✅ All labels/titles update to selected language; ✅ no hardcoded/untranslated strings (no raw keys shown).

---

## 3. Capability: staff-tip-tracking

### TC-12: Home KPIs reflect the signed-in staff — P0 · Happy path
- **Precondition**: Transactions seeded for the staff's `staffId`.
- **Steps**: 1. Load Home.
- **Expected**: ✅ KPI cards (Today's Tips, This Month, Pending count, Rating) aggregate **only** transactions whose `staffId` matches.

### TC-13: No transactions yet — P2 · Edge case
- **Precondition**: Staff with zero matching transactions.
- **Steps**: 1. Load Home.
- **Expected**: ✅ KPI cards show zero values; ✅ no errors/blank crash.

### TC-14: Confirm a pending tip — P0 · Happy path
- **Precondition**: At least one pending tip.
- **Steps**: 1. On Home Pending Confirmations, confirm one tip.
- **Expected**: ✅ Tip leaves the pending list; ✅ status updates to confirmed/received; ✅ persisted to `confirmedTipIds`.

### TC-15: Confirm all pending tips — P1 · Happy path
- **Precondition**: Multiple pending tips.
- **Steps**: 1. Click **Confirm All Received**.
- **Expected**: ✅ All currently pending tips marked confirmed; ✅ Pending KPI updates accordingly.

### TC-16: Linked businesses on Home — P1 · Happy path
- **Steps**: 1. Load Home.
- **Expected**: ✅ Each linked business shows its per-business display name and an active/inactive status.

### TC-17: Tips activity list rows — P0 · Happy path
- **Steps**: 1. Open Tips screen.
- **Expected**: ✅ Each tip row shows amount, payment method, business, display name, and status (Pending / Completed / Verified).

### TC-18: AI insight panel shown — P2 · Happy path
- **Precondition**: At least one tip.
- **Steps**: 1. Open Tips screen.
- **Expected**: ✅ An AI insight summary of tipping performance is displayed.

### TC-19: Confirm-tip persists across reload — P1 · Persistence
- **Steps**: 1. Confirm a tip. 2. Reload the app / re-enter staff dashboard.
- **Expected**: ✅ Confirmed tip remains confirmed (read from synced `confirmedTipIds`).

---

## 4. Capability: staff-payout-methods

### TC-20: Toggle a payout method on/off — P0 · Happy path
- **Steps**: 1. On Pay, toggle a method (e.g. Venmo). 2. Reload.
- **Expected**: ✅ Enabled state flips and persists to `nexora_staff_account`.

### TC-21: Edit a payout handle — P0 · Happy path
- **Steps**: 1. Edit a method handle/value. 2. Save. 3. Reload.
- **Expected**: ✅ New value persisted to the staff's account data.

### TC-22: Payout methods are staff-owned — P0 · Data isolation
- **Steps**: 1. Inspect read/write source for the Pay screen.
- **Expected**: ✅ Methods read from / written to `nexora_staff_account` (staff-owned), **not** `nexora_merchant_setup` (merchant-editable).

### TC-23: Owner cannot edit staff payout methods — P1 · Negative
- **Steps**: 1. As merchant (`!business`), review surfaces that touch staff payment data.
- **Expected**: ✅ No merchant surface can edit the staff's payout methods.

### TC-24: Methods show brand logos — P2 · Visual
- **Steps**: 1. List payout methods on Pay.
- **Expected**: ✅ Each method shows its corresponding shared `WalletLogos` icon (Cash App, Venmo, Zelle, VLINKPAY, Crypto…).

---

## 5. Capability: staff-qr-sharing

### TC-25: Personal QR shows Staff ID — P1 · Happy path
- **Steps**: 1. Open My QR.
- **Expected**: ✅ Personal QR shown with Staff ID in `NEX-STAFF-XXXX` format.

### TC-26: Copy staff link — P1 · Happy path
- **Steps**: 1. Click **Copy Staff Link**.
- **Expected**: ✅ Shareable staff link copied to clipboard (verify clipboard contents / confirmation feedback).

### TC-27: One QR entry per linked business — P1 · Edge / data-driven
- **Precondition**: Staff linked to ≥2 businesses (or verify single + reason about N).
- **Steps**: 1. Open My QR.
- **Expected**: ✅ A distinct per-business QR entry per linked business, each tied to its business–staff link.

### TC-28: Placeholder QR renders — P2 · Happy path
- **Steps**: 1. Display any QR.
- **Expected**: ✅ Placeholder QR visual renders without requiring a real QR-encoding service (real encoding out of scope).

---

## 6. Capability: staff-profile

### TC-29: Save profile changes — P0 · Happy path
- **Steps**: 1. Edit full name, default display name, phone, email, bio. 2. Save. 3. Reload.
- **Expected**: ✅ Updated values persisted to `nexora_staff_account`.

### TC-30: Distinct display name per business — P1 · Happy path
- **Precondition**: Different display names across linked businesses.
- **Steps**: 1. Open Profile.
- **Expected**: ✅ Each business shows its own per-business display name; editable independently.

### TC-31: Identity matches merchant staff entry — P1 · Consistency
- **Steps**: 1. Open Profile. 2. Compare full name + Staff ID to `nexora_merchant_setup.staffList`.
- **Expected**: ✅ Full name and Staff ID match the merchant's staff entry for the same `staffId`.

---

## 7. Capability: staff-notifications

### TC-32: Notifications listed — P1 · Happy path
- **Steps**: 1. Open Notifications.
- **Expected**: ✅ Each notification shows type, message, and unread indicator where applicable.

### TC-33: Reading clears unread state — P1 · Happy path
- **Steps**: 1. Open / mark a notification as read. 2. Reload.
- **Expected**: ✅ Unread indicator cleared; ✅ read state persisted to `notificationsRead`.

### TC-34: Toggle a push preference — P1 · Persistence
- **Steps**: 1. Toggle a push category (Tip Confirmations / Reviews / Business Invites). 2. Reload.
- **Expected**: ✅ Preference state updated and persisted to the staff's account data.

---

## 8. Capability: staff-data-sync

### TC-35: Staff key syncs to Supabase — P0 · Sync
- **Precondition**: Supabase configured.
- **Steps**: 1. Write staff data through `storage`. 2. Inspect `nexora_sync` row `nexora_v3_nexora_staff_account`.
- **Expected**: ✅ Value upserted into `nexora_sync` under the staff key.

### TC-36: Falls back to local storage when Supabase absent — P1 · Error handling
- **Precondition**: Supabase NOT configured (no env vars).
- **Steps**: 1. Read/write staff data.
- **Expected**: ✅ Data read/written to local/session storage with no errors.

### TC-37: Staff key registered as dynamic key — P0 · Config
- **Steps**: 1. Verify `'nexora_staff_account'` ∈ `DYNAMIC_KEYS` in `src/utils/storage.js`.
- **Expected**: ✅ Present; participates in migration, pullAll, and realtime subscription.

### TC-38: Realtime update propagates — P0 · Sync
- **Steps**: 1. Change the `nexora_staff_account` row in Supabase (or second client). 2. Observe app.
- **Expected**: ✅ App receives realtime update and refreshes staff state, subject to `_client_updated_at` last-write guard.

### TC-39: Merchant-generated tip appears for staff — P0 · Single source of truth
- **Steps**: 1. Add a transaction for the staff's `staffId` to `nexora_transactions`. 2. Observe Home + Tips.
- **Expected**: ✅ Tip reflected live in Home KPIs and Tips list (no duplication into staff key).

### TC-40: Seeding prepares the demo — P0 · Setup
- **Steps**: 1. Run `node scripts/seed-staff-demo.js` with Supabase configured.
- **Expected**: ✅ Demo merchant setup, transactions, and staff account exist in `nexora_sync`.

### TC-41: Re-running does not duplicate — P1 · Idempotency
- **Steps**: 1. Run the seed script ≥2 times.
- **Expected**: ✅ Existing rows upserted (overwritten on `id` PK), not duplicated.

---

## Cross-cutting / Non-functional

### TC-42: No console.* in committed staff code — P1 · Hygiene
- **Steps**: 1. `rg "console\.(log|warn|error|debug|info)\(" src/components/staff-dashboard src/contexts/StaffAccountContext.jsx`.
- **Expected**: ✅ No matches.

### TC-43: Production build passes — P0 · Build
- **Steps**: 1. `pnpm build`.
- **Expected**: ✅ Build completes with no errors.

### TC-44: i18n parity en/vi — P1 · i18n
- **Steps**: 1. Confirm every `staff_dashboard.*` key in `en.json` has a counterpart in `vi.json`.
- **Expected**: ✅ Keys match 1:1; no missing translations.

### TC-45: openspec validate passes — P0 · Spec
- **Steps**: 1. `openspec validate add-staff-personal-dashboard`.
- **Expected**: ✅ Validation passes.

---

## Acceptance Criteria (Definition of Done)

- [ ] All P0 test cases pass (TC-01..05, 06, 07, 10, 12, 14, 17, 20–22, 29, 35, 37–40, 43, 45)
- [ ] All P1 test cases pass (or documented exceptions)
- [ ] No console errors in dev or production build
- [ ] Responsive verified at mobile (<1024px bottom navbar) and desktop (≥1024px sidebar)
- [ ] VI + EN verified across all six screens
- [ ] Staff-owned data isolated from merchant-editable store (TC-22/23)
- [ ] Realtime + single-source-of-truth behavior verified (TC-38/39)

## Coverage Map (capability → scenarios → TCs)

| Capability | Scenarios | Test Cases |
|---|---|---|
| staff-account-access | 4 | TC-01..05 |
| staff-dashboard-navigation | 6 | TC-06..11 |
| staff-tip-tracking | 8 | TC-12..19 |
| staff-payout-methods | 4 | TC-20..24 |
| staff-qr-sharing | 4 | TC-25..28 |
| staff-profile | 3 | TC-29..31 |
| staff-notifications | 3 | TC-32..34 |
| staff-data-sync | 7 | TC-35..41 |
| cross-cutting (tasks §7) | — | TC-42..45 |

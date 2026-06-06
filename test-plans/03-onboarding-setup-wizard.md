# Test Plan 03 — Onboarding Setup Wizard

**Surface:** `view === 'onboarding'` → `src/components/SetupWizard.jsx`.
**Flow:** Step 1 (Store info + Review routing) → Step 2 (Staff + QR touchpoints) → Step 3 (Print + Consent → Launch Dashboard).
**Writes:** `nexora_merchant_setup` = `{ businessInfo, reviewLinks, staffList, touchPoints }`.
**Modes:** Standard vs **SSO-locked** (`initialBusinessInfo` present → business fields read-only, staff form hidden).

---

## Step 1 — Store information & review routing

### ONB-01: Required store fields — P0 · Validation
- **Steps**: 1. Leave Business Name / Address / Phone blank. 2. Next.
- **Expected**: ✅ Validation blocks; required-field errors shown.

### ONB-02: At least one store payment method required — P0 · Validation
- **Steps**: 1. Leave Zelle/Venmo/Cash App/VLINKPAY all empty. 2. Next.
- **Expected**: ✅ `store_payment_required` error; ✅ filling any one passes.

### ONB-03: Industry dropdown — P2 · Happy path
- **Steps**: 1. Open industry select.
- **Expected**: ✅ Options Nail Salon / Restaurant / Cafe / Spa / Khác; default Nail Salon.

### ONB-04: Logo upload preview — P2 · Happy path
- **Steps**: 1. Upload an image as logo.
- **Expected**: ✅ 12×12 preview rendered (DataURL); non-image rejected by `accept`.

### ONB-05: Review link URL validation — P1 · Validation
- **Steps**: 1. Enter `google.com` (no protocol) in Google Review. 2. Next.
- **Expected**: ✅ Error — review URLs, if provided, must start with `http`; ✅ blank is allowed (optional).

### ONB-06: Feedback email format — P1 · Validation
- **Steps**: 1. Enter `bad` in feedback email. 2. Next.
- **Expected**: ✅ Email-format error (regex); ✅ blank allowed.

### ONB-07: Auto-generate default touchpoints on Next — P1 · Edge case
- **Precondition**: No touchpoints yet.
- **Steps**: 1. Pass Step 1.
- **Expected**: ✅ `tp-main` (General Lobby QR) + `tp-front` (Front Desk) auto-created.

### ONB-08: Prefill Demo Data — P1 · Happy path
- **Steps**: 1. Click "PREFILL DEMO DATA".
- **Expected**: ✅ Business + review links + 4 demo staff + 6 touchpoints populated; ✅ validation errors cleared.

### ONB-09: SSO-locked fields read-only — P1 · Edge case
- **Precondition**: SSO prefill (`initialBusinessInfo`).
- **Steps**: 1. Try editing name/address/phone/website/vlinkpay/logo.
- **Expected**: ✅ Fields disabled; onChange ignored; ✅ values come from SSO profile.

## Step 2 — Staff & QR touchpoints

### ONB-10: Add staff — required fields — P0 · Validation
- **Steps**: 1. Leave Full Name or Nickname blank → Add Staff.
- **Expected**: ✅ Blocked; required errors on fullName + nickname.

### ONB-11: Staff email optional but validated — P1 · Validation
- **Steps**: 1. Enter `bad` email → Add Staff.
- **Expected**: ✅ Email-format error; ✅ blank allowed.

### ONB-12: Staff must have a payout method — P0 · Validation
- **Steps**: 1. Enable no wallet and leave VLINKPAY empty → Add Staff.
- **Expected**: ✅ `staff_payment_required` error; ✅ enabling one wallet with a value OR filling VLINKPAY passes.

### ONB-13: Payout Setup modal per wallet — P1 · Happy path
- **Steps**: 1. Toggle/Edit Zelle (and others: Bank Wire, PayPal, Venmo, Cash App, Apple Cash). 2. Enter identifier; optionally QR (take photo / upload). 3. Save.
- **Expected**: ✅ Value saved to that wallet's config; ✅ enabled state set; ✅ identifier placeholder is wallet-appropriate.

### ONB-14: Add staff success side-effects — P1 · Happy path
- **Steps**: 1. Add a valid staff member.
- **Expected**: ✅ Staff appears in directory card (avatar/name/position/remove); ✅ a `tp-staff-<id>` Staff QR touchpoint auto-created; ✅ form cleared.

### ONB-15: Remove staff — P2 · Happy path
- **Steps**: 1. Click trash on a staff card.
- **Expected**: ✅ Removed from list; empty state "Staff directory is empty" when none.

### ONB-16: Staff required to proceed (non-SSO) — P1 · Validation
- **Precondition**: Standard (non-SSO) mode.
- **Steps**: 1. With empty staff list → Next.
- **Expected**: ✅ Blocked (staffList must be non-empty) unless SSO-provided.

### ONB-17: Add touchpoint — name required — P1 · Validation
- **Steps**: 1. Blank name → Add Touch Point.
- **Expected**: ✅ `tp_name_required` error; ✅ valid name creates `tp-custom-<ts>` (isActive, scans:0).

### ONB-18: Touchpoint type options — P2 · Happy path
- **Steps**: 1. Open type select.
- **Expected**: ✅ Table QR / Front Desk / Receipt QR options.

### ONB-19: Touchpoint inline edit — P2 · Happy path
- **Steps**: 1. Edit a touchpoint name/type → Save.
- **Expected**: ✅ Updated; ✅ renamed default touchpoint drops its `nameKey` (won't re-translate).

### ONB-20: QR preview + zoom — P2 · Happy path
- **Steps**: 1. Click a touchpoint QR thumbnail.
- **Expected**: ✅ Zoom modal with full QR + encoded customer URL (`?flow=customer&merchant=…&tech=tp/<id>`).

### ONB-21: SSO-locked Step 2 shows QR only — P1 · Edge case
- **Precondition**: SSO-locked.
- **Steps**: 1. View Step 2.
- **Expected**: ✅ Title "QR Touchpoints Configuration"; ✅ staff form hidden; ✅ touchpoints editable.

## Step 3 — Print & consent

### ONB-22: QR card preview renders — P2 · Happy path
- **Steps**: 1. Reach Step 3.
- **Expected**: ✅ 2:3 card: Nexora header, touchpoint + business name, QR, "Scan to Tip & Review".

### ONB-23: Print — P2 · Happy path
- **Steps**: 1. Click Print.
- **Expected**: ✅ `window.print()` opens; print-only CSS applied.

### ONB-24: Consent gates Launch — P0 · Validation
- **Steps**: 1. Leave consent unchecked → observe Launch button. 2. Check consent.
- **Expected**: ✅ Launch disabled until consent checked.

### ONB-25: Launch Dashboard persists + routes — P0 · Persistence
- **Steps**: 1. Check consent → Launch Dashboard.
- **Expected**: ✅ `nexora_merchant_setup` written (local+session); ✅ `onComplete(data)` → routes to merchant dashboard with the new data.

### ONB-26: Navigation + language — P1 · i18n/Navigation
- **Steps**: 1. Back from Step 2→1, 3→2. 2. Toggle VI/EN on each step. 3. Switch language with default touchpoints present.
- **Expected**: ✅ Back preserves entered data; ✅ all steps localized; ✅ default touchpoint names re-translate via `nameKey`.

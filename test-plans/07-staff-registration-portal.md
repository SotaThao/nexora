# Test Plan 07 — Staff Registration Portal

**Surface:** `view === 'staff-portal'` → `src/components/StaffRegistrationWizard.jsx`. Opened from an invite link (`?flow=staff-invite&biz=…`) or the Simulation Panel.
**Paths:** **Link existing** Staff ID  ·  **Register new** (Step 1 credentials+OTP → Step 2 profile → Step 3 payouts → Step 5 success).
**Writes:** `nexora_merchant_setup.staffList` (status `Pending Acceptance`, `isActive:false`), `nexora_notifications`.

---

## Step 0 — Invite acceptance / path selection

### SREG-01: Prefilled invite display — P0 · Happy path
- **Precondition**: `inviteData.name` set (invited).
- **Steps**: 1. Open portal.
- **Expected**: ✅ Business card shows invited Name, Role, Email, Phone; ✅ "Accept Invite & Continue" + "Decline Request" + "I already have Staff ID" actions.

### SREG-02: Decline returns to merchant — P1 · Navigation
- **Steps**: 1. Click Decline.
- **Expected**: ✅ `onReturnToMerchant()` called → back to dashboard.

### SREG-03: Self-serve path selection — P1 · Happy path
- **Precondition**: No `inviteData.name`.
- **Steps**: 1. Open portal.
- **Expected**: ✅ Two cards: "I already have a Profile" (→link) and "I am a new Technician" (→register Step 1).

## Link existing profile

### SREG-04: Staff ID live search — found — P0 · Happy path
- **Steps**: 1. Choose link path. 2. Type `NEX-STAFF-LISA1102`.
- **Expected**: ✅ 600ms debounce; ✅ spinner→checkmark; ✅ profile card (avatar, name, KYC badge, position, phone, enabled payout methods).

### SREG-05: Staff ID not found — P1 · Error handling
- **Steps**: 1. Type an unknown `NEX-STAFF-ZZZZ`.
- **Expected**: ✅ X status icon; ✅ `searchError` message; ✅ no profile card.

### SREG-06: QR scan to fill Staff ID — P2 · Happy path
- **Steps**: 1. Click QR scan → "Simulate Successful Scan".
- **Expected**: ✅ Scanner modal (animated); ✅ fills Lisa Tran (NEX-STAFF-LISA1102); ✅ modal closes.

### SREG-07: Accept & Link with Salon — P0 · Persistence
- **Steps**: 1. With a found profile → "Accept & Link with Salon".
- **Expected**: ✅ `handleLinkExistingProfile()` writes staff entry with `flowType:'Link Existing Staff ID'`, status `Pending Acceptance`, payout configs autofilled; ✅ jumps to Step 5 success.

## Register new — Step 1 (credentials + OTP)

### SREG-08: Email required + format — P0 · Validation
- **Steps**: 1. Blank/`bad` email → Continue.
- **Expected**: ✅ "Email is required" / "Email is invalid".

### SREG-09: Confirm email must match — P0 · Validation
- **Steps**: 1. Mismatched confirm → Continue.
- **Expected**: ✅ "Emails do not match".

### SREG-10: Password min 6 — P0 · Validation
- **Steps**: 1. `12345` → Continue.
- **Expected**: ✅ "Password must be at least 6 characters".

### SREG-11: Referral/salon locked when invited — P2 · Edge case
- **Precondition**: `inviteData.biz` set.
- **Steps**: 1. Observe referral field.
- **Expected**: ✅ Prefilled with biz + disabled.

### SREG-12: OTP gate — invalid then valid — P0 · Validation
- **Steps**: 1. Submit credentials → OTP screen. 2. Enter `0000` → Verify. 3. Enter `1234`.
- **Expected**: ✅ Invalid → shake + "Invalid code. Tip: Enter 1234."; ✅ `1234` → advances to Step 2.

### SREG-13: OTP resend timer — P2 · Happy path
- **Steps**: 1. On OTP screen wait for 30s countdown.
- **Expected**: ✅ Counts down; ✅ "Resend" appears at 0; ✅ click resets to 30; ✅ "Auto-fill (1234)" helper works.

## Register new — Step 2 (profile)

### SREG-14: Avatar presets + upload — P2 · Happy path
- **Steps**: 1. Pick a preset; 2. Upload an image.
- **Expected**: ✅ Selected preset applied; ✅ uploaded image (DataURL) shown.

### SREG-15: Required identity fields — P0 · Validation
- **Steps**: 1. Clear Full Name.
- **Expected**: ✅ Next disabled while `fullName` empty; ✅ nickname auto-generated from name (editable).

### SREG-16: Invited email/phone locked — P1 · Edge case
- **Precondition**: Invited (not self-serve).
- **Steps**: 1. Try editing email/phone on Step 2.
- **Expected**: ✅ Both disabled (`disabled={!isSelfServe}`); ✅ self-serve = editable.

### SREG-17: Auto-generated Staff ID + VLINKPAY ID — P1 · Happy path
- **Steps**: 1. Observe Staff ID + VLINKPAY ID.
- **Expected**: ✅ Staff ID `NEX-STAFF-<initials><4digit>` (read-only); ✅ VLINKPAY `VLP-<4digit>-<initials>`.

### SREG-18: VLINKPAY ID lookup autofill — P2 · Happy path
- **Steps**: 1. Type a known `VLP-1102-LISA` (or QR scan).
- **Expected**: ✅ Debounced lookup; ✅ on success autofills profile from mock registry.

### SREG-19: Bio optional — P3 · Happy path
- **Steps**: 1. Leave bio empty → proceed.
- **Expected**: ✅ Allowed; note "Shows on customer tip screen".

## Register new — Step 3 (payouts) + success

### SREG-20: Payout method list + edit — P1 · Happy path
- **Steps**: 1. Toggle/Edit each (Zelle, Bank Wire, PayPal, Venmo, Cash App, Apple Cash).
- **Expected**: ✅ Method-specific placeholders; ✅ value + optional QR saved; ✅ "Not Configured" shown when empty.

### SREG-21: Payout edit modal requires value — P1 · Validation
- **Steps**: 1. Open a method's Configure modal. 2. Save with blank identifier.
- **Expected**: ✅ "This field is required."; ✅ filling it saves and closes.

### SREG-22: QR capture / upload in modal — P2 · Happy path
- **Steps**: 1. Take Photo (mock 800ms) or Choose File. 2. Clear.
- **Expected**: ✅ Spinner then QR preview; ✅ Clear removes it; ✅ image-only file accepted.

### SREG-23: Payouts optional (no method) allowed — P2 · Edge case
- **Steps**: 1. Enable no method → Save & Activate.
- **Expected**: ✅ Not blocked (payouts not required in this wizard).

### SREG-24: Save & Activate writes staff + notification — P0 · Persistence
- **Steps**: 1. Click Save & Activate.
- **Expected**: ✅ `staffList` entry written/updated (status `Pending Acceptance`, isActive:false, correct `flowType`); ✅ a `feedback_alert` notification appended to `nexora_notifications`.

### SREG-25: Duplicate email/phone updates existing — P1 · Edge case
- **Steps**: 1. Activate a staff whose email/phone already exists in `staffList`.
- **Expected**: ✅ Existing entry updated, not duplicated.

### SREG-26: Success screen — P0 · Happy path
- **Steps**: 1. Reach Step 5.
- **Expected**: ✅ Checkmark; ✅ "Join Request Submitted!"; ✅ Staff ID + business with PENDING badge; ✅ Copy Staff Link (`https://touch.nexora.com/staff/<id>`); ✅ Return to Merchant Dashboard.

### SREG-27: Copy staff link — P2 · Happy path
- **Steps**: 1. Click Copy Staff Link.
- **Expected**: ✅ Link copied to clipboard.

### SREG-28: Return to merchant reloads roster — P1 · Integration
- **Steps**: 1. Click Return to Merchant Dashboard.
- **Expected**: ✅ URL query cleared; ✅ dashboard reloads `nexora_merchant_setup` so the new pending staff appears in Pending Join Requests.

### SREG-29: Back navigation preserves data — P2 · Navigation
- **Steps**: 1. Step 3→2→1 via Back.
- **Expected**: ✅ Entered field values retained per step.

### SREG-30: Language switch (VI/EN) — P1 · i18n
- **Steps**: 1. Toggle VI/EN across all steps.
- **Expected**: ✅ All wizard text localized; ✅ no hardcoded strings.

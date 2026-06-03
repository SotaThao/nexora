# Test Plan 05 — Merchant Settings & KYB

**Surface:** `src/components/SettingsView.jsx` (Settings menu in the merchant dashboard). Two tabs: **Profile** (7 cards) and **KYB**, plus the **Payout Account** edit modal.
**Data keys:** `nexora_profile_settings` (read/write), `nexora_merchant_setup` (payment accounts/QR), `nexora_pending_accounts` (KYB submit). Cross-component sync via `storage` event.
**Gating:** Basic-info / Address / Business edit buttons appear only when **not** KYB-verified (`!hasKyb`).

---

## A. Profile tab

### SET-01: Owner profile card — P1 · Happy path
- **Steps**: 1. Open Settings → Profile.
- **Expected**: ✅ Avatar, "Business Owner" badge, username (read-only), email (read-only), Referral ID with Copy.

### SET-02: Avatar upload — P2 · Happy path
- **Steps**: 1. Hover avatar → upload image.
- **Expected**: ✅ DataURL preview replaces avatar.

### SET-03: Email "Change" placeholder — P3 · Edge case
- **Steps**: 1. Click Change next to email.
- **Expected**: ✅ Toast "Email modification is under development"; ✅ email unchanged.

### SET-04: Copy Referral ID — P2 · Happy path
- **Steps**: 1. Click Copy.
- **Expected**: ✅ Copied to clipboard; ✅ "Copied" state ~2s + toast.

### SET-05: Payout methods toggles — P1 · Happy path
- **Steps**: 1. Toggle Zelle/Bank Wire/PayPal/Venmo/Cash App/Apple Cash.
- **Expected**: ✅ Each toggle flips `payoutToggles[key]`; ✅ logos shown; ✅ "Not Configured" italic when empty.

### SET-06: VLINKPAY ID display — P2 · Edge case
- **Steps**: 1. View VLINKPAY field with/without value.
- **Expected**: ✅ Shows id, or "Pending KYB" badge when unset.

### SET-07: Edit Basic Information (gated) — P1 · Validation
- **Precondition**: `!hasKyb`.
- **Steps**: 1. Click Edit on Basic Info → change Full Name/DOB/Phone → Save.
- **Expected**: ✅ Edit form (all required); ✅ Save persists to `nexora_profile_settings`; ✅ Cancel discards.

### SET-08: Basic info hidden-edit when verified — P1 · Edge case
- **Precondition**: `hasKyb` (kyb_approved).
- **Steps**: 1. View Basic Info card.
- **Expected**: ✅ No Edit button (read-only); ✅ DOB formatted "MMM D, YYYY".

### SET-09: Edit Address — P1 · Validation
- **Steps**: 1. Edit Address → Street/City/Zip/Country required, State optional → Save.
- **Expected**: ✅ Validation on required fields; ✅ persisted.

### SET-10: Edit Business Information — P1 · Validation
- **Steps**: 1. Edit Business → Name/Phone/Email required, Website optional → Save.
- **Expected**: ✅ Email validated; ✅ persisted; ✅ website renders as clickable link (new tab) without protocol prefix.

### SET-11: Location map — P3 · Happy path
- **Steps**: 1. View map card.
- **Expected**: ✅ Embedded Google Map iframe renders (display-only).

### SET-12: Edit Review Links — P1 · Validation
- **Steps**: 1. Edit Google/Yelp review URLs → Save.
- **Expected**: ✅ URL inputs; ✅ "Not Configured" when empty; ✅ saved links open in new tab; ✅ long URLs truncated for display.

### SET-13: Profile changes propagate — P1 · Persistence
- **Steps**: 1. Save any profile change. 2. Observe dashboard header/profile.
- **Expected**: ✅ `storage` event dispatched; ✅ other components reflect updated profile.

## B. Payout account edit modal

### SET-14: Open modal per method — P1 · Happy path
- **Steps**: 1. Click Edit on a payout method.
- **Expected**: ✅ Modal "CONFIGURE <METHOD>" with method logo + auto-focused identifier field.

### SET-15: Identifier required — P1 · Validation
- **Steps**: 1. Save with blank identifier.
- **Expected**: ✅ `modalError` shown; ✅ filling it allows save.

### SET-16: QR take-photo / upload / clear — P2 · Happy path
- **Steps**: 1. Take Photo (mock QR from value) or Choose File (image/*). 2. Clear.
- **Expected**: ✅ QR preview shown; ✅ Clear removes it.

### SET-17: Save updates accounts + toggles on — P1 · Persistence
- **Steps**: 1. Enter identifier + Save.
- **Expected**: ✅ `profile.paymentAccounts[key]` + `payoutQrCodes[key]` updated; ✅ method toggled on; ✅ written to `nexora_merchant_setup` businessInfo.

### SET-18: Cancel discards — P2 · Happy path
- **Steps**: 1. Edit then Cancel.
- **Expected**: ✅ No change persisted.

## C. KYB tab — status card

### SET-19: Status card — basic — P1 · Happy path
- **Precondition**: status `basic`.
- **Expected**: ✅ Blue "BASIC ACCOUNT STATUS"; ✅ "Complete Business Verification" CTA.

### SET-20: Status card — kyb_pending — P1 · Edge case
- **Precondition**: `kyb_pending`.
- **Expected**: ✅ Indigo "VERIFICATION PENDING"; ✅ no submit CTA.

### SET-21: Status card — kyb_approved — P0 · Happy path
- **Precondition**: `kyb_approved`.
- **Expected**: ✅ Emerald "BUSINESS PROFILE VERIFIED"; ✅ Verified date + Certificate ID; ✅ read-only dossier (no portal).

### SET-22: Status card — rejected / suspended — P1 · Edge case
- **Precondition**: `kyb_rejected` then `suspended`.
- **Expected**: ✅ Rejected = rose + "Re-submit Verification" CTA; ✅ suspended = red, no CTA; ✅ no crash on any status.

## D. KYB portal (submission)

### SET-23: Open portal from CTA — P1 · Happy path
- **Steps**: 1. Click "Complete Business Verification".
- **Expected**: ✅ Mock-browser portal with gateway URL incl. merchant email; ✅ KYB form shown.

### SET-24: KYB form — all fields required — P0 · Validation
- **Steps**: 1. Submit with any of the 6 fields blank.
- **Expected**: ✅ "All fields are required." (Legal Name, Tax ID/EIN, Structure, Owner, Bank Name, Account #, Routing).

### SET-25: KYB structure dropdown — P2 · Happy path
- **Steps**: 1. Open Business Structure.
- **Expected**: ✅ LLC / Corp / Sole / Partnership; ✅ account number masked (password input).

### SET-26: KYB submit success — P0 · Persistence
- **Steps**: 1. Fill all → Submit.
- **Expected**: ✅ ~2s loading spinner; ✅ updates `nexora_pending_accounts` + profile; ✅ `onKybSuccess(email)` fired; ✅ portal closes; ✅ status → verified.

### SET-27: Cancel portal — P2 · Happy path
- **Steps**: 1. Click Cancel in portal.
- **Expected**: ✅ Portal closes; no submission.

## E. KYB approved dossier (read-only)

### SET-28: Company dossier + settlement — P1 · Happy path
- **Precondition**: `kyb_approved` / `verified_lite`.
- **Expected**: ✅ Legal name, masked Tax ID, entity type, representative, MCC, address; ✅ settlement account (masked •••• last4, routing, frequency); ✅ "Change Settlement Target" → toast.

### SET-29: Compliance documents — P2 · Edge case
- **Steps**: 1. View documents card by status.
- **Expected**: ✅ Approved/lite → PDF list with Verified badges + Download; ✅ not-approved → "No compliance documents submitted yet."

## F. Cross-cutting

### SET-30: Legal disclosures + language — P2 · i18n
- **Steps**: 1. View disclosures. 2. Toggle VI/EN across Profile + KYB tabs.
- **Expected**: ✅ 3 disclosures (1099-K, savings disclaimer, ToS) always visible; ✅ all Settings text localized; ✅ no hardcoded strings.

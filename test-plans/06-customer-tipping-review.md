# Test Plan 06 — Customer Tipping & Review Flow

**Surface:** `view === 'customer'` (`?flow=customer`) → `src/components/CustomerFlow.jsx`.
**Flow:** select_staff → tip_amount → payment → wallet_details → processing(1800ms) → success_payment → leave_review → google_yelp_review → final_done.
**Writes:** `nexora_transactions` (status `Success`), `nexora_reviews`, `nexora_notifications`.
**Entry params:** `?tech=staff/<id>` pre-selects staff (skip to tip_amount); `?tech=tp/<id>` sets touchpoint; `?biz=<name>` sets business.

---

## A. Entry & staff selection

### CUST-01: Default entry lists active staff — P0 · Happy path
- **Steps**: 1. Open `?flow=customer`.
- **Expected**: ✅ select_staff screen; ✅ only active staff shown (inactive filtered); ✅ default 4 staff when no setup data.

### CUST-02: Pre-selected staff via tech param — P0 · Happy path
- **Steps**: 1. Open `?flow=customer&tech=staff/NEX-STAFF-MIA0123`.
- **Expected**: ✅ Skips to tip_amount for that staff; ✅ no Back to staff list.

### CUST-03: Search staff — P1 · Happy path
- **Steps**: 1. Type into search.
- **Expected**: ✅ Case-insensitive filter on fullName/nickname/position; ✅ "No staff members found" when none.

### CUST-04: Multi-select + default tip — P1 · Happy path
- **Steps**: 1. Select two staff.
- **Expected**: ✅ Checkmarks; ✅ each auto-gets $15 default; ✅ deselect removes its tip.

### CUST-05: Next disabled with none selected — P1 · Validation
- **Steps**: 1. Deselect all → observe Next.
- **Expected**: ✅ Disabled (opacity 50%, not-allowed).

### CUST-06: Inactive touchpoint blocks flow — P1 · Edge case
- **Steps**: 1. Open with a `tech=tp/<id>` whose station isActive=false.
- **Expected**: ✅ "Station Inactive" overlay + Go Back; main flow blocked.

## B. Tip amount

### CUST-07: Preset amounts — P0 · Happy path
- **Steps**: 1. Click $5/$10/$15/$20/$30 per staff.
- **Expected**: ✅ Selected preset stored per staffId.

### CUST-08: Custom amount valid — P1 · Happy path
- **Steps**: 1. Click Other → enter `12.50`.
- **Expected**: ✅ Decimal input accepted; ✅ proceeds.

### CUST-09: Custom amount invalid — P0 · Validation
- **Steps**: 1. Enter `0`, then empty, then `abc` → Pay.
- **Expected**: ✅ Error toast "valid tip amount greater than 0"; ✅ NaN and ≤0 rejected; ✅ stays on step.

### CUST-10: Title single vs multi — P2 · Happy path
- **Steps**: 1. One staff vs two.
- **Expected**: ✅ "Add tips for <nickname>" vs "Add tips for your providers"; ✅ total summed across staff.

### CUST-11: Back availability — P2 · Navigation
- **Steps**: 1. Observe Back on tip_amount.
- **Expected**: ✅ Back to select_staff shown only when NOT pre-selected via tech param.

## C. Payment method

### CUST-12: Wallet source — single staff with accounts — P1 · Happy path
- **Steps**: 1. Single staff who has payment accounts → payment.
- **Expected**: ✅ Shows that staff's non-empty wallets.

### CUST-13: Wallet source — fallback to business — P1 · Edge case
- **Steps**: 1. Single staff without accounts, or multi-staff → payment.
- **Expected**: ✅ Shows business payment accounts.

### CUST-14: Select wallet generates reference — P1 · Happy path
- **Steps**: 1. Tap a wallet (Zelle/Venmo/Cash App/PayPal/Bank Wire/Apple Pay).
- **Expected**: ✅ Random 4-digit ref generated; ✅ advances to wallet_details.

### CUST-15: No wallets available — P2 · Edge case
- **Steps**: 1. Reach payment when neither staff nor business has any account.
- **Expected**: ✅ No buttons (graceful blank); ✅ no crash.

## D. Wallet details (step 3.5)

### CUST-16: Recipient + account display — P1 · Happy path
- **Steps**: 1. View details.
- **Expected**: ✅ Recipient = staff.fullName (single) or business name (multi); ✅ account value labeled per method; ✅ "N/A" when missing.

### CUST-17: Reference note format — P1 · Happy path
- **Steps**: 1. View note.
- **Expected**: ✅ Single: `TIP-<NICKNAME>-<ref>`; ✅ multi: `TIP-NEXORA-<ref>`.

### CUST-18: QR shown when available — P2 · Edge case
- **Steps**: 1. View a method that has a configured QR (e.g. Zelle/Venmo with payout QR).
- **Expected**: ✅ "Scan to pay" QR rendered; ✅ hidden when no QR.

### CUST-19: Copy name/account/note — P2 · Happy path
- **Steps**: 1. Click each copy button.
- **Expected**: ✅ Value copied; ✅ "Copied!" toast.

### CUST-20: "I Sent The Tip" → processing — P0 · Happy path
- **Steps**: 1. Click "I Sent The Tip".
- **Expected**: ✅ processing spinner ~1800ms → success_payment.

## E. Confirmation & transaction write

### CUST-21: Success screen — P0 · Happy path
- **Steps**: 1. Reach success_payment.
- **Expected**: ✅ Checkmark; ✅ staff name(s) + total amount; ✅ Done button.

### CUST-22: Transaction record written — P0 · Persistence
- **Steps**: 1. Complete a tip; inspect `nexora_transactions`.
- **Expected**: ✅ One row per staff: `{id TX-…, dateTime, amount, staffName(nickname), staffId, touchpoint, paymentMethod, status:'Success'}`; ✅ prepended to array.

### CUST-23: Tip notification written — P1 · Persistence
- **Steps**: 1. After tip, inspect `nexora_notifications`.
- **Expected**: ✅ `tip_success` notif "New Tip Received ($amount)" with linkTab `reports`.

### CUST-24: Touchpoint label resolution — P2 · Edge case
- **Steps**: 1. Tip via staff QR vs touchpoint QR vs none.
- **Expected**: ✅ "Staff Personal QR" / resolved touchpoint name / "Lobby Welcome QR" default.

## F. Review

### CUST-25: Star rating — P0 · Happy path
- **Steps**: 1. Click 1–5 stars.
- **Expected**: ✅ Rating set (default 5); ✅ description label (Amazing!/Good!/Okay/Bad/Terrible).

### CUST-26: Sentiment flip resets — P1 · Edge case
- **Steps**: 1. Set 5★, type comment + tags. 2. Drop to 3★.
- **Expected**: ✅ Comment + tags reset on crossing the 4↔3 boundary.

### CUST-27: Tag chips sync with comment — P1 · Happy path
- **Steps**: 1. Toggle positive tags (≥4★) / negative tags (<4★).
- **Expected**: ✅ Tag text inserted/removed in comment (comma-separated); ✅ typing matching words auto-detects tags.

### CUST-28: Submit high rating → external reviews — P0 · Happy path
- **Steps**: 1. Rating ≥4 → Submit Review.
- **Expected**: ✅ Routes to google_yelp_review.

### CUST-29: Submit low rating → final — P0 · Happy path
- **Steps**: 1. Rating <4 → Submit.
- **Expected**: ✅ Routes straight to final_done (kept internal, not pushed to public review sites).

### CUST-30: Review record written — P0 · Persistence
- **Steps**: 1. Submit; inspect `nexora_reviews`.
- **Expected**: ✅ One row per staff `{id R-…, rating, comment(or fallback), staffName, staffId, category 'Good (Google)' if ≥4 else 'Internal Feedback', date}`; ✅ review notification (`review_good`/`feedback_alert`).

### CUST-31: Empty comment fallback — P2 · Edge case
- **Steps**: 1. Submit with no comment.
- **Expected**: ✅ Stored as "Good service" (≥4) or "Needs improvement" (<4).

### CUST-32: Skip review — P1 · Happy path
- **Steps**: 1. Click Skip.
- **Expected**: ✅ Goes to google_yelp_review (≥4) or final_done (<4); no review written.

## G. External review & end

### CUST-33: Google/Yelp links — P1 · Happy path
- **Steps**: 1. Click Google / Yelp (when reviewLinks configured). 2. "Maybe later".
- **Expected**: ✅ Opens configured URL in new tab → final_done; ✅ Maybe later → final_done; ✅ buttons hidden when links unset.

### CUST-34: Final + reset + language — P2 · i18n/Happy path
- **Steps**: 1. Reach final_done → Reset. 2. Toggle VI/EN across steps.
- **Expected**: ✅ Heart + thank-you; ✅ Reset clears state to initial (select_staff or pre-selected tip_amount); ✅ all steps localized, no hardcoded strings.

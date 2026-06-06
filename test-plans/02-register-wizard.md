# Test Plan 02 — Register Wizard

**Surface:** `view === 'register-wizard'` → `src/components/RegisterWizard.jsx`.
**Flow:** Step 0 (role) → Step 1 (credentials) → Step 2 (success: personal Staff-ID page OR business KYB-pending page).
**Writes:** `nexora_pending_accounts` (deduped by email).

---

## Step 0 — Role selection

### REG-01: Default role + toggle — P1 · Happy path
- **Steps**: 1. Open register. 2. Observe default. 3. Click "Technician (Personal)" then "Business Owner".
- **Expected**: ✅ Defaults to `business`; ✅ selection ring moves; ✅ step indicator 0/1/2 + progress bar shown.

### REG-02: Back to login from Step 0 — P2 · Navigation
- **Steps**: 1. Click Back.
- **Expected**: ✅ `onBackToLogin()` → returns to login (or prior session view if SSO-redirected).

### REG-03: Next advances without validation on Step 0 — P2 · Happy path
- **Steps**: 1. Click Next.
- **Expected**: ✅ Advances to Step 1; no errors.

## Step 1 — Credentials

### REG-04: Full name required for personal role only — P0 · Validation
- **Steps**: 1. Role=personal. 2. Leave full name blank. 3. Next.
- **Expected**: ✅ `fullname_required` error; ✅ for role=business, no full-name field shown.

### REG-05: Email required + format — P0 · Validation
- **Steps**: 1. Blank email → Next. 2. `bademail` → Next.
- **Expected**: ✅ `email_required` then `email_invalid` (regex `/\S+@\S+\.\S+/`).

### REG-06: Confirm email required + must match — P0 · Validation
- **Steps**: 1. Email `a@b.com`, confirm blank → Next. 2. Confirm `A@B.COM`.
- **Expected**: ✅ `confirm_email_required`; ✅ match is case-insensitive (A@B.COM passes); ✅ mismatch → `email_mismatch`.

### REG-07: Password required + min 6 — P0 · Validation
- **Steps**: 1. Blank password → Next. 2. `12345` → Next. 3. `123456`.
- **Expected**: ✅ `password_required`, then `password_short`, then passes.

### REG-08: Password show/hide toggle — P2 · Happy path
- **Steps**: 1. Type password. 2. Toggle visibility.
- **Expected**: ✅ Input type switches text/password.

### REG-09: Referral code optional — P2 · Happy path
- **Steps**: 1. Leave referral blank → submit. 2. Re-run with a value.
- **Expected**: ✅ Both accepted; value stored (trimmed) when provided.

### REG-10: SSO email prefill is locked — P1 · Edge case
- **Precondition**: Entered via SSO redirect (`ssoEmail` set).
- **Steps**: 1. Observe email field.
- **Expected**: ✅ Email prefilled + disabled (blue styling); ✅ confirm-email still required.

### REG-11: Account persisted to nexora_pending_accounts — P0 · Persistence
- **Steps**: 1. Complete Step 1 (business). 2. Inspect storage.
- **Expected**: ✅ Record `{email(lowercased,trimmed), password, referralCode, role, fullName|null, staffId|null, isVerified, kybDetails:null}` saved.

### REG-12: Duplicate email overwrites (no dup) — P1 · Edge case
- **Steps**: 1. Register `dup@x.com`. 2. Register again with same email.
- **Expected**: ✅ Single entry (filtered then pushed) — not duplicated.

## Step 2 — Personal success

### REG-13: Personal account auto-verified + Staff ID shown — P0 · Happy path
- **Steps**: 1. role=personal, complete Step 1.
- **Expected**: ✅ Success page; ✅ `isVerified:true`; ✅ Staff ID `NEX-STAFF-<initials><4-digit>` displayed; ✅ summary (name/email/referral).

### REG-14: Copy Staff ID — P2 · Happy path
- **Steps**: 1. Click Copy.
- **Expected**: ✅ Staff ID copied; ✅ "COPIED" toast ~2s.

### REG-15: Personal can then log in — P1 · Integration
- **Steps**: 1. Return to login. 2. Login with the new personal email+password.
- **Expected**: ✅ Routes to `staff-dashboard` (REG account role=personal).

## Step 2 — Business success + KYB simulation

### REG-16: Business success shows KYB PENDING — P0 · Happy path
- **Steps**: 1. role=business, complete Step 1.
- **Expected**: ✅ "KYB PENDING" badge (animated); ✅ summary (email/referral); ✅ Simulation Deployment Controls panel.

### REG-17: Simulate Admin Verification — P0 · Happy path
- **Steps**: 1. Click "Simulate Admin Verification".
- **Expected**: ✅ Account in storage gets `isVerified:true` + hardcoded `kybDetails` (Golden Glow Nails LLC…); ✅ green "KYB verified" badge.

### REG-18: Verify from session redirect triggers callback — P1 · Integration
- **Precondition**: `isRedirectedFromSession` true.
- **Steps**: 1. Simulate verification.
- **Expected**: ✅ `onKybSuccess(email)` invoked → app routes back to prior view as verified.

### REG-19: Skip simulation, account stays pending — P1 · Edge case
- **Steps**: 1. Business success page → return to login without simulating.
- **Expected**: ✅ Account remains `isVerified:false`; ✅ logging in lands on dashboard with `basic`/pending status.

### REG-20: Language switch across all steps — P1 · i18n
- **Steps**: 1. Toggle VI/EN on Step 0, 1, 2.
- **Expected**: ✅ All titles, labels, errors, buttons localized; ✅ no hardcoded strings.

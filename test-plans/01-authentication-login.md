# Test Plan 01 — Authentication & Login

**Surface:** `view === 'login'` in `src/App.jsx`. Left = SSO login card; right = Simulation Flow Controller + Simulated Accounts DB.
**Note:** Auth is simulated (no real OTP/session). Login routes by account flag/role and verification status.

## Demo credentials / triggers
- Manual login: any `email@domain` + password ≥6 chars → routes to dashboard (if setup exists) or onboarding.
- SSO with KYB: `sso_with_kyb@gmail.com` → onboarding, prefilled.
- SSO without KYB: `sso_no_kyb@gmail.com` → dashboard, status from selector.
- Simulation Panel scenarios 1–5; Simulated Accounts DB rows (LOGIN / CYCLE / delete).

---

### AUTH-01: Manual login with valid credentials (no prior setup) — P0 · Happy path
- **Precondition**: No `nexora_merchant_setup` saved.
- **Steps**: 1. Enter `test@demo.com` / `secret1`. 2. Click Login.
- **Expected**: ✅ 1.2s spinner; ✅ routes to `onboarding` (SetupWizard).

### AUTH-02: Manual login routes to dashboard when setup exists — P0 · Happy path
- **Precondition**: `nexora_merchant_setup` present (e.g. used "Enter Dashboard" once).
- **Steps**: 1. Enter valid email + 6+ char password. 2. Login.
- **Expected**: ✅ Routes directly to merchant `dashboard`.

### AUTH-03: Empty email or password — P1 · Validation
- **Steps**: 1. Leave email and/or password blank. 2. Login.
- **Expected**: ✅ Error `login.login_error_missing` shown; ✅ no navigation.

### AUTH-04: Invalid format (bad email / short password) — P1 · Validation
- **Steps**: 1. Enter `notanemail` or password <6 chars. 2. Login.
- **Expected**: ✅ "Invalid credentials…" error (localized VI/EN); ✅ stays on login.

### AUTH-05: SSO with KYB → onboarding prefilled — P0 · Happy path
- **Steps**: 1. Click Simulation scenario 1 ("Already has KYB (SSO)").
- **Expected**: ✅ `nexora_merchant_setup` cleared; ✅ routes to `onboarding`; ✅ Step 1 prefilled with VLINK Nail Spa profile (name/address/phone/payment), fields SSO-locked.

### AUTH-06: SSO without KYB — status = basic — P0 · Happy path
- **Steps**: 1. In scenario 2, select `basic`. 2. Click Login.
- **Expected**: ✅ Routes to `dashboard` with `verificationStatus='basic'`; ✅ KYB-gated features locked.

### AUTH-07: SSO without KYB — status = kyb_approved — P0 · Happy path
- **Steps**: 1. Scenario 2 → select `kyb_approved`. 2. Login.
- **Expected**: ✅ Dashboard with verified profile (prefilled KYB details, VLP id); ✅ gated features unlocked.

### AUTH-08: SSO without KYB — each status renders — P1 · Edge case
- **Steps**: 1. Repeat scenario 2 for `lite_pending`, `verified_lite`, `kyb_required`, `kyb_pending`, `suspended`.
- **Expected**: ✅ Each routes to dashboard; ✅ status reflected in Settings>KYB card; ✅ no crash on any status.

### AUTH-09: New Register scenario — P0 · Happy path
- **Steps**: 1. Click scenario 3 ("New Register") or the Register button.
- **Expected**: ✅ Routes to `register-wizard` with blank email.

### AUTH-10: Quick "Enter Dashboard" demo — P1 · Happy path
- **Steps**: 1. Click the "Enter Dashboard" quick button.
- **Expected**: ✅ Writes Golden Glow demo `nexora_merchant_setup` (4 staff, touchpoints); ✅ routes to dashboard with that data.

### AUTH-11: Simulate Staff Setup Portal — P1 · Happy path
- **Steps**: 1. Click scenario 4 ("Simulate Staff Setup Portal").
- **Expected**: ✅ Routes to `staff-portal` prefilled as Lisa Tran (invite data: name/email/phone/role/biz).

### AUTH-12: Staff Login (personal dashboard) — P0 · Happy path
- **Steps**: 1. Click scenario 5 ("Staff Login / Personal Dashboard").
- **Expected**: ✅ `loggedInStaffId='NEX-STAFF-MIA0123'`; ✅ routes to `staff-dashboard`.

### AUTH-13: Registered account auto-login from Accounts DB (business) — P0 · Happy path
- **Precondition**: A business account registered (appears in Simulated Accounts DB with `business` badge).
- **Steps**: 1. Click LOGIN on that row.
- **Expected**: ✅ Email+password autofilled; ✅ routes to dashboard/onboarding per saved setup; ✅ status = row's verificationStatus.

### AUTH-14: Registered personal account routes to staff dashboard — P0 · Routing
- **Precondition**: A `personal` account registered (purple badge, "active").
- **Steps**: 1. Click LOGIN on that row.
- **Expected**: ✅ Routes to `staff-dashboard` with that `staffId` (falls back to `NEX-STAFF-MIA0123` if none).

### AUTH-15: Wrong password for registered account — P1 · Error handling
- **Precondition**: Registered account exists.
- **Steps**: 1. Type its email + a wrong password. 2. Login.
- **Expected**: ✅ "Incorrect password." (localized); ✅ no navigation.

### AUTH-16: CYCLE verification status — P1 · Happy path
- **Precondition**: A business row in Accounts DB.
- **Steps**: 1. Click CYCLE repeatedly.
- **Expected**: ✅ Status advances through the 7-status ring; ✅ `isVerified` flips true only at `kyb_approved`; ✅ CYCLE hidden for `personal` rows.

### AUTH-17: Delete simulated account — P2 · Happy path
- **Steps**: 1. Click × (delete) on a row. 
- **Expected**: ✅ Row removed from `nexora_pending_accounts`; ✅ list refreshes; empty state shows when none remain.

### AUTH-18: Language switch on login (VI/EN) — P1 · i18n
- **Steps**: 1. Toggle VI then EN (top-right).
- **Expected**: ✅ All login + Simulation Panel text updates; ✅ active language button highlighted; ✅ no untranslated keys.

### AUTH-19: Sign out from any logged-in surface returns to login — P0 · Happy path
- **Steps**: 1. From merchant dashboard and from staff dashboard, sign out.
- **Expected**: ✅ Returns to `login` view; ✅ session/active staff cleared.

### AUTH-20: Deep-link entry points — P1 · Edge case
- **Steps**: 1. Open `?flow=customer`. 2. Open `?flow=staff-invite&biz=Foo`.
- **Expected**: ✅ First loads `customer` flow directly; ✅ second loads `staff-portal` with biz=Foo prefilled, bypassing login.

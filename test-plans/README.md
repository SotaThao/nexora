# VLinkNexora — Test Plan Suite

End-to-end QA test plans covering the **entire app**, from the staff side to the business/merchant side. Derived from the actual implementation (`src/App.jsx` view state machine + each feature component).

## App at a glance

VLinkNexora (NEXORA Touch) is a single-page React 18 + Vite (JSX) app. The shell `src/App.jsx` is a `view` state machine. Each view is a major surface under test:

| View | Surface | Test plan |
|---|---|---|
| `login` | SSO login + Simulation Panel (demo entry) | [01-authentication-login.md](01-authentication-login.md) |
| `register-wizard` | New account registration (business / personal) + KYB sim | [02-register-wizard.md](02-register-wizard.md) |
| `onboarding` | Merchant SetupWizard (store, staff, QR, consent) | [03-onboarding-setup-wizard.md](03-onboarding-setup-wizard.md) |
| `dashboard` | Merchant owner dashboard (overview, staff, tips, reviews, transactions, touchpoints, devices, analytics, support) | [04-merchant-dashboard.md](04-merchant-dashboard.md) |
| `dashboard → Settings` | Profile, payout methods, KYB portal/dossier | [05-merchant-settings-kyb.md](05-merchant-settings-kyb.md) |
| `customer` | Customer tipping & review flow (`?flow=customer`) | [06-customer-tipping-review.md](06-customer-tipping-review.md) |
| `staff-portal` | Staff registration / setup wizard (invite link) | [07-staff-registration-portal.md](07-staff-registration-portal.md) |
| `staff-dashboard` | Staff personal dashboard (`!personal`) | [../openspec/changes/add-staff-personal-dashboard/test-cases.md](../openspec/changes/add-staff-personal-dashboard/test-cases.md) |

## Conventions

- **TC IDs** are namespaced per area: `AUTH-`, `REG-`, `ONB-`, `DASH-`, `SET-`, `CUST-`, `SREG-`, `STAFF-` (staff dashboard).
- **Priority**: **P0** blocks release · **P1** degraded UX · **P2** workaround exists · **P3** cosmetic.
- **Type**: Happy path · Edge case · Error handling · Validation · Responsive · i18n · Persistence/Sync.
- Each TC: Precondition → Steps → Expected.

## Test environment

```bash
pnpm install
pnpm dev            # http://localhost:3000 (VITE_PORT)
# Customer flow:   http://localhost:3000/?flow=customer
# Staff invite:    http://localhost:3000/?flow=staff-invite&biz=Golden%20Glow%20Nail%20Spa
```

Optional Supabase sync (staff dashboard / cross-tab realtime): set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in `.env`, then `node scripts/seed-staff-demo.js`.

## Cross-cutting concerns (apply to every plan)

- **i18n**: every screen must render fully in **VI and EN** with no hardcoded/untranslated strings (no raw `key.path` shown). Language switch is top-right on login and in each shell header.
- **Responsive**: desktop ≥1024px (`lg`) vs mobile <1024px. Merchant dashboard uses a slide-in drawer; staff dashboard uses a bottom navbar.
- **Persistence**: domain data flows through `components -> src/data/hooks -> src/data/repositories -> selected adapter`. The current default adapter is `storageAdapter`, which persists via `src/utils/storage.js` to localStorage (+ Supabase when configured). Storage keys remain `nexora_merchant_setup`, `nexora_profile_settings`, `nexora_transactions`, `nexora_reviews`, `nexora_notifications`, `nexora_pending_accounts`, `nexora_staff_account`. Set `VITE_DATA_SOURCE=api` in the future API phase to swap repositories onto the API adapters without changing component-level tests.
- **No console errors** in any flow; production build (`pnpm build`) must pass.
- **Account-type flag**: `!business` (merchant, `role: 'business'`) vs `!personal` (staff, `role: 'personal'`). Staff ID format `NEX-STAFF-XXXX`; VLINKPAY ID `VLP-YYYY-XXXX`.

## Verification status state machine (merchant)

`basic → lite_pending → verified_lite → kyb_required → kyb_pending → kyb_approved → suspended`
(cycled in the login Simulation Panel via the **CYCLE** button). KYB-gated features are locked unless status is `kyb_approved`.

## Coverage summary

| Plan | Area | # TCs |
|---|---|---|
| 01 | Authentication & Login | 20 |
| 02 | Register Wizard | 20 |
| 03 | Onboarding Setup Wizard | 26 |
| 04 | Merchant Dashboard | 53 |
| 05 | Settings & KYB | 30 |
| 06 | Customer Tipping & Review | 34 |
| 07 | Staff Registration Portal | 30 |
| 08 | Staff Personal Dashboard | 45 (in openspec) |
| **Total** | | **258** |

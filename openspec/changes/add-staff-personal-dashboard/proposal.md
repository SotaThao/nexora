## Why

Staff (technicians) have no way to manage their own account on the platform — today only the merchant owner has a dashboard, and the only staff-facing surface is a one-time onboarding wizard (`StaffRegistrationWizard`). Staff cannot see the tips they earned, confirm received payments, manage their own payout methods, or share their personal/business QR. This change introduces a dedicated **Staff personal dashboard** (a `!personal` account experience, distinct from the `!business` owner dashboard) so staff can self-manage their account. It is intended for an upcoming mobile APP but is delivered on the web-app first, backed by real Supabase data for a Product Owner demo.

## What Changes

- Add a new app `view` — `staff-dashboard` — rendered for accounts flagged `!personal`, parallel to the existing merchant `dashboard` (`!business`). Login routes by account flag; a "Staff Login" entry is added to the login Simulation Panel for the demo.
- Add a responsive staff shell: **desktop left sidebar** + **mobile bottom navbar** (new pattern — the merchant dashboard uses a slide-in drawer) + header with brand, language switch, notifications bell, and profile. Bottom-nav tabs mirror the reference app: Home · My QR · Tips · Pay · Profile (Notifications opens from the bell).
- Add six staff screens: **Home** (KPIs, pending tip confirmations, linked businesses), **My QR** (personal QR/link + per-business QR), **Tips** (tip activity + statuses + AI insight), **Pay** (self-managed payout methods), **Profile** (profile fields + per-business display names), **Notifications** (feed + push preferences).
- Wire staff data to **real Supabase** as a single source of truth: Home KPIs and Tips derive from `nexora_transactions` filtered by `staffId`; profile/linked-business/payment basics come from `nexora_merchant_setup.staffList`. A new staff-owned blob (`nexora_staff_account`) holds only staff-owned fields (payout prefs/toggles, bio, push prefs, per-business display names).
- Register `nexora_staff_account` in `DYNAMIC_KEYS` (`src/utils/storage.js`) so it auto-syncs to the `nexora_sync` table with realtime updates.
- Add a repeatable Node seed script (`scripts/seed-staff-demo.js`) that upserts demo data (merchant setup + transactions + one staff account) into Supabase before the demo.
- Add i18n keys (en + vi) for all new UI under a `staff_dashboard.*` namespace.
- Staff ID format stays `NEX-STAFF-XXXX` (consistent with existing data; the reference mockup's `NEX-STF-######` is not adopted).
- Demo scope is 1 staff + 1 business, but the data model and UI are built data-driven so additional staff/businesses render without code changes.

## Capabilities

### New Capabilities
- `staff-account-access`: Account-type flag (`!personal` vs `!business`), routing the staff account to the staff dashboard, and the demo Simulation Panel entry.
- `staff-dashboard-navigation`: Responsive shell (desktop sidebar, mobile bottom navbar, header) and navigation among the six staff screens.
- `staff-tip-tracking`: Home KPIs, pending tip confirmations, and Tips activity derived from merchant transactions filtered by the signed-in staff.
- `staff-payout-methods`: Staff self-managed receiving/payout methods that the owner cannot edit.
- `staff-qr-sharing`: Personal Staff QR/link plus a per-business staff QR (keyed by business–staff link).
- `staff-profile`: Personal profile fields, per-business display names (nicknames), and the linked-businesses list.
- `staff-notifications`: Notification feed and push notification preferences.
- `staff-data-sync`: Supabase-backed staff data via the `nexora_sync` KV table and the `storage` util, single-source connection to merchant data, and a repeatable seed script.

### Modified Capabilities
<!-- openspec/specs/ is currently empty (this is the first change); no existing spec requirements change. Implementation-level edits to storage.js and App.jsx are listed under Impact. -->

## Impact

- **New code**: `src/components/staff-dashboard/` (`StaffDashboard.jsx`, `layout/StaffSidebar.jsx`, `layout/StaffHeader.jsx`, `layout/StaffBottomNav.jsx`, `constants.jsx`, `data/staffMockData.js`, and `views/StaffHome.jsx`, `StaffMyQR.jsx`, `StaffTips.jsx`, `StaffPay.jsx`, `StaffProfile.jsx`, `StaffNotifications.jsx`); `src/contexts/StaffAccountContext.jsx`; `scripts/seed-staff-demo.js`.
- **Modified code**: `src/App.jsx` (new `staff-dashboard` view, flag-based routing, Simulation Panel "Staff Login"); `src/utils/storage.js` (add `nexora_staff_account` to `DYNAMIC_KEYS`); `src/locales/en.json` + `src/locales/vi.json` (new `staff_dashboard.*` keys).
- **Data/backend**: New logical key `nexora_staff_account` in the existing `public.nexora_sync` table (no schema/migration change — same generic KV table and public demo RLS). Reuses `nexora_transactions` and `nexora_merchant_setup`.
- **Dependencies**: None new (reuses `@supabase/supabase-js`, Tailwind, lucide-react, existing contexts and `WalletLogos`).
- **Out of scope**: real authentication/OTP, real QR generation (placeholder), production RLS hardening, and the staff onboarding flow (already exists).

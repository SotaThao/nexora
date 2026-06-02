## 1. Data layer & Supabase wiring

- [ ] 1.1 Add `'nexora_staff_account'` to `DYNAMIC_KEYS` in `src/utils/storage.js`
- [ ] 1.2 Create `src/components/staff-dashboard/data/staffMockData.js` with default staff-owned blob shape (payoutMethods, displayNamesByBusiness, pushPreferences, confirmedTipIds, notificationsRead) keyed by `staffId`
- [ ] 1.3 Create `src/contexts/StaffAccountContext.jsx`: load/save the staff blob via `storage`, derive KPIs/tips from `nexora_transactions` filtered by `staffId`, read profile/linked-business basics from `nexora_merchant_setup.staffList`, and refresh on the `storage` event
- [ ] 1.4 Expose confirm-tip and confirm-all actions (write `confirmedTipIds` to the staff key) and payout/profile/push setters from the context

## 2. Demo seed script

- [ ] 2.1 Create `scripts/seed-staff-demo.js` that reads `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` from `.env` and upserts into `nexora_sync` using the `nexora_v3_` prefix
- [ ] 2.2 Seed `nexora_merchant_setup` (1 business + staff list incl. the demo staff `NEX-STAFF-MIA0123`), `nexora_transactions` (enough rows across statuses for attractive KPIs), and `nexora_staff_account` (demo staff)
- [ ] 2.3 Make the script idempotent (upsert on `id`) and add an `npm` script entry (e.g. `seed:staff-demo`)
- [ ] 2.4 Run the script against the demo project and verify rows exist in `nexora_sync`

## 3. Shell & navigation

- [ ] 3.1 Create `src/components/staff-dashboard/constants.jsx` with `STAFF_MENU_ITEMS` (Home, My QR, Tips, Pay, Profile + Notifications) using lucide icons
- [ ] 3.2 Create `layout/StaffSidebar.jsx` (desktop, ≥1024px) reusing nexora tokens and the merchant sidebar pattern
- [ ] 3.3 Create `layout/StaffBottomNav.jsx` (mobile, `fixed bottom-0 lg:hidden`) with the five tabs and active state
- [ ] 3.4 Create `layout/StaffHeader.jsx` (brand, VI/EN switch, notifications bell, profile control)
- [ ] 3.5 Create `StaffDashboard.jsx` orchestrator: active-screen state, render shell + active view, wrap in `StaffAccountContext` provider, sign-out handler

## 4. Screens

- [ ] 4.1 `views/StaffHome.jsx`: KPI cards (Today/Month/Pending/Rating), Pending Confirmations with confirm + confirm-all, Linked Businesses list
- [ ] 4.2 `views/StaffTips.jsx`: tip activity list (amount, method, business, display name, status) + AI insight panel
- [ ] 4.3 `views/StaffPay.jsx`: self-managed payout methods with per-method toggle + value edit + save, using `WalletLogos`
- [ ] 4.4 `views/StaffMyQR.jsx`: personal QR + Staff ID + share/copy actions; per-business QR list (placeholder QR visuals)
- [ ] 4.5 `views/StaffProfile.jsx`: profile fields edit/save + per-business display names; identity basics aligned with merchant staff entry
- [ ] 4.6 `views/StaffNotifications.jsx`: notification feed with read state + push preference toggles

## 5. App integration & entry

- [ ] 5.1 Add `view === 'staff-dashboard'` rendering `StaffDashboard` in `src/App.jsx`
- [ ] 5.2 Route `!personal` accounts to `staff-dashboard` on login; keep `!business` unchanged
- [ ] 5.3 Add a "Staff Login" action to the login Simulation Panel that opens the staff dashboard as the seeded demo staff

## 6. i18n

- [ ] 6.1 Add `staff_dashboard.*` keys to `src/locales/en.json` for all new UI strings
- [ ] 6.2 Mirror the same keys in `src/locales/vi.json`
- [ ] 6.3 Verify no hardcoded strings remain in the staff dashboard components

## 7. QA & cleanup

- [ ] 7.1 Verify responsive behavior at mobile (<1024px bottom navbar) and desktop (≥1024px sidebar)
- [ ] 7.2 Verify realtime: a transaction change for the staff's `staffId` updates Home/Tips
- [ ] 7.3 Verify language switch (VI/EN) updates all labels and titles
- [ ] 7.4 Remove any `console.*`, run the dev build, and confirm no errors
- [ ] 7.5 Run `openspec validate add-staff-personal-dashboard` and confirm it passes

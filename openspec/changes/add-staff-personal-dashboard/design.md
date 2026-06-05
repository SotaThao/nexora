## Context

VLinkNexora is a single-page React 18 + Vite (JSX) app whose shell (`src/App.jsx`) is a `view` state machine (`login | register-wizard | onboarding | dashboard | customer | staff-portal`). The merchant dashboard already exists under `src/components/dashboard/` with a layout split (`layout/DashboardSidebar.jsx`, `layout/DashboardHeader.jsx`, `views/*`, `constants.jsx`, `data/mockData.js`). State is held in React Context (`LanguageContext`, `NotificationContext`) — there is no Redux/Zustand. Persistence flows through `src/utils/storage.js`, which transparently mirrors an allowlist of keys (`DYNAMIC_KEYS`) into a single generic Supabase KV table `public.nexora_sync` (`id`, `data` jsonb, `updated_at`) with public demo RLS, realtime subscription, and a `_client_updated_at` last-write guard.

This change adds a staff-facing personal dashboard for `!personal` accounts, backed by real Supabase data for a PO demo. It is cross-cutting (new view, new context, storage allowlist change, a seed script) and reuses merchant data as the single source of truth, so a short design is warranted.

## Goals / Non-Goals

**Goals:**
- A self-contained staff dashboard that reuses the NEXORA design system and layout patterns without entangling merchant dashboard logic.
- Real, persisted, realtime-synced demo data via the existing `nexora_sync` mechanism — no new tables or migrations.
- Tips/KPIs derived live from merchant `nexora_transactions` (single source of truth); staff-owned fields isolated in one new key.
- Mobile-first navigation parity with the reference app (bottom navbar), desktop sidebar parity with the merchant dashboard.
- Data-driven rendering so adding staff/businesses needs no code change.

**Non-Goals:**
- Real authentication, OTP, or session security (demo uses flag-based routing + Simulation Panel).
- Real QR encoding (placeholder visuals only).
- Production RLS hardening (demo keeps the existing public policies).
- Staff onboarding (already handled by `StaffRegistrationWizard`).
- A relational schema for staff/tips (KV blob model is retained).

## Decisions

### D1: Separate `staff-dashboard` view, not a role-switch inside the merchant Dashboard
A new `view === 'staff-dashboard'` in `App.jsx` renders a new `StaffDashboard` component tree, parallel to the merchant `dashboard`. Rationale: staff and owner experiences share design tokens but almost no logic or menu; branching the merchant `Dashboard.jsx` by role would bloat an already-large component. **Alternative considered:** a single dashboard switching menu/views by role — rejected for coupling and regression risk to the merchant flow.

### D2: New feature folder `src/components/staff-dashboard/` mirroring the merchant split
Structure: `StaffDashboard.jsx` (orchestrator + active-screen state), `layout/StaffSidebar.jsx`, `layout/StaffHeader.jsx`, `layout/StaffBottomNav.jsx`, `constants.jsx` (`STAFF_MENU_ITEMS`), `data/staffMockData.js` (seed defaults), and `views/{StaffHome,StaffMyQR,StaffTips,StaffPay,StaffProfile,StaffNotifications}.jsx`. Rationale: consistency with the existing `dashboard/` convention and the ~500-line component limit.

### D3: New mobile bottom navbar (the merchant shell uses a drawer)
The merchant dashboard hides its sidebar below `lg` and uses a slide-in drawer. The reference staff app uses a fixed bottom navbar, so `StaffBottomNav` is a new component (`fixed bottom-0 ... lg:hidden`) with the five tabs; Notifications is reached via the header bell. Rationale: matches the requested mobile pattern and the reference content.

### D4: `StaffAccountContext` as the single client state layer, persisting via `storage`
A new `src/contexts/StaffAccountContext.jsx` loads/saves the staff-owned blob through the `storage` util (so it auto-syncs to Supabase), derives KPIs/tips by filtering `nexora_transactions` on `staffId`, and pulls profile/linked-business basics from `nexora_merchant_setup.staffList`. It listens for the `storage` event the sync layer dispatches to refresh on realtime updates. Rationale: reuses the proven sync plumbing; keeps a clear separation between derived (merchant-owned) and owned (staff) data. **Alternative considered:** raw `localStorage` reads in each view — rejected (no sync, duplicated logic).

### D5: Staff-owned data shape under `nexora_staff_account`
Single blob keyed by `staffId` to stay data-driven and to mirror how `nexora_merchant_setup` is one blob:
```
nexora_staff_account = {
  [staffId]: {
    staffId, bio, defaultDisplayName, avatar,
    payoutMethods: { cashapp:{enabled,value}, venmo, zelle, vlinkpay, crypto, ... },
    displayNamesByBusiness: { [businessStaffLinkId]: nickname },
    pushPreferences: { tipConfirmations, reviews, businessInvites },
    confirmedTipIds: [ ... ],          // staff-side confirmation state
    notificationsRead: [ ... ]
  }
}
```
Derived data (KPIs, tip list, linked businesses, identity basics) is NOT stored here. Rationale: avoids duplicating the single source of truth; `confirmedTipIds`/`notificationsRead` capture the only staff-side state tips/notifications need.

### D6: Register `nexora_staff_account` in `DYNAMIC_KEYS`
Add the key to the allowlist in `storage.js` so it participates in migration, `pullAll`, and the realtime subscription exactly like other dynamic keys. This is the only edit to `storage.js`. Rationale: the existing `.includes(key)` exact-match check requires explicit registration (no prefix matching), and a single shared blob fits that model without changing the matcher.

### D7: Repeatable seed via Node script using the anon key
`scripts/seed-staff-demo.js` reads `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` from `.env` and `upsert`s rows into `nexora_sync` (prefixed `nexora_v3_` to match `STORAGE_PREFIX`): `nexora_merchant_setup` (1 business + staff list), `nexora_transactions` (enough rows for attractive KPIs), and `nexora_staff_account` (demo staff). `upsert` on the `id` PK makes re-runs idempotent. Rationale: gives the PO real data in the DB before the demo; repeatable and explicit. **Alternatives considered:** seed-on-load (data only appears after opening the app) and SQL inserts (duplicates the JSON shape in two languages) — both viable but less aligned with "set up real data ahead of the demo."

### D8: Flag-based routing + Simulation Panel entry
`App.jsx` routes `!personal` accounts to `staff-dashboard`. For the demo, a "Staff Login" button is added to the existing Simulation Panel that opens the staff dashboard as the seeded staff. Rationale: matches the app's existing simulation-driven demo style; no real auth needed.

## Risks / Trade-offs

- **Public RLS on `nexora_sync`** → Acceptable for demo only; documented as out of scope for hardening. Anyone with the anon key can read/write the demo data.
- **`STORAGE_PREFIX` mismatch in the seed script** (keys are stored as `nexora_v3_<key>`) → Mitigation: the script imports/duplicates the exact prefix and key names; covered by a re-run check.
- **Last-write guard races** between merchant writes and staff confirmations on overlapping keys → Mitigation: staff confirmations live in the staff-owned key, not in `nexora_transactions`, so the two writers touch different rows.
- **Component bloat** if a view grows past ~500 lines → Mitigation: split panels into sub-components in the same folder, per project convention.
- **Derived KPI cost** recomputing on every transactions update → Mitigation: memoize derivations in the context; dataset is small (demo scale).

## Migration Plan

1. Add `nexora_staff_account` to `DYNAMIC_KEYS` (backward compatible — additive).
2. Land the staff dashboard behind the new `staff-dashboard` view (no change to existing views).
3. Run `node scripts/seed-staff-demo.js` against the demo Supabase project to populate data.
4. Demo via Simulation Panel "Staff Login".
- **Rollback:** remove the `staff-dashboard` view branch and the `DYNAMIC_KEYS` entry; delete seeded rows from `nexora_sync` (or leave them — they are inert for the merchant flow).

## Open Questions

- Should the staff "Confirm received" action also write back into `nexora_transactions` (so the merchant sees confirmation), or stay staff-side only for this iteration? (Current design: staff-side `confirmedTipIds` only.)
- For multi-business later, do we extend `nexora_merchant_setup` to multiple business blobs or introduce a `nexora_businesses` collection? (Out of scope now; data-driven UI already supports N entries.)

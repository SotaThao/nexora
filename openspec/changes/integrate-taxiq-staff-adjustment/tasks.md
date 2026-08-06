## 1. Contract and Query Keys

- [x] 1.1 Add `qk.taxiqStaffAdjustments(staffTaxYearId?)` to `src/data/queryKeys.ts`
- [x] 1.2 Widen `AdjustmentRecordApiDto`/`AdjustmentRecord` in `taxiqOwnerAdjustments.ts` to
      `{ ownerTaxYearId: string | null; staffTaxYearId: string | null }`; export
      `normalizeAdjustment` for reuse (D2)

## 2. `taxiqStaffAdjustments` Repository + Hooks

- [x] 2.1 Create `src/data/repositories/taxiqStaffAdjustments.ts` — `STAFF_ADJUSTMENT_ENTITY_FIELD_MAP`
      (`DeductionRecord`, `MileageLog`, `CashTipLog`, `SelfReportedIncome`), `createAdjustment`,
      `listAdjustments` (D1)
- [x] 2.2 Create `src/data/hooks/useTaxiqStaffAdjustments.ts` — `useStaffAdjustments`,
      `useCreateStaffAdjustment`, mutation invalidates `qk.taxiqStaffAdjustments(staffTaxYearId)`
- [x] Verified: `npx tsc --noEmit` introduces zero new errors (all pre-existing errors are in
      unrelated files); `npx vite build --mode development` clean

## 3. Generalize `CreateAdjustmentModal`

- [x] 3.1 Change props to `{ ownerTaxYearId?: string; staffTaxYearId?: string; ... }` (D3)
- [x] 3.2 Field map / entity-type list picked from `ADJUSTMENT_ENTITY_FIELD_MAP` (Owner) vs
      `STAFF_ADJUSTMENT_ENTITY_FIELD_MAP` (Staff) based on which id prop is set
- [x] 3.3 Create-adjustment call routes to `useCreateOwnerAdjustment` vs `useCreateStaffAdjustment`
      based on which id prop is set
- [x] 3.4 `YearEndExportView.tsx`'s existing call site needs **no change** — `staffTaxYearId` is
      optional, omitting it is already equivalent to passing `undefined`
- [x] 3.5 Added 3 new `taxiq.createAdjustment.entityTypes.*` i18n keys (`mileageLog`,
      `cashTipLog`, `selfReportedIncome`) to `en.json`/`vi.json` — needed for the entity-type
      `<select>` to render Staff options (moved up from planned Ticket/section 6, since the
      modal cannot render without them)
- [x] Verified: `npx tsc --noEmit` and `npx vite build --mode development` clean; en/vi
      `entityTypes` key parity confirmed via a Node script

## 4. Staff Year-End Export — Adjustment Section

- [x] 4.1 Add a "Create Adjustment" card, gated on `canCreateAdjustment` (= `isLocked` — Staff
      never reaches `Exported`, unlike Owner), mirroring `YearEndExportView.tsx`'s Adjustment
      card structure (title/subtitle + button, history table, empty state, skeleton)
- [x] 4.2 Adjustment history list via `useStaffAdjustments(staffTaxYear.id)`
- [x] 4.3 **Revised**: no special "refresh Final Export card" logic added — Owner's screen has
      no such mechanism either (the Final Export result is local component state, only updated
      when the button is explicitly clicked again; there is no live query for "current export
      package" to invalidate). Matching Owner's exact behavior here, not inventing new behavior
      beyond parity.
- [x] Verified live end-to-end (not a simulation): ran the local backend
      (`https://localhost:5005`, `ASPNETCORE_ENVIRONMENT=Test` — see note below) and `pnpm dev`
      equivalent (`npx vite --port 3000`), logged in as the `quanpersonal01@mailinator.com`
      Locked Staff test account via Playwright, navigated to `/staff/taxiq/export`. Confirmed:
      the Adjustment history table renders all 4 pre-existing BE-test records with correct
      Vietnamese-localized timestamps; the Create Adjustment modal opens showing only the 4
      Staff entity types (no Owner-only ones); submitted a real `MileageLog.Miles` adjustment
      (`50 → 55.25`) end-to-end — it appeared in the table immediately via query invalidation,
      with zero console errors.
      **Environment note**: had to run the backend with `ASPNETCORE_ENVIRONMENT=Test` instead of
      `Development` — the committed `appsettings.json` fallback CORS allow-list only contains
      HTTPS origins (`https://localhost:3000` etc.), which doesn't match the plain-HTTP
      `npx vite --port 3000` dev server this repo's `vite.config.ts` actually serves
      (`server: { port: 3000 }`, no `https: true`). `appsettings.Test.json` already includes
      `http://localhost:3000` explicitly, so switching environment (not touching any backend
      code) was the correct fix — same local Postgres database either way since the connection
      string is set explicitly via env var regardless of `ASPNETCORE_ENVIRONMENT`.

## 5. Locked Banner Action Buttons

- [x] 5.1 `AddDeductionWizard.tsx` — remove `!isStaff` guard on the "Go to Export" button, point
      the Staff branch at `/staff/taxiq/export` (D4). **Verified live**: this banner IS the
      actually-reachable one — the "Thêm Khoản Chi"/"Sửa" buttons in the Deduction Center list
      are never disabled while Locked, so Staff reaches this internal wizard banner on any
      edit/create attempt. Confirmed via Playwright: opened the wizard, clicked Next, banner +
      button rendered, button navigated to `/staff/taxiq/export` correctly.
- [x] 5.2 `SelfReportedIncomeWizard.tsx` — added the same action button to its existing
      message-only Locked banner. **Caveat discovered live**: this banner is NOT actually
      reachable in the normal flow — `IncomeSummaryListView.tsx` (the parent list, not
      originally in scope) disables its own "Thêm Thu Nhập Tự Khai" button and hides all
      per-row Edit buttons whenever `staffTaxYearStatus === 'Locked'`, so the wizard never opens
      in that state. Kept this fix anyway (harmless, correct defense-in-depth for any edge case
      that does reach the wizard while locked) but the real fix is 5.4 below.
- [x] 5.3 `LogsView.tsx` (shared banner for `CashTipLogTab.tsx`/`MileageLogTab.tsx`) — added the
      same action button. **Verified live**: this IS the reachable banner (both tabs' Add
      buttons are disabled while locked, but `LogsView`'s own banner always renders regardless).
      Confirmed via Playwright: banner + button rendered on `/staff/taxiq/logs`, button
      navigated to `/staff/taxiq/export` correctly.
- [x] 5.4 **Added (discovered via live testing, not in original scope)**:
      `IncomeSummaryListView.tsx` — this is the actual reachable Locked banner for Self-Reported
      Income (see 5.2 caveat); added the same action button here. Confirmed via Playwright:
      banner + button rendered on `/staff/taxiq/income`, button navigated to
      `/staff/taxiq/export` correctly.

## 6. i18n

- [x] 6.1 Added 3 new keys (`taxiq.createAdjustment.entityTypes.mileageLog/cashTipLog/selfReportedIncome`)
      during Ticket 6 (needed for the modal's entity-type `<select>` to render). All 4 Locked
      banner action buttons (Ticket 8) reuse the existing `taxiq.deductionCenter.errors.lockedAction`
      key ("Go to Year-End Export" / "Đến Year-End Export") — no new keys needed there.
- [x] 6.2 Key parity confirmed via a Node script (see Ticket 6 verification)

## 7. Verification

- [x] 7.1 `npx tsc --noEmit` (pnpm unavailable in this shell, same substitution the
      `integrate-taxiq-owner-deductions` change used) — zero errors introduced by this change
      across all of Ticket 5-7 (confirmed after each ticket by filtering the error list for
      touched files)
- [x] 7.2 `npx vite build --mode development` — clean build after each ticket
- [x] 7.3 Live browser smoke test via Playwright against the local backend
      (`https://localhost:5005`, `ASPNETCORE_ENVIRONMENT=Test` — see §4 note) + local FE dev
      server (`npx vite --port 3000`) — full flow verified: Locked banner history table render,
      modal entity-type scoping, real adjustment create + immediate table refresh, zero console
      errors

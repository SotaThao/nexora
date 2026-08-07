## Context

Owner's Adjustment feature (`integrate-taxiq-owner-adjustment`-equivalent — no OpenSpec change
exists for it; it predates this repo's OpenSpec workflow) already lives in
`YearEndExportView.tsx` + `CreateAdjustmentModal.tsx` + `taxiqOwnerAdjustments.ts` +
`useTaxiqOwnerTaxYearLock.ts`. This change extends the same mechanic to Staff, following the BE
work already completed in the `vlink-nexora` backend repo this same session (see
`docs/plan/tasks/taxiq/be-tasks/test-cases/US-18-taxiq-staff-adjustment-test.md` there for full
BE verification detail).

## Source Contract

### Docs

Backend plan file `vlink-nexora/docs/plan/tasks/taxiq/fe-tasks/assumptions/US-18-assumptions.md`
(original gap analysis) and the TL plan
`h-y-ph-n-t-ch-v-happy-lighthouse.md` (Preliminary Technical Design + Ticket Breakdown,
approved by TL 2026-07-10) drove both the BE and this FE change.

### Backend behavior (verified against backend source + live curl test against a local backend instance this session — **not yet re-verified against a shared dev/staging deployment**, since this is a brand-new endpoint not yet deployed there)

| Operation | Request | Success | Failure |
|---|---|---|---|
| `POST /api/v1/taxiq/staff/tax-years/{id}/adjustments` | `{ entityType, entityId, fieldName, oldValue, newValue, reason, cpaNotes?, receiptId? }` (all values except `cpaNotes`/`receiptId` required; `oldValue`/`newValue` are JSON-encoded strings, e.g. `"45.50"` for a number or `"\"CashFromClient\""` for a string/enum) | `201 Guid` (new adjustment id) | `400 { errorCode }` — `TAXIQ_STAFF_TAX_YEAR_NOT_FOUND`, `TAXIQ_UNAUTHORIZED_BUSINESS` (not this Staff's own tax year), `TAXIQ_STAFF_TAX_YEAR_NOT_LOCKED` (tax year still Active), `TAXIQ_UNSUPPORTED_ADJUSTMENT_FIELD` (entity type or field not in the whitelist), `TAXIQ_ADJUSTMENT_ENTITY_NOT_FOUND` |
| `GET /api/v1/taxiq/staff/tax-years/{id}/adjustments` | — | `200 { items: AdjustmentRecordDto[] }` | `400 TAXIQ_STAFF_TAX_YEAR_NOT_FOUND \| TAXIQ_UNAUTHORIZED_BUSINESS` |

`AdjustmentRecordDto` fields (BE-verified, includes fields the Owner-only type in
`taxiqOwnerAdjustments.ts` didn't have before): `id`, `ownerTaxYearId: string | null`,
`staffTaxYearId: string | null`, `entityType`, `entityId`, `fieldName`, `oldValue`, `newValue`,
`reason`, `cpaNotes?: string | null`, `receiptId?: string | null`, `createdByUserId`,
`createdByUserName`, `createdAt`.

Staff-adjustable `entityType` → field whitelist (BE-enforced, mirrored here per the
`ADJUSTMENT_ENTITY_FIELD_MAP` convention already established for Owner — must stay in sync if BE
changes its switch):

```
DeductionRecord:     Amount, Description, VendorName, BusinessUsePercent   (same as Owner's map)
MileageLog:          Date, Purpose, StartLocation, EndLocation, Miles
CashTipLog:          Date, Amount, Note
SelfReportedIncome:  Amount, TransactionDate, PeriodEndDate, PeriodType, Source,
                     IncomeType, IncomeTypeNote, Notes
```

`PeriodType`/`IncomeType` are enums serialized as their JSON string name (e.g.
`"CashFromClient"`), matching `JsonStringEnumConverter` global config — same convention as every
other TaxIQ enum field already in the FE codebase.

## Decisions

### D1 — Separate `taxiqStaffAdjustments.ts` repository, not a merged dual-id repository

Unlike `taxiqReceipts.ts` (one repository, one function per operation, both ids optional
params), this change adds a **parallel** `taxiqStaffAdjustments.ts` repository/hook/query-key set
rather than merging into `taxiqOwnerAdjustments.ts`. This follows the TL-approved plan's explicit
choice (`qk.taxiqStaffAdjustments` as a new, separate key — same convention already used for
`taxiqOwnerDeductions`/`taxiqStaffDeductions`, `taxiqStaffMileageLogs`/`taxiqStaffCashTipLogs`)
and avoids touching `YearEndExportView.tsx`'s existing Owner call sites (`useOwnerAdjustments`/
`useCreateOwnerAdjustment` keep their exact current names/signatures — zero behavior change for
Owner beyond the DTO type widening in D2).

### D2 — Widen the shared `AdjustmentRecordApiDto`/`AdjustmentRecord` type, don't duplicate it

`taxiqOwnerAdjustments.ts`'s existing types assumed `ownerTaxYearId: string` (always present).
Since the BE DTO now returns both fields as nullable (`ownerTaxYearId: string | null`,
`staffTaxYearId: string | null`), the type is widened in place and `normalizeAdjustment` is
exported so `taxiqStaffAdjustments.ts` can reuse it instead of re-implementing the same mapping.
This is a type-only widening (adding a field, not narrowing/renaming an existing one) — no
behavior change for the existing Owner call sites, which never read `staffTaxYearId` anyway.

### D3 — `CreateAdjustmentModal` selects Owner vs Staff by which id is set, not a `scope` prop

Per the TL-approved plan, the modal takes `{ ownerTaxYearId?: string; staffTaxYearId?: string }`
(mirroring `ReceiptUploadStep.tsx`'s dual-id props) rather than `AddDeductionWizard`'s
`scope: 'owner' | 'staff'` pattern. Internally the modal picks
`ADJUSTMENT_ENTITY_FIELD_MAP` (Owner, 5 entities) vs `STAFF_ADJUSTMENT_ENTITY_FIELD_MAP` (Staff,
4 entities) and `useCreateOwnerAdjustment` vs `useCreateStaffAdjustment` based on which id prop is
non-empty. Callers are responsible for passing exactly one (same discipline as
`ReceiptUploadStep.tsx`'s callers today — no client-side XOR validation, enforced by caller
convention plus the BE's own XOR validator as the real guardrail).

### D4 — Locked banner action button reuses the exact `AddDeductionWizard` Owner pattern

Owner's Locked banner in `AddDeductionWizard.tsx` already has a "Go to Export" button
(`navigate('/dashboard/taxiq/export')`) suppressed for Staff via `!isStaff`. This change removes
that suppression and points the Staff branch at `/staff/taxiq/export` instead.

**Reachability audit, done via live Playwright testing rather than assumed from the plan**:
- Deduction Center's Add/Edit buttons are never disabled while Locked → `AddDeductionWizard`'s
  own internal banner is the one Staff actually sees. Confirmed reachable.
- `LogsView`'s shared banner always renders regardless of the tabs' own Add-button disabled
  state → confirmed reachable as originally planned.
- Self-Reported Income is different: `IncomeSummaryListView.tsx` (its parent list, **not** in
  the original plan) disables its own Add button and hides all row Edit buttons whenever
  `staffTaxYearStatus === 'Locked'`, so `SelfReportedIncomeWizard` never actually opens in that
  state — its internal banner is unreachable in the normal flow. The action button was still
  added there as defense-in-depth (e.g. a race condition between the disabled-check render and
  a stale mutation in flight), but the real fix is adding the button to
  `IncomeSummaryListView.tsx`'s own banner instead, which is what Staff actually sees.

All four reachable surfaces (`AddDeductionWizard`, `LogsView`, `IncomeSummaryListView`, and the
defense-in-depth `SelfReportedIncomeWizard`) now show the same "Go to Year-End Export" action
button, reusing the existing `taxiq.deductionCenter.errors.lockedAction` i18n key. No further
restructuring of the three still-divergent locked-state patterns (self-contained wizard state,
lifted-to-parent `LogsView` state, list-level disabled-button state) — unifying those is out of
scope for this change.

## Open Questions

None outstanding — BE contract fully verified against source + live local-backend test in the
same working session (see BE test-case doc referenced above). This backend endpoint has not yet
been deployed to the shared `test-api.nexoratouch.com` dev environment this repo's CLAUDE.md
names as the live-Swagger source of truth, but local-to-local is fully testable: run the backend
locally (`https://localhost:5005`, `dotnet run --project src/Web --environment Development` in
`vlink-nexora`) and `pnpm dev` here (`.env.development` already points `VITE_API_BASE_URL` at
that same local backend) — this is the verification path used for this change, not a live
`test-api.nexoratouch.com` smoke test.

## Migration Plan

1. Add `qk.taxiqStaffAdjustments(staffTaxYearId?)` to `src/data/queryKeys.ts`.
2. Widen `AdjustmentRecordApiDto`/`AdjustmentRecord` in `taxiqOwnerAdjustments.ts` to the dual
   nullable id shape; export `normalizeAdjustment`.
3. Add `src/data/repositories/taxiqStaffAdjustments.ts` (`STAFF_ADJUSTMENT_ENTITY_FIELD_MAP`,
   `createAdjustment`, `listAdjustments`).
4. Add `src/data/hooks/useTaxiqStaffAdjustments.ts` (`useStaffAdjustments`,
   `useCreateStaffAdjustment`).
5. Generalize `CreateAdjustmentModal.tsx` to dual optional id props (D3).
6. Add the Adjustment section to `StaffYearEndExportView.tsx`.
7. Add the action button to the four Staff Locked banners (D4).
8. Add i18n keys to `en.json`/`vi.json`.
9. Run `pnpm typecheck`, `pnpm build`; live browser smoke test against the local backend once the
   UI pieces (Ticket 7) exist.

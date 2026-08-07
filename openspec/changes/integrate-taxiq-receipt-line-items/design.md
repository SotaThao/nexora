## Context

`integrate-taxiq-owner-deductions` shipped the Deduction Center with a category-first manual wizard. This change adds a receipt-first, multi-item entry point without disturbing that shipped flow. See the plan file used to design this change (`C:\Users\QuanPham\.claude\plans\v-y-h-y-th-c-hi-n-quiet-bengio.md`) for the full backend-source verification trail.

## Source Contract

| Operation | Request | Success | Failure |
|---|---|---|---|
| `POST /api/v1/taxiq/owner/deductions/analyze-receipt?ownerTaxYearId=` | `multipart/form-data`, field `file` | `200 ReceiptAnalysisResultDto { s3Key, fileName, vendor, date, qualityStatus, items[], truncated }` — nothing persisted | `400` (ownership/lock) |
| `POST /api/v1/taxiq/owner/deductions/confirm-receipt` | `{ ownerTaxYearId, s3Key, fileName, vendor?, date, items: [{ description, amount, categoryId, businessUsePercent? }] }` | `201 ConfirmReceiptLineItemsResultDto { items: [{ deductionRecordId, receiptId, description, amount, deductibleAmount, recordStatus, aiDeductionStatus, aiExplanation, aiDisclaimer }] }` — every item already evaluated | `400 TAXIQ_OWNER_TAX_YEAR_LOCKED \| TAXIQ_DEDUCTION_BATCH_LIMIT_EXCEEDED \| TAXIQ_CATEGORY_NOT_FOUND` |
| `POST /api/v1/taxiq/owner/deductions` (existing, wire-unchanged) | flat single-item body | `201 Guid` | same as before |
| `POST /api/v1/taxiq/owner/deductions/{id}/submit` (existing, wire-unchanged) | — | `204` | same as before |
| `POST /api/v1/taxiq/receipts/{id}/link-deduction` (existing, wire-unchanged) | `{ deductionRecordId }` | `204` | same as before |

## Decisions

### D1 — Category matching is deterministic C#, not AI prompt-following

Exact case-insensitive name match wins (tie-break: lowest `DisplayOrder` on duplicate names); otherwise a substring match fires only if it resolves to exactly one candidate; zero or ambiguous matches → `null`, forcing the Owner to pick manually. This is what makes "AI never creates a category" an enforced invariant rather than a prompt instruction that could be ignored.

### D2 — Analyze is stateless; Receipt/DeductionRecord rows only exist after Confirm

`AnalyzeReceiptLineItemsCommand` uploads to S3 (so the file exists once, reused by Confirm) but writes nothing to the database. Items the Owner unchecks in the review step never cost a `Receipt` row, a `DeductionRecord` row, or an `EvaluateDeductionAsync` call.

### D3 — `CreateDeductionCommand`/`LinkReceiptToDeductionCommand`/`SubmitDeductionCommand` became list-based

This was a deliberate, explicit instruction from the requester (not the original design) after two rounds of design discussion: batch creation and batch AI evaluation must happen as one pass over the whole list per command, not as a wrapper repeatedly calling single-item commands via `Mediator.Send`. Consequences:
- `SubmitDeductionCommand` fetches all records in one query, computes each record's `RecordStatus` in a loop (unchanged 4-branch logic), then runs `Task.WhenAll(EvaluateDeductionAsync)` across the whole batch — safe because no `DbContext` operation happens while those calls are in flight (fetch/status-compute finishes first, `SaveChangesAsync` happens after). This is the only reason parallel AI evaluation is safe here; naively calling the *old* single-item `SubmitDeductionCommand` N times via `Mediator.Send` inside `Task.WhenAll` would throw (`InvalidOperationException`, concurrent use of one scoped `DbContext`).
- Every existing single-item HTTP endpoint that used to bind directly to these commands now binds to a small new wire-only request DTO (`CreateDeductionRequest`, `LinkReceiptToDeductionRequest`) and wraps it into a 1-element list before calling `Mediator.Send` — `AddDeductionWizard.tsx` and its hooks required zero changes.
- `ConfirmReceiptLineItemsCommand` calls `CreateDeductionCommand`, `LinkReceiptToDeductionCommand`, `SubmitDeductionCommand` each **exactly once** with the full batch, via `IMediator` (following this codebase's existing internal-dispatch convention, e.g. `LoginCommand.cs`).
- `SubmitDeductionCommand`'s DB fetch uses `Where(d => ids.Contains(d.Id))`, which does **not** guarantee result ordering matches the input list. `ConfirmReceiptLineItemsCommandHandler` looks results up by `DeductionRecordId` in a dictionary rather than assuming positional alignment with `deductionIds[i]`.

### D4 — Duplicate detection runs per item during Confirm

Mirrors `UploadReceiptCommandHandler`'s existing check (vendor+date+amount match within the same tax year) rather than hardcoding `IsDuplicate = false`, since this path bypasses that handler entirely.

### D5 — Batch size cap

`TaxIqConstants.MaxDeductionBatchSize = 10`, enforced by FluentValidation on all three list-based commands (`TAXIQ_DEDUCTION_BATCH_LIMIT_EXCEEDED`) and advisory-only in the AI prompt (`Take(10)` + `Truncated` flag is the real enforcement on the analyze side).

## Known Risks (accepted)

1. `S3Key`/`FileName` round-tripped raw to the client as the analyze→confirm correlation handle — minor internal-path exposure on an authenticated, owner-scoped endpoint.
2. No idempotency key on confirm — a double-submit could create a duplicate record set. Same class of gap the manual wizard already has on `CreateDeductionCommand`; mitigated only by disabling the Confirm button while pending.
3. Touching `SubmitDeductionCommand.cs`/`CreateDeductionCommand.cs`/`LinkReceiptToDeductionCommand.cs` (already-shipped, used by the manual wizard) — mitigated by preserving their exact wire contracts via wrapper DTOs, but still requires regression verification of the manual flow.

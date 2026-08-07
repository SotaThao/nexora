## Why

The shipped Deduction Center (`integrate-taxiq-owner-deductions`) requires the Owner to pick exactly one category before entering an expense, and treats a receipt as a single-item attachment. Real receipts commonly contain multiple line items across different categories (e.g. a Staples receipt: office chair + printer paper + USB cable) — there was no way to represent that.

This change adds a receipt-first entry point: upload a receipt → AI (vision) extracts every line item → the Owner reviews, corrects category matches (AI only matches against the Admin-curated category list — it never creates categories, since `RiskLevel`/`RequiresBusinessUsePercent` drive the CPA-Review safety logic) and fills in Business-use % (a fact only the Owner knows) → on confirm, the response already contains each item's computed deductibility, not a "pending" state requiring a follow-up fetch.

## What Changes

- `ITaxIqAiService`/`TaxIqAiService` gain `AnalyzeReceiptLineItemsAsync` — a second, independent Anthropic call returning a JSON array of line items (vendor/date shared, one amount+description+suggestedCategory per item). The existing single-item `AnalyzeReceiptAsync` is untouched.
- **`CreateDeductionCommand`, `LinkReceiptToDeductionCommand`, `SubmitDeductionCommand` are converted from single-item to list-based** (`List<CreateDeductionItem>`, `List<LinkReceiptToDeductionItem>`, `List<Guid> DeductionRecordIds`) so record creation and AI evaluation for a whole batch happen in one handler call each — not two split phases, and not N repeated single-item Mediator calls. `SubmitDeductionCommand`'s AI evaluation now runs `Task.WhenAll` across the whole batch (safe: no DbContext access happens while those calls are in flight). The existing single-item HTTP endpoints (`POST /deductions`, `POST /deductions/{id}/submit`, `POST /receipts/{id}/link-deduction`) keep their exact wire contracts via small wrapper request DTOs at the controller boundary — the manual `AddDeductionWizard` flow is unaffected.
- New stateless preview command `AnalyzeReceiptLineItemsCommand` (`POST /api/v1/taxiq/owner/deductions/analyze-receipt`) — uploads to S3 once, calls the AI, matches each item against the active category list, persists nothing.
- New orchestrating command `ConfirmReceiptLineItemsCommand` (`POST /api/v1/taxiq/owner/deductions/confirm-receipt`) — creates one synthetic `Receipt` row per confirmed item (all sharing the already-uploaded S3 key, with the same duplicate-detection check `UploadReceiptCommandHandler` already does), then calls the three list-based commands above exactly once each with the full batch, and returns each item's final status/AI result.
- New FE component `AddDeductionFromReceiptWizard.tsx` — upload → review/edit extracted items → confirm — wired into `DeductionCenterView.tsx` as a second entry point alongside the existing "Add Deduction" button.

## Capabilities

### New Capabilities

- `taxiq-receipt-line-items`: analyze a receipt image into candidate line items matched against existing deduction categories; confirm a subset into real deduction records with AI evaluation already computed in the same response.

## Impact

- **Files modified (existing, behavior-preserving at the wire level)**: `CreateDeductionCommand.cs`, `LinkReceiptToDeductionCommand.cs`, `SubmitDeductionCommand.cs`, `OwnerDeductionController.cs`, `ReceiptController.cs`, `DeductionRecordDto.cs` (adds `DeductionSubmitResultDto`), `TaxIqConstants.cs`, `DomainErrorCode.cs`, `ITaxIqAiService.cs`/`TaxIqAiService.cs`.
- **Files new**: `ReceiptLineItemsExtractionResult.cs`, `ReceiptLineItemDtos.cs`, `AnalyzeReceiptLineItemsCommand.cs`, `ConfirmReceiptLineItemsCommand.cs` (backend); `AddDeductionFromReceiptWizard.tsx`, plus additive changes to `taxiqOwnerDeductions.ts`/`useTaxiqOwnerDeductions.ts`/`DeductionCenterView.tsx`/`en.json`/`vi.json` (frontend).
- **Data boundary**: components -> data hooks -> repository -> `httpClient`, unchanged.
- **Non-goals**: Staff-side equivalent (US-11/US-08 territory, out of scope); the full Receipt Vault screen (`/dashboard/taxiq/receipts`, separate ticket); generic `SmartFieldSchema`-driven dynamic fields (still out of scope, same as the base deduction ticket); idempotency keys on confirm (accepted risk, same class of gap the manual wizard already has on `CreateDeductionCommand`).

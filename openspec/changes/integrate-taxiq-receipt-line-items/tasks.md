## 1. AI Service

- [x] 1.1 Add `AnalyzeReceiptLineItemsAsync` to `ITaxIqAiService`/`TaxIqAiService`, new `ReceiptLineItemsExtractionResult`/`ReceiptLineItemExtraction` records
- [x] 1.2 Prompt returns a JSON array of `{description, amount, suggestedCategory}` capped at `TaxIqConstants.MaxDeductionBatchSize` (advisory — real cap is server-side `Take`)

## 2. List-Based Command Conversion (existing, shipped commands)

- [x] 2.1 `CreateDeductionCommand` → `List<CreateDeductionItem>`, returns `List<Guid>`; validator caps batch size
- [x] 2.2 `LinkReceiptToDeductionCommand` → `List<LinkReceiptToDeductionItem>`
- [x] 2.3 `SubmitDeductionCommand` → `List<Guid> DeductionRecordIds`, returns `List<DeductionSubmitResultDto>`; `Task.WhenAll` over `EvaluateDeductionAsync` after the DB-only phase completes
- [x] 2.4 Add `TaxIqConstants.MaxDeductionBatchSize` and `DomainErrorCode.TaxIq.DeductionBatchLimitExceeded`
- [x] 2.5 Wire-compat wrapper DTOs (`CreateDeductionRequest` on `OwnerDeductionController`, `LinkReceiptToDeductionRequest` on `ReceiptController`) so existing single-item endpoints are unchanged at the wire level

## 3. New Receipt Line-Item Commands

- [x] 3.1 `ReceiptLineItemDtos.cs` — `ReceiptLineItemPreviewDto`, `ReceiptAnalysisResultDto`, `ConfirmedDeductionResultDto`, `ConfirmReceiptLineItemsResultDto`
- [x] 3.2 `AnalyzeReceiptLineItemsCommand` — stateless preview, category matcher (exact → single-substring → null)
- [x] 3.3 `ConfirmReceiptLineItemsCommand` — creates synthetic `Receipt` rows (with duplicate check) + calls the 3 list-based commands once each via `IMediator`, results matched by `DeductionRecordId` (not positional order)
- [x] 3.4 New routes on `OwnerDeductionController`: `POST deductions/analyze-receipt`, `POST deductions/confirm-receipt`

## 4. Frontend

- [x] 4.1 Extend `taxiqOwnerDeductions.ts` — `analyzeReceipt`, `confirmReceiptLineItems`, types
- [x] 4.2 Extend `useTaxiqOwnerDeductions.ts` — `useAnalyzeReceiptLineItems`, `useConfirmReceiptLineItems`
- [x] 4.3 New `AddDeductionFromReceiptWizard.tsx` — upload → review (editable rows, keep checkbox, category/business-use validation) → result (reuses `DeductionStatusBadge`/`AiDeductionStatusBadge`)
- [x] 4.4 Wire into `DeductionCenterView.tsx` — second "Add from Receipt" button + independent modal state
- [x] 4.5 i18n keys (`taxiq.deductionCenter.addFromReceiptButton`, `taxiq.deductionCenter.receiptWizard.*`) in `en.json`/`vi.json`, parity verified (102/102 keys)

## 5. Verification

- [x] 5.1 `dotnet build src/Application/Application.csproj` — clean, 0 errors
- [x] 5.2 `dotnet build src/Infrastructure/Infrastructure.csproj` — clean, 0 errors
- [x] 5.3 `dotnet build src/Web/WebAPI.csproj` — 0 `error CS` (compile clean); copy-to-output step failed only due to a local running debug session locking output DLLs (`devenv.exe`/`Nexora.Web.exe`) — **recommend a clean rebuild once that session is stopped**
- [x] 5.4 `npx tsc --noEmit` — 42 pre-existing errors, 0 new (verified by count match before/after)
- [x] 5.5 `npx vite build --mode development` — clean
- [ ] 5.6 Live smoke test (backend running, real Anthropic key, real multi-item receipt photo) — not exercised this session, blocked on the local debug-session DLL lock preventing a fresh Web run
- [ ] 5.7 Regression smoke of the manual `AddDeductionWizard` flow end-to-end against a running backend — not exercised this session, same blocker as 5.6

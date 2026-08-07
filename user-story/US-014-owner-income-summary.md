# US-014 · Owner Income Summary (Gross Income tracking)

> File: `US-014-owner-income-summary.md` · 1 file = 1 story. ID tăng dần, duy nhất toàn repo.

| | |
|---|---|
| **Trạng thái** | Integrated (chưa Tested — chưa smoke test local-to-local) |
| **Ngày tạo** | 2026-07-16 |
| **Epic / Domain** | Tax IQ — Owner |
| **OpenSpec change** | `openspec/changes/integrate-taxiq-owner-income-summary` |
| **Test plan** | Điền khi viết test (xem `vlink-nexora/docs/plan/tasks/taxiq/be-tasks/test-cases/ENH-TICKET-01-taxiq-owner-income-summary-test.md` phía BE) |

## Story

**Là** Business Owner (Chủ tiệm),
**tôi muốn** tự nhập doanh thu (Gross Sales) theo kỳ vào Tax IQ,
**để** hồ sơ CPA của tôi có vế doanh thu bên cạnh vế chi phí/deduction đã có, không phải tự lấy số Gross Sales từ hệ thống khác.

Bối cảnh: BE (Enhancement Ticket 1, `vlink-nexora/docs/business/taxiq/NEXORA_TaxIQ_Enhancement_Tickets.md`)
vừa hoàn tất entity `OwnerIncomeRecord` + endpoint `api/v1/taxiq/owner/incomes` trong cùng phiên làm
việc — hiện chỉ có ở backend local, chưa deploy lên `test-api.nexoratouch.com`. Tính năng mirror gần
như 1:1 luồng Staff Self-Reported Income đã có (`IncomeSummaryListView.tsx` +
`SelfReportedIncomeWizard.tsx`), chỉ đổi chủ thể Thợ → Chủ tiệm và bỏ field `IncomeType` phân loại
theo option riêng của Staff (Cash from Client/Booth Rent...) sang option riêng của Owner (Service
Revenue/Product Retail Revenue/Other).

## Acceptance Criteria

- **Given** Owner đã có `OwnerTaxYear` cho năm hiện tại và đang ở Dashboard
- **When** mở sidebar Tax IQ
- **Then** thấy mục con mới "Income Summary" (route `/dashboard/taxiq/income`), luôn hiển thị (không cần bật module riêng, giống Equipment/CPA Access)

- **Given** Owner mở màn Income Summary, chưa có record nào
- **When** trang tải xong
- **Then** hiển thị empty state + nút "Add Income"

- **Given** Owner mở wizard Add Income
- **When** nhập Amount, Date (Per Transaction hoặc Summary by Period), Source, (tuỳ chọn) Income Type/Notes, next qua từng step
- **Then** gọi `POST /api/v1/taxiq/owner/incomes` ở step 1 (giống pattern Self-Reported Income — mỗi Next là 1 lần save), `PUT` ở step 2, tuỳ chọn upload + link receipt ở step 3

- **Given** Owner nhập Amount > $2,000 và không đính kèm receipt
- **When** lưu xong
- **Then** badge Status hiển thị "CPA Review"; nếu đính kèm receipt thì badge chuyển "Ready"

- **Given** `OwnerTaxYear.Status = Locked`
- **When** Owner mở màn Income Summary
- **Then** nút Add bị disable, banner Locked hiển thị kèm nút điều hướng tới `/dashboard/taxiq/export` (đúng pattern `taxiq.deductionCenter.errors.lockedAction` đã có)

- **Given** Owner cố tạo/sửa/xoá income khi `OwnerTaxYear` đã Locked (race condition bỏ qua UI disable)
- **When** BE trả `400 TAXIQ_OWNER_TAX_YEAR_LOCKED`
- **Then** hiển thị banner lỗi inline dẫn tới Export, không phải toast lỗi chung

## API Mapping (bắt buộc trước khi integrate)

> Nguồn: BE đã implement và build thành công trong session này (không phải Swagger live re-check,
> vì đây là tính năng mới hoàn toàn chưa deploy lên `test-api.nexoratouch.com`) — nguồn xác thực là
> backend source code (`vlink-nexora/backend/src/Web/Controllers/TaxIq/Owner/OwnerIncomeController.cs`
> + `vlink-nexora/backend/src/Application/Features/TaxIq/Owner/OwnerIncome/`). Tag: (L) local
> backend đã build sạch, chưa deploy lên môi trường dev/staging chung. Tham chiếu chéo hành vi với
> `taxiqSelfReportedIncome.ts` (Staff, endpoint tương đương) vì handler BE được viết theo đúng cùng pattern.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| POST | `/api/v1/taxiq/owner/incomes` | Bearer (Owner, self-owned Business only) | `{ ownerTaxYearId, amount, transactionDate, periodEndDate?, periodType?, source, incomeType?, incomeTypeNote?, notes? }` | `201 Guid` | (L) |
| GET | `/api/v1/taxiq/owner/incomes?ownerTaxYearId=` | Bearer | — | `200 OwnerIncomeRecordDto[]` | (L) |
| GET | `/api/v1/taxiq/owner/incomes/{id}` | Bearer | — | `200 OwnerIncomeRecordDto` | (L) |
| PUT | `/api/v1/taxiq/owner/incomes/{id}` | Bearer | `{ amount, transactionDate, periodEndDate?, periodType?, source, incomeType?, incomeTypeNote?, notes? }` | `204` | (L) |
| DELETE | `/api/v1/taxiq/owner/incomes/{id}` | Bearer | — | `204` | (L) |
| POST | `/api/v1/taxiq/owner/incomes/{id}/receipts` | Bearer | `{ receiptId }` | `204` | (L) |

`OwnerIncomeRecordDto`: `id, ownerTaxYearId, amount, transactionDate, periodEndDate?, periodType?
('Week'|'Month'|'Quarter'|'Year'|'Day'), source, incomeType? ('ServiceRevenue'|'ProductRetailRevenue'|'Other'),
incomeTypeNote?, notes?, status ('MissingInfo'|'Ready'|'MissingReceipt'|'CPAReview'|'Locked'),
receipts: [{id, fileName, url}], createdAt, lastModified?`.

Error codes: `TAXIQ_OWNER_TAX_YEAR_NOT_FOUND`, `TAXIQ_UNAUTHORIZED_BUSINESS`,
`TAXIQ_OWNER_TAX_YEAR_LOCKED`, `TAXIQ_OWNER_INCOME_RECORD_NOT_FOUND`, `TAXIQ_RECEIPT_NOT_FOUND`.

**Điểm chưa chắc chắn / cần hỏi BE:** Không còn — toàn bộ endpoint đã build thành công trong cùng
phiên làm việc (BE và FE do cùng 1 người thực hiện nối tiếp). Chưa deploy lên
`test-api.nexoratouch.com`; verify local-to-local (backend local + `pnpm dev` trỏ
`VITE_API_BASE_URL` vào backend local) là cách verify cho story này, theo đúng precedent US-013.

## FE Surface (các layer sẽ đụng)

> Theo data boundary: components → data hooks → repositories → adapter.

| Layer | File | Thay đổi |
|---|---|---|
| Component | `OwnerIncomeSummaryListView.tsx` (mới) | Mirror `IncomeSummaryListView.tsx`, đổi `staffTaxYearId` → `ownerTaxYearId`, banner Locked dẫn `/dashboard/taxiq/export` |
| Component | `OwnerIncomeWizard.tsx` (mới) | Mirror `SelfReportedIncomeWizard.tsx`, income type options đổi thành `ServiceRevenue`/`ProductRetailRevenue`/`Other` |
| Component | `ReceiptUploadStep.tsx` | Generalize thêm optional `ownerIncomeRecordId` (song song `selfReportedIncomeId` đã có) |
| Component | `dashboard/routes/index.tsx` | Thêm `TaxIqIncomeRoute` (mirror `TaxIqDeductionsRoute`) |
| Component | `app/AppRouter.tsx` | Thêm lazy import + `<Route path="taxiq/income">` |
| Component | `dashboard/constants.tsx` | Thêm sidebar child `{ id: 'income', label: 'Income Summary' }` vào `MENU_ITEMS.taxiq.children` |
| Data hook | `useTaxiqOwnerIncome.ts` (mới) | query key: `qk.taxiqOwnerIncome(ownerTaxYearId)`, invalidation sau mutation |
| Repository | `taxiqOwnerIncome.ts` (mới) | normalize shape giống `taxiqSelfReportedIncome.ts` |
| Khác | `queryKeys.ts` | thêm `taxiqOwnerIncome`, `taxiqOwnerIncomeDetail` |
| Khác | `errorCodes.ts`, `locales/en.json`, `locales/vi.json` | thêm `TAXIQ_OWNER_INCOME_RECORD_NOT_FOUND` + namespace `taxiq.ownerIncome.*` |

## Definition of Done

- [ ] AC pass trên môi trường dev — **chưa verify** local-to-local (không có backend local đang chạy trong session này)
- [x] API call đúng contract đã map (verify qua backend source — cùng người viết BE+FE trong session này)
- [x] Mutation invalidate đúng query cache (`qk.taxiqOwnerIncome`) — theo code, chưa verify runtime
- [ ] Không console error — chưa verify (cần chạy thật)
- [x] `npx tsc --noEmit` và build clean
- [x] Cập nhật trạng thái file này + link TC (xem `openspec/changes/integrate-taxiq-owner-income-summary/tasks.md`)

## Ghi chú phiên thực thi

**2026-07-16**: Implement toàn bộ data layer (`taxiqOwnerIncome.ts` + `useTaxiqOwnerIncome.ts`),
generalize `ReceiptUploadStep.tsx` thêm `ownerIncomeRecordId`, tạo `OwnerIncomeSummaryListView.tsx`
+ `OwnerIncomeWizard.tsx` (mirror 1:1 Staff Self-Reported Income, đổi income type set), wire route
`/dashboard/taxiq/income` + sidebar. Phát hiện khi wire sidebar: label thực tế lấy từ
`t('dashboard.menu.taxiq_income')`, không phải field `label` trên `MENU_ITEMS` — đã bổ sung key
này vào cả 2 file locale (không có trong plan gốc). `npx tsc --noEmit` và `npx vite build
--mode development` sạch, không lỗi mới trong bất kỳ file nào bị đụng.

**Chưa làm**: chưa smoke test thật qua browser (không có backend local chạy trong session này để
verify local-to-local, khác với precedent US-013 đã chạy được Playwright thật). Đây là rủi ro còn
lại cần đóng trước khi coi story là "Tested" — xem `tasks.md` §7.3.

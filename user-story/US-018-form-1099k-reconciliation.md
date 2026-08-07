# US-018 · 1099-K Reconciliation

> File: `US-018-form-1099k-reconciliation.md` · 1 file = 1 story. ID tăng dần, duy nhất toàn repo.

| | |
|---|---|
| **Trạng thái** | Tested (verify local-to-local qua Playwright thành công 2026-07-17) |
| **Ngày tạo** | 2026-07-17 |
| **Epic / Domain** | Tax IQ — Staff Self-Reported Income |
| **OpenSpec change** | — (mở rộng feature Self-Reported Income đã có sẵn, không tạo shared layer mới) |
| **Test plan** | Xem `vlink-nexora/docs/plan/tasks/taxiq/be-tasks/test-cases/ENH-TICKET-07-taxiq-1099k-reconciliation-test.md` phía BE |

## Story

**Là** Thợ (Staff, 1099 Contractor) nhận tip qua Cash App/Venmo/PayPal,
**tôi muốn** ghi nhận số tiền thực tế trên 1099-K mà nền tảng thanh toán phát hành cho tôi, và xem nó
được đối chiếu tự động với số tôi đã tự khai trong Tax IQ cùng platform,
**để** phát hiện sớm khoản chênh lệch (ví dụ do bạn bè chuyển tiền lẫn vào), ghi chú giải thích, và tránh
bị IRS gửi CP2000 vì khai thiếu so với 1099-K mà IRS nhận được độc lập từ nền tảng thanh toán.

Bối cảnh: BE (Enhancement Ticket 7) triển khai trong phiên này:
- `SelfReportedIncome` thêm field `Platform?` (nullable enum `CashApp`/`Venmo`/`PayPal` — **không có Zelle**,
  vì Zelle không phải Third-Party Settlement Organization nên không bao giờ phát hành 1099-K).
- Entity mới `Form1099KAmount` (1 dòng/platform/năm thuế của Thợ, unique `(StaffTaxYearId, Platform)`):
  `ReportedAmount` (số trên 1099-K thật), `VarianceNote?`.
- `GetForm1099KReconciliationQuery`: chỉ trả về các platform Thợ đã nhập `Form1099KAmount` (không tự sinh
  cả 3 platform mặc định); với mỗi dòng, tự SUM `SelfReportedIncome.Amount` cùng platform +
  `StaffTaxYearId` → `selfReportedAmount`; `variance = reportedAmount - selfReportedAmount`.
- Không tạo controller riêng — 2 endpoint mới nằm trong `StaffSelfReportedIncomeController.cs` đã có sẵn.

## Acceptance Criteria

- **Given** Thợ đang ở bước 2 ("Details") của `SelfReportedIncomeWizard`, chọn Income Type =
  "Cash from Client"
- **When** form hiển thị
- **Then** thấy thêm dropdown "Payment platform (optional)" (Cash App/Venmo/PayPal); dropdown này **ẩn**
  với các Income Type khác (Other Salon Income/Booth Rent/Other)

- **Given** Thợ chọn Platform = Cash App, lưu Self-Reported Income
- **When** submit
- **Then** `platform: "CashApp"` được gửi trong payload Create/Update; reload thấy pre-fill đúng dropdown

- **Given** Thợ mở màn Income (`/staff/taxiq/income`), cuộn xuống dưới `IncomeSummaryListView`
- **When** trang render
- **Then** thấy section "1099-K Reconciliation" mới, bảng 3 cột chính (Tự khai | Trên 1099-K | Chênh lệch)
  + cột Explanation

- **Given** Thợ bấm "Add 1099-K Amount", chọn Platform = Cash App, nhập ReportedAmount = 7200, note giải
  thích khoản chênh lệch
- **When** submit
- **Then** gọi `POST /api/v1/taxiq/staff/self-reported-incomes/1099k`; bảng reload hiển thị dòng Cash App
  với `selfReportedAmount` = tổng các Self-Reported Income cùng platform Cash App, `variance = 7200 -
  selfReportedAmount`

- **Given** Thợ đã có sẵn dòng Cash App trong bảng
- **When** mở dropdown Platform ở form "Add 1099-K Amount"
- **Then** Cash App không xuất hiện trong danh sách chọn (chỉ còn Venmo/PayPal) — mỗi platform chỉ có 1
  dòng/năm thuế

- **Given** Staff Tax Year đang ở trạng thái `Locked`
- **When** xem section 1099-K Reconciliation
- **Then** nút "Add"/"Edit" bị ẩn/disable, hiển thị banner locked giống `IncomeSummaryListView`

## API Mapping (bắt buộc trước khi integrate)

> Nguồn: BE implement trong phiên này — `StaffSelfReportedIncomeController.cs`
> (`vlink-nexora/backend/src/Web/Controllers/TaxIq/Staff/StaffSelfReportedIncomeController.cs`),
> `UpsertForm1099KAmountCommand.cs`, `GetForm1099KReconciliationQuery.cs`. Tag: (L) local backend,
> `dotnet build` sạch, migration `AddForm1099KAmountAndPlatform` đã apply vào DB local, chưa deploy
> `test-api.nexoratouch.com`.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| POST | `/api/v1/taxiq/staff/self-reported-incomes` | Bearer (Staff) | `+ platform?: 'CashApp'\|'Venmo'\|'PayPal'` (field mới, optional) | `201` + id | (L) |
| PUT | `/api/v1/taxiq/staff/self-reported-incomes/{id}` | Bearer (Staff) | `+ platform?` | `204` | (L) |
| GET | `/api/v1/taxiq/staff/self-reported-incomes?staffTaxYearId=` | Bearer (Staff) | — | `+ platform?: string \| null` trong mỗi record | (L) |
| POST | `/api/v1/taxiq/staff/self-reported-incomes/1099k` | Bearer (Staff) | `{ staffTaxYearId, platform, reportedAmount, varianceNote? }` (upsert theo `(staffTaxYearId, platform)`) | `201` + id | (L) |
| GET | `/api/v1/taxiq/staff/self-reported-incomes/1099k-reconciliation?staffTaxYearId=` | Bearer (Staff) | — | `[{ id, platform, selfReportedAmount, reportedAmount, variance, varianceNote?, createdAt, lastModified? }]` — chỉ trả các platform đã có `Form1099KAmount`, không tự sinh đủ 3 platform | (L) |

Error codes: dùng lại `TAXIQ_STAFF_TAX_YEAR_LOCKED`, `TAXIQ_STAFF_TAX_YEAR_NOT_FOUND`,
`TAXIQ_UNAUTHORIZED_BUSINESS` (không có code mới — Upsert là find-or-create, không có case NotFound).

**Điểm chưa chắc chắn / cần hỏi BE:** Không còn — cùng người thực hiện cả BE lẫn FE trong phiên này.
Quyết định UI đã chốt cùng Team Leader: gắn thẳng section reconciliation vào
`StaffTaxIqIncomeRoute.tsx` (không tạo route/sidebar riêng — `StaffSidebar.tsx` xác nhận
`STAFF_MENU_ITEMS.taxiq.children` là dead code, không render submenu thật).

## FE Surface (các layer sẽ đụng)

> Theo data boundary: components → data hooks → repositories → adapter.

| Layer | File | Thay đổi |
|---|---|---|
| Component | `SelfReportedIncomeWizard.tsx` | Thêm dropdown Platform ở step "Details", chỉ hiện khi Income Type = `CashFromClient` |
| Component | `Form1099KReconciliationView.tsx` (mới) | Bảng đối chiếu 3 cột + form Add/Edit theo platform |
| Component | `StaffTaxIqIncomeRoute.tsx` | Mount `Form1099KReconciliationView` cạnh `IncomeSummaryListView` |
| Data hook | `useTaxiqForm1099K.ts` (mới) | `useTaxiqForm1099KReconciliation()`, `useUpsertForm1099KAmount()` — invalidate cả `qk.taxiqForm1099KReconciliation` và `qk.taxiqSelfReportedIncome` |
| Repository | `taxiqForm1099K.ts` (mới) | `PAYMENT_PLATFORMS`, `listReconciliation()`, `upsert()` |
| Repository | `taxiqSelfReportedIncome.ts` | Thêm `platform` vào `ApiDto`/`Record`/`Fields`, payload create/update |
| Query keys | `queryKeys.ts` | Thêm `taxiqForm1099KReconciliation(staffTaxYearId)` |
| Khác | `locales/en.json`, `vi.json` | Namespace `taxiq.form1099kReconciliation.*` + `taxiq.selfReportedIncome.form.platformLabel/platformPlaceholder` |

## Definition of Done

- [x] BE build sạch (`dotnet build`), migration tạo + apply vào DB local thành công
- [x] AC pass trên môi trường dev — verify local-to-local qua Playwright (2026-07-17): Staff
  `quanpersonal02@mailinator.com` tạo Self-Reported Income (Cash from Client + Cash App, $6,500), thêm
  1099-K Amount ($7,200 + note), bảng reconciliation hiển thị đúng $6,500/$7,200/$700 (khớp ví dụ Chị Hoa
  trong BA doc); platform đã dùng biến mất khỏi dropdown Add; Edit khóa platform
- [x] API call đúng contract đã map — verify qua network thật: `POST /self-reported-incomes` → 201,
  `PUT /self-reported-incomes/{id}` → 204, `POST /self-reported-incomes/1099k` → 201,
  `GET /self-reported-incomes/1099k-reconciliation` → 200, tất cả đúng payload
- [x] Mutation invalidate đúng query cache — **phát hiện bug lúc test**: xóa Self-Reported Income không
  invalidate cache bảng reconciliation (số tự khai bị stale). Đã fix bằng cách thêm
  `qk.taxiqForm1099KReconciliation` vào `invalidateAfterMutation()` trong `useTaxiqSelfReportedIncome.ts`;
  verify lại real-time (không reload trang) sau fix — đúng
- [x] Không console error — 0 error/warning trong toàn bộ phiên test (login, tạo/sửa/xóa Self-Reported
  Income, tạo/sửa 1099-K Amount)
- [x] `npx tsc --noEmit` và `vite build --mode development` sạch (không lỗi mới trong file đã sửa —
  tsc có baseline lỗi pre-existing không liên quan ticket này, đã xác nhận không file nào của ticket
  xuất hiện trong output)
- [x] Cập nhật trạng thái file này

**Chưa test**: Locked-state UI (case 11 trong test checklist BE), negative amount validation qua API trực
tiếp, cross-staff unauthorized access, chuyển ngôn ngữ VI thực tế trên UI — chỉ verify qua code review,
rủi ro thấp (pattern giống hệt `SelfReportedIncome` locked/auth check đã hoạt động ổn định), nhưng nên
verify riêng trước khi coi là Done hoàn toàn.

## Ghi chú phiên thực thi

**2026-07-17**: Implement đầy đủ BE (entity `Form1099KAmount`, enum `PaymentPlatform`, migration
`AddForm1099KAmountAndPlatform`, `UpsertForm1099KAmountCommand`, `GetForm1099KReconciliationQuery`, 2
endpoint mới trong `StaffSelfReportedIncomeController`) + FE (repository `taxiqForm1099K.ts`, hook
`useTaxiqForm1099K.ts`, dropdown Platform trong `SelfReportedIncomeWizard.tsx`, component
`Form1099KReconciliationView.tsx` mới, mount vào `StaffTaxIqIncomeRoute.tsx`). Quyết định UI (gắn vào
Income route thay vì route riêng) đã chốt cùng Team Leader trước khi code, dựa trên phát hiện
`StaffSidebar.tsx` không render submenu con cho Tax IQ (dead code) nên tạo route riêng sẽ không có lối
vào rõ ràng nếu không sửa thêm phần điều hướng ngoài phạm vi ticket.

Verify qua Playwright phát hiện 1 bug cache-invalidation thật (không phải chỉ lý thuyết): xóa Self-Reported
Income không làm bảng reconciliation cập nhật lại số tự khai — đã fix và verify lại ngay trong phiên, xem
chi tiết ở Definition of Done.

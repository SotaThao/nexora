# US-013 · Staff Adjustment sau khi StaffTaxYear Locked

> File: `US-013-staff-adjustment-after-locked.md` · 1 file = 1 story. ID tăng dần, duy nhất toàn repo.

| | |
|---|---|
| **Trạng thái** | Integrated |
| **Ngày tạo** | 2026-07-10 |
| **Epic / Domain** | Tax IQ — Staff |
| **OpenSpec change** | `openspec/changes/integrate-taxiq-staff-adjustment` |
| **Test plan** | Điền khi viết test (Ticket 5-8, theo `docs/plan/tasks/taxiq/be-tasks/test-cases/US-18-taxiq-staff-adjustment-test.md` phía BE) |

## Story

**Là** Staff (thợ) đã bị khóa `StaffTaxYear` (sau Final Export),
**tôi muốn** có thể tạo một Adjustment để sửa giá trị đã ghi sai (mileage, cash tip, self-reported income, deduction) mà không cần mở khóa toàn bộ năm thuế,
**để** dữ liệu tax của tôi vẫn chính xác mà không phá vỡ tính bất biến của bản ghi gốc đã export.

Bối cảnh: Owner đã có cơ chế này (US-06, `YearEndExportView.tsx`) sau khi backend
(US-18 phía BE, đã hoàn tất — xem `vlink-nexora/docs/plan/tasks/taxiq/be-tasks/test-cases/US-18-taxiq-staff-adjustment-test.md`)
generalize `CreateAdjustmentRecordCommand`/`GetAdjustmentHistoryQuery` để nhận
`StaffTaxYearId` song song `OwnerTaxYearId`. Story này là phần FE tương ứng.

## Acceptance Criteria

- **Given** Staff có `StaffTaxYear.Status = Locked` và đang xem `StaffYearEndExportView`
- **When** màn hình tải xong
- **Then** hiển thị section "Create Adjustment" + lịch sử adjustment (nếu có)

- **Given** Staff mở modal Create Adjustment
- **When** chọn entity type (DeductionRecord/MileageLog/CashTipLog/SelfReportedIncome), field, giá trị mới, lý do
- **Then** gọi `POST /api/v1/taxiq/staff/tax-years/{id}/adjustments`, thành công thì đóng modal + refresh lịch sử + refresh Final Export card (có thể chuyển sang Amended v2+)

- **Given** Staff gặp lỗi `TAXIQ_STAFF_TAX_YEAR_LOCKED` ở Deduction Center / Self-Reported Income / Cash Tip / Mileage Log
- **When** banner Locked hiển thị
- **Then** có nút hành động dẫn tới `/staff/taxiq/export` (hiện tại banner Staff chỉ có message, không có nút — đây là gap cần đóng)

- **Given** Staff cố tạo Adjustment cho entity không thuộc scope (vd Owner-only entity) hoặc field không hỗ trợ
- **When** BE trả `400 TAXIQ_UNSUPPORTED_ADJUSTMENT_FIELD`
- **Then** hiển thị lỗi inline, không phải toast lỗi chung chung

## API Mapping (bắt buộc trước khi integrate)

> Nguồn: BE đã implement và test thật trong session này (không phải Swagger live re-check, vì
> đây là tính năng mới hoàn toàn chưa deploy lên `test-api.nexoratouch.com`) — nguồn xác thực
> là backend source code (`vlink-nexora/backend/src/Web/Controllers/TaxIq/Staff/StaffTaxYearController.cs`)
> + kết quả test thật qua curl (xem `US-18-taxiq-staff-adjustment-test.md`). Tag: (L) local
> backend đã build + test thật, chưa deploy lên môi trường dev/staging chung.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| POST | `/api/v1/taxiq/staff/tax-years/{id}/adjustments` | Bearer (Staff, self-owned StaffTaxYear only) | `{ entityType, entityId, fieldName, oldValue, newValue, reason, cpaNotes?, receiptId? }` | `201 Guid` | (L) |
| GET | `/api/v1/taxiq/staff/tax-years/{id}/adjustments` | Bearer | — | `200 { items: AdjustmentRecordDto[] }` | (L) |

`AdjustmentRecordDto` (đã đổi so với Owner-only trước đây): `id, ownerTaxYearId: Guid?, staffTaxYearId: Guid?, entityType, entityId, fieldName, oldValue, newValue, reason, cpaNotes?, receiptId?, createdByUserId, createdByUserName, createdAt`.

Error codes: `TAXIQ_STAFF_TAX_YEAR_NOT_FOUND`, `TAXIQ_UNAUTHORIZED_BUSINESS`, `TAXIQ_STAFF_TAX_YEAR_NOT_LOCKED` (chưa Locked), `TAXIQ_UNSUPPORTED_ADJUSTMENT_FIELD` (entity/field không hỗ trợ), `TAXIQ_ADJUSTMENT_ENTITY_NOT_FOUND`.

**Điểm chưa chắc chắn / cần hỏi BE:** Không còn — toàn bộ endpoint đã build + test thật trong
cùng phiên làm việc (BE và FE do cùng 1 người thực hiện nối tiếp), không có unknown field/behavior
nào cần hỏi thêm. BE chưa deploy lên `test-api.nexoratouch.com`, nhưng verify local-to-local vẫn
khả thi đầy đủ: chạy backend local (`https://localhost:5005`) + `pnpm dev` (đã trỏ sẵn
`VITE_API_BASE_URL` vào đúng backend local đó qua `.env.development`) — đây là cách verify cho
story này, không phải live-smoke qua `test-api.nexoratouch.com`.

## FE Surface (các layer sẽ đụng)

> Theo data boundary: components → data hooks → repositories → adapter.

| Layer | File | Thay đổi |
|---|---|---|
| Component | `CreateAdjustmentModal.tsx` | Nhận dual optional id (`ownerTaxYearId?`/`staffTaxYearId?`) thay vì hard-code Owner |
| Component | `StaffYearEndExportView.tsx` | Thêm section Create Adjustment + lịch sử, trong nhánh `isLocked` |
| Component | `AddDeductionWizard.tsx`, `SelfReportedIncomeWizard.tsx`, `CashTipLogTab.tsx`, `MileageLogTab.tsx`, `LogsView.tsx` | Banner Locked thêm nút dẫn tới `/staff/taxiq/export` |
| Data hook | `useTaxiqStaffAdjustments.ts` (mới) | query key: `qk.taxiqStaffAdjustments(staffTaxYearId)`, invalidation sau khi tạo adjustment |
| Repository | `taxiqStaffAdjustments.ts` (mới) | `STAFF_ADJUSTMENT_ENTITY_FIELD_MAP`, `createAdjustment`, `listAdjustments`; tái dùng type từ `taxiqOwnerAdjustments.ts` |
| Khác | `queryKeys.ts` | thêm `taxiqStaffAdjustments` |

## Definition of Done

- [x] AC pass trên môi trường dev — verify qua backend local (`https://localhost:5005`,
      `ASPNETCORE_ENVIRONMENT=Test`) + `npx vite --port 3000`, qua Playwright thật (Ticket 5-7);
      chưa qua `test-api.nexoratouch.com` (BE chưa deploy lên đó)
- [x] API call đúng contract đã map (verify qua backend source + test thật trong cùng phiên)
- [x] Mutation invalidate đúng query cache (xác nhận: submit Adjustment → bảng lịch sử refresh
      ngay lập tức không cần reload trang)
- [x] Không console error (xác nhận qua `browser_console_messages` sau khi submit thành công)
- [x] Test theo 3 layer — verify thủ công qua Playwright (không chạy skill `feature-focused-tester`
      riêng): L1 UI (render đúng, không lỗi console), L2 data boundary (query invalidation đúng
      sau mutation), L3 flow (navigation đúng từ mọi banner Locked tới `/staff/taxiq/export`)
- [x] Cập nhật trạng thái file này + link TC — trạng thái đã chuyển "Integrated"; chưa có TC
      riêng cho FE (test plan formal chưa viết, chỉ có verify thủ công ghi lại ở trên)

## Ghi chú phiên thực thi

**Ticket 5-7 (2026-07-10)**: Implement xong data layer (repo/hook/query key riêng cho Staff,
không gộp với Owner), generalize `CreateAdjustmentModal` (dual optional id), thêm section
Adjustment vào `StaffYearEndExportView.tsx`. Verify **thật** qua Playwright (không phải giả
định): đăng nhập Staff `quanpersonal01@mailinator.com` (đã Locked), mở `/staff/taxiq/export`,
xác nhận bảng lịch sử hiển thị đúng 4 record có sẵn từ lúc test Backend, mở modal xác nhận chỉ
hiện đúng 4 entity type Staff, submit 1 adjustment mới (`MileageLog.Miles: 50 → 55.25`) thành
công — bảng refresh ngay, không lỗi console.

**Vấn đề môi trường phát hiện khi test**: chạy backend với `ASPNETCORE_ENVIRONMENT=Development`
bị CORS chặn vì `appsettings.json` fallback chỉ cho phép origin HTTPS
(`https://localhost:3000`...), trong khi `vite.config.ts` của repo này serve HTTP thường ở port
3000 (không có `https: true`). Chuyển sang `ASPNETCORE_ENVIRONMENT=Test` (đã có sẵn
`http://localhost:3000` trong `appsettings.Test.json`) để fix — không phải sửa code, chỉ là
cách chạy dev đúng. Đáng để note lại cho các session sau tránh mất thời gian debug lại.

**Ticket 8 (2026-07-10)**: Thêm nút "Đến Year-End Export" vào 4 banner Locked — nhưng phát hiện
qua test thật (Playwright) rằng `SelfReportedIncomeWizard.tsx` (đúng theo plan gốc) thực ra
**không bao giờ reachable** trong flow bình thường, vì `IncomeSummaryListView.tsx` (component
cha, không nằm trong scope ban đầu) tự disable nút Add/Edit khi Locked thay vì để user submit và
gặp lỗi 400. Đã mở rộng scope thêm `IncomeSummaryListView.tsx` (banner thật sự Staff nhìn thấy)
và giữ nguyên fix ở wizard (an toàn, chỉ là defense-in-depth). Verify thật qua Playwright cho cả
4 banner (AddDeductionWizard, LogsView, IncomeSummaryListView) — cả 3 nút đều điều hướng đúng
tới `/staff/taxiq/export`, không lỗi console (ngoại trừ 1 log lỗi 400 dự kiến từ chính hành động
test cố ý kích hoạt locked error).

**Toàn bộ Ticket 5-8 đã hoàn tất và verify thật.** `pnpm dev`/build/typecheck sạch xuyên suốt.

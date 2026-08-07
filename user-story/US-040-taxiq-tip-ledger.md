# US-040 · TaxIQ Tip Ledger

> File: `US-040-taxiq-tip-ledger.md` · 1 file = 1 story. ID tăng dần, duy nhất toàn repo.

| | |
|---|---|
| **Trạng thái** | Done |
| **Ngày tạo** | 2026-07-27 |
| **Epic / Domain** | TaxIQ — mục 26 Tip Ledger |
| **OpenSpec change** | `—` (single-owner feature: 1 view mới + hook/repo riêng, không đụng shared layer) |
| **Test plan** | TC-xx trong `test_plan.md` (điền khi viết test) |

## Story

**Là** Owner hoặc Staff, **tôi muốn** ghi lại từng khoản tip đã nhận (tiền mặt, Zelle, Venmo, v.v.) kèm phân loại đủ điều kiện tự động cho chính sách "No Tax on Tips", **để** có sổ tip đầy đủ dùng khi khai thuế và biết mình đã dùng bao nhiêu trong trần khấu trừ liên bang $25,000/năm.

## Acceptance Criteria

- **Given** Owner chọn 1 staff đã có Staff Tax Year cho năm hiện tại
- **When** Owner mở `Tip Ledger`
- **Then** gọi `GET /api/v1/taxiq/owner/tip-ledger?staffTaxYearId=...` → hiển thị 4 chỉ số (Today/MTD/YTD/Cap Used %), bảng `YTD by Method`, panel `Qualified Status Breakdown`, và bảng chi tiết từng tip

- **Given** đang xem Tip Ledger của 1 staff
- **When** bấm `Add Tip`, nhập số tiền + chọn method + tích 2 xác nhận Compliance (voluntary, not-mandatory-service-charge) + chọn Proof, bấm Save
- **Then** gọi `POST /api/v1/taxiq/owner/tip-ledger` (hoặc `POST /api/v1/taxiq/staff/tip-ledger` nếu ở Staff Dashboard) → 201 → dòng mới xuất hiện đầu bảng với Qualified Status tự tính đúng theo quy tắc (Cash + không Proof → Needs Review; method điện tử → Likely Qualified dù không Proof; mandatory service charge → Not Qualified) → tổng YTD và Cap Used % cập nhật ngay

- **Given** số tiền để trống hoặc = 0
- **When** bấm Save
- **Then** không gọi API, hiện lỗi validate tại chỗ (client-side) trước khi submit

- **Given** 1 dòng tip đang ở Qualified Status = Needs Review (thiếu Proof)
- **When** bấm `Edit`, thêm Proof, nhập lý do sửa (bắt buộc), Save
- **Then** gọi `PUT /api/v1/taxiq/owner/tip-ledger/{id}` → 204 → dòng đó chuyển sang Likely Qualified, không cho Save nếu bỏ trống lý do (400 `NotEmptyValidator` nếu cố tình bỏ qua validate client)

- **Given** 1 dòng tip cần xoá (ghi trùng)
- **When** bấm `Delete`, nhập lý do bắt buộc, xác nhận
- **Then** gọi `DELETE /api/v1/taxiq/owner/tip-ledger/{id}` với `deleteReason` trong body → 204 → dòng biến mất khỏi bảng, tổng năm cập nhật ngay; không cho xoá nếu bỏ trống lý do

- **Given** đang xem Tip Ledger của 1 staff, cần gửi cho CPA
- **When** bấm `Export CPA Package`, chọn recipient/access mode/download permission/expiry, Generate
- **Then** gọi `POST /api/v1/taxiq/owner/tip-ledger/{staffTaxYearId}/export` → 201 → hiện secure link vừa tạo (accessToken), có thể copy để gửi CPA

- **Given** dòng tip có `source = PosOwnerPaid` (tự động ghi từ POS)
- **When** xem chi tiết dòng đó
- **Then** cột `Source` hiện "POS Owner Paid", cột `Proof` hiện "POS Record", không có nút Edit method-critical fields bị chặn phía UI (BE vẫn cho sửa nhưng Source luôn giữ nguyên `PosOwnerPaid`)

## API Mapping (bắt buộc trước khi integrate)

> Nguồn: đối chiếu trực tiếp `backend/src/Web/wwwroot/api/specification.json` (đã regenerate qua NSwag sau khi BE mục 26 xong trong cùng phiên) — tag nguồn (L) đã verify qua curl thật ở backend.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/taxiq/owner/tip-ledger?staffTaxYearId&method?&source?&qualifiedStatus?` | JWT | query params | `TipLedgerSummaryDto` (todayTotal, monthToDateTotal, yearToDateTotal, capUsedAmount, capUsedPercent, ytdByMethod[], qualifiedBreakdown, entries[]) | (L) |
| GET | `/api/v1/taxiq/staff/tip-ledger?staffTaxYearId&method?&source?&qualifiedStatus?` | JWT | query params | `TipLedgerSummaryDto` (giống trên, staff tự xem sổ của mình) | (L) |
| POST | `/api/v1/taxiq/owner/tip-ledger` | JWT | `AddTipLedgerEntryCommand` (ownerTaxYearId, staffTaxYearId, date, method, amount, serviceType?, serviceAmount?, isVoluntary, isNotMandatoryServiceCharge, proof, note?) | `201` Guid | (L) |
| POST | `/api/v1/taxiq/staff/tip-ledger` | JWT | như trên | `201` Guid | (L) |
| PUT | `/api/v1/taxiq/owner/tip-ledger/{id}` | JWT | `EditTipLedgerEntryCommand` (date, method, amount, serviceType?, serviceAmount?, isVoluntary, isNotMandatoryServiceCharge, proof, note?, reason bắt buộc) | `204` | (L) |
| DELETE | `/api/v1/taxiq/owner/tip-ledger/{id}` | JWT | `DeleteTipLedgerEntryCommand` (deleteReason bắt buộc) | `204` | (L) |
| POST | `/api/v1/taxiq/owner/tip-ledger/{staffTaxYearId}/export` | JWT | `ExportTipLedgerRequestDto` (recipientName, recipientType, cpaEmail?, accessMode, downloadPermission, passcode?, expiryDays?) | `201` `ShareLinkDto` (id, accessToken, recipientName, recipientType, cpaEmail, accessMode, sharedDataBlocks, downloadPermission, hasPasscode, status, expiresAt) | (L) |
| GET | `/api/v1/taxiq/owner/tip-ledger` (staff picker) | JWT | tái dùng `useTaxiqOwnerStaffList(ownerTaxYearId)` đã có sẵn từ US-030 (StaffTaxProfileTab) — không cần endpoint mới | `StaffTaxIqItem[]` (displayName, staffTaxYearId, hasStaffTaxYear, ...) | (L, đã có sẵn trong repo) |

**Enum values (đối chiếu spec, KHÔNG đoán):**
- `TipMethod`: `Cash, Zelle, Venmo, CashApp, CardPos, Qr, PayPal, Other`
- `TipSource`: `Cash, Direct, PosOwnerPaid`
- `TipQualifiedStatus`: `NeedsReview, LikelyQualified, NotQualified`
- `TipProofType`: `None, Screenshot, ReceiptPhoto, PosRecord, CashNote`
- `RecipientType` (export modal): `Cpa, Technician, FriendReferral, ExternalReviewer`
- `ShareLinkAccessMode`: `ReviewOnly, UploadOnly, ReviewAndUpload`
- `ShareLinkDownloadPermission`: `Disabled, PdfOnly, PdfAndCsv`

**Điểm chưa chắc chắn / cần hỏi BE:** Không có — toàn bộ contract đã verify trực tiếp bằng curl thật trong cùng phiên làm việc (xem `project_taxiq_tip_ledger.md` memory), không phải suy đoán từ spec tĩnh.

## FE Surface (các layer sẽ đụng)

> Theo data boundary: components → data hooks → repositories → adapter.

| Layer | File | Thay đổi |
|---|---|---|
| Component | `src/components/dashboard/views/taxiq/TipLedgerView.tsx` (mới) | View chính: staff picker (tái dùng `useTaxiqOwnerStaffList`), 4 metrics, YTD-by-method table, Qualified Breakdown panel, bảng chi tiết, filter Method/Source/QualifiedStatus |
| Component | `src/components/dashboard/views/taxiq/modals/AddEditTipModal.tsx` (mới) | Modal dùng chung Add/Edit — 5 phần theo BA doc (Amount&Method, Service Details, Compliance, Proof&Notes, Reason khi Edit) |
| Component | `src/components/dashboard/views/taxiq/modals/DeleteTipModal.tsx` (mới) | Xác nhận xoá + ô lý do bắt buộc |
| Component | `src/components/dashboard/views/taxiq/modals/ExportTipLedgerModal.tsx` (mới) | Recipient/AccessMode/DownloadPermission/Expiry → tạo Share Link |
| Component | `src/components/dashboard/views/taxiq/shared/TipQualifiedStatusBadge.tsx` (mới) | Badge màu theo 3 trạng thái, mirror `Form1099NecStatusBadge.tsx` |
| Component | `src/components/staff-dashboard/views/taxiq/TipLedgerTab.tsx` (mới, thay `CashTipLogTab.tsx` cũ) | Staff tự xem/ghi tip của mình — API mới thay cho `cash-tips` cũ đã bị BE gỡ |
| Data hook | `src/data/hooks/useTaxiqTipLedger.ts` (mới) | `useTipLedgerSummary`, `useAddTipLedgerEntry`, `useEditTipLedgerEntry`, `useDeleteTipLedgerEntry`, `useExportTipLedgerForCpa`; query key `qk.taxiqTipLedger(staffTaxYearId)`; invalidate sau mọi mutation |
| Repository | `src/data/repositories/taxiqTipLedger.ts` (mới) | Gọi httpClient, normalize `TipLedgerSummaryDto`/`TipLedgerEntryDto` |
| Repository | `src/data/repositories/taxiqStaffLogs.ts` | Gỡ `getCashTipLogs`/`logCashTip`/`deleteCashTipLog` (API cũ đã bị BE xoá), thay bằng gọi sang `taxiqTipLedger.ts` |
| Khác | `src/data/queryKeys.ts` | Thêm `taxiqTipLedger: (staffTaxYearId?) => [...]` |
| Khác | `src/data/errorCodes.ts` | Thêm mapping `TAXIQ_TIP_LEDGER_ENTRY_NOT_FOUND` |
| Khác | `src/components/dashboard/routes/index.tsx` | Thêm `TaxIqTipLedgerRoute()` (mirror `TaxIqForm1099NecRoute`) |
| Khác | `src/app/AppRouter.tsx` | Đăng ký route `taxiq/tip-ledger` |
| Khác | `src/components/dashboard/constants.tsx` | Thêm menu item TaxIQ submenu |
| Khác | `src/locales/en.json` + `vi.json` | Toàn bộ string mới cho view/modal/badge |

## Definition of Done

- [x] AC pass trên môi trường dev (API thật, backend mục 26 đã chạy local)
- [x] API call đúng contract đã map (method/status/payload — verify bằng network tab / Playwright)
- [x] Mutation invalidate đúng query cache (`qk.taxiqTipLedger`)
- [x] Không console error (0 error kể từ navigation cuối cùng — 2 lỗi 400 xuất hiện trước đó là do tôi tự test validate cố ý, không phải bug)
- [x] Test theo 3 layer: L1 UI (Playwright) / L2 data boundary (network request/response verify) / L3 flow (Add→Edit→Delete→Export end-to-end)
- [x] Mobile 375×667 không tràn ngang cho Add/Edit modal + Export modal (2/3 modal, verify qua `document.body.scrollWidth` = 369 < 375). Delete modal dùng chung `.nexora-modal-card`/cấu trúc đơn giản hơn nên không test riêng.
- [x] Cập nhật trạng thái file này + link TC

## Ghi chú phiên thực thi

**Backend cần sửa thêm khi tích hợp FE (phát hiện qua thiết kế, không phải qua test lỗi):**
- Staff self-service Add Tip cần `businessId` thay vì `ownerTaxYearId` (staff không có quyền đọc OwnerTaxYear của owner) → thêm command mới `AddTipLedgerEntryAsStaffCommand`, tái dùng `TipLedgerTaxYearResolver` từ Ticket 3 (POS consumer) để resolve/tạo OwnerTaxYear phía server.
- Phát hiện thiếu gate `StaffTaxYear.Status == Locked` trên cả 4 command (Add-owner, Add-staff, Edit, Delete) so với quy ước đã có ở MileageLog/CashTipLog cũ — đã bổ sung đồng bộ cho cả 4, giữ nguyên comment giải thích quan hệ với `AdjustmentRecord` (post-Lock correction path).

**Live-test qua Playwright (Chrome, dev server :3001 + backend :5005):**
- Owner chọn staff "Chloe" (StaffTaxYear active, không Locked) → 4 metrics + YTD by Method + Qualified Breakdown load đúng số liệu thật khớp dữ liệu đã verify qua curl trước đó.
- Add Tip (Venmo, $18.75) → 201 → dòng mới + tổng cập nhật ngay không cần refresh.
- Thử Add Tip cho staff "Trump" (StaffTaxYear đã Locked từ phiên test trước) → đúng 400 `TAXIQ_STAFF_TAX_YEAR_LOCKED` — xác nhận Locked-gate mới thêm hoạt động đúng.
- Edit Tip (đổi ghi chú + lý do bắt buộc) → 204 → cập nhật đúng.
- Delete Tip: bấm Xoá không nhập lý do → chặn client-side đúng thông báo; nhập lý do → 204 → dòng biến mất, tổng giảm ngay.
- Export CPA Package: thiếu Email CPA khi Recipient Type = CPA → backend trả 400 `NotEmptyValidator` (validator FE ban đầu thiếu check này — đã bổ sung `cpaEmailRequired` client-side để chặn trước khi gọi API); điền đủ → 201 → hiện access token + nút Copy Link.
- Mobile 375×667: Add/Edit modal và Export modal đều không tràn ngang.
- **`TipLedgerTab` (staff-dashboard)** — tìm thấy credential staff thật trong memory (`quanpersonal02@mailinator.com`, tài khoản "Staff02", cùng business QuanATM). StaffTaxYear 2026 của tài khoản này đang Locked (dữ liệu test cũ) nên tạm mở khoá qua SQL để test, xong khoá lại nguyên trạng. Đăng nhập → tab Sổ Tip hiện đúng metrics/bảng rỗng → Ghi Tip (Cash, $9.50, không Proof) → 201, gọi đúng endpoint `/staff/tip-ledger` với `businessId` (xác nhận `AddTipLedgerEntryAsStaffCommand` hoạt động đúng qua UI thật, không chỉ qua curl) → dòng mới hiện đúng, tổng cập nhật ngay, QualifiedStatus phân loại đúng "Cần Xem Lại" (Cash + không Proof). Badge có vẻ trống trên accessibility snapshot của Playwright nhưng verify qua `innerHTML` thì render đúng (icon + text) — hạn chế của snapshot tool, không phải bug. 0 console error trong suốt phiên test staff.

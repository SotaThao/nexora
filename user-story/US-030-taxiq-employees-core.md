# US-030 · TaxIQ Employees core (mục 11 Payroll doc)

> File: `US-030-taxiq-employees-core.md`

| | |
|---|---|
| **Trạng thái** | Done |
| **Ngày tạo** | 2026-07-22 |
| **Epic / Domain** | TaxIQ — Payroll / Employees |
| **OpenSpec change** | `—` (extends existing `StaffTaxProfileTab.tsx`, single-owner scope) |
| **Test plan** | — |

## Story

**Là** Payroll Admin / HR,
**tôi muốn** thấy trạng thái TIN (Verified/Pending/Missing), năm W-4 thật, filing status, bang cư trú/làm việc, và ngày cập nhật gần nhất của từng worker trong danh sách staff hiện có, xác thực TIN bằng một cú nhấp, và mời worker mới kèm phân loại W-2/1099/Unknown,
**để** biết ngay ai đủ hồ sơ trả lương và mời nhanh nhân sự mới mà không cần tạo staff thủ công trước.

## Acceptance Criteria

- **Given** Owner mở tab Staff Tax Profile
- **When** danh sách tải xong
- **Then** mỗi dòng hiện thêm cột TIN Status (badge Missing/Pending/Verified), W-4 Year (số thật), Filing, Residence, Work, Updated (ngày hoặc "Not started")

- **Given** Owner nhấn `Invite Employee`, nhập Legal name + Email + Worker type (W-2/1099/Unknown), Expiry, Reminder cadence
- **When** submit thành công
- **Then** gọi `POST /api/v1/taxiq/owner/staff/invite` (201), danh sách refetch, worker mới xuất hiện với TIN Status `Missing`, Contract Type đúng loại đã chọn

- **Given** một worker có TIN Status `Pending` (đã nộp SSN qua link tự khai)
- **When** Owner nhấn `Verify`
- **Then** gọi `PUT /api/v1/taxiq/owner/staff-tin/verify` (204), danh sách refetch, TIN Status chuyển `Verified`

- **Given** một worker có TIN Status `Missing` hoặc đã `Verified`
- **When** Owner nhấn `Verify`
- **Then** nút bị disable hoặc ẩn (chỉ hiện khi Pending) — không cho gọi API ở trạng thái không hợp lệ

## API Mapping (bắt buộc trước khi integrate)

> Nguồn: BE-verified qua live curl trong session backend cùng ngày (11/11 test case pass) — xem
> `vlink-nexora/backend/docs/plan/tasks/taxiq/be-tasks/test-cases/US-22-taxiq-employees-core-test.md`.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/taxiq/owner/staff?ownerTaxYearId=` | Owner JWT | — | `StaffTaxIqItemDto[]` +`tinStatus, w4TaxYear, filingStatus, residenceState, workState, updatedAt` | (L) |
| PUT | `/api/v1/taxiq/owner/staff-tin/verify` | Owner JWT | `{businessStaffLinkId}` | `204` | (L) |
| POST | `/api/v1/taxiq/owner/staff/invite` | Owner JWT | `{businessId, ownerTaxYearId, legalName, email, workerType, expiryDays, reminderCadence}` | `201 {businessStaffLinkId, staffProfileId, inviteLink}` | (L) |

**Điểm chưa chắc chắn / cần hỏi BE:** Không còn — toàn bộ contract xác nhận qua curl thật.

## FE Surface (các layer sẽ đụng)

| Layer | File | Thay đổi |
|---|---|---|
| Component | `src/components/dashboard/views/taxiq/tabs/StaffTaxProfileTab.tsx` | Thêm cột TIN Status/W-4 Year/Filing/Residence/Work/Updated, nút Verify, nút Invite Employee (mở modal mới) |
| Component | `src/components/dashboard/views/taxiq/modals/InviteEmployeeModal.tsx` (mới) | Form Legal name/Email/Worker type/Expiry/Reminder |
| Data hook | `src/data/hooks/useTaxiqOwnerPayouts.ts` | Thêm `useVerifyStaffTin`, `useInviteEmployee` |
| Repository | `src/data/repositories/taxiqOwnerPayouts.ts` | Mở rộng `StaffTaxIqItemApiDto`/`StaffTaxIqItem`; thêm `verifyStaffTin`, `inviteEmployee` |
| Khác | `src/data/errorCodes.ts` | `TAXIQ_STAFF_TAX_PROFILE_NOT_FOUND`, `TAXIQ_STAFF_TIN_VERIFICATION_NOT_ALLOWED` |
| Khác | `src/locales/en.json`, `vi.json` | `taxiq.payoutCenter.staffTaxProfile.*` mở rộng, `taxiq.inviteEmployee.*` mới |

## Definition of Done

- [x] AC pass trên môi trường dev (local backend)
- [x] API call đúng contract đã map (method/status/payload — verify bằng network)
- [x] Mutation invalidate đúng query cache
- [x] Không console error
- [x] Test theo 3 layer (skill feature-focused-tester): L1 UI / L2 data boundary / L3 flow
- [x] Cập nhật trạng thái file này + link TC

## Ghi chú phiên thực thi

Test live qua Playwright trên local backend (`https://localhost:5005`) + FE dev server
(`localhost:3000`), đăng nhập Owner (`quanpm`). Năm thuế thật 2026 đang Locked nên dùng lại
OwnerTaxYear 2031 (Active) từ session trước để test các luồng cần `canEdit=true`, bằng cách mock
`window.Date` phía browser rồi điều hướng qua sidebar (client-side routing) thay vì `page.goto` để
giữ nguyên mock — đúng kỹ thuật đã dùng ở US-027/028.

Kết quả:
- Xem read-only trên năm 2026 (Locked): tất cả cột mới (TIN, W-4 Year, Filing, Residence, Work,
  Updated) hiện đúng, không có nút Invite Employee/Verify (đúng vì `canEdit=false`).
- Trên năm 2031 (Active): filter TIN status hoạt động đúng (chọn "Verified" chỉ còn 1 dòng); nút
  Verify chỉ hiện ở dòng `tinStatus=Pending`, bấm xong chuyển đúng "Verified" và biến mất; Invite
  Employee tạo thành công 1 worker mới ("Jane FE Test", 1099) xuất hiện ngay trong bảng với TIN
  Missing, W9 Status Pending (đúng logic suy ra từ ContractType C1099).
- Toàn bộ network trace khớp `PUT .../staff-tin/verify` (204) và `POST .../staff/invite` (201),
  cả hai đều tự động refetch bảng staff list. Không có console error nào phát sinh từ code mới.

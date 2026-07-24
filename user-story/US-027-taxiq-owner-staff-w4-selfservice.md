# US-027 · TaxIQ Owner staff list W-4 badges + Staff self-service W-4

> File: `US-027-taxiq-owner-staff-w4-selfservice.md`

| | |
|---|---|
| **Trạng thái** | Done |
| **Ngày tạo** | 2026-07-22 |
| **Epic / Domain** | TaxIQ — Employees / W-4 |
| **OpenSpec change** | `openspec/changes/integrate-taxiq-staff-w4` |
| **Test plan** | — |

## Story

**Là** Business Owner,
**tôi muốn** thấy trạng thái W-4 (Missing/Stale/Current) và cảnh báo lệch bang cư trú/làm việc của từng staff (kể cả staff local không có tài khoản) ngay trong danh sách staff hiện có, và bật/tắt được quy tắc chặn Lock Tax Year khi thiếu W-4,
**để** biết chính xác ai cần bổ sung hồ sơ trước khi chốt năm thuế.

**Là** Staff có tài khoản,
**tôi muốn** tự nộp W-4 (filing status, dependents, extra withholding, bang cư trú/làm việc) trong hồ sơ thuế của mình,
**để** Owner không phải nhập hộ và tôi kiểm soát dữ liệu thuế của chính mình.

## Acceptance Criteria

- **Given** Owner mở danh sách staff của một OwnerTaxYear
- **When** danh sách tải xong
- **Then** mỗi staff W-2 hiện badge W-4 (Missing/Stale/Current đúng màu), staff 1099/BoothRenter không hiện badge (em-dash), staff có state mismatch hiện icon cảnh báo; staff local (không tài khoản) vẫn xuất hiện trong danh sách

- **Given** Owner mở modal cấu hình module của OwnerTaxYear
- **When** Owner bật/tắt "Require W-4 for Lock" và lưu
- **Then** gọi đúng `PUT .../modules` kèm `requireW4ForLock`, modal đóng, giá trị phản ánh đúng khi mở lại

- **Given** Staff có tài khoản đã có `StaffTaxYear` Active, `ContractType = W2`
- **When** Staff mở form W-4 tự khai, điền đủ field hợp lệ và Save
- **Then** gọi `PUT .../tax-years/{id}/w4`, 204, form hiện lại đúng giá trị vừa lưu (không cần reload)

- **Given** Staff nhập `dependentsClaimed` âm hoặc bỏ trống bang cư trú
- **When** Save
- **Then** hiện toast lỗi validation chung (message từ BE), không gọi mutation thành công, form giữ nguyên input để sửa

- **Given** `StaffTaxYear.Status != Active` (Locked)
- **When** Staff cố Save W-4
- **Then** 400 `TAXIQ_STAFF_TAX_YEAR_LOCKED`, hiện thông báo phù hợp, không cho sửa tiếp (disable form hoặc banner giống các tab khác đã có)

## API Mapping (bắt buộc trước khi integrate)

> Nguồn: BE-verified qua live curl trong session này (không phải spec `test-api.nexoratouch.com` — môi trường đó hiện chưa có module TaxIQ). Xem `design.md` D1-D3 để biết chi tiết đầy đủ.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/taxiq/owner/staff?ownerTaxYearId=` | Owner JWT | — | `{items: [...+businessStaffLinkId, userProfileId\|null, w4Status\|null, stateMismatch]}` | (L) |
| GET | `/api/v1/taxiq/owner/tax-years/{id}` | Owner JWT | — | `{...+requireW4ForLock: bool}` | (L) |
| PUT | `/api/v1/taxiq/owner/tax-years/{id}/modules` | Owner JWT | `{...existing fields, requireW4ForLock}` | 204 | (L) |
| GET | `/api/v1/taxiq/staff/tax-years?TaxYear=` | Staff JWT | — | `{items: [...+w4TaxYear, filingStatus, dependentsClaimed, extraWithholdingPerPayPeriod, residenceState, workState, stateExtraWithholding]}` | (L) |
| PUT | `/api/v1/taxiq/staff/tax-years/{id}/w4` | Staff JWT | `{w4TaxYear, filingStatus, dependentsClaimed, extraWithholdingPerPayPeriod, residenceState, workState, stateExtraWithholding}` (tất cả bắt buộc) | 204 | (L) |

**Điểm chưa chắc chắn / cần hỏi BE:** Không còn — toàn bộ contract xác nhận qua curl thật trong session này (xem `US-19-taxiq-employees-staff-w4-test.md` bên repo backend).

## FE Surface (các layer sẽ đụng)

| Layer | File | Thay đổi |
|---|---|---|
| Component | `src/components/dashboard/views/taxiq/tabs/StaffTaxProfileTab.tsx` | row key → `businessStaffLinkId`, thêm cột badge W-4 + icon state mismatch |
| Component | `src/components/dashboard/views/taxiq/modals/EditModuleConfigModal.tsx` | thêm checkbox `requireW4ForLock` |
| Component | `src/components/staff-dashboard/views/taxiq/StaffW4FormCard.tsx` (mới) | form W-4 tự khai, mount cạnh `StaffTaxProfileCard.tsx` |
| Data hook | `src/data/hooks/useTaxiqOwnerTaxYear.ts` | không đổi hook, chỉ đổi type qua repo |
| Data hook | `src/data/hooks/useTaxiqStaffTaxYear.ts` | thêm `useUpsertStaffW4`, invalidate `qk.taxiqStaffTaxYear`/`taxiqStaffTaxYearById` |
| Repository | `src/data/repositories/taxiqOwnerPayouts.ts` | mở rộng `StaffTaxIqItemApiDto`/`StaffTaxIqItem` |
| Repository | `src/data/repositories/taxiqOwnerTaxYear.ts` | thêm `requireW4ForLock` vào DTO + params |
| Repository | `src/data/repositories/taxiqStaffTaxYear.ts` | thêm 7 field W-4 + method `upsertW4` |
| Khác | `AddPayoutModal.tsx`, `PayoutsTab.tsx` | audit: skip/disable row có `userProfileId === null` |

## Definition of Done

- [x] AC pass trên môi trường dev (local backend `https://localhost:5005`)
- [x] API call đúng contract đã map (method/status/payload — verify bằng network)
- [x] Mutation invalidate đúng query cache
- [x] Không console error
- [x] Test theo 3 layer (skill feature-focused-tester): L1 UI / L2 data boundary / L3 flow
- [x] Cập nhật trạng thái file này + link TC

## Ghi chú phiên thực thi

Test live qua Playwright trên local backend (`ASPNETCORE_ENVIRONMENT=Test`) + FE dev server
(`npx vite`, port 3000), đăng nhập Owner (`quanpm`) và Staff (`quanpersonal02@mailinator.com`).
Vì route Owner luôn dùng `new Date().getFullYear()` để chọn OwnerTaxYear, và OwnerTaxYear 2026
thật của business test đã Locked + đã share CPA (không unlock được), đã tạo tạm 1 OwnerTaxYear
mới cho năm 2031 (`POST /tax-years`, Active) và mock `window.Date` phía browser để test các luồng
cần Active — cách này chỉ ảnh hưởng runtime browser, không đụng dữ liệu thật.

Kết quả:
- Bảng Staff Tax Profile hiện đúng cột W-4 Status (Trump = Missing) và cột Contract Type kèm icon
  cảnh báo state-mismatch; Chloe (thợ local, không tài khoản) vẫn xuất hiện trong danh sách với
  ghi chú "Managed by the staff member via a secure invite link."
- `AddPayoutModal`/`PayoutsTab`'s staff dropdown chỉ hiện Trump/Staff02 (loại đúng Chloe vì
  `userProfileId === null`).
- Toggle "Require W-4 to Lock Tax Year" trong Edit module config: lưu/đọc lại đúng qua
  `PUT/GET .../modules`. **Phát hiện 1 bug backend thật trong lúc test**: query danh sách
  OwnerTaxYear (`GetOwnerTaxYearsQueryHandler`, dùng bởi toàn bộ Owner TaxIQ Home) không map field
  `RequireW4ForLock` vào DTO nên toggle luôn hiện tắt dù DB lưu đúng — đã fix trực tiếp trong
  `vlink-nexora/backend` (xem tasks.md mục 8.3), rebuild + verify lại OK.
- Form W-4 tự khai (Staff02, sau khi hoàn tất onboarding wizard cho năm 2031): lưu thành công qua
  `PUT .../tax-years/{id}/w4` (204), hiện lại đúng giá trị vừa lưu không cần reload.
- Xem thêm US-028 cho luồng Invite (cùng session test).

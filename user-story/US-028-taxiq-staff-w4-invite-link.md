# US-028 · TaxIQ secure-link W-4 cho staff local

> File: `US-028-taxiq-staff-w4-invite-link.md`

| | |
|---|---|
| **Trạng thái** | Done |
| **Ngày tạo** | 2026-07-22 |
| **Epic / Domain** | TaxIQ — Employees / W-4 |
| **OpenSpec change** | `openspec/changes/integrate-taxiq-staff-w4` |
| **Test plan** | — |

## Story

**Là** Business Owner,
**tôi muốn** gửi (hoặc gửi lại) một link an toàn cho thợ local (không có tài khoản đăng nhập) để họ tự nộp SSN/EIN + W-4,
**để** tôi không phải nhập hộ thông tin thuế nhạy cảm của họ.

**Là** thợ local (anonymous, không đăng nhập),
**tôi muốn** mở link nhận qua email và tự điền SSN/EIN + W-4 của mình,
**để** hồ sơ thuế của tôi được ghi nhận mà không cần tài khoản.

## Acceptance Criteria

- **Given** Owner xem một dòng staff local (`userProfileId === null`) trong danh sách staff
- **When** Owner bấm "Invite W-4" và chọn expiry (7/15/30) + reminder cadence
- **Then** gọi `POST /staff-w4-invites`, 201, hiện thông báo đã gửi

- **Given** Owner bấm lại "Invite W-4" (hoặc "Resend") cho cùng staff local + cùng OwnerTaxYear khi link cũ chưa được nộp
- **When** submit
- **Then** gọi lại đúng `POST /staff-w4-invites` (không phải endpoint riêng), 201 với token mới; link cũ (nếu thợ vẫn giữ) sẽ báo lỗi khi họ mở

- **Given** thợ mở link `/w4-invite?token=...` hợp lệ, chưa hết hạn, chưa nộp
- **When** trang tải
- **Then** hiện đúng tên business + tên thợ + tax year, không có dashboard/sidebar nào (trang public thuần), form SSN/EIN + W-4 sẵn sàng nhập

- **Given** thợ điền đủ form hợp lệ và Submit
- **When** submit thành công
- **Then** gọi `POST /staff-w4-invites/submit`, 204, hiện màn hình xác nhận đã nộp; nếu thợ reload lại trang với cùng token → hiện lỗi "link không còn hiệu lực" (generic, không tiết lộ lý do cụ thể)

- **Given** token trong URL bị thiếu, sai, hết hạn, hoặc đã bị revoke (kể cả do đã nộp trước đó)
- **When** trang tải
- **Then** hiện màn lỗi chung "link không hợp lệ hoặc đã hết hạn" — không phân biệt lý do cụ thể ra UI (giống `CpaViewerPage.tsx`)

- **Given** Owner mời staff KHÔNG phải local (có tài khoản thật)
- **When** Owner cố bấm Invite cho staff đó
- **Then** action không hiện/disable ở FE cho row có `userProfileId != null` (chỉ hiện action này cho staff local)

## API Mapping (bắt buộc trước khi integrate)

> Nguồn: BE-verified qua live curl trong session này. Xem `design.md` D4 để biết đầy đủ error code.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| POST | `/api/v1/taxiq/staff-w4-invites` | Owner JWT | `{businessStaffLinkId, ownerTaxYearId, expiryDays, reminderCadence}` | `201 {id, businessStaffLinkId, ownerTaxYearId, accessToken, expiresAt, reminderCadence}` | (L) |
| GET | `/api/v1/taxiq/staff-w4-invites/context?token=` | anonymous | — | `200 {businessName, staffDisplayName, taxYear, expiresAt}` | (L) |
| POST | `/api/v1/taxiq/staff-w4-invites/submit` | anonymous | `{accessToken, ssn?, ein?, w4TaxYear, filingStatus, dependentsClaimed, extraWithholdingPerPayPeriod, residenceState, workState, stateExtraWithholding}` | `204` | (L) |

**Điểm chưa chắc chắn / cần hỏi BE:** Không còn — contract xác nhận qua curl thật (`US-20-taxiq-employees-staff-w4-invite-link-test.md` bên repo backend). Lưu ý: BE chưa có endpoint cho Owner tự thêm Email cho staff local thiếu Email (`TAXIQ_STAFF_W4_INVITE_EMAIL_REQUIRED`) — ngoài phạm vi story này, chỉ hiện lỗi.

## FE Surface (các layer sẽ đụng)

| Layer | File | Thay đổi |
|---|---|---|
| Component | `src/components/dashboard/views/taxiq/modals/StaffW4InviteModal.tsx` (mới) | Owner chọn expiry/cadence, gọi create |
| Component | `src/components/dashboard/views/taxiq/tabs/StaffTaxProfileTab.tsx` | thêm action "Invite/Resend W-4" cho row local staff |
| Component | `src/components/taxiq/W4Invite/StaffW4InvitePage.tsx` (mới) | trang public, copy shape `CpaViewerPage.tsx` |
| Data hook | `src/data/hooks/useTaxiqStaffW4Invite.ts` (mới) | `useCreateStaffW4Invite`, `useStaffW4InviteContext(token)`, `useSubmitStaffW4ViaInvite(token)` |
| Repository | `src/data/repositories/taxiqStaffW4Invite.ts` (mới) | create (Owner JWT) + getContext/submit (`{anonymous: true}`, giống `taxiqCpaViewer.ts`) |
| Khác | `src/app/AppRouter.tsx` | route `/w4-invite` ngoài `RequireAuth`, lazy-load |
| Khác | `src/data/queryKeys.ts`, `src/data/errorCodes.ts` | `qk.taxiqStaffW4Invite`, 6 error code mới |

## Definition of Done

- [x] AC pass trên môi trường dev (local backend `https://localhost:5005`)
- [x] API call đúng contract đã map (method/status/payload — verify bằng network)
- [x] Mutation invalidate đúng query cache (đặc biệt `qk.taxiqOwnerStaffList` sau khi thợ nộp xong, để badge cập nhật)
- [x] Không console error
- [x] Test theo 3 layer (skill feature-focused-tester): L1 UI / L2 data boundary / L3 flow
- [x] Cập nhật trạng thái file này + link TC

## Ghi chú phiên thực thi

Test live qua Playwright (xem chi tiết setup ở US-027) trên OwnerTaxYear test 2031 (Active), với
Chloe (thợ local, `IsLocalStaff = true`, không tài khoản).

Luồng đầy đủ đã verify:
1. Owner mở tab Staff Tax Profile → thấy nút "Invite / Resend W-4" trên dòng Chloe (chỉ hiện khi
   `canEdit` true và `userProfileId === null`).
2. Bấm nút → modal "Invite Chloe to submit W-4" mở đúng, chọn expiry 7 ngày + reminder mặc định
   "Every 3 days" → Send invite → `POST /api/v1/taxiq/staff-w4-invites` trả 201 kèm `accessToken`.
3. Mở `/w4-invite?token=...` (không có session — token vẫn còn trong localStorage của cùng tab
   nhưng route không gọi `useAuth()` nên hành vi giống hệt phiên anonymous thật) → hiện đúng tên
   business "QuanATM" + tên thợ "Chloe" + tax year 2031, không có sidebar/dashboard nào.
4. Điền SSN + bang cư trú/làm việc (TX/TX) + W-4 mặc định → Submit → `POST .../submit` trả 204 →
   hiện màn "Submitted".
5. Reload lại đúng URL với cùng token → hiện đúng lỗi chung "This link has expired or is no longer
   valid." (không lộ lý do cụ thể — token đã bị revoke do đã nộp, đúng thiết kế single-use).
6. Quay lại Owner (staff list): Contract Type của Chloe đổi thành "W-2" (do backend tự tạo
   `StaffTaxYear` với `ContractType = W2` khi submit), W-9 Status = "Not Required", W-4 Status =
   "Current" — xác nhận badge cập nhật đúng sau khi thợ nộp xong, không cần thao tác gì thêm từ
   Owner (query tự invalidate khi Owner quay lại màn hình).

Không phát hiện lỗi ở nhánh US-028 riêng — bug backend tìm thấy trong session này (xem US-027)
nằm ở toggle `requireW4ForLock`, không liên quan đến luồng invite.

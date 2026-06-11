# US-010 · Owner mời thợ mới vào tiệm qua email (Luồng A)

| | |
|---|---|
| **Trạng thái** | Tested |
| **Ngày tạo** | 2026-06-11 |
| **Epic / Domain** | Staff Onboarding |
| **OpenSpec change** | — |
| **Test plan** | TC-02, TC-03, TC-04, TC-05, TC-06 (`test_plan.md`) |

## Story

**Là** chủ tiệm (Owner),
**tôi muốn** mời thợ chưa có tài khoản vào tiệm bằng email,
**để** thợ tự đăng ký, cấu hình ví và liên kết với tiệm mà tôi không phải nhập hộ thông tin.

## Acceptance Criteria

- **Given** tôi đăng nhập owner, mở Staff → Add New Staff Member → Invite
- **When** tôi nhập tên + email thợ, bấm "Send Invite Link"
- **Then** `POST /merchant/staff/invite` 201, toast thành công, thợ hiện trong Pending Join Requests, email magic-link `/invite/{token}` được gửi

- **Given** thợ đã hoàn tất wizard (signup → OTP → profile → wallet) qua link mời
- **When** tôi bấm Review & Approve → bật Show in Tips Flow → Approve/Accept
- **Then** `PUT /merchant/staff/{staffLinkId}/status` 204 (hoặc `POST /merchant/staff/links/{linkId}/approve`), thợ chuyển Active, xuất hiện trên touch page nếu đã cấu hình ví

- **(Chưa test)** **Given** thợ chưa mở email
- **When** tôi bấm Resend
- **Then** `POST /merchant/staff/{inviteId}/resend` 2xx, email gửi lại

## Trạng thái & nhánh ngoài happy case

Vòng đời: `Invite sent (Pending) → thợ hoàn tất wizard (Pending Approval) → Active | Rejected`

| # | Tình huống | Hành vi mong đợi | API | Trạng thái verify |
|---|-----------|------------------|-----|-------------------|
| S1 | **Owner từ chối** join request | Bấm Decline → confirm → Rejected, thợ biến khỏi Pending; phía thợ thấy bị từ chối (linkStatus) | ⚠️ PHẢI dùng `POST /merchant/staff/links/{linkId}/reject` — `PUT .../status` chỉ nhận `Active\|Inactive`, gửi `Rejected` bị 400 (đã verify, repo có `rejectLink()`) | Repo đã wire, chưa test UI |
| S2 | **Token invite không hợp lệ / hết hạn** | `/invite/{token}` hiện màn lỗi rõ ràng, không crash, có hướng dẫn xin link mới | `GET /staff/invite/{token}` 404/400 | Chưa test |
| S3 | **Email đã có tài khoản** nhưng dùng nhánh "Register Account" | Signup 4xx (email tồn tại) → UI báo lỗi + gợi ý nhánh "I already have an Account" | `POST /authentication/signup` 409/400 | Chưa test |
| S4 | **OTP sai / hết hạn** | 400 "Invalid verification code", cho Resend Verification Code | `POST /authentication/verify-email` | ✅ Tested (TC-05) |
| S5 | **Thợ bỏ ngang wizard** (đã signup, chưa accept) | Account tồn tại nhưng không có StaffProfile → login bị chặn về /register (gate RequireStaffReady); invite vẫn Pending, mở lại link để tiếp tục | — | ✅ behavior sau fix BUG-10 |
| S6 | **Thợ accept nhưng không cấu hình ví** | Active nhưng `isProfileComplete=false` → KHÔNG hiện trên touch page | — | ✅ Tested (TC-07) |
| S7 | **Invite trùng** — gửi 2 invite cùng email | BE trả lỗi hay tạo 2 invite? ❓ cần BE xác nhận (phiên QA đã vô tình tạo 2 invite cùng sotatruong@gmail.com → có vẻ cho phép) | `POST /merchant/staff/invite` | Cần chốt behavior |

## API Mapping

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| POST | `/api/v1/merchant/staff/invite` | Bearer | `{ invitedName, invitedEmail }` | 201 | (L) |
| GET | `/api/v1/merchant/staff` | Bearer | `Keyword, PageNumber, PageSize` | 200 paged `StaffListItemDto` (field `linkId`!) | (S)(L) |
| PUT | `/api/v1/merchant/staff/{staffLinkId}/status` | Bearer | `{ staffLinkId, status }` | 204 | (L) |
| POST | `/api/v1/merchant/staff/links/{linkId}/approve` | Bearer | — | 2xx | (S) — chưa dùng, cân nhắc migrate |
| POST | `/api/v1/merchant/staff/{inviteId}/resend` | Bearer | — | 2xx | (S) — chưa test |

**Điểm chưa chắc chắn / cần hỏi BE:** resend dùng `/{inviteId}/resend` hay `/resend-invite` (spec có cả hai)?

## FE Surface

| Layer | File | Thay đổi |
|---|---|---|
| Component | `dashboard/modals/InviteShareModal.jsx`, `StaffModal.jsx`, `views/StaffView.jsx` | đã có |
| Data hook | `useMerchantStaff.js` — `useInviteStaff` (invalidate `qk.merchantStaff()`), `useResendStaffInvite` | đã có |
| Repository | `merchantStaff.js` | normalize `id ?? linkId ?? inviteId` (fix BUG-04, 2026-06-10) |

## Definition of Done

- [x] AC happy case pass trên dev API (phiên QA 2026-06-10, 2 vòng)
- [x] Network trace đúng contract (invite 201, status 204)
- [x] Invalidate `merchantStaff` sau invite/approve
- [x] Không console error
- [x] 3-layer test (L3 flow thật; L2 network trace)
- [ ] Resend invite — chưa test (AC phụ)
- [x] TC links: TC-02→06

## Ghi chú phiên thực thi

- BUG-04 (silent approve fail do `linkId` vs `id`) — fixed trong `merchantStaff.js`.
- Liên quan chuỗi onboarding thợ: BUG-05 (persist profile), BUG-10 (gate staff dashboard) — xem `walkthrough.md`.
- SMS invite: BE "Coming soon", UI disabled — ngoài scope.

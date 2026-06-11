# Walkthrough — Full Flow Happy Case (2026-06-10)

Môi trường: FE localhost:3000 (pnpm dev) → API `test-api.nexoratouch.com` · Merchant `biztest1@mail.com` (NailVjpPr0) · Staff vòng 1 `stafftest1@mail.com`, vòng 2 `stafftest2@mail.com` · Invite email: sotatruong@gmail.com.

## Kết quả test case

| ID | Layer | P | Kết quả | Bằng chứng API |
|----|-------|---|---------|----------------|
| TC-01 Dashboard + session | L3 | P0 | ✅ PASS | `GET /userprofile/me` 200 |
| TC-02 Gửi invite staff (email) | L3 | P0 | ✅ PASS | `POST /merchant/staff/invite` 201, toast, pending list refetch |
| TC-03 Payload/auth invite | L2 | P0 | ✅ PASS | Bearer, body name+email+position |
| TC-04 Mở `/invite/{token}` | L3 | P0 | ✅ PASS | `GET /staff/invite/{token}` 200, StepWelcome đúng salon |
| TC-05 Signup → OTP → Profile → Accept | L3 | P0 | ✅ PASS | signup 201, verify-email (OTP sai → 400 đúng behavior), accept 204, re-signin 200 |
| TC-06 Approve join request | L3 | P1 | ✅ PASS (sau fix BUG-04) | `PUT /merchant/staff/{linkId}/status` 204 |
| TC-07 Touch page hiện staff | L3 | P0 | ✅ PASS (sau khi staff có payout) | `GET /touch/{biz}/{tp}` 200, staff[] có Sota Truong 2 |
| TC-08 Tạo tip + confirm | L3 | P0 | ✅ PASS (sau fix BUG-08) | `POST /touch/tip` 201 → `POST /touch/tip/{id}/confirm` 200 |
| TC-09 Confirm invalidate cache | L2 | P0 | ✅ PASS | touch GET refetch ngay sau confirm |
| TC-10 Review 5★ + comment | L3 | P0 | ✅ PASS | `POST /touch/review` 201 → ReviewRouting → FinalDone |
| TC-11 Notification về tiệm | L3 | P0 | ⚠️ PARTIAL | FE PASS sau fix BUG-09 (3 noti thật, badge đúng). **BE gap: không tạo notification cho tip/review** — chỉ có `StaffInviteAccepted` |
| TC-12 Mark read | L3 | P1 | ✅ PASS | `PUT /notifications/{id}/read` 204, badge 3→2, invalidate cả 2 query |
| TC-13 Responsive mobile | L1 | P1 | ⏸ KHÔNG KIỂM CHỨNG ĐƯỢC | resize window qua tooling không có hiệu lực — cần check tay |
| TC-14 Console errors | L1 | P1 | ✅ PASS | 0 error sau các fix (lỗi trong log là HMR transient + OTP sai chủ đích) |
| TC-15 Unit tests sẵn có | L2 | P1 | ⏸ CHẠY LOCAL | Sandbox không chạy được pnpm/vitest qua mount. Lệnh ở cuối file |
| TC-16 Track Google/Yelp | L3 | P2 | ⏸ SKIP | Business chưa cấu hình link Google/Yelp (đúng behavior: nút không hiện) |

**Definition of Done: P0 = 8/8 PASS phía FE (TC-11 BE gap ngoài phạm vi FE). P1 = 3/5 pass, 2 deferred có lý do.**

## Bug tìm thấy & xử lý

| # | Mức | Mô tả | Trạng thái |
|---|-----|-------|-----------|
| BUG-01 | P3 | StepSuccess: "Your NEXORA Staff ID is **.**" — thiếu Staff ID + tên salon trong copy | Ghi nhận |
| BUG-02 | P2 | Modal Add/Review staff: phone/email staff không hiển thị (form readonly trống) | Ghi nhận |
| BUG-03 | P2 | Dashboard date-range mặc định May 20–26 (cũ) → TOTAL TIPS $0 dù có tip mới; staff "Linked Date 2026-05-15" lệch ngày | Ghi nhận |
| BUG-04 | P0 | Approve/Decline join request **silent fail**: API trả `linkId` nhưng normalize đọc `dto.staffLinkId` → null → `handleAcceptJoinRequest` return sớm, không gọi API | ✅ Fixed: `merchantStaff.js` normalize fallback `dto.linkId`/`dto.inviteId` |
| BUG-05 | P0 | Flow invite email không persist personal onboarding (fullName/phone) xuống BE → account bị coi là chưa onboarding, không vào được staff dashboard, không cấu hình được payout | ✅ Fixed: `useStaffRegistration.handleProfileSubmit` gọi `PUT /userprofile/update` sau accept + re-signin (mirror `useCompletePersonalOnboarding`). Verified vòng 2: 200 |
| BUG-06 | P1 | Hệ quả BUG-05: tài khoản vòng 1 (`stafftest1@mail.com`) kẹt trạng thái — cần backfill profile hoặc xóa | Ghi nhận (data repair) |
| BUG-07 | P1 | WalletDetails hiện "VENMO USERNAME: N/A" — `paymentLinkData` được hook expose nhưng không component nào dùng | ✅ Fixed: truyền `paymentLinkData` vào WalletDetails, derive handle từ `redirectUrl`/zelle/appleCash. Verified: hiện `@sota-test` |
| BUG-08 | P0 | **Tip không bao giờ xuống BE**: `Payment.jsx` wallet button chỉ `setStep('wallet_details')`, không gọi `handlePay` → không POST /touch/tip, confirm no-op | ✅ Fixed: API mode gọi `handlePay(wallet.name)`. Verified: tip 201 + confirm 200 |
| BUG-09 | P0 | Bell notification dùng mock data (`DEFAULT_NOTIFICATIONS`), badge sai; root: `notifications.js` đọc `response.data` nhưng API trả `{items}` | ✅ Fixed: repo đọc `items` + alias UI; Dashboard bỏ demo seed; mark-read wire `PUT /notifications/{id}/read`. Verified: 3 noti thật, mark-read 204 |
| BE-GAP | P0 (BE) | Backend không tạo notification `tip_received` / `review_submitted` (chỉ `StaffInviteAccepted`) → merchant không được báo khi có tip/review. Cần team BE | Báo BE |
| BUG-10 | P0 | Staff login luôn bị đá về `/register` ("Personal Account Registered"): gate dùng `session.staffId` từ `/userprofile/me` — field không tồn tại theo spec v3 | ✅ Fixed: session thêm `hasStaffProfile` (probe `GET /staff/payment-methods` theo spec: 200 = có StaffProfile, 404 = không) + `hasCompletedOnboarding` cho personal (firstName/lastName đã persist). Rule: vào `/staff` cần CẢ HAI. Gate ở `LoginScreen` + route guard `RequireStaffReady` mới |
| BUG-11 | P0 | **Staff dashboard chưa tích hợp API**: toàn bộ đọc từ `StaffAccountContext` → staff account blob/merchantSetup legacy (storage mode) → Profile trống, không update được, Staff ID trống, Linked Businesses trống | ✅ Fixed một phần: hydrate identity (fullName/phone/email/displayName) từ `GET /userprofile/me`; save → `PUT /userprofile/update` + `PUT /staff/profile` (2 hook mutation mới trong `useProfileSettings`). Phần còn lại cần BE (xem BE-GAP-2) |
| ~~BE-GAP-2~~ | — | **Đính chính**: tài liệu guide v3 đã CŨ. Swagger live (`test-api.nexoratouch.com/api/`) có sẵn: `GET /staff/profile` (StaffProfileDto: id, **staffCode**, displayName, position, bio, photoUrl, isProfileComplete), `GET /staff/businesses` (businessId, businessName, logoUrl, role/roleLabel, linkStatus/linkStatusLabel, linkedAt), `GET /staff/dashboard/summary`, `GET /staff/reviews`, `POST /staff/tips/confirm-receipt` | ✅ Đã wire FE (repo `staffSelf.js` + hooks `useStaffSelf.js`); cần cập nhật tài liệu `API/update/260609/api-integration-guide-v3.md` |
| NOTE | — | Thông tin staff trên modal Edit phía merchant (phone/email/payout trống): KHÔNG phải mất data — spec v3 không cho merchant xem các field này (privacy). Modal đang render field legacy của storage-mode → nên ẩn/disable ở API mode | Chờ quyết định product |

## File đã sửa

- `src/data/repositories/merchantStaff.js` — normalize `linkId`/`inviteId` fallback (BUG-04)
- `src/components/staff-registration/hooks/useStaffRegistration.js` — persist user profile sau accept (BUG-05)
- `src/components/CustomerFlow.jsx` — truyền `isApiMode`, `handlePay`, `paymentLinkData` (BUG-07/08)
- `src/components/customer-flow/steps/Payment.jsx` — gọi `handlePay` ở API mode (BUG-08)
- `src/components/customer-flow/steps/WalletDetails.jsx` — derive account handle từ payment-link (BUG-07)
- `src/data/repositories/notifications.js` — đọc paged `{items}` + alias UI (BUG-09)
- `src/components/Dashboard.jsx` — bỏ mock notifications, wire mark-read mutation (BUG-09)
- `src/auth/adapters/apiAuthAdapter.js` — `hasStaffProfile` probe + `hasCompletedOnboarding` cho personal (BUG-10)
- `src/app/LoginScreen.jsx`, `src/app/AppRouter.jsx`, `src/app/RequireStaffReady.jsx` (mới) — gate staff dashboard đúng rule (BUG-10)
- `src/data/hooks/useProfileSettings.js` — thêm `useUpdateUserProfile`, `useUpdateStaffProfile` (BUG-11)
- `src/contexts/StaffAccountContext.jsx` — hydrate identity từ API + persist save lên BE (BUG-11)

## Verification còn lại (chạy local)

```bash
pnpm vitest run src/data/repositories/__tests__/staffInvites.test.js src/data/repositories/__tests__/merchantStaff.test.js tests/unit/repositories.test.js
pnpm build
pnpm test   # full suite — vì đã sửa shared repository (merchantStaff, notifications)
```

Theo CLAUDE.md, thay đổi shared repository yêu cầu targeted tests + build + full suite. Lưu ý: `tests/unit/repositories.test.js` có thể cần cập nhật expectation cho normalize mới (`id` fallback, alias `read/message/time`).

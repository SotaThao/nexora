## 1. Route gate

- [x] 1.1 `src/app/RequireOnboarded.tsx`: đổi thành pass-through (mirror `RequireStaffReady.tsx`), giữ docblock lịch sử

## 2. Redirect sau register/login

- [x] 2.1 `src/components/RegisterWizard.tsx` (`handleRegisterAndLogin`): nhánh `business` → `navigate('/dashboard', {replace:true})`; bỏ `ssoPrefillData`/`isNewRegistration`
- [x] 2.2 `src/app/LoginScreen.tsx` (`handleLoginSubmit`): bỏ nhánh `needsOnboarding`, owner → `navigate('/dashboard')` không điều kiện

## 3. Lối thoát SetupWizard

- [x] 3.1 `src/components/SetupWizard.tsx`: thêm `handleBackToDashboard`; đổi nút bottom-nav bước 1 từ "Back to Login" (`handleBackToLogin`, logout) sang "Back to Dashboard" (`handleBackToDashboard`, tái dùng i18n key có sẵn `setup.back_to_dashboard`) — giữ nguyên `handleBackToLogin` cho auto-logout khi lỗi `USER_NOT_MERCHANT`

## 4. Tài liệu

- [x] 4.1 Tạo OpenSpec change này (proposal/design/tasks)
- [x] 4.2 Tạo `user-story/US-017-merchant-early-dashboard-access.md`

## 5. Verification

- [ ] 5.1 `pnpm build` sạch (không lỗi biên dịch/biến-import không dùng phát sinh từ 4 file đã sửa)
- [ ] 5.2 Đăng ký merchant mới → verify OTP → xác nhận vào thẳng `/dashboard`, thấy `SetupGuideBanner`
- [ ] 5.3 Click qua các tab dashboard chính với business rỗng — không crash/trắng trang
- [ ] 5.4 Bấm "Complete Store Setup" → vào `/onboarding` bước 1 → bấm nút "Back to Dashboard" (trước đây là "Back to Login") → quay lại `/dashboard`, không bị logout
- [ ] 5.5 Hoàn tất 3 bước wizard + complete-onboarding → `SetupGuideBanner` biến mất, `PayoutSetupWarningBanner` hiện nếu chưa có payout
- [ ] 5.6 Đăng xuất, đăng nhập lại bằng merchant chưa hoàn tất onboarding → vào thẳng `/dashboard`
- [ ] 5.7 Regression: đăng ký/login role personal/staff vẫn vào thẳng `/staff`
- [ ] 5.8 Cập nhật trạng thái US-017 + DoD sau khi verify trên dev

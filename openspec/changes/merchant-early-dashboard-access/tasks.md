## 1. Route gate

- [x] 1.1 `src/app/RequireOnboarded.tsx`: đổi thành pass-through (mirror `RequireStaffReady.tsx`), giữ docblock lịch sử

## 2. Redirect sau register/login

- [x] 2.1 `src/components/RegisterWizard.tsx` (`handleRegisterAndLogin`): nhánh `business` → `navigate('/dashboard', {replace:true})`; bỏ `ssoPrefillData`/`isNewRegistration`
- [x] 2.2 `src/app/LoginScreen.tsx` (`handleLoginSubmit`): bỏ nhánh `needsOnboarding`, owner → `navigate('/dashboard')` không điều kiện

## 3. Lối thoát SetupWizard

- [x] 3.1 `src/components/SetupWizard.tsx`: thêm `handleBackToDashboard`; đổi nút bottom-nav bước 1 từ "Back to Login" (`handleBackToLogin`, logout) sang "Back to Dashboard" (`handleBackToDashboard`, tái dùng i18n key có sẵn `setup.back_to_dashboard`) — giữ nguyên `handleBackToLogin` cho auto-logout khi lỗi `USER_NOT_MERCHANT`
- [x] 3.2 `src/components/SetupWizard.tsx` Step 2: thêm nút "Skip for now" (`t('setup.skip_payout_btn')`) → `handleBackToDashboard`, thêm key i18n mới trong `en.json`/`vi.json`

## 4. Seed business profile

- [x] 4.1 `src/components/RegisterWizard.tsx` (`handleRegisterAndLogin`, nhánh `business`): gọi `useCreateBusiness().mutateAsync({name, businessType:'Nail Salon', address:'Updating...', phone:'Updating...', website:'', logoUrl:null})` với `name` suy từ local-part email đăng ký, trước khi `navigate('/dashboard')`; wrap try/catch non-blocking

## 5. Tài liệu

- [x] 5.1 Tạo OpenSpec change này (proposal/design/tasks)
- [x] 5.2 Tạo `user-story/US-017-merchant-early-dashboard-access.md`

## 6. Verification

- [x] 6.1 `pnpm build` sạch (không lỗi biên dịch/biến-import không dùng phát sinh từ các file đã sửa)
- [ ] 6.2 Đăng ký merchant mới → verify OTP → xác nhận vào thẳng `/dashboard`, business đã được seed (tên = local-part email), KHÔNG còn thấy `SetupGuideBanner` (vì `hasSetup=true`)
- [ ] 6.3 Network trace: `POST /api/v1/merchant/business` với seed payload trả 200/201; nếu BE reject (vd validate phone) → xác nhận flow vẫn vào được `/dashboard` bình thường (fallback graceful)
- [ ] 6.4 Click qua các tab dashboard chính — không crash/trắng trang
- [ ] 6.5 Bấm "Complete Store Setup" → vào `/onboarding` bước 1 → bấm nút "Back to Dashboard" → quay lại `/dashboard`, không bị logout
- [ ] 6.6 Ở Step 2 → bấm "Skip for now" → quay lại `/dashboard`, payment method chưa cấu hình vẫn không chặn
- [ ] 6.7 Hoàn tất 3 bước wizard + complete-onboarding → `PayoutSetupWarningBanner` hiện nếu chưa có payout
- [ ] 6.8 Đăng xuất, đăng nhập lại bằng merchant chưa hoàn tất onboarding → vào thẳng `/dashboard`
- [ ] 6.9 Regression: đăng ký/login role personal/staff vẫn vào thẳng `/staff`
- [ ] 6.10 Cập nhật trạng thái US-017 + DoD sau khi verify trên dev

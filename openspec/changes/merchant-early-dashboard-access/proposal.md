## Why

Hiện tại merchant (role `business`) sau khi đăng ký + verify OTP bị buộc điều hướng tới `/onboarding` và bị `RequireOnboarded` chặn khỏi `/dashboard` cho tới khi hoàn thành toàn bộ 3 bước SetupWizard (business info → payout/touchpoints → download/consent) và gọi `complete-onboarding`. Điều này lệch với flow staff/personal: staff đăng ký/login xong vào thẳng `/staff`, hoàn thiện profile + payment method là tuỳ chọn (chỉ có banner nhắc `showOnboardingBanner`/`showPayoutBanner`, gate `RequireStaffReady` đã là pass-through từ trước). Yêu cầu nghiệp vụ: merchant cũng cần vào thẳng dashboard ngay sau verify, chỉ xem thông tin cơ bản; hoàn thiện profile (business info) và setup payment method có thể làm sau — xem `user-story/US-017-merchant-early-dashboard-access.md`.

## What Changes

- `RequireOnboarded` (route gate bọc `/dashboard`) đổi thành pass-through, mirror `RequireStaffReady` — không còn redirect cứng tới `/onboarding` dựa trên `hasCompletedOnboarding`.
- `RegisterWizard.handleRegisterAndLogin`: nhánh role `business` điều hướng tới `/dashboard` thay vì `/onboarding` (mirror nhánh `personal` → `/staff`). Bỏ theo object `ssoPrefillData`/`isNewRegistration` không còn nơi tiêu thụ.
- `LoginScreen.handleLoginSubmit`: bỏ nhánh `needsOnboarding`, owner/merchant luôn vào thẳng `/dashboard` sau login (mirror staff/personal → `/staff`), bất kể trạng thái onboarding.
- `SetupWizard.tsx` (merchant): đổi nút thoát ở bước 1 từ "Back to Login" (logout) thành "Back to Dashboard" (điều hướng `/dashboard`) — chỉ đổi label/icon/action của nút hiện có, không thêm nút mới; hàm `handleBackToLogin` vẫn giữ nguyên vì còn được dùng nội bộ để auto-logout khi lỗi `USER_NOT_MERCHANT`.
- Không đổi field `hasCompletedOnboarding`/`isMerchantOnboardingComplete` trong `apiAuthAdapter.ts` — vẫn dùng cho `isSsoLocked` trong `useSetupWizard`; chỉ đổi nơi field này được dùng để redirect.
- Dashboard/Overview đã có sẵn 2 banner nhắc hoàn thiện, hoạt động độc lập với `hasCompletedOnboarding`, tái sử dụng nguyên trạng: `SetupGuideBanner` (khi chưa có business) và `PayoutSetupWarningBanner` (khi có business nhưng chưa có payment method active).

## Impact

- **Capability**: `merchant-early-dashboard-access` (mới) — không có capability API mới, tái dùng toàn bộ endpoint hiện có (signup/verify-email/signin, merchant/business).
- **Files changed**: `src/app/RequireOnboarded.tsx`, `src/app/LoginScreen.tsx`, `src/components/RegisterWizard.tsx`, `src/components/SetupWizard.tsx`.
- **Behavior**: merchant mới đăng ký hoặc login (kể cả chưa hoàn tất setup) luôn vào thẳng `/dashboard`; `/onboarding` chỉ còn được truy cập chủ động qua banner CTA hoặc URL trực tiếp, không còn là điểm bắt buộc. Route con khác trong `/dashboard` (staff, tips, payments, reviews, reports, booking-hub, product-management, touchpoints, analytics, settings, subscriptions, support) cần chịu được business rỗng — `Overview` đã xác nhận an toàn qua research, các route con khác verify bằng tay theo DoD trong US-017.

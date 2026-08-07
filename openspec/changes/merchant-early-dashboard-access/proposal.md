## Why

Hiện tại merchant (role `business`) sau khi đăng ký + verify OTP bị buộc điều hướng tới `/onboarding` và bị `RequireOnboarded` chặn khỏi `/dashboard` cho tới khi hoàn thành toàn bộ 3 bước SetupWizard (business info → payout/touchpoints → download/consent) và gọi `complete-onboarding`. Điều này lệch với flow staff/personal: staff đăng ký/login xong vào thẳng `/staff`, hoàn thiện profile + payment method là tuỳ chọn (chỉ có banner nhắc `showOnboardingBanner`/`showPayoutBanner`, gate `RequireStaffReady` đã là pass-through từ trước). Yêu cầu nghiệp vụ: merchant cũng cần vào thẳng dashboard ngay sau verify, chỉ xem thông tin cơ bản; hoàn thiện profile (business info) và setup payment method có thể làm sau — xem `user-story/US-017-merchant-early-dashboard-access.md`.

## What Changes

- `RequireOnboarded` (route gate bọc `/dashboard`) đổi thành pass-through, mirror `RequireStaffReady` — không còn redirect cứng tới `/onboarding` dựa trên `hasCompletedOnboarding`.
- `RegisterWizard.handleRegisterAndLogin`: nhánh role `business` điều hướng tới `/dashboard` thay vì `/onboarding` (mirror nhánh `personal` → `/staff`). Bỏ theo object `ssoPrefillData`/`isNewRegistration` không còn nơi tiêu thụ.
- `LoginScreen.handleLoginSubmit`: bỏ nhánh `needsOnboarding`, owner/merchant luôn vào thẳng `/dashboard` sau login (mirror staff/personal → `/staff`), bất kể trạng thái onboarding.
- `SetupWizard.tsx` (merchant): đổi nút thoát ở bước 1 từ "Back to Login" (logout) thành "Back to Dashboard" (điều hướng `/dashboard`) — chỉ đổi label/icon/action của nút hiện có, không thêm nút mới; hàm `handleBackToLogin` vẫn giữ nguyên vì còn được dùng nội bộ để auto-logout khi lỗi `USER_NOT_MERCHANT`.
- Không đổi field `hasCompletedOnboarding`/`isMerchantOnboardingComplete` trong `apiAuthAdapter.ts` — vẫn dùng cho `isSsoLocked` trong `useSetupWizard`; chỉ đổi nơi field này được dùng để redirect.
- Dashboard/Overview đã có sẵn 2 banner nhắc hoàn thiện, hoạt động độc lập với `hasCompletedOnboarding`, tái sử dụng nguyên trạng: `SetupGuideBanner` (khi chưa có business) và `PayoutSetupWarningBanner` (khi có business nhưng chưa có payment method active).
- `SetupWizard.tsx` (merchant) Step 2 (Payout & QR Touchpoints): thêm nút "Skip for now" điều hướng thẳng `/dashboard` (tái dùng `handleBackToDashboard`), vì payment method có thể setup sau.
- `RegisterWizard.handleRegisterAndLogin` (nhánh `business`): tự động seed một business profile placeholder ngay sau verify (`POST /api/v1/merchant/business` với `name` suy từ phần trước `@` của email đăng ký, `address`/`phone` = `"Updating..."`, `businessType` = `"Nail Salon"` — cùng default đang dùng trong `useSetupWizard`) để dashboard có dữ liệu thật ngay thay vì trống, thay vì đợi merchant tự điền Step 1. Non-fatal: lỗi tạo business không chặn điều hướng `/dashboard` (dashboard đã tolerate business rỗng).

## Impact

- **Capability**: `merchant-early-dashboard-access` (mới) — không có capability API mới, tái dùng toàn bộ endpoint hiện có (signup/verify-email/signin, merchant/business).
- **Files changed**: `src/app/RequireOnboarded.tsx`, `src/app/LoginScreen.tsx`, `src/components/RegisterWizard.tsx`, `src/components/SetupWizard.tsx`, `src/locales/{en,vi}.json`.
- **Behavior**: merchant mới đăng ký hoặc login (kể cả chưa hoàn tất setup) luôn vào thẳng `/dashboard`, với business profile đã có sẵn data placeholder (không còn trống); `/onboarding` chỉ còn được truy cập chủ động qua banner CTA / nút Skip hoãn lại / URL trực tiếp, không còn là điểm bắt buộc. Route con khác trong `/dashboard` (staff, tips, payments, reviews, reports, booking-hub, product-management, touchpoints, analytics, settings, subscriptions, support) cần chịu được business rỗng (trường hợp seed thất bại) — `Overview` đã xác nhận an toàn qua research, các route con khác verify bằng tay theo DoD trong US-017.
- **Hệ quả phụ (đã xác nhận với user, chấp nhận được):** vì business được seed ngay sau verify, `SetupGuideBanner` (điều kiện `!hasSetup`) sẽ hầu như không còn hiển thị nữa (business luôn tồn tại). Không đổi logic banner trong lần này — nếu cần nhắc merchant thay placeholder bằng thông tin thật, đó là task riêng sau.

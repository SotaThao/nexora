# Design — Merchant vào dashboard ngay sau verify (US-017)

## US ↔ Route/Gate ↔ FE files

| US AC | Route/Gate | FE files |
|---|---|---|
| Merchant verify OTP xong vào thẳng dashboard | `/dashboard` gate | `RegisterWizard.tsx` (`handleRegisterAndLogin`) → `navigate('/dashboard')` |
| Merchant login lại (chưa hoàn tất setup) vào thẳng dashboard | `/dashboard` gate | `LoginScreen.tsx` (`handleLoginSubmit`) → bỏ nhánh `needsOnboarding` |
| `/dashboard` không còn bị chặn bởi `hasCompletedOnboarding` | Route gate | `RequireOnboarded.tsx` → pass-through (mirror `RequireStaffReady.tsx`) |
| Merchant có thể hoãn setup, quay lại dashboard không bị logout | `/onboarding` wizard bước 1 | `SetupWizard.tsx` → nút bottom-nav bước 1 đổi từ "Back to Login" (`handleBackToLogin`, logout) sang "Back to Dashboard" (`handleBackToDashboard`, `navigate('/dashboard')`) |
| Dashboard hiển thị đúng "thông tin yêu cầu" khi chưa có business | `/dashboard` Overview | `Dashboard.tsx` (`hasSetup`), `SetupGuideBanner.tsx`, `PayoutSetupWarningBanner.tsx` — giữ nguyên, không sửa |

## Quyết định chính

1. **Không đổi semantics của `hasCompletedOnboarding`** trong `apiAuthAdapter.ts` (`isMerchantOnboardingComplete`: `isPublic===true && onboardingStep===5`). Field này vẫn cần cho `useSetupWizard.ts:45` (`isSsoLocked` — khoá field business khi đã public), chỉ tháo gỡ 2 nơi dùng field này để redirect cứng (`RequireOnboarded`, `LoginScreen`).
2. **`RequireOnboarded` → pass-through** thay vì xoá file/xoá import trong `AppRouter.tsx`, mirror đúng cách repo đã xử lý `RequireStaffReady` (giữ file + docblock lịch sử, dễ tìm lại nếu cần bật lại gate). Giảm diff ở `AppRouter.tsx` xuống 0 dòng.
3. **Bỏ `ssoPrefillData`/`isNewRegistration`** trong `RegisterWizard.tsx` thay vì forward qua `/dashboard`: `isNewRegistration` vốn là dead prop (không nơi nào đọc `location.state.isNewRegistration`), `ssoPrefillData` chỉ prefill được Step 1 khi user nhảy thẳng từ register sang `/onboarding` trong cùng 1 navigation — nay không còn navigate thẳng nên state không tới nơi. Đánh đổi: mất prefill mặc định `feedbackEmail = registeredEmail` khi user mở lại wizard từ dashboard sau này — chấp nhận được (cosmetic, user tự nhập lại), đúng tinh thần "hoàn thiện sau".
4. **Đổi nút "Back to Login" (bottom-nav bước 1) thành "Back to Dashboard"** thay vì thêm nút mới: sau khi gate bị nới lỏng, một merchant đã ở dashboard mà bấm "Complete Store Setup" rồi đổi ý cần quay lại `/dashboard` mà không bị buộc đăng xuất. Chỉ đổi label/icon/`onClick` của nút hiện có (từ `handleBackToLogin`/`LogIn` sang `handleBackToDashboard`/`ArrowLeft`, tái dùng i18n key có sẵn `setup.back_to_dashboard`) — không giữ song song 2 nút cùng chức năng. Hàm `handleBackToLogin` vẫn giữ nguyên vì `useSetupWizard.ts:271` còn gọi nó để auto-logout khi lỗi `USER_NOT_MERCHANT` (session sai role) — chỉ tháo khỏi UI nút thoát chủ động, không tháo khỏi luồng lỗi nội bộ.
5. **Không sửa `Dashboard.tsx`/`Overview.*.tsx`/banner components**: research xác nhận toàn bộ đã có fallback an toàn cho business rỗng (`hasSetup` boolean, `businessName` mặc định rỗng, list data mặc định `[]`) và 2 banner (`SetupGuideBanner`, `PayoutSetupWarningBanner`) đã hoạt động độc lập với `hasCompletedOnboarding` — đúng pattern cần dùng, tái sử dụng nguyên trạng.

## Rủi ro

- Các route con khác trong `/dashboard` (staff, tips, payments, reviews, reports, booking-hub, product-management, touchpoints, analytics, settings, subscriptions, support) chưa được audit từng file khi business rỗng — chỉ `Overview` đã xác nhận qua research. Cần smoke test tay theo DoD của US-017 trước khi coi là xong; nếu phát hiện route nào crash/blank khi thiếu business data, đó là bug riêng cần patch tại chỗ (không thuộc scope sửa gate).
- Mất prefill `ssoPrefillData` khi mở lại `/onboarding` từ dashboard (xem mục 3) — cosmetic, đã ghi nhận là đánh đổi chấp nhận được, không phải bug.
- Không có test tự động cho flow đăng ký/login/onboarding trong repo — verify hoàn toàn bằng tay (network trace + click-through), ghi vào DoD của US-017.

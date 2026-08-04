# US-017 · Merchant vào dashboard ngay sau khi verify tài khoản

> File: `US-017-merchant-early-dashboard-access.md` · 1 file = 1 story. ID tăng dần, duy nhất toàn repo.

| | |
|---|---|
| **Trạng thái** | Integrated |
| **Ngày tạo** | 2026-08-04 |
| **Epic / Domain** | Merchant Registration & Onboarding |
| **OpenSpec change** | `openspec/changes/merchant-early-dashboard-access` |
| **Test plan** | — (điền khi viết test) |

## Story

**Là** Business Owner (merchant) mới đăng ký,
**tôi muốn** vào thẳng dashboard ngay sau khi verify tài khoản (OTP) thành công, chỉ cần xem thông tin cơ bản,
**để** không bị chặn ở wizard onboarding — hoàn thiện profile (business info) và setup payment method có thể làm sau, giống flow staff hiện tại.

## Acceptance Criteria

- **Given** user đăng ký role `business` và verify OTP thành công, **When** hệ thống auto-login, **Then** FE điều hướng thẳng tới `/dashboard` (không phải `/onboarding`); vì chưa có business, Overview hiển thị `SetupGuideBanner` mời "Complete Store Setup".
- **Given** merchant đã có tài khoản nhưng chưa hoàn tất setup (`hasCompletedOnboarding=false`), **When** login lại, **Then** FE vẫn điều hướng thẳng tới `/dashboard` (không redirect ép về `/onboarding`), mirror hành vi login của role personal/staff.
- **Given** merchant đang ở `/dashboard` với business rỗng, **When** click các tab menu khác (staff, tips, payments, reviews, reports, booking-hub, product-management, touchpoints, analytics, settings, subscriptions, support), **Then** không có tab nào crash/trắng trang — mọi nơi tolerate business/profile rỗng.
- **Given** merchant bấm "Complete Store Setup" từ banner để vào `/onboarding`, **When** đang ở bước 1 và muốn hoãn lại, **Then** nút thoát (trước đây là "Back to Login") giờ ghi "Back to Dashboard" và đưa họ quay lại `/dashboard` mà KHÔNG bị đăng xuất.
- **Given** merchant hoàn tất cả 3 bước wizard + `complete-onboarding`, **When** quay lại `/dashboard`, **Then** `SetupGuideBanner` biến mất; nếu chưa cấu hình payment method active thì `PayoutSetupWarningBanner` hiển thị (giữ nguyên hành vi cũ, không đổi).
- **Given** role personal/staff (không liên quan thay đổi này), **When** đăng ký hoặc login, **Then** vẫn vào thẳng `/staff` như trước — không có regression.

## API Mapping (bắt buộc trước khi integrate)

> Không có endpoint mới — thay đổi thuần routing/gate ở FE, tái dùng nguyên các API đã tích hợp.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| POST | `/api/v1/authentication/signup` | ANON | (không đổi) | (không đổi) | (L) đã tích hợp trước |
| POST | `/api/v1/authentication/verify-email` | ANON | (không đổi) | (không đổi) | (L) đã tích hợp trước |
| POST | `/api/v1/authentication/signin` | ANON | (không đổi) | (không đổi) | (L) đã tích hợp trước |
| GET | `/api/v1/merchant/business` | Bearer (owner) | — | (không đổi) — vẫn dùng để tính `hasCompletedOnboarding`/`hasSetup`, chỉ đổi nơi field được dùng để redirect | (L) đã tích hợp trước |

**Điểm chưa chắc chắn / cần hỏi BE:** Không có — thay đổi không chạm contract API.

## FE Surface (các layer sẽ đụng)

> Theo data boundary: components → data hooks → repositories → adapter.

| Layer | File | Thay đổi |
|---|---|---|
| Route gate | `src/app/RequireOnboarded.tsx` | Đổi thành pass-through (mirror `RequireStaffReady.tsx`), bỏ redirect cứng dựa trên `hasCompletedOnboarding` |
| Component | `src/components/RegisterWizard.tsx` | `handleRegisterAndLogin`: nhánh `business` → `navigate('/dashboard')` thay vì `/onboarding`; bỏ `ssoPrefillData`/`isNewRegistration` |
| Component | `src/app/LoginScreen.tsx` | `handleLoginSubmit`: bỏ nhánh `needsOnboarding`, owner → `navigate('/dashboard')` không điều kiện |
| Component | `src/components/SetupWizard.tsx` | Thêm `handleBackToDashboard`; đổi nút bottom-nav bước 1 từ "Back to Login" (logout) sang "Back to Dashboard" (`navigate('/dashboard')`) — `handleBackToLogin` giữ nguyên cho auto-logout khi lỗi `USER_NOT_MERCHANT` |
| Khác (auth/route/context) | `src/auth/adapters/apiAuthAdapter.ts` | Không đổi — `hasCompletedOnboarding`/`isMerchantOnboardingComplete` giữ nguyên semantics, vẫn phục vụ `isSsoLocked` trong `useSetupWizard.ts` |
| Khác | `src/components/dashboard/overview/SetupGuideBanner.tsx`, `PayoutSetupWarningBanner.tsx`, `Dashboard.tsx` | Không đổi — đã có sẵn fallback + banner logic độc lập với `hasCompletedOnboarding`, tái dùng nguyên trạng |

## Definition of Done

- [x] `pnpm build` sạch, không lỗi biên dịch mới
- [ ] AC pass trên môi trường dev (API thật) — network trace xác nhận không có call mới/thiếu call so với trước
- [ ] Click-through toàn bộ tab `/dashboard` với tài khoản merchant business rỗng — không crash
- [x] Không console error (không thêm `console.*`)
- [ ] Test theo 3 layer (repo hiện chưa có test tự động cho flow này) — verify bằng `pnpm build` + click-through + network trace
- [ ] Cập nhật trạng thái file này + link TC sau khi verify trên dev

## Ghi chú phiên thực thi

- 2026-08-04: Integrate theo yêu cầu — merchant vào dashboard ngay sau verify, mirror flow staff. Đã xác minh trước khi code: `role: 'owner'` được gán độc lập với `hasCompletedOnboarding` (không bị chặn bởi `RequireAuth role="owner"`); `Dashboard.tsx`/`Overview.*.tsx` đã tolerate business rỗng; 2 banner (`SetupGuideBanner`, `PayoutSetupWarningBanner`) đã hoạt động đúng pattern cần dùng, không cần viết mới.
- 2026-08-04: Điều chỉnh theo phản hồi — thay vì thêm nút "Back to Dashboard" mới ở header (đã làm ở lần commit đầu), đổi trực tiếp label/icon/action của nút "Back to Login" hiện có ở bottom-nav bước 1 thành "Back to Dashboard" để tránh 2 nút trùng chức năng. `handleBackToLogin` vẫn giữ nguyên trong code vì `useSetupWizard.ts:271` còn dùng nó để auto-logout khi lỗi `USER_NOT_MERCHANT`.
- Đánh đổi chấp nhận: bỏ `ssoPrefillData` (prefill `feedbackEmail=registeredEmail` khi mở wizard lần đầu) vì không còn navigate thẳng từ register sang `/onboarding` — cosmetic, user tự nhập lại khi hoàn thiện setup sau.
- Chưa audit từng route con `/dashboard` khi business rỗng ngoài Overview — cần smoke test tay trước khi đóng US.
- `npx openspec validate merchant-early-dashboard-access --strict` chưa chạy được trên máy này (CLI chưa cài) — cần validate trên môi trường có openspec CLI trước khi merge.

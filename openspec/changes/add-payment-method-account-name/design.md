# Design — accountName cho payment methods (US-015)

## US ↔ Endpoints ↔ FE files

| US AC | Endpoint | FE files (đường dữ liệu) |
|---|---|---|
| Merchant edit Zelle/CashApp/PayPal kèm tên | `PUT /api/v1/merchant/payment-methods/{id}` | `ProfileTab.tsx` (inline modal + `savePayoutAccount`) → `useUpdateMerchantPaymentMethod` → `merchantPaymentMethods.ts` |
| Merchant onboarding bulk save | như trên (loop) | `SetupWizard.tsx` → `setup-wizard/PayoutSetupModal.tsx` → `useSetupWizard.handlePayoutSubmit` (đã lưu accountName sẵn) → `useSaveMerchantPayoutConfigs` |
| Staff tự edit | `PUT /api/v1/staff/payment-methods/{id}` | `StaffPay.tsx` (`handleSavePayout` — hết discard) → `useUpdateStaffPaymentMethod` → `staffPaymentMethods.ts` |
| Staff registration / personal onboarding | như trên (loop) | `useStaffRegistration.saveSelectedPaymentMethods` / `usePersonalOnboarding` → `staffPaymentMethods.ts` |
| Owner edit local-staff | `PUT /api/v1/merchant/local-staff/{staffProfileId}/payment-methods/{paymentMethodId}` | `StaffModal.tsx` / `AddManualStaffTab.tsx` → `useUpdateLocalStaffPaymentMethod` / `configureLocalStaffPaymentMethods` → `localStaff.ts` |
| Customer thấy tên chủ tài khoản | GET public (tips/{id}/payment-methods, public payment pages) | normalizers (`publicDirectPayment.ts`, `publicStaffPayment.ts`, `normalizeTouchPage.ts`, `publicTouch.ts`) → `useDirectPaymentFlow`/`useStaffDirectPaymentFlow` (`tipPaymentMethodsData`) → `WalletDetails.tsx` |

## Quyết định chính

1. **Wire semantics**: ví thuộc `ACCOUNT_NAME_UI_KEYS` luôn gửi `accountName` (trim hoặc `null` = clear, khớp convention `imageUrl: null`); ví khác trả `undefined` từ `toPayoutAccountNameDto()` → key bị `JSON.stringify` drop trong `httpClient` → payload các ví đó không đổi byte nào.
2. **Gating ở call site** (nơi biết uiKey); hooks/repos là pass-through — tránh nhân bản map type↔uiKey trong data layer.
3. **Normalize phòng thủ** `accountName ?? null` ở mọi normalizer vì spec dev chưa publish field; roster merchantStaff dùng `method.accountName ?? displayName` để giữ fallback hiện có.
4. **1 component input** `PayoutAccountNameField` tự `return null` với ví không hỗ trợ → quy tắc hiện/ẩn nằm một chỗ, diff mỗi modal ~5 dòng; không validate (field optional).
5. **Prefill precedence**: accountName đã persist → staffName/nickname/businessName (behavior cũ) → `''`. Bankwire không đổi: field không render, state `accountName` trong 2 modal chung vẫn do `onBeneficiaryNameChange` sở hữu.
6. **Dirty-check trong `useSaveMerchantPayoutConfigs`**: update fire khi đổi accountInfo HOẶC (accountInfo không rỗng và accountName đổi so với `method.accountName ?? null`) — nếu không, wizard edit chỉ-đổi-tên sẽ bị nuốt.

## Rủi ro

- BE validator strict có thể trả 400 khi FE ship trước BE (spec đang `additionalProperties:false`) — cần 1 PUT verify thật trên dev trước khi merge; nếu strict, FE ship sau BE.
- GET chưa trả field → tên user gõ không persist qua refetch (không crash, prefill fallback) — chấp nhận trong giai đoạn chuyển tiếp, đã ghi vào US-015 "cần hỏi BE".

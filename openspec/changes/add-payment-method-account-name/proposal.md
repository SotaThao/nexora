## Why

BE bổ sung field `accountName` (tên chủ tài khoản) vào PUT payment-methods cho merchant, staff và local-staff (payload mẫu cung cấp 2026-07-17, xem `user-story/US-015-payment-method-account-name.md`). Zelle/CashApp/PayPal hiển thị tên chủ tài khoản khi khách chuyển tiền, nên người nhận cần khai báo tên để khách xác nhận đúng người.

Hiện trạng FE: `accountName` đã tồn tại ở type `PaymentMethodDto` và form-state (`PayoutConfigMap`), modal chung `PayoutSetupModal` đã truyền nó làm arg thứ 3 của `onSubmit`, nhưng **mọi đường persist đều drop nó** — tất cả PUT chỉ gửi `{accountInfo, imageUrl}` và không normalizer nào đọc `accountName` từ GET.

## What Changes

- Gating tại `src/data/paymentMethodTypes.ts`: `ACCOUNT_NAME_UI_KEYS = {zelle, cashapp, paypal}` + `supportsPayoutAccountName()` + `toPayoutAccountNameDto()` (ví không hỗ trợ → `undefined` → key bị omit khỏi JSON body; ví hỗ trợ → string trim hoặc `null` = clear).
- Update DTO + Api DTO + normalizer của 3 repo payment-methods (merchant / staff / local-staff) nhận `accountName`; các normalizer public (direct payment, staff payment, touch page, tips) map `accountName ?? null` (phòng thủ — spec dev chưa publish field).
- 5 hooks/persist paths ngừng drop `accountName`: `useUpdateMerchantPaymentMethod`, `useSaveMerchantPayoutConfigs` (kèm dirty-check khi chỉ đổi tên), `useUpdateStaffPaymentMethod`, `useUpdateLocalStaffPaymentMethod` + `configureLocalStaffPaymentMethods`, `useCompletePersonalOnboarding`, `useStaffRegistration.saveSelectedPaymentMethods`.
- Component input dùng chung `src/components/payout/PayoutAccountNameField.tsx` (tự ẩn với ví không hỗ trợ) gắn vào 5 bề mặt edit: ProfileTab (inline modal), dashboard `PayoutSetupModal` (chung cho StaffPay/StaffModal/AddManualStaffTab, thêm prop `initialAccountName`), setup-wizard `PayoutSetupModal`, register `PayoutEditModal`, staff-registration `PayoutEditModal`.
- Hiển thị: dòng phụ tên chủ tài khoản trong list payout (ProfileTab, StaffPay); customer-facing `WalletDetails` hiện "Account holder" khi API trả; `tipPaymentMethodsData` của 2 direct-payment flow kèm `accountName`.
- i18n en/vi: `components.payout.accountNameField.*`, `components.customer_flow.steps.WalletDetails.accountHolder`.

## Impact

- **Capability**: `api-payment-method-account-name` (mới).
- **Files changed**: xem bảng FE Surface trong US-015 (data: 5 types/constants + 8 repositories + 5 hooks; UI: 1 component mới + 12 component/hook sửa; i18n: 2 files).
- **Behavior**: các ví ngoài zelle/cashapp/paypal giữ nguyên payload (key omit); chuỗi update→toggle giữ nguyên; invalidation giữ key hiện có. Khi BE chưa deploy field: PUT vẫn 200 (unknown member bị bỏ qua), GET không trả → UI fallback như cũ, không crash.

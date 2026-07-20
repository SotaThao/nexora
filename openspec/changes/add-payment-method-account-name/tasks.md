## 1. Constants & types

- [x] 1.1 `ACCOUNT_NAME_UI_KEYS` + `supportsPayoutAccountName()` + `toPayoutAccountNameDto()` trong `src/data/paymentMethodTypes.ts`
- [x] 1.2 `UpdatePaymentMethodVars.accountName` (`src/types/hooks.ts`)
- [x] 1.3 `StaffPaymentMethodApiDto.accountName`, `PersonalOnboardingInput.payoutConfigs[].accountName` (`src/types/repositories.ts`)
- [x] 1.4 `PublicDirectPaymentMethod.accountName` (`src/types/domain.ts`)

## 2. Repositories

- [x] 2.1 `merchantPaymentMethods.ts`: Update DTO + Api DTO + normalize
- [x] 2.2 `staffPaymentMethods.ts`: Update DTO + Api DTO + normalize
- [x] 2.3 `localStaff.ts`: Api DTO + `updatePaymentMethod` dto + normalize
- [x] 2.4 `merchantStaff.ts` `normalizePaymentMethods`: normalizedMethods + payoutConfigs (`method.accountName ?? displayName`)
- [x] 2.5 Public normalizers: `publicDirectPayment.ts`, `publicStaffPayment.ts`, `normalizeTouchPage.ts`, `publicTouch.ts` (inline type)

## 3. Data hooks (ngừng drop accountName)

- [x] 3.1 `useUpdateMerchantPaymentMethod` pass-through
- [x] 3.2 `useSaveMerchantPayoutConfigs` gửi + dirty-check accountName
- [x] 3.3 `useUpdateStaffPaymentMethod` pass-through
- [x] 3.4 `useLocalStaff`: `useUpdateLocalStaffPaymentMethod` + `configureLocalStaffPaymentMethods`
- [x] 3.5 `usePersonalOnboarding` gửi accountName
- [x] 3.6 `useStaffRegistration.saveSelectedPaymentMethods` gửi accountName

## 4. UI edit surfaces

- [x] 4.1 Component chung `src/components/payout/PayoutAccountNameField.tsx`
- [x] 4.2 `ProfileTab.tsx`: state `editAccountName` + prefill + mutate + input
- [x] 4.3 `dashboard/modals/PayoutSetupModal.tsx`: prop `initialAccountName` + input
- [x] 4.4 `setup-wizard/PayoutSetupModal.tsx`: prop `initialAccountName` + input; `SetupWizard.tsx` truyền `tempPayoutValues.accountName`
- [x] 4.5 `register/modals/PayoutEditModal.tsx` + `staff-registration/steps/PayoutEditModal.tsx`: render input (props có sẵn)
- [x] 4.6 Callers: `StaffPay.handleSavePayout` (hết discard) + `initialAccountName`; `StaffModal.handlePayoutSubmit` (local-staff) + `initialAccountName`; `AddManualStaffTab` + `initialAccountName`

## 5. Display

- [x] 5.1 List rows: `ProfileTab.tsx` + `StaffPay.tsx` (dòng phụ khi có accountName)
- [x] 5.2 `WalletDetails.tsx`: matcher trả cả accountName; `recipientName = accountName của method đang chọn || displayName/nickname/bizName` (title + subtitle + instructions); note `TIP-<NICKNAME>-<ref>` giữ nguyên
- [x] 5.3 `useDirectPaymentFlow.ts` + `useStaffDirectPaymentFlow.ts`: `tipPaymentMethodsData` kèm accountName

## 6. i18n

- [x] 6.1 `en.json` + `vi.json`: `components.payout.accountNameField.{label,placeholder}`
- [x] 6.2 `en.json` + `vi.json`: `components.customer_flow.steps.WalletDetails.accountHolder`

## 7. Verification

- [x] 7.1 `pnpm build` ✓ (2026-07-17)
- [x] 7.2 `pnpm typecheck`: 72 lỗi pre-existing (baseline HEAD = 73) — không lỗi mới
- [ ] 7.3 Network trace dev: merchant PUT Zelle kèm `{accountInfo, accountName, imageUrl}`; Venmo KHÔNG có key `accountName`; clear tên → `accountName: null`; toggle sau update vẫn fire
- [ ] 7.4 Network trace dev: staff PUT CashApp kèm accountName; local-staff PUT kèm accountName
- [ ] 7.5 Wizard/registration flows: PUT bulk kèm accountName; đổi chỉ-tên vẫn fire update
- [ ] 7.6 Customer page: title/subtitle/hướng dẫn hiện accountName của method khi BE trả field; không trả → fallback displayName như cũ
- [ ] 7.7 Cập nhật US-015 status + DoD sau khi verify trên dev

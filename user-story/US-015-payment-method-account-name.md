# US-015 · Cập nhật & hiển thị Tên chủ tài khoản (accountName) cho payment method

> File: `US-015-payment-method-account-name.md` · 1 file = 1 story. ID tăng dần, duy nhất toàn repo.

| | |
|---|---|
| **Trạng thái** | Integrated (chờ verify trên dev API khi BE deploy `accountName`) |
| **Ngày tạo** | 2026-07-17 |
| **Epic / Domain** | Payment Methods (Merchant / Staff / Local-staff / Customer display) |
| **OpenSpec change** | `openspec/changes/add-payment-method-account-name` |
| **Test plan** | — (điền khi viết test) |

## Story

**Là** Business Owner hoặc Staff,
**tôi muốn** lưu và hiển thị "Tên chủ tài khoản" (accountName) cho các ví Zelle / Cash App / PayPal,
**để** khách chuyển tiền xác nhận đúng người nhận (Zelle/CashApp/PayPal hiển thị tên chủ tài khoản khi gửi).

## Acceptance Criteria

- **Given** merchant ở Settings → Payout Methods, **When** edit ví Zelle/CashApp/PayPal và nhập Account Holder Name rồi Save, **Then** FE gọi `PUT /api/v1/merchant/payment-methods/{id}` với body `{accountInfo, accountName, imageUrl}` (200) và list hiển thị tên sau refetch.
- **Given** merchant edit ví Venmo/AppleCash/VlinkPay, **When** Save, **Then** body **không chứa** key `accountName` (behavior cũ giữ nguyên).
- **Given** staff ở Staff Dashboard → Pay, **When** edit ví CashApp và nhập tên, **Then** FE gọi `PUT /api/v1/staff/payment-methods/{id}` với `{accountInfo, accountName, imageUrl}`.
- **Given** merchant edit payment method của local/manual staff (StaffModal), **When** Save, **Then** FE gọi `PUT /api/v1/merchant/local-staff/{staffProfileId}/payment-methods/{paymentMethodId}` kèm `accountName`.
- **Given** ví Zelle/CashApp/PayPal đã có tên, **When** user xoá trống input tên rồi Save, **Then** body gửi `"accountName": null` (clear).
- **Given** các flow onboarding/registration (setup wizard, register wizard, staff registration, personal onboarding), **When** hoàn tất bước payout, **Then** các PUT bulk kèm `accountName` cho 3 loại ví hỗ trợ.
- **Given** customer mở trang tip / direct-payment, **When** API public trả `accountName` cho phương thức đang chọn, **Then** tên người nhận hiển thị (title "Send $X to …", subtitle, các bước hướng dẫn) dùng `accountName` của method đó thay cho displayName/nickname/business name; khi API không trả thì fallback về displayName như cũ.

## API Mapping (bắt buộc trước khi integrate)

> Nguồn contract: Swagger live `https://test-api.nexoratouch.com/api/` — đối chiếu spec dev `https://nexora-dev-api.vlinkhub.com/api/specification.json`. Ghi tag nguồn: (S) spec / (L) đã verify live.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| PUT | `/api/v1/merchant/payment-methods/{id}` | Bearer (merchant) | `{accountInfo, accountName, imageUrl}` | `BusinessPaymentMethodDto` | (S) **spec-pending** — payload mẫu do BE cung cấp 2026-07-17; spec dev chưa publish `accountName` |
| PUT | `/api/v1/staff/payment-methods/{id}` | Bearer (staff) | `{accountInfo, accountName, imageUrl}` | `StaffPaymentMethodDto` | (S) **spec-pending** |
| PUT | `/api/v1/merchant/local-staff/{staffProfileId}/payment-methods/{paymentMethodId}` | Bearer (merchant) | `{accountInfo, accountName, imageUrl}` | `StaffPaymentMethodDto` | (S) **spec-pending** — user chốt scope bao gồm flow này |
| GET | `/api/v1/merchant/payment-methods`, `/api/v1/staff/payment-methods`, local-staff GET, public GETs (`/api/v1/tips/{id}/payment-methods`, `/api/v1/public/businesses/{id}/payment-methods`, public merchant/staff payment page) | tuỳ endpoint | — | DTO hiện chưa có `accountName`; FE normalize phòng thủ `accountName ?? null` | (S) |

**Điểm chưa chắc chắn / cần hỏi BE:** (PHẢI chốt trước khi đánh Tested)

1. `"accountName": null` có clear giá trị không, hay missing-key = no-change?
2. Khi nào GET DTO (`BusinessPaymentMethodDto`, `StaffPaymentMethodDto`, `PublicPaymentMethodDto`) trả `accountName`? (Hiện spec dev chưa có — FE đã normalize sẵn.)
3. BE có reject `accountName` trên loại ví ngoài Zelle/CashApp/PayPal không? (FE đã omit key cho các loại đó.)
4. `UpdateLocalStaffPaymentMethodRequest` có nhận `accountName` không? (FE đã gửi; nếu BE bỏ qua thì vô hại.)
5. Public API (tips payment-methods, public businesses, public direct-payment pages) có trả `accountName` để customer thấy tên chủ tài khoản không?

## FE Surface (các layer sẽ đụng)

> Theo data boundary: components → data hooks → repositories → adapter.

| Layer | File | Thay đổi |
|---|---|---|
| Constants | `src/data/paymentMethodTypes.ts` | `ACCOUNT_NAME_UI_KEYS` (zelle/cashapp/paypal), `supportsPayoutAccountName()`, `toPayoutAccountNameDto()` (undefined = omit key, `null` = clear) |
| Types | `src/types/hooks.ts`, `src/types/repositories.ts`, `src/types/domain.ts` | `UpdatePaymentMethodVars.accountName`, `StaffPaymentMethodApiDto.accountName`, `PersonalOnboardingInput.payoutConfigs[].accountName`, `PublicDirectPaymentMethod.accountName` |
| Repository | `merchantPaymentMethods.ts`, `staffPaymentMethods.ts`, `localStaff.ts` | Update DTO + Api DTO + normalize `accountName ?? null` |
| Repository (normalize khác) | `merchantStaff.ts`, `publicDirectPayment.ts`, `publicStaffPayment.ts`, `normalizeTouchPage.ts`, `publicTouch.ts` | map `accountName` (roster: `method.accountName ?? displayName` fallback) |
| Data hook | `useMerchantPaymentMethods.ts` (update + bulk save, dirty-check accountName), `useStaffPaymentMethods.ts`, `useLocalStaff.ts` (update + configure), `usePersonalOnboarding.ts` | pass-through/gửi `accountName`; invalidation giữ nguyên: `merchantPaymentMethods`+`merchantPaymentQr` / `staffPaymentMethods`+`staffPaymentQr` / `localStaffPaymentMethods`+`merchantStaff` |
| Component (input chung) | `src/components/payout/PayoutAccountNameField.tsx` (mới) | tự ẩn khi ví không thuộc `ACCOUNT_NAME_UI_KEYS` |
| Component (5 modal edit) | `settings/tabs/ProfileTab.tsx` (inline), `dashboard/modals/PayoutSetupModal.tsx` (+prop `initialAccountName`), `setup-wizard/PayoutSetupModal.tsx` (+prop), `register/modals/PayoutEditModal.tsx`, `staff-registration/steps/PayoutEditModal.tsx` | thêm input; prefill: accountName đã lưu → tên hiển thị → '' |
| Component (callers) | `staff-dashboard/views/StaffPay.tsx` (hết discard `_accountName`), `dashboard/modals/StaffModal.tsx`, `AddManualStaffTab.tsx`, `SetupWizard.tsx`, `staff-registration/hooks/useStaffRegistration.ts` | truyền/gửi accountName |
| Display | `ProfileTab.tsx` + `StaffPay.tsx` (dòng phụ trong list), `customer-flow/steps/WalletDetails.tsx` (`recipientName = accountName của method đang chọn \|\| displayName/nickname/bizName` — áp cho title/subtitle/instructions), `useDirectPaymentFlow.ts` + `useStaffDirectPaymentFlow.ts` (tipPaymentMethodsData kèm accountName) | note chuyển khoản `TIP-<NICKNAME>-<ref>` giữ nguyên (mã tracking, không phải display) |
| i18n | `locales/en.json`, `locales/vi.json` | `components.payout.accountNameField.{label,placeholder}`, `components.customer_flow.steps.WalletDetails.accountHolder` |

## Definition of Done

- [ ] AC pass trên môi trường dev (API thật) — chờ BE deploy `accountName`
- [ ] API call đúng contract đã map (method/status/payload — verify bằng network)
- [ ] Mutation invalidate đúng query cache (giữ nguyên key hiện có — xem bảng FE Surface)
- [x] Không console error (build sạch; không thêm `console.*`)
- [ ] Test theo 3 layer (repo hiện chưa có test file nào; verify bằng `pnpm typecheck` + `pnpm build` + network trace)
- [ ] Cập nhật trạng thái file này + link TC

## Ghi chú phiên thực thi

- 2026-07-17: Integrate toàn bộ FE. **Spec dev (`nexora-dev-api.vlinkhub.com/api/specification.json`) và snapshot `spec.json` root đều CHƯA có `accountName`** trong bất kỳ schema payment-method nào (update DTO đang `additionalProperties:false` chỉ với `accountInfo`, `imageUrl`) — payload đích lấy theo mẫu BE cung cấp trực tiếp. FE forward-compatible: gửi field (ASP.NET mặc định bỏ qua unknown member), normalize `?? null`, prefill fallback. **Rủi ro còn lại:** nếu BE validator strict → PUT trả 400 khi FE ship trước BE; cần verify 1 PUT thật trên dev trước khi merge.
- Wire semantics đã chọn: ví hỗ trợ luôn gửi `accountName` (string đã trim hoặc `null` để clear); ví khác omit key hoàn toàn (undefined bị `JSON.stringify` drop trong `httpClient`).
- Verify local 2026-07-17: `pnpm build` ✓; `pnpm typecheck` 72 lỗi — toàn bộ pre-existing (baseline HEAD = 73, không lỗi mới từ change này).
- `npx openspec validate` không chạy được trên máy này (CLI chưa cài) — cần validate trên môi trường có openspec CLI.

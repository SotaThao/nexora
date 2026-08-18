# US-045 · Tip nhân viên ngay trên màn Review payment (direct payment)

| | |
|---|---|
| **Trạng thái** | Integrated (chờ BE mở rộng payment page DTO + hạ ngưỡng min staff) |
| **Ngày tạo** | 2026-08-18 |
| **Epic / Domain** | Customer Tips · Direct Payment (`/pay/:businessId`) |
| **OpenSpec change** | `openspec/changes/add-tip-on-direct-payment` (thư mục đã tạo, chưa cần design doc vì thay đổi gói trong direct-payment + 1 data hook) |
| **Test plan** | `src/data/repositories/tipStaffDto.test.ts`, `src/data/repositories/publicDirectPayment.test.ts`, `src/components/direct-payment/steps/PaymentTipSection.test.tsx`, `src/components/direct-payment/steps/DirectPaymentReview.test.tsx`, `tests/unit/tipSplit.test.ts`, `tests/unit/customerFlowKind.test.ts` |

## Story

**Là** khách hàng (anonymous) quét QR thanh toán của tiệm,
**tôi muốn** chọn một hoặc nhiều nhân viên đã phục vụ mình và thêm tiền típ chia đều cho họ ngay trên màn Review payment,
**để** trả tiền hoá đơn và tiền típ trong **một lần chuyển khoản duy nhất**, không cần mở thêm luồng tip riêng.

## Acceptance Criteria

- **Given** trang `/pay/:businessId` có danh sách nhân viên típ được
  **When** khách nhập số tiền hoá đơn và bấm "Who served you today?"
  **Then** modal chọn nhân viên mở ra (search theo tên, chọn nhiều người, nút Done), `GET /api/v1/touch/{businessSlug}/{touchPointSlug}` (hoặc block `staff` trong payment page) là nguồn dữ liệu.

- **Given** khách đã chọn 2 nhân viên
  **When** bấm preset `$15`
  **Then** UI hiện `$7.50 EACH` trên từng dòng, breakdown `Bill $60.00 / Tips $15.00`, `TOTAL $75.00`.

- **Given** tổng típ chia ra dưới mức tối thiểu mỗi người (vd 6 người, tip $5)
  **Then** hiện lỗi `tip_min_item_error` và **khoá** việc chọn phương thức thanh toán.

- **Given** khách bấm SKIP
  **Then** danh sách chọn + số tiền típ bị xoá, tổng quay lại đúng tiền hoá đơn, không còn breakdown.

- **Given** khách chọn ví (vd Zelle)
  **When** flow tạo giao dịch
  **Then** tạo tip **trước**, rồi `POST /api/v1/public/merchant/{businessId}/payments` với **amount = tiền hoá đơn** (không cộng típ); màn wallet hiển thị "Send exactly $75.00".
  Endpoint tip theo số người chọn:
  - **≥ 2 người** → `POST /api/v1/tips/multi-staff` (tipItems đã chia đều, vào tài khoản tiệm)
  - **đúng 1 người** → `POST /api/v1/touch/tip` (`{ touchPointId, staffProfileId, amount, paymentMethod, sessionId }`) — vì multi-staff chặn 1 người

- **Given** khách bấm "Yes, I've paid"
  **Then** `PATCH /api/v1/public/payments/{paymentId}/confirm`, rồi confirm tip đúng loại: `PATCH /api/v1/tips/{tipId}/confirm` (multi) hoặc `POST /api/v1/touch/tip/{tipId}/confirm` (single) — best-effort, lỗi tip không chặn màn Success.

## API Mapping

> Nguồn: Swagger live `https://test-api.nexoratouch.com/api/specification.json` (fetch 2026-08-18) + probe trực tiếp bằng curl.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/public/merchant/{businessId}/payment` | ANON | — | `MerchantPaymentPageDto` (**hiện KHÔNG có `staff` / `touchPoint` / `tipConstraints`**) | (L) |
| GET | `/api/v1/touch/{businessSlug}/{touchPointSlug}?sessionId=` | ANON | — | `TouchPageDataDto` — `staff[]`, `touchPoint.id`, `tipConstraints` | (L) |
| POST | `/api/v1/tips/multi-staff` | ANON | `{ businessId, touchPointId, businessPaymentMethodId, cryptoSymbol?, tipItems: [{ staffProfileId, amount }] }` — **≥ 2 tipItems** | 201 `{ tipId, totalAmount, paymentMethodType, cryptoAddress?, tipItems[] }` | (L) |
| PATCH | `/api/v1/tips/{id}/confirm` | ANON | `{}` | 200 | (S) |
| POST | `/api/v1/touch/tip` | ANON | `{ touchPointId, staffProfileId, amount, paymentMethod, sessionId, cryptoSymbol? }` — dùng khi chỉ chọn **1** nhân viên | 201 `{ tipId }` | (S) |
| POST | `/api/v1/touch/tip/{tipId}/confirm` | ANON | `{}` | 200 | (S) |
| POST | `/api/v1/public/merchant/{businessId}/payments` | ANON | `{ businessPaymentMethodId, amount, cryptoSymbol? }` | 201 `{ paymentId, amount, type, paymentMethod }` | (L) |
| PATCH | `/api/v1/public/payments/{paymentId}/confirm` | ANON | `{}` | 200 | (L) |

**Điểm cần BE xử lý (đã verify bằng probe live, không phải phỏng đoán):**

1. 🔴 **Payment page DTO thiếu block tip.** `GET /api/v1/public/merchant/{businessId}/payment` không trả `staff[]`, `touchPoint.id`, `tipConstraints`. Route `/pay/:businessId` chỉ có business GUID nên không tự suy ra slug touchpoint được.
   → **Đề nghị BE thêm `touchPoint { id }`, `staff[]` (shape như `TouchPageStaffDto`), `tipConstraints` vào `MerchantPaymentPageDto`.** FE đã đọc sẵn các field này (`publicDirectPayment.ts` + `tipStaffDto.ts`) — BE ship là chạy, không cần sửa FE.
   **Phương án tối thiểu cho BE (rẻ nhất):** chỉ cần trả thêm `businessSlug` + `touchPoint.slug` — FE tự gọi `/api/v1/touch/{businessSlug}/{touchPointSlug}` để lấy staff/touchPointId/tipConstraints (đã code sẵn nhánh này).
   Đã verify: endpoint touch **chỉ nhận slug, không nhận GUID** (`GET /api/v1/touch/{businessId}/master-store` → 404 `BUSINESS_NOT_FOUND` trên staging, dù business đó tồn tại).

   FE resolve staff theo thứ tự: (1) block tip trong payment page → (2) `businessSlug`/`touchPointSlug` query param (QR touchpoint redirect) → (3) slug do payment page trả về. Không có nguồn nào thì khối tip **ẩn hoàn toàn** (đúng hành vi hiện tại khi mở thẳng `/pay/{guid}`).

2. ⚠️ **`POST /api/v1/tips/multi-staff` bắt buộc ≥ 2 nhân viên** — probe với 1 `tipItem` trả `400 TIP_MINIMUM_STAFF_COUNT` (amount 0.1 / 1 / 5 đều lỗi; 2 item thì qua validation).
   **Quyết định (2026-08-18):** chọn đúng 1 người thì FE gọi `POST /api/v1/touch/tip` thay vì multi-staff — không chờ BE nữa.
   ⚠️ Khác biệt cần biết: tip qua `/touch/tip` gắn với **payment method của chính nhân viên** (tip trả thẳng cho staff), còn multi-staff đi vào tài khoản tiệm. Nếu muốn 1 người cũng đi qua tài khoản tiệm thì vẫn cần BE hạ `TIP_MINIMUM_STAFF_COUNT` xuống 1. `errors.tip_minimum_staff_count` giữ lại làm lưới an toàn.

3. ⚠️ `touchPointId` là bắt buộc trong `CreateMultiStaffTipCommand` (probe: `'Touch Point Id' must not be empty`) — phụ thuộc điểm 1.

## FE Surface

| Layer | File | Thay đổi |
|---|---|---|
| Component | `src/components/DirectPaymentFlow.tsx` | truyền `tip`/`tipTotal`/`totalAmount`/`perStaffTipAmount`, render `SelectServerModal`, wallet + success dùng `totalAmount` |
| Component | `src/components/direct-payment/steps/DirectPaymentReview.tsx` | thêm khối tip + breakdown Bill/Tips/Total (props tip là optional — staff payment flow không đổi) |
| Component | `src/components/direct-payment/steps/PaymentTipSection.tsx` 🆕 | khối "ADD A TIP": prompt chọn người, danh sách người đã chọn, preset chips, custom, SKIP |
| Component | `src/components/direct-payment/modals/SelectServerModal.tsx` 🆕 | modal "Who served you today?" (search + multi-select + Done), `.nexora-modal-card` + body `flex-1 overflow-y-auto` |
| Hook (feature) | `src/components/direct-payment/hooks/useDirectPaymentTip.ts` 🆕 | state chọn staff + tip total → `tipItems` chia đều, `tipError` |
| Hook (feature) | `src/components/direct-payment/hooks/useDirectPaymentFlow.ts` | tạo tip trước payment, confirm tip sau confirm payment, chặn chọn ví khi tip lỗi |
| Data hook | `src/data/hooks/usePublicDirectPayment.ts` | `useDirectPaymentTipContext` — ưu tiên block tip trên payment page, fallback touch page. Query key: `qk.publicDirectPaymentPage`, `qk.customerTouch` |
| Data hook | `src/data/hooks/usePublicTouch.ts` | dùng lại `useCreateMultiStaffTip` / `useConfirmMultiStaffTip` (đã có từ luồng touch) |
| Repository | `src/data/repositories/tipStaffDto.ts` 🆕 | `toTipStaffList` / `toTipConstraints` (normalize `staff[]` + `tipConstraints` cho cả touch page và payment page) |
| Repository | `src/data/repositories/publicDirectPayment.ts` | normalize thêm `touchPointId`, `staff`, `tipConstraints` |
| Utils | `src/utils/tipSplit.ts` 🆕 | chia đều theo cent, tổng luôn khớp |
| Utils | `src/utils/customerFlowKind.ts` | `resolveTouchpointRedirectUrl(..., context)` forward `businessSlug`/`touchPointSlug`/`sessionId` sang `/pay` |
| Constants | `src/constants/tipPresets.ts` 🆕 | preset `[5,10,15,20]`, `TIP_MIN_ITEM_AMOUNT=1`, `TIP_MAX_TOTAL_AMOUNT=500`, `MULTI_STAFF_TIP_MIN_COUNT=2` |
| i18n | `src/locales/en.json`, `vi.json` | `direct_payment.tip_*`, `errors.tip_minimum_staff_count`, `errors.tip_business_payment_method_required` |

## Definition of Done

- [x] AC pass với payload thật (chạy build production + Playwright 375×667, mock đúng payload đã capture từ Swagger/live)
- [x] API call đúng contract đã map — network trace: `GET .../payment` → `GET /touch/...` → `POST /tips/multi-staff` (tipItems 7.5/7.5) → `POST .../payments` (amount 60)
- [x] Không console error
- [x] Test 3 layer: repository (`tipStaffDto`, `publicDirectPayment`) / component + hook (`PaymentTipSection`, `DirectPaymentReview`) / util (`tipSplit`, `customerFlowKind`) — 30 test mới, `pnpm test` 8 file / 69 test pass
- [x] Routing endpoint theo số người: verify bằng Playwright trên bản build prod — 1 người → `POST /touch/tip` (`paymentMethod: "Zelle"`) + confirm `POST /touch/tip/{id}/confirm`; 2 người → `POST /tips/multi-staff` + confirm `PATCH /tips/{id}/confirm`
- [ ] AC pass trên dev API thật với QR thanh toán thuần (chờ BE điểm 1: payment page chưa trả staff/slug)
- [ ] Cập nhật trạng thái Tested/Done sau khi BE ship

## Ghi chú phiên thực thi

- Tiền hoá đơn và tiền típ là **2 bản ghi tách biệt**: payment = tiền bill, tip = bản ghi multi-staff. Màn wallet cộng lại để khách chuyển 1 lần ("Send exactly $75.00"). Không cộng típ vào `amount` của payment để tránh đếm trùng doanh thu.
- Endpoint tip chọn theo số người (`MULTI_STAFF_TIP_MIN_COUNT = 2`), loại tip được nhớ trong `currentTipKind` để confirm đúng endpoint. `paymentMethod` gửi lên `/touch/tip` là enum PascalCase — `toWireMethod` trong `publicTouch.ts` nay map cả ui key lowercase (`zelle` → `Zelle`) qua `PAYOUT_UI_KEY_TO_API_TYPE`.
- Thứ tự gọi API: **tip trước, payment sau** — tip bị từ chối thì chưa tạo payment nào (không để lại payment mồ côi). Ngược lại nếu payment lỗi, tip vẫn ở trạng thái chưa confirm (vô hại).
- Preset là **tổng tiền típ**, chia đều theo cent; cent lẻ dồn cho những người đầu danh sách để tổng luôn khớp (`tipSplit.ts`).
- `perStaffAmount` chỉ hiện khi chọn ≥ 2 người (1 người thì số tiền đã nằm ở dòng Tips).
- Nút "Change" trên 1 dòng = bỏ người đó rồi mở lại modal để chọn người khác; "Add another person" giữ nguyên lựa chọn cũ.

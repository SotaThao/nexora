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
  **When** chọn `$10` cho Maria và `$10` cho Tony (mỗi người có hàng chips riêng)
  **Then** breakdown `Bill $60.00 / Tips $20.00`, `TOTAL $80.00`. Số tiền là **của từng người**, không chia đều một tổng — chọn `$10` + `$20` thì Tips = `$30.00`.

- **Given** khách đã chọn nhân viên nhưng **còn người chưa chọn số tiền típ**
  **Then** hiện nhắc `tip_amount_required` ("Chọn số tiền típ… hoặc bấm SKIP") và **khoá** toàn bộ nút chọn ví — không cho submit, tránh trường hợp khách tưởng đã típ nhưng không có bản ghi tip nào được tạo.

- **Given** một người có số tiền dưới mức tối thiểu (vd nhập $0.50) hoặc tổng vượt mức tối đa
  **Then** hiện `tip_min_item_error` / `tip_max_total_error` và **khoá** việc chọn phương thức thanh toán.

- **Given** khách bấm SKIP
  **Then** danh sách chọn + số tiền típ bị xoá, tổng quay lại đúng tiền hoá đơn, không còn breakdown.

- **Given** khách chọn ví (vd Zelle)
  **When** flow tạo giao dịch
  **Then** tạo tip **trước**, rồi `POST /api/v1/public/merchant/{businessId}/payments` với **amount = tiền hoá đơn** (không cộng típ); màn wallet hiển thị "Send exactly $75.00".
  Mọi tip — **kể cả khi chỉ chọn 1 người** — đều đi qua `POST /api/v1/tips/multi-staff`; `tipItems` mang đúng số tiền từng người đã chọn.

- **Given** khách bấm "Yes, I've paid"
  **Then** `PATCH /api/v1/public/payments/{paymentId}/confirm`, rồi `PATCH /api/v1/tips/{tipId}/confirm` — best-effort, lỗi tip không chặn màn Success.

## API Mapping

> Nguồn: Swagger live `https://test-api.nexoratouch.com/api/specification.json` (fetch 2026-08-18) + probe trực tiếp bằng curl.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/public/merchant/{businessId}/payment` | ANON | — | `MerchantPaymentPageDto` (**hiện KHÔNG có `staff` / `touchPoint` / `tipConstraints`**) | (L) |
| GET | `/api/v1/touch/{businessSlug}/{touchPointSlug}?sessionId=` | ANON | — | `TouchPageDataDto` — `staff[]`, `touchPoint.id`, `tipConstraints` | (L) |
| POST | `/api/v1/tips/multi-staff` | ANON | `{ businessId, touchPointId, businessPaymentMethodId, cryptoSymbol?, minStaffCount?, tipItems: [{ staffProfileId, amount }] }` — dùng cho **mọi** số lượng người; gửi `minStaffCount: 1` khi chỉ tip 1 người | 201 `{ tipId, totalAmount, paymentMethodType, cryptoAddress?, tipItems[] }` | (L) |
| PATCH | `/api/v1/tips/{id}/confirm` | ANON | `{}` | 200 | (S) |
| POST | `/api/v1/public/merchant/{businessId}/payments` | ANON | `{ businessPaymentMethodId, amount, cryptoSymbol? }` | 201 `{ paymentId, amount, type, paymentMethod }` | (L) |
| PATCH | `/api/v1/public/payments/{paymentId}/confirm` | ANON | `{}` | 200 | (L) |

**Điểm cần BE xử lý (đã verify bằng probe live, không phải phỏng đoán):**

1. 🔴 **Payment page DTO thiếu block tip.** `GET /api/v1/public/merchant/{businessId}/payment` không trả `staff[]`, `touchPoint.id`, `tipConstraints`. Route `/pay/:businessId` chỉ có business GUID nên không tự suy ra slug touchpoint được.
   → **Đề nghị BE thêm `touchPoint { id }`, `staff[]` (shape như `TouchPageStaffDto`), `tipConstraints` vào `MerchantPaymentPageDto`.** FE đã đọc sẵn các field này (`publicDirectPayment.ts` + `tipStaffDto.ts`) — BE ship là chạy, không cần sửa FE.
   **Phương án tối thiểu cho BE (rẻ nhất):** chỉ cần trả thêm `businessSlug` + `touchPoint.slug` — FE tự gọi `/api/v1/touch/{businessSlug}/{touchPointSlug}` để lấy staff/touchPointId/tipConstraints (đã code sẵn nhánh này).
   Đã verify: endpoint touch **chỉ nhận slug, không nhận GUID** (`GET /api/v1/touch/{businessId}/master-store` → 404 `BUSINESS_NOT_FOUND` trên staging, dù business đó tồn tại).

   FE resolve staff theo thứ tự: (1) block tip trong payment page → (2) `businessSlug`/`touchPointSlug` query param (QR touchpoint redirect) → (3) slug do payment page trả về. Không có nguồn nào thì khối tip **ẩn hoàn toàn** (đúng hành vi hiện tại khi mở thẳng `/pay/{guid}`).

2. ⏳ **Ràng buộc ≥ 2 nhân viên của `/tips/multi-staff` — BE báo đã bỏ, chờ deploy.**
   **Quyết định (2026-08-19):** FE bỏ nhánh `/touch/tip`, mọi tip (1 hay nhiều người) đều gọi `/tips/multi-staff` để tiền luôn vào tài khoản tiệm và chỉ còn một luồng duy nhất.
   Theo BE, tip 1 người cần gửi kèm `minStaffCount: 1` trong payload → FE gửi field này khi `tipItems.length === 1` (bỏ qua khi ≥2).
   ⚠️ Probe lúc 2026-08-19 trên **cả 4 env** (`test-api`, `test2-api`, `staging-api`, `api` prod) với 1 `tipItem` vẫn trả `400 TIP_MINIMUM_STAFF_COUNT`, kể cả khi gửi `minStaffCount`/`MinStaffCount` — và field này chưa có trong `CreateMultiStaffTipCommand` của Swagger. Tức bản BE mới chưa lên env nào; `errors.tip_minimum_staff_count` giữ lại để hiện thông báo rõ ràng cho tới lúc đó.
   FE gửi camelCase `minStaffCount` (đồng bộ với các field khác trong body; ASP.NET Core bind case-insensitive). Nếu BE yêu cầu đúng `MinStaffCount` thì sửa 1 dòng trong `publicBusinesses.createMultiStaffTip`.

3. ⚠️ `touchPointId` là bắt buộc trong `CreateMultiStaffTipCommand` (probe: `'Touch Point Id' must not be empty`) — phụ thuộc điểm 1.

## FE Surface

| Layer | File | Thay đổi |
|---|---|---|
| Component | `src/components/DirectPaymentFlow.tsx` | truyền `tip`/`tipTotal`/`totalAmount`/`perStaffTipAmount`, render `SelectServerModal`, wallet + success dùng `totalAmount` |
| Component | `src/components/direct-payment/steps/DirectPaymentReview.tsx` | thêm khối tip + breakdown Bill/Tips/Total (props tip là optional — staff payment flow không đổi) |
| Component | `src/components/direct-payment/steps/PaymentTipSection.tsx` 🆕 | khối "ADD A TIP": prompt chọn người, danh sách người đã chọn, preset chips, custom, SKIP |
| Component | `src/components/direct-payment/modals/SelectServerModal.tsx` 🆕 | modal "Who served you today?" (search + multi-select + Done), `.nexora-modal-card` + body `flex-1 overflow-y-auto`, bám `visualViewport` để bàn phím iOS không che |
| Hook (shared) | `src/hooks/useVisualViewportRect.ts` 🆕 | theo dõi visual viewport (chiều cao vùng không bị bàn phím che) |
| Hook (shared) | `src/hooks/useBodyScrollLock.ts` 🆕 | khoá scroll trang nền khi modal mở (iOS cần `position: fixed`, không đủ với `overflow: hidden`) |
| Hook (feature) | `src/components/direct-payment/hooks/useDirectPaymentTip.ts` 🆕 | state chọn staff + **số tiền tip riêng cho từng người** (`entries` map) → `tipItems`, `tipTotal` = tổng, `tipError` |
| Hook (feature) | `src/components/direct-payment/hooks/useDirectPaymentFlow.ts` | tạo tip trước payment, confirm tip sau confirm payment, chặn chọn ví khi tip lỗi |
| Data hook | `src/data/hooks/usePublicDirectPayment.ts` | `useDirectPaymentTipContext` — ưu tiên block tip trên payment page, fallback touch page. Query key: `qk.publicDirectPaymentPage`, `qk.customerTouch` |
| Data hook | `src/data/hooks/usePublicTouch.ts` | dùng lại `useCreateMultiStaffTip` / `useConfirmMultiStaffTip` (đã có từ luồng touch) |
| Repository | `src/data/repositories/tipStaffDto.ts` 🆕 | `toTipStaffList` / `toTipConstraints` (normalize `staff[]` + `tipConstraints` cho cả touch page và payment page) |
| Repository | `src/data/repositories/publicDirectPayment.ts` | normalize thêm `touchPointId`, `staff`, `tipConstraints` |

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

- 2026-08-19 (bug iPhone #2): mở modal thấy **2 thanh scroll** (trang nền + danh sách). Fix: `useBodyScrollLock` khoá trang nền khi sheet mở — `overflow: hidden` một mình bị iOS Safari bỏ qua nên phải pin `position: fixed; top: -scrollY` và khôi phục vị trí cuộn khi đóng. Logic này vốn đã có trong `BookingCreateAppointmentModal`, nay tách ra hook dùng chung.
- 2026-08-19 (bug iPhone): modal chọn nhân viên bị bàn phím che. iOS Safari **không** thu nhỏ layout viewport khi bàn phím bật (và `100dvh` cũng không trừ bàn phím), nên overlay `fixed inset-0` giữ nguyên chiều cao, nửa dưới nằm sau bàn phím. Fix: `useVisualViewportRect` set `height` + `translateY(offsetTop)` cho overlay và `maxHeight: 100%` cho card, ghi đè giới hạn `90dvh` của `.nexora-modal-card`. Trình duyệt không hỗ trợ `visualViewport` thì giữ nguyên cách cũ. **Các modal khác trong app vẫn còn lỗi này** — dùng lại hook trên khi đụng tới.

- Tiền hoá đơn và tiền típ là **2 bản ghi tách biệt**: payment = tiền bill, tip = bản ghi multi-staff. Màn wallet cộng lại để khách chuyển 1 lần ("Send exactly $75.00"). Không cộng típ vào `amount` của payment để tránh đếm trùng doanh thu.
- 2026-08-19: gỡ nhánh single-tip (`/touch/tip`) — chỉ còn `/tips/multi-staff` cho mọi số lượng người, nên `currentTipKind` và hằng số `MULTI_STAFF_TIP_MIN_COUNT` đã bị xoá. Bản mở rộng `toWireMethod` trong `publicTouch.ts` (map ui key lowercase → enum PascalCase) giữ nguyên vì luồng touch vẫn dùng.
- Thứ tự gọi API: **tip trước, payment sau** — tip bị từ chối thì chưa tạo payment nào (không để lại payment mồ côi). Ngược lại nếu payment lỗi, tip vẫn ở trạng thái chưa confirm (vô hại).
- 2026-08-19: đổi từ "một tổng chia đều" sang **số tiền riêng cho từng nhân viên** — mỗi dòng có hàng chips `$5/$10/$15/$20/Other` của riêng mình, `Tips` = tổng các số tiền đó. `src/utils/tipSplit.ts` (chia đều theo cent) đã bị xoá vì không còn ai dùng.
- 2026-08-19 (bug fix): "Change" **chỉ mở lại modal**, không tự bỏ ai. Danh sách tick trong modal là nguồn chân lý duy nhất — Done áp dụng đúng những gì đang tick, Close không đổi gì. Trước đó Change đánh dấu "đang thay người này" rồi loại họ khi Done (kể cả khi vẫn tick) và bản đầu còn xoá ngay lúc bấm Change → nhân viên đã chọn bị mất ngoài ý muốn. Muốn đổi người: bỏ tick người cũ + tick người mới; muốn bỏ nhanh: nút X trên dòng (`tip_remove`). Nút Done không còn bị disable khi không tick ai (= không tip).

- 2026-08-19 (payment amount): nhập < $1 nay **báo lỗi validate inline** ngay dưới ô Amount (viền đỏ + `role="alert"` + `aria-invalid`), thay vì chỉ khoá nút chọn ví trong im lặng. Logic thuần `resolveDirectPaymentAmountError` trong `paymentFlowShared.ts` (im lặng khi chưa nhập, `too_low` khi < min, `too_high` khi > max) dùng chung cho cả màn merchant và staff. CSS toàn cục `input:focus` dùng `!important` nên phải thêm rule riêng cho `input.payment-amount-input[aria-invalid="true"]` để viền đỏ không bị viền tím focus ghi đè.
- 2026-08-19 (payment amount): giữ ngưỡng tối thiểu **$1.00** (`DIRECT_PAYMENT_MIN_AMOUNT = 1`) đúng theo BE — probe staging: `amount: 0.99` → `400 PAYMENT_AMOUNT_TOO_LOW` (GreaterThanOrEqualValidator), `amount: 1.00` qua validator. Đã thử hạ xuống 0.01 rồi revert vì FE phải bắt lỗi trước, không để BE từ chối muộn.

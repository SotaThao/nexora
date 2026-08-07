# US-025 · POS Front Desk — Checkout: Thu tiền một ticket (shared Owner/Staff screen)

> File: `US-025-pos-checkout.md` · 1 file = 1 story.

| | |
|---|---|
| **Trạng thái** | Tested |
| **Ngày tạo** | 2026-07-20 |
| **Epic / Domain** | POS Merchant Ops — Front Desk (Check-in queue / Turn Board / Checkout) |
| **OpenSpec change** | `—` (≥3 file nhưng tái sử dụng 100% pattern đã có — `PosFrontDeskView`/data-boundary từ US-023/US-024 + modal pattern từ `pos/modals/CreateEditPosServiceModal.tsx` — cùng lý do bỏ qua ceremony đã ghi ở US-023) |
| **Test plan** | — (điền khi viết test) |

## Story

**Là** Lễ tân/Quản lý ca (Staff có quyền `Operations`) hoặc Chủ salon (Owner),
**tôi muốn** rà soát dịch vụ trên ticket, chọn mức tip, chọn payment method và bấm thu tiền,
**để** hoá đơn, tip, audit được ghi nhận đầy đủ và trạm thợ tự giải phóng ngay khi thanh toán xong.

Nguồn: `docs/plan/tasks/pos/US-14-pos-checkout.md` (backend repo `vlink-nexora`), backend implement cùng session 2026-07-20.

**Quyết định thiết kế giữ nguyên từ US-023/US-024**: Owner và Staff dùng chung `PosFrontDeskView` (nhận `businessId` qua prop). Checkout thay `ComingSoonPanel` cũ ở tab thứ 3 bằng bảng `Ready Tickets` thật; nút `Checkout` trên thẻ trạm `InService` ở Turn Board (đã build disabled ở US-024) nay được bật.

**Quyết định thiết kế mới cho ticket này:**
- Màn Checkout hiển thị dưới dạng **modal** (`PosCheckoutModal`), không phải route/page riêng — mở từ 2 điểm vào: (1) nút `Open Checkout` trên bảng Ready Tickets; (2) nút `Checkout` trên thẻ trạm `InService` — bấm từ Turn Board sẽ gọi `MarkTicketReadyCommand` trước, mở modal khi thành công.
- **5 mức tip**: `$10`/`$15` (fixed, `$15` là mặc định — set ngay khi mở modal nếu ticket đang có `tipAmount = 0`, đúng BA doc), `18%`/`20%` (FE tính trên `servicesSubtotal` do BE trả), `Custom` (nhập tay). Mỗi lần đổi mức gọi `SetTicketTipCommand` ngay — Payment Summary luôn đọc từ `GetTicketDetailQuery` (BE tính lại `Total`), không tính tay ở FE để tránh 2 nguồn sự thật.
- **Payment Method mặc định `Cash`** (không phải "Visa **** 4242 đã lưu" như BA doc mock — không có tích hợp lưu thẻ thật, đúng quyết định "Không tích hợp cổng thanh toán thật" đã chốt ở US-14 backend). `Split Pay` chỉ là 1 giá trị `PaymentMethodType` được ghi nhận, không có luồng chia số tiền thật (đúng phạm vi backend, không mở rộng thêm).
- **Discount cố định $0** — ẩn hẳn 2 nút `+ Discount`/`+ Coupon` khỏi UI (chưa có backend, "coming soon" đã chốt ở US-14).
- **Không hiển thị khối "Tip & Technician Split % chia"** — ticket chỉ có 1 thợ chính (`AssignedPosStaffProfileId`), không có multi-technician split trong phạm vi này (đúng comment trong `PosTicket.cs`: "no multi-technician tip split in this scope"). Chỉ hiển thị tên thợ đang thực hiện.
- **`+ Add Service` cần 1 endpoint backend mới** (`GET /checkout/services`, bổ sung ngoài Task 14.1-14.9 gốc) — endpoint Owner Setup cũ (`GET /api/v1/merchant/pos/services`) suy ra business từ `OwnerUserProfileId`, sẽ lỗi `BUSINESS_NOT_FOUND` khi Staff gọi. Endpoint mới dùng đúng `IPosOperationsAccessService` như phần còn lại của Checkout feature.
- **Receipt Email/Phone input prefill** từ `ticket.customerEmail`/`customerPhone` (UX-only default ở FE) — backend không tự fallback field này (đã chốt Assumption 4 ở US-14, xem `docs/plan/tasks/pos/US-14-pos-checkout.md`).

## Acceptance Criteria

- **Given** Owner/Staff mở tab `Checkout`
- **When** tab load
- **Then** FE gọi `GET /checkout/ready` (poll 15s); hiện bảng Ticket/Guest/Technician/Services + nút `Open Checkout` mỗi dòng

- **Given** đang ở tab `Checkout`, bấm `Open Checkout` trên 1 dòng — **hoặc** đang ở Turn Board, bấm `Checkout` trên thẻ trạm `InService`
- **When** click
- **Then** (Turn Board only) FE gọi `POST .../ready` trước; sau đó mở `PosCheckoutModal` cho đúng `ticketId`, gọi `GET /checkout/{ticketId}` + `GET /checkout/services`; nếu `tipAmount` của ticket đang là `0`, FE tự gọi `PUT .../tip` với `15` ngay khi load xong (mặc định `$15` theo BA doc)

- **Given** modal đang mở
- **When** bấm `+ Add Service`, chọn 1 dịch vụ từ catalog
- **Then** FE gọi `POST .../services`; `201` → invalidate ticket detail; bảng dịch vụ + `Services` subtotal trên Payment Summary cập nhật ngay

- **Given** modal đang mở
- **When** đổi mức tip (`$10`/`$15`/`18%`/`20%`/`Custom`)
- **Then** FE gọi `PUT .../tip` với số tiền tương ứng; `200` → invalidate ticket detail; dòng `Tip` và `Total` trên Payment Summary cập nhật ngay (không tính tay ở FE)

- **Given** modal đang mở
- **When** chọn 1 trong 4 payment method
- **Then** chỉ đổi state cục bộ (không gọi API) — dòng `Payment` trên Payment Summary và nhãn nút `Charge $x` đổi theo ngay

- **Given** đã rà soát dịch vụ/tip/payment method, đã xác nhận (hoặc để trống) email/phone nhận receipt
- **When** bấm `Charge`
- **Then** FE gọi `POST .../charge` với `{ paymentMethodType, receiptEmail?, receiptPhone? }`; `200` → đóng modal, toast thành công, invalidate `merchantPosReadyTickets`, `merchantPosTurnBoard`, `merchantPosWaitlist`; trạm biến mất khỏi danh sách `InService` trên Turn Board

- **Given** action Charge trả lỗi 400 (`TICKET_NOT_READY`/`TICKET_ALREADY_PAID`) — vd. 2 lễ tân bấm Charge cùng lúc
- **When** lỗi xảy ra
- **Then** hiện toast lỗi (fallback `errors.unknown_error` — các code mới của US-14 chưa có trong `errorCodeToI18nKey`, đúng cách xử lý đã áp dụng ở US-024), modal vẫn mở để lễ tân xử lý lại, KHÔNG tự đóng modal

- **Given** ticket không có email/phone khách (để trống cả 2 ô)
- **When** bấm `Charge`
- **Then** vẫn charge thành công — backend không chặn, chỉ không gửi receipt

## API Mapping (bắt buộc trước khi integrate)

> Contract build cùng session ở backend repo — chưa deploy, tag (L-local).

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/merchant/pos/{businessId}/checkout/ready` | Bearer | — | `200 [{ id, ticketNumber, customerName, technicianName?, serviceNames[], assignedAt? }]` | L-local |
| GET | `/api/v1/merchant/pos/{businessId}/checkout/{ticketId}` | Bearer | — | `200 { id, ticketNumber, customerName, customerEmail?, customerPhone?, status, technicianName?, assignedPosStaffProfileId?, serviceLines[{id, serviceName, unitPrice, quantity, lineTotal}], servicesSubtotal, tipAmount, discountAmount, salesTaxAmount, total, paymentMethodType?, receiptEmail?, receiptPhone?, paidAt? }` | L-local |
| GET | `/api/v1/merchant/pos/{businessId}/checkout/services` | Bearer | — | `200 [{ id, name, price }]` (chỉ `Active`) — endpoint mới, thêm ngoài US-14 gốc | L-local |
| POST | `/api/v1/merchant/pos/{businessId}/checkout/{ticketId}/services` | Bearer | `{ posServiceId, quantity? }` | `201 Guid` (serviceLineId) | L-local |
| POST | `/api/v1/merchant/pos/{businessId}/checkout/{ticketId}/ready` | Bearer | — | `200 boolean` | L-local |
| PUT | `/api/v1/merchant/pos/{businessId}/checkout/{ticketId}/tip` | Bearer | `{ tipAmount }` | `200 boolean` | L-local |
| POST | `/api/v1/merchant/pos/{businessId}/checkout/{ticketId}/charge` | Bearer | `{ paymentMethodType, receiptEmail?, receiptPhone? }` | `200 { ticketId, servicesSubtotal, tipAmount, discountAmount, salesTaxAmount, totalAmount, status, paidAt }` | L-local |

**Còn lại cần xác nhận khi integrate:** re-verify qua live Swagger sau khi BE deploy. `paymentMethodType`/`status` là string enum (`JsonStringEnumConverter` toàn hệ thống — "Card"/"Cash"/"GiftCard"/"SplitPay", "Waiting"/"InService"/"Ready"/"Paid"/"Synced"/"Cancelled"), không phải số.

## FE Surface (các layer sẽ đụng)

| Layer | File | Thay đổi |
|---|---|---|
| Types | `src/types/repositories.ts` | Mới: `ReadyTicketApiDto`, `TicketDetailApiDto`, `TicketServiceLineApiDto`, `CheckoutServiceCatalogItemApiDto`, `ChargeTicketPayload`, `ChargeTicketResultApiDto` |
| Repository | `src/data/repositories/posCheckout.ts` (mới) | `getReadyTickets`, `getTicketDetail`, `getServiceCatalog`, `addTicketServiceLine`, `markTicketReady`, `setTicketTip`, `chargeTicket` |
| Data hook | `src/data/hooks/usePosCheckout.ts` (mới) | `useReadyTickets` (poll 15s), `useCheckoutServiceCatalog`, `useTicketDetail`, `useAddTicketServiceLine`, `useMarkTicketReady`, `useSetTicketTip`, `useChargeTicket` — invalidation theo bảng AC |
| Query keys | `src/data/queryKeys.ts` | `merchantPosReadyTickets(businessId)`, `merchantPosTicketDetail(businessId, ticketId)`, `merchantPosCheckoutServiceCatalog(businessId)` |
| Component (mới) | `src/components/dashboard/views/pos/modals/PosCheckoutModal.tsx` | Modal đầy đủ: bảng dịch vụ + Add Service, 5 nút tip, 4 nút payment method, input email/phone, Payment Summary, nút `Charge $x` |
| Component (sửa) | `src/components/dashboard/views/pos/PosFrontDeskView.tsx` | Thay `ComingSoonPanel` tab `checkout` bằng bảng Ready Tickets thật; bật nút `Checkout` trên thẻ trạm `InService` (bỏ `disabled`); quản lý state `checkoutTicketId` mở/đóng `PosCheckoutModal` |
| i18n | `src/locales/en.json`, `src/locales/vi.json` | Thêm key mới dưới `components.dashboard.views.pos.PosFrontDeskView.*` (bảng Ready Tickets) và `components.dashboard.views.pos.PosCheckoutModal.*` (modal); xoá `checkoutComingSoon`/disabled tooltip nếu không còn dùng ở Turn Board |

## Definition of Done

- [ ] AC pass trên môi trường dev (API thật — cần backend deploy trước)
- [ ] API call đúng contract đã map (method/status/payload — verify bằng network)
- [ ] Mutation invalidate đúng query cache (`merchantPosReadyTickets`, `merchantPosTurnBoard`, `merchantPosWaitlist`, `merchantPosTicketDetail`)
- [ ] Không console error
- [ ] Test theo 3 layer (skill feature-focused-tester): L1 UI / L2 data boundary / L3 flow
- [ ] Modal test ở viewport 375×667 (mobile) theo mục "Mobile-Responsive Modals & Dialogs" của CLAUDE.md
- [ ] Cập nhật trạng thái file này + link TC

## Ghi chú phiên thực thi

- Verify: `npx tsc --noEmit` — 61 lỗi tổng, tất cả thuộc các file không liên quan (không có file nào trong danh sách lỗi thuộc `posCheckout`, `PosFrontDeskView`, `PosCheckoutModal`, hay các key mới trong `repositories.ts`/`queryKeys.ts`) + `npx vite build --mode production` — build thành công, chỉ warning chunk-size có sẵn không liên quan.
- **4 error code mới của US-14 (`TICKET_NOT_READY`, `TICKET_ALREADY_PAID`, `TICKET_NOT_IN_SERVICE`, `TICKET_CLOSED_FOR_EDITS`) không được thêm vào `errorCodeToI18nKey`** — nhất quán với cách xử lý đã áp dụng ở US-024 cho 4 code không-prefix tương tự của US-13 (fallback `errors.unknown_error`).
- Tip mode `custom` chỉ commit giá trị qua `SetTicketTipCommand` khi blur hoặc Enter (không gọi API theo từng ký tự gõ).
- Tự động set tip mặc định `$15` chỉ chạy 1 lần khi modal mở cho 1 `ticketId` (dùng `useRef` chặn lặp lại do refetch sau mỗi mutation) — tránh việc mỗi lần Add Service làm tip bị ghi đè lại về $15.
- Chưa làm được (backend chưa deploy lên dev/test server): AC trên môi trường dev với API thật, verify network trace, test 3-layer, click-through thật trên browser, test viewport 375×667 thật (mới verify qua đọc code — layout đã dùng đúng `.nexora-modal-card` + `flex-1 overflow-y-auto` theo mục Mobile-Responsive Modals của CLAUDE.md, nhưng chưa chụp màn hình xác nhận).
- Riêng US-025 còn chưa xác nhận: hành vi khi 2 lễ tân cùng mở Checkout cho cùng 1 ticket (race trên `SetTicketTip`/`AddTicketServiceLine`), và độ chính xác của việc suy ngược `tipMode` từ `tipAmount` đã lưu khi mở lại 1 ticket đã có tip tuỳ chỉnh trùng khớp ngẫu nhiên với 18%/20%.

### Verify thật trên browser (2026-07-20, Playwright MCP, backend local `https://localhost:5005` ASPNETCORE_ENVIRONMENT=Test + FE `npx vite --port 3000`, đăng nhập Owner `quanpm`)

**🐛 Bug nghiêm trọng phát hiện và đã fix — không liên quan trực tiếp đến code mới của US-025 nhưng chặn toàn bộ tính năng Front Desk hoạt động:** `src/locales/en.json` và `vi.json` có bracket đóng sai từ session US-023 — key `"pos": { ... }` bị đóng sớm ngay sau `"PosStaffProfileView"`, khiến `"PosFrontDeskView"` (và giờ cả `"PosCheckoutModal"` tôi vừa thêm) nằm **ngoài** `pos`, ở `components.dashboard.views.PosFrontDeskView` thay vì `components.dashboard.views.pos.PosFrontDeskView`. Toàn bộ UI Check-in queue/Turn Board/Checkout hiển thị y nguyên dotted-key thô (`components.dashboard.views.pos.PosFrontDeskView.tabs.checkin`) thay vì text đã dịch — bug này tồn tại từ US-023 nhưng chưa ai từng test qua browser thật nên không bị phát hiện (cả US-023 và US-024 đều ghi rõ "chưa làm được... click-through thật trên browser"). Đã sửa: di chuyển đúng dấu `}` đóng `pos` xuống sau `PosCheckoutModal`, re-indent 2 block cho khớp cấp lồng với các `PosXxxView` khác trong `pos`. Verify lại bằng Node script (`en.components.dashboard.views.pos.PosFrontDeskView...` resolve đúng) + xác nhận trên browser text hiển thị đúng tiếng Anh.

**Luồng test thật (Owner `quanpm`, business đã có sẵn 3 staff Chloe/Staff02/Trump, PosService "Regular Manicure" $25.00, `SalesTaxRatePercent` chưa cấu hình = null):**
1. Check-in khách "Emma Watson" (không chọn dịch vụ) → ticket `#A013` vào Waitlist đúng, badge Check-in queue tăng lên (1) ✅
2. Bấm `Assign` trên dòng Waitlist → ticket biến mất khỏi Waitlist, Turn Board hiện Chloe "Serving" với Emma Watson ✅
3. Bấm nút `Checkout` trên thẻ trạm Chloe (`InService`) → gọi đúng `POST .../ready` rồi `GET .../checkout/{ticketId}` — modal mở, tip mặc định tự set `$15.00` ngay (verify qua network: `PUT .../tip` với `tipAmount=15` được gọi tự động khi mở) ✅, badge tab Checkout tăng lên (1) ✅
4. `+ Add Service` chọn "Regular Manicure — $25.00" → `POST .../services` trả `201`, dòng dịch vụ xuất hiện, `Services` subtotal Payment Summary cập nhật `$25.00`, `Total` thành `$40.00` ✅ (đồng thời Turn Board card của Chloe phía sau modal cũng live-update hiện "Regular Manicure" nhờ invalidate turnBoard) ✅
5. Bấm tip `18%` → `PUT .../tip` với `tipAmount=4.50` (đúng 18% × $25 = $4.50, tính trên services subtotal không tính trên tax, khớp BA rule) → `Total` = `$29.50` ✅
6. Chọn payment method `Cash` (chỉ đổi local state, không gọi API) ✅, nhập receipt email `emma.w@example.com` ✅
7. Bấm `Charge $29.50` → `POST .../charge` trả `200` → modal tự đóng, Chloe's station chuyển về `Open` (station released đúng AC), tab Checkout badge về (0), ticket biến mất khỏi cả Turn Board và Checkout list ✅. Không có console error nào trong suốt luồng ✅
8. Test viewport mobile 375×667 (check-in + assign thêm 1 ticket "Mobile Test Guest", mở lại modal Checkout): đo bằng `page.evaluate` bounding rect — modal card cao đúng `600.3px` = 90% của `667px` viewport (khớp `max-h-[90dvh]` trong `.nexora-modal-card`), `isOverflowingViewport: false` — modal không bị tràn/cắt trên mobile, toàn bộ section (Services/Tip/Payment Method/Payment Summary/Charge button) đều render đầy đủ trong accessibility tree ✅

**Chưa test được trong phiên này:** luồng lỗi 400 (`TICKET_NOT_READY`/`TICKET_ALREADY_PAID` — cần bấm Charge 2 lần gần như đồng thời hoặc gọi trực tiếp API để trigger), test với tài khoản Staff không có quyền `Operations` (403), gửi receipt SMS thật (không có `ReceiptPhone` hợp lệ để test Twilio), và trường hợp `SalesTaxRatePercent` có cấu hình > 0 (business test hiện tại chưa set).

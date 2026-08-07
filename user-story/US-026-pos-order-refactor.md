# US-026 · POS Front Desk — Refactor Ticket → Order: multi-staff service lines, product lines, tip split

> File: `US-026-pos-order-refactor.md` · 1 file = 1 story.

| | |
|---|---|
| **Trạng thái** | Integrated |
| **Ngày tạo** | 2026-07-21 |
| **Epic / Domain** | POS Merchant Ops — Front Desk (Check-in queue / Turn Board / Checkout) |
| **OpenSpec change** | `—` (≥3 file nhưng tái sử dụng 100% pattern data-boundary + modal đã có từ US-023/024/025 — cùng lý do bỏ qua ceremony đã ghi ở các story đó) |
| **Test plan** | — (điền khi viết test) |

## Story

**Là** Lễ tân/Quản lý ca (Staff có quyền `Operations`) hoặc Chủ salon (Owner),
**tôi muốn** một order có thể chứa nhiều service + product, mỗi service được gán riêng cho 1 thợ, và tip được chia theo % doanh thu từng thợ,
**để** phản ánh đúng thực tế vận hành salon (1 khách có thể được nhiều thợ phục vụ, có mua thêm sản phẩm) thay vì mô hình cũ chỉ 1 thợ chính/ticket, không có sản phẩm.

Nguồn: backend repo `vlink-nexora`, refactor cùng session 2026-07-21 (đổi tên `PosTicket` → `PosOrder` xuyên suốt entity/DB/API).

**Quyết định thiết kế đã chốt (session brainstorm):**
- Đổi tên toàn bộ khái niệm `Ticket` → `Order` (entity, bảng DB, route, DTO) — không phải chỉ đổi tên hiển thị.
- State machine rút gọn còn đúng 4 trạng thái: `Waiting` → `InService` → `Completed`, cộng `Cancelled` (bỏ `Ready`/`Paid`/`Synced` cũ). `Cancelled` cho phép từ cả `Waiting` lẫn `InService`.
- Gán thợ giờ ở **cấp service line**, không phải cấp order — 1 order có thể có nhiều thợ (mỗi thợ 1 service), và cùng 1 thợ có thể nhận nhiều service trong cùng 1 order.
- Chuyển `Waiting → InService` là hành động **thủ công riêng** (`start-service`) của quản lý/thu ngân, không tự động khi gán thợ — nhưng bắt buộc phải có ít nhất 1 service line đã gán thợ trước khi bấm.
- Thợ được giải phóng ngay khi **service line của chính họ** được đánh dấu xong (`MarkServiceLineDone`), không cần chờ cả order `Completed` — hành động này thợ hoặc quản lý/thu ngân đều bấm được.
- Thanh toán (`Complete`) yêu cầu **tất cả** service line đã có thợ; chuyển thẳng `InService → Completed` (không qua `Ready` như cũ).
- Product line mới: thêm qua action riêng sau check-in (không chọn sẵn lúc check-in), không có thợ, không tham gia chia tip, vẫn tính vào Sales Tax như service.
- Tip: mặc định chia theo % doanh thu service của từng thợ trên order, thu ngân có thể sửa tay từng phần trước khi Complete (`tip-split`).

## Acceptance Criteria

- **Given** Owner/Staff mở tab Check-in queue, bấm Check-in cho khách mới (không cần chọn thợ)
- **When** submit
- **Then** FE gọi `POST /orders`; order mới xuất hiện ở Waitlist với trạng thái `Waiting`

- **Given** đang ở Waitlist, bấm Assign 1 service line cho 1 thợ cụ thể (hoặc để trống cho auto-pick)
- **When** click
- **Then** FE gọi `POST /orders/{orderId}/services/{serviceLineId}/assign`; Turn Board hiện thợ đó đang bận với order này, nhưng order **vẫn ở `Waiting`** cho tới khi bấm Start Service

- **Given** order đã có ít nhất 1 service line được gán thợ
- **When** quản lý bấm "Start Service"
- **Then** FE gọi `POST /orders/{orderId}/start-service`; order chuyển `InService`; nếu chưa có service nào được gán, nút bị disable/báo lỗi `NO_STAFF_ASSIGNED_TO_START_SERVICE`

- **Given** thợ đã làm xong 1 service (order có thể còn service khác đang dở)
- **When** bấm "Mark Done" trên đúng service line đó (thợ hoặc quản lý đều bấm được)
- **Then** FE gọi `POST /orders/{orderId}/services/{serviceLineId}/complete`; Turn Board giải phóng thợ đó ngay (thợ khác trên cùng order không bị ảnh hưởng)

- **Given** đang mở Checkout modal cho 1 order `InService`
- **When** bấm "+ Add Product", chọn 1 sản phẩm
- **Then** FE gọi `POST /checkout/{orderId}/products`; dòng sản phẩm xuất hiện, `Products subtotal` cập nhật, KHÔNG có ô chọn thợ cho dòng này

- **Given** order có ≥2 thợ (mỗi thợ 1 service line), đã nhập tip tổng
- **When** modal load Payment Summary
- **Then** FE hiện % chia tip mặc định theo tỷ lệ doanh thu từng thợ (đọc từ `staffTipShares` do `GetOrderDetail` trả về); thu ngân sửa tay số tiền từng thợ → FE gọi `PUT /checkout/{orderId}/tip-split` khi tổng các phần khớp đúng tip tổng

- **Given** không phải tất cả service line đã có thợ
- **When** bấm Complete
- **Then** BE trả lỗi `NOT_ALL_SERVICE_LINES_ASSIGNED`; FE hiện toast lỗi, modal không đóng

- **Given** đã đủ điều kiện, bấm Complete
- **When** click
- **Then** FE gọi `POST /checkout/{orderId}/complete`; `200` → đóng modal, invalidate Waitlist/TurnBoard/InService-orders/OrderDetail; tất cả thợ của order được giải phóng

## API Mapping (bắt buộc trước khi integrate)

> Contract build cùng session ở backend repo (`vlink-nexora`) — chưa deploy, tag (L-local). Route base đổi từ `.../tickets` → `.../orders`; `.../checkout/ready` → `.../checkout/in-service`.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| POST | `/api/v1/merchant/pos/{businessId}/orders` | Bearer | `{ customerName, customerEmail?, customerPhone?, posServiceIds? }` | `201 Guid` | L-local |
| POST | `/api/v1/merchant/pos/{businessId}/orders/{orderId}/cancel` | Bearer | — | `200 boolean` | L-local |
| GET | `/api/v1/merchant/pos/{businessId}/orders/waitlist` | Bearer | — | `200 [{ id, orderNumber, customerName, checkedInAt, waitMinutes, serviceNames[] }]` | L-local |
| POST | `/api/v1/merchant/pos/{businessId}/orders/{orderId}/services/{serviceLineId}/assign` | Bearer | `{ posStaffProfileId? }` | `200 boolean` | L-local |
| POST | `/api/v1/merchant/pos/{businessId}/orders/{orderId}/start-service` | Bearer | — | `200 boolean` | L-local |
| POST | `/api/v1/merchant/pos/{businessId}/orders/{orderId}/services/{serviceLineId}/complete` | Bearer | — | `200 boolean` | L-local |
| GET | `/api/v1/merchant/pos/{businessId}/turn-board` | Bearer | — | `200 [{ posStaffProfileId, displayName, photoUrl?, currentStatus, currentOrderId?, currentCustomerName?, currentPrimaryServiceName?, assignedAt? }]` | L-local |
| PUT | `/api/v1/merchant/pos/{businessId}/turn-board/{posStaffProfileId}/break-status` | Bearer | `{ isBreak }` | `200 boolean` | L-local |
| GET | `/api/v1/merchant/pos/{businessId}/checkout/in-service` | Bearer | — | `200 [{ id, orderNumber, customerName, technicianNames[], serviceNames[], firstAssignedAt? }]` | L-local |
| GET | `/api/v1/merchant/pos/{businessId}/checkout/{orderId}` | Bearer | — | `200 { id, orderNumber, customerName, customerEmail?, customerPhone?, status, serviceLines[{id,serviceName,unitPrice,quantity,lineTotal,assignedPosStaffProfileId?,technicianName?,completedAt?}], productLines[{id,productName,unitPrice,quantity,lineTotal}], servicesSubtotal, productsSubtotal, tipAmount, discountAmount, salesTaxAmount, total, staffTipShares[{posStaffProfileId,technicianName,tipAmount}], paymentMethodType?, receiptEmail?, receiptPhone?, completedAt? }` | L-local |
| GET | `/api/v1/merchant/pos/{businessId}/checkout/services` | Bearer | — | `200 [{ id, name, price }]` | L-local (không đổi từ US-025) |
| GET | `/api/v1/merchant/pos/{businessId}/checkout/products` | Bearer | — | `200 [{ id, name, price }]` (mới) | L-local |
| POST | `/api/v1/merchant/pos/{businessId}/checkout/{orderId}/services` | Bearer | `{ posServiceId, quantity? }` | `201 Guid` | L-local |
| DELETE | `/api/v1/merchant/pos/{businessId}/checkout/{orderId}/services/{serviceLineId}` | Bearer | — | `200 boolean` (mới) | L-local |
| POST | `/api/v1/merchant/pos/{businessId}/checkout/{orderId}/products` | Bearer | `{ posProductId, quantity? }` | `201 Guid` (mới) | L-local |
| DELETE | `/api/v1/merchant/pos/{businessId}/checkout/{orderId}/products/{productLineId}` | Bearer | — | `200 boolean` (mới) | L-local |
| PUT | `/api/v1/merchant/pos/{businessId}/checkout/{orderId}/tip` | Bearer | `{ tipAmount }` | `200 boolean` | L-local |
| PUT | `/api/v1/merchant/pos/{businessId}/checkout/{orderId}/tip-split` | Bearer | `{ shares: [{ posStaffProfileId, tipAmount }] }` | `200 boolean` (mới) | L-local |
| POST | `/api/v1/merchant/pos/{businessId}/checkout/{orderId}/complete` | Bearer | `{ paymentMethodType, receiptEmail?, receiptPhone? }` | `200 { orderId, servicesSubtotal, productsSubtotal, tipAmount, discountAmount, salesTaxAmount, totalAmount, status, completedAt }` | L-local |

**Còn lại cần xác nhận khi integrate:** re-verify qua live Swagger sau khi BE deploy. `status` giờ chỉ còn 4 giá trị (`Waiting`/`InService`/`Completed`/`Cancelled`). `markTicketReady`/`chargeTicket`/`ready`-list cũ đã bị xoá hoàn toàn khỏi contract — không còn tồn tại.

## FE Surface (các layer sẽ đụng)

| Layer | File | Thay đổi |
|---|---|---|
| Types | `src/types/repositories.ts` | Đổi tên toàn bộ `*Ticket*ApiDto` → `*Order*ApiDto`, `ticketId`→`orderId`, `ticketNumber`→`orderNumber`. Mới: `OrderServiceLineApiDto` (thêm `assignedPosStaffProfileId?`, `technicianName?`, `completedAt?`), `OrderProductLineApiDto`, `OrderStaffTipShareApiDto`, `CheckoutProductCatalogItemApiDto`, `AddOrderProductLinePayload`, `SetOrderStaffTipSplitPayload` |
| Repository | `src/data/repositories/posTickets.ts` → `posOrders.ts` (rename file) | Method tương ứng route mới: `checkInOrder`, `cancelOrder`, `getWaitlist`, `assignStaffToServiceLine`, `startOrderService`, `markServiceLineDone` |
| Repository | `src/data/repositories/posCheckout.ts` | Rename `getReadyTickets`→`getInServiceOrders`, `getTicketDetail`→`getOrderDetail`, `addTicketServiceLine`→`addOrderServiceLine`, `markTicketReady` xoá hẳn, `chargeTicket`→`completeOrder`. Mới: `removeOrderServiceLine`, `getProductCatalog`, `addOrderProductLine`, `removeOrderProductLine`, `setOrderStaffTipSplit` |
| Repository | `src/data/repositories/posTurnBoard.ts` | Field đổi tên trong response mapping: `currentTicketId`→`currentOrderId` |
| Data hook | `src/data/hooks/usePosTickets.ts` → `usePosOrders.ts` (rename file) | Hook theo repository mới, invalidation giữ nguyên pattern cũ |
| Data hook | `src/data/hooks/usePosCheckout.ts` | Thêm hook cho product line, remove line, tip split; bỏ `useMarkTicketReady` |
| Query keys | `src/data/queryKeys.ts` | Đổi tên `merchantPosReadyTickets`→`merchantPosInServiceOrders`, `merchantPosTicketDetail`→`merchantPosOrderDetail`; thêm `merchantPosCheckoutProductCatalog` |
| Component | `src/components/dashboard/views/pos/PosFrontDeskView.tsx` | Waitlist/Turn Board dùng field mới; nút Assign giờ theo từng service line; thêm nút "Start Service" riêng ở thẻ trạm |
| Component | `src/components/dashboard/views/pos/modals/PosCheckoutModal.tsx` | Thêm bảng "+ Add Product", cột thợ theo từng service line + nút xoá dòng, khối "Tip Split" hiển thị % theo thợ + cho sửa tay, đổi `Charge`→`Complete` gọi `completeOrder` |
| i18n | `src/locales/en.json`, `src/locales/vi.json` | Thêm key cho Product line/Tip split/Start Service/Mark Done; đổi label liên quan "Ticket"→"Order" nếu hiển thị trực tiếp cho user |

## Definition of Done

- [x] `pnpm typecheck` không phát sinh lỗi mới trong các file bị đổi (61 lỗi tổng, trùng khớp baseline US-025, không có lỗi nào trong file POS)
- [x] `pnpm build` thành công (chỉ warning chunk-size sẵn có, không liên quan)
- [ ] AC pass trên môi trường dev (API thật — cần backend deploy trước)
- [ ] Test theo 3 layer (skill feature-focused-tester) trên browser thật
- [ ] Modal test ở viewport 375×667 (mobile) theo mục "Mobile-Responsive Modals & Dialogs" của CLAUDE.md
- [ ] Cập nhật trạng thái file này + link TC

## Ghi chú phiên thực thi

- Backend + FE được refactor trong cùng 1 phiên làm việc (2026-07-21), chưa deploy lên `test-api.nexoratouch.com` — chưa verify qua live Swagger, chưa test click-through thật trên browser. Rủi ro còn lại: field naming có thể lệch nhẹ so với contract thật một khi BE deploy (đặc biệt `staffTipShares`/`technicianNames` — cần re-check qua Swagger trước khi coi US này là `Tested`).

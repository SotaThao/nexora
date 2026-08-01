# UI/UX Feedback — POS Order List & Order Detail (iPad)

Khu vực: `src/components/dashboard/views/pos/PosFrontDeskView.tsx` (tab "Order List") và `src/components/dashboard/views/pos/PosOrderWorkspace.tsx` (Order Detail — panel bên phải khi sửa order có sẵn)
Ngày review: 2026-08-01
Mockup tham khảo: https://claude.ai/code/artifact/74e3fd66-f16c-442e-b9ac-0ad8b481279b (Order List + Order Detail dựng ở kích thước thật iPad 1194×834pt, có sidebar/header chrome thật)

Mục tiêu tài liệu: liệt kê các vấn đề UI/UX phát hiện được khi rà lại 2 màn Order List và Order Detail trong quá trình chuẩn hóa thiết kế iPad cho POS, kèm đề xuất chỉnh sửa để AI agent triển khai. Đây là tài liệu sống — bổ sung dần khi phát hiện thêm vấn đề mới ở 2 màn này hoặc các màn POS khác.

---

## 1. Container vẫn dùng token dashboard chung (`nexora-card`) thay vì token riêng của POS
**Vấn đề:** Cả 2 màn vẫn bọc nội dung bằng class `.nexora-card` thay vì một style riêng dựng từ token `posFd*` — nếu dashboard chính đổi style `.nexora-card` trong tương lai, Order List/Order Detail sẽ vô tình đổi theo dù không liên quan.
**Đề xuất:** Định nghĩa một class/style POS-riêng (vd `.pos-card`) từ `posFdSurface`/`posFdBorder`, dùng thay `.nexora-card` ở 2 màn này.

## 2. Label và text phụ lẫn giữa token `nexora*` và `posFd*`
**Vấn đề:** Tiêu đề panel ("Order Detail"), text phụ (service/technician, tổng tiền) đang dùng `text-nexoraMuted`/`text-nexoraText` thay vì `text-posFdMuted`/`text-posFdText` — lẫn lộn 2 hệ token trong cùng 1 màn đã gắn nhận diện `posFd`.
**Đề xuất:** Đổi toàn bộ `text-nexoraMuted`/`text-nexoraText` còn sót trong 2 màn này sang tương ứng `posFdMuted`/`posFdText`.

## 3. Nút nguy hiểm (Cancel, Delete) dùng màu đỏ trần, chưa có token riêng
**Vấn đề:** Nút Cancel (Order List) và nút Delete (Order Detail, cả dòng service lẫn dòng product) đang dùng thẳng `rose-300`/`rose-600` thay vì một token nhận diện POS.
**Đề xuất:** Thêm `posFdDanger`/`posFdDangerBg` vào `tailwind.config.js`, áp dụng cho cả 2 vị trí trên.

## 4. Chế độ list/bảng của Order List hoàn toàn chưa được style
**Vấn đề:** Khi chuyển sang view "List" (thay vì Card), Order List hiện ra là một `<table>` trơn, không có token `posFd` nào, nhìn như một app khác.
**Đề xuất:** Redesign thành các dòng (row) xếp chồng cùng ngôn ngữ thiết kế với card view — bo góc, tông màu posFd, giữ nguyên các cột dữ liệu hiện có.

## 5. Nút phụ (Start Service / Cancel khi tạo mới) chưa lên đúng token
**Vấn đề:** Nút "Start Service" (và nút "Cancel" ở chế độ tạo order mới) dùng `border-nexoraBorder`/`text-nexoraText` — là các nút phụ duy nhất trong Order Detail chưa theo đúng token.
**Đề xuất:** Đổi sang `border-posFdBorder`/`text-posFdText`.

## 6. Danh sách dài (order queue, line item order) đẩy cuộn cả trang thay vì cuộn tại chỗ
**Vấn đề:** Danh sách order trong Order List và danh sách line item trong Order Detail không có giới hạn chiều cao + scroll riêng — khi danh sách dài, toàn bộ trang phải cuộn, đẩy luôn cả tab/toolbar (Order List) hoặc Note/Tổng tiền/nút Checkout (Order Detail) ra khỏi màn hình.
**Đề xuất:** Bọc từng danh sách trong một khối `max-height` + `overflow-y: auto` riêng (đã thử trong mockup: 460px cho Order List, 250px cho Order Detail), để phần chrome xung quanh (tab/toolbar, hoặc Note/Tổng tiền/Checkout) luôn đứng yên, không bị cuộn mất. Lưu ý: catalog dịch vụ/sản phẩm bên trái (Services/Products picker trong Order Detail) **đã có sẵn** `max-h-[480px] overflow-y-auto` trong `CategoryGroupedCatalogPicker.tsx` — không cần sửa, chỉ cần đưa 2 danh sách còn lại lên cùng chuẩn.

## 7. Order Detail ở chế độ sửa order có sẵn không hiển thị CustomerHeaderBar
**Ghi chú (không phải bug, để tránh hiểu nhầm khi code):** Khi mở một order đã tồn tại (Update mode) để xem/sửa Order Detail, màn hình hiển thị tiêu đề "Order # — Tên khách" + nút Back — **không** hiển thị `CustomerHeaderBar` (component đó chỉ render khi đang Check-in tạo order mới). Tab bar vẫn hiển thị nhưng không tab nào được highlight trong lúc này.

## 8. Cột nội dung khá hẹp khi sidebar dashboard đang mở
**Vấn đề:** Với sidebar 288px mở, cột nội dung POS chỉ còn ~850px. Order Detail chia theo tỉ lệ 3:2 ra ~500px (catalog)/~326px (chi tiết) — pane chi tiết khá chật khi có nhiều dòng, stepper và 2 nút hành động.
**Đề xuất:** Không sửa ngay — cần test cảm nhận thật trên iPad trước khi quyết định. Thu gọn sidebar (đã có nút toggle) sẽ tăng lên ~620px/~400px, có thể coi là cách giảm chật mà không cần đổi layout.

---

## Ưu tiên xử lý
1. Bọc danh sách dài trong scroll riêng, không cuộn cả trang (#6) — ảnh hưởng trải nghiệm thao tác thật nhiều nhất trên iPad.
2. Thêm token `posFdDanger`/`posFdDangerBg` và áp dụng cho nút Cancel/Delete (#3).
3. Dọn token `nexora*` còn sót (#1, #2, #5).
4. Redesign list/bảng của Order List (#4).

Mục #7 chỉ là ghi chú kiến trúc, mục #8 cần test thiết bị thật trước khi quyết định có sửa hay không.

---

## Đã áp dụng vào code (2026-08-01)
- Mục #1–#6: Done cho Order List + Order Detail (`PosFrontDeskView.tsx`, `PosOrderWorkspace.tsx`, thêm `posFdDanger`/`posFdDangerBg` vào `tailwind.config.js`).
- Áp dụng tiếp cùng chuẩn cho **Turn Board tab** (`renderStationCard`, `renderServiceSelect` trong `PosFrontDeskView.tsx`) và **Completed tab** (`PosCompletedOrdersPanel.tsx` — toàn bộ filter form + bảng + pagination, kể cả bọc `max-h-[560px] overflow-auto` cho bảng để pagination footer luôn hiển thị).
- **Chưa đụng tới Booking tab** (`booking/*.tsx`) — đây là bộ component lớn hơn, dùng chung với modal đặt lịch không gian hẹp (đã note riêng trong `CLAUDE.md`), cần một phiên riêng nếu muốn làm.
- `pnpm lint` + `pnpm build` đều pass sau khi sửa.

## Bổ sung: View Detail cho Completed Orders (2026-08-01)
**Vấn đề:** Tab Completed trước đó chỉ hiện bảng liệt kê, không xem được chi tiết 1 order đã hoàn tất (dịch vụ, sản phẩm, breakdown giá, thanh toán...).
**Đã làm:** Thêm cột "Actions" + nút "View" vào bảng `PosCompletedOrdersPanel.tsx`, mở modal chi tiết — cùng pattern với "View Detail" của Booking (`BookingTab.tsx`: state `viewDetailTargetId` + hook fetch riêng + modal `nexora-modal-card`), nhưng dùng `useOrderDetail(businessId, orderId)` (API đã có sẵn, cùng hook mà `PosOrderWorkspace` dùng) thay vì `useBookingDetail`. Modal hiển thị: khách hàng/SĐT/email, mã order, thời gian hoàn tất, phương thức thanh toán, danh sách dịch vụ (kỹ thuật viên + giá + note), danh sách sản phẩm (SL + đơn giá + thành tiền), và breakdown tổng (dịch vụ/sản phẩm/giảm giá/thuế/tip/tổng cộng). Đã thêm đủ locale key song ngữ (`en.json`/`vi.json`), verify key parity bằng script.

## Bổ sung: giảm page size xuống 10 (2026-08-01)
Rà lại toàn bộ `pos/` — chỉ `PosCompletedOrdersPanel.tsx` có UI phân trang thật (page number + previous/next); Booking và Staff Profiles chỉ fetch `pageSize: 200` một lần, không có control phân trang. Đổi `PAGE_SIZE` từ 20 xuống 10 trong `PosCompletedOrdersPanel.tsx` để mỗi trang không quá dài trên iPad.

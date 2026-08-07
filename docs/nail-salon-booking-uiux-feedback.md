# UI/UX Feedback — Nail Salon Online Booking Page

Trang: http://localhost:3000/booking/quanatm-fdc8a7be-bdbbe98a
Ngày review: 2026-08-01
Ngày đối chiếu code + chốt nội dung: 2026-08-01

Mục tiêu tài liệu: liệt kê các vấn đề UI/UX phát hiện được khi kiểm thử luồng đặt lịch (chọn dịch vụ -> chọn kỹ thuật viên -> chọn ngày giờ -> nhập thông tin khách -> xác nhận), kèm đề xuất chỉnh sửa để AI agent triển khai.

## Ghi chú kỹ thuật quan trọng (đã đối chiếu code trước khi lên ticket)

- **Component thật của trang này**: `src/components/public/PublicBookingPage.tsx` (route `/booking/:businessSlug`), cùng `DateTimeStep.tsx`, `ConfirmationScreen.tsx` (`src/components/booking-public/`).
- **Có 2 luồng booking công khai song song trong repo**: luồng đang review (`/booking/:businessSlug`, sản phẩm POS-Booking) và một luồng khác không liên quan (`/b/:businessKey`, sản phẩm lead qua voice/SMS, code tại `src/components/public/booking/`). Luồng thứ hai **đã giải quyết sẵn** phần lớn logic cho #1 (search + category), #6 (format giờ 12h), #8 (validate phone chuẩn E.164), #9 (per-field error + scroll-to-error) — nhưng bằng code riêng, chưa dùng chung.
- **Quyết định đã chốt**: extract các utility thuần logic (format giờ, validate phone, resolve field error...) từ luồng `/b/:businessKey` ra module dùng chung, rồi cả 2 luồng cùng import — không viết lại từ đầu, không copy-paste duplicate lần 3.
- **#10 (xác nhận qua email/SMS)**: đã chốt gộp thành 1 ticket full-stack (BE tạo endpoint/trigger gửi email/SMS khi tạo booking + FE hiển thị trạng thái đã gửi), không tách nhỏ.
- **#12 (logo không liên quan)**: đã xác minh không phải lỗi code — `PublicBookingShell` chỉ render đúng `logoUrl` từ API, không có placeholder cứng trong FE. Loại khỏi danh sách ticket engineering; xử lý như vấn đề content/data (merchant test cần upload logo thật qua Settings, hoặc BE kiểm tra seed data cho business này).

---

## 1. Danh sách dịch vụ quá dài, không phân nhóm/tìm kiếm
**Vấn đề:** Khoảng 50 dịch vụ hiển thị trong một danh sách phẳng duy nhất (manicure, pedicure, wax, đồ uống...), khách phải cuộn rất nhiều để tìm dịch vụ cần đặt.
**Đề xuất:** Nhóm dịch vụ theo danh mục (Manicure, Pedicure, Nail Extensions, Waxing, Add-ons, Beverages...) bằng accordion hoặc tab phụ. Thêm ô tìm kiếm/lọc theo tên dịch vụ ở đầu danh sách.
**Ghi chú kỹ thuật:** `PublicBookingServiceApiDto` hiện **chưa có field category** → cần thêm field ở backend trước khi nhóm được ở FE. Có sẵn component `CategoryGroupedCatalogPicker` (POS) làm đúng pattern search + chip category + sticky header, nhưng yêu cầu `categories[]` per item — cân nhắc tái sử dụng UI này thay vì viết mới. Luồng `/b/:businessKey` cũng đã có search + group tương tự, có thể tham khảo/extract logic chung.

## 2. Tab "By Technician" là dead-end, không thao tác được
**Vấn đề:** Bấm vào tên kỹ thuật viên chỉ hiện ra một khối text liệt kê dịch vụ họ làm được (dạng text thuần), không có nút "Add to booking" nào ở đây — khách vẫn phải quay lại tab "By Service" để đặt.
**Đề xuất:** Mỗi dịch vụ trong danh sách của kỹ thuật viên cần có nút "+ Add to booking" như tab "By Service". Khi thêm từ đây, tự động gán kỹ thuật viên đó vào lựa chọn.
**Ghi chú kỹ thuật:** Không cần đổi backend — `technician.serviceIds` và helper `techniciansForService`/`servicesForTechnician` đã có sẵn. Chỉ cần thêm nút + mở rộng `toggleService` để nhận kèm `technicianId` rồi gọi `setLineTechnician`. Ticket nhỏ.

## 3. Không có tóm tắt đơn hàng (order summary) xuyên suốt
**Vấn đề:** Phần "Your Selection" (dịch vụ đã chọn + giá) chỉ xuất hiện ở cuối trang chọn dịch vụ, biến mất ở các bước sau (chọn ngày giờ, nhập thông tin). Khách không thấy được đang đặt gì, tổng tiền bao nhiêu.
**Đề xuất:** Thêm panel tóm tắt cố định (sticky sidebar hoặc sticky bottom bar) hiển thị dịch vụ đã chọn, tổng giá, tổng thời lượng — xuyên suốt tất cả các bước.

## 4. Thiếu thanh tiến trình (progress indicator)
**Vấn đề:** Luồng có nhiều bước nhưng không có step indicator/breadcrumb, khách không biết còn bao nhiêu bước.
**Đề xuất:** Thêm step indicator dạng "Bước 2/4: Chọn ngày giờ" ở đầu mỗi trang.

## 5. Không có giỏ hàng nổi (floating cart) khi cuộn danh sách dài
**Vấn đề:** Sau khi thêm dịch vụ, nút xem lại lựa chọn/Continue nằm cuối trang sau ~50 item.
**Đề xuất:** Thêm nút/badge nổi hiển thị số lượng dịch vụ đã chọn + tổng giá, bấm để nhảy tới phần tóm tắt, luôn hiển thị khi giỏ có ít nhất 1 item.

## 6. Định dạng giờ 24h khó đọc với khách hàng phổ thông
**Vấn đề:** Khung giờ hiển thị dạng "09:00", "17:00" thay vì định dạng 12 giờ quen thuộc với khách Mỹ.
**Đề xuất:** Đổi sang định dạng "9:00 AM", "5:00 PM".
**Ghi chú kỹ thuật:** Logic convert giờ 12h đã bị viết trùng lặp 3 lần trong repo (`bookingUtils.js`, `ConfirmationScreen.tsx`, `bookingFormatters.ts`). Extract 1 helper dùng chung thay vì viết bản thứ 4.

## 7. Trạng thái focus và trạng thái "đã chọn" của khung giờ giống hệt nhau
**Vấn đề:** Sau khi nhập ngày, ô giờ đầu tiên tự động có viền tím đậm giống hệt style khi user click chọn — dễ gây hiểu nhầm là hệ thống đã tự chọn giờ.
**Đề xuất:** Style khác biệt rõ ràng: focus = viền mờ/xám; đã chọn = nền tím đậm + dấu check.
**Ghi chú kỹ thuật:** Root cause là 1 rule CSS **global** trong `index.css` (áp dụng `box-shadow` màu brand cho mọi `:focus-visible` toàn app). Không sửa rule dùng chung này — phải thêm class loại trừ scoped riêng cho trang booking, theo đúng pattern `public-booking-active` mà luồng `/b/:businessKey` đã dùng.

## 8. Không validate định dạng số điện thoại
**Vấn đề:** Nhập "abc123" vào ô Phone Number (dù placeholder gợi ý "XXX-XXX-XXXX") vẫn được chấp nhận và đặt lịch thành công.
**Đề xuất:** Validate định dạng số điện thoại thực sự (input mask/regex), báo lỗi rõ ràng, chặn submit khi không hợp lệ.
**Ghi chú kỹ thuật:** Repro "abc123" không đúng thật (input đã tự strip ký tự không phải số mỗi keystroke), nhưng bug thật vẫn tồn tại: submit chỉ check rỗng/không rỗng, số chưa đủ ký tự vẫn qua được. Đã có sẵn `isValidPhoneE164` (dùng chuẩn `libphonenumber`, đã áp dụng ở luồng `/b/:businessKey`) — tái sử dụng, không viết validator mới.

## 9. Thông báo lỗi validate chung chung, không chỉ rõ field sai
**Vấn đề:** Khi bỏ trống form và bấm Confirm, chỉ hiện một dòng chữ đỏ chung ở cuối form, input không đổi viền đỏ, không tự scroll/focus vào ô thiếu.
**Đề xuất:** Viền đỏ + thông báo lỗi riêng ngay dưới từng ô input bị thiếu/sai.
**Ghi chú kỹ thuật:** Luồng `/b/:businessKey` đã có sẵn pattern đúng ý này (`resolveBookingFieldErrors` + `scrollToFirstError`, per-field `role="alert"`) — extract dùng chung thay vì viết mới từ đầu.

## 10. Rủi ro mất quyền truy cập vào lịch hẹn đã đặt
**Vấn đề:** Sau khi xác nhận, chỉ có MỘT link quản lý đặt lịch hiển thị một lần trên trang; nếu khách đóng tab hoặc nhập sai liên hệ (lỗi #8) thì mất hoàn toàn quyền hủy/đổi lịch.
**Đề xuất:** Bắt buộc gửi email hoặc SMS xác nhận kèm link quản lý ngay khi đặt thành công; bắt buộc ít nhất một kênh liên hệ (điện thoại hoặc email) phải hợp lệ.
**Ghi chú kỹ thuật:** Đây KHÔNG phải việc thuần FE — hiện chưa có endpoint/trigger nào ở backend gửi email/SMS khi tạo booking. Đã chốt: làm 1 ticket full-stack (BE thêm trigger gửi + FE hiển thị trạng thái đã gửi/bắt buộc ít nhất 1 kênh liên hệ hợp lệ), không tách nhỏ, không hoãn.

## 11. Tóm tắt xác nhận cuối cùng thiếu thông tin quan trọng
**Vấn đề:** Trang "Booking Confirmed" chỉ hiện tên dịch vụ + ngày giờ, thiếu giá tiền/tổng tiền, kỹ thuật viên đã chọn, địa chỉ/SĐT salon.
**Đề xuất:** Bổ sung đầy đủ các trường trên vào appointment summary.
**Ghi chú kỹ thuật:** Tách 2 phần khác độ khó: (a) giá + tên technician — data đã có sẵn ở FE (`selectedLines` có `unitPrice`/`posStaffProfileId`), chỉ là thiếu truyền prop vào `ConfirmationScreen`, ticket nhỏ; (b) địa chỉ/SĐT salon — API `/api/v1/booking/{slug}` hiện chưa trả field này (dù backend có model ở chỗ khác), cần thêm vào DTO — phụ thuộc backend.

## 12. Logo/avatar không liên quan thương hiệu nail salon
**Vấn đề:** Ảnh đại diện hiện tại có vẻ là ảnh test/placeholder, không liên quan đến dịch vụ nail.
**Đề xuất:** Thay bằng logo chính thức của salon trước khi lên production.
**Ghi chú kỹ thuật:** Đã xác minh KHÔNG phải lỗi code (`PublicBookingShell` chỉ render đúng `logoUrl` trả về từ API, không có placeholder cứng trong FE). Đã chốt: loại khỏi danh sách ticket engineering, xử lý như vấn đề content/data (merchant cần upload logo thật qua Settings, hoặc BE kiểm tra lại seed data cho business test này).

---

## Ưu tiên xử lý (đã chốt sau khi đối chiếu code)
1. Validate số điện thoại + đảm bảo khách không mất quyền truy cập lịch hẹn (#8, #10 — #10 là ticket full-stack)
2. Sửa tab "By Technician" bị dead-end (#2)
3. Thêm tóm tắt đơn hàng cố định xuyên suốt các bước (#3)
4. Phân nhóm lại danh sách dịch vụ quá dài (#1 — phụ thuộc thêm field category ở backend)

Các mục còn lại (#4, #5, #6, #7, #9, #11) là cải thiện trải nghiệm, mức độ ưu tiên thấp hơn.

**#12 đã loại khỏi backlog engineering** (xem ghi chú kỹ thuật ở trên) — xử lý riêng như vấn đề content/data, không lên ticket dev.

**Quyết định kiến trúc chung cho toàn bộ đợt sửa:** trước khi code từng ticket, extract các utility thuần logic đang bị trùng lặp hoặc đã có sẵn ở luồng `/b/:businessKey` (format giờ 12h, validate phone E.164, resolve field error + scroll-to-error, search/group logic) ra module dùng chung, rồi luồng `/booking/:businessSlug` import lại — không viết mới trùng lặp.

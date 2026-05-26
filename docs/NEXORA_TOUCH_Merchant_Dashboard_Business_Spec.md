# TÀI LIỆU ĐẶC TẢ NGHIỆP VỤ (BUSINESS SPECIFICATION)
## Phân Hệ: Merchant Onboarding & Owner Dashboard (Nexora Touch)

Tài liệu này tổng hợp toàn bộ các yêu cầu nghiệp vụ (Business Requirements) của phân hệ dành cho **Merchant (Chủ cửa hàng)** thuộc dự án **Nexora Touch by VLinkPay**. Tài liệu phục vụ mục đích chuyển giao cho đội ngũ Phát triển (Developer) và Kiểm thử (QC) để triển khai giao diện và kiểm thử luồng nghiệp vụ.

---

## 1. Tổng Quan Sản Phẩm & Định Vị Nghiệp Vụ
**Nexora Touch** là giải pháp Smart Tip & Review thế hệ mới, hỗ trợ Merchant (nail salons, hair salons, spas, cafes, quán ăn...) gia tăng điểm đánh giá trên Google/Yelp và nhận tiền tip trực tiếp cho nhân viên thông qua QR Code (mặc định) và chạm NFC (nâng cấp).

### Cơ chế cốt lõi:
1. **Thanh toán Tiền Tip trực tiếp (Redirect Payment):** Tiền tip của khách hàng chuyển thẳng tới tài khoản cá nhân của từng thợ (Venmo, Cash App, Zelle, VLinkPay) để tối ưu chi phí quẹt thẻ cho chủ tiệm và bảo đảm thu nhập 100% cho thợ.
2. **Lọc đánh giá thông minh (Review Routing):**
   - Đánh giá từ **4–5 sao** $\rightarrow$ Hệ thống chuyển hướng khách sang viết review công khai trên trang Google/Yelp thật của tiệm để đẩy mạnh SEO.
   - Đánh giá từ **1–3 sao** $\rightarrow$ Hệ thống hiển thị Form góp ý nội bộ để ghi nhận phản hồi kín gửi cho Chủ tiệm xử lý, tránh ảnh hưởng xấu tới uy tín tiệm.

---

## 2. Xác Thực Người Dùng (Authentication)
- **Cơ chế đăng nhập:** Chủ tiệm (Merchant Owner) sử dụng hệ thống đăng nhập tập trung và lấy thông tin tài khoản thông qua cơ chế **Single Sign-On (SSO) của VLinkPay**.
- **Đồng bộ thông tin:** Khi đăng nhập thành công lần đầu, hệ thống tự động đồng bộ các thông tin cơ bản từ VLinkPay SSO để tạo hồ sơ Merchant trên Nexora Touch.

---

## 3. Trình Thiết Lập Cửa Hàng (Merchant Setup Wizard - 5 Bước)
Khi Merchant sử dụng hệ thống lần đầu tiên, họ bắt buộc phải hoàn thành quy trình Onboarding gồm 5 bước với chỉ báo tiến trình (Progress Bar) trực quan:

### Bước 1: Thông tin Cửa hàng (Business Info)
- **Tên cửa hàng (Business Name):** Bắt buộc.
- **Loại hình dịch vụ (Industry):** Lựa chọn từ danh sách (Nail Salon, Restaurant, Cafe, Spa, Bar, Hotel, Event Team, Khác).
- **Địa chỉ (Address):** Bắt buộc.
- **Số điện thoại (Phone):** Bắt buộc.
- **Website:** Tùy chọn.
- **Múi giờ (Timezone):** Chọn múi giờ hoạt động.
- **Ảnh Logo tiệm:** Tùy chọn (tải lên file ảnh).

### Bước 2: Liên kết Đánh giá (Review Links)
- **Link Google Review:** Bắt buộc (URL dẫn tới trang đánh giá Google Maps).
- **Link Yelp Review:** Bắt buộc (URL dẫn tới trang đánh giá Yelp).
- **Link Facebook Review:** Tùy chọn.
- **Email nhận góp ý nội bộ:** Bắt buộc (Email của chủ tiệm dùng để nhận các feedback 1–3 sao).

### Bước 3: Thiết lập Nhân viên (Add Staff)
- Cho phép chủ tiệm thêm danh sách thợ ban đầu.
- Thông tin mỗi Staff cần nhập:
  - **Họ tên đầy đủ (Full Name):** Dùng cho quản lý nội bộ.
  - **Tên hiển thị (Nickname):** Bắt buộc, được ưu tiên hiển thị trên hồ sơ (Profile) công khai của thợ để khách nhìn thấy.
  - **Ảnh đại diện (Avatar):** Tùy chọn (nếu trống sẽ dùng Avatar mặc định chứa chữ cái đầu của tên).
  - **Chức vụ (Position):** Ví dụ: Nail Tech, Server, Stylist...
  - **Tài khoản nhận tiền cá nhân:** Venmo, Cash App, Zelle, VLinkPay. 
    *   *Ràng buộc nghiệp vụ:* Chủ tiệm bắt buộc phải điền tối thiểu **1 phương thức nhận tiền** hoạt động cho mỗi thợ.

### Bước 4: Thiết lập Điểm Chạm (Create Touch Points)
- Chủ tiệm thiết lập các điểm đặt mã QR/NFC tại quán.
- Các loại Touch Point hỗ trợ:
  - **Business Main:** Trang chung của tiệm (khách quét sẽ thấy danh sách thợ của tiệm để chọn).
  - **Table QR:** Điểm đặt tại bàn (ví dụ: Table 01, Table 02...).
  - **Front Desk:** Điểm đặt tại quầy thu ngân.
  - **Staff QR:** Mã QR riêng của từng thợ (quét vào sẽ dẫn thẳng đến luồng tip của thợ đó, bỏ qua bước chọn thợ).
  - **Receipt QR:** Mã QR in dưới hóa đơn thanh toán.

### Bước 5: Tải về Thiết kế (Download QR)
- Hệ thống tổng hợp tất cả các mã QR của các Touch Point đã tạo ở Bước 4.
- Cho phép chủ tiệm tải xuống file thiết kế in ấn (PDF/PNG) chuẩn kích thước để làm đế mica đặt bàn hoặc in dán tại quầy.

---

## 4. Bảng Điều Khiển Của Chủ Tiệm (Owner Dashboard)

Khi hoàn thành Onboarding, giao diện Dashboard chính của chủ tiệm sẽ bao gồm các trang sau:

### 4.1. Trang Tổng Quan (Dashboard Overview)
Màn hình trang chủ hiển thị ngay sau khi chủ tiệm đăng nhập, chứa các Widget báo cáo nhanh:
- **Bộ lọc thời gian:** Lọc số liệu theo ngày/tuần/tháng hoặc khoảng thời gian tùy chọn.
- **Thẻ chỉ số chính (Metrics Cards):**
  - **Tổng tiền tip (Total Tips):** Số tiền tip khách đã xác nhận gửi cho thợ (kèm % tăng trưởng so với kỳ trước).
  - **Lượt giao dịch (Transactions):** Tổng số lần khách thực hiện tip thành công.
  - **Tiền tip trung bình (Average Tip):** Số tiền tip trung bình trên một giao dịch.
  - **Tổng số reviews (Total Reviews):** Số lượt đánh giá khách hàng đã gửi.
- **Biểu đồ trực quan:**
  - **Tips Over Time (Biểu đồ xu hướng):** Dạng biểu đồ đường (Line Chart) biểu diễn biến động tiền tip theo các ngày trong tuần/tháng.
  - **Tips by Staff (Cơ cấu tiền tip):** Dạng biểu đồ tròn (Donut Chart) thể hiện tỷ lệ phần trăm đóng góp và tổng số tiền tip nhận được của từng thợ.
- **Thẻ điểm đánh giá bên thứ ba:**
  - Điểm rating trung bình và số lượng review hiện tại của tiệm trên **Google Reviews** (ví dụ: 4.8★) và **Yelp Reviews** (ví dụ: 4.5★).
  - Tỷ lệ phản hồi (Response Rate) và tỷ lệ khách quay lại (Returning Customers).

### 4.2. Quản Lý Nhân Viên (Staff Menu)
Trang quản trị danh sách thợ trong tiệm:
- **Danh sách nhân viên:** Hiển thị dạng bảng (hoặc lưới card) gồm Ảnh, Nickname, Chức vụ, Các tài khoản nhận tiền đã liên kết, và trạng thái hoạt động.
- **Hành động:**
  - **Thêm thợ mới:** Mở form nhập thông tin thợ (bắt buộc nhập ít nhất 1 tài khoản nhận tiền).
  - **Sửa thông tin thợ:** Cập nhật thông tin cá nhân và tài khoản ví nhận tiền.
  - **Bật/Tắt trạng thái hoạt động (Active/Inactive):** Thợ ở trạng thái Inactive sẽ tự động ẩn khỏi luồng chọn thợ của khách hàng.
  - **Tải xuống QR cá nhân:** Ngay tại dòng của mỗi nhân viên, hệ thống tự động sinh và cho phép tải xuống nhanh mã QR cá nhân của thợ đó (`nexora.vlinkpay.com/touch/staff/{staff-slug}`).

### 4.3. Báo Cáo Tiền Tip (Tips Menu)
- Hiển thị các báo cáo chi tiết về tình hình thu nhập tiền tip.
- Cho phép xem tổng tiền tip gom theo thợ hoặc gom theo nhóm dịch vụ/khoảng thời gian để hỗ trợ chủ tiệm tính lương/thưởng.

### 4.4. Quản Lý Đánh Giá (Reviews Menu)
- **Nội dung:** Danh sách toàn bộ các đánh giá khách hàng gửi qua hệ thống.
- **Chi tiết:** Hiển thị rõ số sao (1–5), nội dung bình luận của khách, tên thợ được đánh giá, và phân loại:
  - Đánh giá tốt (4-5 sao) $\rightarrow$ ghi nhận đã điều hướng sang Google/Yelp.
  - Góp ý xấu (1-3 sao) $\rightarrow$ ghi nhận phản hồi nội bộ kín.
- **Bộ lọc:** Lọc danh sách đánh giá theo thợ phục vụ.
- **Tính năng trong tương lai (Coming Soon):** Phản hồi trực tiếp cho khách qua email đối với các đánh giá góp ý 1–3 sao.

### 4.5. Lịch Sử Giao Dịch (Transaction Menu)
- **Nội dung:** Bảng lưu vết tất cả các giao dịch tip đơn lẻ.
- **Các trường thông tin hiển thị:** Mã giao dịch (ID), Ngày giờ giao dịch, Số tiền tip, Tên thợ nhận, Điểm chạm phát sinh (ví dụ: Table 02), Phương thức thanh toán (Cash App, Venmo, Zelle, VLinkPay), Trạng thái giao dịch.

### 4.6. Quản Lý Điểm Chạm (Touchpoint Menu)
- Cấu hình và quản lý các mã QR/NFC hoạt động trong cửa hàng theo đúng đặc tả phân loại điểm chạm (Business Main, Table QR, Front Desk, Staff QR, Receipt QR).
- Hỗ trợ thêm mới điểm chạm, chỉnh sửa tên, tải về file mã QR hoặc xóa điểm chạm khi không sử dụng.

---

## 5. Các Màn Hình Trạng Thái "Coming Soon" (Chưa Triển Khai MVP)
Để đảm bảo trải nghiệm người dùng mượt mà đối với các menu chưa có tài liệu nghiệp vụ chi tiết, hệ thống sẽ hiển thị một **Màn hình đồ họa tĩnh (Static Graphic Screen)** kèm thông báo tính năng đang phát triển khi người dùng click vào:
1. **QR/NFC Devices:** Menu quản lý thiết bị cứng và đặt mua phần cứng NFC.
2. **Analytics:** Phân tích dữ liệu chuyên sâu về thiết bị, tỷ lệ chuyển đổi.
3. **Settings:** Trang cài đặt hệ thống của chủ tiệm.
4. **Support:** Menu hỗ trợ kỹ thuật và gửi ticket hỗ trợ.
5. *(Phần hành động trả lời trực tiếp email của khách hàng trong menu **Reviews** cũng sẽ hiển thị trạng thái Coming Soon).*

---

## 6. Quy Tắc Nghiệp Vụ Quan Trọng Cho Dev & QC (Business Rules)
- **Ràng buộc Ví của Staff:** Một thợ không thể được lưu hồ sơ nếu không có tối thiểu 1 ví nhận tiền (Venmo, Cash App, Zelle, VLinkPay) được điền đầy đủ và đúng định dạng handle/tài khoản.
- **Đồng bộ Active/Inactive:** Khi thợ chuyển sang trạng thái *Inactive*, khách hàng quét mã QR chung của tiệm sẽ không còn nhìn thấy thợ này trong danh sách chọn. Nếu quét mã QR cá nhân của thợ đó khi họ ở trạng thái *Inactive*, hệ thống sẽ hiển thị màn hình thông báo thợ đang tạm dừng làm việc và không cho phép thực hiện tip.
- **Tính năng Coming Soon:** Tất cả các nút bấm hoặc menu thuộc diện "Coming Soon" phải điều hướng đúng về trang đồ họa tĩnh Coming Soon đã quy định, không được xảy ra lỗi liên kết chết (broken links).

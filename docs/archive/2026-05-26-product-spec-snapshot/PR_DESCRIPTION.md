# Pull Request Description / Walkthrough (Changelog)

This document aggregates all the visual, functional, and layout updates implemented in the `enhance/new-feedback` branch. 

---

## 1. Tiếng Việt - Mô tả nội dung Pull Request

### 1.1 Tóm tắt các Thay đổi chính (Key Highlights)
- **Căn chỉnh dòng nhãn & Rút ngắn Tên hiển thị:**
  - Rút ngắn nhãn `"staff_displayname"` thành `"Display Nickname *"` (tiếng Anh) và `"Tên hiển thị *"` (tiếng Việt) trong file ngôn ngữ `en.json` và `vi.json` để loại bỏ việc text dài xuống dòng gây lệch ô nhập liệu.
  - Áp dụng helper `renderLabel` thống nhất chiều cao nhãn (`h-4`, `flex items-center`) tại giao diện đăng ký tài khoản nhân viên (`StepProfile.jsx`) và Modal danh sách nhân viên (`StaffModal.jsx`).
- **Bộ lọc Khoảng thời gian biểu đồ hoạt động động (Tips & Dashboard):**
  - Bổ sung bộ chọn nhanh các mốc thời gian ('7 ngày', '30 ngày', '90 ngày', '180 ngày', '365 ngày', 'Tùy chọn') tại giao diện thống kê típ (`TipsView.jsx`) và bảng điều khiển chính (`Dashboard.jsx`).
  - Lọc động dữ liệu giao dịch trong biểu đồ và các thẻ KPI tổng hợp (Tổng típ, Tỷ lệ típ trực tiếp P2P, Trung bình típ, ước lượng chi phí tiết kiệm) theo khoảng thời gian được chọn.
- **Tích hợp Liên kết tài khoản Đăng ký:**
  - Thiết kế luồng xác minh và liên kết với tài khoản có sẵn trong bước hồ sơ đăng ký nhân viên (`StepProfile.jsx`).
  - Triển khai các hook xử lý `handleLinkLogin` và `handleLinkDecline` trong `useStaffRegistration.js` để tự động hóa việc điền thông tin sau khi chủ tài khoản chấp nhận lời mời tham gia Salon.
- **Khôi phục giao diện phê duyệt nhân viên chờ xử lý & Sửa lỗi thông báo:**
  - Đồng bộ lại cơ chế quản lý trạng thái local storage trong `Dashboard.jsx` và `App.jsx`, ngăn ngừa các cập nhật song song triệt tiêu dữ liệu phê duyệt của nhân viên mới (`Pending Join Requests`).
  - Hỗ trợ nhấn vào thông báo trên thanh tiêu đề (`DashboardHeader.jsx`) để kích hoạt Modal xem trước và phê duyệt hồ sơ nhân viên một cách chính xác (hỗ trợ tìm kiếm ID không phân biệt hoa thường và khoảng trắng).
- **Hợp nhất ô nhập mã NEXORA ID / VLINKPAY ID:**
  - Thay thế các ô nhập liệu riêng biệt bằng một ô nhập duy nhất có khả năng tự động nhận diện tiền tố (`VLP-` / `NEX-`).
  - Dọn dẹp thiết kế: đưa ô nhập liệu lên trên cùng cột bên trái (bên trên ảnh đại diện), loại bỏ phong cách viền thẻ (style card) rườm rà và tối ưu khoảng cách đệm (`pl-[76px]`) để logo thương hiệu không đè lên text.
- **Bổ sung Nút xóa Ảnh đại diện:**
  - Thêm biểu tượng nút tròn "X" màu đỏ ở góc trên bên phải các ảnh đại diện nhân viên giúp dễ dàng gỡ bỏ hình ảnh.
- **Thống kê đánh giá Salon (`ReviewsView.jsx`):**
  - Tích hợp hàng 4 thẻ thống kê: Điểm đánh giá trung bình (sao vàng), Số lượng đánh giá Google, Số lượng đánh giá Yelp và Ý kiến phản hồi nội bộ.
  - Bổ sung các nút lọc nguồn đánh giá trực quan (Tất cả, Đánh giá Google, Đánh giá Yelp, 3 sao hoặc thấp hơn).
- **Thiết kế hóa đơn giao dịch & Thẻ NFC thiết bị:**
  - Cập nhật Modal chi tiết giao dịch theo dạng hóa đơn biên lai (Receipt-style) hiển thị logo ví thanh toán trực quan.
  - Cập nhật giao diện Touchpoint: Thay thế tiền tố `"HW: "` bằng nhãn NFC có biểu tượng điện thoại, đồng thời tích hợp nút liên kết nhanh mở thẳng trang tip kiểm thử.

### 1.2 Kết quả Kiểm thử (Verification)
- **Kiểm thử tự động (Unit Tests):** Toàn bộ **66 test cases** trên 12 file test pass thành công (`pnpm test`).
- **Biên dịch sản phẩm (Production Build):** Build ứng dụng thành công không có lỗi (`pnpm build`).

---

## 2. English - Pull Request Description

### 2.1 Summary of Key Changes
- **Display Nickname Label Shortening & Field Alignment:**
  - Shortened `"staff_displayname"` to `"Display Nickname *"` in [en.json](../../src/locales/en.json) and `"Tên hiển thị *"` in [vi.json](../../src/locales/vi.json) to eliminate vertical line wraps.
  - Standardized label containers across the registration steps ([StepProfile.jsx](../../src/components/staff-registration/steps/StepProfile.jsx)) and roster settings ([StaffModal.jsx](../../src/components/dashboard/modals/StaffModal.jsx)) using the `renderLabel` helper (`h-4`, `flex items-center`) to fix input misalignment.
- **Dynamic Date Range Presets & Interactive Charts:**
  - Integrated range preset buttons ('7 Days', '30 Days', '90 Days', '180 Days', '365 Days', 'Custom') into [TipsView.jsx](../../src/components/TipsView.jsx) and [Dashboard.jsx](../../src/components/Dashboard.jsx).
  - Dynamically recalculates core metrics (Total Tips, Direct Tips, Average Tip, Estimated Fees Saved) and updates chart trends and SVG curves on selection.
- **Wizard Profile Linking Flow:**
  - Integrated simulation hooks (`handleLinkLogin`, `handleLinkDecline`) in [useStaffRegistration.js](../../src/components/staff-registration/hooks/useStaffRegistration.js) to allow linking existing user records during registration step 3.
- **Pending Join Approvals & Header Notifications Fix:**
  - Synchronized state updates exclusively via [App.jsx](../../src/App.jsx) (propagating to `Dashboard.jsx`) to resolve race conditions that wiped out pending requests from `localStorage`.
  - Upgraded `handleNotificationClick` in [DashboardHeader.jsx](../../src/components/dashboard/layout/DashboardHeader.jsx) to perform case-insensitive and whitespace-trimmed ID matching, enabling the salon owner preview/approval modal to launch successfully from notifications.
- **Consolidated NEXORA ID Input & Spacing:**
  - Replaced separate inputs with a single **NEXORA ID / VLINKPAY ID** text input field with prefix detection (`VLP-` / `NEX-`) in [StaffModal.jsx](../../src/components/dashboard/modals/StaffModal.jsx).
  - Moved the search/invite field container to the Left Column at the top, removed outer card styling, and applied left padding (`pl-[76px]`) to ensure the brand logo overlay doesn't overlap text.
- **Avatar Close Button:**
  - Added a small, red circular close button (`"x"`) at the top right corner of all technician avatar displays for quick removal.
- **Review Statistics & Filters:**
  - Added a 4-card statistics row at the top of [ReviewsView.jsx](../../src/components/dashboard/views/ReviewsView.jsx) (Average Rating, Google Reviews, Yelp Reviews, Internal Feedback).
  - Implemented filters for Google Reviews, Yelp Reviews, and 3★ or below ratings.
- **Receipt Detail Modals & NFC Badges:**
  - Upgraded transaction detailed modals ([ReportsView.jsx](../../src/components/dashboard/views/ReportsView.jsx), [TipsView.jsx](../../src/components/TipsView.jsx)) to use a centered receipt-style layout with wallet provider logos.
  - Added click-to-test external links and NFC smartphone badges inside [TouchpointsView.jsx](../../src/components/TouchpointsView.jsx).

### 2.2 Verification Status
- **Vitest Suites:** **66/66 unit tests** passed successfully (`pnpm test`).
- **Production Build:** Bundled successfully with zero errors (`pnpm build`).

---

## 3. How to Update on GitHub / Cách cập nhật lên PR

You can apply these updates to your Pull Request on GitHub by following these options:

1. **Manual Copy-Paste (Recommended):**
   - Copy the content of section **1 (Tiếng Việt)** or **2 (English)** from this document.
   - Go to your Pull Request on GitHub: [https://github.com/SotaThao/nexora/pull/18](https://github.com/SotaThao/nexora/pull/18).
   - Click the **"..."** button at the top-right of the PR description, choose **"Edit"**, and paste the updated text.

2. **Commit File to Repository:**
   - This file has been written locally to `docs/PR_DESCRIPTION.md` and can be pushed to GitHub if you authenticate your git client.

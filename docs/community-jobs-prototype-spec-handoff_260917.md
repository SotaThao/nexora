---
type: doc
title: "Community Jobs — Spec bàn giao: từ ý tưởng đến prototype"
status: handoff
area: community
created: 2026-09-17
owner: dev@vlinkpay.com
---

# Community Jobs — Spec bàn giao: từ ý tưởng đến prototype

Tài liệu này là bản đặc tả (spec) bàn giao cho team, tổng hợp toàn bộ hành trình của tính năng Community Jobs — từ lúc lên kế hoạch đến khi có một prototype (bản minh hoạ) chạy được. Cấu trúc theo khung OpenSpec đang dùng trong repo (`openspec/changes/`), viết lại thành một tài liệu tổng hợp duy nhất thay vì bộ 3 file proposal/design/tasks riêng lẻ, vì phạm vi hiện tại chỉ dừng ở mức prototype.

## Why

Salon cần một nơi để đăng tin tuyển thợ nail, và thợ nail cần một nơi để đăng tin tìm việc — cả hai bên đều cần xem chi tiết tin đăng và nhắn tin trực tiếp với nhau, ngay trong khu vực Cộng đồng (Community) hiện có của Nexora Touch, thay vì phải dùng nền tảng khác.

Trước khi xây dựng phiên bản thật (có nối đăng nhập thật và cơ sở dữ liệu thật), quy tắc của dự án yêu cầu: nếu tính năng chạm vào từ 3 tập tin trở lên hoặc các phần dùng chung của hệ thống (đăng nhập, gọi dữ liệu, lưu trữ), phải có một bản đặc tả trước khi code. Trong lúc chuẩn bị đặc tả đó, nhóm phát hiện một vấn đề kiến trúc lớn hơn dự kiến (xem mục Risks & Blockers) khiến việc code phiên bản thật chưa thể bắt đầu ngay. Vì vậy nhóm quyết định: trước mắt chỉ cần một **prototype** (giao diện minh hoạ, dữ liệu giả lập) để trình bày ý tưởng và thu thập phản hồi, còn phiên bản thật sẽ làm ở giai đoạn sau.

## What Changes (đã triển khai ở mức prototype)

- Danh sách tin đăng có thể lọc theo từ khoá, khu vực, và loại tin (tìm việc / tuyển thợ).
- Đăng tin theo đúng loại tin của vai trò đang đăng nhập (chủ salon chỉ đăng tuyển thợ, thợ nail chỉ đăng tìm việc) — không cho đổi loại tin.
- Xem chi tiết một tin đăng, và mở khung nhắn tin (giả lập, chưa nối hệ chat thật) để liên hệ người đăng.
- Mục "Bài của tôi": sửa, xoá, hoặc đổi trạng thái (đang mở → đã tuyển/đã nhận việc → đã đóng) cho tin của chính mình.
- Form đăng tin được tối ưu qua nhiều vòng góp ý: tự động điền tên salon theo vai trò đang đăng nhập, cho phép tải ảnh minh hoạ thật lên (chỉ xem trước tại chỗ, không lưu trữ thật), gộp các trường thông tin liên quan vào cùng một hàng, bỏ các trường gây rối không cần thiết (kỹ năng, kinh nghiệm tối thiểu, thời điểm cần thợ, cách trả lương).
- Tích hợp AI viết mô tả tin đăng: một hàm phía server (không lộ khoá API ra trình duyệt) gọi một mô hình ngôn ngữ để viết mô tả ngắn bằng tiếng Việt, viết đúng góc nhìn (chủ salon khi tuyển thợ, chính người thợ khi tìm việc).
- Chuẩn hoá cách hiển thị nhãn: nhãn "Cần gấp" màu đỏ, nhãn loại tin màu vàng (tuyển thợ) / xanh dương (tìm việc); nhãn mức lương chỉ hiện khi là lương theo tuần hoặc "thương lượng", các định dạng khác (theo giờ, ăn chia phần trăm) sẽ ẩn thay vì hiển thị sai ngữ cảnh.

## Scope

**Trong phạm vi (prototype):**
- Toàn bộ giao diện và luồng thao tác liệt kê ở mục "What Changes" trên.
- Dữ liệu lưu tạm thời trong bộ nhớ trình duyệt (không lưu trữ lâu dài, mất khi tải lại trang).

**Ngoài phạm vi (để lại cho giai đoạn xây bản thật, chưa lên lịch):**
- Nối đăng nhập thật của người dùng với hệ thống Cộng đồng (xem Risks & Blockers).
- Lưu trữ tin đăng vào cơ sở dữ liệu thật, có phân quyền truy cập đúng người đúng vai trò.
- Kết nối màn hình với dữ liệu thật qua lớp gọi dữ liệu chuẩn của ứng dụng (thay vì lưu tạm trong bộ nhớ trình duyệt).
- Nối nút nhắn tin vào hệ thống chat thật đã có sẵn trong Cộng đồng (hiện tại chỉ là khung chat giả lập riêng cho tính năng này).
- Kiểm thử đầy đủ 3 lớp (đơn vị, tích hợp, giao diện) cho phiên bản thật, và gỡ bỏ toàn bộ code minh hoạ sau khi phiên bản thật hoàn thành.
- Xử lý việc tiếp nhận báo cáo/khiếu nại (report) cho tin đăng — hệ thống báo cáo hiện tại của Cộng đồng chưa hỗ trợ loại nội dung này.

## Design — trạng thái từng hạng mục

| Hạng mục | Quyết định / Thiết kế | Trạng thái ở mức prototype |
|---|---|---|
| Kiến trúc đăng nhập thật cho tính năng | Cần một quyết định nối đăng nhập thật của người dùng với vai trò (chủ salon / thợ nail) trước khi phân quyền dữ liệu thật | Chưa quyết định — hoãn sang giai đoạn xây bản thật |
| Lưu trữ dữ liệu tin đăng | Cần bảng dữ liệu thật + quy tắc phân quyền truy cập | Chưa có — prototype dùng dữ liệu giả lập trong bộ nhớ trình duyệt |
| Lớp gọi dữ liệu chuẩn (kết nối màn hình với dữ liệu thật) | Cần viết theo đúng lớp gọi dữ liệu chuẩn của ứng dụng | Chưa có — prototype gọi thẳng state cục bộ |
| Màn đăng tin (2 loại) | Giao diện đăng tin, rút gọn trường thông tin, auto-fill, upload ảnh, AI viết mô tả | Đã hoàn thành ở mức prototype |
| Màn quản lý tin của tôi | Sửa / xoá / đổi trạng thái tin đăng | Đã hoàn thành ở mức prototype |
| Nhắn tin với người đăng tin | Nối vào hệ thống chat thật đã có sẵn của Cộng đồng | Chưa nối — prototype dùng khung chat giả lập riêng |
| Chuẩn hoá nhãn/hiển thị trên tin đăng | Màu nhãn theo loại tin/mức độ khẩn cấp, lọc hiển thị mức lương hợp lệ | Đã hoàn thành ở mức prototype |
| Kiểm thử 3 lớp + gỡ code minh hoạ | Áp dụng cho phiên bản thật, sau khi có dữ liệu/màn hình thật | Chưa thực hiện — chỉ mới kiểm thử build/giao diện thủ công cho prototype |

## Risks & Blockers

**Vấn đề kiến trúc lớn nhất:** ứng dụng hiện có hai hệ đăng nhập tách biệt, không liên quan đến nhau — (1) đăng nhập thật của chủ salon/thợ nail dùng cho các chức năng chính của ứng dụng, và (2) đăng nhập riêng của khu vực Cộng đồng (hiện chỉ dùng vài tài khoản minh hoạ cố định). Muốn cho phép "chỉ chủ salon mới đăng được tin tuyển, chỉ người đăng mới sửa/xoá được tin của mình" ở mức dữ liệu thật, hệ thống cần biết chính xác ai đang đăng nhập là chủ hay thợ theo đúng nghĩa của ứng dụng chính — hiện chưa có cầu nối nào giữa hai hệ đăng nhập này. Đây là quyết định phải chốt trước khi bắt đầu xây bất kỳ phần lưu trữ dữ liệu thật nào cho tính năng, không thể vừa làm vừa quyết định.

**Rủi ro phụ:** hệ thống tiếp nhận báo cáo/khiếu nại nội dung hiện tại của Cộng đồng chưa có loại nội dung dành cho tin tuyển dụng — nếu tính năng này công khai với tên thật của salon, cần xử lý trước khi phát hành bản thật, không chỉ để "làm sau cho vui".

## Tasks — tình trạng hiện tại

- [x] Xây dựng đầy đủ luồng prototype (đăng tin, xem danh sách/chi tiết, quản lý tin của tôi, nhắn tin giả lập).
- [x] Cải thiện form đăng tin qua nhiều vòng góp ý (rút gọn trường, auto-fill, upload ảnh, AI viết mô tả).
- [x] Chuẩn hoá màu nhãn và cách hiển thị mức lương trên tin đăng.
- [x] Kiểm thử build và giao diện thủ công cho prototype (không phát hiện lỗi chặn).
- [ ] Quyết định kiến trúc nối đăng nhập thật (chưa bắt đầu).
- [ ] Thiết kế + triển khai lưu trữ dữ liệu thật và lớp gọi dữ liệu chuẩn (chưa bắt đầu, phụ thuộc mục trên).
- [ ] Nối màn hình với dữ liệu thật, nối nhắn tin vào hệ chat thật (chưa bắt đầu, phụ thuộc mục trên).
- [ ] Kiểm thử 3 lớp cho phiên bản thật + gỡ bỏ code minh hoạ (chưa bắt đầu).
- [ ] Xử lý khoảng trống trong hệ thống báo cáo/khiếu nại cho loại nội dung tin tuyển dụng (chưa bắt đầu).

## Xem trực tiếp

Demo prototype: https://nexora-ten-lime.vercel.app — route `/community?tab=jobs`, đăng nhập bằng 1 trong 3 vai trò minh hoạ có sẵn (chủ salon, thợ nail, khách) để thử toàn bộ luồng thao tác mô tả ở trên.

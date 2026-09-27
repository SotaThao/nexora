# NEXORA TOUCH · Community — Bộ tài liệu nghiệp vụ giao dev

**Cập nhật:** 2026-09-26 · **Trạng thái:** Draft v0.1 — chờ Brian duyệt
**Kèm theo:** `nexora-community-tong-hop.html` (bản mẫu chạy được, 6 module + AI Smart Tour), `nexora-pos-promotion.html` (bản mẫu POS Promotion liên kết)

## Cách dùng bộ tài liệu

1. Dev đọc **00** trước — mọi module đứng trên nền tài khoản/SĐT/điều khoản.
2. Mỗi module một file: tổng quan → khái niệm → vai trò → luồng từng bước (có sơ đồ) → vòng đời trạng thái → quy tắc → ngoại lệ → **câu hỏi mở**.
3. Mở bản mẫu HTML song song để xem giao diện và chuỗi thông báo. Bản mẫu **là tham chiếu hành vi, không phải mã nguồn để dùng lại**.
4. Mọi con số tiền, %, giờ, giá trong tài liệu là **SỐ MẪU** trừ khi ghi khác. Brian và luật sư chốt số thật.
5. Mục **Câu hỏi mở** cuối mỗi file là việc Brian phải quyết trước khi dev bắt tay vào module đó.

## Danh sách tài liệu

| # | File | Nội dung | Dòng tiền | Phụ thuộc |
|---|---|---|---|---|
| 00 | `00-tai-khoan-dinh-danh-dieu-khoan.md` | Khách vs thành viên, đăng ký 1 lần kèm điều khoản, SĐT là khoá chung, NEXORA ID, vai trò, phiên bản điều khoản, cấu trúc menu | — | — |
| 01 | `01-bang-tin-nhom-cho.md` | Đăng 1 lần tối đa 3 nơi, 4 loại bài, chợ bắt buộc giá, AI chặn lừa đảo, nhóm ngành, Nổi bật trả phí | 💰 Nổi bật | 00 |
| 02 | `02-viec-lam.md` | Hồ sơ thợ, 3 cách đăng tin tìm việc, tuyển từ POS, AI gợi ý thợ, mời phỏng vấn – chia sẻ SĐT 2 chiều, chế độ kín | — | 00 |
| 03 | `03-ca-lam-them.md` | Đăng ca, cọc 2 chiều, chốt, check-in GPS, xong ca, huỷ/vắng mặt, chia sẻ thợ, chính sách admin | 💰💰 cọc, bảo đảm, phạt | 00, cổng thanh toán, luật sư |
| 04 | `04-deal-coupon-pos-promotion.md` | POS là nguồn duy nhất, kênh phát (Community/SMS/QR), giữ lượt, hết hạn, check-in tự nhận diện, redeem ví QR+PIN, quảng cáo | 💰 quảng cáo | 00, POS Promotion hiện có |
| 05 | `05-tin-nhan-goi-rieng-tu.md` | DM, lời mời nhắn tin, nhóm POS/công khai, gọi thoại/video + phụ đề AI, cảnh báo lừa đảo, NEXORA ID & riêng tư | — | 00 |

## Thứ tự làm đề xuất (để Brian quyết)

| Giai đoạn | Gồm | Lý do |
|---|---|---|
| 1 | 00 + 04 (Deal & Coupon ↔ POS) | Quyết định còn mới, gắn thẳng vào POS đang bán, ra doanh thu cho tiệm sớm nhất |
| 2 | 01 + 05 | Tạo lưu lượng người dùng; không có dòng tiền phức tạp |
| 3 | 02 | Cần thống nhất enum giữa hai bản mẫu trước |
| 4 | 03 | Dòng tiền hai chiều, cần cổng thanh toán tạm giữ và luật sư duyệt điều khoản riêng |

## Quyết định lớn Brian phải chốt trước khi giao dev (gom từ 6 file)

1. **SĐT là khoá duy nhất** giữa Community và POS; có OTP lúc đăng ký không. (00)
2. **Vai trò "khách của tiệm"** trong Community: thấy gì, làm gì. (00)
3. **Bỏ "Tạo coupon" trong Community**, mọi chương trình tạo trong POS; thợ tạo coupon cá nhân qua POS tiệm hay bỏ. (04)
4. **Giữ lượt:** bắt buộc hay tuỳ chọn; giới hạn/người đếm theo lấy hay theo dùng. (04)
5. **Giá thật**: Nổi bật (01), quảng cáo coupon (04); thuế, hoá đơn, hoàn tiền.
6. **Toàn bộ số chính sách ca làm thêm** + đối tác thanh toán tạm giữ + phí ai chịu. (03)
7. **Thống nhất enum Việc làm** (kinh nghiệm, lương, loại việc, kỹ năng, license). (02)
8. **Kiểm duyệt:** hàng đợi báo cáo, quy trình khoá tài khoản. (00, 01, 05)
9. **Ngôn ngữ có hiệu lực pháp lý** của điều khoản; tiêu chí "thay đổi quan trọng". (00)
10. **Mã hoá cuộc gọi/tin nhắn** và nhà cung cấp gọi/phụ đề. (05)

## Những gì bản mẫu KHÔNG có (dev đừng tìm)

Backend/API, xác thực, lưu trữ, thanh toán thật, thông báo đẩy, upload ảnh thật, GPS thật, nhận giọng nói thật, AI thật (mọi "AI" trong bản mẫu là template/regex), kiểm duyệt, bình luận, Apple/Google Wallet thật.

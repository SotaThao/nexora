---
type: doc
title: "Community v2 — Prototype design spec (trình bày trực tiếp + deploy prototype server)"
status: draft
area: community
created: 2026-09-27
owner: dev@vlinkpay.com
---

# Community v2 — Prototype design spec

> **Mục đích:** dựng **prototype bấm được** cho toàn bộ 6 module của bộ tài liệu Brian (Draft v0.1, 2026-09-26) để **trình bày trực tiếp**, sau đó deploy tĩnh lên prototype server. **Không phải code sản phẩm** — không backend, không API thật, không đụng `vlink-nexora-fe`.
> **Nguồn nghiệp vụ:** `C:\Users\AD\Downloads\Telegram Desktop\nexora-community-docs\` (00–05). Mọi copy/lỗi/toast lấy **nguyên văn** từ tài liệu. Số tiền/giá là **SỐ MẪU**.
> **Nguồn design:** `vlink-nexora-fe/DESIGN.md` + `tailwind.config.js` (token Nexora admin/staff). Bản mẫu HTML của Brian chỉ là **tham chiếu hành vi**, không dùng lại giao diện.
> **Phân tích nghiệp vụ + xung đột:** [[community-341_feature-plan-brian-docs_260927]] (§2 xung đột C1–C7 vẫn cần Brian chốt, nhưng prototype dựng theo **đúng tài liệu mới**).

---

## 1. Định dạng kỹ thuật (chỉ để chạy được, không phải kiến trúc sản phẩm)

| Mục | Chốt |
|---|---|
| Repo | **SotaThao/nexora** (user chốt 2026-09-27), worktree `C:\Users\AD\Documents\GitHub\nexora-community-v2`, branch `feat/341_community-v2-prototype` (base `main`) |
| Route | `/community-v2/*` — cây route riêng, **không đụng** demo `/community` cũ (Supabase) |
| Code | Toàn bộ trong `src/prototype/community-v2/`; ngoài thư mục đó chỉ sửa `src/app/AppRouter.tsx` (1 lazy import + 1 route) và `src/App.tsx` (nhận diện path) |
| Stack | React + TypeScript + Tailwind + react-router có sẵn của nexora; token Tailwind Nexora đã có trong `tailwind.config.js` |
| Build | `pnpm build` của nexora (Vercel đã có rewrite SPA) |
| Dữ liệu | Mock store in-memory (seed cố định) + `localStorage` (key prefix `nxc2:`) để giữ trạng thái khi reload; nút **"Reset demo"** trả về seed |
| Ngôn ngữ | Tiếng Việt (EN toggle: ngoài scope đợt này) |
| Font | Inter (app), mono cho mã coupon/NX-ID/PIN |
| Icon | lucide-react (không emoji làm icon chính; emoji chỉ giữ ở nhãn loại bài/mẫu như tài liệu) |
| Ảnh | Ảnh mẫu tay/tiệm: placeholder sinh bằng gradient/SVG nội bộ — **không dùng ảnh sinh AI**, không hotlink |
| Responsive | **Mọi màn có 2 layout**: mobile 390×844 và desktop 1440×900 (breakpoint `lg` = 1024) |

## 2. Công cụ trình bày (thanh demo)

Thanh mảnh trên cùng, luôn hiện (có nút thu gọn):
- **Vai:** `Khách chưa ĐK` · `Jessica · thợ` · `Kayla · chủ tiệm` · `Linh · khách` · `Admin NEXORA` — đổi vai render lại toàn app.
- **Kịch bản** (dropdown): nhảy thẳng tới bước đầu của 8 kịch bản ở §6.
- **Reset demo** · **Mô phỏng**: "Phát hành điều khoản v1.1 (quan trọng)", "Có cuộc gọi đến", "Quá giờ check-in ca" — để trình diễn trạng thái mà không phải chờ.

Vai `Linh · khách` chưa được định nghĩa trong tài liệu (00 Câu hỏi mở #2) → prototype cho khách thấy **Bảng tin (chỉ xem) + Deal & Coupon + Tin nhắn**, gắn nhãn *"Giả định — chờ Brian chốt"*.

## 3. Nguyên tắc giao diện

1. **Shell theo Nexora staff/merchant:** desktop = sidebar tối `nexoraSidebar` 288px + header trắng sticky; mục Community có submenu (active `brandCyan` + chấm). Mobile = header + **hàng pill cuộn ngang** (Bảng tin · Nhóm & Chợ · Việc làm · Ca làm thêm · Deal & Coupon · Tin nhắn & Gọi) + bottom nav 68px.
2. **Nền sáng** `nexoraCanvas`, card `.nexora-card` (bo 12px, border `nexoraBorder`, shadow `nexora-card`). Nút chính `nexoraBrand`; hành động cao nhất (Đăng bài, Phát hành, Đặt cọc & chốt ca) dùng gradient `nexoraElectric → nexoraViolet`.
3. **Màn POS** (Promotion, Check-in, Quầy redeem, Tuyển thợ, Đăng ca) dùng layout **dashboard merchant**: desktop 2 cột (danh sách + panel), mobile 1 cột có sheet. Có nhãn nhỏ `POS` ở breadcrumb để khán giả biết đang ở POS chứ không ở Community.
4. **Tiền 💰:** mọi con số tiền có nhãn phụ `số mẫu`; khối tạm giữ/cọc dùng panel viền `nexoraWarning` nhạt + icon khoá.
5. **Nhãn bắt buộc:** "⭐ Được tài trợ" cho Nổi bật/quảng cáo; hộp "Giao dịch trực tiếp giữa thành viên…" dưới bài Mua bán; "BẢN NHÁP — CẦN LUẬT SƯ DUYỆT" trên điều khoản.
6. **Trạng thái:** mỗi danh sách có trạng thái rỗng + loading skeleton; lỗi validate hiện ngay dưới trường, đúng câu trong tài liệu; toast đáy màn (mobile) / góc phải (desktop).
7. **Hành động cần tài khoản** (bảng ở doc 00) khi đang là `Khách chưa ĐK` ⇒ mở sheet đăng ký, xong **tự chạy tiếp** hành động — đây là điểm phải trình diễn được ở mọi module.
8. A11y tối thiểu: vùng chạm ≥44px mobile, focus ring `rgba(70,72,216,0.2)`, tương phản chữ ≥4.5:1.

---

## 4. Kiểm kê màn hình (61 màn · mỗi màn 2 layout)

Cột **Trạng thái cần có** = các biến thể phải bấm/mô phỏng ra được khi trình bày.

### M00 · Nền tảng: shell, tài khoản, điều khoản (7)

| ID | Màn | Vai | Nội dung chính | Trạng thái cần có |
|---|---|---|---|---|
| S00-01 | Shell Community | tất cả | Sidebar/pill 6 mục + Học tập/Sự kiện (placeholder "giữ module hiện có"), badge tin nhắn, avatar/NX-ID | Theo từng vai (mục ẩn/hiện theo bảng menu doc 00) |
| S00-02 | Sheet "Tạo tài khoản NEXORA · miễn phí" | khách | Tên hiển thị, SĐT, tick 18+ & điều khoản, "Xem 6 điều chính ▾", Để sau / Tạo tài khoản & tiếp tục | Nút tắt khi chưa tick · 3 lỗi validate · "SĐT này đã đăng ký" → đăng nhập · thành công + toast + chạy tiếp hành động |
| S00-03 | Xác minh OTP (biến thể) | khách | 6 ô OTP, gửi lại sau 30s | Nhãn "Chờ Brian chốt có OTP không" |
| S00-04 | Điều khoản đầy đủ | thành viên | 15 mục v1.0, thanh tiến trình cuộn, 4 ô tick, "Đồng ý & tham gia" / "Để sau · chỉ xem" | Nút khoá tới khi cuộn hết · bản v1.1 có hộp "Thay đổi so với v1.0" (mục 6a) |
| S00-05 | Dải "Điều khoản đã cập nhật (v1.1)" | thành viên | Banner trên Bảng tin + "Xem thay đổi" | Vẫn xem được; bấm hành động → S00-04 |
| S00-06 | Có gì mới trong Community | tất cả | Modal giới thiệu 6 module (lần đầu vào) | — |
| S00-07 | Chế độ admin | admin | Tab: Giá Nổi bật · Chính sách ca · Phiên bản điều khoản (phát hành, đánh dấu quan trọng) · Từ khoá AI chặn/cảnh báo · Hàng đợi báo cáo (mock) | Lưu → toast |

### M01 · Bảng tin, Nhóm & Chợ (10)

| ID | Màn | Vai | Nội dung chính | Trạng thái cần có |
|---|---|---|---|---|
| S01-01 | Bảng tin | tất cả | Ô "{Tên} ơi, bạn đang nghĩ gì?" + 4 nút nhanh; lọc theo nhóm đã tham gia; card bài 4 loại + OFFICIAL; bài Nổi bật ghim đầu; bài mới viền tím; ♡, 💬 (disabled "sắp có"), ⋯ Báo cáo/Ẩn/Xoá | Guest bấm ♡ → S00-02 · báo cáo → bài ẩn + toast · desktop 3 cột (menu · feed · rail nhóm gợi ý/deal gần bạn) |
| S01-02 | Soạn bài · Bước 1 | thành viên | Loại bài; Mua bán: danh mục, giá $, khu vực; nội dung ≤1500 (đếm ký tự); ≤6 ảnh + tick quyền ảnh | 3 lỗi validate · **AI chặn** (từ khoá zelle/cash app/…) · **AI cảnh báo SĐT** (qua ở lần 2) |
| S01-03 | Soạn bài · Bước 2 — Đăng ở đâu | thành viên | Danh sách đích (Bảng tin, 4 cộng đồng ngành, 4 chợ), gợi ý AI + "Dùng gợi ý", nhãn "sẽ tự tham gia khi đăng" | 4 lỗi luật đích (quá 3 / mua bán vào cộng đồng / bài thường vào chợ / 0 nơi) |
| S01-04 | Soạn bài · Bước 3 — Miễn phí / Nổi bật | thành viên | Miễn phí vs Nổi bật 3/7/14 ngày ($5/$10/$18 số mẫu), Ví NEXORA/thẻ | Thợ chọn Nổi bật → khoá + câu doc 01 · doanh nghiệp → sheet thanh toán mock → toast |
| S01-05 | Nhóm & Chợ | tất cả | Tab Nhóm ngành / Chợ; card nhóm (thành viên, nội quy ngắn), Tham gia / Đã tham gia ✓ | Tham gia/rời + toast · guest → S00-02 |
| S01-06 | Chi tiết nhóm | tất cả | Header nhóm, nội quy, bài trong nhóm, composer đã chọn sẵn đích | Nhóm Chợ hiện ô giá |
| S01-07 | Tạo nhóm | thành viên | Tên, ngành, loại (Chợ/Cộng đồng), phí (Thu phí = khoá "Pro"), nội quy mặc định | Lỗi tên <3 · chọn Thu phí → thông báo Pro |
| S01-08 | Rao vặt | tất cả | Lưới bài Mua bán; lọc danh mục/khu vực/khoảng giá; sort mới nhất | Rỗng theo bộ lọc |
| S01-09 | Chi tiết bài Mua bán | tất cả | Ảnh carousel, giá, khu vực, người bán, hộp cảnh báo giao dịch, "✉️ Nhắn người bán" | Guest mở được chat, gửi thì → S00-02 |
| S01-10 | Thanh toán Nổi bật | doanh nghiệp | Sheet tóm tắt gói + phương thức | Thất bại → giữ bản nháp + lỗi |

### M02 · Việc làm (12)

| ID | Màn | Vai | Nội dung chính | Trạng thái cần có |
|---|---|---|---|---|
| S02-01 | Bảng việc làm | tất cả | Lọc Tất cả / Tìm việc / Tuyển thợ, khu vực, tìm; card tin tuyển (tiệm, Cần gấp, Có chỗ ở) & tin tìm việc (tên hoặc chỉ tên, kỹ năng, license ✓) | Chủ tiệm thấy CTA "Tuyển thợ từ POS" thay vì bảng thợ |
| S02-02 | Hồ sơ thợ | thợ | 4 bước + khối Riêng tư (4 công tắc); vòng % hoàn thiện; badge "✓ LICENSE XÁC MINH" | <60% → hint khoá AI · đủ → mở khoá |
| S02-03 | Đăng tin tìm việc — chọn cách | thợ | 3 card: Mẫu có sẵn (~30 giây) · Nói/gõ 1 câu · Tự điền 4 bước | — |
| S02-04 | Cách A · Mẫu + màn Nhanh | thợ | 8 mẫu → khu vực, kinh nghiệm, ngày làm, lương, 8 câu nhanh; xem trước tiêu đề + bài, "↺ Viết lại theo mẫu" | Lỗi gộp · cảnh báo SĐT + "Xoá số khỏi bài" |
| S02-05 | Cách B · Nói/gõ 1 câu | thợ | Nút 🎤 (animation giả lập), ô gõ, "✦ AI điền giúp" → "✦ AI hiểu là: …" có chip sửa được | <6 ký tự · "Chưa nhận ra nhiều…" |
| S02-06 | Cách C · 4 bước | thợ | Stepper Nexora (gradient); "Điền nhanh" từ hồ sơ; bước 4: AI viết giúp, Thêm bản English, Viết ngắn lại, thời hạn 14/30/60 | Lỗi từng bước đúng câu doc 02 |
| S02-07 | Tin của tôi | thợ | Card tin + 👁/📩/💾 + còn N ngày + "🔒 Ẩn với <tiệm>"; Sửa · Tạm ẩn · Gia hạn · Đã có việc · Xoá (confirm) | Hết hạn → Gia hạn 30 ngày |
| S02-08 | Lời mời phỏng vấn (thợ) | thợ | Danh sách lời mời; "Đồng ý & chia sẻ SĐT" / "Từ chối" | Sau đồng ý: nhãn đã chia sẻ |
| S02-09 | Chi tiết tin tuyển + ứng tuyển | thợ | Mô tả, kỹ năng, lương, tiệm; "Ứng tuyển bằng hồ sơ" (SĐT vẫn ẩn), "Nhắn tiệm" | Toast doc 02 |
| S02-10 | POS · Tuyển thợ | chủ | Form: tiệm, thành phố, kỹ năng, loại việc, lương, Cần gấp, Có chỗ ở; "✦ AI viết tin tuyển"; "Đăng lên cộng đồng" | Toast doc 02 |
| S02-11 | POS · AI gợi ý thợ + lời mời | chủ | Danh sách thợ + điểm % (60/25/15), Mời phỏng vấn; trạng thái lời mời: Chờ thợ duyệt · SĐT ẩn / ✓ Thợ đồng ý · 📞 SĐT / Thợ từ chối; ghi chú cố định chế độ kín | Mời 2 lần bị chặn · thợ "Đã có việc" không mời được |
| S02-12 | POS · Đơn ứng tuyển | chủ | Danh sách đơn (bản mẫu thiếu — nhãn "Đề xuất bổ sung") | — |

### M03 · Ca làm thêm & chia sẻ thợ (9)

| ID | Màn | Vai | Nội dung chính | Trạng thái cần có |
|---|---|---|---|---|
| S03-01 | Ca gần bạn | thợ | Công tắc "🟢 Sẵn sàng làm thêm", ngày rảnh, bán kính 5/10/25 mi; card ca (loại 🎉/🔥/⚡, giờ, số thợ, dịch vụ, trả công, "Tiệm đã bảo đảm tiền công", chế độ nhận) | Tắt sẵn sàng → trạng thái rỗng giải thích |
| S03-02 | Nhận ca / Ứng tuyển (modal) | thợ | Trả công + tips, Cọc chốt ca $X, hộp "🔒 Cọc chỉ tạm giữ…", chính sách huỷ, checkbox bắt buộc | Nút khoá tới khi tick · nhận ngay → Đã chốt · ứng tuyển → Chờ duyệt |
| S03-03 | Ca của tôi | thợ | Timeline trạng thái: Được mời · Chờ duyệt · Đã chốt · Đang làm · Hoàn thành · Vắng mặt · Huỷ; nút "📍 Check-in tại tiệm" | Ngoài cửa sổ → disabled + câu giải thích · check-in thành công · mô phỏng quá giờ → Vắng mặt + mất cọc |
| S03-04 | Huỷ ca (modal) | thợ/chủ | Tính theo ma trận ai huỷ × còn ≥/<24h, hiện số tiền mất/trả | 4 ô ma trận |
| S03-05 | POS · Đăng ca | chủ | Loại, tiêu đề, khi nào, giờ, số thợ 1–4, dịch vụ, trả công, chế độ nhận; tóm tắt **tạm giữ bảo đảm = trả công × số thợ** | Lỗi thiếu trường · xác nhận tạm giữ → toast |
| S03-06 | POS · Chi tiết ca & ứng viên | chủ | Ứng viên + độ tin cậy (hoàn thành/vắng/huỷ muộn), Chốt / ✕; thợ đã chốt → Xong ca · trả tiền; nút Huỷ ca (điều kiện doc 03) | ✕ → hoàn cọc · Xong ca → toast trả tiền |
| S03-07 | POS · Thợ rảnh gần tiệm | chủ | Danh sách thợ đang sẵn sàng (có nhãn "Chia sẻ từ <tiệm>"), "Mời vào ca" (chọn ca) | — |
| S03-08 | POS · Chia sẻ thợ dư | chủ | Danh sách thợ của tiệm: đã đồng ý → công tắc + chọn ngày; chưa → "Hỏi thợ" | Toast doc 03 |
| S03-09 | Chính sách ca (admin) | admin | 6 tham số số mẫu + giới hạn nhập; ghi chú snapshot chính sách vào từng ca | Lỗi ngoài khoảng |

### M04 · Deal & Coupon ↔ POS Promotion (14)

| ID | Màn | Vai | Nội dung chính | Trạng thái cần có |
|---|---|---|---|---|
| S04-01 | Deal gần bạn | tất cả | Bản đồ (minh hoạ SVG, không dùng tile thật) + danh sách; bán kính 1/5/10/25 mi + Online; lọc Khách hàng / Tiệm & thợ; sort Gần nhất/Sắp hết hạn/Sắp hết lượt; tìm; deal tài trợ đầu | "còn ≤3 ngày" đỏ · desktop: map trái, list phải |
| S04-02 | Coupon theo ngành | tất cả | 7 ngành dạng tab; grid coupon | Rỗng theo ngành |
| S04-03 | Chi tiết deal | tất cả | Tiệm, ưu đãi, điều kiện, HSD, còn lượt, "🎟️ Lấy coupon", ♡ | Guest → S00-02 → tự lấy tiếp · 4 lỗi (đã có mã → mở ví / hết hạn / vượt giới hạn / hết lượt) |
| S04-04 | Popup "Đã lấy coupon!" | thành viên | Mã `NX-<ID>-XXXX`, **dòng điều kiện coupon** nguyên văn, Lưu thêm: Apple Wallet · Google Wallet · Tải PNG · Gửi SMS/Email (mock) | — |
| S04-05 | Ví coupon | thành viên | Tab Còn hiệu lực / Đã dùng / Đã trả lượt; "Lấy lại" | Rỗng |
| S04-06 | Mã coupon (full screen) | thành viên | QR đổi mỗi 30s + PIN 6 số + vòng đếm ngược, độ sáng tối đa, "hạn giữ tới …" | Hết hạn giữ → trạng thái trả lượt |
| S04-07 | Wish list & theo dõi từ khoá | thành viên | Deal đã lưu; chip từ khoá + "＋ Theo dõi" (≥2 ký tự); thông báo mẫu "🔔 Deal mới khớp…" | — |
| S04-08 | Trang public `nexora.link/c/<id>` | khách ngoài app | Mobile web: ưu đãi + nhập SĐT → "Đã vào ví" + gợi ý tải app | Desktop: card giữa màn |
| S04-09 | POS · Chương trình | chủ | Bảng/list: tên, trạng thái (Đang chạy/Tạm dừng/Hết hạn/Hết lượt), kênh (chip POS/Community/SMS/QR), lấy/dùng; ⏸/▶, 📣/🔕, 🖨️ QR, 🚀 Quảng cáo | Toast dừng / gỡ Community (câu doc 04) |
| S04-10 | POS · Tạo chương trình | chủ | Lưới 12 mẫu → form (loại, giá trị, tiêu đề ≤60, hết hạn, tổng lượt, tối đa/khách, giữ lượt, áp dụng cho, điều kiện, màu) + "✦ AI gợi ý"; khối **Kênh phát** (POS khoá bật); công tắc 🚀 Chạy quảng cáo (ngân sách/ngày, 3/7/14 ngày, 5/10/25 mi); xem trước card coupon trên Community bên phải (desktop) | 4 lỗi validate · giữ lượt ≥ hạn → cảnh báo · bấm POS → câu "POS luôn bật…" · tài khoản thợ → khoá quảng cáo |
| S04-11 | POS · Check-in khách | thu ngân | Bàn phím SĐT / quét NEXORA ID; 4 nút thử nhanh (Linh khách quen · Mai có coupon Community · Trang lâu không ghé · SĐT lạ); kết quả: 🆕 Khách mới / Khách quen N lần; danh sách ưu đãi (nguồn + ✓ đủ điều kiện / ⛔ lý do), tự chọn cái đầu; nhập hoá đơn → tiết kiệm; Tính tiền & ghi nhận / Không dùng | Đủ 8 lý do từ chối trình diễn được · toast "✓ Đã áp dụng…" |
| S04-12 | POS · Quầy redeem bằng ví | thu ngân | Nhập mã + PIN (hoặc nút quét), Kiểm tra → kết quả; tick "khách mới" fallback; xác nhận | 7 lý do từ chối đúng thứ tự · thành công |
| S04-13 | POS · Báo cáo | chủ | KPI hôm nay (check-in, coupon dùng, khách tiết kiệm) + bảng chương trình × kênh (lấy → dùng %), lịch sử redeem | Nhãn "dữ liệu mẫu" |
| S04-14 | POS · QR tại quầy (in) | chủ | Poster A5 preview: tiêu đề ưu đãi, QR, `nexora.link/c/<id>`, hướng dẫn 3 bước | — |

### M05 · Tin nhắn, Gọi & Riêng tư (13)

| ID | Màn | Vai | Nội dung chính | Trạng thái cần có |
|---|---|---|---|---|
| S05-01 | Hộp thư | tất cả | Tab 💬 Tin nhắn · 👥 Nhóm chat · 📞 Cuộc gọi · 🛡️ Riêng tư & ID; card vàng "Lời mời nhắn tin [n]"; ô tìm người | Desktop: 2 cột (list + phòng chat), mobile: điều hướng |
| S05-02 | Phòng chat DM | thành viên | Bong bóng, ✓✓ đã xem, "đang nhập…", trả lời trích dẫn, cảm xúc, 🌐 Dịch, đính kèm (ảnh · **card ca làm thêm** · vị trí tiệm), 🎤 ghi âm → tin thoại + "📝 AI chép lời", tìm trong chat, gọi thoại/video | **Cảnh báo lừa đảo** dưới tin đến · guest gửi → S00-02 → tin tự gửi |
| S05-03 | Phòng lời mời nhắn tin | thành viên | Không ô soạn, không nút gọi; Chấp nhận / 🚫 Chặn & báo cáo | 2 kết quả + toast |
| S05-04 | Nhóm tiệm (POS) | thợ/chủ | Tag POS, thanh ghim (lịch tuần/tips), thành viên = nhân viên | — |
| S05-05 | Cộng đồng công khai | tất cả | Lọc Tất cả/Thành phố/Chủ đề; 6 nhóm mặc định; Tham gia 1 chạm → tin hệ thống "nhớ đọc nội quy" | — |
| S05-06 | Tìm người | thành viên | Nhận dạng NX-ID/SĐT/email/tên; kết quả; **không tìm thấy (riêng tư)** + "📲 Gửi link mời" | — |
| S05-07 | Đang gọi / trong cuộc gọi thoại | thành viên | Đang gọi → đồng hồ, 🔒 Mã hoá, Tắt mic · Loa · Phụ đề AI · Kết thúc; phụ đề `{người}: VI` + `🌐 EN` | Thu nhỏ thành pill vẫn nhắn tin được |
| S05-08 | Cuộc gọi video | thành viên | Khung video lớn/nhỏ (placeholder), Đổi cam, Camera | — |
| S05-09 | Cuộc gọi đến | thành viên | Nghe / Từ chối / Nhắn nhanh (3 câu) | Từ chối → cuộc nhỡ trong chat + tab Cuộc gọi |
| S05-10 | Lịch sử cuộc gọi | thành viên | Gọi đi/đến/nhỡ (đỏ), thời lượng, Gọi lại | — |
| S05-11 | Gọi nhóm | thành viên | Banner "● ĐANG GỌI · N người đang tham gia" + Tham gia; lưới người tham gia | — |
| S05-12 | Riêng tư | thành viên | 6 cài đặt (giá trị + mặc định doc 05) + danh sách chặn + Bỏ chặn | Tắt cảnh báo lừa đảo → toast |
| S05-13 | Thẻ NEXORA ID | thành viên | Avatar, tên, vai·thành phố, ✓ Xác minh, @nickname, NX-####, QR, link; Chia sẻ (Zalo/Messenger/SMS/Sao chép), Đổi nickname, Mời người quen | 2 lỗi nickname |

**Tổng: 7 + 10 + 12 + 9 + 14 + 13 = 65 màn** (gồm modal/sheet), mỗi màn 2 layout.

---

## 5. Dữ liệu mẫu (seed dùng chung)

- **Người:** Jessica Nguyen (thợ, NX-3107, Houston, Bột/Gel-X, license TX), Kayla Le (chủ Kayla Nails & Spa, POS), Linh Tran (khách quen 5 lần), Mai (có coupon Community), Trang (lâu không ghé 75 ngày), 6–8 thợ khác cho AI gợi ý/ca.
- **Tiệm:** Kayla Nails & Spa (Houston), Lotus Spa (Dallas), Crystal Nails (Austin) + đối tác online (Học viện Gel-X, TAX IQ).
- **Nhóm:** đúng danh sách seed doc 01 + 6 cộng đồng công khai doc 05.
- **Chương trình:** 6 chương trình phủ đủ loại ưu đãi/đối tượng/trạng thái (1 tạm dừng, 1 hết hạn, 1 hết lượt, 1 tài trợ).
- **Ca:** 5 ca đủ loại/chế độ; Jessica có 1 ca ở mỗi trạng thái chính.
- Mọi số tiền gắn `số mẫu`.

## 6. Kịch bản trình bày (8 luồng click-through)

| # | Kịch bản | Bắt đầu | Các màn |
|---|---|---|---|
| K1 | Khách chưa ĐK xem → lấy coupon → tự vào ví | Khách chưa ĐK | S04-01 → S04-03 → S00-02 → S04-04 → S04-05 → S04-06 |
| K2 | Tiệm tạo chương trình trong POS → phát lên Community | Kayla | S04-10 → S04-09 → S04-01 (thấy deal mới) → S04-14 |
| K3 | Khách tới tiệm, check-in bằng SĐT, POS tự áp coupon | Kayla (thu ngân) | S04-11 (4 nút thử) → S04-13 |
| K4 | Thợ đăng bài khoe mẫu 3 nơi; bài mua bán bị AI chặn | Jessica | S01-01 → S01-02 (chặn) → S01-03 → S01-04 → S01-01 |
| K5 | Thợ tạo hồ sơ, đăng tìm việc 1 câu; tiệm mời phỏng vấn, thợ chia sẻ SĐT | Jessica ↔ Kayla | S02-02 → S02-05 → S02-07 → (đổi vai) S02-11 → (đổi vai) S02-08 → S02-11 |
| K6 | Tiệm đăng ca party → thợ nhận & cọc → check-in → xong ca | Kayla ↔ Jessica | S03-05 → S03-01 → S03-02 → S03-03 → S03-06 · biến thể vắng mặt/huỷ muộn |
| K7 | Người lạ nhắn tin → lời mời → chấp nhận → gọi có phụ đề AI | Jessica | S05-06 → S05-03 → S05-02 (cảnh báo lừa đảo) → S05-07 → S05-10 |
| K8 | Điều khoản v1.1 → đồng ý lại | Jessica + Admin | S00-07 (phát hành) → S00-05 → S00-04 |

## 7. Tiêu chí xong (cho mỗi màn)

1. Có đủ 2 layout, chụp ở **390×844** và **1440×900**, không tràn ngang, không chồng lấn với bottom nav/header.
2. Mọi **trạng thái cần có** trong bảng §4 bấm/mô phỏng ra được.
3. Copy/lỗi/toast khớp tài liệu (kiểm bằng grep chuỗi).
4. Chỉ dùng token Nexora (không màu hex lạ ngoài bảng `DESIGN.md`).
5. `pnpm typecheck` không tăng lỗi so với baseline, 0 lỗi trong `src/prototype/community-v2/`; `pnpm build` xanh; `/community` cũ vẫn chạy như trước.

## 8. Chia luồng dựng (song song)

| Luồng | Nội dung | Phụ thuộc |
|---|---|---|
| **L0 Nền** | Scaffold, token Tailwind copy từ Nexora, shell (sidebar/pill/bottom nav), thanh demo + vai, mock store + seed, sheet đăng ký + điều khoản + resume action, component dùng chung (card, button, sheet, modal, toast, stepper, empty state), route registry | — (làm trước, duyệt shell rồi mới mở L1–L3) |
| **L1** | M01 Bảng tin/Nhóm/Chợ + M05 Tin nhắn/Gọi/Riêng tư | L0 |
| **L2** | M04 Deal & Coupon + POS Promotion/Check-in/Redeem/Báo cáo | L0 |
| **L3** | M02 Việc làm + M03 Ca làm thêm + S00-07 Admin | L0 |

**Tài nguyên dùng chung bị rào (mỗi thứ đúng 1 chủ):** `src/prototype/community-v2/store/seed.ts` + kiểu dữ liệu (L0 sở hữu, các luồng chỉ thêm slice riêng `src/prototype/community-v2/store/slices/<module>.ts`); `src/prototype/community-v2/routes.tsx` (L0 khai sẵn toàn bộ route của 65 màn trỏ tới placeholder, luồng chỉ thay file màn trong `src/prototype/community-v2/modules/<module>/`); `requireAccount()` + toast (L0); card ca làm thêm dùng trong chat (L3 sở hữu component, L1 import).

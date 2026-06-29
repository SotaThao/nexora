/**
 * Homepage interactive logic — simulator, Tax IQ, i18n, modals.
 * Wired from HomePageBridgeContext via getHomePageHandlers().
 */
import { getStoredAppLanguage, setStoredAppLanguage } from '../../utils/appLanguage.js'

let __homepageClickOutside = null

export function getInitialHomePageLanguage() {
  return getStoredAppLanguage()
}

const translations = {
  vi: {
    "nav-features": "Tính Năng",
    "nav-simulator": "Chạy Simulator",
    "nav-tax-iq": "Trợ Lý Thuế Tax IQ",
    "nav-rewards": "Cổng Khách Hàng",
    "nav-calculator": "Tính Tiết Kiệm",
    "nav-pricing": "Bảng Giá",
    "btn-login": "Đăng Nhập",
    "btn-register": "Đăng Ký",
    "btn-logout": "Thoát",
    "header-dashboard": "Tổng quan",
    "header-staff": "Cổng thợ",
    "hero-eyebrow": "✨ NỀN TẢNG KẾT NỐI KHÁCH HÀNG & THỢ THÔNG MINH",
    "hero-title-1": "Tip Thông Minh Hơn.",
    "hero-title-2": "Đánh Giá Nhanh Hơn.",
    "hero-title-grad": "Tăng Trưởng Mạnh Mẽ.",
    "hero-desc": "NEXORA TOUCH kết nối trực tiếp khách hàng, thợ phục vụ và chủ salon qua hệ thống Smart QR đa năng. Giúp nhân viên nhận 100% tiền tip không mất phí, tự động thu thập đánh giá 5 sao Google, và giữ chân khách bằng cổng loyalty tối tân.",
    "hero-btn-primary": "Trải Nghiệm Simulator",
    "hero-btn-secondary": "Ước Tính Số Tiền Tiết Kiệm",
    "hero-badge-title": "CÁC TRỤ CỘT NỀN TẢNG",
    "badge-1": "Tip Trực Tiếp",
    "badge-2": "Đánh Giá 5★",
    "badge-3": "Quét Smart QR",
    "badge-4": "Nhận Thưởng XP",
    "tab-cust": "Khách Hàng",
    "tab-staff": "Thợ Phục Vụ",
    "tab-owner": "Admin Tiệm",
    "sim-reg-banner": "🎁 Đăng Ký Thành Viên Nhận Ngay +100 XP",
    "sim-reg-desc": "Tip tích điểm, đánh giá thợ tích điểm, giới thiệu nhận ưu đãi không giới hạn!",
    "ph-reg-name": "Tên của bạn...",
    "ph-reg-phone": "(714) 555-0199",
    "ph-reg-ref": "Mã giới thiệu (nếu có)...",
    "btn-sim-reg": "Đăng Ký & Nhận Quà 100 XP",
    "has-account": "Đã có tài khoản?",
    "login-now": "Đăng nhập ngay",
    "sim-checkin": "Check-in:",
    "btn-sim-change": "Đổi tiệm",
    "sim-b2b-gifts": "🎁 Liên Minh Quà Tặng B2B",
    "sim-b2b-redeem": "Đổi chéo đối tác",
    "sim-b2b-desc": "Sử dụng điểm tích lũy của bạn tại tiệm nail để đổi lấy đặc quyền ăn uống, làm đẹp tại các cửa hàng liên kết xung quanh.",
    "sim-gift-1": "1 Ly Cafe tại Glow Coffee",
    "sim-gift-1-sub": "Chi nhánh đối diện tiệm nail",
    "sim-gift-2": "Voucher 25% tại Serene Yoga",
    "sim-gift-2-sub": "Cách tiệm nail 2 căn nhà",
    "sim-choose-staff": "Chọn thợ đang phục vụ bạn:",
    "role-nail": "Nails Art",
    "role-spa": "Trị Liệu",
    "role-skincare": "Skincare",
    "sim-tip-for": "Bồi dưỡng thợ",
    "sim-receive": "Nhận",
    "sim-reward-pts": "điểm thưởng",
    "ph-custom": "Khác",
    "sim-rate-service": "Đánh giá dịch vụ thợ:",
    "sim-rate-unsatisfied": "Hãy cho thợ biết bạn chưa hài lòng điều gì:",
    "ph-rate-private": "Ý kiến đóng góp bảo mật sẽ chuyển thẳng đến quản lý salon...",
    "btn-sim-submit-fb": "Gửi Phản Hồi Bảo Mật",
    "sim-perfect-score": "Đạt điểm tối đa!",
    "sim-redirect-msg": "Hệ thống chuyển hướng bạn đến Google Review để giúp tiệm tăng thứ hạng.",
    "sim-refer-friends": "Giới thiệu bạn bè:",
    "sim-refer-perks": "Bạn nhận +50 XP - Họ nhận +100 XP",
    "ph-refer-phone": "(714) 555-0199",
    "btn-sim-send": "Gửi",
    "sim-your-ref": "Mã giới thiệu của bạn:",
    "sim-chat-desk": "Trò chuyện với quầy lễ tân:",
    "ph-chat-desk": "Gửi tin nhắn đặt lịch, đổi thợ...",
    "sim-history-title": "📜 Lịch Sử Check-in & Dịch Vụ",
    "history-serv-1": "Làm móng Gel cao cấp",
    "history-serv-2": "Massage Trị Liệu vai gáy",
    "history-tech": "Thợ:",
    "sim-tabs-footer": "Click các Tab ở trên để xem trải nghiệm của Thợ & Chủ tiệm!",
    "staff-role": "KỸ THUẬT VIÊN TRƯỞNG NAIL",
    "staff-today-tip": "Tổng Tip Hôm Nay (Đã Tiết Kiệm: $14.50)",
    "staff-withdraw": "Rút tức thì",
    "staff-tips-count": "SỐ LƯỢT TIP",
    "staff-score-title": "ĐIỂM ĐÁNH GIÁ",
    "staff-smartqr": "Mã Smart QR Trực Tiếp",
    "staff-qr-desc": "Đặt QR này ở bàn của thợ, khách chỉ quét 1 lần để chuyển sang giao diện cá nhân hóa tức thời.",
    "owner-header-role": "QUẢN TRỊ SALON",
    "owner-sys-live": "Hệ Thống Live",
    "owner-savings-est": "Ước Tính Tiết Kiệm",
    "owner-b2b-alliance": "Liên Kết B2B",
    "owner-b2b-create-title": "🎯 Tạo Khuyến Mãi B2B Mục Tiêu",
    "owner-b2b-select-partner": "1. Chọn đối tác liên kết:",
    "owner-b2b-select-tier": "2. Nhắm tệp khách hàng:",
    "owner-b2b-set-gift": "3. Ưu đãi tặng kèm:",
    "owner-b2b-btn-activate": "Kích Hoạt Chiến Dịch B2B",
    "owner-b2b-partners": "🤝 Liên Minh Đối Tác B2B",
    "owner-partner-1": "☕ Glow Coffee (Chi nhánh đối diện)",
    "owner-partner-2": "🧘‍♀️ Serene Yoga (Cách 2 căn)",
    "owner-status-linked": "Đang Liên Kết",
    "owner-b2b-pending": "🌸 Yêu Cầu Kết Nối Chéo Từ Bloom Florist",
    "owner-b2b-waiting": "Chờ duyệt",
    "owner-b2b-pending-desc": "Khách hàng của bạn có thể đổi điểm lấy hoa và ngược lại.",
    "owner-b2b-approve": "Chấp Nhận",
    "owner-live-log": "Log Hoạt Động Thời Gian Thực",
    "log-redeem": "Chị Hồng đổi quà",
    "log-gift-1": "1 ly cafe tại Glow Coffee",
    "owner-multiplier": "Điều Chỉnh Điểm Thưởng Cho Khách",
    "owner-multiplier-sub": "Hệ số điểm tip ($1):",
    "sim-targeted-title": "🌟 Ưu Đãi Liên Kết B2B Mục Tiêu",
    "sim-targeted-badge": "Khách Hạng Vàng",
    "sim-targeted-congrats": "Chúc mừng",
    "sim-targeted-vip-msg": "! Bạn thuộc tệp khách VIP nhận ngay:",
    "sim-targeted-from": "từ đối tác",
    "sim-targeted-claim": "Nhận Ngay (MIỄN PHÍ 0 XP)",
    "sim-staff-rating": "4.9 ★ (42 lượt)",
    "sim-taxiq-assistant": "📊 NEXORA TAX IQ ASSISTANT",
    "sim-taxiq-mode": "Chế Độ 1099",
    "sim-taxiq-compliance": "🛡️ NEXORA TAX IQ TUÂN THỦ",
    "sim-taxiq-irs": "Tuân Thủ IRS",
    "b2b-section-eyebrow": "B2B ALLIANCE NETWORK",
    "b2b-section-title": "Liên Minh Điểm Thưởng Địa Phương.<br>Cùng Nhau Phát Triển.",
    "b2b-section-desc-1": "Thay vì cạnh tranh độc lập, Nexora Touch giúp bạn kết nối chặt chẽ với các doanh nghiệp không cạnh tranh trực tiếp xung quanh chi nhánh của mình (Ví dụ: Tiệm nail liên kết với tiệm coffee, shop hoa lân cận).",
    "b2b-section-desc-2": "Khách hàng thích thú khi nhận điểm thưởng bồi dưỡng thợ nail nhưng có thể đổi trực tiếp lấy cốc latte ngon miệng bên cạnh, hoặc mua hoa tươi giảm giá. Trải nghiệm liên kết chéo này giữ chân khách ở lại khu phố của bạn và liên tục tạo ra lượng khách hàng quen mới chất lượng cao được giới thiệu chéo từ các đối tác.",
    "b2b-metric-1": "Lượt Khách Chéo Trao Đổi",
    "b2b-metric-2-title": "1 Thẻ Thành Viên",
    "b2b-metric-2-sub": "Dùng Cho Cả Khu Phố",
    "b2b-feat-1-title": "Liên Kết Chéo Một Chạm",
    "b2b-feat-1-desc": "Kết nối dễ dàng bằng cách gửi lời mời liên minh trực tiếp thông qua số hiệu mã doanh nghiệp trên hệ thống.",
    "b2b-feat-2-title": "Báo Cáo Đối Soát Minh Bạch",
    "b2b-feat-2-desc": "Hệ thống Nexora tự động đối soát chính xác số điểm và voucher đã được đổi chéo giữa các cửa hàng cuối tháng.",
    "b2b-feat-3-title": "Hệ Thống Tránh Trùng Lặp",
    "b2b-feat-3-desc": "Đảm bảo mỗi nhóm liên kết B2B chỉ có duy nhất 1 đại diện cho mỗi ngành hàng để tránh xung đột lợi ích nội bộ.",
    "b2b-feat-4-title": "Sáng Tạo Chiến Dịch Group",
    "b2b-feat-4-desc": "Lên kế hoạch khuyến mãi nhóm cho cả khu phố dịp cuối tuần hoặc lễ hội để thu hút toàn bộ dân cư xung quanh.",
    "vt-eyebrow": "XEM CÁCH HOẠT ĐỘNG THỰC TẾ",
    "vt-title": "Video Trực Quan Trải Nghiệm Khách Hàng",
    "vt-desc": "Tìm hiểu xem một tiệm nail nghệ thuật hoặc trung tâm thẩm mỹ tăng trưởng 40% doanh thu bồi dưỡng thợ và tích hợp 1000+ review vàng Google chỉ trong một nốt nhạc bằng cách nào.",
    "vt-start": "BẮT ĐẦU XEM VIDEO GIỚI THIỆU (1 PHÚT)",
    "vt-start-sub": "Video trình bày chi tiết cách vận hành quét QR, bồi dưỡng thợ & tích cực Google Reviews",
    "cr-eyebrow": "CỔNG TIỆN ÍCH KHÁCH HÀNG",
    "cr-title": "Tra Cứu Nhanh Điểm Thưởng Thành Viên",
    "cr-desc": "Hệ sinh thái NEXORA tạo dựng một trải nghiệm xuyên suốt. Khách hàng không cần cài đặt ứng dụng cồng kềnh, chỉ cần nhập số điện thoại là có thể tra cứu ngay hạng thẻ thành viên, số điểm tích lũy, các voucher ưu đãi hiện có và tiến độ đổi quà trực quan.",
    "cr-tips-prompt": "Bạn có thể sử dụng các SĐT Demo:",
    "cr-tips-prompt-sub": "để xem tài khoản ảo thay đổi ngay trên giao diện bên phải.",
    "cr-card-title": "Nhập Số Điện Thoại Tra Cứu",
    "ph-cr-lookup": "(714) 555-0199",
    "btn-cr-lookup": "Tra Cứu",
    "btn-ai-tax": "Dùng Trí Tuệ Nhân Tạo Tối Ưu Thuế Khẩn Cấp",
    "cr-card-progress": "Tiến độ quà tặng tiếp theo:",
    "cr-card-perk": "Ưu đãi độc quyền của bạn:",
    "calc-eyebrow": "💵 KHÔNG MẤT PHÍ ĐẠI LÝ MERCHANT",
    "calc-title": "Cắt Giảm Phí Quẹt Thẻ Cho Tiền Bồi Dưỡng",
    "calc-desc": "Khi tiệm nail, spa gộp tiền bồi dưỡng thợ vào hóa đơn quẹt thẻ, chủ tiệm phải chịu trung bình 3% phí thanh toán thẻ tín dụng. Hãy xem số tiền bạn tiết kiệm được khi định tuyến tip trực tiếp qua Nexora.",
    "calc-slider-label": "Tổng Lượng Tiền Tip Của Cửa Hàng / Tháng:",
    "calc-mo": "tháng",
    "calc-stat-1": "Mức Phí Quẹt Thẻ Trung Bình",
    "calc-stat-2": "Số Tiền Thất Thoát / Năm",
    "calc-stat-3": "SỐ TIỀN THỰC TẾ TIẾT KIỆM / NĂM",
    "feat-eyebrow": "HỆ THỐNG GẮN KẾT 360 ĐỘ",
    "feat-title": "Tính Năng Đột Phá Hỗ Trợ Tăng Trưởng",
    "feat-desc": "Tối ưu hóa hành trình phục vụ cho thợ, tăng cường đánh giá tốt cho chủ tiệm, và tặng thưởng cho khách hàng.",
    "feat-1-title": "Định Tuyến Tiền Tip Trực Tiếp",
    "feat-1-desc": "Cho phép khách hàng gửi tiền bồi dưỡng trực tiếp vào ví cá nhân của thợ (Zelle, Venmo, Cash App). Giải quyết triệt để bài toán đối chiếu và chia quỹ tiền tip cuối ngày.",
    "feat-2-title": "Đánh Giá Google / Yelp Tự Động",
    "feat-2-desc": "Hệ thống nhận diện điểm đánh giá cao của khách, định tuyến thẳng ra Google để bùng nổ số lượng rating 5 sao, đồng thời chặn đứng đánh giá xấu thông qua phiếu đóng góp nội bộ.",
    "feat-3-title": "Cơ Chế Điểm Thưởng Gamification",
    "feat-3-desc": "Tự động tích lũy điểm thưởng khi khách hàng tip cho thợ, viết đánh giá cho tiệm, check-in hoặc giới thiệu bạn bè sử dụng dịch vụ. Khách có thể đổi điểm nhận ngay quà ưu đãi miễn phí.",
    "feat-4-title": "Quét Smart QR Đa Nhiệm",
    "feat-4-desc": "Thay thế toàn bộ tập hợp bảng QR cũ nát trên bàn lễ tân. Với 1 mã duy nhất, hỗ trợ thanh toán, liên kết hồ sơ thợ, cổng đăng nhập loyalty và điều phối đánh giá salon.",
    "feat-5-title": "Hồ Sơ Thợ Cá Nhân Hóa",
    "feat-5-desc": "Thiết kế không gian quản lý thông số riêng cho từng thợ phục vụ: thông báo tức thì khi nhận tip, theo dõi lịch sử số sao đánh giá, và kết nối nhanh các tài khoản ví thụ hưởng.",
    "feat-6-title": "Admin Dashboard Thống Kê Tổng",
    "feat-6-desc": "Cho phép chủ salon kiểm soát tổng quát toàn bộ hiệu suất hoạt động kinh doanh: ước lượng số tiền phí tiết kiệm, quản lý đội ngũ thợ thực tế và tối ưu hóa luật chơi tích lũy loyalty cho khách.",
    "pr-eyebrow": "BẢNG GIÁ TRONG SÁNG",
    "pr-title": "Kế Hoạch Linh Hoạt Cho Mọi Quy Mô",
    "pr-desc": "Tải và đăng ký bắt đầu sử dụng hoàn toàn miễn phí các tính năng quét Smart QR, sau đó nâng cấp hệ thống tích điểm nâng cao khi tiệm mở rộng.",
    "plan-free-title": "Lite Pack",
    "plan-free-desc": "Dành cho tiệm từ 5 thợ trở xuống. Yêu cầu xác minh doanh nghiệp (KYB).",
    "plan-free-feat-1": "Tối đa 5 thợ hoạt động",
    "plan-free-feat-2": "Bắt buộc xác minh KYB",
    "plan-free-feat-3": "Thiết lập Smart QR cơ bản",
    "plan-free-feat-4": "Định tuyến nhận tiền tip trực tiếp",
    "btn-plan-free": "Đăng Ký Miễn Phí (Cần KYB)",
    "plan-1-title": "Starter Pack",
    "plan-1-desc": "Phù hợp cho thợ làm việc tự do hoặc tiệm quy mô nhỏ",
    "plan-1-feat-1": "Thiết lập Smart QR theo bàn",
    "plan-1-feat-2": "Định tuyến chuyển khoản bồi dưỡng",
    "plan-1-feat-3": "Liên kết đánh giá Google cơ bản",
    "plan-1-feat-4": "Báo cáo tổng hợp tiền tip định kỳ",
    "btn-plan-start": "Bắt Đầu Ngay",
    "plan-pro-badge": "KHUYÊN DÙNG CHO TIỆM NAIL & SPA",
    "plan-2-title": "Professional Pro",
    "plan-2-desc": "Lựa chọn tuyệt vời cho các Salon & Day Spa trung bình",
    "plan-2-feat-1": "Toàn bộ tính năng gói Starter",
    "plan-2-feat-2": "Tài khoản quản trị độc lập cho thợ",
    "plan-2-feat-3": "Gắn kết tự động bồi dưỡng không mất phí",
    "plan-2-feat-4": "Tùy chỉnh hệ số tích điểm Loyalty khách hàng",
    "plan-2-feat-5": "Phân loại và tiếp cận danh sách khách quen",
    "btn-plan-pro": "Đăng Ký Gói Pro",
    "plan-3-title": "Enterprise Group",
    "plan-3-desc": "Dành cho chuỗi thương hiệu nhiều chi nhánh",
    "plan-3-price": "Thỏa thuận",
    "plan-3-price-sub": "thương lượng",
    "plan-3-feat-1": "Hỗ trợ vận hành nhiều chi nhánh lớn",
    "plan-3-feat-2": "Đồng bộ API hóa đơn thanh toán POS",
    "plan-3-feat-3": "Nhận thiết kế thẻ Smart QR cứng NFC cao cấp",
    "plan-3-feat-4": "Đội ngũ kỹ thuật hỗ trợ trực tuyến 24/7",
    "btn-plan-ent": "Liên Hệ Phòng Kinh Doanh",
    "cta-title": "Khởi Động Tăng Trưởng Quy Mô Salon Của Bạn",
    "cta-desc": "Nâng tầm cuộc sống đội ngũ thợ, xây dựng cộng đồng khách hàng trung thành vững mạnh và đẩy mạnh thứ hạng tiệm trên các nền tảng số ngay hôm nay.",
    "btn-cta-1": "Đăng Ký Tư Vấn & Setup Thử Nghiệm",
    "btn-cta-2": "Dùng Thử Bản Giả Lập",
    "footer-copyright": "© 2026 NEXORA TOUCH. Tip Smarter. Review Faster. Grow Stronger.",
    "footer-link-1": "Chính Sách Bảo Mật",
    "footer-link-2": "Điều Khoản Vận Hành",
    "footer-link-3": "Kết Nối Hệ Sinh Thái VLINKPAY",
    "footer-nav-title": "Liên kết",
    "footer-social": "Kết nối với chúng tôi",
    "footer-rights": "Bảo lưu mọi quyền.",
    "footer-subtext": "Kiến tạo bằng tất cả tình cảm cho những tiệm phục vụ xuất sắc.",
    "modal-demo-title": "Đặt Lịch Nhận Setup Demo Miễn Phí",
    "modal-demo-desc": "Chúng tôi sẽ liên hệ để tư vấn giải pháp thiết kế in ấn Smart QR riêng biệt cho tiệm của bạn.",
    "modal-field-name": "Họ Và Tên Của Bạn",
    "modal-field-salon": "Tên Salon / Spa",
    "modal-field-email": "Email Nhận Lịch Hẹn",
    "modal-field-size": "Số Thợ Trong Tiệm",
    "modal-field-state": "Tỉnh / Thành Phố",
    "btn-modal-demo-submit": "Gửi Yêu Cầu Setup Miễn Phí",
    "btn-modal-demo-soon": "(Sắp Ra Mắt)",
    "tab-login-btn": "Đăng Nhập",
    "tab-register-btn": "Đăng Ký Thành Viên",
    "auth-email-label": "Email",
    "auth-pass-label": "Mật khẩu",
    "btn-auth-confirm-login": "Xác Nhận Đăng Nhập",
    "btn-auth-confirm-login-soon": "(Sắp Ra Mắt)",
    "auth-login-prompt": "Mẹo test nhanh: Điền SĐT (714) 555-0199 và mật khẩu bất kỳ!",
    "auth-name-label": "Họ và Tên",
    "auth-reg-email-label": "Email",
    "auth-reg-pass-label": "Mật khẩu",
    "auth-reg-ref-label": "Mã Giới Thiệu",
    "btn-auth-confirm-reg": "Hoàn Tất Đăng Ký Nhận Thưởng",
    "btn-auth-confirm-reg-soon": "(Sắp Ra Mắt)",
    "tax-landing-title": "NEXORA Tax IQ — Tối Ưu Khoản Khấu Trừ Nhanh",
    "tax-landing-desc-1": "Thu nhập tiền bồi dưỡng và thu nhập từ hợp đồng độc lập có thể tạo ra các nghĩa vụ thuế phức tạp—đặc biệt khi phân biệt giữa nhân viên salon W2 và nhà thầu độc lập 1099.",
    "tax-landing-desc-2": "Tax IQ giúp chủ tiệm nail và kỹ thuật viên xác định các khoản khấu trừ phổ biến, chuẩn bị tài liệu chi phí và hiểu ước tính tiết kiệm thuế—trước khi gửi hồ sơ cho CPA hoặc chuyên gia thuế.",
    "tax-substat-1": "Chuẩn Bị Tài Liệu Trước Khi Khai Thuế",
    "tax-substat-2": "Rà Soát Khoản Khấu Trừ Bằng AI",
    "tax-iq-sum-heading": "④ Tóm Tắt Thuế Ước Tính",
    "tax-iq-sum-liability": "Thuế Phải Nộp (Ước Tính)",
    "tax-iq-sum-gross": "Tổng Thu Nhập",
    "tax-iq-sum-deductions": "Khoản Khấu Trừ Đã Chọn",
    "tax-iq-sum-taxable": "Thu Nhập Chịu Thuế (Ước Tính)",
    "tax-iq-sum-savings": "Tiết Kiệm Thuế (Ước Tính)",
    "tax-iq-sum-missing": "Thiếu Biên Lai",
    "tax-iq-sum-cpa": "Cần CPA Xem Xét",
    "tax-iq-sum-footnote": "Đây là ước tính dùng để lập kế hoạch, có thể thay đổi sau khi CPA xem xét, tùy tình trạng khai thuế, quy định thuế tiểu bang và thu nhập thực tế cuối kỳ.",
    "tax-iq-btn-review": "Xem Xét Với Tax IQ",
    "tax-iq-disclaimer": "Chỉ là ước tính. Đây không phải tư vấn thuế. Cần được CPA hoặc chuyên gia thuế xem xét trước khi nộp.",
    "tax-iq-app-subtitle": "Tối Ưu Khoản Khấu Trừ Nhanh",
    "tax-iq-badge-ai": "Hỗ Trợ Bởi AI",
    "tax-iq-block1": "① Hồ Sơ Thuế",
    "tax-role-staff-title": "Kỹ Thuật Viên",
    "tax-role-staff-sub": "Thợ / 1099",
    "tax-role-owner-title": "Chủ Tiệm",
    "tax-role-owner-sub": "Chủ / Nhiều Chi Nhánh",
    "tax-iq-income-label": "Tổng Thu Nhập Năm Ước Tính",
    "tax-type-booth": "Người Thuê Bàn",
    "tax-type-multi": "Chủ Nhiều Chi Nhánh",
    "tax-status-married-sep": "Gia Đình (Khai Riêng)",
    "tax-iq-optional": "(tùy chọn)",
    "tax-iq-block2": "② Tra Cứu Nhanh: Danh Mục Khấu Trừ",
    "tax-iq-block3": "③ Chọn Chi Phí Thực Tế Của Bạn",
    "tax-iq-btn-scan": "📷 Quét Biên Lai",
    "tax-iq-btn-add": "+ Thêm",
    "tax-iq-expenses-desc": "Chọn các khoản bạn đã chi trả. Tax IQ sẽ kiểm tra biên lai, thông tin thiếu và nhu cầu CPA xem xét.",
    "tax-chk-phone-title": "📱 Điện Thoại & Internet",
    "tax-badge-needs-log": "Cần Nhật Ký Số Dặm",
    "tax-badge-ready": "Sẵn Sàng",
    "tax-badge-missing-proof": "Thiếu Bằng Chứng",
    "tax-badge-partial": "Khấu Trừ Một Phần",
    "tax-act-add-trip": "Thêm Chi Tiết Hành Trình",
    "tax-act-upload-receipt": "Tải Lên Biên Lai",
    "tax-act-view-receipt": "Xem Biên Lai",
    "tax-act-upload-proof": "Tải Lên Bằng Chứng",
    "tax-act-confirm-pct": "Xác Nhận %",
    "tax-act-trip-done": "Đã Thêm Nhật Ký ✓",
    "tax-act-receipt-done": "Biên Lai Đã Xác Minh ✓",
    "tax-act-ready-done": "Sẵn Sàng ✓",
    "tax-act-proof-done": "Bằng Chứng Đã Xác Minh ✓",
    "tax-act-confirmed-done": "Đã Xác Nhận ✓",
    "tax-act-view-log": "Xem Nhật Ký",
    "tax-act-view-proof": "Xem Bằng Chứng",
    "tax-act-view-details": "Xem Chi Tiết",
    "tax-act-uploading": "Đang Tải Lên…",
    "tax-act-verifying": "Đang Xác Minh Biên Lai…",
    "tax-act-verified": "Biên Lai Đã Xác Minh ✓  Khoản Khấu Trừ Đã Xác Nhận.",
    "tax-feat-1-title": "Tự Động Hóa Biểu Mẫu 1099",
    "tax-feat-1-desc": "Liên kết trực tiếp dòng tiền bồi dưỡng để tự xuất các biểu mẫu thuế IRS 1099 cho thợ mà không làm phiền chủ tiệm.",
    "tax-feat-2-title": "Hạn Chế Rủi Ro Kiểm Toán",
    "tax-feat-2-desc": "Lưu trữ nhật ký định tuyến dòng tiền bồi dưỡng rõ ràng, bảo vệ chủ tiệm khỏi rủi ro phân loại sai nhân sự.",
    "tax-est-withholding": "Thuế tạm tính (15%)",
    "tax-legal-deductions": "Khấu trừ hợp pháp",
    "btn-tax-optimize": "Tối Ưu Khấu Trừ Thuế Bằng AI",
    "tax-safety-rating": "Độ an toàn kiểm toán:",
    "tax-staff-reported": "Khai báo thuế thợ 1099:",
    "tax-automated-forms": "Biểu mẫu tự động hóa:",
    "btn-tax-export-reports": "Xuất Tờ Khai Thuế B2B & 1099",
    "tax-filing-status": "Tình trạng khai thuế",
    "tax-status-single": "Độc thân",
    "tax-status-married": "Gia đình (Khai chung)",
    "tax-status-hoh": "Chủ hộ (Mẹ/Bố đơn thân)",
    "tax-worker-type": "Hình thức làm việc",
    "tax-type-1099": "Thợ 1099 (Nhà thầu)",
    "tax-type-w2": "Thợ W2 (Nhân viên)",
    "tax-type-owner": "Chủ tiệm (Salon Owner)",
    "tax-children-count": "Số con dưới 17 tuổi",
    "tax-income-label": "Tổng thu nhập năm ước tính ($)",
    "tax-result-refund": "SỐ TIỀN ĐƯỢC HOÀN LẠI (REFUND)",
    "tax-result-due": "THUẾ THỰC TẾ PHẢI NỘP (TAX DUE)",
    "tax-result-saved": "TIỀN THUẾ TIẾT KIỆM ĐƯỢC (SAVED)",
    "tax-search-label": "🔍 Tra cứu nhanh các mục được miễn trừ thuế",
    "tax-checklist-label": "Tích chọn chi phí thực tế của bạn để khấu trừ thuế:",
    "tax-chk-mileage-title": "🚗 Số Dặm Đi Lại",
    "tax-chk-mileage-desc": "Khấu trừ theo định mức IRS: $1,005",
    "tax-chk-supplies-title": "💅 Sơn Gel, Cọ, Đèn Sấy UV",
    "tax-chk-supplies-desc": "Chi phí mua sắm dụng cụ: $450",
    "tax-chk-license-title": "🎓 Lệ Phí Bằng Tiểu Bang",
    "tax-chk-license-desc": "Chi phí học tập, nâng cao: $150",
    "tax-chk-rent-title": "🏢 Tiền Thuê Bàn",
    "tax-chk-rent-desc": "Khấu trừ chi phí mặt bằng: $1,200",
    "opt-child-0": "0 con",
    "opt-child-1": "1 con (-$2,000 Credit)",
    "opt-child-2": "2 con (-$4,000 Credit)",
    "opt-child-3": "3 con (-$6,000 Credit)",
    "toast-gift-form-empty": "⚠️ Vui lòng nhập thông tin phần quà khuyến mãi!",
    "toast-b2b-match": "🎯 Khớp mục tiêu B2B! Khách hàng {0} thuộc tệp mục tiêu!",
    "toast-b2b-activated": "🎯 Chiến dịch đã kích hoạt! Hệ thống đã ghi nhận cấu hình.",
    "toast-points-short": "⚠️ Không đủ điểm! Bạn cần thêm {0} XP nữa.",
    "toast-redeem-success": "🎉 Đổi thành công {0} tại đối tác {1}!",
    "toast-staff-selected": "Đã chọn thợ phục vụ: {0}",
    "toast-register-required-tip": "⚠️ Vui lòng đăng ký tài khoản để bắt đầu tip.",
    "toast-tip-success": "🎉 Tip thành công ${0} cho {1} qua {2}!",
    "toast-register-required-rating": "⚠️ Vui lòng đăng ký trước khi đánh giá.",
    "toast-review-public": "Tuyệt! Bạn nhận +15 XP nhờ chia sẻ review 5 sao!",
    "toast-review-private": "Cảm ơn! Ý kiến của bạn đã được chuyển đến quản lý.",
    "toast-feedback-empty": "Vui lòng nhập phản hồi.",
    "toast-feedback-sent": "Gửi góp ý thành công! Quản lý đã nhận được.",
    "toast-reg-required": "⚠️ Vui lòng điền đủ Tên và Số điện thoại!",
    "toast-reg-success": "🎉 Đăng ký thành công! Nhận ngay +100 XP chào mừng!",
    "toast-referral-copied": "📋 Đã sao chép mã giới thiệu: {0}",
    "toast-logged-out": "Đã đăng xuất tài khoản thành viên.",
    "toast-referral-empty": "⚠️ Vui lòng điền số điện thoại bạn bè để gửi mã!",
    "toast-referral-sent": "🎉 Giới thiệu thành công! Nhận thêm +50 XP khi bạn bè đăng ký.",
    "toast-msg-empty": "Vui lòng nhập tin nhắn!",
    "toast-msg-sent": "📩 Đã chuyển tin nhắn của bạn đến lễ tân tiệm!",
    "toast-phone-empty": "⚠️ Vui lòng nhập số điện thoại để kiểm tra điểm thưởng!",
    "toast-user-found": "Tìm thấy tài khoản: {0}!",
    "toast-user-notfound": "Không tìm thấy số này. Đăng ký ngay để tích điểm!",
    "toast-tax-optimized": "💡 Tax IQ: Các khoản chi phí đã được tối ưu hóa!",
    "toast-tax-ai": "💡 Tax IQ: AI đã phát hiện 3 khoản khấu trừ hợp lệ!",
    "toast-tax-auto": "🎉 AI: Đã kích hoạt tối đa các khoản khấu trừ hợp lệ!",
    "toast-tax-download": "📥 Các biểu mẫu 1099-NEC & 1099-K đã sẵn sàng tải!",
    "toast-login-success": "Đăng nhập thành công!",
    "toast-register-success": "Đăng ký thành viên thành công! Nhận +100 XP!",
    "toast-demo-success": "Gửi yêu cầu thành công! Chúng tôi sẽ liên hệ lại sớm.",
    "toast-points-rule": "Hệ số điểm đổi thành: {0}x",
    "toast-checkin-swapped": "📍 Đã đổi điểm check-in sang: {0}",
    "toast-b2b-linked": "🤝 Bloom Florist đã liên kết hệ thống B2B thành công!",
    "txt-tx-count": "{0} lượt bồi dưỡng",
    "txt-partners-count": "{0} Cửa Hàng",
    "txt-greeting": "Xin chào, {0}",
    "ph-demo-name": "Nguyễn Văn A",
    "ph-demo-business": "Spa Nghệ Thuật",
    "ph-demo-email": "contact@example.com",
    "ph-demo-city": "Hồ Chí Minh",
    "ph-tax-search": "Gõ từ khóa (Ví dụ: mileage, nail supplies...)",
    "ph-b2b-gift": "Tặng bánh ngọt / Free Gel sấy...",
    "opt-size-1": "1 - 5 nhân viên",
    "opt-size-2": "6 - 15 nhân viên",
    "opt-size-3": "16 - 30 nhân viên",
    "opt-size-4": "Chuỗi trên 30 người",
    "opt-tier-gold": "Hạng Vàng (VIP)",
    "opt-tier-silver": "Hạng Bạc",
    "opt-tier-diamond": "Hạng Kim Cương",
    "header-guest": "Xin chào, khách",
    "lbl-zelle": "Zelle (Không phí)",
    "lbl-b2b-status": "Đang Liên Kết",
    "lbl-b2b-partner": "🌸 Bloom Florist (Đầu ngã tư)",
    "tax-search-empty": "❌ Không tìm thấy danh mục chi phí này.",
    "err-required": "Vui lòng nhập thông tin này",
    "err-email-invalid": "Email không hợp lệ"
  },
  en: {
    "nav-features": "Features",
    "nav-simulator": "Live Demo",
    "nav-tax-iq": "Tax IQ Assistant",
    "nav-rewards": "Customer Portal",
    "nav-calculator": "Calculator",
    "nav-pricing": "Pricing",
    "btn-login": "Login",
    "btn-register": "Sign Up",
    "btn-logout": "Logout",
    "header-dashboard": "Dashboard",
    "header-staff": "Staff",
    "hero-eyebrow": "✨ CLIENT & STAFF SYNERGY ENGAGEMENT HUB",
    "hero-title-1": "Tip Smarter.",
    "hero-title-2": "Review Faster.",
    "hero-title-grad": "Grow Stronger.",
    "hero-desc": "NEXORA TOUCH bridges connections between customers, specialists, and salon owners through unified QR nodes. Empower technicians with zero interchange fee direct tip margins, scale verified Google 5-star cards organically, and build reliable neighborhood co-op rewards.",
    "hero-btn-primary": "Test Live Simulator",
    "hero-btn-secondary": "Calculate Net Savings",
    "hero-badge-title": "CORE ARCHITECTURE NODES",
    "badge-1": "Direct Tip P2P",
    "badge-2": "Google 5★ Push",
    "badge-3": "Smart Unified QR",
    "badge-4": "Loyalty Point XP",
    "tab-cust": "Customer View",
    "tab-staff": "Staff Portal",
    "tab-owner": "Salon Admin",
    "sim-reg-banner": "🎁 Join Program & Claim +100 XP Welcome Perk",
    "sim-reg-desc": "Earn loyalty points for tipping, leaving star reviews, and referring local friends on checkout!",
    "ph-reg-name": "Enter your name...",
    "ph-reg-phone": "(714) 555-0199",
    "ph-reg-ref": "Referral code (if any)...",
    "btn-sim-reg": "Create Loyalty Profile (+100 XP)",
    "has-account": "Already registered?",
    "login-now": "Log in here",
    "sim-checkin": "Check-in Placed:",
    "btn-sim-change": "Switch Store",
    "sim-b2b-gifts": "🎁 B2B Alliance Rewards",
    "sim-b2b-redeem": "Swap Partner Perks",
    "sim-b2b-desc": "Exchange accumulated boutique points for delicious drinks or boutique fitness trials with adjacent neighborhood entities.",
    "sim-gift-1": "1 Free Latte at Glow Coffee",
    "sim-gift-1-sub": "Connected coffee shop across screen",
    "sim-gift-2": "25% Off Herbal Yoga Session",
    "sim-gift-2-sub": "Active yoga studio 2 doors down",
    "sim-choose-staff": "Select served workstation:",
    "role-nail": "Nails Artist",
    "role-spa": "Massage Pro",
    "role-skincare": "Skincare Lead",
    "sim-tip-for": "Tipping workstation",
    "sim-receive": "Receive",
    "sim-reward-pts": "reward points",
    "ph-custom": "Custom",
    "sim-rate-service": "Rate current visit score:",
    "sim-rate-unsatisfied": "Direct suggestions privately to shop owner:",
    "ph-rate-private": "Constructive details route straight to secure executive inbox...",
    "btn-sim-submit-fb": "Submit Safe Review",
    "sim-perfect-score": "Perfect Score!",
    "sim-redirect-msg": "Redirecting smoothly to Google Map cards to scale organic business visibility.",
    "sim-refer-friends": "Refer adjacent friends:",
    "sim-refer-perks": "You earn +50 XP - Friend gets +100 XP",
    "ph-refer-phone": "(714) 555-0199",
    "btn-sim-send": "Send",
    "sim-your-ref": "Your referral code tag:",
    "sim-chat-desk": "Ping live receptionist desk:",
    "ph-chat-desk": "Submit visit schedule or desk help notes...",
    "sim-history-title": "📜 Validated Service History Ledger",
    "history-serv-1": "Premium Gel Nails Overlay",
    "history-serv-2": "Upper Back & Shoulder Massages",
    "history-tech": "Staff:",
    "sim-tabs-footer": "Switch active tabs above to interact with staff & salon manager panels!",
    "staff-role": "LEAD NAIL ART SPECIALIST",
    "staff-today-tip": "Total Tips Today (Avoided interchange: $14.50)",
    "staff-withdraw": "Instant Cashout",
    "staff-tips-count": "TOTAL TRANSACTIONS",
    "staff-score-title": "RATING AVERAGE",
    "staff-smartqr": "Personalized Desk Smart QR",
    "staff-qr-desc": "Each technician desk holds one multi-wallet QR card. Mobile scans resolve directly to personal wallets.",
    "owner-header-role": "OWNER PORTAL CONTROL",
    "owner-sys-live": "Ecosystem Live",
    "owner-savings-est": "Processing Fees Avoided",
    "owner-b2b-alliance": "Active B2B Alliance",
    "owner-b2b-create-title": "🎯 Formulate Targeted B2B Campaigns",
    "owner-b2b-select-partner": "1. Select alliance entity:",
    "owner-b2b-select-tier": "2. Choose client segment:",
    "owner-b2b-set-gift": "3. Promotion reward gift:",
    "owner-b2b-btn-activate": "Activate B2B Campaign Node",
    "owner-b2b-partners": "🤝 Local Neighborhood Alliances",
    "owner-partner-1": "☕ Glow Coffee (Directly opposite)",
    "owner-partner-2": "🧘‍♀️ Serene Yoga (2 doors down)",
    "owner-status-linked": "Connected Node",
    "owner-b2b-pending": "🌸 Connection request from Bloom Florist",
    "owner-b2b-waiting": "Pending Approval",
    "owner-b2b-pending-desc": "Cross exchange points so client profiles can trade florist goods.",
    "owner-b2b-approve": "Accept Link",
    "owner-live-log": "Real-time Operations Log feed",
    "log-redeem": "Client swapped partner points",
    "log-gift-1": "1 free coffee at Glow Coffee",
    "owner-multiplier": "Adjust Loyalty Point Scale",
    "owner-multiplier-sub": "Loyalty points per tipped dollar:",
    "sim-targeted-title": "🌟 Targeted B2B Alliance Offer",
    "sim-targeted-badge": "Gold Tier Member",
    "sim-targeted-congrats": "Congratulations",
    "sim-targeted-vip-msg": "! You're in our VIP segment and qualify for:",
    "sim-targeted-from": "from partner",
    "sim-targeted-claim": "Claim Now (FREE 0 XP)",
    "sim-staff-rating": "4.9 ★ (42 reviews)",
    "sim-taxiq-assistant": "📊 NEXORA TAX IQ ASSISTANT",
    "sim-taxiq-mode": "1099 Mode",
    "sim-taxiq-compliance": "🛡️ NEXORA TAX IQ COMPLIANCE",
    "sim-taxiq-irs": "IRS Compliant",
    "b2b-section-eyebrow": "B2B LOCAL CO-OP NETWORKS",
    "b2b-section-title": "Cross-promote with adjacent brands.<br>Scale business volumes together.",
    "b2b-section-desc-1": "Stop marketing your storefront alone. Nexora Touch allows non-competing merchants (e.g., nail salons, neighboring cafes, flower studios) to connect operations under one cooperative alliance.",
    "b2b-section-desc-2": "Customers earn points while tipping technicians but can redeem those points for delicious drinks or boutique gifts next door. This drives organic foot traffic and shares premium localized client pools automatically.",
    "b2b-metric-1": "Cross-Referral Traffic Spikes",
    "b2b-metric-2-title": "1 Unified Card Ledger",
    "b2b-metric-2-sub": "Unites Entire Neighborhood",
    "b2b-feat-1-title": "One-Click Co-op Partnerships",
    "b2b-feat-1-desc": "Instantly establish alliances by typing in neighboring partner business codes.",
    "b2b-feat-2-title": "Automated Monthly Audits",
    "b2b-feat-2-desc": "Our secure backend ledger keeps track of points, balances, and cross-redemptions accurately.",
    "b2b-feat-3-title": "Category Exclusivity Protects",
    "b2b-feat-3-desc": "Only one merchant per retail vertical is allowed in each local alliance node to safeguard sales.",
    "b2b-feat-4-title": "Co-op Weekend Block Promos",
    "b2b-feat-4-desc": "Coordinate block-wide joint marketing drives dynamically to captivate the local demographic.",
    "vt-eyebrow": "PLAY OVERVIEW WALKTHROUGH",
    "vt-title": "How Nexora Touch Drives Growth",
    "vt-desc": "Discover how standard retail stores scale technician tips by 40%, lock in thousands of organic Google stars, and drive repeat visits via co-ops.",
    "vt-start": "PLAY INTRODUCTORY BRIEF (1 MIN)",
    "vt-start-sub": "Walk through instant peer QR routing, Google ratings optimization, and B2B workflows.",
    "cr-eyebrow": "CLIENT LOYALTY PORTAL",
    "cr-title": "Instant Membership Points Lookup Hub",
    "cr-desc": "Nexora operates cleanly without forcing complex application installs on customer phones. Enter any registered phone below to check active tiers, cross-alliance point totals, and ready vouchers.",
    "cr-tips-prompt": "Try registered demo phone numbers:",
    "cr-tips-prompt-sub": "to observe instant updates rendering directly in the mockup screen.",
    "cr-card-title": "Enter Customer Phone Number to Query",
    "ph-cr-lookup": "(714) 555-0199",
    "btn-cr-lookup": "Check Profile",
    "btn-ai-tax": "AI-Powered Tax Optimization",
    "cr-card-progress": "Next reward unlock milestone:",
    "cr-card-perk": "Exclusive Connected Alliance Perk:",
    "calc-eyebrow": "💵 RECOVER INTERCHANGE REVENUES",
    "calc-title": "Reclaim Merchant Processing Costs on Tips",
    "calc-desc": "Saddling technician tips onto standard checkouts forces boutique owners to bleed average 3.0% interchange fees. Swap to direct P2P routing to completely bypass merchant terminal fees.",
    "calc-slider-label": "Total Monthly Tip Volume across Business:",
    "calc-mo": "mo",
    "calc-stat-1": "Average Terminal Processing Rate",
    "calc-stat-2": "Annual Lost Revenue on Standard Checkout",
    "calc-stat-3": "ESTIMATED NET ANNUAL MERCHANT SAVINGS",
    "feat-eyebrow": "COMPREHENSIVE CORE SUITE",
    "feat-title": "Engineered Specifically for High-Growth Brands",
    "feat-desc": "Tackle every client transaction. Automate feedback pipelines, save processing costs, and engage customers seamlessly.",
    "feat-1-title": "Direct Tip Routing",
    "feat-1-desc": "Let customers send gratuity directly to each technician's personal wallet (Zelle, Venmo, Cash App). Eliminates end-of-day tip pooling disputes and interchange fees entirely.",
    "feat-2-title": "Automated Google / Yelp Reviews",
    "feat-2-desc": "Detects high satisfaction scores and routes clients to Google to amplify 5-star ratings organically, while redirecting critical feedback to a private internal inbox.",
    "feat-3-title": "Gamification Loyalty Points",
    "feat-3-desc": "Automatically awards XP points when customers tip, leave reviews, check in, or refer friends. Points redeem instantly for free perks and exclusive partner vouchers.",
    "feat-4-title": "Multi-Function Smart QR",
    "feat-4-desc": "Replaces scattered legacy QR boards at the front desk. One unified code handles payments, staff profile links, loyalty sign-in, and review routing for the entire salon.",
    "feat-5-title": "Personalized Staff Profiles",
    "feat-5-desc": "Each technician gets a private performance dashboard with instant tip notifications, star-rating history tracking, and fast links to their connected payout wallets.",
    "feat-6-title": "Owner Analytics Dashboard",
    "feat-6-desc": "Gives salon owners a full operational overview: estimated processing fee savings, staff performance management, and loyalty multiplier controls to maximize customer retention.",
    "pr-eyebrow": "TRANSPARENT VALUE LAYOUTS",
    "pr-title": "Find the Perfect Alignment for Your Team",
    "pr-desc": "Launch immediately with zero-cost Smart QR checkout cards and automated reviews, then scale to full co-op channels.",
    "plan-free-title": "Lite Pack (Free)",
    "plan-free-desc": "For salons with 5 staff or fewer. Requires KYB validation.",
    "plan-free-feat-1": "Up to 5 active specialists",
    "plan-free-feat-2": "Mandatory KYB Verification",
    "plan-free-feat-3": "Basic tabletop Smart QR",
    "plan-free-feat-4": "Direct peer-to-peer tip routing",
    "btn-plan-free": "Sign Up Free (KYB Required)",
    "plan-1-title": "Starter Pack",
    "plan-1-desc": "Perfect for micro booths & independent practitioners",
    "plan-1-feat-1": "Branded tabletop QR placements",
    "plan-1-feat-2": "Instant peer tip direct routing",
    "plan-1-feat-3": "Google review automated channels",
    "plan-1-feat-4": "Basic monthly transactional reviews",
    "btn-plan-start": "Get Started Now",
    "plan-pro-badge": "RECOMMENDED FOR SALONS",
    "plan-2-title": "Professional Pro",
    "plan-2-desc": "Brilliant choice for growing teams & local boutique hubs",
    "plan-2-feat-1": "Includes every Starter plan feature",
    "plan-2-feat-2": "Custom technician roster logins",
    "plan-2-feat-3": "Automatic direct tip processing pipelines",
    "plan-2-feat-4": "Adjustable B2B rewards rules panel",
    "plan-2-feat-5": "Client profile classification tool",
    "btn-plan-pro": "Select Pro Tier",
    "plan-3-title": "Enterprise Group",
    "plan-3-desc": "Tailored for prominent multi-location boutique franchises",
    "plan-3-price": "Custom Scale",
    "plan-3-price-sub": "tailored quote",
    "plan-3-feat-1": "Full multi-location organizational dashboards",
    "plan-3-feat-2": "Direct API checkout point-of-sale syncs",
    "plan-3-feat-3": "Premium solid brass NFC station plaques",
    "plan-3-feat-4": "24/7 dedicated enterprise success managers",
    "btn-plan-ent": "Contact Success Sales",
    "cta-title": "Unlock Beautiful Localized Retentive Networks",
    "cta-desc": "Empower your technical workforce, collect valuable validated reviews on major search maps, and expand your community reach today.",
    "btn-cta-1": "Request Custom Consulting",
    "btn-cta-2": "Interact With Live Simulator",
    "footer-copyright": "© 2026 NEXORA TOUCH. Tip Smarter. Review Faster. Grow Stronger.",
    "footer-link-1": "Privacy Policy",
    "footer-link-2": "Ecosystem Guidelines",
    "footer-link-3": "VLINKPAY Financial Infrastructure",
    "footer-nav-title": "Links",
    "footer-social": "Connect with us",
    "footer-rights": "All rights reserved.",
    "footer-subtext": "Assembled with profound devotion for local retail heroes.",
    "modal-demo-title": "Book Customized On-Site Demonstration",
    "modal-demo-desc": "Let's construct tailored high-fidelity QR stand placemats matching your brand parameters.",
    "modal-field-name": "Your Full Name",
    "modal-field-salon": "Salon / Spa Business Name",
    "modal-field-email": "E-mail Address Node",
    "modal-field-size": "Workstation / Team Count",
    "modal-field-state": "Location Area (City / State)",
    "btn-modal-demo-submit": "Request Setup Consulting",
    "btn-modal-demo-soon": "(Coming Soon)",
    "tab-login-btn": "Login",
    "tab-register-btn": "Register Profile",
    "auth-email-label": "Email",
    "auth-pass-label": "Password",
    "btn-auth-confirm-login": "Confirm Login",
    "btn-auth-confirm-login-soon": "(Coming Soon)",
    "auth-login-prompt": "Demo tip: Input SĐT (714) 555-0199 with any arbitrary password!",
    "auth-name-label": "Full Name",
    "auth-reg-email-label": "Email",
    "auth-reg-pass-label": "Password",
    "auth-reg-ref-label": "Referral Code",
    "btn-auth-confirm-reg": "Create Account",
    "btn-auth-confirm-reg-soon": "(Coming Soon)",
    "tax-landing-title": "NEXORA Tax IQ — Quick Deduction Optimizer",
    "tax-landing-desc-1": "Tip income and independent contractor earnings can introduce complex tax liabilities—especially when differentiating between W2 salon employees and 1099 boutique contractors.",
    "tax-landing-desc-2": "Tax IQ helps nail salon owners and technicians identify common deductions, prepare expense documentation, and understand estimated tax savings—before sending records to a CPA or tax professional.",
    "tax-substat-1": "Prepare Docs Before Filing",
    "tax-substat-2": "AI-Assisted Deduction Review",
    "tax-iq-sum-heading": "④ Estimated Tax Summary",
    "tax-iq-sum-liability": "Est. Tax Liability",
    "tax-iq-sum-gross": "Gross Income",
    "tax-iq-sum-deductions": "Selected Deductions",
    "tax-iq-sum-taxable": "Est. Taxable Income",
    "tax-iq-sum-savings": "Est. Savings",
    "tax-iq-sum-missing": "Missing Receipt",
    "tax-iq-sum-cpa": "Needs CPA Review",
    "tax-iq-sum-footnote": "This estimate is for planning only and may change after CPA review, filing status, state tax rules, and final income adjustments.",
    "tax-iq-btn-review": "Review with Tax IQ",
    "tax-iq-disclaimer": "Estimate only. This is not tax advice. Final tax treatment should be reviewed by a CPA or tax professional.",
    "tax-iq-app-subtitle": "Quick Deduction Optimizer",
    "tax-iq-badge-ai": "AI Assisted",
    "tax-iq-block1": "① Tax Profile",
    "tax-role-staff-title": "Nail Technician",
    "tax-role-staff-sub": "Staff / 1099",
    "tax-role-owner-title": "Salon Owner",
    "tax-role-owner-sub": "Owner / Multi-loc",
    "tax-iq-income-label": "Est. Annual Gross Income",
    "tax-type-booth": "Booth Renter",
    "tax-type-multi": "Multi-location Owner",
    "tax-status-married-sep": "Married Filing Separately",
    "tax-iq-optional": "(optional)",
    "tax-iq-block2": "② Quick Search: Deductible Categories",
    "tax-iq-block3": "③ Select Your Actual Expenses",
    "tax-iq-btn-scan": "📷 Scan Receipt",
    "tax-iq-btn-add": "+ Add",
    "tax-iq-expenses-desc": "Choose items you paid for. Tax IQ will check receipts, missing info, and CPA review needs.",
    "tax-chk-phone-title": "📱 Phone & Internet",
    "tax-badge-needs-log": "Needs Mileage Log",
    "tax-badge-ready": "Ready",
    "tax-badge-missing-proof": "Missing Proof",
    "tax-badge-partial": "Partially Deductible",
    "tax-act-add-trip": "Add Trip Details",
    "tax-act-upload-receipt": "Upload Receipt",
    "tax-act-view-receipt": "View Receipt",
    "tax-act-upload-proof": "Upload Proof",
    "tax-act-confirm-pct": "Confirm %",
    "tax-act-trip-done": "Trip Log Added ✓",
    "tax-act-receipt-done": "Receipt Verified ✓",
    "tax-act-ready-done": "Ready ✓",
    "tax-act-proof-done": "Proof Verified ✓",
    "tax-act-confirmed-done": "Confirmed ✓",
    "tax-act-view-log": "View Log",
    "tax-act-view-proof": "View Proof",
    "tax-act-view-details": "View Details",
    "tax-act-uploading": "Uploading…",
    "tax-act-verifying": "Verifying receipt…",
    "tax-act-verified": "Receipt verified ✓  Deduction confirmed.",
    "tax-feat-1-title": "Form 1099 Automated Archiving",
    "tax-feat-1-desc": "Directly links payment endpoints to auto-generate verified seasonal IRS 1099 returns without administrative intervention.",
    "tax-feat-2-title": "Audit Shield Protections",
    "tax-feat-2-desc": "Enforces transparent peer routing logs to protect boutique establishments from back-taxes or classification errors.",
    "tax-est-withholding": "Est. Tip Withholding (15%)",
    "tax-legal-deductions": "Legal Deductions Found",
    "btn-tax-optimize": "Optimize Legal Write-Offs",
    "tax-safety-rating": "Audit Risk Rating:",
    "tax-staff-reported": "Active Contractor Logs:",
    "tax-automated-forms": "Regulatory Filing Compliance:",
    "btn-tax-export-reports": "Export 1099 & Co-op Statements",
    "tax-filing-status": "Filing Status",
    "tax-status-single": "Single",
    "tax-status-married": "Married Filing Jointly",
    "tax-status-hoh": "Head of Household",
    "tax-worker-type": "Worker Classification",
    "tax-type-1099": "1099 Independent Contractor",
    "tax-type-w2": "W2 Employee",
    "tax-type-owner": "Salon Owner",
    "tax-children-count": "Qualifying Children (<17)",
    "tax-income-label": "Est. Annual Gross Income ($)",
    "tax-result-refund": "ESTIMATED REFUND AMOUNT",
    "tax-result-due": "ESTIMATED TAX LIABILITY",
    "tax-result-saved": "TAX SAVINGS (SAVED)",
    "tax-search-label": "🔍 Quick Search: Deductible Categories",
    "tax-checklist-label": "Select your actual expenses for tax deductions:",
    "tax-chk-mileage-title": "🚗 Mileage",
    "tax-chk-mileage-desc": "IRS standard rate deduction: $1,005",
    "tax-chk-supplies-title": "💅 Gel Polish, Brushes, UV Lamp",
    "tax-chk-supplies-desc": "Supply purchase expenses: $450",
    "tax-chk-license-title": "🎓 State Board License Fee",
    "tax-chk-license-desc": "Education & professional dev: $150",
    "tax-chk-rent-title": "🏢 Booth Rent",
    "tax-chk-rent-desc": "Booth rental deduction: $1,200",
    "opt-child-0": "0 children",
    "opt-child-1": "1 child (-$2,000 Credit)",
    "opt-child-2": "2 children (-$4,000 Credit)",
    "opt-child-3": "3 children (-$6,000 Credit)",
    "toast-gift-form-empty": "⚠️ Please enter the promotional gift details!",
    "toast-b2b-match": "🎯 B2B Target Match! Customer {0} is in the target segment!",
    "toast-b2b-activated": "🎯 Campaign activated! Configuration has been recorded.",
    "toast-points-short": "⚠️ Not enough points! You need {0} more XP.",
    "toast-redeem-success": "🎉 Successfully redeemed {0} at partner {1}!",
    "toast-staff-selected": "Technician selected: {0}",
    "toast-register-required-tip": "⚠️ Please register an account to start tipping.",
    "toast-tip-success": "🎉 Tipped ${0} to {1} via {2}!",
    "toast-register-required-rating": "⚠️ Please register before leaving a rating.",
    "toast-review-public": "Awesome! You earned +15 XP for sharing your 5-star review!",
    "toast-review-private": "Thank you! Your feedback has been sent to the manager.",
    "toast-feedback-empty": "Please enter your feedback.",
    "toast-feedback-sent": "Feedback sent successfully! Manager has been notified.",
    "toast-reg-required": "⚠️ Please fill in your Name and Phone Number!",
    "toast-reg-success": "🎉 Registration successful! You earned +100 welcome XP!",
    "toast-referral-copied": "📋 Referral code copied: {0}",
    "toast-logged-out": "You have been logged out.",
    "toast-referral-empty": "⚠️ Please enter your friend's phone number to send the code!",
    "toast-referral-sent": "🎉 Referral sent! Earn +50 XP when your friend registers.",
    "toast-msg-empty": "Please enter a message!",
    "toast-msg-sent": "📩 Your message has been forwarded to the salon front desk!",
    "toast-phone-empty": "⚠️ Please enter a phone number to check reward points!",
    "toast-user-found": "Account found: {0}!",
    "toast-user-notfound": "Phone number not found. Register now to start earning points!",
    "toast-tax-optimized": "💡 Tax IQ: Expenses have been optimized!",
    "toast-tax-ai": "💡 Tax IQ: AI found 3 valid deductions!",
    "toast-tax-auto": "🎉 AI: All eligible deductions have been maximized!",
    "toast-tax-download": "📥 Forms 1099-NEC & 1099-K are ready to download!",
    "toast-login-success": "Login successful!",
    "toast-register-success": "Member registration successful! Earn +100 XP!",
    "toast-demo-success": "Request sent! We'll be in touch soon.",
    "toast-points-rule": "Points multiplier changed to: {0}x",
    "toast-checkin-swapped": "📍 Check-in location switched to: {0}",
    "toast-b2b-linked": "🤝 Bloom Florist has successfully linked to the B2B system!",
    "txt-tx-count": "{0} tips",
    "txt-partners-count": "{0} Stores",
    "txt-greeting": "Hello, {0}",
    "ph-demo-name": "John Smith",
    "ph-demo-business": "Beauty Art Spa",
    "ph-demo-email": "contact@example.com",
    "ph-demo-city": "Los Angeles, CA",
    "ph-tax-search": "Type a keyword (e.g. mileage, nail supplies...)",
    "ph-b2b-gift": "Complimentary cookies / Free Gel Dry...",
    "opt-size-1": "1 - 5 employees",
    "opt-size-2": "6 - 15 employees",
    "opt-size-3": "16 - 30 employees",
    "opt-size-4": "Chain 30+ employees",
    "opt-tier-gold": "Gold Tier (VIP)",
    "opt-tier-silver": "Silver Tier",
    "opt-tier-diamond": "Diamond Tier",
    "header-guest": "Hello, Guest",
    "lbl-zelle": "Zelle (No fee)",
    "lbl-b2b-status": "Linked",
    "lbl-b2b-partner": "🌸 Bloom Florist (Corner location)",
    "tax-search-empty": "❌ Category not found.",
    "err-required": "This field is required",
    "err-email-invalid": "Please enter a valid email"
  }
};

const taxWriteOffsData = [
  {
    key: "mileage",
    name_vi: "🚗 Dặm Đường Di Chuyển (Mileage)",
    name_en: "🚗 Business Mileage Deductions",
    value: 1005,
    desc_vi: "Khấu trừ chi phí xăng xe đi lại giữa các tiệm hoặc mua đồ dùng làm việc theo định mức IRS năm 2026.",
    desc_en: "Deduct standard business mileage accrued for client visits, supply runs, and travel between multi-salons."
  },
  {
    key: "nail supplies sơn móng",
    name_vi: "💅 Dụng cụ, Sơn gel & Thiết bị chuyên dụng",
    name_en: "💅 Nail Supplies & Specialized Kits",
    value: 450,
    desc_vi: "Tất cả các loại sơn móng, đèn UV hơ gel, máy mài móng, cọ vẽ nghệ thuật dùng trực tiếp cho khách hàng.",
    desc_en: "Deduct nail supplies, nail polishes, gel kits, specialized brushes, UV LED lamps, and table drills purchased for clients."
  },
  {
    key: "thuê bàn",
    name_vi: "🏢 Chi phí thuê ghế/bàn làm việc (Booth Rent)",
    name_en: "🏢 Chair or Booth Rental Fees",
    value: 1200,
    desc_vi: "Chi phí thuê mặt bằng hoặc booth làm việc định kỳ trả cho chủ salon của các nhà thầu độc lập 1099.",
    desc_en: "Deduct monthly or weekly chair rental fees paid directly to the salon owner by 1099 independent contractors."
  },
  {
    key: "license",
    name_vi: "🎓 Bằng cấp, Đào tạo & Gia hạn Giấy phép",
    name_en: "🎓 Continuing Education & Licensing",
    value: 150,
    desc_vi: "Lệ phí gia hạn bằng Cosmetology, Nail Tech với State Board hoặc các khóa đào tạo nâng cao tay nghề.",
    desc_en: "Deduct State Board Cosmetology license renewal fees, professional liability insurances, and specialty masterclass courses."
  },
  {
    key: "uniforms",
    name_vi: "🧥 Đồng phục bảo hộ & Tạp dề làm việc",
    name_en: "🧥 Work Uniforms & Protective Gear",
    value: 180,
    desc_vi: "Các loại tạp dề, khẩu trang, găng tay y tế chuyên dụng không thể mặc đi chơi ngoài đời thường.",
    desc_en: "Deduct specialized work aprons, heavy-duty protective gloves, high-grade masks, and branded salon wear."
  },
  {
    key: "advertising marketing",
    name_vi: "📣 Quảng cáo mạng xã hội & Danh thiếp",
    name_en: "📣 Marketing & Social Media Promos",
    value: 300,
    desc_vi: "Chi phí chạy quảng cáo Facebook, Instagram cá nhân để thu hút tệp khách hàng riêng đến salon đặt lịch.",
    desc_en: "Deduct local marketing expenses, business card printing, website hosting, and Instagram/Facebook client ads."
  },
  {
    key: "phone",
    name_vi: "📱 Điện thoại & Gói dữ liệu (Business Use)",
    name_en: "📱 Cell Phone & Mobile Data Plan",
    value: 672,
    desc_vi: "70% chi phí điện thoại và gói data được khấu trừ nếu dùng để liên lạc với khách hàng và quản lý lịch đặt.",
    desc_en: "Deduct up to 70% of your monthly phone and mobile data plan used for client communications and appointment scheduling."
  },
  {
    key: "tools equipment",
    name_vi: "🔧 Dụng cụ & Thiết bị chuyên nghiệp",
    name_en: "🔧 Professional Tools & Equipment",
    value: 800,
    desc_vi: "Máy khoan móng điện, đèn UV chuyên dụng, bộ cọ vẽ cao cấp và các thiết bị đầu tư dùng hàng ngày tại tiệm.",
    desc_en: "Deduct professional nail tools including electric drills, UV curing lamps, art brush sets, and equipment purchased for daily salon operations."
  }
];

const mockUsersDatabase = {
  "7145550199": { name: "Jennifer H.", phone: "(714) 555-0199", points: 2450, referralCode: "REF-HONG", reward: "FREE Art Gel Voucher", tier: "Gold" },
  "6265550144": { name: "Michael T.", phone: "(626) 555-0144", points: 1500, referralCode: "REF-MINH", reward: "20% Off Scalp Treatment", tier: "Silver" },
  "4085550188": { name: "Tiffany N.", phone: "(408) 555-0188", points: 4200, referralCode: "REF-PHUONG", reward: "Free Herbal Mask Treatment", tier: "Diamond" }
};

const appState = {
  selectedStaff: 'Chloe',
  selectedTipAmount: 10,
  pointsMultiplier: 10,
  currentLanguage: getInitialHomePageLanguage(),

  customer: {
    isRegistered: true,
    name: "Jennifer H.",
    phone: "(714) 555-0199",
    points: 2450,
    referralCode: "REF-HONG"
  },

  // Số liệu của Thợ Chloe
  chloeTodayEarnings: 385.00,
  chloeTxCount: 14,
  chloeDeductions: 42.50,

  // Thống kê của Chủ cửa hàng
  totalOwnerSavings: 415.50,
  totalOwnerTipsRouted: 13850,
  b2bPartnersCount: 2
};

function bootHomePageContent() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
  changeLanguage(appState.currentLanguage);
  updateSavingsCalc(15000);
  updateCustomerDashboardUI(); // Tự động đồng bộ lên giao diện ngay khi tải trang
  filterTaxWriteoffs(""); // Hiển thị mặc định danh sách tra cứu thuế ban đầu
  calculateNailTax();     // Tính toán thuế động ban đầu

  __homepageClickOutside = function (event) {
    const dropdownBtn = document.getElementById('lang-dropdown-btn');
    const dropdownMenu = document.getElementById('language-dropdown-menu');
    if (
      dropdownMenu &&
      !dropdownMenu.classList.contains('hidden') &&
      dropdownBtn &&
      !dropdownBtn.contains(event.target) &&
      !dropdownMenu.contains(event.target)
    ) {
      toggleLanguageDropdown();
    }
  };
  document.addEventListener('click', __homepageClickOutside);
}

function toggleLanguageDropdown() {
  const dropdownMenu = document.getElementById('language-dropdown-menu');
  const chevron = document.getElementById('lang-dropdown-chevron');
  const isHidden = dropdownMenu.classList.contains('hidden');

  if (isHidden) {
    dropdownMenu.classList.remove('hidden');
    chevron.classList.add('rotate-180');
  } else {
    dropdownMenu.classList.add('hidden');
    chevron.classList.remove('rotate-180');
  }
}

function t(key) {
  return (translations[appState.currentLanguage] || translations.en)[key] || key;
}

/** Apply a homepage i18n key to a DOM node (for dynamically injected header controls). */
export function applyHomePageI18n(el, key) {
  if (!el || !key) return
  el.setAttribute('data-i18n', key)
  const text = t(key)
  if (text) el.textContent = text
}

function selectLanguage(lang) {
  toggleLanguageDropdown();
  changeLanguage(lang);
}

// 📱 XỬ LÝ TOGGLE MENU DI ĐỘNG (MOBILE HAMBURGER)
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-navigation-menu');
  const icon = document.getElementById('mobile-menu-icon');
  const toggle = document.getElementById('mobile-menu-toggle');
  const isHidden = menu.classList.contains('hidden');

  if (isHidden) {
    menu.classList.remove('hidden');
    toggle.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close mobile menu');
    icon.classList.add('rotate-90');
    icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />';
  } else {
    menu.classList.add('hidden');
    toggle.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open mobile menu');
    icon.classList.remove('rotate-90');
    icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 12h16M4 18h16" />';
  }
}

// 🌐 BỘ LỌC DỊCH THUẬT DYNAMIC i18n
export function changeLanguage(lang) {
  appState.currentLanguage = lang

  setStoredAppLanguage(lang)

  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang === 'vi' ? 'vi' : 'en'
  }

  // Thay đổi văn bản ngôn ngữ nút Header
  const currentText = document.getElementById('lang-current-text')
  if (currentText) currentText.textContent = lang === 'vi' ? 'VI' : 'EN'

  // Quét tất cả phần tử có thuộc tính "data-i18n" và dịch
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = translations[lang][key];
      } else {
        el.innerHTML = translations[lang][key];
      }
    }
  });

  // Cập nhật lại UI động của Simulator
  updateCustomerDashboardUI();
  syncStaffPortalUI();
  syncOwnerDashboardUI();
  calculateNailTax(); // Tính toán lại biểu mẫu thuế động
  filterTaxWriteoffs(document.getElementById('tax-iq-search-input')?.value || ''); // Làm mới danh mục tra cứu thuế
}

// 🔔 HIỂN THỊ THÔNG BÁO TOAST
function showToast(message) {
  const toast = document.getElementById('toast-banner');
  const toastMsg = document.getElementById('toast-message');
  if (toast && toastMsg) {
    toastMsg.textContent = message;
    toast.classList.remove('-translate-y-16', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    // Tự động ẩn sau 3,5 giây
    setTimeout(() => {
      toast.classList.add('-translate-y-16', 'opacity-0');
      toast.classList.remove('translate-y-0', 'opacity-100');
    }, 3500);
  }
}

// 🎯 THIẾT LẬP TẠO CHIẾN DỊCH KHUYẾN MÃI B2B NHẮM MỤC TIÊU
function activateB2BTargetedCampaign() {
  const partner = document.getElementById('owner-b2b-partner').value;
  const targetTier = document.getElementById('owner-b2b-tier').value;
  const giftInput = document.getElementById('owner-b2b-gift').value.trim();

  if (!giftInput) {
    showToast(t('toast-gift-form-empty'));
    return;
  }

  // Đẩy log kết nối lên Admin tiệm
  const dashboardLog = document.getElementById('dashboard-log');
  const newLog = document.createElement('div');
  newLog.className = "flex justify-between items-center text-slate-600 py-1 border-b border-dashed border-slate-100 animate-fadeIn";

  if (appState.currentLanguage === 'vi') {
    newLog.innerHTML = `<span>Tạo chiến dịch B2B cho hạng ${targetTier === 'Gold' ? 'Vàng' : targetTier}</span><span class="text-purple font-bold">Live</span>`;
  } else {
    newLog.innerHTML = `<span>Campaign configured for ${targetTier} Tier</span><span class="text-purple font-bold">Active</span>`;
  }
  dashboardLog.insertBefore(newLog, dashboardLog.firstChild);

  // KÍCH HOẠT DỮ LIỆU CHÉO CHO KHÁCH HÀNG
  const currentCustTier = appState.customer.isRegistered && appState.customer.phone === '(714) 555-0199' ? 'Gold' : 'Silver';

  if (currentCustTier === targetTier) {
    document.getElementById('sim-targeted-campaign-box').classList.remove('hidden');
    document.getElementById('sim-targeted-user-name').textContent = appState.customer.name;
    document.getElementById('sim-targeted-partner-name').textContent = partner;
    document.getElementById('sim-targeted-gift-text').textContent = giftInput;

    showToast(t('toast-b2b-match').replace('{0}', appState.customer.name));
  } else {
    showToast(t('toast-b2b-activated'));
  }
}

// Đổi điểm lấy Quà liên kết B2B
function redeemPartnerGift(giftName, partnerName, pointsCost) {
  if (appState.customer.points < pointsCost) {
    showToast(t('toast-points-short').replace('{0}', pointsCost - appState.customer.points));
    return;
  }

  appState.customer.points -= pointsCost;
  updateCustomerDashboardUI();

  const randomCode = "NEX-" + partnerName.replace(/\s+/g, '').toUpperCase() + "-" + Math.floor(100 + Math.random() * 900);

  const dashboardLog = document.getElementById('dashboard-log');
  const newLog = document.createElement('div');
  newLog.className = "flex justify-between items-center text-slate-600 py-1 border-b border-dashed border-slate-100 animate-fadeIn";

  if (appState.currentLanguage === 'vi') {
    newLog.innerHTML = `<span>${appState.customer.name} đổi ${pointsCost} XP</span><span class="text-purple font-bold">${partnerName}</span>`;
  } else {
    newLog.innerHTML = `<span>${appState.customer.name} swapped ${pointsCost} XP</span><span class="text-purple font-bold">${partnerName}</span>`;
  }
  dashboardLog.insertBefore(newLog, dashboardLog.firstChild);

  if (pointsCost === 0) {
    document.getElementById('sim-targeted-campaign-box').classList.add('hidden');
  }

  showToast(t('toast-redeem-success').replace('{0}', giftName).replace('{1}', partnerName));
}

// Chủ tiệm Phê duyệt đối tác liên kết B2B mới
function approveB2BPartner() {
  const reqBox = document.getElementById('b2b-pending-request');
  reqBox.style.transform = 'scale(0.9)';
  reqBox.style.opacity = '0';

  setTimeout(() => {
    reqBox.remove();

    const partnerList = document.getElementById('owner-b2b-list');
    const newPartner = document.createElement('div');
    newPartner.className = "flex items-center justify-between p-1.5 bg-slate-50 rounded-lg text-[10px] animate-fadeIn";

    newPartner.innerHTML = `
        <span class="font-bold text-slate-700">${t('lbl-b2b-partner')}</span>
        <span class="text-green bg-green/10 text-[8px] font-bold px-1.5 py-0.5 rounded">${t('lbl-b2b-status')}</span>
      `;
    partnerList.appendChild(newPartner);

    appState.b2bPartnersCount += 1;
    document.getElementById('dashboard-partners-count').textContent = t('txt-partners-count').replace('{0}', appState.b2bPartnersCount);

    const dashboardLog = document.getElementById('dashboard-log');
    const newLog = document.createElement('div');
    newLog.className = "flex justify-between items-center text-slate-600 py-1 border-b border-dashed border-slate-100 animate-fadeIn";

    if (appState.currentLanguage === 'vi') {
      newLog.innerHTML = `<span>Liên kết thành công</span><span class="text-green font-bold">Bloom Florist</span>`;
    } else {
      newLog.innerHTML = `<span>Linked successfully</span><span class="text-green font-bold">Bloom Florist</span>`;
    }
    dashboardLog.insertBefore(newLog, dashboardLog.firstChild);

    showToast(t('toast-b2b-linked'));
  }, 350);
}

// Đổi chi nhánh check-in
function changeBranch() {
  const branches = appState.currentLanguage === 'vi'
    ? ["Chi nhánh Quận 1", "Chi nhánh Quận 3", "Chi nhánh Phú Nhuận", "Chi nhánh Thảo Điền"]
    : ["Downtown Branch", "Central District", "Uptown Plaza", "Metro Suite"];

  const current = branches[Math.floor(Math.random() * branches.length)];

  showToast(t('toast-checkin-swapped').replace('{0}', current));

  const branchBadge = document.querySelector("#screen-customer .text-purple.font-black");
  if (branchBadge) branchBadge.textContent = current;
}

// Chuyển chế độ hoạt động trên Điện thoại giả lập
function switchSimulatorMode(mode) {
  const screenCustomer = document.getElementById('screen-customer');
  const screenStaff = document.getElementById('screen-staff');
  const screenOwner = document.getElementById('screen-owner');

  const tabCustomer = document.getElementById('tab-customer');
  const tabStaff = document.getElementById('tab-staff');
  const tabOwner = document.getElementById('tab-owner');

  screenCustomer.classList.add('hidden');
  screenStaff.classList.add('hidden');
  screenOwner.classList.add('hidden');

  [tabCustomer, tabStaff, tabOwner].forEach(t => {
    t.className = "flex-1 flex items-center justify-center gap-1.5 py-0 rounded-xl transition-all duration-300 text-slate-400 hover:text-white font-bold";
  });

  if (mode === 'customer') {
    screenCustomer.classList.remove('hidden');
    tabCustomer.className = "flex-1 flex items-center justify-center gap-1.5 py-0 rounded-xl transition-all duration-300 bg-purple text-white shadow-md shadow-purple/20 font-extrabold";
  } else if (mode === 'staff') {
    screenStaff.classList.remove('hidden');
    tabStaff.className = "flex-1 flex items-center justify-center gap-1.5 py-0 rounded-xl transition-all duration-300 bg-purple text-white shadow-md shadow-purple/20 font-extrabold";
    syncStaffPortalUI();
  } else if (mode === 'owner') {
    screenOwner.classList.remove('hidden');
    tabOwner.className = "flex-1 flex items-center justify-center gap-1.5 py-0 rounded-xl transition-all duration-300 bg-purple text-white shadow-md shadow-purple/20 font-extrabold";
    syncOwnerDashboardUI();
  }
}

// Chọn thợ đang phục vụ bạn
function selectStaff(staffName) {
  appState.selectedStaff = staffName;
  document.getElementById('selected-staff-label').textContent = staffName;

  const list = ['Chloe', 'Marcus', 'Sarah'];
  list.forEach(name => {
    const btn = document.getElementById('staff-' + name.toLowerCase());
    if (name === staffName) {
      btn.className = "bg-white border-2 border-purple p-2 rounded-xl text-center shadow-sm transition-all relative";
      if (!btn.querySelector('.absolute')) {
        btn.insertAdjacentHTML('beforeend', `<div class="absolute top-1 right-1 bg-purple text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-bold">✓</div>`);
      }
    } else {
      btn.className = "bg-white border border-slate-200 p-2 rounded-xl text-center shadow-sm transition-all hover:border-purple/50";
      const check = btn.querySelector('.absolute');
      if (check) check.remove();
    }
  });

  showToast(t('toast-staff-selected').replace('{0}', staffName));
}

// Thiết lập số tiền tip nhanh
function setTipAmount(amount) {
  appState.selectedTipAmount = parseFloat(amount);
  document.getElementById('custom-tip').value = '';
  highlightActiveTipButton(amount);
}

// Thiết lập số tiền tip tự chọn
function setCustomTip(val) {
  const parsedVal = parseFloat(val);
  if (!isNaN(parsedVal) && parsedVal > 0) {
    appState.selectedTipAmount = parsedVal;
    highlightActiveTipButton(null);
  }
}

function highlightActiveTipButton(presetAmount) {
  const buttons = document.querySelectorAll('.tip-btn');
  buttons.forEach(btn => {
    if (presetAmount !== null && btn.textContent === `$${presetAmount}`) {
      btn.className = "tip-btn bg-purple text-white font-extrabold text-xs py-1.5 rounded-lg active:scale-95 transition-all shadow-md shadow-purple/20";
    } else {
      btn.className = "tip-btn bg-slate-100 font-extrabold text-xs py-1.5 rounded-lg text-slate-700 hover:bg-slate-200 active:scale-95 transition-all";
    }
  });
}

// Hoàn tất bồi dưỡng trên giả lập
function confirmTip(platform) {
  if (!appState.customer.isRegistered) {
    showToast(t('toast-register-required-tip'));
    return;
  }
  const amt = appState.selectedTipAmount;
  const staff = appState.selectedStaff;

  if (staff === 'Chloe') {
    appState.chloeTodayEarnings += amt;
    appState.chloeTxCount += 1;
  }

  const savedFee = amt * 0.03;
  appState.totalOwnerSavings += savedFee;
  appState.totalOwnerTipsRouted += amt;

  const pointsEarned = Math.round(amt * appState.pointsMultiplier);
  appState.customer.points += pointsEarned;

  updateCustomerDashboardUI();

  // Đồng bộ vào log của Admin tiệm
  const dashboardLog = document.getElementById('dashboard-log');
  const newLog = document.createElement('div');
  newLog.className = "flex justify-between items-center text-slate-600 py-1 border-b border-dashed border-slate-100 animate-fadeIn";
  newLog.innerHTML = `<span>${staff} ($${amt.toFixed(2)} Tip)</span><span class="text-green font-bold">Via ${platform}</span>`;
  dashboardLog.insertBefore(newLog, dashboardLog.firstChild);

  showToast(t('toast-tip-success').replace('{0}', amt.toFixed(2)).replace('{1}', staff).replace('{2}', platform));
}

// Sao Đánh giá
function handleRating(starsCount) {
  if (!appState.customer.isRegistered) {
    showToast(t('toast-register-required-rating'));
    return;
  }
  const container = document.getElementById('rating-stars-container');
  const stars = container.querySelectorAll('button');

  stars.forEach((star, index) => {
    if (index < starsCount) {
      star.className = "text-2xl text-amber-400 hover:scale-110 transition-transform";
    } else {
      star.className = "text-2xl text-slate-300 hover:scale-110 transition-transform";
    }
  });

  const privateFeedbackBox = document.getElementById('private-feedback-box');
  const publicRoutingBox = document.getElementById('public-routing-box');

  if (starsCount >= 4) {
    privateFeedbackBox.classList.add('hidden');
    publicRoutingBox.classList.remove('hidden');
    appState.customer.points += 15;
    updateCustomerDashboardUI();

    showToast(t('toast-review-public'));
  } else {
    publicRoutingBox.classList.add('hidden');
    privateFeedbackBox.classList.remove('hidden');

    showToast(t('toast-review-private'));
  }
}

// Gửi góp ý riêng tư
function submitPrivateFeedback() {
  const text = document.getElementById('private-feedback-text').value;
  if (text.trim() === '') {
    showToast(t('toast-feedback-empty'));
    return;
  }
  document.getElementById('private-feedback-text').value = '';
  document.getElementById('private-feedback-box').classList.add('hidden');
  appState.customer.points += 15;
  updateCustomerDashboardUI();

  showToast(t('toast-feedback-sent'));
}

// Đăng ký thành viên trên Simulator
function registerSimulatorUser() {
  const name = document.getElementById('cust-reg-name').value;
  const phoneRaw = document.getElementById('cust-reg-phone').value;
  const ref = document.getElementById('cust-reg-ref').value;

  if (!name || !phoneRaw) {
    showToast(t('toast-reg-required'));
    return;
  }

  const phoneDigits = phoneRaw.replace(/\D/g, ''); // Clean digits for US database matching
  const newUserObj = {
    name: name,
    phone: phoneRaw,
    points: 100,
    referralCode: "REF-" + name.replace(/\s+/g, '').toLowerCase()
  };

  mockUsersDatabase[phoneDigits] = newUserObj;
  executeCustomerSessionLogin(newUserObj);

  showToast(t('toast-reg-success'));
}

// Đồng bộ trạng thái đăng nhập hệ thống thành công
function executeCustomerSessionLogin(userObj) {
  appState.customer.isRegistered = true;
  appState.customer.name = userObj.name;
  appState.customer.phone = userObj.phone;
  appState.customer.points = userObj.points;
  appState.customer.referralCode = userObj.referralCode || "REF-TEMP";

  updateCustomerDashboardUI();

  document.getElementById('header-auth-group').classList.add('hidden');
  const badge = document.getElementById('header-user-badge');
  badge.classList.remove('hidden');
  badge.style.removeProperty('display');
  document.getElementById('header-user-name').textContent = t('txt-greeting').replace('{0}', userObj.name);

  document.getElementById('cust-register-view').classList.add('hidden');
  document.getElementById('cust-dashboard-view').classList.remove('hidden');
}

// Cập nhật giao diện Simulator Dashboard của Khách Hàng
function updateCustomerDashboardUI() {
  document.getElementById('cust-name-label').textContent = appState.customer.name;
  document.getElementById('cust-phone-label').textContent = "Tel: " + appState.customer.phone;
  document.getElementById('cust-points-label').textContent = appState.customer.points.toLocaleString() + " XP";
  document.getElementById('cust-ref-code-label').textContent = appState.customer.referralCode.toUpperCase();
  document.getElementById('cust-avatar').textContent = appState.customer.name.charAt(0).toUpperCase();
  document.getElementById('tip-points-multiplier').textContent = appState.pointsMultiplier + "x";
}

// Thao tác sao chép mã giới thiệu an toàn
function copyReferralCode() {
  const code = document.getElementById('cust-ref-code-label').textContent;
  const dummy = document.createElement("textarea");
  document.body.appendChild(dummy);
  dummy.value = code;
  dummy.select();
  document.execCommand("copy");
  document.body.removeChild(dummy);
  showToast(t('toast-referral-copied').replace('{0}', code));
}

// Đăng xuất và khôi phục giao diện ban đầu
function handleLogout() {
  appState.customer.isRegistered = false;
  appState.customer.name = t('header-guest');
  appState.customer.phone = "";
  appState.customer.points = 0;

  document.getElementById('header-auth-group').classList.remove('hidden');
  const badge = document.getElementById('header-user-badge');
  badge.classList.add('hidden');
  badge.style.removeProperty('display');

  document.getElementById('cust-dashboard-view').classList.add('hidden');
  document.getElementById('cust-register-view').classList.remove('hidden');

  document.getElementById('cust-reg-name').value = '';
  document.getElementById('cust-reg-phone').value = '';
  document.getElementById('cust-reg-ref').value = '';

  showToast(t('toast-logged-out'));
}

// Gửi số điện thoại giới thiệu
function submitReferral() {
  const refPhone = document.getElementById('referral-phone').value;
  if (!refPhone) {
    showToast(t('toast-referral-empty'));
    return;
  }
  appState.customer.points += 50;
  updateCustomerDashboardUI();
  document.getElementById('referral-phone').value = '';

  showToast(t('toast-referral-sent'));
}

// Gửi tin nhắn đến quầy lễ tân
function sendInteractionMessage() {
  const msgInput = document.getElementById('interaction-message');
  const text = msgInput.value;
  if (!text.trim()) {
    showToast(t('toast-msg-empty'));
    return;
  }
  msgInput.value = '';

  showToast(t('toast-msg-sent'));
}

function maskUSPhone(input) {
  const digits = input.value.replace(/\D/g, '').slice(0, 10);
  let masked = '';
  if (digits.length > 0) masked = '(' + digits.slice(0, 3);
  if (digits.length >= 4) masked += ') ' + digits.slice(3, 6);
  if (digits.length >= 7) masked += '-' + digits.slice(6, 10);
  input.value = masked;
}

// Tra cứu Loyalty ngoài trang web
function lookupExternalLoyalty() {
  const phoneInput = document.getElementById('external-lookup-phone').value.trim();
  const phoneDigits = phoneInput.replace(/\D/g, '');

  if (!phoneDigits) {
    showToast(t('toast-phone-empty'));
    return;
  }

  Swal.fire({
    title: '🚀 Coming Soon!',
    html: `<p style="color:#667085;font-size:14px;margin-top:8px;">Customer profile lookup for <strong style="color:#6c4df6">${phoneInput}</strong> is under development.<br><br>This feature will be available in the next release.</p>`,
    confirmButtonText: 'Got it!',
    confirmButtonColor: '#6c4df6',
    background: '#ffffff',
    customClass: {
      title: 'swal-title',
      popup: 'swal-popup-rounded'
    }
  });
}

// Đồng bộ số liệu Thợ Chloe
function syncStaffPortalUI() {
  document.getElementById('staff-earnings-label').textContent = `$${appState.chloeTodayEarnings.toFixed(2)}`;

  document.getElementById('staff-tx-count').textContent = t('txt-tx-count').replace('{0}', appState.chloeTxCount);

  const taxWithholding = appState.chloeTodayEarnings * 0.15;
  document.getElementById('staff-tax-estimate').textContent = `$${taxWithholding.toFixed(2)}`;
  document.getElementById('staff-tax-deductions').textContent = `$${appState.chloeDeductions.toFixed(2)}`;
}

// AI Tax Optimization cho Thợ
function optimizeStaffDeductions() {
  if (appState.chloeDeductions > 42.50) {
    showToast(t('toast-tax-optimized'));
    return;
  }

  appState.chloeDeductions = 112.80;
  syncStaffPortalUI();

  showToast(t('toast-tax-ai'));
}

// TRA CỨU & LỌC CHI PHÍ KHẤU TRỪ THUẾ
function filterTaxWriteoffs(query) {
  const resultsContainer = document.getElementById('tax-iq-search-results');
  resultsContainer.innerHTML = "";
  const q = query.toLowerCase().trim();

  const filtered = taxWriteOffsData.filter(item => {
    return item.key.includes(q) ||
      item.name_vi.toLowerCase().includes(q) ||
      item.name_en.toLowerCase().includes(q) ||
      item.desc_vi.toLowerCase().includes(q) ||
      item.desc_en.toLowerCase().includes(q);
  });

  if (filtered.length === 0) {
    resultsContainer.innerHTML = `
      <div class="text-center p-3 text-xs text-slate-500">
        ${t('tax-search-empty')}
      </div>`;
    return;
  }

  filtered.forEach(item => {
    const title = appState.currentLanguage === 'vi' ? item.name_vi : item.name_en;
    const desc = appState.currentLanguage === 'vi' ? item.desc_vi : item.desc_en;
    const div = document.createElement('div');
    div.className = "bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 animate-fadeIn space-y-1";
    div.innerHTML = `
      <div class="flex justify-between items-center text-xs">
        <strong class="text-slate-100">${title}</strong>
        <span class="text-purple font-extrabold text-[10px]">+$${item.value} Max Write-off</span>
      </div>
      <p class="text-[9px] text-slate-400 leading-normal">${desc}</p>
    `;
    resultsContainer.appendChild(div);
  });
}

function calculateNailTax() {
  const income = parseFloat(document.getElementById('tax-iq-custom-income').value) || 0;
  const filingStatus = document.getElementById('tax-iq-filing-status').value;
  const workerType = document.getElementById('tax-iq-worker-type').value;
  const children = parseInt(document.getElementById('tax-iq-children').value) || 0;

  let seTax = 0;
  if (workerType === '1099' || workerType === 'booth' || workerType === 'owner' || workerType === 'multi') {
    seTax = income * 0.153;
  }

  let totalDeductions = 0;
  if (document.getElementById('chk-deduct-mileage').checked) totalDeductions += 1005;
  if (document.getElementById('chk-deduct-supplies').checked) totalDeductions += 450;
  if (document.getElementById('chk-deduct-license').checked) totalDeductions += 150;
  if (document.getElementById('chk-deduct-rent').checked) totalDeductions += 1200;
  if (document.getElementById('chk-deduct-phone').checked) totalDeductions += 672;

  let standardDeduction = 15000;
  if (filingStatus === 'married') standardDeduction = 30000;
  if (filingStatus === 'hoh') standardDeduction = 22500;

  const taxableIncome = Math.max(income - totalDeductions - standardDeduction, 0);

  let federalTax = 0;
  if (filingStatus === 'single' || filingStatus === 'married_sep') {
    if (taxableIncome <= 11600) {
      federalTax = taxableIncome * 0.10;
    } else if (taxableIncome <= 47150) {
      federalTax = (11600 * 0.10) + ((taxableIncome - 11600) * 0.12);
    } else {
      federalTax = (11600 * 0.10) + ((47150 - 11600) * 0.12) + ((taxableIncome - 47150) * 0.22);
    }
  } else if (filingStatus === 'married') {
    if (taxableIncome <= 23200) {
      federalTax = taxableIncome * 0.10;
    } else if (taxableIncome <= 94300) {
      federalTax = (23200 * 0.10) + ((taxableIncome - 23200) * 0.12);
    } else {
      federalTax = (23200 * 0.10) + ((94300 - 23200) * 0.12) + ((taxableIncome - 94300) * 0.22);
    }
  } else {
    if (taxableIncome <= 16550) {
      federalTax = taxableIncome * 0.10;
    } else if (taxableIncome <= 63100) {
      federalTax = (16550 * 0.10) + ((taxableIncome - 16550) * 0.12);
    } else {
      federalTax = (16550 * 0.10) + ((63100 - 16550) * 0.12) + ((taxableIncome - 63100) * 0.22);
    }
  }

  const childTaxCredit = children * 2000;
  const baselineGrossTax = (income * 0.153) + (Math.max(income - standardDeduction, 0) * 0.12);
  const totalTaxLiability = federalTax + seTax;
  const finalTaxDue = Math.max(totalTaxLiability - childTaxCredit, 0);
  const simulatedSaved = Math.max(baselineGrossTax - finalTaxDue, 0);

  const fmt = v => '$' + v.toLocaleString('en-US', { maximumFractionDigits: 0 });

  document.getElementById('tax-iq-gross-income').textContent = fmt(income);
  document.getElementById('tax-iq-total-deductions').textContent = fmt(totalDeductions);
  document.getElementById('tax-iq-taxable-income').textContent = fmt(Math.max(taxableIncome, 0));

  const labelTaxDue = document.getElementById('tax-iq-title-due');
  const finalTaxEl = document.getElementById('tax-iq-final-tax');
  labelTaxDue.textContent = t('tax-iq-sum-liability');
  finalTaxEl.className = "text-green text-sm font-black transition-all duration-300";
  finalTaxEl.textContent = fmt(finalTaxDue);

  document.getElementById('tax-iq-saved-amount').textContent = fmt(simulatedSaved);
  updateMissingSummary();
}

function selectTaxRole(role) {
  const staffBtn = document.getElementById('role-btn-staff');
  const ownerBtn = document.getElementById('role-btn-owner');
  const activeClass = 'flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 border-purple bg-purple/10 text-white transition-all ds-control btn-exp-action';
  const inactiveClass = 'flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900/40 text-slate-400 transition-all ds-control btn-exp-action';
  const workerSelect = document.getElementById('tax-iq-worker-type');
  if (role === 'staff') {
    staffBtn.className = activeClass;
    ownerBtn.className = inactiveClass;
    workerSelect.innerHTML = '<option value="1099">1099 Independent Contractor</option><option value="w2">W2 Employee</option><option value="booth">Booth Renter</option><option value="multi-salon">Multi-salon Worker</option>';
  } else {
    ownerBtn.className = activeClass;
    staffBtn.className = inactiveClass;
    workerSelect.innerHTML = '<option value="owner">Salon Owner</option><option value="multi">Multi-location Owner</option><option value="w2staff">Owner with W2 Staff</option><option value="1099staff">Owner with 1099 Contractors</option><option value="mixed">Mixed Staff Model</option>';
  }
  calculateNailTax();
}

// ── Receipt / Expense state ─────────────────────────────────────────────
const expenseState = {
  mileage:  { status: 'needs_log',     amount: 1005, checkboxId: 'chk-deduct-mileage',  doneLabelKey: 'tax-act-trip-done',     doneActionKey: 'tax-act-view-log' },
  supplies: { status: 'missing',       amount: 450,  checkboxId: 'chk-deduct-supplies', doneLabelKey: 'tax-act-receipt-done',  doneActionKey: 'tax-act-view-receipt' },
  license:  { status: 'ready',         amount: 150,  checkboxId: 'chk-deduct-license',  doneLabelKey: 'tax-act-ready-done',    doneActionKey: 'tax-act-view-receipt' },
  rent:     { status: 'missing_proof', amount: 1200, checkboxId: 'chk-deduct-rent',     doneLabelKey: 'tax-act-proof-done',    doneActionKey: 'tax-act-view-proof' },
  phone:    { status: 'partial',       amount: 672,  checkboxId: 'chk-deduct-phone',    doneLabelKey: 'tax-act-confirmed-done',doneActionKey: 'tax-act-view-details' },
};

function simulateReceiptUpload(key) {
  const exp = expenseState[key];
  if (!exp || exp.status === 'ready') return;
  const btn = document.querySelector(`[data-expense-action="${key}"]`);
  if (btn) { btn.textContent = t('tax-act-uploading'); btn.disabled = true; }
  showToast(t('tax-act-verifying'));
  setTimeout(() => {
    exp.status = 'ready';
    updateExpenseBadge(key);
    const cb = document.getElementById(exp.checkboxId);
    if (cb && !cb.checked) { cb.checked = true; }
    calculateNailTax();
    updateMissingSummary();
    showToast(t('tax-act-verified'));
  }, 1200);
}

function updateExpenseBadge(key) {
  const exp = expenseState[key];
  const badge = document.querySelector(`[data-expense-badge="${key}"]`);
  const btn   = document.querySelector(`[data-expense-action="${key}"]`);
  if (badge) {
    badge.className = 'text-[8px] bg-green/15 text-green border border-green/30 font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap';
    badge.textContent = t(exp.doneLabelKey);
  }
  if (btn) {
    btn.textContent = t(exp.doneActionKey);
    btn.disabled = false;
    btn.className = btn.className.replace('text-purple', 'text-slate-400');
    btn.onclick = () => showToast(t(exp.doneLabelKey));
  }
}

function updateMissingSummary() {
  const missing = Object.values(expenseState)
    .filter(e => e.status === 'missing' || e.status === 'missing_proof').length;
  const el = document.getElementById('summary-missing-count');
  const row = document.getElementById('summary-missing-row');
  if (el) el.textContent = missing + (missing === 1 ? ' item' : ' items');
  if (row) row.classList.toggle('hidden', missing === 0);
}

function toggleTaxSummary() {
  const detail = document.getElementById('tax-summary-detail');
  const isHidden = detail.style.display === 'none';
  detail.style.display = isHidden ? 'block' : 'none';
  chevron.style.transform = isHidden ? 'rotate(180deg)' : '';
}

function reviewWithTaxIQ() {
  document.getElementById('chk-deduct-mileage').checked = true;
  document.getElementById('chk-deduct-supplies').checked = true;
  document.getElementById('chk-deduct-license').checked = true;
  document.getElementById('chk-deduct-rent').checked = true;
  document.getElementById('chk-deduct-phone').checked = true;
  calculateNailTax();
  showToast(t('toast-tax-ai'));
}

function optimizeStaffDeductionsAI() {
  reviewWithTaxIQ();
}

// Tải báo cáo thuế
function downloadTaxReport() {
  showToast(t('toast-tax-download'));
}

// Trình chiếu video giới thiệu từ YouTube
function playIntroVideo() {
  const cover = document.getElementById('video-cover');
  const iframe = document.getElementById('intro-video-iframe');
  if (cover) {
    cover.style.opacity = '0';
    setTimeout(() => {
      cover.style.display = 'none';
    }, 500);
  }
  if (iframe) {
    iframe.src = "https://www.youtube.com/embed/ghegM-w3NAM?autoplay=1&mute=1&playlist=ghegM-w3NAM&loop=1";
  }
}

// MODAL HANDLERS
function openAuthModal(tab) {
  const modal = document.getElementById('auth-modal');
  modal.classList.remove('opacity-0', 'pointer-events-none');
  modal.querySelector('.transform').classList.remove('scale-95');
  modal.querySelector('.transform').classList.add('scale-100');
  switchAuthTab(tab);
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  modal.classList.add('opacity-0', 'pointer-events-none');
  modal.querySelector('.transform').classList.remove('scale-100');
  modal.querySelector('.transform').classList.add('scale-95');
}

function switchAuthTab(tab) {
  const loginTab = document.getElementById('auth-tab-login');
  const registerTab = document.getElementById('auth-tab-register');
  const loginForm = document.getElementById('auth-form-login');
  const registerForm = document.getElementById('auth-form-register');
  const activeClass = "flex-1 py-2.5 text-center font-extrabold text-sm rounded-xl bg-white text-navy shadow-sm transition-all ds-control ds-button";
  const inactiveClass = "flex-1 py-2.5 text-center font-extrabold text-sm text-white/60 hover:text-white rounded-xl transition-all ds-control ds-button";

  if (tab === 'login') {
    loginTab.className = activeClass;
    registerTab.className = inactiveClass;
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  } else {
    registerTab.className = activeClass;
    loginTab.className = inactiveClass;
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  }
}

function openDemoModal() {
  const modal = document.getElementById('demo-modal');
  modal.classList.remove('opacity-0', 'pointer-events-none');
  modal.querySelector('.transform').classList.remove('scale-95');
  modal.querySelector('.transform').classList.add('scale-100');
}

// Đóng Popup đăng ký Demo
function closeDemoModal() {
  const modal = document.getElementById('demo-modal');
  modal.classList.add('opacity-0', 'pointer-events-none');
  modal.querySelector('.transform').classList.remove('scale-100');
  modal.querySelector('.transform').classList.add('scale-95');
  const form = document.getElementById('demo-form');
  if (form) {
    form.reset();
    form.querySelectorAll('.border-red-400').forEach(el => el.classList.remove('border-red-400'));
    form.querySelectorAll('[id$="-err"]').forEach(el => el.classList.add('hidden'));
  }
}

function handleAuthLogin(event) {
  event.preventDefault();
  const emailInput = document.getElementById('auth-login-email').value.trim().toLowerCase();

  const userData = mockUsersDatabase[emailInput] || {
    name: "Khách Demo",
    email: emailInput,
    points: 500,
    referralCode: "REF-DEMO",
    reward: "Voucher quà tặng",
    tier: "Hạng Bạc"
  };

  executeCustomerSessionLogin(userData);
  closeAuthModal();
  showToast(t('toast-login-success'));
}

function handleAuthRegister(event) {
  event.preventDefault();
  const email = document.getElementById('auth-reg-email').value.trim().toLowerCase();
  const refCode = document.getElementById('auth-reg-ref').value.trim();
  const name = email.split('@')[0];

  const newUser = {
    name: name,
    email: email,
    points: 100,
    referralCode: "REF-" + name.replace(/\s+/g, '').toUpperCase().slice(0, 5),
    usedReferral: refCode || null,
    reward: "Quà tặng chào mừng",
    tier: "Hạng Bạc"
  };

  mockUsersDatabase[email] = newUser;
  executeCustomerSessionLogin(newUser);
  closeAuthModal();
  showToast(t('toast-register-success'));
}

function handleDemoSubmit(event) {
  event.preventDefault();

  const fields = [
    { id: 'demo-name', errId: 'demo-name-err', isEmail: false },
    { id: 'demo-salon', errId: 'demo-salon-err', isEmail: false },
    { id: 'demo-email', errId: 'demo-email-err', isEmail: true },
    { id: 'demo-city', errId: 'demo-city-err', isEmail: false },
  ];

  let valid = true;
  fields.forEach(({ id, errId, isEmail }) => {
    const input = document.getElementById(id);
    const err = document.getElementById(errId);
    const val = input.value.trim();
    let hasError = false;

    if (!val) {
      hasError = true;
      err.textContent = t('err-required');
    } else if (isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      hasError = true;
      err.textContent = t('err-email-invalid');
    }

    if (hasError) {
      input.classList.add('border-red-400');
      err.classList.remove('hidden');
      valid = false;
    } else {
      input.classList.remove('border-red-400');
      err.classList.add('hidden');
    }
  });

  if (!valid) return;

  closeDemoModal();
  showToast(t('toast-demo-success'));
}

// Thay đổi hệ số điểm thưởng của chủ tiệm
function changePointsRule(change) {
  appState.pointsMultiplier = Math.max(1, appState.pointsMultiplier + change);
  document.getElementById('points-multiplier-label').textContent = appState.pointsMultiplier + "x";
  document.getElementById('tip-points-multiplier').textContent = appState.pointsMultiplier + "x";
  showToast(t('toast-points-rule').replace('{0}', appState.pointsMultiplier));
}

function toggleStaffStatus(staffName, isOnline) {
  showToast(`${staffName} is now ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
}

function syncOwnerDashboardUI() {
  document.getElementById('dashboard-savings-label').textContent = `$${appState.totalOwnerSavings.toFixed(2)}`;
  document.getElementById('dashboard-tips-total').textContent = `$${appState.totalOwnerTipsRouted.toLocaleString()} routed`;
  document.getElementById('dashboard-partners-count').textContent = t('txt-partners-count').replace('{0}', appState.b2bPartnersCount);
}

function updateSavingsCalc(value) {
  const slider = document.getElementById('tips-volume-slider');
  if (slider) slider.value = value;

  document.getElementById('slider-val-label').textContent = `$${parseInt(value).toLocaleString()}`;

  const lostAnnual = value * 0.03 * 12;
  const savedAnnual = value * 0.03 * 12;

  document.getElementById('lost-annual-label').textContent = `$${lostAnnual.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  document.getElementById('saved-annual-label').textContent = `$${savedAnnual.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

const RECEIPT_CATEGORIES = [
  { id: 'chk-deduct-mileage',  label: '🚗 Mileage',           keywords: ['mileage','gas','fuel','parking','uber','lyft','auto','gasoline'] },
  { id: 'chk-deduct-supplies', label: '💅 Nail Supplies',      keywords: ['polish','gel','uv','lamp','brush','nail','supply','supplies','acrylic','cuticle','salon','beauty','kit','glitter','powder'] },
  { id: 'chk-deduct-rent',     label: '🏢 Booth Rent',         keywords: ['rent','booth','lease','studio','space'] },
  { id: 'chk-deduct-phone',    label: '📱 Phone & Internet',   keywords: ['phone','mobile','wireless','internet','data','cell','at&t','verizon','t-mobile','sprint','boost','monthly plan'] },
  { id: 'chk-deduct-license',  label: '🎓 License & Cert',     keywords: ['license','permit','certification','board','cosmetology','renewal','fee'] }
];
let _scanDetected = [];

function openReceiptScanModal() {
  document.getElementById('receipt-scan-modal').classList.add('open');
  _scanShowState('upload');
  // reset file input
  const fi = document.getElementById('receipt-file-input');
  if (fi) fi.value = '';
}

function closeReceiptScanModal() {
  document.getElementById('receipt-scan-modal').classList.remove('open');
}

function _scanShowState(state) {
  ['upload','processing','results'].forEach(s => {
    document.getElementById('scan-state-' + s).style.display = s === state ? '' : 'none';
  });
}

function triggerReceiptCapture() {
  const fi = document.getElementById('receipt-file-input');
  fi.setAttribute('capture', 'environment');
  fi.click();
}

function triggerReceiptUpload() {
  const fi = document.getElementById('receipt-file-input');
  fi.removeAttribute('capture');
  fi.click();
}

async function handleReceiptFile(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    document.getElementById('scan-preview-img').src = e.target.result;
    _scanShowState('processing');
    document.getElementById('scan-ocr-status').textContent = 'Loading OCR engine…';
    document.getElementById('scan-ocr-bar').style.width = '5%';
    try {
      const result = await Tesseract.recognize(file, 'eng', {
        logger: m => {
          const statusEl = document.getElementById('scan-ocr-status');
          const barEl = document.getElementById('scan-ocr-bar');
          if (m.status === 'loading tesseract core') {
            statusEl.textContent = 'Loading OCR engine…';
            barEl.style.width = '15%';
          } else if (m.status === 'initializing api') {
            statusEl.textContent = 'Initializing…';
            barEl.style.width = '30%';
          } else if (m.status === 'recognizing text') {
            const pct = Math.round(10 + m.progress * 85);
            barEl.style.width = pct + '%';
            statusEl.textContent = `Reading text… ${Math.round(m.progress * 100)}%`;
          }
        }
      });
      document.getElementById('scan-ocr-bar').style.width = '100%';
      _scanShowResults(result.data.text);
    } catch (err) {
      document.getElementById('scan-ocr-status').textContent = '⚠ OCR error: ' + err.message;
    }
  };
  reader.readAsDataURL(file);
}

function _parseReceipt(text) {
  const lower = text.toLowerCase();
  const detected = RECEIPT_CATEGORIES.filter(c => c.keywords.some(kw => lower.includes(kw)));
  const amounts = [];
  const rx = /\$?\s*(\d{1,4}(?:,\d{3})*\.\d{2})/g;
  let m;
  while ((m = rx.exec(text)) !== null) {
    const v = parseFloat(m[1].replace(/,/g, ''));
    if (v > 0) amounts.push(v);
  }
  const total = amounts.reduce((s, v) => s + v, 0);
  return { detected, total };
}

function _scanShowResults(rawText) {
  const parsed = _parseReceipt(rawText);
  _scanDetected = parsed.detected;
  const list = document.getElementById('scan-results-list');
  list.innerHTML = parsed.detected.length === 0
    ? '<p style="font-size:9px;color:#94a3b8;text-align:center;padding:12px 0">No deductible categories detected.<br>Try a clearer photo.</p>'
    : parsed.detected.map(c => `<div style="display:flex;align-items:center;gap:6px;padding:5px 8px;background:rgba(0,167,111,0.08);border:1px solid rgba(0,167,111,0.25);border-radius:8px;margin-bottom:4px"><span style="color:#00a76f;font-size:11px;line-height:1">✓</span><span style="font-size:9px;color:#e2e8f0;font-weight:700">${c.label}</span></div>`).join('');
  const tot = document.getElementById('scan-results-total');
  tot.textContent = parsed.total > 0 ? `$${parsed.total.toLocaleString('en-US',{maximumFractionDigits:2})} detected` : 'Amounts not detected';
  document.getElementById('scan-raw-text').textContent = rawText.trim().substring(0, 300) + (rawText.length > 300 ? '…' : '');
  _scanShowState('results');
}

function applyScannedDeductions() {
  _scanDetected.forEach(c => {
    // check the checkbox
    const el = document.getElementById(c.id);
    if (el) el.checked = true;
    // update expenseState + badge (strip 'chk-deduct-' prefix to get key)
    const key = c.id.replace('chk-deduct-', '');
    if (expenseState[key]) {
      expenseState[key].status = 'ready';
      updateExpenseBadge(key);
    }
  });
  calculateNailTax();
  updateMissingSummary();
  closeReceiptScanModal();
  const n = _scanDetected.length;
  showToast(n > 0 ? `✅ ${n} deduction${n>1?'s':''} detected & applied from receipt` : 'No deductions detected — try a clearer image');
}

const __homepageHandlers = {
  toggleLanguageDropdown,
  t,
  selectLanguage,
  toggleMobileMenu,
  changeLanguage,
  showToast,
  activateB2BTargetedCampaign,
  redeemPartnerGift,
  approveB2BPartner,
  changeBranch,
  switchSimulatorMode,
  selectStaff,
  setTipAmount,
  setCustomTip,
  highlightActiveTipButton,
  confirmTip,
  handleRating,
  submitPrivateFeedback,
  registerSimulatorUser,
  executeCustomerSessionLogin,
  updateCustomerDashboardUI,
  copyReferralCode,
  handleLogout,
  submitReferral,
  sendInteractionMessage,
  maskUSPhone,
  lookupExternalLoyalty,
  syncStaffPortalUI,
  optimizeStaffDeductions,
  filterTaxWriteoffs,
  calculateNailTax,
  selectTaxRole,
  simulateReceiptUpload,
  updateExpenseBadge,
  updateMissingSummary,
  toggleTaxSummary,
  reviewWithTaxIQ,
  optimizeStaffDeductionsAI,
  downloadTaxReport,
  playIntroVideo,
  openAuthModal,
  closeAuthModal,
  switchAuthTab,
  openDemoModal,
  closeDemoModal,
  handleAuthLogin,
  handleAuthRegister,
  handleDemoSubmit,
  changePointsRule,
  toggleStaffStatus,
  syncOwnerDashboardUI,
  updateSavingsCalc,
  openReceiptScanModal,
  closeReceiptScanModal,
  _scanShowState,
  triggerReceiptCapture,
  triggerReceiptUpload,
  _parseReceipt,
  _scanShowResults,
  applyScannedDeductions,
  handleReceiptFile,
}

export function getHomePageHandlers() {
  return __homepageHandlers
}

export function bootHomePage() {
  bootHomePageContent()
}

export {
  __homepageHandlers as homePageHandlers,
}

export function initHomePage(navigate) {
  if (typeof window === 'undefined') return () => {}

  window.navigateToApp = (path) => navigate(path)
  if (__homepageHandlers) {
    Object.assign(window, __homepageHandlers)
  }

  bootHomePageContent()

  return teardownHomePage
}

export function teardownHomePage() {
  delete window.navigateToApp
  if (__homepageHandlers) {
    for (const name of Object.keys(__homepageHandlers)) {
      delete window[name]
    }
  }
  if (__homepageClickOutside) {
    document.removeEventListener('click', __homepageClickOutside)
    __homepageClickOutside = null
  }
}

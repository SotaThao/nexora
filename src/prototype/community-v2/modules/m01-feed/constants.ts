import type { BoostDays, GroupIndustry, PostType } from "../../store/types";

export const route = (path: string) => `/community-v2${path}`;
export const ROUTES = {
  feed: route("/feed"),
  composeStep1: route("/feed/new"),
  composeStep2: route("/feed/new/destinations"),
  composeStep3: route("/feed/new/featured"),
  payment: route("/feed/featured/payment"),
  groups: route("/groups"),
  newGroup: route("/groups/new"),
  group: (id: string) => route(`/groups/${id}`),
  market: route("/market"),
  marketPost: (id: string) => route(`/market/${id}`),
  /** Contract 3 — implemented by M05. */
  messageTo: (personId: string) => route(`/messages/new?to=${encodeURIComponent(personId)}`),
  deal: (id: string) => route(`/deals/${id}`),
};

export const POST_TYPES: { id: Exclude<PostType, "official">; emoji: string; label: string; hint: string }[] = [
  { id: "showcase", emoji: "📷", label: "Khoe mẫu", hint: "Ảnh mẫu tay, set mới làm" },
  { id: "tip", emoji: "💡", label: "Mẹo nghề", hint: "Kinh nghiệm, kỹ thuật" },
  { id: "question", emoji: "❓", label: "Hỏi đáp", hint: "Hỏi cộng đồng" },
  { id: "market", emoji: "🛍️", label: "Mua bán", hint: "Bắt buộc ghi giá" },
];

export const TYPE_LABEL: Record<PostType, string> = {
  showcase: "📷 Khoe mẫu",
  tip: "💡 Mẹo nghề",
  question: "❓ Hỏi đáp",
  market: "🛍️ Mua bán",
  official: "OFFICIAL",
};

export const MARKET_CATEGORIES = [
  "Máy móc & thiết bị",
  "Bột, gel, sơn",
  "Nội thất tiệm",
  "Sang tiệm · thuê ghế",
  "Dụng cụ & đồ nghề",
];
export const MARKET_AREAS = ["Houston", "Dallas", "Austin", "Toàn quốc có ship"];
export const INDUSTRIES: GroupIndustry[] = ["Nail", "Spa & Massage", "Tóc & Salon", "Mi & Chân mày"];

export const BOOST_PLANS: { days: BoostDays; price: number }[] = [
  { days: 3, price: 5 },
  { days: 7, price: 10 },
  { days: 14, price: 18 },
];

export const MAX_BODY = 1500;
export const MAX_IMAGES = 6;
export const MAX_DESTINATIONS = 3;

// Verbatim copy from docs/community-v2/01-bang-tin-nhom-cho.md
export const COPY = {
  disclaimer: "Giao dịch trực tiếp giữa thành viên. NEXORA không đứng giữa & không bảo đảm. Không chuyển tiền trước.",
  imageRights: "Ảnh do tôi chụp hoặc có quyền đăng; khách trong ảnh đã đồng ý.",
  errShort: "Nội dung quá ngắn",
  errPrice: "Bài mua bán cần ghi giá",
  errRights: "Xác nhận quyền đăng ảnh & sự đồng ý của khách",
  aiBlock: "⛔ AI chặn: Yêu cầu chuyển tiền / đặt cọc ngoài app — dấu hiệu lừa đảo phổ biến. Vui lòng sửa nội dung.",
  aiWarn: "⚠️ Có số điện thoại — nên để người mua nhắn tin trong app. Sửa lại hoặc bấm “Tiếp” lần nữa.",
  errMaxDest: "Tối đa 3 nơi để tránh spam",
  errMarketToCommunity: "Cộng đồng ngành không cho mua bán — chọn nhóm Chợ",
  errPostToMarket: "Chợ chỉ dành cho bài mua bán",
  errNoDest: "Chọn ít nhất 1 nơi đăng",
  autoJoin: "sẽ tự tham gia khi đăng",
  featuredLocked: "Nổi bật dành cho tài khoản doanh nghiệp",
  featuredBadge: "⭐ Nổi bật · Được tài trợ",
  toastFree: (n: number) => `✓ Đã đăng miễn phí vào ${n} nơi`,
  toastFeatured: (d: number, p: number) => `⭐ Đã đăng & Nổi bật ${d} ngày — đã thanh toán $${p}`,
  toastReport: "🚩 Đã báo cáo — bài ẩn với bạn",
  toastJoin: (name: string) => `✓ Đã tham gia ${name}`,
  toastLeave: "Đã rời nhóm",
  proFee: "Nhóm thu phí thuộc bản Pro — cần điều khoản thanh toán riêng",
  defaultRules: "Ghi giá rõ · Không chuyển tiền trước · Đúng ngành",
};

export const AI_BLOCK_KEYWORDS = [
  "zelle", "cash app", "gift card", "chuyển tiền trước", "đặt cọc", "venmo", "western union",
];

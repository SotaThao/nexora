import type { Group, MarketInfo, MarketItem, Post, PostType } from "../types";

// Relative timestamps so "x phút trước" reads naturally whenever the demo is (re)seeded.
const HOUR = 3_600_000;
const ago = (hours: number) => new Date(Date.now() - hours * HOUR).toISOString();
const ahead = (days: number) => new Date(Date.now() + days * 24 * HOUR).toISOString();

const COMMUNITY_RULES = ["Đúng ngành", "Không mua bán — dùng nhóm Chợ", "Tôn trọng thành viên"];

export const groups: Group[] = [
  {
    id: "feed", name: "Bảng tin chung", kind: "feed", industry: "Nail", members: 24860, joinedBy: [],
    rules: ["Tôn trọng thành viên", "Không chuyển tiền trước"],
    description: "Mọi thành viên đều thấy — nơi đăng mặc định.",
  },
  {
    id: "cd-nail", name: "Cộng đồng Nail", kind: "community", industry: "Nail", members: 12480,
    joinedBy: ["jessica", "kayla", "1199", "3332", "5574"], rules: COMMUNITY_RULES,
    description: "Khoe mẫu, mẹo nghề và hỏi đáp cho thợ nail người Việt.",
  },
  {
    id: "cd-spa", name: "Cộng đồng Spa & Massage", kind: "community", industry: "Spa & Massage", members: 3210,
    joinedBy: ["2221"], rules: COMMUNITY_RULES,
    description: "Kỹ thuật massage, chăm sóc da và vận hành spa.",
  },
  {
    id: "cd-hair", name: "Cộng đồng Tóc & Salon", kind: "community", industry: "Tóc & Salon", members: 2875,
    joinedBy: ["trang"], rules: COMMUNITY_RULES,
    description: "Cắt, nhuộm, uốn và chuyện nghề salon tóc.",
  },
  {
    id: "cd-lash", name: "Cộng đồng Mi & Chân mày", kind: "community", industry: "Mi & Chân mày", members: 1960,
    joinedBy: ["7701", "mai"], rules: COMMUNITY_RULES,
    description: "Nối mi, lash lift, phun mày — chia sẻ kinh nghiệm.",
  },
  {
    id: "cho-nail-houston", name: "Chợ Nail Houston", kind: "market", industry: "Nail", members: 4120,
    joinedBy: ["jessica", "8818"], rules: ["Ghi giá rõ", "Không chuyển tiền trước"],
    description: "Mua bán đồ nghề, nội thất tiệm khu Houston.",
  },
  {
    id: "cho-do-nghe", name: "Chợ Đồ nghề Nail toàn quốc", kind: "market", industry: "Nail", members: 6540,
    joinedBy: ["1048", "4450"], rules: ["Ghi rõ phí ship"],
    description: "Bột, gel, máy móc — giao toàn quốc.",
  },
  {
    id: "sang-tiem", name: "Sang tiệm & Thuê ghế", kind: "market", industry: "Nail", members: 2380,
    joinedBy: ["kayla", "6683"], rules: ["Ghi rõ khu vực & giá"],
    description: "Sang nhượng tiệm, cho thuê ghế/booth.",
  },
  {
    id: "cho-spa", name: "Chợ Spa & Massage", kind: "market", industry: "Spa & Massage", members: 1150,
    joinedBy: ["2221"], rules: ["Ghi giá rõ", "Không chuyển tiền trước"],
    description: "Giường, máy xông, dụng cụ spa & massage.",
  },
];

type SeedPost = {
  author: string; type: PostType; hours: number; likes: number; to: string[]; body: string;
  images?: number[]; market?: MarketInfo; boostDays?: number;
};

const SEED_POSTS: SeedPost[] = [
  {
    author: "kayla", type: "market", hours: 20, likes: 64, to: ["feed", "sang-tiem"], boostDays: 7, images: [3, 1, 5],
    market: { category: "Sang tiệm · thuê ghế", price: 85000, area: "Houston" },
    body: "Sang tiệm nail 8 ghế khu Katy, Houston\nKhách quen ổn định, doanh thu đều, mặt bằng còn hợp đồng 4 năm. "
      + "Đầy đủ ghế pedicure, máy lọc bụi. Liên hệ nhắn tin trong app để hẹn xem tiệm.",
  },
  {
    author: "nexora", type: "official", hours: 30, likes: 212, to: ["feed"],
    body: "Chào mừng đến Bảng tin mới của NEXORA Community! Đăng một lần, hiện tối đa 3 nơi. "
      + "Nhớ: không chuyển tiền trước qua Zelle hay thẻ quà tặng — hãy nhắn tin và giao dịch an toàn trong app.",
  },
  {
    author: "jessica", type: "showcase", hours: 2, likes: 48, to: ["feed", "cd-nail"], images: [0, 2, 4],
    body: "Set Gel-X ombre hồng đất cho cô dâu cuối tuần này ✨ Form almond dài vừa, phủ top nhám. "
      + "Khách đã đồng ý cho đăng ảnh nha mọi người.",
  },
  {
    author: "1199", type: "tip", hours: 4, likes: 57, to: ["feed", "cd-nail"],
    body: "Mẹo pedicure cho khách gót nứt: ngâm nước ấm pha muối 5 phút, chà đá mịn theo một chiều, "
      + "thoa kem urea 20% rồi bọc màng 3 phút. Đừng cạo sâu, khách sẽ đau và quay lại trách tiệm.",
  },
  {
    author: "5574", type: "question", hours: 5, likes: 19, to: ["feed", "cd-nail"],
    body: "Mọi người cho hỏi base gel nào giữ lâu với khách móng yếu, dễ bong ở mép? "
      + "Em đang dùng loại rubber base mà khách hay bị hở sau 10 ngày.",
  },
  {
    author: "1048", type: "market", hours: 7, likes: 12, to: ["feed", "cho-do-nghe"], images: [1],
    market: { category: "Máy móc & thiết bị", price: 180, area: "Dallas" },
    body: "Thanh lý máy mài móng 35.000 vòng/phút\nDùng 6 tháng, còn hộp và 3 đầu mài. Nhận tại Dallas hoặc ship.",
  },
  {
    author: "8818", type: "market", hours: 9, likes: 23, to: ["feed", "cho-nail-houston"], images: [5, 3],
    market: { category: "Nội thất tiệm", price: 1200, area: "Houston" },
    body: "Bán 2 ghế pedicure có massage lưng\nTiệm đổi mẫu nên pass lại, còn chạy tốt, bồn sứ trắng."
      + " Xem hàng tại Bellaire.",
  },
  {
    author: "4450", type: "market", hours: 12, likes: 31, to: ["feed", "cho-do-nghe"], images: [2],
    market: { category: "Bột, gel, sơn", price: 95, area: "Toàn quốc có ship" },
    body: "Pass lại 40 hũ bột acrylic màu nude\nHàng mới 90%, đủ tone da. Ship toàn quốc, phí ship ghi rõ khi nhắn.",
  },
  {
    author: "6683", type: "market", hours: 15, likes: 17, to: ["feed", "sang-tiem"],
    market: { category: "Sang tiệm · thuê ghế", price: 250, area: "Houston" },
    body: "Cho thuê ghế nail theo tuần ở Bellaire\n$250/tuần, tiệm đông khách cuối tuần, có chỗ đậu xe rộng.",
  },
  {
    author: "2221", type: "market", hours: 26, likes: 9, to: ["feed", "cho-spa"], images: [4],
    market: { category: "Nội thất tiệm", price: 140, area: "Austin" },
    body: "Bán giường massage gấp gọn\nKhung nhôm nhẹ, nệm da, kèm túi. Phù hợp làm tại nhà hoặc spa nhỏ ở Austin.",
  },
  {
    author: "3332", type: "showcase", hours: 32, likes: 63, to: ["feed", "cd-nail"], images: [5, 0],
    body: "French tip ánh chrome cho khách quen hôm nay. Mọi người thấy viền vậy đã đủ mảnh chưa?",
  },
  {
    author: "7701", type: "tip", hours: 40, likes: 28, to: ["feed", "cd-lash"],
    body: "Lash lift xong dặn khách giữ khô 24 giờ, không xông hơi và không chải mascara. "
      + "Mi sẽ giữ độ cong đẹp 6–8 tuần.",
  },
  {
    author: "mai", type: "question", hours: 44, likes: 6, to: ["feed", "cd-lash"],
    body: "Ở Houston có tiệm nào nối mi volume tự nhiên, không bị nặng mắt không mọi người?",
  },
  {
    author: "trang", type: "tip", hours: 52, likes: 14, to: ["feed", "cd-hair"],
    body: "Tóc đã nhuộm balayage nên gội bằng dầu gội tím 1 lần/tuần để giữ tông lạnh, tránh ngả vàng.",
  },
];

export const posts: Post[] = SEED_POSTS.map((seed, index) => ({
  id: `post-${index + 1}`,
  authorId: seed.author,
  type: seed.type,
  body: seed.body,
  destinations: seed.to,
  createdAt: ago(seed.hours),
  likes: seed.likes,
  likedBy: [],
  images: seed.images ?? [],
  market: seed.market,
  boostDays: seed.boostDays,
  boostedUntil: seed.boostDays ? ahead(seed.boostDays - 1) : null,
  hiddenFor: [],
}));

/** Market listings are `posts` with type "market"; this legacy collection stays empty. */
export const marketItems: MarketItem[] = [];

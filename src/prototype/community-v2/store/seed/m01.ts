import type { Group, MarketItem, Post } from "../types";

export const groups: Group[] = [
  ["houston", "Thợ Nail Houston", 1842, "community"], ["dallas", "Thợ Nail Dallas – Fort Worth", 1230, "community"], ["austin", "Nail Austin & San Antonio", 716, "community"], ["gel-art", "Học Gel-X & Nail Art", 920, "public"], ["tax", "Thuế & 1099 cho thợ", 665, "public"], ["owners", "Chủ tiệm Việt tại Mỹ", 508, "public"], ["market-houston", "Chợ Nail Houston", 931, "market"], ["market-dallas", "Chợ Nail Dallas", 442, "market"], ["supply", "Dụng cụ & thanh lý", 304, "market"],
].map(([id, name, members, kind]) => ({ id: String(id), name: String(name), members: Number(members), kind: kind as Group["kind"], rules: ["Tôn trọng thành viên", "Không chuyển tiền ngoài app"] }));

export const posts: Post[] = [
  ["showcase", "jessica", "Mẫu Gel-X cuối tuần ở Houston ✨", "houston", 48], ["job", "kayla", "Kayla Nails đang tìm thêm thợ cuối tuần.", "houston", 31], ["market", "minh", "Thanh lý đèn nail còn mới, nhận tại Dallas.", "market-dallas", 12], ["question", "han", "Mọi người dùng base nào cho Gel-X bền?", "gel-art", 27], ["showcase", "vy", "French tip ánh chrome hôm nay.", "houston", 63], ["job", "thao", "Tìm tiệm ổn định ở Dallas.", "dallas", 18], ["market", "duy", "Bán ghế pedicure, giá số mẫu.", "market-houston", 8], ["question", "quynh", "Ai có mẹo xử lý khách da khô không?", "houston", 19], ["showcase", "nhi", "Set nail art mùa thu.", "austin", 36], ["official", "kayla", "NEXORA nhắc: giao dịch an toàn trong app.", "owners", 89], ["showcase", "kim", "Gel-X pastel cho khách quen.", "dallas", 22], ["market", "tuan", "Thanh lý máy hút bụi bàn nail.", "supply", 15],
].map(([type, authorId, body, groupId, likes], index) => ({ id: `post-${index + 1}`, type: String(type), authorId: String(authorId), body: String(body), groupId: String(groupId), likes: Number(likes), official: type === "official", boosted: index === 0 }));

export const marketItems: MarketItem[] = [
  ["Bộ đèn nail còn mới", 85, "Houston", "minh", "Dụng cụ", "Bellaire", 12], ["Ghế pedicure thanh lý", 420, "Houston", "duy", "Nội thất", "Sugar Land", 8], ["Bột màu 36 hũ", 45, "Dallas", "thao", "Vật tư", "Irving", 17], ["Máy hút bụi bàn", 65, "Austin", "han", "Dụng cụ", "North Austin", 9],
].map(([title, price, city, sellerId, category, area, likes], index) => ({ id: `market-${index + 1}`, title: String(title), price: Number(price), city: String(city), sellerId: String(sellerId), category: String(category), area: String(area), likes: Number(likes) }));

import type { Audience, Channel, DealFor, OfferType, ProgramColor } from "../../../store/types";

export type Draft = {
  emoji: string;
  offerType: OfferType;
  value: string;
  offerText: string;
  title: string;
  condition: string;
  expiryHours: number;
  totalSlots: string;
  perPerson: number | null;
  holdDays: string;
  audience: Audience;
  dealFor: DealFor;
  color: ProgramColor;
  channels: Channel[];
  adsOn: boolean;
  budget: string;
  adsDays: 3 | 7 | 14;
  adsRadius: 5 | 10 | 25;
};

export const EXPIRY_OPTIONS: [number, string][] = [
  [24, "24h"], [7 * 24, "7 ngày"], [14 * 24, "14 ngày"],
  [21 * 24, "21 ngày"], [30 * 24, "30 ngày"], [60 * 24, "60 ngày"],
];

export const BLANK: Draft = {
  emoji: "🏷️", offerType: "percent", value: "10", offerText: "", title: "", condition: "",
  expiryHours: 14 * 24, totalSlots: "50", perPerson: 1, holdDays: "7", audience: "all", dealFor: "client",
  color: "brand", channels: ["POS", "Community"], adsOn: false, budget: "", adsDays: 7, adsRadius: 10,
};

type Template = { name: string; emoji: string; patch: Partial<Draft> };
const t = (name: string, emoji: string, patch: Partial<Draft>): Template =>
  ({ name, emoji, patch: { emoji, ...patch } });

/** Doc 04 flow 1 step 1 — the 12 templates (name + emoji verbatim). Values are sample prefills. */
export const TEMPLATES: Template[] = [
  t("Khách mới", "👋", { offerType: "percent", value: "20", title: "Giảm 20% cho khách lần đầu", audience: "new",
    condition: "Áp dụng dịch vụ từ $40 · không cộng dồn ưu đãi khác", expiryHours: 30 * 24, totalSlots: "60",
    color: "violet" }),
  t("Khách quay lại", "🔁", { offerType: "amount", value: "10", title: "Mời bạn quay lại · giảm $10", audience: "lapsed",
    condition: "Áp dụng mọi dịch vụ từ $35", expiryHours: 30 * 24, totalSlots: "40", color: "teal" }),
  t("Sinh nhật", "🎂", { offerType: "amount", value: "10", title: "Mừng sinh nhật · giảm $10", audience: "all",
    condition: "Trong tháng sinh nhật · xuất trình ID", expiryHours: 60 * 24, totalSlots: "100", holdDays: "14" }),
  t("Giới thiệu bạn", "🤝", { offerType: "amount", value: "15", title: "Giới thiệu bạn · mỗi người giảm $15",
    audience: "regular", condition: "Đi cùng 1 bạn mới", expiryHours: 30 * 24, totalSlots: "30",
    channels: ["POS", "Community", "QR"] }),
  t("Giờ vàng", "⏰", { offerType: "percent", value: "15", title: "Giờ vàng 10:00–14:00 · giảm 15%", audience: "all",
    condition: "Thứ 2 – Thứ 5, khung 10:00–14:00", expiryHours: 21 * 24, totalSlots: "50" }),
  t("Flash 24h", "⚡", { offerType: "percent", value: "30", title: "Flash 24h · giảm 30% mọi dịch vụ", audience: "all",
    condition: "Chỉ trong 24 giờ", expiryHours: 24, totalSlots: "20", holdDays: "", color: "warning" }),
  t("Combo", "🎁", { offerType: "special", value: "45", title: "Combo gel tay + chân chỉ $45", audience: "all",
    condition: "Combo gel tay + chân (giá thường $70)", expiryHours: 14 * 24, totalSlots: "30" }),
  t("Khai trương", "🎊", { offerType: "percent", value: "25", title: "Mừng khai trương · giảm 25%", audience: "new",
    condition: "Tuần lễ khai trương", expiryHours: 7 * 24, totalSlots: "80", color: "violet" }),
  t("Lễ Tết", "🧧", { offerType: "bxgy", value: "0", offerText: "Mua 2 tặng 1",
    title: "Lì xì Tết · mua 2 tặng 1 nail art",
    audience: "all", condition: "Cùng một hoá đơn", expiryHours: 14 * 24, totalSlots: "40", color: "warning" }),
  t("Valentine/Mother's Day", "💐", { offerType: "special", value: "39", title: "Mother's Day · pedicure chỉ $39",
    audience: "all", condition: "Pedicure deluxe (giá thường $55)", expiryHours: 7 * 24, totalSlots: "40" }),
  t("Nhà cung cấp", "📦", { offerType: "percent", value: "12", title: "Giảm 12% đơn sỉ gel & bột", audience: "all",
    dealFor: "b2b", condition: "Đơn từ $200 · giao trong Houston", expiryHours: 30 * 24, totalSlots: "100",
    holdDays: "" }),
  t("Khoá học", "🎓", { offerType: "free", value: "0", offerText: "Buổi học thử miễn phí",
    title: "Miễn phí buổi học thử Gel-X",
    audience: "all", dealFor: "b2b", condition: "Lớp 90 phút · dành cho thợ", expiryHours: 30 * 24, totalSlots: "25",
    channels: ["POS", "Community"] }),
];

const AUDIENCE_PHRASE: Record<Audience, string> = {
  all: "mọi dịch vụ nail",
  new: "cho khách lần đầu",
  regular: "cho khách quen",
  lapsed: "— mời bạn quay lại",
};

/** "✦ AI gợi ý tiêu đề & điều kiện" — composed from offer type + audience + industry (Nail). */
export function aiSuggest(d: Draft): Pick<Draft, "title" | "condition"> {
  const phrase = AUDIENCE_PHRASE[d.audience];
  const v = d.value || "0";
  const title = {
    percent: `Giảm ${v}% ${phrase}`,
    amount: `Giảm $${v} ${phrase}`,
    special: `Gel tay chỉ $${v} ${phrase}`,
    bxgy: `${d.offerText || "Mua 2 tặng 1"} nail art ${phrase}`,
    free: `Miễn phí sơn gel khi làm bộ bột ${phrase}`,
  }[d.offerType];
  const condition = {
    percent: "Áp dụng dịch vụ nail từ $40 · không cộng dồn ưu đãi khác",
    amount: "Áp dụng hoá đơn từ $35 · mỗi hoá đơn 1 coupon",
    special: "Gel tay (giá thường $35) · đặt lịch trước",
    bxgy: "Tặng 1 móng nail art đơn giản khi làm 2 móng · cùng hoá đơn",
    free: "Áp dụng khi làm bộ bột full set · 1 lần/khách",
  }[d.offerType];
  return { title: title.slice(0, 60), condition };
}

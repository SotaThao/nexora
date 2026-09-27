import type {
  Channel,
  ChannelStat,
  Coupon,
  Customer,
  DealNotification,
  Promotion,
  RedeemHistoryItem,
} from "../types";

/**
 * Dates are relative to page load so the demo never goes stale ("còn 2 ngày" stays 2 days).
 * Kayla Nails & Spa (kn01–kn07) is the POS of the demo; its programs are chosen so the four
 * check-in quick-tries show all 8 eligibility rules of doc 04.
 */
const NOW = Date.now();
const DAY = 86_400_000;
const d = (days: number, hour?: number, minute = 0) => {
  const date = new Date(NOW + days * DAY);
  if (hour !== undefined) date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};
const stats = (partial: Partial<Record<Channel, [number, number]>>): Record<Channel, ChannelStat> => {
  const pick = (channel: Channel): ChannelStat => {
    const [claimed, used] = partial[channel] ?? [0, 0];
    return { claimed, used };
  };
  return { POS: pick("POS"), Community: pick("Community"), SMS: pick("SMS"), QR: pick("QR") };
};

export const industries = ["Nail", "Tóc", "Mi", "Spa", "Học viện", "Thuế & 1099", "Nhà cung cấp"];

type Base = Omit<Promotion, "createdAt" | "returnedSeed" | "dealFor" | "status" | "industry"> &
  Partial<Pick<Promotion, "createdAt" | "returnedSeed" | "dealFor" | "status" | "industry">>;
const program = (base: Base): Promotion => ({
  createdAt: d(-12),
  returnedSeed: 0,
  dealFor: "client",
  status: "active",
  industry: "Nail",
  ...base,
});

export const promotions: Promotion[] = [
  program({
    id: "kn01", title: "Giảm 20% cho khách mới", salonId: "kayla-nails", emoji: "👋", sponsored: true,
    offerType: "percent", offerValue: 20, audience: "new",
    condition: "Áp dụng dịch vụ từ $40 · không cộng dồn ưu đãi khác",
    channels: ["POS", "Community", "QR"], expiresAt: d(18), totalSlots: 80, returnedSeed: 2,
    perPersonLimit: 1, holdDays: 7, color: "violet", distanceMi: 0.8, mapAngle: 200,
    stats: stats({ Community: [14, 8], QR: [5, 3], POS: [6, 6] }),
    ads: { budgetPerDay: 25, days: 7, radiusMi: 10, startedAt: d(-2) },
  }),
  program({
    id: "kn02", title: "Giảm $15 dịch vụ Gel-X", salonId: "kayla-nails", emoji: "💅",
    offerType: "amount", offerValue: 15, audience: "all", condition: "Áp dụng Gel-X full set",
    channels: ["POS", "Community"], expiresAt: d(2, 23, 59), totalSlots: 45, perPersonLimit: 2,
    holdDays: 5, color: "brand", distanceMi: 0.8, mapAngle: 225,
    stats: stats({ Community: [17, 7], POS: [4, 4] }),
  }),
  program({
    id: "kn03", title: "Mua 2 tặng 1 nail art cho khách quen", salonId: "kayla-nails", emoji: "🔁",
    offerType: "bxgy", offerValue: 0, offerText: "Mua 2 tặng 1", audience: "regular",
    condition: "Tặng 1 móng nail art đơn giản khi làm 2 móng · cùng một hoá đơn",
    channels: ["POS", "SMS"], expiresAt: d(25), totalSlots: 30, perPersonLimit: 1, holdDays: null,
    color: "teal", distanceMi: 0.8, mapAngle: 200, stats: stats({ SMS: [6, 3], POS: [5, 5] }),
  }),
  program({
    id: "kn04", title: "Pedicure deluxe chỉ $39 — mời bạn quay lại", salonId: "kayla-nails", emoji: "🌸",
    offerType: "special", offerValue: 39, audience: "lapsed", condition: "Pedicure deluxe (giá thường $55)",
    channels: ["POS", "Community", "SMS"], expiresAt: d(30), totalSlots: 25, perPersonLimit: 1,
    holdDays: 10, color: "warning", distanceMi: 0.8, mapAngle: 250,
    stats: stats({ SMS: [7, 2], Community: [3, 1], POS: [2, 2] }),
  }),
  program({
    id: "kn05", title: "Flash 24h · Giảm 30% mọi dịch vụ", salonId: "kayla-nails", emoji: "⚡",
    status: "paused", offerType: "percent", offerValue: 30, audience: "all",
    condition: "Áp dụng khung 10:00–14:00", channels: ["POS", "Community", "SMS"], expiresAt: d(5),
    totalSlots: 20, perPersonLimit: 1, holdDays: 7, color: "violet", distanceMi: 0.8, mapAngle: 180,
    stats: stats({ Community: [6, 2], SMS: [2, 0] }),
  }),
  program({
    id: "kn06", title: "Sinh nhật · giảm $10", salonId: "kayla-nails", emoji: "🎂", createdAt: d(-40),
    offerType: "amount", offerValue: 10, audience: "all", condition: "Trong tháng sinh nhật · xuất trình ID",
    channels: ["POS", "Community", "SMS"], expiresAt: d(-3, 23, 59), totalSlots: 40, perPersonLimit: 1,
    holdDays: 14, color: "brand", distanceMi: 0.8, mapAngle: 200,
    stats: stats({ SMS: [9, 5], Community: [6, 4], POS: [3, 3] }),
  }),
  program({
    id: "kn07", title: "Giới thiệu bạn · giảm $20", salonId: "kayla-nails", emoji: "🤝",
    offerType: "amount", offerValue: 20, audience: "regular", condition: "Khách quen giới thiệu 1 bạn mới cùng đến",
    channels: ["POS", "QR"], expiresAt: d(20), totalSlots: 15, perPersonLimit: 1, holdDays: 7,
    color: "teal", distanceMi: 0.8, mapAngle: 200, stats: stats({ QR: [9, 6], POS: [6, 6] }),
  }),
  program({
    id: "lt01", title: "Giảm 15% massage chân thảo dược", salonId: "lotus", emoji: "🌿", industry: "Spa",
    offerType: "percent", offerValue: 15, audience: "all", condition: "Gói massage chân 45 phút",
    channels: ["POS", "Community"], expiresAt: d(12), totalSlots: 50, perPersonLimit: 1, holdDays: 7,
    color: "teal", distanceMi: 3.6, mapAngle: 40, stats: stats({ Community: [12, 5] }),
  }),
  program({
    id: "cr01", title: "Giảm 10% bộ nail art 3D", salonId: "crystal", emoji: "✨",
    offerType: "percent", offerValue: 10, audience: "all", condition: "Bộ nail art 3D từ $60",
    channels: ["POS", "Community"], expiresAt: d(9), totalSlots: 30, returnedSeed: 1, perPersonLimit: 1,
    holdDays: 3, color: "violet", distanceMi: 6.8, mapAngle: 320, stats: stats({ Community: [8, 2] }),
  }),
  program({
    id: "bl01", title: "Combo gel tay + chân chỉ $45", salonId: "bloom", emoji: "🎁",
    offerType: "special", offerValue: 45, audience: "all", condition: "Combo gel tay + chân (giá thường $70)",
    channels: ["POS", "Community"], expiresAt: d(6), totalSlots: 20, perPersonLimit: 1, holdDays: 5,
    color: "warning", distanceMi: 2.4, mapAngle: 110, stats: stats({ Community: [20, 11] }),
  }),
  program({
    id: "iv01", title: "Nối mi classic giảm $20 cho khách mới", salonId: "ivy", emoji: "👁️", industry: "Mi",
    offerType: "amount", offerValue: 20, audience: "new", condition: "Nối mi classic lần đầu",
    channels: ["POS", "Community"], expiresAt: d(3, 20), totalSlots: 25, perPersonLimit: 1, holdDays: 5,
    color: "brand", distanceMi: 11.5, mapAngle: 280, stats: stats({ Community: [9, 3] }),
  }),
  program({
    id: "gx01", title: "Miễn phí buổi học thử Gel-X", salonId: "gelx", emoji: "🎓", industry: "Học viện",
    dealFor: "b2b", offerType: "free", offerValue: 0, offerText: "Buổi học thử miễn phí", audience: "all",
    condition: "Lớp online 90 phút · dành cho thợ", channels: ["Community"], expiresAt: d(40),
    totalSlots: 100, perPersonLimit: 1, holdDays: null, color: "violet", distanceMi: null, mapAngle: 0,
    stats: stats({ Community: [31, 12] }),
  }),
  program({
    id: "tq01", title: "Giảm $50 khai thuế 1099 cho thợ", salonId: "taxiq", emoji: "🧾",
    industry: "Thuế & 1099", dealFor: "b2b", offerType: "amount", offerValue: 50, audience: "all",
    condition: "Khai thuế 1099 năm 2026", channels: ["Community"], expiresAt: d(60), totalSlots: 200,
    perPersonLimit: 1, holdDays: 14, color: "brand", distanceMi: null, mapAngle: 0,
    stats: stats({ Community: [44, 20] }),
  }),
];

const coupon = (c: Omit<Coupon, "status"> & { status?: Coupon["status"] }): Coupon => ({ status: "active", ...c });

export const coupons: Coupon[] = [
  coupon({ id: "c-jes-kn02", promotionId: "kn02", ownerId: "jessica", code: "NX-KN02-8K4P", source: "Community",
    claimedAt: d(-1, 9), holdUntil: d(2, 23, 59) }),
  coupon({ id: "c-jes-lt01", promotionId: "lt01", ownerId: "jessica", code: "NX-LT01-3MZQ", source: "Community",
    claimedAt: d(-2, 18), holdUntil: d(5, 18) }),
  coupon({ id: "c-jes-kn01", promotionId: "kn01", ownerId: "jessica", code: "NX-KN01-7Q2D", source: "QR",
    status: "used", claimedAt: d(-9, 11), holdUntil: d(-2, 11), usedAt: d(-8, 15, 20) }),
  coupon({ id: "c-jes-cr01", promotionId: "cr01", ownerId: "jessica", code: "NX-CR01-W5TA", source: "Community",
    claimedAt: d(-5, 12), holdUntil: d(-2, 12) }),
  coupon({ id: "c-mai-kn02", promotionId: "kn02", ownerId: "mai", code: "NX-KN02-2L9Q", source: "Community",
    claimedAt: d(-1, 20), holdUntil: d(2, 23, 59) }),
  coupon({ id: "c-mai-kn01", promotionId: "kn01", ownerId: "mai", code: "NX-KN01-H6XC", source: "Community",
    claimedAt: d(-10, 14), holdUntil: d(-3, 14) }),
  coupon({ id: "c-linh-kn06", promotionId: "kn06", ownerId: "linh", code: "NX-KN06-B8RE", source: "SMS",
    claimedAt: d(-8, 10), holdUntil: d(-3, 23, 59) }),
  coupon({ id: "c-trang-kn05", promotionId: "kn05", ownerId: "trang", code: "NX-KN05-Y4NM", source: "SMS",
    claimedAt: d(-2, 16), holdUntil: d(5) }),
];

export const customers: Customer[] = [
  { id: "cus-linh", name: "Linh Tran", phone: "7135554821", visits: [
    { at: d(-14, 15), bill: 65, promotionId: "kn02", saved: 15 }, { at: d(-42, 11), bill: 48 },
    { at: d(-70, 16), bill: 80, promotionId: "kn03", saved: 0 }, { at: d(-101, 13), bill: 55 },
    { at: d(-133, 10), bill: 40 },
  ] },
  { id: "cus-mai", name: "Mai Pham", phone: "7135556604", visits: [{ at: d(-21, 17), bill: 52 }] },
  { id: "cus-trang", name: "Trang Vo", phone: "7135557765", visits: [
    { at: d(-75, 14), bill: 60 }, { at: d(-120, 12), bill: 45 }, { at: d(-160, 15), bill: 58 },
    { at: d(-210, 11), bill: 50 },
  ] },
  { id: "cus-huong", name: "Hương Lê", phone: "7135551180", visits: [
    { at: d(0, 10, 15), bill: 70, promotionId: "kn02", saved: 15 }, { at: d(-30, 12), bill: 62 },
  ] },
  { id: "cus-ngoc", name: "Ngọc Đào", phone: "8325550142", visits: [
    { at: d(0, 11, 40), bill: 45, promotionId: "kn01", saved: 9 },
  ] },
];

export const redeemHistory: RedeemHistoryItem[] = [
  { id: "r-ngoc", customerName: "Ngọc Đào", promotionId: "kn01", channel: "POS", method: "Check-in",
    bill: 45, saved: 9, at: d(0, 11, 40) },
  { id: "r-huong", customerName: "Hương Lê", promotionId: "kn02", channel: "POS", method: "Check-in",
    bill: 70, saved: 15, at: d(0, 10, 15) },
  { id: "r-jes", customerName: "Jessica Nguyen", promotionId: "kn01", code: "NX-KN01-7Q2D", channel: "QR",
    method: "Ví", bill: 60, saved: 12, at: d(-8, 15, 20) },
  { id: "r-linh-2", customerName: "Linh Tran", promotionId: "kn02", channel: "Community", method: "Check-in",
    bill: 65, saved: 15, at: d(-14, 15) },
  { id: "r-linh-1", customerName: "Linh Tran", promotionId: "kn03", channel: "SMS", method: "Check-in",
    bill: 80, saved: 0, at: d(-70, 16) },
];

/** Defaults for the optional M04 keys (not part of the fixed shared seed merge). */
export const dealWishlistSeed: Record<string, string[]> = { jessica: ["kn02", "gx01"], linh: ["kn04"] };
export const dealKeywordsSeed: Record<string, string[]> = { jessica: ["gel-x", "pedicure"], linh: ["pedicure"] };
export const dealNotificationsSeed: DealNotification[] = [
  { id: "n-1", personId: "jessica", keyword: "gel-x", promotionId: "kn02", at: d(-1, 8, 30) },
  { id: "n-2", personId: "linh", keyword: "pedicure", promotionId: "kn04", at: d(-2, 9) },
];

import type { Audience, Channel, Coupon, OfferType, ProgramColor, Promotion } from "../../../store/types";

/** The POS that the demo runs in (Kayla · chủ tiệm). */
export const POS_SALON_ID = "kayla-nails";
export const DAY_MS = 86_400_000;
export const CHANNELS: Channel[] = ["POS", "Community", "SMS", "QR"];

export type ProgramState = "active" | "paused" | "expired" | "sold-out";
export type CouponState = "active" | "used" | "returned";

export const PROGRAM_STATE_LABEL: Record<ProgramState, string> = {
  active: "Đang chạy",
  paused: "Tạm dừng",
  expired: "Hết hạn",
  "sold-out": "Hết lượt",
};
export const PROGRAM_STATE_TONE: Record<ProgramState, "success" | "neutral" | "danger" | "warning"> = {
  active: "success",
  paused: "neutral",
  expired: "danger",
  "sold-out": "warning",
};

export const AUDIENCE_LABEL: Record<Audience, string> = {
  all: "Mọi khách",
  new: "Khách mới",
  regular: "Khách quen ≥ 2 lần",
  lapsed: "Khách lâu không ghé ≥ 60 ngày",
};
export const OFFER_TYPE_LABEL: Record<OfferType, string> = {
  percent: "Giảm %",
  amount: "Giảm $",
  bxgy: "Mua X tặng Y",
  special: "Giá đặc biệt",
  free: "Miễn phí",
};
export const CHANNEL_LABEL: Record<Channel, string> = {
  POS: "POS",
  Community: "Community",
  SMS: "SMS",
  QR: "QR tại quầy",
};

export const isExpired = (p: Promotion, now = Date.now()) => new Date(p.expiresAt).getTime() <= now;
export const claimedTotal = (p: Promotion) => CHANNELS.reduce((sum, c) => sum + p.stats[c].claimed, 0);
export const usedTotal = (p: Promotion) => CHANNELS.reduce((sum, c) => sum + p.stats[c].used, 0);

/** Display state of a stored coupon: an active code past its hold or program expiry has returned its slot. */
export function couponState(c: Coupon, p: Promotion | undefined, now = Date.now()): CouponState {
  if (c.status !== "active") return c.status;
  if (new Date(c.holdUntil).getTime() <= now) return "returned";
  if (p && isExpired(p, now)) return "returned";
  return "active";
}

/** Còn lượt = tổng − đã lấy + đã trả về kho. */
export function remainingSlots(p: Promotion, coupons: Coupon[], now = Date.now()) {
  const returned = coupons.filter((c) => c.promotionId === p.id && couponState(c, p, now) === "returned").length;
  return Math.max(0, p.totalSlots - claimedTotal(p) + p.returnedSeed + returned);
}

/** Hết hạn is shown first, then Tạm dừng, then Hết lượt (only a running program can be sold out). */
export function programState(p: Promotion, coupons: Coupon[], now = Date.now()): ProgramState {
  if (isExpired(p, now)) return "expired";
  if (p.status === "paused") return "paused";
  if (remainingSlots(p, coupons, now) <= 0) return "sold-out";
  return "active";
}

export function daysLeft(p: Promotion, now = Date.now()) {
  return Math.max(0, Math.ceil((new Date(p.expiresAt).getTime() - now) / DAY_MS));
}

export const money = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

export function offerHeadline(p: Pick<Promotion, "offerType" | "offerValue" | "offerText">) {
  switch (p.offerType) {
    case "percent":
      return `-${p.offerValue}%`;
    case "amount":
      return `-${money(p.offerValue)}`;
    case "special":
      return `chỉ ${money(p.offerValue)}`;
    case "bxgy":
      return p.offerText || "Mua X tặng Y";
    default:
      return p.offerText || "Miễn phí";
  }
}

/** Savings at the POS: % × bill; $ capped at bill; special = bill − price; BXGY / free = 0. */
export function savingsFor(p: Promotion, bill: number) {
  const safeBill = Math.max(0, bill || 0);
  if (p.offerType === "percent") return Math.round(safeBill * p.offerValue) / 100;
  if (p.offerType === "amount") return Math.min(p.offerValue, safeBill);
  if (p.offerType === "special") return Math.max(0, safeBill - p.offerValue);
  return 0;
}

const pad = (n: number) => String(n).padStart(2, "0");
export function fmtTime(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}
export const fmtDateTime = (iso: string) => `${fmtTime(iso)} ${fmtDate(iso)}`;
export const isToday = (iso: string, now = Date.now()) => new Date(iso).toDateString() === new Date(now).toDateString();

/** SĐT là khoá: keep digits, drop the US +1, keep the last 10 digits. */
export function normalizePhone(raw: string) {
  let digits = (raw || "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  return digits.slice(-10);
}
export function formatPhone(digits: string) {
  const d = normalizePhone(digits);
  if (d.length !== 10) return d;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export const publicLink = (id: string) => `nexora.link/c/${id}`;
export const perPersonText = (p: Promotion) =>
  p.perPersonLimit === null ? "không giới hạn lần/người" : `tối đa ${p.perPersonLimit} lần/người`;

/** Verbatim condition line of doc 04 flow 2 step 3. */
export function conditionLine(p: Promotion, c: Coupon) {
  return (
    `Điều kiện coupon: ${p.condition} · ${perPersonText(p)} · mỗi mã dùng 1 lần · ` +
    `HSD ${fmtDateTime(p.expiresAt)} · dùng trước ${fmtDateTime(c.holdUntil)}, quá hạn lượt tự trả về kho. ` +
    "Lấy coupon nghĩa là bạn đồng ý các điều kiện này."
  );
}

export const COLOR_GRADIENT: Record<ProgramColor, string> = {
  brand: "from-nexoraBrand to-nexoraElectric",
  violet: "from-nexoraElectricMid to-nexoraViolet",
  teal: "from-nexoraTealAlt to-nexoraTeal",
  warning: "from-nexoraWarning to-nexoraDanger",
};
export const COLOR_LABEL: Record<ProgramColor, string> = {
  brand: "Xanh NEXORA",
  violet: "Tím",
  teal: "Xanh ngọc",
  warning: "Cam",
};

export function matchesKeyword(p: Promotion, salonName: string, keyword: string) {
  const hay = `${p.title} ${p.condition} ${p.industry} ${salonName}`.toLowerCase();
  return hay.includes(keyword.trim().toLowerCase());
}

export const holdUntilFor = (p: Promotion, claimedAt: number) =>
  new Date(
    p.holdDays === null
      ? new Date(p.expiresAt).getTime()
      : Math.min(new Date(p.expiresAt).getTime(), claimedAt + p.holdDays * DAY_MS),
  ).toISOString();

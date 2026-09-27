import type { Coupon, DemoState, Promotion } from "../../../store/types";
import { POS_SALON_ID, couponState, fmtDateTime, fmtTime, isExpired } from "./domain";
import { pinMatches } from "./dynamicCode";

const salonName = (s: DemoState, id: string) => s.salons.find((x) => x.id === id)?.name ?? "Đối tác NEXORA";

export type WalletCheck = { ok: true; coupon: Coupon; promotion: Promotion } | { ok: false; message: string };

/** Doc 04 flow 4 step 2 — the 7 rejections, in order. */
export function checkWalletCodeIn(s: DemoState, rawCode: string, pin: string): WalletCheck {
  const code = rawCode.trim().toUpperCase();
  const coupon = s.coupons.find((c) => c.code === code);
  const p = coupon && s.promotions.find((x) => x.id === coupon.promotionId);
  if (!coupon || !p) return { ok: false, message: "Mã không tồn tại hoặc không phải của NEXORA." };
  if (p.salonId !== POS_SALON_ID) {
    const here = salonName(s, POS_SALON_ID);
    return { ok: false, message: `Mã này thuộc ${salonName(s, p.salonId)} — không dùng được tại ${here}.` };
  }
  if (coupon.status === "used") {
    return { ok: false, message: `Mã đã được dùng lúc ${fmtTime(coupon.usedAt)} — mỗi mã chỉ dùng 1 lần.` };
  }
  if (p.status === "paused") return { ok: false, message: "Coupon đang tạm dừng." };
  if (isExpired(p)) {
    return { ok: false, message: `Coupon đã hết hạn lúc ${fmtDateTime(p.expiresAt)} — không áp dụng được.` };
  }
  if (couponState(coupon, p) === "returned") {
    return {
      ok: false,
      message: `Mã đã hết thời gian giữ lượt (${fmtDateTime(coupon.holdUntil)}) — lượt đã trả về kho. ` +
        "Khách có thể lấy lại nếu coupon còn lượt.",
    };
  }
  if (!pinMatches(coupon.code, pin.trim())) {
    return { ok: false, message: "PIN động không khớp — nhờ khách mở lại Ví coupon…" };
  }
  return { ok: true, coupon, promotion: p };
}

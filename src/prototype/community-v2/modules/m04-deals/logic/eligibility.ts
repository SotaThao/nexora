import type { Coupon, Customer, DemoState, Promotion } from "../../../store/types";
import { DAY_MS, POS_SALON_ID, fmtDate, isExpired, normalizePhone, remainingSlots } from "./domain";

export type Offer = {
  key: string;
  promotion: Promotion;
  coupon?: Coupon;
  source: string;
  eligible: boolean;
  reasons: string[];
  checked: string;
};

export type VisitFacts = { count: number; daysSinceLast: number | null };

export function visitFacts(customer: Customer | undefined, now = Date.now()): VisitFacts {
  const visits = customer?.visits ?? [];
  if (!visits.length) return { count: 0, daysSinceLast: null };
  const last = Math.max(...visits.map((v) => new Date(v.at).getTime()));
  return { count: visits.length, daysSinceLast: Math.floor((now - last) / DAY_MS) };
}

const usedCountFor = (customer: Customer | undefined, promotionId: string) =>
  (customer?.visits ?? []).filter((v) => v.promotionId === promotionId).length;

/**
 * Doc 04 · "Kiểm tra điều kiện" — the 8 rules in order; returns EVERY failing reason.
 */
export function ineligibleReasons(
  p: Promotion,
  facts: VisitFacts,
  used: number,
  coupon: Coupon | undefined,
  remaining: number,
  now = Date.now(),
): string[] {
  const reasons: string[] = [];
  if (p.status === "paused") reasons.push("đang tạm dừng");
  if (isExpired(p, now)) reasons.push("đã hết hạn");
  if (p.audience === "new" && facts.count >= 1) {
    reasons.push(`khách đã ghé ${facts.count} lần — không phải khách mới`);
  }
  if (p.audience === "regular" && facts.count < 2) reasons.push("chưa đủ 2 lần ghé");
  if (p.audience === "lapsed") {
    if (facts.count === 0) reasons.push("khách mới — chưa từng ghé");
    else if ((facts.daysSinceLast ?? 0) < 60) reasons.push("mới ghé gần đây");
  }
  if (p.perPersonLimit !== null && used >= p.perPersonLimit) reasons.push(`đã dùng ${used}/${p.perPersonLimit} lần`);
  const holdEnd = coupon ? new Date(coupon.holdUntil).getTime() : 0;
  if (coupon && holdEnd <= now && holdEnd < new Date(p.expiresAt).getTime()) {
    reasons.push(`quá thời gian giữ lượt (${p.holdDays} ngày) — lượt đã trả về kho`);
  }
  if (!coupon && remaining <= 0) reasons.push("hết lượt");
  return reasons;
}

function checkedText(p: Promotion, facts: VisitFacts, coupon: Coupon | undefined) {
  const audience = {
    all: "mọi khách",
    new: "khách mới, chưa từng ghé",
    regular: `khách quen · ${facts.count} lần ghé`,
    lapsed: `lâu không ghé · ${facts.daysSinceLast ?? 0} ngày`,
  }[p.audience];
  return coupon ? `${audience} · mã còn hạn giữ tới ${fmtDate(coupon.holdUntil)}` : audience;
}

/** Everyone (person id + public-page phone owner) whose wallet belongs to this phone. */
export function ownerIdsForPhone(state: DemoState, phone: string) {
  const digits = normalizePhone(phone);
  const people = state.people.filter((p) => p.phone && normalizePhone(p.phone) === digits).map((p) => p.id);
  return [...people, `phone:${digits}`];
}

/**
 * Doc 04 flow 3 step 3: (a) codes in the client's wallet for this salon, (b) POS-channel programs.
 * "Mọi khách" programs that fail are hidden; targeted programs stay with their reason.
 */
export function gatherOffers(state: DemoState, customer: Customer, now = Date.now()): Offer[] {
  const facts = visitFacts(customer, now);
  const owners = ownerIdsForPhone(state, customer.phone);
  const byId = new Map(state.promotions.map((p) => [p.id, p]));
  const offers: Offer[] = [];

  state.coupons
    .filter((c) => owners.includes(c.ownerId) && c.status === "active")
    .forEach((c) => {
      const p = byId.get(c.promotionId);
      if (!p || p.salonId !== POS_SALON_ID) return;
      const reasons = ineligibleReasons(p, facts, usedCountFor(customer, p.id), c, 1, now);
      offers.push({
        key: `coupon:${c.id}`,
        promotion: p,
        coupon: c,
        source: `khách lấy từ ${c.source} · ${c.code}`,
        eligible: reasons.length === 0,
        reasons,
        checked: checkedText(p, facts, c),
      });
    });

  const covered = new Set(offers.map((o) => o.promotion.id));
  state.promotions
    .filter((p) => p.salonId === POS_SALON_ID && p.channels.includes("POS") && !covered.has(p.id))
    .forEach((p) => {
      const remaining = remainingSlots(p, state.coupons, now);
      const reasons = ineligibleReasons(p, facts, usedCountFor(customer, p.id), undefined, remaining, now);
      if (reasons.length && p.audience === "all") return;
      offers.push({
        key: `program:${p.id}`,
        promotion: p,
        source: "POS · tự đề xuất",
        eligible: reasons.length === 0,
        reasons,
        checked: checkedText(p, facts, undefined),
      });
    });

  return [...offers.filter((o) => o.eligible), ...offers.filter((o) => !o.eligible)];
}

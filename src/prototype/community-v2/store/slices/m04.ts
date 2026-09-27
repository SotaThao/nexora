import { getState, storeActions } from "../index";
import * as seed from "../seed/m04";
import type { Channel, Coupon, CouponSource, Customer, DemoState, Promotion, PromotionAds } from "../types";
import {
  POS_SALON_ID, couponState, holdUntilFor, isExpired, matchesKeyword,
  normalizePhone, remainingSlots, savingsFor,
} from "../../modules/m04-deals/logic/domain";
import { gatherOffers, ownerIdsForPhone } from "../../modules/m04-deals/logic/eligibility";
import { checkWalletCodeIn, type WalletCheck } from "../../modules/m04-deals/logic/walletCheck";

/** M04 slice — writes only M04 keys (promotions, coupons, customers, redeemHistory, deal*). */
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const rand4 = () => Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
const salonName = (s: DemoState, id: string) => s.salons.find((x) => x.id === id)?.name ?? "Đối tác NEXORA";
const mapPromotion = (s: DemoState, id: string, fn: (p: Promotion) => Promotion) =>
  s.promotions.map((p) => (p.id === id ? fn(p) : p));
const bump = (p: Promotion, channel: Channel, claimed: number, used: number): Promotion => ({
  ...p,
  stats: { ...p.stats, [channel]: { claimed: p.stats[channel].claimed + claimed, used: p.stats[channel].used + used } },
});

/** Old persisted shapes (earlier drafts) are replaced by the current seed, M04 keys only. */
(function ensureShape() {
  const s = getState();
  const ok = s.promotions?.every((p) => p.stats && p.offerType) && s.customers?.every((c) => Array.isArray(c.visits));
  if (ok) return;
  const fresh = JSON.parse(JSON.stringify(seed));
  storeActions.update((cur) => ({
    ...cur, promotions: fresh.promotions, coupons: fresh.coupons, customers: fresh.customers,
    redeemHistory: fresh.redeemHistory, industries: fresh.industries,
    dealWishlist: undefined, dealKeywords: undefined, dealNotifications: undefined,
  }));
})();

export const wishlistOf = (s: DemoState, personId: string | null) =>
  (s.dealWishlist ?? seed.dealWishlistSeed)[personId ?? ""] ?? [];
export const keywordsOf = (s: DemoState, personId: string | null) =>
  (s.dealKeywords ?? seed.dealKeywordsSeed)[personId ?? ""] ?? [];
export const notificationsOf = (s: DemoState, personId: string | null) =>
  (s.dealNotifications ?? seed.dealNotificationsSeed).filter((n) => n.personId === personId);

// ─── POS · program management ────────────────────────────────────────────────
export function togglePause(id: string) {
  storeActions.update((s) => ({
    ...s, promotions: mapPromotion(s, id, (p) => ({ ...p, status: p.status === "paused" ? "active" : "paused" })),
  }));
  return getState().promotions.find((p) => p.id === id)?.status;
}

export function toggleCommunity(id: string) {
  storeActions.update((s) => ({
    ...s,
    promotions: mapPromotion(s, id, (p) => ({
      ...p,
      channels: p.channels.includes("Community")
        ? p.channels.filter((c) => c !== "Community")
        : [...p.channels, "Community"],
    })),
  }));
  return getState().promotions.find((p) => p.id === id)?.channels.includes("Community");
}

export function startAds(id: string, ads: Omit<PromotionAds, "startedAt">) {
  storeActions.update((s) => ({
    ...s,
    promotions: mapPromotion(s, id, (p) => ({
      ...p, sponsored: true, ads: { ...ads, startedAt: new Date().toISOString() },
    })),
  }));
}

export type ProgramDraft = Pick<
  Promotion,
  "title" | "emoji" | "offerType" | "offerValue" | "offerText" | "audience" | "dealFor" | "condition" |
  "totalSlots" | "perPersonLimit" | "holdDays" | "color" | "channels"
> & { expiryHours: number; ads?: Omit<PromotionAds, "startedAt"> };

/** Publish = one source record; Community/SMS/QR are channels. Notifies keyword followers. */
export function publishProgram(draft: ProgramDraft) {
  const now = Date.now();
  const { expiryHours, ads, ...rest } = draft;
  const id = `kn${String(Math.floor(now / 1000) % 100000).padStart(5, "0")}`;
  const promotion: Promotion = {
    ...rest, id, salonId: POS_SALON_ID, status: "active", industry: "Nail",
    createdAt: new Date(now).toISOString(), expiresAt: new Date(now + expiryHours * 3_600_000).toISOString(),
    returnedSeed: 0, distanceMi: 0.8, mapAngle: 205, sponsored: Boolean(ads),
    ads: ads ? { ...ads, startedAt: new Date(now).toISOString() } : undefined,
    stats: { POS: { claimed: 0, used: 0 }, Community: { claimed: 0, used: 0 }, SMS: { claimed: 0, used: 0 },
      QR: { claimed: 0, used: 0 } },
  };
  storeActions.update((s) => {
    const keywords = s.dealKeywords ?? seed.dealKeywordsSeed;
    const name = salonName(s, POS_SALON_ID);
    const fresh = promotion.channels.includes("Community")
      ? Object.entries(keywords).flatMap(([personId, list]) =>
        list.filter((kw) => matchesKeyword(promotion, name, kw))
          .map((keyword) => ({ id: uid("n"), personId, keyword, promotionId: id, at: promotion.createdAt })))
      : [];
    return {
      ...s,
      promotions: [promotion, ...s.promotions],
      dealNotifications: [...fresh, ...(s.dealNotifications ?? seed.dealNotificationsSeed)],
    };
  });
  return id;
}

// ─── Community · claim ───────────────────────────────────────────────────────
export type ClaimResult =
  | { kind: "ok"; coupon: Coupon }
  | { kind: "existing"; coupon: Coupon }
  | { kind: "error"; message: string };

/** Doc 04 flow 2 step 2 — checks in order: already have → expired → per-person limit → out of slots. */
export function claimFor(ownerId: string, promotionId: string, source: CouponSource): ClaimResult {
  const s = getState();
  const p = s.promotions.find((x) => x.id === promotionId);
  if (!p) return { kind: "error", message: "Coupon đã hết lượt" };
  const mine = s.coupons.filter((c) => c.ownerId === ownerId && c.promotionId === promotionId);
  const valid = mine.find((c) => couponState(c, p) === "active");
  if (valid) return { kind: "existing", coupon: valid };
  if (isExpired(p)) return { kind: "error", message: "Coupon đã hết hạn" };
  if (p.status === "paused") return { kind: "error", message: "Coupon đang tạm dừng." };
  const counted = mine.filter((c) => couponState(c, p) !== "returned").length;
  if (p.perPersonLimit !== null && counted >= p.perPersonLimit) {
    return { kind: "error", message: `Đã đạt giới hạn ${p.perPersonLimit} lần/người cho coupon này` };
  }
  const offChannel = source === "Community" && !p.channels.includes("Community");
  if (offChannel || remainingSlots(p, s.coupons) <= 0) return { kind: "error", message: "Coupon đã hết lượt" };
  const now = Date.now();
  const coupon: Coupon = {
    id: uid("c"), promotionId, ownerId, code: `NX-${p.id.toUpperCase().slice(0, 7)}-${rand4()}`, status: "active",
    source, claimedAt: new Date(now).toISOString(), holdUntil: holdUntilFor(p, now),
  };
  storeActions.update((cur) => ({
    ...cur, coupons: [coupon, ...cur.coupons], promotions: mapPromotion(cur, promotionId, (x) => bump(x, source, 1, 0)),
  }));
  return { kind: "ok", coupon };
}

export function claimAsCurrent(promotionId: string) {
  const personId = getState().currentPersonId;
  if (!personId) return { kind: "error", message: "Cần tài khoản" } as ClaimResult;
  return claimFor(personId, promotionId, "Community");
}

/** nexora.link/c/<id>: phone → wallet; POS creates the client profile. */
export function claimOnPublicPage(promotionId: string, phone: string) {
  const s = getState();
  const owners = ownerIdsForPhone(s, phone);
  const result = claimFor(owners[0], promotionId, "QR");
  if (result.kind !== "error") lookupCustomer(phone);
  return result;
}

/** Demo helper for S04-06: make the hold end now, so the code returns its slot. */
export function expireHoldNow(couponId: string) {
  const past = new Date(Date.now() - 60_000).toISOString();
  storeActions.update((s) => ({
    ...s, coupons: s.coupons.map((c) => (c.id === couponId ? { ...c, holdUntil: past } : c)),
  }));
}

// ─── Wish list & keywords ────────────────────────────────────────────────────
export function toggleWish(promotionId: string) {
  const personId = getState().currentPersonId;
  if (!personId) return false;
  const list = wishlistOf(getState(), personId);
  const next = list.includes(promotionId) ? list.filter((x) => x !== promotionId) : [promotionId, ...list];
  storeActions.update((s) => ({
    ...s, dealWishlist: { ...(s.dealWishlist ?? seed.dealWishlistSeed), [personId]: next },
  }));
  return next.includes(promotionId);
}

export function followKeyword(raw: string): { error?: string; match?: Promotion } {
  const s = getState();
  const personId = s.currentPersonId;
  const kw = raw.trim().toLowerCase();
  if (kw.length < 2) return { error: "Từ khoá cần ít nhất 2 ký tự" };
  if (keywordsOf(s, personId).includes(kw)) return { error: "Bạn đã theo dõi từ khoá này" };
  const match = s.promotions.find(
    (p) => p.channels.includes("Community") && !isExpired(p) && p.status === "active" &&
      matchesKeyword(p, salonName(s, p.salonId), kw),
  );
  storeActions.update((cur) => ({
    ...cur,
    dealKeywords: { ...(cur.dealKeywords ?? seed.dealKeywordsSeed), [personId]: [...keywordsOf(cur, personId), kw] },
    dealNotifications: match
      ? [{ id: uid("n"), personId, keyword: kw, promotionId: match.id, at: new Date().toISOString() },
        ...(cur.dealNotifications ?? seed.dealNotificationsSeed)]
      : cur.dealNotifications,
  }));
  return { match };
}

export function unfollowKeyword(kw: string) {
  const personId = getState().currentPersonId;
  storeActions.update((s) => ({
    ...s,
    dealKeywords: {
      ...(s.dealKeywords ?? seed.dealKeywordsSeed),
      [personId]: keywordsOf(s, personId).filter((k) => k !== kw),
    },
  }));
}

// ─── POS · check-in ──────────────────────────────────────────────────────────
export function lookupCustomer(phone: string): { customer: Customer; created: boolean } {
  const s = getState();
  const digits = normalizePhone(phone);
  const existing = s.customers.find((c) => c.phone === digits);
  if (existing) return { customer: existing, created: false };
  const person = s.people.find((p) => p.phone && normalizePhone(p.phone) === digits);
  const customer: Customer = { id: uid("cus"), name: person?.name ?? "", phone: digits, visits: [] };
  storeActions.update((cur) => ({ ...cur, customers: [...cur.customers, customer] }));
  return { customer, created: true };
}

export function renameCustomer(id: string, name: string) {
  storeActions.update((s) => ({ ...s, customers: s.customers.map((c) => (c.id === id ? { ...c, name } : c)) }));
}

/** "✓ Tính tiền & ghi nhận" / "Không dùng ưu đãi". Re-checks eligibility right before writing. */
export type CheckoutResult = { error?: string; saved?: number; title?: string };
export function checkout(customerId: string, offerKey: string | null, bill: number): CheckoutResult {
  const s = getState();
  const customer = s.customers.find((c) => c.id === customerId);
  if (!customer) return { error: "Không tìm thấy khách" };
  const offer = offerKey ? gatherOffers(s, customer).find((o) => o.key === offerKey) : undefined;
  if (offerKey && (!offer || !offer.eligible)) return { error: "Ưu đãi này không đủ điều kiện" };
  const at = new Date().toISOString();
  const saved = offer ? savingsFor(offer.promotion, bill) : 0;
  const name = customer.name || "Khách mới";
  storeActions.update((cur) => {
    let next: DemoState = {
      ...cur,
      customers: cur.customers.map((c) => (c.id === customerId
        ? { ...c, visits: [{ at, bill, promotionId: offer?.promotion.id, saved: offer ? saved : undefined },
          ...c.visits] }
        : c)),
    };
    if (!offer) return next;
    const channel: Channel = offer.coupon ? offer.coupon.source : "POS";
    next = {
      ...next,
      promotions: mapPromotion(next, offer.promotion.id, (p) => bump(p, channel, offer.coupon ? 0 : 1, 1)),
      coupons: offer.coupon
        ? next.coupons.map((c) => (c.id === offer.coupon.id ? { ...c, status: "used", usedAt: at } : c))
        : next.coupons,
      redeemHistory: [{ id: uid("r"), customerName: name, promotionId: offer.promotion.id, code: offer.coupon?.code,
        channel, method: "Check-in", bill, saved, at }, ...next.redeemHistory],
    };
    return next;
  });
  return { saved, title: offer?.promotion.title };
}

// ─── POS · wallet redeem counter ─────────────────────────────────────────────
export type { WalletCheck };
/** Doc 04 flow 4 step 2 — the 7 rejections, in order (pure check in logic/walletCheck.ts). */
export const checkWalletCode = (code: string, pin: string) => checkWalletCodeIn(getState(), code, pin);

export function redeemWallet(code: string, pin: string, bill: number): { error?: string; saved?: number } {
  const check = checkWalletCode(code, pin);
  if (check.ok === false) return { error: check.message };
  const { coupon, promotion } = check;
  const s = getState();
  const owner = s.people.find((p) => p.id === coupon.ownerId);
  const phone = owner?.phone ?? (coupon.ownerId.startsWith("phone:") ? coupon.ownerId.slice(6) : "");
  const customer = phone ? lookupCustomer(phone).customer : undefined;
  const at = new Date().toISOString();
  const saved = savingsFor(promotion, bill);
  storeActions.update((cur) => ({
    ...cur,
    coupons: cur.coupons.map((c) => (c.id === coupon.id ? { ...c, status: "used", usedAt: at } : c)),
    promotions: mapPromotion(cur, promotion.id, (p) => bump(p, coupon.source, 0, 1)),
    customers: cur.customers.map((c) => (c.id === customer?.id
      ? { ...c, visits: [{ at, bill, promotionId: promotion.id, saved }, ...c.visits] } : c)),
    redeemHistory: [{ id: uid("r"), customerName: owner?.name ?? customer?.name ?? "Khách ví",
      promotionId: promotion.id,
      code: coupon.code, channel: coupon.source, method: "Ví", bill, saved, at }, ...cur.redeemHistory],
  }));
  return { saved };
}

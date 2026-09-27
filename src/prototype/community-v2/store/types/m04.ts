/** M04 · Deal & Coupon ↔ POS Promotion. POS is the single source; Community/SMS/QR are channels. */

export type OfferType = "percent" | "amount" | "bxgy" | "special" | "free";
/** Who the POS checks the program against, using visit history. */
export type Audience = "all" | "new" | "regular" | "lapsed";
/** Community filter "Dành cho": customers of salons vs. salons & techs (B2B). */
export type DealFor = "client" | "b2b";
export type Channel = "POS" | "Community" | "SMS" | "QR";
export type ProgramColor = "brand" | "violet" | "teal" | "warning";
export type ChannelStat = { claimed: number; used: number };

export type PromotionAds = { budgetPerDay: number; days: 3 | 7 | 14; radiusMi: 5 | 10 | 25; startedAt: string };

export type Promotion = {
  id: string;
  title: string;
  salonId: string;
  sponsored?: boolean;
  /** Stored state only. "Hết hạn" / "Hết lượt" are derived from expiresAt / slots. */
  status: "active" | "paused";
  emoji: string;
  offerType: OfferType;
  /** % for percent, $ for amount, price $ for special. 0 for bxgy/free. */
  offerValue: number;
  /** Free text for bxgy/free, e.g. "Mua 2 tặng 1". */
  offerText?: string;
  audience: Audience;
  dealFor: DealFor;
  condition: string;
  industry: string;
  channels: Channel[];
  createdAt: string;
  expiresAt: string;
  totalSlots: number;
  /** Slots returned to the pool by seed history (hold expiry before this demo). */
  returnedSeed: number;
  perPersonLimit: number | null;
  holdDays: number | null;
  color: ProgramColor;
  /** Distance from the viewer in miles; null = Online deal. */
  distanceMi: number | null;
  /** Bearing on the illustrative map, degrees. */
  mapAngle: number;
  /** Claimed / used per channel. POS = auto-suggested at check-in without a code. */
  stats: Record<Channel, ChannelStat>;
  ads?: PromotionAds;
};

export type CouponSource = "Community" | "SMS" | "QR";
export type Coupon = {
  id: string;
  promotionId: string;
  /** Person id, or `phone:<10 digits>` for someone who claimed on the public page without an account. */
  ownerId: string;
  code: string;
  /** Stored state; an active coupon past holdUntil / program expiry reads as "returned". */
  status: "active" | "used" | "returned";
  source: CouponSource;
  claimedAt: string;
  holdUntil: string;
  usedAt?: string;
};

export type CustomerVisit = { at: string; bill: number; promotionId?: string; saved?: number };
export type Customer = {
  id: string;
  name: string;
  /** Normalised 10 digits — the shared key with Community accounts. */
  phone: string;
  visits: CustomerVisit[];
};

export type RedeemHistoryItem = {
  id: string;
  customerName: string;
  promotionId: string;
  code?: string;
  channel: Channel;
  method: "Check-in" | "Ví";
  bill: number;
  saved: number;
  at: string;
};

export type DealNotification = { id: string; personId: string; keyword: string; promotionId: string; at: string };

export type M04State = {
  promotions: Promotion[];
  coupons: Coupon[];
  customers: Customer[];
  industries: string[];
  redeemHistory: RedeemHistoryItem[];
  /** Optional so the fixed shared seed merge stays untouched; the slice fills defaults. */
  dealWishlist?: Record<string, string[]>;
  dealKeywords?: Record<string, string[]>;
  dealNotifications?: DealNotification[];
};

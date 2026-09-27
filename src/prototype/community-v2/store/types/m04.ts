export type Promotion = { id: string; title: string; salonId: string; status: "active" | "paused" | "expired" | "sold-out"; value: string; sponsored?: boolean; type?: string; audience?: string; channels?: string[]; industry?: string; map?: { x: number; y: number } };
export type Coupon = { id: string; promotionId: string; ownerId: string; code: string; status: "active" | "used" | "returned" };
export type Customer = { id: string; name: string; phone: string; visits: number; lastVisitDays: number; visitHistory?: string[] };
export type RedeemHistoryItem = { id: string; customerId: string; promotionId: string; saved: number; at: string };
export type M04State = { promotions: Promotion[]; coupons: Coupon[]; customers: Customer[]; industries: string[]; redeemHistory: RedeemHistoryItem[] };

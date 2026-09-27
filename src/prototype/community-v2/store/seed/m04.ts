import type { Coupon, Customer, Promotion } from "../types";

export const industries = ["Nail", "Tóc", "Mi", "Spa", "Học viện", "Thuế & 1099", "Nhà cung cấp"];

export const promotions: Promotion[] = [
  { id: "promo-1", title: "Giảm 20% cho khách mới", salonId: "kayla-nails", status: "active", value: "20%", type: "Giảm %", audience: "Khách mới", channels: ["POS", "Community", "QR"], industry: "Nail", sponsored: true, map: { x: 36, y: 58 } },
  { id: "promo-2", title: "Giảm $15 Gel-X cuối tuần", salonId: "kayla-nails", status: "active", value: "$15", type: "Giảm $", audience: "Mọi khách", channels: ["POS", "Community"], industry: "Nail", map: { x: 44, y: 51 } },
  { id: "promo-3", title: "Mua 2 tặng 1 nail art", salonId: "lotus", status: "paused", value: "Mua 2 tặng 1", type: "Mua X tặng Y", audience: "Khách quen ≥2", channels: ["POS"], industry: "Spa", map: { x: 61, y: 44 } },
  { id: "promo-4", title: "Giá đặc biệt khách lâu không ghé", salonId: "crystal", status: "expired", value: "$39", type: "Giá đặc biệt", audience: "Lâu không ghé ≥60 ngày", channels: ["POS", "SMS"], industry: "Nail", map: { x: 70, y: 62 } },
  { id: "promo-5", title: "Quà sinh nhật", salonId: "bloom", status: "sold-out", value: "15%", type: "Giảm %", audience: "Mọi khách", channels: ["POS", "Community"], industry: "Nail", map: { x: 29, y: 49 } },
  { id: "promo-6", title: "Khóa học Gel-X", salonId: "gelx", status: "active", value: "10%", type: "Giảm %", audience: "Mọi khách", channels: ["Community"], industry: "Học viện", map: { x: 52, y: 31 } },
];

export const coupons: Coupon[] = [
  { id: "coupon-jessica", promotionId: "promo-2", ownerId: "jessica", code: "NX-3107-8K4P", status: "active" }, { id: "coupon-mai", promotionId: "promo-1", ownerId: "mai", code: "NX-6604-2L9Q", status: "active" }, { id: "coupon-used", promotionId: "promo-1", ownerId: "jessica", code: "NX-3107-USED", status: "used" }, { id: "coupon-returned", promotionId: "promo-4", ownerId: "mai", code: "NX-6604-RTN", status: "returned" },
];

export const customers: Customer[] = [
  { id: "linh", name: "Linh khách quen", phone: "7135554821", visits: 5, lastVisitDays: 14, visitHistory: ["2026-09-13", "2026-08-14", "2026-07-18", "2026-06-22", "2026-05-20"] }, { id: "mai", name: "Mai có coupon Community", phone: "7135556604", visits: 1, lastVisitDays: 21, visitHistory: ["2026-09-06"] }, { id: "trang", name: "Trang lâu không ghé", phone: "7135557765", visits: 4, lastVisitDays: 75, visitHistory: ["2026-07-14"] },
];

export const redeemHistory = [{ id: "redeem-1", customerId: "linh", promotionId: "promo-2", saved: 15, at: "2026-09-13" }, { id: "redeem-2", customerId: "mai", promotionId: "promo-1", saved: 12, at: "2026-09-06" }];

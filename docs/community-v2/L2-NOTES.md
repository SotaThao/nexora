# L2 · M04 Deal & Coupon ↔ POS Promotion — notes

## Layout
- `modules/m04-deals/index.tsx` — registry S04-01…S04-14. Every screen also renders the M04 toast layer (see below).
- `logic/` — pure rules: `domain.ts` (states, remaining slots, savings, formats, condition line),
  `eligibility.ts` (the 8 POS rules of doc 04, offer gathering), `walletCheck.ts` (7 wallet rejections),
  `dynamicCode.ts` (demo PIN/QR per 30 s window — not TOTP).
- `community/` S04-01…08 · `pos/` S04-09…14 · `ui/` shared pieces (DealCard, DealMap, PosFrame, QrCode, toast).
- `store/slices/m04.ts` — every write; touches only M04 keys. Optional keys `dealWishlist`, `dealKeywords`,
  `dealNotifications` fall back to seed defaults (the shared seed merge was not changed).
- Old persisted shapes (earlier drafts) are replaced by the seed on load — M04 keys only.

## Seed (dates relative to page load)
- Kayla Nails & Spa POS: kn01 👋 20% khách mới (tài trợ) · kn02 $15 mọi khách (còn 2 ngày, đỏ) · kn03 BXGY khách quen ·
  kn04 giá đặc biệt $39 lâu không ghé · kn05 tạm dừng · kn06 hết hạn · kn07 hết lượt (khách quen).
- Others: lt01 Lotus · cr01 Crystal · bl01 Bloom (hết lượt) · iv01 Ivy (Mi, 11.5 mi) · gx01 Học viện (Miễn phí, Online, B2B) ·
  tq01 TAX IQ (Online, B2B). Tóc and Nhà cung cấp are intentionally empty (S04-02 empty state).
- Check-in quick-tries show all 8 rules: Linh (rules 2 · 3 · 5b · 6 · 8), Mai (3 · 4 · 5b · 7 + eligible Community coupon),
  Trang (1 + eligible win-back), SĐT lạ (4 · 5a).
- Wallet redeem trial table in S04-12 triggers the 7 rejections in order.

## Cross-module / shared gaps (not fixed — outside L2 ownership)
- `ToastProvider` is not mounted by the shell, so the shared `useToast()` is a no-op (also for the gate's
  "✓ Đã tạo tài khoản" toast). M04 uses `ui/toast.tsx` as a stop-gap; switch back once L0 mounts the provider.
- Mobile module pills / bottom nav mark "Deal" active only on `/deals/nearby` (shell uses `startsWith` of that path).
- Desktop header title shows "Community" on param routes (`/deals/:id`, `/c/:id`, `.../:promotionId/qr`).

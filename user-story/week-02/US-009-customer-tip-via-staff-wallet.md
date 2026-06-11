# US-009 · Khách gửi tip qua ví của thợ

| | |
|---|---|
| **Trạng thái** | Tested |
| **Ngày tạo** | 2026-06-10 |
| **Epic / Domain** | Customer Tips |
| **OpenSpec change** | — (đã integrate trong phiên QA 2026-06-10) |
| **Test plan** | TC-08, TC-09 (`test_plan.md`) |

## Story

**Là** khách của tiệm (anonymous, quét QR),
**tôi muốn** chọn số tiền và phương thức theo ví thợ đã bật, thấy đúng handle ví + mã tham chiếu để chuyển tiền rồi xác nhận đã gửi,
**để** tip đến đúng thợ phục vụ tôi mà không cần tạo tài khoản.

## Acceptance Criteria

- **Given** tôi đã chọn thợ và số tiền trên `/touch/{businessSlug}/{touchPointSlug}`
- **When** tôi chọn phương thức thanh toán (chỉ hiện ví thợ đã bật, vd Venmo)
- **Then** FE gọi `POST /touch/tip` (201, nhận tipId) và `GET /touch/payment-link` (200); màn Wallet hiển thị đúng amount, tên thợ, handle ví thật (vd `@sota-test`) và note tham chiếu

- **Given** tôi đã chuyển tiền qua app ví ngoài
- **When** tôi bấm "Yes, I sent the tip"
- **Then** FE gọi `POST /touch/tip/{tipId}/confirm` (200), hiện màn cảm ơn, cache `customerTouch` được invalidate/refetch

## API Mapping

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| POST | `/api/v1/touch/tip` | ANON | `{ touchPointId, staffProfileId, amount, paymentMethod, sessionId }` — paymentMethod string enum `Venmo\|Zelle\|CashApp\|PayPal\|AppleCash` | 201 `{ id/tipId }` | (L) |
| GET | `/api/v1/touch/payment-link?staffId=&method=&amount=` | ANON | query | 200 `{ redirectUrl, zellePhone, zelleEmail, appleCashPhone }` — handle derive từ redirectUrl | (L) |
| POST | `/api/v1/touch/tip/{tipId}/confirm` | ANON | — | 200 | (L) |

**Điểm chưa chắc chắn / cần hỏi BE:** ~~response shape payment-link~~ → đã verify live 2026-06-10.

## FE Surface

| Layer | File | Thay đổi |
|---|---|---|
| Component | `customer-flow/steps/Payment.jsx` | API mode gọi `handlePay(wallet.name)` thay vì chỉ `setStep` (fix BUG-08) |
| Component | `customer-flow/steps/WalletDetails.jsx` | hiển thị handle từ `paymentLinkData` (fix BUG-07) |
| Component | `CustomerFlow.jsx` | truyền `isApiMode`, `handlePay`, `paymentLinkData` |
| Data hook | `usePublicTouch.js` — `useCreateTip`, `useConfirmTip` | confirm invalidate `['customerTouch']` |
| Repository | `publicTouch.js` | `createTip / getPaymentLink / confirmTip`, map enum wire format |

## Definition of Done

- [x] AC pass trên dev (API thật) — verify 2026-06-10
- [x] API call đúng contract (tip 201 → payment-link 200 → confirm 200, bắt network)
- [x] Confirm invalidate `customerTouch` (refetch quan sát được)
- [x] Không console error
- [x] Test 3 layer — L3 flow chạy thật, L2 qua network trace; L1 responsive deferred (TC-13)
- [x] Link TC: TC-08, TC-09

## Ghi chú phiên thực thi

- BUG-08 (P0): nút wallet không gọi `handlePay` → tip chỉ chạy UI, không xuống BE. Fixed.
- BUG-07 (P1): `paymentLinkData` được hook expose nhưng không component nào dùng → username N/A. Fixed.
- Bài học: integrate không có US/contract chốt trước → UI "trông chạy" nhưng không có API call nào. Network trace là bắt buộc trong DoD.

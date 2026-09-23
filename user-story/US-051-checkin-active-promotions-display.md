# US-051 · Check-in front desk: hiển thị promotion đang áp dụng

> File: `US-051-checkin-active-promotions-display.md` · Ticket #1724 (phần receptionist)

| | |
|---|---|
| **Trạng thái** | Integrated |
| **Ngày tạo** | 2026-09-23 |
| **Epic / Domain** | POS Check-in / Promotions |
| **OpenSpec change** | — (display-only, reuse existing promotions API) |
| **Test plan** | — |

## Story

**Là** lễ tân / front desk hoặc khách trên kiosk,
**tôi muốn** thấy các promotion đang áp dụng trên check-in,
**để** biết ưu đãi nào đang chạy (chỉ xem, không thao tác).

## Acceptance Criteria

### Front desk
- **Given** salon có promotion `isActive` trong khung ngày/giờ
- **When** tới form SinglePage check-in
- **Then** dưới services: carousel 2 card desktop, Prev/Next + autoplay, cao 9.25rem

### Kiosk
- **Given** device token hợp lệ và BE trả promotions
- **When** mở keypad self-check-in
- **Then** phía trên keypad hiện strip promo (cùng filter + carousel)
- **Given** BE chưa có endpoint (404)
- **Then** strip ẩn (không error UI)

## API Mapping

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/merchant/pos/{businessId}/promotions` | JWT | — | `PosPromotionApiDto[]` | (L) reuse |
| GET | `/api/v1/pos-device/self-checkin/promotions` | X-Pos-Device-Token | — | same list shape | **cần BE** — live swagger 2026-09-23 chưa có (probe 404); FE soft-empty |

**Điểm chưa chắc chắn / cần hỏi BE:** thêm `GET /api/v1/pos-device/self-checkin/promotions` (device token) trả list active promotions kèm banner fields giống merchant DTO.

## FE Surface

| Layer | File | Thay đổi |
|---|---|---|
| Component | `CheckInActivePromotionsSection.tsx` | Panel (merchant) + strip (kiosk) |
| Component | `CheckInSurface` / `SelfCheckInFlow` / `SinglePageCheckInLayout` | Wire surfaces |
| Hook | `useKioskPromotions` | Device-token query |
| Repository | `posSelfCheckIn.getPromotions` | Soft 404 → [] |
| Locale | `en.json` / `vi.json` | Keys section |

## Definition of Done

- [x] Section dưới services trên receptionist SinglePage check-in
- [x] Text hoặc image banner từ catalog promotions
- [x] Chỉ xem — không thao tác apply
- [x] Kiosk strip above keypad (FE ready)
- [ ] BE: `GET /api/v1/pos-device/self-checkin/promotions` (hiện 404 → strip ẩn)
- [ ] Verify tay front desk + kiosk khi BE sẵn

## Ghi chú phiên thực thi

- Carousel: Embla, desktop 2 slides, Prev/Next + autoplay 4.5s (pause khi hover). Lọc `isActive` + `isPromotionInScheduleNow`. Card `h-[9.25rem]`, nội dung color `justify-between`.
- Kiosk data path blocked on BE endpoint; FE soft-fails 404.

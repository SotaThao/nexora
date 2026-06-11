# NEXORA TOUCH — API Integration Guide v4

Version: 4.0 · Updated: 2026-06-10
Source of truth: **Live Swagger** `https://test-api.nexoratouch.com/api/` (spec: `/api/specification.json` — "Nexora API Document", 159 paths / 178 operations / 224 schemas)

> Thay thế guide v3 (2026-06-08). v3 đã lệch so với Swagger live ở nhiều điểm — xem mục **Changes vs v3** cuối tài liệu.
>
> Nguồn xác minh từng mục: **(S)** = đọc trực tiếp từ specification.json · **(L)** = đã verify bằng request thật trong phiên QA 2026-06-10 · **(v3)** = kế thừa từ guide v3, chưa re-verify với spec live.

Auth: JWT Bearer (`Authorization: Bearer {accessToken}`). Endpoint đánh dấu **ANON** không cần token (FE phải gửi với `{ anonymous: true }` qua httpClient).
Pagination chuẩn: response `{ items, pageNumber, totalPages, totalCount, hasNextPage, hasPreviousPage }`; query `PageNumber` (1-based), `PageSize`.
Error chuẩn: `ProblemDetails` + `errorCode` (vd `COMMON_UNAUTHORIZED`, `COMMON_VALIDATION_ERROR`, `STAFF_PROFILE_NOT_FOUND`).

---

## 1. Authentication (S)(L)

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/api/v1/Authentication/signin` | ANON | `{ email, password }` | 200 `{ accessToken, refreshToken, tokenType, expiresIn }` (L) |
| POST | `/api/v1/Authentication/signup` | ANON | `{ email, confirmEmail, password, confirmPassword, firstName, lastName, type }` | 201 (L) |
| POST | `/api/v1/Authentication/refresh-token` | ANON | `{ refreshToken }` | 200 tokens mới (L) |
| POST | `/api/v1/Authentication/verify-email` | ANON | `{ token, email }` (token = OTP) | 2xx; sai OTP → 400 Invalid verification code (L) |
| POST | `/api/v1/Authentication/send-verification-email` | ANON | `{ email }` | 2xx |
| POST | `/api/v1/Authentication/forgot-password` / `reset-password` | ANON | (S) | 2xx |
| POST | `/api/v1/Authentication/passwordless-signin` | ANON | (S) | 200 |

⚠️ Đường dẫn casing trong spec là `Authentication` (hoa) — server không phân biệt, FE đang dùng chữ thường, giữ nguyên được.

**Lưu ý nghiệp vụ (L):** JWT mint tại login KHÔNG tự cập nhật claims sau khi accept invite. Chuỗi đúng: `signin → accept invite → signin lại` để token mang staff claims (refresh-token chỉ gia hạn token cũ).

## 2. User Profile (S)(L)

| Method | Path | Auth | Ghi chú |
|---|---|---|---|
| GET | `/api/v1/UserProfile/me` | AUTH | 200 `{ id, email, firstName, lastName, fullName, phoneNumber, userType, status, profileImage{url,thumbnailUrl}, isEmailVerified, isPhoneVerified, isKYCVerified, lastLoginAt, dateOfBirth, gender, city, state, country, zipCode, address, contactInfo, referralCode }` (L) |
| GET | `/api/v1/UserProfile/verified-status` | AUTH | 200 KYB/KYC status (L) |
| PUT | `/api/v1/UserProfile/update` | AUTH | Body `{ firstName, lastName, phoneNumber, profileImageUrl?, city? }` → 200 (L) |
| GET | `/api/v1/UserProfile/{userId}` | AUTH | (S) |
| POST | `/api/v1/UserProfile/iframe/initialize`, `/kyc/initialize` | AUTH | KYC iframe (S) |
| DELETE | `/api/v1/UserProfile/delete-account` | AUTH | (S) |

🔴 **Quan trọng:** `/UserProfile/me` KHÔNG chứa staffCode/staffProfileId. Muốn biết user có là staff → dùng `GET /api/v1/staff/profile` (mục 4).

## 3. Merchant Staff Management (L)(v3) — base `/api/v1/merchant/staff`, AUTH

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/merchant/staff` | 200 paged. **`StaffListItemDto` (S)(L):** `{ linkId (guid), itemType: "link"\|"invite", staffProfileId (nullable), staffCode (nullable), displayName, photoUrl, position, status, sortOrder, isProfileComplete, tipCount, averageRating }` — ⚠️ doc v3 ghi field `id` là SAI, spec live + response thật đều là **`linkId`**. Query: `Keyword, PageNumber, PageSize` |
| POST | `/merchant/staff/invite` | Body `{ invitedName, invitedEmail?, invitedPhone?, invitedPosition? }` (email hoặc phone bắt buộc 1) → **201** (L). BE gửi email magic-link `/invite/{token}` |
| POST | `/merchant/staff/{inviteId}/resend` · `/{inviteId}/resend-invite` | 2xx (S) — spec có CẢ HAI route |
| GET | `/merchant/staff/search?q=` | 200 staff profile rút gọn (v3) |
| PUT | `/merchant/staff/{staffLinkId}/status` | Body `{ staffLinkId, status: "Active"\|"Rejected"\|... }` → **204** (L). FE hiện dùng route này để approve/decline |
| 🆕 POST | `/merchant/staff/links/{linkId}/approve` | (S) Endpoint approve chuyên dụng — cân nhắc chuyển FE sang dùng thay PUT status |
| 🆕 POST | `/merchant/staff/links/{linkId}/reject` | (S) Endpoint reject chuyên dụng |
| PUT | `/merchant/staff/reorder` | Body `{ items: [{ id, sortOrder }] }` → 204 (v3) |
| DELETE | `/merchant/staff/{staffLinkId}` | 204 unlink — không xóa staff profile/payment data (v3) |
| POST | `/merchant/staff/link-request/{staffProfileId}` | 204 (Luồng B) (v3) |

## 4. Staff Self-Service (S)(L) — base `/api/v1/staff`, mixed auth

| Method | Path | Auth | Ghi chú |
|---|---|---|---|
| GET | `/staff/invite/{token}` | ANON | 200 `{ invitedName, invitedPosition, businessName }` (L) |
| POST | `/staff/invite/{token}/accept` | ANON | Body `{ token, displayName, position?, bio?, photoUrl? }` → **204** (L). Tạo StaffProfile + pre-seed payment methods (inactive) |
| POST | `/staff/join-public-invite` | ANON | Body `{ referralCode, displayName, phoneNumber?, position?, bio?, photoUrl? }` (S) — luồng QR public |
| **GET** | **`/staff/profile`** | AUTH | 🆕 **200 `StaffProfileDto { id, staffCode, displayName, position, bio, photoUrl, isProfileComplete }`** (S)(L). 404 `STAFF_PROFILE_NOT_FOUND` nếu user chưa là staff → **đây là cách chuẩn để FE detect staff identity + lấy staffCode** |
| POST | `/staff/profile` | AUTH | 🆕 Body `{ displayName, position?, bio?, photoUrl? }` → 201 StaffProfileDto; 409 nếu đã tồn tại (S) |
| PUT | `/staff/profile` | AUTH | Body `{ displayName (2–100, bắt buộc), position?, bio? (≤200), photoUrl? }` → 204 (S)(L) |
| **GET** | **`/staff/businesses`** | AUTH | 🆕 200 paged `StaffBusinessDto { businessId, businessName, address, city, state, logoUrl, role, roleLabel, linkStatus, linkStatusLabel, linkedAt }` (S)(L). Query `PageNumber, PageSize` |
| **GET** | **`/staff/dashboard/summary`** | AUTH | 🆕 200 `StaffDashboardSummaryDto { todayTips: TipCountAmountDto, thisMonthTips: TipCountAmountDto, pendingTips: TipCountAmountDto, averageRating (decimal), totalReviews (int) }`; `TipCountAmountDto { count, totalAmount }` (S) |
| **GET** | **`/staff/reviews`** | AUTH | 🆕 200 `StaffReviewsResultDto { summary: { totalReviews, averageRating, distribution }, items: StaffReviewItemDto[], pageNumber, totalPages, totalCount }`; `StaffReviewItemDto { id, rating, comment?, customerName?, businessName, createdAt }` (S). Query `PageNumber, PageSize` |
| GET | `/staff/tips` | AUTH | 200 paged `StaffTipDto { id, amount, totalAmount, status: Initiated\|Confirmed\|Skipped\|Completed, statusLabel, paymentMethod, isMultiStaff, touchPointName, businessName, createdAt, confirmedAt?, staffConfirmedAt?, merchantConfirmedAt? }`. Query `DateFrom, DateTo, Status, PageNumber, PageSize` (S) |
| **POST** | **`/staff/tips/confirm-receipt`** | AUTH | 🆕 Body `{ tipIds: guid[] }` → 200 `{ confirmedCount, failedIds: guid[] }` (S) — xác nhận đã nhận tiền hàng loạt |

## 5. Staff Payment Methods (S)(L) — base `/api/v1/staff/payment-methods`, AUTH

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/staff/payment-methods` | 200 `[{ id, type, accountInfo, imageUrl, isActive, isConfigured }]` (L). 404 nếu chưa có StaffProfile |
| PUT | `/staff/payment-methods/{id}` | Body `{ accountInfo, imageUrl? }` → 200 (L) |
| PATCH | `/staff/payment-methods/{id}/toggle` | 200 `{ isActive, isConfigured }` (L). Staff có ≥1 method active+configured → `isProfileComplete=true` → hiện trên touch page |

Type enum: `Zelle, BankWire, PayPal, Venmo, CashApp, AppleCash, VlinkPay` (v3/L).

## 6. Customer Touch (Public, ANON) (S)(L) — base `/api/v1/touch`

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/touch/{businessSlug}/{touchPointSlug}?sessionId=` | 200 `{ business{ name, logoUrl, description }, touchPoint{ id, name, type, assignedStaffProfileId }, staff: [{ id, displayName, photoUrl, position, bio, availablePaymentMethods: ["venmo",...] }] }` (L). Chỉ staff Active + isProfileComplete xuất hiện |
| POST | `/touch/tip` | Body `{ touchPointId, staffProfileId, amount, paymentMethod (string enum), sessionId }` → **201** `{ id/tipId, ... }` (L) |
| GET | `/touch/payment-link?staffId=&method=&amount=` | 200 `{ redirectUrl, zellePhone, zelleEmail, appleCashPhone }` (L) — handle ví derive từ redirectUrl (vd `venmo.com/{handle}`) |
| POST | `/touch/tip/{tipId}/confirm` | 200 (L) |
| POST | `/touch/tip/skip` | Body `{ touchPointId, staffProfileId, sessionId }` → 2xx (v3) |
| POST | `/touch/review` | Body `{ touchPointId, tipId?, staffProfileId, rating 1–5, comment?, customerEmail?, customerName? }` → **201** `{ reviewId }` (L) |
| POST | `/touch/review/{reviewId}/track-google` / `track-yelp` | 2xx (S) |

PaymentMethod wire format: **string enum** `CashApp | Venmo | Zelle | PayPal | AppleCash | Other` (S/L — không phải integer như PDF cũ).

## 7. Multi-Staff Tip & Public Business (S)(v3)

| Method | Path | Auth | Ghi chú |
|---|---|---|---|
| GET | `/api/v1/public/businesses/{businessId}/payment-methods` | ANON | 200 — DTO dùng `accountInfo` (không phải handle/address/value) |
| GET | `/api/v1/public/businesses/{businessId}/payment-methods/{id}` | ANON | 200 |
| POST | `/api/v1/tips/multi-staff` | ANON | Body `{ businessId, touchPointId, businessPaymentMethodId, tipItems: [{ staffProfileId, amount }] }` → 201 |
| PATCH | `/api/v1/tips/{id}/confirm` | ANON | 200 |
| GET | `/api/v1/public/merchant-invite`, `/api/v1/public/qr`, `/api/v1/public/app-information` | ANON | (S) |

## 8. Notifications (S)(L) — AUTH

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/api/v1/Notifications` | 200 **paged `{ items: [{ id, type, title, body, isRead, createdAt }], pageNumber, ... }`** (L) — ⚠️ FE phải đọc `items` (không phải `data`). Query `pageNumber, pageSize` |
| GET | `/api/v1/Notifications/unread-count` | 200 `{ count }` (L) |
| PUT | `/api/v1/Notifications/{id}/read` | **204** (L) |
| PUT | `/api/v1/Notifications/read-all` | 2xx (S) |

Loại notification BE đang phát (L): `StaffInviteAccepted`. 🔴 **BE gap:** chưa phát `TipReceived` / `ReviewSubmitted` — merchant không được báo khi có tip/review mới.

## 9. Merchant Dashboard (S)(L) — AUTH

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/merchant/dashboard/overview` | 200 metrics (S) |
| GET | `/merchant/dashboard/staff` | 200 (L) |
| GET | `/merchant/dashboard/tips` | 200 (L). Filters (v3) |
| GET | `/merchant/dashboard/tips-chart` | 200 (S) |
| GET | `/merchant/dashboard/reviews` | 200 (L). Query rating/source/resolved (v3) |
| PUT | `/merchant/dashboard/reviews/{id}/resolve` | 2xx (S) |
| GET | `/merchant/dashboard/touchpoints` | 200 (S) |

## 10. Merchant Business & Touch Points (S)(L)(v3) — AUTH

| Method | Path | Ghi chú |
|---|---|---|
| GET/PUT | `/merchant/business` | 200 — có `slug` cho touch URL (L) |
| GET | `/merchant/business/check-slug` | 200 (S) |
| PUT | `/merchant/business/review-links` | 2xx (S) — Google/Yelp links |
| POST | `/merchant/business/logo` | 2xx (S) |
| POST | `/merchant/business/complete-onboarding` | 🆕 2xx (S) — đánh dấu hoàn tất onboarding merchant |
| POST | `/merchant/tips/confirm-receipt` | 🆕 2xx (S) |
| CRUD | `/merchant/touchpoints` | (v3) — POST tạo touchpoint + QR PNG; URL format `{baseUrl}/touch/{businessSlug}/{touchPointSlug}` (L) |
| CRUD | `/merchant/payment-methods` | (v3) — GET/PUT/{id}/PATCH toggle |

## 11. Images (S)

`POST /api/v1/Images/upload`, `/upload/multiple` (AUTH) · `POST /api/v1/Images/public/upload`, `/public/upload/multiple` (ANON) → 200 `{ fileUrl }`.

## 12. Khác trong spec (ngoài scope FE hiện tại) (S)

`Client/ecosystem*`, `ExternalService/vlinkpay*` (SSO VlinkPay), `Location/*` (autocomplete địa chỉ), `banners/active`, `blog-categories`, admin endpoints.

---

## Changes vs v3 (quan trọng cho FE)

1. 🆕 **`GET /staff/profile`** — v3 chỉ ghi PUT. Đây là endpoint chuẩn lấy `staffCode` + detect staff identity (thay cho mọi heuristic từ `/UserProfile/me`).
2. 🆕 **`GET /staff/businesses`** — danh sách tiệm đã liên kết cho staff (v3 không có → trước đây FE phải dùng dữ liệu local).
3. 🆕 **`GET /staff/dashboard/summary`**, **`GET /staff/reviews`**, **`POST /staff/tips/confirm-receipt`**, **`POST /staff/profile`** (setup), **`POST /merchant/business/complete-onboarding`**, **`POST /merchant/tips/confirm-receipt`**.
4. ⚠️ **`GET /merchant/staff` item trả `linkId`/`inviteId`** thay vì `id` như v3 → từng gây bug approve silent-fail (BUG-04). FE normalize: `id ?? linkId ?? inviteId`.
5. ⚠️ **Notifications là paged `{items}`** — v3 mô tả mơ hồ, FE từng đọc `response.data` (BUG-09).
6. ⚠️ `/touch/payment-link` response thực tế: `{ redirectUrl, zellePhone, zelleEmail, appleCashPhone }` — v3 không mô tả shape.
7. PaymentMethod là **string enum** (xác nhận lại kết luận của customer-tips report; PDF integer enum là sai).
8. Path casing trong spec: `Authentication`, `UserProfile`, `Notifications`, `Images` viết hoa; nhóm mới (`staff`, `merchant`, `touch`, `public`, `tips`) viết thường.

## Khuyến nghị quy trình

- Khi nghi ngờ contract: đối chiếu **Swagger UI** `https://test-api.nexoratouch.com/api/index.html?url=/api/specification.json` trước, tài liệu markdown chỉ là bản chụp.
- Toàn bộ DTO staff-side trong tài liệu này đã dump trực tiếp từ specification.json (2026-06-10).
- 🆕 Spec có endpoint approve/reject chuyên dụng (`POST /merchant/staff/links/{linkId}/approve|reject`) — FE hiện dùng `PUT /{staffLinkId}/status`; cân nhắc migrate để ngữ nghĩa rõ hơn.

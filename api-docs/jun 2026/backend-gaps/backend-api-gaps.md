# Nexora Touch — Yêu cầu Backend bổ sung API (Dashboard Phase)

> **Ngày:** 2026-06-06
> **Người gửi:** Frontend Team (vlink-nexora-fe)
> **Nguồn đối chiếu:** `API/nexora-touch-end-user-ai-coding-spec.md` (API Integration Guide v2.0) §7 — API Endpoint Map
> **Bối cảnh:** Sau khi hoàn tất phase nền tảng (Auth + Merchant Onboarding + Staff Payment Methods), FE bắt đầu tích hợp **Dashboard** cho 2 role: **Business (Merchant)** và **Personal (Staff)**. Đối chiếu nhu cầu dữ liệu của từng màn hình với endpoint hiện có, dưới đây là các API còn thiếu / cần làm rõ.
>
> Các path bên dưới là **đề xuất** theo convention hiện tại (`/api/v1/...`, lowercase). Backend toàn quyền quyết định path/shape cuối cùng.

---

## 🐞 NHÓM 0 — BUG cần Backend fix gấp (blocker toàn bộ flow business)

### Bug B1 — `signup` không persist `profileType` → tài khoản business bị tạo thành `User` → 403 ở mọi endpoint merchant

> **Tham chiếu docs:** `POST /api/v1/authentication/signup` khai báo field `profileType` (string, **Required**) nhận `"Merchant"` hoặc `"User"`.

**Phân tích FE → BE:**

| Tầng | Kết quả kiểm tra |
|------|------------------|
| FE gửi (business) | `useRegisterForm.js:189` gửi `profileType: "Merchant"` — **ĐÚNG** theo docs. `role` được set tại `StepRoleSelect.jsx:53`. |
| FE gửi (staff) | Trước đây gửi `"Personal"` — **SAI enum** (docs chỉ có `Merchant`/`User`). → **FE đã sửa** thành `"User"`. |
| FE đọc `/me` | `apiAuthAdapter.js` đọc `profile.profileType`; test mock cũng trả field `profileType`. |
| Thực tế BE | `GET /userprofile/me` trả `User` cho **cả hai** loại; account business thực sự là `User` trên DB — bằng chứng: **403 `USER_NOT_MERCHANT`** khi gọi `/api/v1/merchant/*`. |

**→ Vì FE business gửi đúng `"Merchant"` mà account vẫn ra `User` → nguyên nhân chính nằm ở Backend (không persist / không trả lại `profileType`).**

**Hậu quả:** flow đăng ký + onboarding business **bị chặn hoàn toàn** (mọi call `/api/v1/merchant/*` → 403).

**Backend cần kiểm theo thứ tự:**
1. Handler `POST /signup` có **đọc & lưu** `request.profileType` vào DB không, hay đang gán cứng `UserProfileType.User` / bỏ qua field DTO?
2. `GET /api/v1/userprofile/me` có trả `profileType` **đúng giá trị đã lưu** không? Tên field trả về là `profileType` hay `userType`? (FE đang đọc `profileType` — nếu BE trả `userType` thì kể cả khi đã persist Merchant, FE vẫn map nhầm thành personal.)
3. Cơ chế authorization của các endpoint `/api/v1/merchant/*` có key theo `profileType` đã lưu không?

**Definition of Done:** đăng ký Merchant → `/me` trả `profileType: "Merchant"` → gọi `/api/v1/merchant/*` **không còn 403**.

**Workaround tạm của FE (sẽ gỡ sau khi BE fix):** đoán role business theo email chứa `biz`/`merchant` (`src/auth/adapters/apiAuthAdapter.js`, đã đánh dấu `TODO(backend-bug B1)`). Chỉ map UI ở client, **không** qua được phân quyền backend → không dùng được cho production.

---

## 🔴 NHÓM 1 — Chặn trực tiếp phase Dashboard (must-have)

### 1A. Role Personal (Staff) — hiện **không có bất kỳ** endpoint dashboard nào

Spec chỉ có endpoint staff cho: profile update, payment-methods, invite/accept. **Không có** endpoint cho tips/earnings/reviews/KPIs của chính staff → các màn Home / Tips / Reviews của staff không có nguồn dữ liệu.

| # | Mục đích | Màn hình FE | Đề xuất endpoint | Response cần có |
|---|----------|-------------|------------------|-----------------|
| 1 | KPIs của staff (tip hôm nay/tháng, số pending, rating TB) | `StaffHome` | `GET /api/v1/staff/dashboard/overview` | `{ todayTips, todayCount, monthTips, pendingCount, averageRating }` |
| 2 | Danh sách tip mà staff nhận được (kèm status) | `StaffTips` | `GET /api/v1/staff/dashboard/tips` (hỗ trợ phân trang) | `[{ id, amount, method, status (Initiated/Confirmed), businessName, dateTime }]` |
| 3 | Staff xác nhận "đã nhận tiền" | `StaffTips` (nút Confirm) | `POST /api/v1/staff/tips/{tipId}/confirm` | `200 OK` |
| 4 | Reviews về riêng staff này | `StaffReviews` | `GET /api/v1/staff/dashboard/reviews` | `[{ id, rating, comment, routingType, dateTime }]` |
| 5 | Danh sách business mà staff đang liên kết (+ trạng thái) | `StaffHome`, `StaffProfile` | `GET /api/v1/staff/businesses` (hoặc `/staff/links`) | `[{ businessStaffLinkId, businessName, status, displayName }]` |

### 1B. Role Business (Merchant)

| # | Mục đích | Màn hình FE | Đề xuất endpoint | Ghi chú |
|---|----------|-------------|------------------|---------|
| 6 | Danh sách giao dịch/tip chi tiết (history) | `TipsView`, `TransactionDetailModal`, charts trong `ReportsView` | `GET /api/v1/merchant/dashboard/transactions` (phân trang + filter ngày) | Spec **chỉ có metric tổng hợp** `/dashboard/overview`, **không có** list giao dịch → các màn list này không có nguồn dữ liệu |

---

## 🟡 NHÓM 2 — Cần cho dashboard đầy đủ (settings & tính năng phụ)

| # | Mục đích | Màn hình FE | Đề xuất endpoint |
|---|----------|-------------|------------------|
| 7 | Đặt display name (nickname) theo từng business | `StaffProfile` | `PUT /api/v1/staff/links/{linkId}/display-name` |
| 8 | Get/Set tuỳ chọn push notification của staff | `StaffNotifications` | `GET` + `PUT /api/v1/staff/notification-preferences` |
| 9 | Đọc profile staff chi tiết (bio, position, photo) | `StaffProfile` | `GET /api/v1/staff/profile` — spec hiện chỉ có `PUT /staff/profile`, **chưa có GET** (cần xác nhận `/userprofile/me` có trả bio/position/photo không) |
| 10 | QR cá nhân của staff / QR theo business | `StaffMyQR` | Cần làm rõ: staff QR = một `StaffCard` touch point do merchant tạo, hay staff tự sinh? Spec **chưa có** endpoint staff-self QR |

> **ℹ️ KYB/KYC — KHÔNG yêu cầu API riêng:** Luồng KYB/KYC được nhúng bằng **iframe từ VLINKPAY**; FE không build endpoint backend riêng. Trạng thái duyệt được đọc qua field `businessKybStatus` (đã có sẵn trong `PaymentMethodDto`, spec §5) để gate việc bật phương thức **VlinkPay**.
> *Cần Backend xác nhận:* URL/token khởi tạo iframe lấy từ đâu — URL tĩnh của VLINKPAY hay backend cấp session token? Nếu chỉ nhúng URL tĩnh thì **không cần gì thêm**.

---

## 🟢 NHÓM 3 — Làm rõ hợp đồng (không phải endpoint mới, chỉ cần xác nhận schema)

| # | Câu hỏi cho Backend | Endpoint liên quan |
|---|---------------------|--------------------|
| 11 | Tên field JSON chính xác của metrics + có param lọc theo khoảng ngày không? | `GET /api/v1/merchant/dashboard/overview` |
| 12 | Các query param filter được hỗ trợ (rating / source / resolved)? | `GET /api/v1/merchant/dashboard/reviews` |
| 13 | `resolve` có cần body (vd `{ resolutionNote }`) hay chỉ là chuyển trạng thái? | `PUT /api/v1/merchant/dashboard/reviews/{id}/resolve` |
| 14 | Shape notification: có field `isRead`? timestamp ISO? enum `type` gồm những giá trị nào? | `GET /api/v1/notifications` |

---

## Tóm tắt mức độ ưu tiên

- 🐞 **Bug B1 (signup/profileType)** — ưu tiên **CAO NHẤT**: chặn toàn bộ flow đăng ký + onboarding business (403). Cần fix trước khi test các phần khác.
- **Phần Personal (Staff) gần như trống** ở backend cho dashboard — items **#1–#5** là blocker lớn nhất. Nếu chưa có, role personal chỉ hiển thị được Profile + Payment methods + Notifications (đúng theo scope "defer + empty state" FE đã chốt).
- **Item #6** (transaction list) chặn các màn list giao dịch của merchant.
- **KYB/KYC** dùng iframe VLINKPAY — **không cần API backend riêng** (xem ghi chú ở Nhóm 2); chỉ cần xác nhận nguồn URL/token của iframe.
- **#11–#14** chỉ cần backend trả lời; FE đã thiết kế tầng repository để map lại nên sửa rất nhanh.

---

## Đã có sẵn — KHÔNG thiếu API (chỉ chưa wire ở FE, thuộc phase sau)

Các nhóm sau đã có endpoint đầy đủ trong spec, FE sẽ tích hợp ở phase tiếp theo:

- **Staff management** (invite / resend / list / search / status / reorder / unlink / link-request) — spec §4.3
- **Touch points CRUD** (create / list / download / delete) — spec §4.5
- **Business & Staff payment-method** (get / update / toggle) — spec §4.9
- **Merchant dashboard metrics tổng hợp** (overview / staff / touchpoints / reviews + resolve) — spec §4.10

---

*Tài liệu này được sinh kèm phiên bản HTML: `API/backend-api-gaps.html`.*

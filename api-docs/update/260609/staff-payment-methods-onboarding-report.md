# Báo cáo: Flow tạo/cấu hình Payment Method ở Onboarding (Staff)

- **Ngày:** 2026-06-10
- **Branch:** `feat/integrate-staff-invite-api`
- **Phạm vi:** Staff invite onboarding — bước cấu hình payment methods
- **File liên quan:** `src/components/staff-registration/hooks/useStaffRegistration.js`, `src/data/repositories/staffPaymentMethods.js`, `src/auth/adapters/apiAuthAdapter.js`
- **Tài liệu API:** `API/update/260609/api-integration-guide-v3.md`

---

## 1. Tóm tắt vấn đề

Trong onboarding, request `GET /api/v1/staff/payment-methods` trả về **404**. Ban đầu nghi ngờ là "gọi sai endpoint" và đề xuất dùng `PUT` thay cho `GET`.

**Kết luận:** Endpoint `GET` **không sai**. 404 thực chất là `STAFF_PROFILE_NOT_FOUND` (token thiếu claim staff-profile), không phải `STAFF_PAYMENT_METHOD_NOT_FOUND`. Đồng thời, `PUT` **không thể thay** `GET` vì kiến trúc API không có thao tác "create".

---

## 2. Khái niệm cốt lõi: KHÔNG có "create" thật sự

Staff **không bao giờ tạo mới** payment method. Backend tự **pre-seed sẵn 5 method** (tất cả `inactive`, `accountInfo = null`) ngay khi staff **accept invite**.

> Trích guide (step 4): `POST /api/v1/staff/invite/{token}/accept` → *"Creates UserProfile + StaffProfile + pre-seeds 5 payment methods, all inactive"*

- 5 method: **Zelle, CashApp, Venmo, PayPal, AppleCash** (theo `PayoutMethodType`).
- Mỗi method đã có sẵn `id` (UUID) trong DB.
- **Không có endpoint `POST`** để tạo staff payment method (đã grep toàn bộ guide — 0 kết quả).

→ "Tạo payment method ở onboarding" thực chất = **điền `accountInfo` vào các method có sẵn → bật (`toggle`) method muốn dùng**.

---

## 3. Vì sao PUT không thể thay GET

`PUT /api/v1/staff/payment-methods/{id}` **bắt buộc** có `{id}` trong path. Nếu id không tồn tại → `404 STAFF_PAYMENT_METHOD_NOT_FOUND`.

`id` của 5 method là UUID do backend sinh ra — **frontend không biết trước**. Cách duy nhất lấy id là gọi `GET` để list. Vì vậy flow bắt buộc:

```
GET   /api/v1/staff/payment-methods            → [{id, type:"Zelle", isActive:false, isConfigured:false}, ... x5]
                                                  (lấy id theo từng type)
PUT   /api/v1/staff/payment-methods/{id}        → { accountInfo: "+17131234567" }     (điền số/handle)
PATCH /api/v1/staff/payment-methods/{id}/toggle → bật method (isActive: true)
```

`GET` không phải "thừa" — đây là bước **bắt buộc để map type → id** trước khi `PUT`. Flow này lặp lại nhất quán trong mọi mục của guide (Flow 2, Flow 5, mục step-by-step).

---

## 4. Đối chiếu code thật

`src/components/staff-registration/hooks/useStaffRegistration.js` — `handleActivateProfile` (~dòng 809):

```js
const methods = await staffPaymentMethodsRepository.getAll()   // (1) GET: lấy 5 method pre-seeded + id

for (const [key, cfg] of Object.entries(payouts)) {            // payouts = { zelle: {enabled, value}, ... } từ UI
  const match = methods.find(m =>                               // (2) map type UI ↔ type backend để tìm đúng id
    m.type.toLowerCase().replace(/\s+/g,'') === key.toLowerCase().replace(/\s+/g,'')
  )
  if (match) {
    if (cfg.value)                await update(match.id, { accountInfo: cfg.value })  // (3) PUT: điền accountInfo
    if (cfg.enabled && cfg.value) await toggle(match.id)                              // (4) PATCH: bật lên
  }
}
```

→ Code **đã đúng** với flow tài liệu (GET → PUT → PATCH). `PUT` đã được dùng để lưu; `GET` chỉ để lấy id.

---

## 5. Nguyên nhân thật của 404 & cách fix

### Nguyên nhân
404 ở `GET` là **`STAFF_PROFILE_NOT_FOUND`** (resolve profile từ token claim thất bại), không phải lỗi endpoint.

Thứ tự call cũ trong `handleProfileSubmit`:

```
1. login()            → token KHÔNG có claim staff (mint trước khi accept)
2. acceptInvite()     → link StaffProfile
3. refreshSession()   → refresh-token chỉ gia hạn token CŨ (vẫn thiếu claim) ❌
```

→ Token vẫn thiếu claim staff → mọi call `/staff/*` tiếp theo 404.

### Cách fix (đã áp dụng)
Thay `refreshSession()` (refresh-token) bằng **`login()` (signin lại)** sau khi accept:

```
1. login()         → token claimless
2. acceptInvite()  → link StaffProfile
3. login() lại     → signin re-resolve TOÀN BỘ claim từ DB (đã có StaffProfile) ✅
```

Đúng theo trình tự tài liệu (Flow 2): `accept → signin → GET payment-methods (200)`.

- **File thay đổi:** `src/components/staff-registration/hooks/useStaffRegistration.js`
- **Verify:** `pnpm build` pass.
- **Chưa verify được trên browser preview** vì cần invite magic-link token + OTP email thật với backend live.

---

## 6. Bảng đối chiếu hiểu nhầm vs thực tế

| Hiểu nhầm | Thực tế |
|---|---|
| "Phải PUT để tạo method mới" | Method đã pre-seed sẵn khi accept; PUT chỉ **update** method có sẵn |
| "GET là sai, bỏ đi" | GET là bước **bắt buộc** để lấy `id` map theo type trước khi PUT |
| "GET 404 vì gọi sai endpoint" | GET 404 vì **token thiếu claim staff** — đã fix bằng signin lại |

---

## 7. Kết luận & bước tiếp theo

- **Không đổi** sang PUT. Flow hiện tại (GET → PUT → PATCH) đã đúng kiến trúc API.
- Fix token (signin lại sau accept) là thứ làm `GET` hết 404; sau đó PUT/PATCH chạy bình thường.
- **Cần test lại onboarding** sau fix:
  - Nếu `GET /staff/payment-methods` **hết 404** → toàn bộ flow OK.
  - Nếu **vẫn 404** → đào tiếp hướng timing claim hoặc backend chưa link profile kịp sau accept.

---

## Endpoint tham chiếu (Staff Payment Methods)

| Method | Endpoint | Mục đích |
|--------|----------|----------|
| `GET` | `/api/v1/staff/payment-methods` | List 5 method pre-seeded (+ id, type, isActive, isConfigured) |
| `PUT` | `/api/v1/staff/payment-methods/{id}` | Set `accountInfo` / `imageUrl` (full replace; `null` để xoá field) |
| `PATCH` | `/api/v1/staff/payment-methods/{id}/toggle` | Bật/tắt `isActive` |

> BR-ST01: Staff phải có ít nhất 1 method vừa `isActive` vừa `isConfigured` thì mới hiện trên customer touch page (`isProfileComplete = true`).

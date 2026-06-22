# Bug — Staff "Confirm tip receipt" thất bại (FE: sai status filter — ĐÃ FIX; BE: confirm-receipt từ chối mọi tip — CHƯA FIX)

> **Ngày:** 2026-06-22
> **Người gửi:** Frontend Team (vlink-nexora-fe)
> **Branch:** `bugfix/staff-confirm-tips-receipt`
> **Nguồn đối chiếu:** Live Swagger `https://test-api.nexoratouch.com/api/specification.json`
> **Màn hình:** Staff Dashboard → Home → "Pending Confirmations" (nút **Confirm** / **Confirm All Received**)

---

## 1. Hiện tượng

Staff bấm **Confirm** / **Confirm All Received** → toast *"Confirmed 0 tip(s)…"*, không tip nào được xác nhận.

Response `POST /api/v1/staff/tips/confirm-receipt`:

```json
{ "confirmedCount": 0, "failedIds": ["7d1f3714-b4de-4cbd-803e-eac5c88b90ce"] }
```

---

## 2. Root cause — FE lọc SAI status (đây là bug FE, không phải BE)

**Vòng đời tip** (xác nhận qua Swagger + code customer flow):

```
Initiated  →  Confirmed  →  (staff/merchant confirm receipt)  →  Completed
   │             │
   │             └─ Khách xác nhận ĐÃ trả tiền (PATCH /api/v1/tips/{id}/confirm — PublicTips, no-auth).
   │                Dùng ở customer flow: useCustomerFlow.handleConfirmTip ("Confirms that customer
   │                completed external wallet payment").
   └─ Khách mới chọn tip, CHƯA trả tiền.
```

- `POST /staff/tips/confirm-receipt` (JWT, tag Staff) = **staff xác nhận ĐÃ NHẬN tiền** → set `staffConfirmedAt`.
- Staff chỉ xác nhận nhận tiền được khi khách **đã trả** → tip phải ở `Confirmed`.

**FE đang lọc danh sách "Pending Confirmations" bằng `Status=Initiated`** (`useStaffHomeData.ts`) — tức các tip khách **chưa trả**. Staff không thể "đã nhận" số tiền chưa được gửi → BE từ chối toàn bộ id → `failedIds`, `confirmedCount: 0`. **Đúng như quan sát.**

### Bằng chứng

| # | Bằng chứng | Nguồn |
|---|-----------|-------|
| 1 | `PATCH /api/v1/tips/{id}/confirm` trên tip `7d1f3714…` → **200** (đẩy Initiated → Confirmed) | Test Swagger (PublicTips) |
| 2 | Endpoint trên là **PublicTips, no-auth** = hành động của KHÁCH, không phải staff | Swagger `operationId: PublicTips_ConfirmTip` |
| 3 | `StaffTipDto` có 3 mốc tách biệt: `confirmedAt` (khách), `staffConfirmedAt`, `merchantConfirmedAt` → xác nhận nhiều bên | Swagger schema |
| 4 | KPI "Pending" = **4** (từ `dashboard/summary.pendingTips`) ≠ list `Status=Initiated` = **3** → hai tập tip khác nhau, vì list dùng sai status | UI + network |

---

## 2b. 🔴 KẾT LUẬN SAU KIỂM CHỨNG — ĐÂY LÀ BUG BACKEND (blocker)

Sau khi FE sửa filter sang `Status=Confirmed` (list giờ đã khớp `pendingTips.count`: 1=1), confirm **vẫn fail**. Đã test cả 2 trạng thái:

| Trạng thái tip | tipId | Response `POST /staff/tips/confirm-receipt` |
|---|---|---|
| `Initiated` | `7d1f3714-b4de-4cbd-803e-eac5c88b90ce` | HTTP **200** `{confirmedCount:0, failedIds:["7d1f3714…"]}` |
| `Confirmed` | `5b098b86-5732-4cb1-bcc0-900c8ba10c2f` | HTTP **200** `{confirmedCount:0, failedIds:["5b098b86…"]}` |

→ **Không có trạng thái client nào confirm thành công.** Request **đúng & đã auth** — BE trả HTTP 200 và **echo lại đúng `tipId` trong `failedIds`** ⇒ đã nhận, parse, tra cứu được tip rồi mới TỪ CHỐI (không phải 401/400). **⇒ Lỗi business-logic Backend. FE KHÔNG sửa được.**

**BE cần làm (gấp):**
1. Kiểm tra handler `Staff_ConfirmTipReceipt` — vì sao MỌI tip rơi vào `failedIds`? (precondition sai? `staffId` không khớp? chưa implement đầy đủ / stub?)
2. Tạm thời trả **lý do từng `failedId`** (`failed: [{ id, reason }]`) để FE/QA debug.
3. Test với 2 tipId ở trên (staff `david.le918747`, business Bitcoin Nail Bar).

---

## 3. Fix phía FE (trong branch này)

| File | Thay đổi |
|------|----------|
| `src/components/staff-dashboard/hooks/useStaffHomeData.ts` | Đổi filter `Status=Initiated` → **`Status=Confirmed`** cho danh sách Pending Confirmations |
| `src/data/hooks/useStaffSelf.ts` | Defense-in-depth: khi `confirmedCount === 0` mà có `failedIds` (fail toàn bộ) → toast **error** thay vì cảnh báo "partial" mềm gây hiểu nhầm |

---

## 4. Cần Backend xác nhận (1 câu — để chốt fix)

> **Q:** `POST /api/v1/staff/tips/confirm-receipt` chấp nhận tip ở **đúng status `Confirmed`** (khách đã trả) phải không? Có còn điều kiện nào khác (vd `staffId` phải khớp, hoặc đã `merchantConfirmedAt`)?

**Cách verify nhanh (authenticated Swagger session của staff):**
1. `GET /api/v1/staff/tips?Status=Confirmed` → lấy 1 `tipId`.
2. `POST /api/v1/staff/tips/confirm-receipt` body `{ "tipIds": ["<tipId>"] }`.
3. **Kỳ vọng:** `{ "confirmedCount": 1, "failedIds": [] }` và `staffConfirmedAt` được set.

Nếu bước 3 đúng → bug đóng hoàn toàn bằng fix FE §3. Nếu vẫn fail → còn điều kiện BE khác, BE cần làm rõ.

---

## 4b. Bug liên quan — Multi-staff tip hiển thị TỔNG thay vì PHẦN của staff (FE-only)

**Hiện tượng:** Tip multi-staff $40 (chia cho nhiều người) hiển thị **$40 cho mỗi staff** thay vì phần họ thực nhận.

**Mô hình dữ liệu (Swagger):**
- Tạo (khách): `POST /api/v1/tips/multi-staff` body `tipItems: [{ staffProfileId, amount }]` — FE gửi **đúng** phần từng người (`useCustomerFlow.handlePay`).
- Đọc (staff): `StaffTipDto { amount, totalAmount, isMultiStaff }` — `amount` = **phần của staff đang đăng nhập**, `totalAmount` = **tổng cả nhóm**.

**Root cause (FE):** hai helper hiển thị ưu tiên `totalAmount`:
- `useStaffHomeData.ts` → `totalAmount > 0 ? totalAmount : amount`
- `StaffTips.tsx` → `tip.totalAmount > 0 ? tip.totalAmount : tip.amount`

→ Với tip multi-staff, mỗi người thấy **tổng nhóm** → khai khống thu nhập của từng staff.

**Fix (branch này):** đảo lại — luôn ưu tiên `amount` (phần của staff): `amount > 0 ? amount : totalAmount`. Sửa ở cả `useStaffHomeData.ts` và `StaffTips.tsx`.

**Cần BE xác nhận (qua authenticated Swagger `GET /api/v1/staff/tips`):** với 1 tip `isMultiStaff: true`, `amount` < `totalAmount` (amount = phần của staff đó, totalAmount = tổng nhóm) — đúng giả định không?

---

## 5. Đề xuất phụ (không bắt buộc)

- BE có thể trả kèm lý do từng `failedId` (`failed: [{ id, reason }]`) để FE hiển thị thông báo cụ thể.
- Làm rõ định nghĩa `dashboard/summary.pendingTips`: đếm theo `Status=Confirmed & staffConfirmedAt == null`? (để KPI khớp với list).

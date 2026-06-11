# NEXORA TOUCH by VLINKPAY — MVP Test Cases theo Vai Trò

> **Mục tiêu:** Đảm bảo MVP hoạt động end-to-end cho 3 vai trò cốt lõi: **Business (Merchant Owner) → Staff → Customer**.
> **Nguồn:** Tổng hợp từ `NEXORA_TOUCH_PRD_User_Stories_BA_Spec.md`, `NEXORA_TOUCH_Implementation_Spec.md`, `NEXORA_TOUCH_Merchant_Onboarding_QR_NFC_Spec.md`, `NEXORA_TOUCH_QC_Test_Cases.md` và đối chiếu code thực tế (`App.jsx`, `SetupWizard.jsx`, `StaffRegistrationWizard.jsx`, `Dashboard.jsx`, `CustomerFlow.jsx`).
> **Ngày tạo:** 2026-06-01
> **Cập nhật so với QC cũ:** Bổ sung mapping với code đã build, đánh dấu phần **simulate/stub**, gom theo đúng 3 vai trò MVP.

---

## 0. Tổng quan dự án (Project Overview)

NEXORA TOUCH là nền tảng **Smart Tip & Review** ưu tiên QR (NFC là add-on premium). Khách quét QR/chạm NFC → chọn nhân viên → tip → chọn phương thức thanh toán (redirect) → đánh giá. Review 4–5 sao đẩy ra Google/Yelp, 1–3 sao vào private feedback cho chủ tiệm.

### Luồng MVP theo 3 vai trò

```
BUSINESS (Owner)                 STAFF                        CUSTOMER
─────────────────                ─────                        ────────
Đăng ký / SSO login              Nhận lời mời (invite link)   Quét QR / tap NFC
Setup Wizard (Business info)     Xác thực OTP/email           Mở Touch Page
 → Review links                  Tạo profile (ảnh, vị trí)    Chọn staff
 → Add Staff                     Kết nối payment (6 ví)       Chọn tip amount
 → Touch Points (QR/NFC)         Personal QR                  Chọn payment method
 → Plan / Download QR            Xem tip history / review     Redirect thanh toán
Dashboard (tips/reviews/analytics)                            Confirmation
                                                              Đánh giá sao + comment
                                                              Routing: 4–5★ Google/Yelp
                                                                       1–3★ private feedback
```

### Tình trạng implement (đối chiếu code)

| Khối tính năng | Business | Staff | Customer | Trạng thái |
|---|---|---|---|---|
| Tạo tài khoản / onboarding | ✅ Wizard | ✅ Wizard 6 bước | ❌ Không cần login | Implemented |
| Quản lý profile | ✅ | ✅ | — | Implemented |
| Setup payment (6 ví) | ✅ | ✅ | — | Implemented |
| Staff CRUD | ✅ | — | — | Implemented |
| QR/NFC Touch Points | ✅ | ✅ personal QR | ✅ scan | Implemented |
| Tip flow | view | view | ✅ flow đầy đủ | Implemented |
| Review routing 4–5 / 1–3 | config | nhận | ✅ | Implemented |
| Dashboard / Analytics | ⚠️ một phần stub | ❌ | — | Partial |
| Thanh toán thật | ❌ simulate | ❌ simulate | ❌ simulate | **Simulated** |
| Subscription mgmt | ⚠️ view-only | — | — | Stub |

> ⚠️ **Lưu ý QC quan trọng:** Thanh toán hiện là **mô phỏng (redirect/simulate)**, không xử lý tiền thật. Test "payment success" = kiểm tra redirect đúng + tạo bản ghi tip intent, KHÔNG kiểm tra giao dịch tiền thật.

---

## 1. Quy ước test case

| Trường | Mô tả |
|---|---|
| **ID** | `NTX-<ROLE>-<số>` (BUS / STF / CUS / SEC = cross-role security) |
| **Priority** | P0 (Critical – chặn release) / P1 (High) / P2 (Medium) |
| **Type** | Happy / Edge / Error / Security / Responsive |
| **Status** | Not Started / Pass / Fail / Blocked |

**Test Data chuẩn (dùng xuyên suốt):**
- Business: `Bitcoin Nail Bar` / Nail Salon / slug `bitcoin-nail-bar`
- Staff 1: `Anna` – Nail Technician – CashApp `$annanails`, Venmo `@annanails`, Zelle `(714) 555-1234`
- Staff 2: `Lisa` – Nail Technician – CashApp `$lisanails`, Venmo `@lisanails`, Zelle `(714) 555-2345`
- Google Review URL: `https://example.com/google-review`
- Yelp Review URL: `https://example.com/yelp-review`
- Touch Point: `table-01` → `/touch/bitcoin-nail-bar/table-01`

---

## 2. BUSINESS — Merchant Owner

### Onboarding & Setup Wizard

#### NTX-BUS-001 — Đăng ký / login chủ tiệm (P0, Happy)
**Precondition:** Chưa có tài khoản.
**Steps:** Mở app → chọn Register/SSO → hoàn tất `RegisterWizard` (2 bước) → vào onboarding.
**Expected:** Tạo được tài khoản owner, chuyển vào Setup Wizard. Trạng thái verification = `basic`/`lite_pending`.

#### NTX-BUS-002 — Setup Wizard Step 1: Business Info (P0, Happy)
**Steps:** Nhập business name, industry, address, phone, website → upload logo → Save/Next.
**Expected:** Business profile tạo thành công; logo hiển thị; tiến tới Step 2. Logo xuất hiện trên Customer Touch Page sau này.

#### NTX-BUS-003 — Validate field bắt buộc Step 1 (P1, Error)
**Steps:** Bỏ trống business name → Next.
**Expected:** Chặn next, hiện lỗi rõ ràng; không tạo profile rỗng.

#### NTX-BUS-004 — Upload logo sai định dạng/kích thước (P1, Edge)
**Steps:** Upload file `.txt` hoặc ảnh >5MB.
**Expected:** Từ chối file không hợp lệ, thông báo lỗi; không crash.

#### NTX-BUS-005 — Setup Wizard Step 2: Review Links (P0, Happy)
**Steps:** Nhập Google review URL, Yelp URL, (Facebook optional), private feedback email → Save.
**Expected:** Lưu thành công; các URL này sẽ được dùng cho routing 4–5★ và email cho 1–3★.

#### NTX-BUS-006 — Review link không phải URL hợp lệ (P1, Error)
**Steps:** Nhập `javascript:alert(1)` hoặc chuỗi không phải http(s).
**Expected:** Chặn input, chỉ chấp nhận `http://`/`https://` (theo Security Rules dự án).

#### NTX-BUS-007 — Setup Wizard Step 3: Add Staff (P0, Happy)
**Steps:** Add Anna + Lisa → nhập tên, vị trí, ảnh, payment handles (CashApp/Venmo/Zelle) → set active.
**Expected:** 2 staff tạo thành công, trạng thái active, xuất hiện ở staff list và màn chọn staff của khách.

#### NTX-BUS-008 — Setup Wizard Step 4: Touch Points (P0, Happy)
**Steps:** Tạo Table QR (`table-01`), Front Desk QR, Receipt QR, Staff QR.
**Expected:** Mỗi touch point có `touch_point_id` + URL duy nhất + ảnh QR; được track tách biệt.

#### NTX-BUS-009 — Setup Wizard Step 5: Plan/Download (P1, Happy)
**Steps:** Chọn plan (Starter/Pro/Premium) → Download QR PNG/PDF.
**Expected:** Plan lưu đúng; PNG tải về quét được; PDF có logo + QR + hướng dẫn. Premium bật module NFC.

#### NTX-BUS-010 — Hoàn tất wizard không cần Dev support (P0, Acceptance)
**Steps:** Đi từ Step 1 → cuối không lỗi.
**Expected:** Merchant tự onboard hoàn chỉnh, vào được Dashboard.

### Staff Management (Dashboard)

#### NTX-BUS-011 — Thêm staff từ Dashboard (P0, Happy)
**Steps:** Dashboard → Staff → Add Staff → nhập thông tin + payment → Save.
**Expected:** Staff mới active, hiển thị trong list + màn chọn staff của khách.

#### NTX-BUS-012 — Sửa thông tin & payment của staff (P1, Happy)
**Steps:** Staff → chọn Anna → `StaffDetailView` → đổi vị trí + handle Venmo → Save.
**Expected:** Thay đổi lưu và phản ánh ở customer flow.

#### NTX-BUS-013 — Disable staff (P1, Happy)
**Steps:** Chọn staff → set inactive → Save.
**Expected:** Staff bị ẩn khỏi customer flow nhưng còn trong lịch sử dashboard.

#### NTX-BUS-014 — Gửi lời mời staff (invite) (P0, Happy)
**Steps:** Staff → Invite → tạo link `?flow=staff-invite&biz=Bitcoin Nail Bar`.
**Expected:** Sinh link mời hợp lệ, mở ra StaffRegistrationWizard cho staff.

#### NTX-BUS-015 — Xóa staff (P2, Edge)
**Steps:** Xóa staff đã có lịch sử tip.
**Expected:** Xác nhận trước khi xóa; lịch sử tip cũ không mất tính toàn vẹn (hiển thị "deleted staff").

### Touch Points / QR / NFC

#### NTX-BUS-016 — Tạo Table QR (P0, Critical)
**Steps:** Touchpoints → Stations → Add → Table QR `Table 01` → Generate.
**Expected:** QR + URL duy nhất có `touch_point_id`.

#### NTX-BUS-017 — Track tách biệt Table vs Front Desk QR (P1)
**Steps:** Tạo cả 2, scan mỗi loại.
**Expected:** Analytics ghi scan riêng theo từng touch_point_id.

#### NTX-BUS-018 — Gán NFC UID vào touch point (P2, Premium)
**Steps:** Devices → assign NFC UID vào `table-01`.
**Expected:** NFC UID map cùng URL với QR. (Premium plan only)

#### NTX-BUS-019 — Download QR PNG (P1)
**Steps:** Click Download PNG.
**Expected:** PNG tải về và quét ra đúng touch page.

#### NTX-BUS-020 — Download table stand PDF (P1)
**Steps:** Click Download PDF.
**Expected:** PDF có logo + QR + hướng dẫn, in được.

### Dashboard & Analytics

#### NTX-BUS-021 — Dashboard Overview load metrics (P1, Happy)
**Steps:** Mở Dashboard Overview sau khi có hoạt động.
**Expected:** Hiển thị total tips, transactions, average tip, total reviews, scan count.

#### NTX-BUS-022 — Filter dashboard theo date range (P1)
**Steps:** Chọn khoảng ngày.
**Expected:** Mọi metric refresh theo range. *(Nếu Analytics còn stub → mark Blocked + ghi chú "Coming Soon").*

#### NTX-BUS-023 — Top performing staff & touch point (P2)
**Expected:** Bảng xếp hạng staff theo tip/review và touch point theo scan.

#### NTX-BUS-024 — Xem reviews nhận được (P1)
**Steps:** Dashboard → Reviews → filter theo sao.
**Expected:** Hiển thị review công khai + private feedback tách biệt.

#### NTX-BUS-025 — Xem Tips / Transactions / Payouts (P1)
**Steps:** Tips view → 4 tab (Overview/Savings/Transactions/Payouts).
**Expected:** Số liệu tip hiển thị nhất quán với customer flow đã tạo.

### Settings & KYB

#### NTX-BUS-026 — Cập nhật business profile trong Settings (P1)
**Expected:** Lưu thay đổi name/industry/address/phone/website + payment accounts (toggle từng ví).

#### NTX-BUS-027 — Điền form KYB (P2)
**Steps:** Settings → KYB tab → legal name, tax ID, business type, bank details → Submit.
**Expected:** Trạng thái verification đổi `kyb_pending`; form validate field bắt buộc.

#### NTX-BUS-028 — Chọn plan Starter (QR only) (P2)
**Expected:** Plan lưu QR-only, không mở module NFC.

#### NTX-BUS-029 — Chọn plan Premium (NFC) (P2)
**Expected:** Bật module NFC order/assignment.

---

## 3. STAFF — Service Provider

#### NTX-STF-001 — Mở invite link (P0, Happy)
**Precondition:** Owner đã gửi invite (NTX-BUS-014).
**Steps:** Mở `?flow=staff-invite&biz=Bitcoin Nail Bar`.
**Expected:** Vào StaffRegistrationWizard, hiển thị tên business mời.

#### NTX-STF-002 — Xác thực email/OTP (P0, Happy)
**Steps:** Nhập email → nhận OTP → nhập OTP đúng.
**Expected:** Xác thực thành công, sang bước profile.

#### NTX-STF-003 — OTP sai/hết hạn (P1, Error)
**Steps:** Nhập OTP sai 3 lần / OTP cũ.
**Expected:** Báo lỗi rõ ràng, có resend; chặn brute-force.

#### NTX-STF-004 — Tạo profile staff (P0, Happy)
**Steps:** Nhập full name, nickname, position, upload avatar → Next.
**Expected:** Profile lưu đúng; avatar hiển thị.

#### NTX-STF-005 — Kết nối payment methods (P0, Happy)
**Steps:** Bật và nhập handle cho các ví: Zelle, Bank Wire, PayPal, Venmo, Cash App, Apple Cash.
**Expected:** Mỗi ví bật/tắt độc lập, lưu handle + sinh QR code ví. Chỉ ví đã bật mới hiện ở customer flow.

#### NTX-STF-006 — Thêm Cash App handle (P0)
**Expected:** CashApp xuất hiện trong payment options của khách khi chọn staff này. *(map NT-QC-006)*

#### NTX-STF-007 — Thêm Venmo handle (P0)
**Expected:** Venmo xuất hiện trong payment options. *(NT-QC-007)*

#### NTX-STF-008 — Thêm Zelle phone/email (P0)
**Expected:** Zelle hiện kèm nút copy / hướng dẫn (không có deep link chuẩn). *(NT-QC-008)*

#### NTX-STF-009 — Consent & activation (P1, Happy)
**Steps:** Đồng ý điều khoản → Activate.
**Expected:** Staff active, hiện màn Success; xuất hiện trong staff list của business.

#### NTX-STF-010 — Personal QR của staff (P1)
**Steps:** Lấy QR cá nhân của Anna → quét.
**Expected:** Mở Touch Page với Anna đã pre-select.

#### NTX-STF-011 — Self-serve search business (P2, Edge)
**Steps:** Vào wizard không qua invite → chọn "search business".
**Expected:** Tìm và yêu cầu join business; chờ owner duyệt.

#### NTX-STF-012 — Xem tip history / review nhận được (P1)
**Expected:** Staff thấy tip đã nhận và rating summary (nếu owner cho phép login). *(Nếu portal staff sau onboarding còn thiếu → mark Blocked, ghi chú gap.)*

---

## 4. CUSTOMER — Tip & Review Flow

#### NTX-CUS-001 — Quét QR mở đúng Touch Page (P0, Critical)
**Steps:** Quét Table QR `bitcoin-nail-bar/table-01` bằng camera điện thoại.
**Expected:** Mở đúng business + touch point, hiển thị logo + staff list. *(NT-QC-010)*

#### NTX-CUS-002 — Tap NFC mở cùng Touch Page (P2, Premium)
**Steps:** Tap NFC tag đã gán.
**Expected:** Mở cùng URL; event source ghi `nfc_tap`.

#### NTX-CUS-003 — Chọn staff (P0, Critical)
**Steps:** Touch Page → search/chọn Anna (và/hoặc Lisa).
**Expected:** Staff được chọn, persist sang bước tip. Hỗ trợ chọn nhiều staff. *(NT-QC-015)*

#### NTX-CUS-004 — Staff QR pre-select (P1)
**Steps:** Quét staff QR của Anna.
**Expected:** Anna được chọn sẵn, bỏ qua bước chọn staff.

#### NTX-CUS-005 — Chọn tip amount preset (P0, Critical)
**Steps:** Chọn $5/$10/$15/$20.
**Expected:** Số tip highlight và lưu vào session (theo từng staff). *(NT-QC-016)*

#### NTX-CUS-006 — Nhập custom tip (P1)
**Steps:** Nhập số tùy chỉnh → Continue.
**Expected:** Validate và lưu đúng. *(NT-QC-017)*

#### NTX-CUS-007 — Reject tip không hợp lệ (P1, Error)
**Steps:** Nhập số âm / 0 / ký tự chữ.
**Expected:** Chặn input, hiện lỗi rõ ràng. *(NT-QC-018)*

#### NTX-CUS-008 — Chọn payment Cash App (P0, Critical)
**Precondition:** Staff có Cash App.
**Steps:** Chọn Cash App → Continue.
**Expected:** Redirect/hướng dẫn Cash App đúng handle staff. *(NT-QC-019 — lưu ý: simulate)*

#### NTX-CUS-009 — Chọn payment Venmo (P0, Critical)
**Expected:** Redirect/hướng dẫn Venmo đúng. *(NT-QC-020)*

#### NTX-CUS-010 — Chọn payment Zelle (P0, Critical)
**Expected:** Hiện phone/email Zelle + nút copy / hướng dẫn. *(NT-QC-021)*

#### NTX-CUS-011 — Chỉ hiện payment method đã bật (P1, Edge)
**Steps:** Staff chỉ bật Venmo.
**Expected:** Khách chỉ thấy Venmo, không thấy ví chưa cấu hình.

#### NTX-CUS-012 — Tạo tip session record (P1)
**Steps:** Tiến tới chọn payment.
**Expected:** Tạo record với `business_id`, `staff_id`, `touch_point_id`, `amount`. *(NT-QC-022)*

#### NTX-CUS-013 — Màn confirmation thanh toán (P0)
**Steps:** Hoàn tất/confirm payment (simulate).
**Expected:** Thank You screen hiển thị đúng staff + amount; có nút để lại review. *(NT-QC-023)*

#### NTX-CUS-014 — Submit review 5 sao → routing public (P0, Critical)
**Steps:** Chọn 5★ → chọn tag tích cực (friendly/professional…) → comment → Submit.
**Expected:** Hiện nút Google/Yelp. *(NT-QC-024)*

#### NTX-CUS-015 — Submit review 1 sao → private feedback (P0, Critical)
**Steps:** Chọn 1★ → chọn tag tiêu cực → submit feedback.
**Expected:** Lưu private feedback, **KHÔNG** hiện redirect public; notify owner qua email. *(NT-QC-025)*

#### NTX-CUS-016 — Boundary 3★ vs 4★ routing (P0, Edge)
**Steps:** Test lần lượt 3★ rồi 4★.
**Expected:** 3★ → private feedback; 4★ → public review. Ranh giới đúng spec (≥4 = public).

#### NTX-CUS-017 — Google review redirect (P1)
**Steps:** 5★ → click Google.
**Expected:** Mở Google review URL của business ở tab mới. *(NT-QC-026)*

#### NTX-CUS-018 — Yelp review redirect (P1)
**Steps:** 5★ → click Yelp.
**Expected:** Mở Yelp review URL ở tab mới. *(NT-QC-027)*

#### NTX-CUS-019 — Track QR scan event (P1, System)
**Expected:** Tạo `analytics_events` với `event_type='qr_scan'`. *(NT-QC-030)*

#### NTX-CUS-020 — Customer flow trên iPhone (P1, Responsive)
**Steps:** Chạy full flow trên Safari iOS.
**Expected:** Không scroll ngang, mọi màn dùng được. *(NT-QC-039)*

#### NTX-CUS-021 — Customer flow trên Android (P1, Responsive)
**Expected:** Hoạt động trên Chrome Android, QR/NFC link mở đúng. *(NT-QC-040)*

#### NTX-CUS-022 — Đa ngôn ngữ EN/VI (P2)
**Steps:** Đổi ngôn ngữ giữa flow.
**Expected:** Mọi text dịch đúng (LanguageContext), không hardcode.

---

## 5. CROSS-ROLE — Security, Error & Edge

#### NTX-SEC-001 — Merchant A không truy cập dashboard Merchant B (P0, Critical)
**Steps:** Login Merchant A → mở URL dashboard Merchant B.
**Expected:** Bị từ chối. *(NT-QC-032)*

#### NTX-SEC-002 — Staff A không sửa payment Staff B (P0, Critical)
**Steps:** Login Staff A → mở URL edit Staff B.
**Expected:** Bị từ chối. *(NT-QC-033)*

#### NTX-SEC-003 — Rate limit submit review lặp lại (P0)
**Steps:** Cùng thiết bị submit review nhiều lần liên tục.
**Expected:** Giới hạn abuse, log hoạt động đáng ngờ. *(NT-QC-043)*

#### NTX-SEC-004 — XSS qua comment review (P0, Security)
**Steps:** Nhập `<script>alert(1)</script>` vào comment.
**Expected:** Sanitize (DOMPurify), không thực thi script.

#### NTX-ERR-001 — Touch point URL không hợp lệ/hết hạn (P1)
**Steps:** Mở URL random/expired.
**Expected:** Hiện thông báo lỗi thân thiện / touch point inactive. *(NT-QC-041)*

#### NTX-ERR-002 — Business không có staff active (P1)
**Steps:** Mở Touch Page khi không có staff active.
**Expected:** Hiện thông báo thân thiện + option liên hệ merchant. *(NT-QC-042)*

#### NTX-PERF-001 — Touch Page load nhanh trên mạng mobile (P1)
**Expected:** Page load trong ngưỡng chấp nhận, UI chính hiện nhanh. *(NT-QC-044)*

---

## 6. Định nghĩa Hoàn thành MVP (Definition of Done)

MVP được coi là PASS khi **tất cả P0 PASS** và **≥90% P1 PASS**:

- [ ] **Business:** hoàn tất Setup Wizard không cần Dev (BUS-001→010)
- [ ] **Business:** tạo ≥1 staff + ≥1 touch point QR hoạt động (BUS-007, 008, 016)
- [ ] **Staff:** onboard qua invite, kết nối ≥1 payment, personal QR mở đúng (STF-001→010)
- [ ] **Customer:** quét QR → chọn staff → tip → payment redirect → confirmation (CUS-001→013)
- [ ] **Customer:** review 4–5★ → Google/Yelp; 1–3★ → private feedback (CUS-014→016)
- [ ] **System:** ghi nhận `touch_point_id` cho mọi scan/tip/review (CUS-019)
- [ ] **Security:** cô lập dữ liệu giữa merchant/staff (SEC-001, 002)
- [ ] **Responsive:** chạy được iPhone + Android (CUS-020, 021)
- [ ] **Dashboard:** hiển thị tips/scans/reviews cơ bản (BUS-021)

### Ưu tiên chu kỳ QA đầu tiên
`NTX-BUS-001→010` → `NTX-STF-001→010` → `NTX-CUS-001→019` → `NTX-SEC-001→004`

### Gap đã biết (theo dõi, không chặn nếu là Phase 2+)
- Thanh toán thật: hiện **simulate** → mọi case payment chỉ verify redirect + tip intent.
- Analytics nâng cao / Subscription mgmt: **stub** → BUS-022/023 có thể Blocked, ghi chú "Coming Soon".
- Staff portal sau onboarding: kiểm tra mức độ đầy đủ của STF-012.

---

## 7. Tổng hợp số lượng

| Vai trò | Số test case | P0 | P1 | P2 |
|---|---|---|---|---|
| Business | 29 | 8 | 12 | 9 |
| Staff | 12 | 6 | 4 | 2 |
| Customer | 22 | 9 | 9 | 4 |
| Cross-role (Security/Error/Perf) | 7 | 4 | 3 | 0 |
| **Tổng** | **70** | **27** | **28** | **15** |
</content>
</invoke>

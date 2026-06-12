# User Stories — Happy Case: Invite Staff → Join → Tip → Review → Notification

> Mẫu user story cho flow đã QA ngày 2026-06-10. Format: Story + Acceptance Criteria (Given/When/Then) + API liên quan + Test case tham chiếu (test_plan.md / walkthrough.md).

---

## Epic 1 — Business mời và duyệt thợ

### US-01 · Business gửi lời mời thợ qua email

**Là** chủ tiệm (Business Owner), **tôi muốn** gửi lời mời gia nhập tiệm tới thợ qua email, **để** thợ có thể tự đăng ký và liên kết với tiệm mà tôi không phải nhập hộ thông tin.

**Acceptance Criteria**
- **Given** tôi đã đăng nhập với vai trò owner và đang ở Staff → Add New Staff Member → Invite
- **When** tôi nhập tên thợ + email và bấm "Send Invite Link"
- **Then** hệ thống gọi `POST /api/v1/merchant/staff/invite` trả 201, hiện toast thành công, thợ xuất hiện trong "Pending Join Requests", và email chứa link `/invite/{token}` được gửi tới thợ
- Kênh SMS hiển thị "Coming soon" và không chọn được

**API**: `POST /merchant/staff/invite` (Bearer) · **Test**: TC-02, TC-03

---

### US-02 · Business duyệt yêu cầu gia nhập

**Là** chủ tiệm, **tôi muốn** xem và duyệt yêu cầu gia nhập của thợ, **để** kiểm soát ai được nhận tip dưới danh nghĩa tiệm.

**Acceptance Criteria**
- **Given** thợ đã hoàn tất đăng ký qua link mời và đang ở trạng thái Pending
- **When** tôi bấm "Review & Approve" → bật "Show in Tips Flow" → "Approve / Accept"
- **Then** hệ thống gọi `PUT /api/v1/merchant/staff/{linkId}/status` (body `status: "Active"`) trả 204, toast xác nhận, thợ chuyển sang danh sách "Staff Invite & Link Status" với Status = Active
- Nếu request lỗi, hiển thị toast lỗi kèm errorCode (không silent fail)

**API**: `PUT /merchant/staff/{linkId}/status` (Bearer) · **Test**: TC-06 · **Bug liên quan**: BUG-04

---

## Epic 2 — Thợ đăng ký và onboarding qua link mời

### US-03 · Thợ mở link mời và xem thông tin tiệm

**Là** thợ được mời (Invitee), **tôi muốn** mở link trong email và thấy tên tiệm + vai trò được mời, **để** xác nhận đúng lời mời trước khi đăng ký.

**Acceptance Criteria**
- **Given** tôi nhận được email chứa link `/invite/{token}`
- **When** tôi mở link
- **Then** hệ thống gọi `GET /api/v1/staff/invite/{token}` (anonymous) trả 200 và màn Welcome hiển thị đúng tên tiệm, với 2 lựa chọn: "I already have an Account" / "Register Account"

**API**: `GET /staff/invite/{token}` (anonymous) · **Test**: TC-04

---

### US-04 · Thợ đăng ký tài khoản mới + xác thực OTP

**Là** thợ chưa có tài khoản, **tôi muốn** đăng ký bằng email/password và xác thực OTP, **để** kích hoạt tài khoản cá nhân.

**Acceptance Criteria**
- **Given** tôi chọn "Register Account" trên màn Welcome
- **When** tôi nhập email + confirm email + password và bấm Next, rồi nhập OTP nhận qua email
- **Then** `POST /authentication/signup` trả 201; OTP đúng → `POST /authentication/verify-email` 2xx và chuyển bước Profile; OTP sai → 400 hiển thị "Invalid verification code" + cho phép Resend

**API**: `POST /authentication/signup`, `POST /authentication/verify-email` (anonymous) · **Test**: TC-05

---

### US-05 · Thợ hoàn tất hồ sơ cá nhân (persist BE)

**Là** thợ, **tôi muốn** nhập họ tên / nickname / số điện thoại một lần trong wizard, **để** hồ sơ của tôi được lưu vĩnh viễn và dùng cho mọi tiệm tôi liên kết.

**Acceptance Criteria**
- **Given** tôi đã qua bước OTP, form Profile prefill tên từ lời mời
- **When** tôi điền phone (validate 10 số) và bấm Next
- **Then** hệ thống thực hiện đúng chuỗi: `signin` → `POST /staff/invite/{token}/accept` (204) → re-signin (JWT có staff claims) → **`PUT /userprofile/update` (200)** lưu firstName/lastName/phoneNumber
- **And** sau này `GET /userprofile/me` phải trả về đúng dữ liệu đã nhập (không rỗng)

**API**: accept + `PUT /userprofile/update` · **Test**: TC-05 · **Bug liên quan**: BUG-05 (fix đã verify vòng 2)

---

### US-06 · Thợ cấu hình ví nhận tip trong wizard

**Là** thợ, **tôi muốn** bật ít nhất một phương thức nhận tiền (Venmo/Zelle/...) ngay trong bước Wallet, **để** tôi đủ điều kiện hiển thị trên trang tip của khách.

**Acceptance Criteria**
- **Given** tôi đang ở bước 3 (Payout Configurations)
- **When** tôi cấu hình Venmo handle và bật toggle, bấm "Save & Activate"
- **Then** `PUT /staff/payment-methods/{id}` (200) + `PATCH /staff/payment-methods/{id}/toggle` (200); màn Success hiển thị trạng thái Pending Approval chờ tiệm duyệt
- **And** thợ chưa cấu hình ví thì `isProfileComplete = false` và KHÔNG xuất hiện trên touch page (đúng nghiệp vụ)

**API**: `GET/PUT/PATCH /staff/payment-methods` (Bearer) · **Test**: TC-05, TC-07

---

### US-07 · Thợ đăng nhập vào staff dashboard

**Là** thợ đã hoàn tất onboarding và được duyệt, **tôi muốn** đăng nhập và vào thẳng staff dashboard, **để** xem Staff ID, tiệm đã liên kết, tip và review của mình.

**Acceptance Criteria**
- **Given** tài khoản của tôi có StaffProfile (đã accept invite) VÀ hồ sơ đã persist trên BE
- **When** tôi đăng nhập
- **Then** session xác định staff qua `GET /staff/profile` (200, có staffCode) và route vào `/staff`; sidebar hiển thị "Staff ID: {staffCode}"; "Linked Businesses" hiển thị tiệm từ `GET /staff/businesses`
- **And** tài khoản CHƯA hoàn tất onboarding (hồ sơ rỗng trên BE) bị chặn, đưa về `/register` — không được vào staff dashboard (business rule)

**API**: `GET /staff/profile`, `GET /staff/businesses` (Bearer) · **Test**: BUG-10/BUG-11 verify · **Bug liên quan**: BUG-10, BUG-11

---

## Epic 3 — Khách tip và đánh giá

### US-08 · Khách chọn thợ trên trang touch

**Là** khách (anonymous), **tôi muốn** quét QR của tiệm và chọn thợ vừa phục vụ mình, **để** gửi tip đúng người.

**Acceptance Criteria**
- **Given** tôi mở `/touch/{businessSlug}/{touchPointSlug}` (không cần đăng nhập)
- **When** trang load
- **Then** `GET /touch/{businessSlug}/{touchPointSlug}?sessionId={uuid}` trả 200; chỉ các thợ Active + đã cấu hình ví (`isProfileComplete = true`) hiển thị trong danh sách chọn

**API**: `GET /touch/...` (anonymous) · **Test**: TC-07

---

### US-09 · Khách gửi tip qua ví của thợ

**Là** khách, **tôi muốn** chọn số tiền và phương thức (theo ví thợ đã bật), thấy đúng handle ví + mã tham chiếu, **để** chuyển tiền và xác nhận đã gửi.

**Acceptance Criteria**
- **Given** tôi đã chọn thợ và số tiền ($5/$10/$15/$20/$30/Other)
- **When** tôi chọn phương thức (chỉ hiện ví thợ đã bật, vd Venmo)
- **Then** `POST /touch/tip` trả 201 (có tipId) và `GET /touch/payment-link` trả 200; màn Wallet hiển thị đúng amount, tên thợ, **handle ví thật** (vd `@sota-test`) và note tham chiếu
- **When** tôi bấm "Yes, I sent the tip"
- **Then** `POST /touch/tip/{tipId}/confirm` trả 200, hiện màn cảm ơn, cache touch page được refetch

**API**: `POST /touch/tip`, `GET /touch/payment-link`, `POST /touch/tip/{tipId}/confirm` (anonymous) · **Test**: TC-08, TC-09 · **Bug liên quan**: BUG-07, BUG-08

---

### US-10 · Khách để lại đánh giá sau khi tip

**Là** khách, **tôi muốn** chấm sao + chọn lời khen + viết nhận xét sau khi tip, **để** phản hồi chất lượng dịch vụ cho tiệm và thợ.

**Acceptance Criteria**
- **Given** tôi vừa confirm tip xong, màn review hiện 5 sao mặc định
- **When** tôi chọn compliment tags, nhập comment và bấm "Submit Review"
- **Then** `POST /touch/review` trả 201 (có reviewId, gắn với tipId/staffProfileId); chuyển sang màn điều hướng Google/Yelp (nếu tiệm có link) rồi màn Done
- Bấm Skip ở bước review vẫn kết thúc flow hợp lệ

**API**: `POST /touch/review` (anonymous) · **Test**: TC-10, TC-16

---

## Epic 4 — Thông báo về tiệm

### US-11 · Business nhận thông báo sự kiện

**Là** chủ tiệm, **tôi muốn** thấy thông báo khi thợ accept lời mời / có tip mới / có review mới, **để** nắm hoạt động của tiệm theo thời gian thực.

**Acceptance Criteria**
- **Given** tôi đăng nhập merchant dashboard
- **When** có sự kiện mới (vd thợ accept invite)
- **Then** badge chuông hiển thị đúng `GET /notifications/unread-count`; dropdown liệt kê thông báo thật từ `GET /notifications` (title, body, thời gian) — không dùng dữ liệu mẫu
- **When** tôi bấm một thông báo hoặc "Mark all read"
- **Then** `PUT /notifications/{id}/read` / `PUT /notifications/read-all` trả 2xx, badge giảm tương ứng, cache invalidate
- ⚠️ Ghi chú hiện trạng: BE mới phát `StaffInviteAccepted`; cần BE bổ sung `TipReceived`, `ReviewSubmitted` để story này hoàn chỉnh

**API**: `GET /notifications`, `GET /notifications/unread-count`, `PUT /notifications/{id}/read`, `PUT /notifications/read-all` (Bearer) · **Test**: TC-11, TC-12 · **Bug liên quan**: BUG-09, BE-GAP

---

## Ma trận truy vết (Story ↔ Test ↔ Bug)

| Story | Test case | Bug đã phát hiện/fix |
|-------|-----------|----------------------|
| US-01 | TC-02, TC-03 | — |
| US-02 | TC-06 | BUG-04 ✅ |
| US-03 | TC-04 | — |
| US-04 | TC-05 | — |
| US-05 | TC-05 | BUG-05 ✅, BUG-01 |
| US-06 | TC-05, TC-07 | — |
| US-07 | (BUG verify) | BUG-10 ✅, BUG-11 ✅ |
| US-08 | TC-07 | — |
| US-09 | TC-08, TC-09 | BUG-07 ✅, BUG-08 ✅ |
| US-10 | TC-10, TC-16 | — |
| US-11 | TC-11, TC-12 | BUG-09 ✅, BE-GAP (tip/review notification) |

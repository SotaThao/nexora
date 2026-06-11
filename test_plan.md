# Test Plan — Full Flow Happy Case (Staff Invite → Join → Tip → Review → Notification)

Ngày: 2026-06-10 · FE: `http://localhost:3000` (pnpm dev) → API dev thật · Merchant: session Chrome đang login · Email invite: sotatruong@gmail.com (user cung cấp token) · Tip: confirm không thanh toán thật.

## Acceptance Criteria / Definition of Done

- [ ] Tất cả case **P0** pass (bắt buộc).
- [ ] Tất cả case **P1** pass (ngoại lệ phải ghi lý do).
- [ ] Không có console error trong L1 render và L3 flow.
- [ ] Mutation invalidate đúng query cache (`merchantStaff`, `customerTouch`, `notifications`).
- [ ] P2/P3 có thể dời sang ticket sau.

## Test Cases

| ID | Layer | P | Bước | Expected |
|----|-------|---|------|----------|
| TC-01 | L3 | P0 | Mở `/dashboard` với session merchant đang có | Dashboard render, không console error, `GET /userprofile/me` 200 |
| TC-02 | L3 | P0 | StaffView → InviteShareModal → nhập tên + email `sotatruong@gmail.com` → gửi | `POST /api/v1/merchant/staff/invite` 2xx; UI báo thành công; list staff hiện invite Pending (cache `merchantStaff` invalidated) |
| TC-03 | L2 | P0 | API invite: kiểm payload + response | Body `{ name, email, phone?, position? }`; Bearer auth; response có invite info |
| TC-04 | L3 | P0 | Nhận token từ email (user gửi) → mở `/invite/{token}` | `GET /api/v1/staff/invite/{token}` 200 (anonymous); StepWelcome hiện đúng tên tiệm + invite info |
| TC-05 | L3 | P0 | Staff đăng ký & accept (user tự nhập password/tạo account; tôi điều khiển bước còn lại): OTP → Profile → Payments → Accept | `POST /authentication/signup` 2xx, `POST /staff/invite/{token}/accept` 2xx, sau accept có `refresh-token`; StepSuccess hiển thị |
| TC-06 | L3 | P1 | Sau accept: merchant staff list | Staff mới Active/Joined trong `GET /api/v1/merchant/staff` |
| TC-07 | L3 | P0 | Customer mở `/touch/{businessSlug}/{touchPointSlug}` (tab ẩn danh) | `GET /api/v1/touch/...` 200, có `sessionId`; SelectStaff hiện staff vừa join |
| TC-08 | L3 | P0 | Chọn staff → số tiền → payment method → tạo tip → confirm (không thanh toán thật) | `POST /touch/tip` 2xx trả `tipId`; `POST /touch/tip/{tipId}/confirm` 2xx; SuccessPayment hiện reference |
| TC-09 | L2 | P0 | Confirm tip invalidate cache | Query `['customerTouch', ...]` refetch sau confirm |
| TC-10 | L3 | P0 | LeaveReview: 5 sao + comment → submit | `POST /api/v1/touch/review` 2xx trả `reviewId`; chuyển ReviewRouting → FinalDone |
| TC-11 | L3 | P0 | Merchant mở notifications | `GET /notifications` có tip_received + review_submitted (+ staff_accepted_invite); unread-count > 0 |
| TC-12 | L3 | P1 | Mark notification read | `PUT /notifications/{id}/read` 2xx; badge giảm; 2 cache invalidated |
| TC-13 | L1 | P1 | UI các màn chính desktop + mobile (~390px) | Layout không vỡ, không overflow |
| TC-14 | L1 | P1 | Console errors toàn flow | 0 error |
| TC-15 | L2 | P1 | Unit tests sẵn có: `staffInvites.test.js`, `merchantStaff.test.js`, `repositories.test.js` | Pass (targeted) |
| TC-16 | L3 | P2 | Track Google/Yelp sau review | 2xx nếu business có link |

## Phương pháp

- **API**: bắt network requests thật trong Chrome tại từng bước (endpoint, method, status, payload).
- **L2**: targeted vitest nếu sandbox chạy được; không thì ghi nhận chạy local.
- Password / tạo tài khoản / thanh toán: user tự thao tác (chính sách an toàn), tôi verify trước/sau.

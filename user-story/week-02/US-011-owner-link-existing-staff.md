# US-011 · Owner liên kết thợ đã có tài khoản vào tiệm (Luồng B)

| | |
|---|---|
| **Trạng thái** | Draft — chờ duyệt |
| **Ngày tạo** | 2026-06-11 |
| **Epic / Domain** | Staff Onboarding |
| **OpenSpec change** | đề xuất tạo nếu đụng ≥3 file (khả năng cao: modal + hook + repo + notification) |
| **Test plan** | (điền khi viết test) |

## Story

**Là** chủ tiệm (Owner),
**tôi muốn** tìm thợ đã có tài khoản Nexora (theo phone/email/staffCode) và gửi yêu cầu liên kết,
**để** thêm nhanh thợ đã làm ở tiệm khác hoặc đã tự đăng ký, không bắt họ đăng ký lại từ đầu.

## Acceptance Criteria

- **Given** tôi mở Staff → Add New Staff Member, nhập phone/email/mã thợ vào ô "NEXORA ID / VLINKPAY ID"
- **When** hệ thống tìm thấy thợ
- **Then** `GET /merchant/staff/search?q=` 200 trả profile rút gọn (displayName, position, photo), UI hiện kết quả để tôi xác nhận đúng người

- **Given** tôi xác nhận đúng thợ
- **When** tôi bấm gửi yêu cầu liên kết
- **Then** `POST /merchant/staff/link-request/{staffProfileId}` 204; thợ xuất hiện trong danh sách với trạng thái Pending; nếu đã liên kết rồi → hiện lỗi `STAFF_ALREADY_LINKED_TO_BUSINESS` thân thiện

- **Given** thợ nhận được yêu cầu (notification phía staff)
- **When** thợ chấp nhận
- **Then** link chuyển Active; thợ thấy tiệm trong `GET /staff/businesses`; owner thấy thợ Active trong `GET /merchant/staff`

- **Given** thợ tìm theo phone/email nhưng chưa tồn tại
- **Then** UI hiện "không tìm thấy" + gợi ý chuyển sang Luồng A (mời qua email)

## Trạng thái & nhánh ngoài happy case

Vòng đời link: `(không có) → Pending → Active | Rejected` · `Active → Pending Unlink → (xóa)`

| # | Tình huống | Hành vi mong đợi | API | Trạng thái verify |
|---|-----------|------------------|-----|-------------------|
| S1 | **Thợ từ chối** link request | Link chuyển Rejected; owner thấy trạng thái/biến mất khỏi Pending; thợ không thấy tiệm trong `GET /staff/businesses` (hoặc linkStatus=Rejected) | ❓ endpoint phía thợ — cần BE (câu hỏi #1) | Chặn bởi BE |
| S2 | **Tiệm hủy/từ chối** link đang Pending | Owner bấm Decline/Delete trên request → request biến mất 2 phía | `POST /merchant/staff/links/{linkId}/reject` (S) hoặc `DELETE /merchant/staff/{staffLinkId}` | Chưa test |
| S3 | **Link không thành công — đã liên kết rồi** | Toast lỗi thân thiện, không tạo request trùng | 400 `STAFF_ALREADY_LINKED_TO_BUSINESS` | Spec (S) |
| S4 | **Link không thành công — profile không tồn tại** (bị xóa giữa chừng) | Toast lỗi, gợi ý search lại | 404 `STAFF_PROFILE_NOT_FOUND` | Spec (S) |
| S5 | **Gửi trùng request** khi đang Pending | Lỗi 400 (ALREADY_LINKED hay code khác?) — UI disable nút khi đã Pending | ❓ cần BE xác nhận errorCode | Chưa verify |
| S6 | **Thợ unlink sau khi Active** (nghỉ việc) | Owner thấy "Pending Unlink" → chấp nhận → `DELETE /merchant/staff/{staffLinkId}` 204; không xóa profile/ví của thợ | UI owner đã có (Approve Unlink) | Chưa test |
| S7 | **Tiệm gỡ thợ Active** | Owner bấm xóa → DELETE 204; thợ mất tiệm khỏi linked businesses; KHÔNG còn hiện trên touch page | `DELETE /merchant/staff/{staffLinkId}` | Chưa test |
| S8 | **Search lỗi mạng / token hết hạn** | 401 → httpClient tự refresh; lỗi khác → empty state có thông báo, không crash | interceptor sẵn có | Đã có cơ chế |

> AC chi tiết cho S1–S2 sẽ bổ sung sau khi BE trả lời câu hỏi #1 (cơ chế accept/decline phía thợ). S6–S7 có thể tách thành story riêng nếu scope phình (US-012 · Unlink staff).

## API Mapping

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/merchant/staff/search?q=` | Bearer | q = phone/email | 200 `[{ staffProfileId, displayName, position, photoUrl }]` | (S)(v3) |
| POST | `/api/v1/merchant/staff/link-request/{staffProfileId}` | Bearer | — | 204; 400 `STAFF_ALREADY_LINKED_TO_BUSINESS`; 404 `STAFF_PROFILE_NOT_FOUND` | (S)(v3) |
| GET | `/api/v1/staff/businesses` | Bearer (staff) | — | 200 paged — linkStatus phản ánh Pending/Active | (S)(L) |

**Điểm chưa chắc chắn / cần hỏi BE (chặn implement):**
1. **Thợ chấp nhận link request bằng endpoint nào?** Spec không thấy `POST /staff/links/{id}/accept` phía staff. Hay link request tự Active không cần thợ duyệt? Cần BE xác nhận flow.
2. ~~Search hỗ trợ gì?~~ → **Đã verify live 2026-06-11**: hỗ trợ **email account + staffCode** (✅), KHÔNG hỗ trợ displayName; **thợ đã linked với tiệm hiện tại bị loại khỏi kết quả** (behavior hợp lý — giải thích vì sao phiên trước search không ra: 2 Sota đã linked). Phone chưa verify được (chưa có thợ unlinked có phone). UI nên ghi rõ placeholder "email hoặc mã thợ".
3. Thợ có nhận notification loại gì khi có link request? (BE hiện chỉ phát `StaffInviteAccepted`)

**Dữ liệu test sẵn có:** staff unlinked "Tran1" — staffCode `N4XVUQPBK`, staffProfileId `828e4cde-a0f6-4c55-8916-8fc959b251e9`, account email sotatruong@gmail.com (mailbox mình kiểm soát) — dùng làm target cho AC gửi link request.

## FE Surface (dự kiến)

| Layer | File | Thay đổi |
|---|---|---|
| Component | `dashboard/modals/StaffModal.jsx` | ô search NEXORA ID hiện readonly/chưa nối kết quả — wire search UI + kết quả + nút gửi link request |
| Data hook | `useMerchantStaff.js` — `useSearchMerchantStaff(q)`, `useSendStaffLinkRequest` | đã có sẵn, kiểm tra invalidation `qk.merchantStaff()` |
| Repository | `merchantStaff.js` — `search()`, `sendLinkRequest()` | đã có sẵn, verify shape với spec |
| Staff side | `StaffMyQR.jsx` / notifications | hiển thị + chấp nhận link request (PHỤ THUỘC câu hỏi BE #1) |

## Definition of Done

- [ ] 3 câu hỏi BE được trả lời, cập nhật API Mapping
- [ ] AC pass trên dev API (search ra đúng thợ stafftest2, gửi request 204, trạng thái Pending hiển thị 2 phía)
- [ ] Network trace đúng contract; error case ALREADY_LINKED hiển thị đúng
- [ ] Invalidate `merchantStaff` (+ `staffBusinesses` phía thợ) sau mutation
- [ ] Không console error
- [ ] 3-layer test + cập nhật TC links

## Ghi chú phiên thực thi

(trống — điền khi implement)

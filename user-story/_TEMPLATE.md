# US-XXX · <Tên story ngắn gọn>

> File: `US-XXX-<slug>.md` · 1 file = 1 story. ID tăng dần, duy nhất toàn repo.

| | |
|---|---|
| **Trạng thái** | Draft → Grilled → Approved → Integrated → Tested → Done |
| **Ngày tạo** | YYYY-MM-DD |
| **Epic / Domain** | (vd: Staff Onboarding, Customer Tips, Notifications) |
| **OpenSpec change** | `openspec/changes/<change-id>` hoặc `—` (fix nhỏ) |
| **Test plan** | TC-xx trong `test_plan.md` (điền khi viết test) |

## Story

**Là** <vai trò: Business Owner / Staff / Customer (anonymous)>,
**tôi muốn** <hành động/khả năng>,
**để** <giá trị nghiệp vụ>.

## Acceptance Criteria

- **Given** <bối cảnh/điều kiện đầu>
- **When** <hành động của user>
- **Then** <kết quả quan sát được: UI + API call + status code + side effect>
- (thêm cặp G/W/T cho từng nhánh trong scope; happy case bắt buộc, edge case nếu thuộc scope)

## API Mapping (bắt buộc trước khi integrate)

> Nguồn contract: Swagger live `https://test-api.nexoratouch.com/api/` — đối chiếu `API/update/<mới nhất>/api-integration-guide-v4.md`. Ghi tag nguồn: (S) spec / (L) đã verify live.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| | | | | | |

**Điểm chưa chắc chắn / cần hỏi BE:** (liệt kê field/behavior chưa rõ — PHẢI chốt trước khi code, không đoán)

## FE Surface (các layer sẽ đụng)

> Theo data boundary: components → data hooks → repositories → adapter.

| Layer | File | Thay đổi |
|---|---|---|
| Component | | |
| Data hook | | query key: `qk.<...>`, invalidation: |
| Repository | | normalize shape: |
| Khác (auth/route/context) | | |

## Grill Checklist (bắt buộc trước khi Approve — dùng skill `grill-me` nếu có, không thì tự trả lời)

- [ ] **AC mơ hồ?** Mỗi Then đều đo được (status code, UI state cụ thể) — không có "hoạt động đúng"
- [ ] **Đủ trạng thái?** Đã liệt kê: decline/reject từ CẢ HAI phía, fail (4xx từng mã), duplicate, expiry/timeout, unlink/rollback, empty state
- [ ] **Contract thật?** Mỗi endpoint đã đối chiếu Swagger live HOẶC probe request thật (không tin doc snapshot)
- [ ] **Side effects?** Mutation nào invalidate cache nào; ảnh hưởng phía bên kia (owner ↔ staff ↔ customer)
- [ ] **Cái gì chặn?** Câu hỏi BE chưa trả lời → story ở Draft, KHÔNG code phần bị chặn
- [ ] **Scope creep?** Nhánh nào nên tách story riêng

## Definition of Done

- [ ] AC pass trên môi trường dev (API thật)
- [ ] API call đúng contract đã map (method/status/payload — verify bằng network)
- [ ] Mutation invalidate đúng query cache
- [ ] Không console error
- [ ] Test theo 3 layer (skill feature-focused-tester): L1 UI / L2 data boundary / L3 flow
- [ ] Cập nhật trạng thái file này + link TC

## Ghi chú phiên thực thi

(Bug phát hiện, quyết định, deviation so với plan — điền trong khi integrate)

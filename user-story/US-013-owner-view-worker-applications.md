# US-013 · Chủ tiệm xem đơn ứng tuyển của thợ (Community Jobs, demo mock)

> File: `US-013-owner-view-worker-applications.md` · 1 file = 1 story.

| | |
|---|---|
| **Trạng thái** | Approved (hướng làm do Owner chốt trong chat 2026-10-14) |
| **Ngày tạo** | 2026-10-14 |
| **Epic / Domain** | Community Jobs |
| **OpenSpec change** | — (chỉ mock demo, 1 màn hình mới + 1 repository method) |
| **Test plan** | — |

## Story

**Là** Business Owner (Kayla, Bitcoin Nail Bar),
**tôi muốn** xem danh sách thợ đã ứng tuyển vào từng tin tuyển dụng của tiệm,
**để** biết ai quan tâm và nhắn tin với họ.

## Acceptance Criteria

- **Given** chủ tiệm ở Community → Jobs → "Tin của tôi" và có tin đã đăng
- **When** nhìn vào card tin (không phải Nháp)
- **Then** thấy nút "Ứng viên (n)"; n = số đơn đang có cho tin đó
- **When** bấm "Ứng viên (n)"
- **Then** mở modal liệt kê từng thợ: tên, ngày nộp, ghi chú; số điện thoại chỉ hiện nếu thợ chọn chia sẻ; có nút "Nhắn tin"
- **Given** thợ (Jessica) hủy ứng tuyển ở tab Applied
- **Then** đơn đó biến mất khỏi danh sách ứng viên của chủ tiệm (cùng store mock)
- **Given** tin chưa có đơn nào
- **Then** modal hiện trạng thái rỗng

## API Mapping

Mock-only (`COMMUNITY_JOBS_IS_SIMULATED`). Endpoint thật tham chiếu: `COMMUNITY_JOBS_PATHS.applications(postingId)` (`GET /api/v1/community/job-postings/{id}/applications`) — chưa verify trên Swagger live.

**Cần hỏi BE:** shape đơn phía chủ (tên/phone ứng viên có nằm trong response không), quyền xem phone khi `sharePhone=false`.

## FE Surface

| Layer | File | Thay đổi |
|---|---|---|
| Component | `JobPostingCard.tsx`, `RecruitmentListPanel.tsx`, `PostingApplicantsModal.tsx` (mới) | nút + modal |
| Data hook | `useOwnerPostingApplicants.ts` (mới) | key `qk.ownerPostingApplicants`; apply/cancel invalidate |
| Repository | `communityJobs.ts` / `communityJobsMockClient.ts` | `listPostingApplicants(postingIds)` |

## Definition of Done

- [ ] AC pass trên demo mock (Kayla ↔ Jessica)
- [ ] Không console error
- [ ] Typecheck sạch trên file đã đổi

## Ghi chú phiên thực thi

- Mock thêm 2 thợ giả (Minh Trần, Lan Phạm) ứng tuyển tin seed `mock-posting-001` để demo có > 1 ứng viên.

---
type: doc
title: "Community Jobs — Tổng hợp Spec: từ ý tưởng đến prototype (bàn giao cho dev)"
status: handoff
area: community
created: 2026-09-17
owner: dev@vlinkpay.com
---

# Community Jobs — Tổng hợp Spec: từ ý tưởng đến prototype

> Tài liệu này gộp toàn bộ hành trình của Community Jobs từ lúc lên kế hoạch đến khi có prototype chạy được, thành 1 bảng tra cứu duy nhất cho dev tiếp nhận việc. Đây là nội dung thay thế cho phạm vi cũ của issue [#1633](https://github.com/vlink-group/vlink-nexora/issues/1633) (trước đây là "Tạo OpenSpec change cho Community Jobs" — đã đổi thành tổng hợp tài liệu giai đoạn plan → prototype, theo quyết định 2026-09-17).

**Demo prototype (production hiện tại):** https://nexora-ten-lime.vercel.app — route `/community?tab=jobs`, đăng nhập bằng 1 trong 3 persona demo (Kayla · chủ salon, Jessica · thợ nail, Linh · khách).

**Repo code thật:** `SotaThao/nexora` (KHÔNG phải `vlink-nexora-fe`). **Repo tracking issue:** `vlink-group/vlink-nexora`.

## Bảng tổng hợp: ý tưởng → quyết định → triển khai prototype

| Giai đoạn | Nội dung / Quyết định | Triển khai trong prototype | Tài liệu / PR liên quan | Trạng thái |
|---|---|---|---|---|
| 1. Lên kế hoạch | US-113 + Master Doc phác thảo yêu cầu: đăng tin tuyển/tìm việc, xem chi tiết, nhắn tin với người đăng | — (giai đoạn tài liệu) | Master Doc `community-jobs-341_master_260915_v1.0.0.md`, US-113 (vault Obsidian), issue [#1624](https://github.com/vlink-group/vlink-nexora/issues/1624) | Draft, chưa approve chính thức |
| 2. Phản biện kiến trúc | Codex (đọc code thật) phát hiện điểm chặn: app có 2 hệ đăng nhập không liên quan nhau (REST/JWT thật vs Supabase Community riêng) → RLS thật cho job post chưa khả thi nếu chưa có cầu nối identity | Không code Phase 2 thật; quyết định 2026-09-17: lùi các việc kiến trúc/migration/repository thật ra khỏi phạm vi prototype | `docs/community-jobs-handoff_260915.md` (v1), `docs/community-jobs-handoff-v2_260915.md` (v2) | Đã chốt hoãn — issue [#1632](https://github.com/vlink-group/vlink-nexora/issues/1632), [#1634](https://github.com/vlink-group/vlink-nexora/issues/1634), [#1635](https://github.com/vlink-group/vlink-nexora/issues/1635) đã đóng, chuyển sang phạm vi "bản thật" (chưa lên lịch) |
| 3. Prototype v1 — Jobs board demo | List + filter (search / khu vực / loại tin), đăng tin 2 loại theo persona đang đăng nhập (cố định, không đổi được), xem chi tiết, "Bài của tôi" (sửa / xoá / đổi trạng thái open→filled→closed), chat giả (local state) | 100% local React state (`useState`), KHÔNG gọi API/Supabase | `src/components/community/CommunityJobDetail.tsx`, `communityDemoContent.ts` · [PR #40](https://github.com/SotaThao/nexora/pull/40) | Hoàn thành, merged 2026-09-16 |
| 4. Cải thiện form đăng tin — vòng 1 | Section hoá form theo nhóm, image picker 6 ảnh có sẵn, validation inline (border đỏ + message), character counter cho mô tả, preview trực tiếp trong modal | UI-only, vẫn local state | `PostJobModal` trong `CommunityJobDetail.tsx` | Hoàn thành 2026-09-16 |
| 5. Tích hợp AI viết mô tả | Thay mô tả mẫu tĩnh bằng gọi LLM thật (DeepSeek qua endpoint tương thích Anthropic), giữ API key phía server, xử lý đúng response dạng reasoning-model (block "thinking" đứng trước block "text"), tách góc nhìn viết theo `postKind` (chủ tiệm tuyển thợ vs người thợ tự giới thiệu) | Vercel serverless function `api/generate-job-description.ts` làm proxy; nút "✨ Viết bằng AI" trong form | [PR #41](https://github.com/SotaThao/nexora/pull/41), [#42](https://github.com/SotaThao/nexora/pull/42), [#43](https://github.com/SotaThao/nexora/pull/43) | Hoàn thành, merged 2026-09-17 |
| 6. Rút gọn form theo phản hồi cognitive-load | Auto-fill tên salon theo persona hiring, upload ảnh thật (local preview qua `URL.createObjectURL`), gộp field cùng hàng (Khu vực + Tên salon, Hình thức + Mức lương), bỏ hẳn các field gây rối (kỹ năng, kinh nghiệm tối thiểu, thời điểm cần thợ, cách trả lương), bỏ subtitle/title thừa | UI-only, vẫn local state; các field dữ liệu cũ (`skills`/`experience`/`availability`/`payModel`) vẫn giữ trong kiểu `DemoJob` để tương thích dữ liệu seed cũ — chỉ bỏ ô nhập trên form, không đổi schema | [PR #41](https://github.com/SotaThao/nexora/pull/41) | Hoàn thành 2026-09-17 |
| 7. Chuẩn hoá màu badge + hiển thị lương | "Cần gấp" → đỏ, "Tuyển thợ" → vàng, "Tìm việc" → xanh dương; badge lương chỉ hiện khi giá trị là lương theo tuần hoặc "Thương lượng" — các định dạng khác (giờ, ăn chia %) ẩn hẳn thay vì hiện sai ngữ cảnh | Helper `postKindBadgeClassName()` và `displayableSalary()` trong `CommunityJobDetail.tsx` | [PR #44](https://github.com/SotaThao/nexora/pull/44) | Hoàn thành, merged 2026-09-17 |
| 8. Quyết định phạm vi prototype | Chốt: issue [#1636](https://github.com/vlink-group/vlink-nexora/issues/1636)–[#1639](https://github.com/vlink-group/vlink-nexora/issues/1639) chỉ cần đạt mức prototype (không cần kiến trúc/dữ liệu thật) — prototype hiện tại đã đáp ứng đủ; [#1632](https://github.com/vlink-group/vlink-nexora/issues/1632)/[#1634](https://github.com/vlink-group/vlink-nexora/issues/1634)/[#1635](https://github.com/vlink-group/vlink-nexora/issues/1635) hoãn hẳn sang giai đoạn bản thật | — | Issue [#1679](https://github.com/vlink-group/vlink-nexora/issues/1679) (parent tracking) | Đã chốt 2026-09-17, các issue liên quan đã đóng kèm lý do |

## Việc còn lại khi bắt đầu làm bản thật (Phase 2, chưa lên lịch)

Các mục dưới đây đã bị hoãn khỏi phạm vi prototype (không phải đã xong) — cần làm lại từ đầu khi Phase 2 được lên lịch:

1. **Chốt kiến trúc identity bridge** (việc đầu tiên, không code gì trước khi có câu trả lời) — làm sao Supabase RLS biết user đã đăng nhập JWT thật là chủ tiệm hay thợ, thuộc business nào. Xem 2-3 phương án đã phác thảo ở `docs/community-jobs-handoff-v2_260915.md` §3.1.
2. Tạo OpenSpec change thật cho Community Jobs (`openspec/changes/community-jobs/`) trước khi code Phase 2, theo rule CLAUDE.md của repo (feature đụng ≥3 file + shared layer auth).
3. Migration Supabase (bảng job post + RLS) theo hướng identity bridge đã chọn.
4. Repository/hooks mới trong `src/data/repositories/community/` + `src/data/hooks/` — viết mới, KHÔNG tái dùng `communityDemoContent.ts`/`CommunityJobDetail.tsx` của prototype.
5. UI thật: màn đăng bài 2 loại, màn "Bài của tôi", wire nút "Nhắn tin" vào `findOrCreateChannel` thật (pattern đã có ở `CommunityChatMemberActionsSheet.tsx:77-81`) — KHÔNG mang pattern chat giả local-state của prototype vào bản thật.
6. QA 3 lớp cho bản thật + gỡ code demo cũ (`communityDemoContent.ts` phần jobs, và `CommunityJobDetail.tsx` nếu không còn cần giữ làm tài liệu tham khảo UX).
7. Xử lý lỗ hổng moderation đã phát hiện: bảng `report` hiện không nhận report cho Jobs (enum chỉ có `post`/`comment`/`member`, bắt buộc `community_id`).

## Ràng buộc cứng (giữ nguyên cho cả prototype lẫn bản thật)

- KHÔNG xây hệ chat mới ở bản thật — tái dùng nguyên `findOrCreateChannel`.
- KHÔNG làm AI-matching/ẩn danh (spec cũ đã bị PO bỏ, issue #1014/#589 không còn áp dụng).
- Jobs vẫn là 1 tab trong `CommunityHome` hiện có (`/community?tab=jobs`), không tách route riêng.
- API key của bên thứ 3 (DeepSeek) không bao giờ lộ ra frontend — luôn qua Vercel serverless function proxy như `api/generate-job-description.ts`.

## Liên quan
[[community-jobs-341_master_260915_v1.0.0]] (vault) · [[US-113-community-jobs-board]] (vault) · `docs/community-jobs-handoff_260915.md` (v1) · `docs/community-jobs-handoff-v2_260915.md` (v2) · issue [#1624](https://github.com/vlink-group/vlink-nexora/issues/1624) · [#1633](https://github.com/vlink-group/vlink-nexora/issues/1633) · [#1679](https://github.com/vlink-group/vlink-nexora/issues/1679)

---
type: doc
title: "Community Jobs — bàn giao v2 cho Codex (tiếp nối handoff v1)"
status: handoff
area: community
created: 2026-09-15
owner: dev@vlinkpay.com
---

# Community Jobs — bàn giao v2 cho Codex

> Claude (session này) lại hết quota giữa buổi. Đây là bàn giao tiếp nối `community-jobs-handoff_260915.md` (bàn giao v1, cùng ngày) — đọc CẢ HAI, v1 vẫn còn giá trị (bối cảnh PO, lý do bỏ spec AI-matching cũ, mapping code thật).

## 0. Đọc theo thứ tự này trước khi làm gì

1. `nexora/docs/community-jobs-handoff_260915.md` (bàn giao v1 — bối cảnh PO, §1-§6).
2. Master Doc: `C:\Shared\Obsidian\shancao\Nexora\docs\community-341\00-master\community-jobs-341_master_260915_v1.0.0.md` — status **Draft, chưa approve**.
3. User Story: `C:\Shared\Obsidian\shancao\Nexora\Sprints\Week-16\US-113-community-jobs-board\US-113-community-jobs-board.md` — AC, API Mapping, Grill Checklist, Tasks/TODOs.
4. GitHub issue: [vlink-group/vlink-nexora#1624](https://github.com/vlink-group/vlink-nexora/issues/1624) — sub-issue của epic [#341](https://github.com/vlink-group/vlink-nexora/issues/341) ("Community, Wallet - NEXORA TOUCH"). Board NEXORA Touch #51: Item Type Backlog, Status Define, Environment Production, Week 35, assignee `pthngoc`+`SotaThao`.

## 1. Việc đã xảy ra từ sau bàn giao v1 (tóm tắt, đừng làm lại)

- Đã viết Master Doc + US-113 theo đúng chỉ dẫn "bắt đầu bằng Master Doc" của v1.
- Đã tự phản biện Master Doc bằng Codex (`gpt-5.6-sol`/`high`, read-only) — **tìm ra điểm chặn THẬT khác với điều Master Doc ghi ban đầu**, xem §2 ngay dưới. Đây là phát hiện quan trọng nhất, đọc kỹ trước khi code bất cứ gì thuộc Phase 1/2.
- Đã dựng (và Codex sau đó verify+fix) một **bản DEMO đầy đủ tính năng, 100% local React state, KHÔNG gọi API/Supabase**: `src/components/community/CommunityJobDetail.tsx` + `src/components/community/communityDemoContent.ts` (worktree `stage-2-docked-desktop-chat-be3fab`, chưa merge vào `main`). Demo có: filter (search/khu vực/loại tin), đăng tin 2 loại (thợ đăng "tìm việc" / chủ đăng "tuyển thợ", cố định theo persona đang đăng nhập), xem chi tiết, chat giả (local state), và "Bài của tôi" (sửa/xoá/đổi trạng thái open→filled→closed).
  - **Bản demo này CHỈ để trình bày cho PO xem UX, KHÔNG PHẢI implementation của US-113.** Master Doc + US-113 đều ghi rõ: đừng kế thừa code demo này khi build Phase 2 thật. Lý do: nó không có `postKind`/`employmentType` map đúng schema DB thật, không dùng repository/hook pattern của app, không có RLS, và (quan trọng nhất) không hề chạm tới vấn đề identity ở §2 — vì nó không cần biết ai là ai, chỉ so sánh email persona demo trong React state.
  - Có thể giữ file demo này làm tài liệu tham khảo UX (layout drawer chi tiết + chat dock nổi không chồng nhau đã được duyệt Visual Gate ở `.codex/community-jobs-visual-gate/index.html`), nhưng code Phase 2 thật phải viết mới theo FE Surface trong US-113.

## 2. PHÁT HIỆN QUAN TRỌNG NHẤT — điểm chặn thật khác với Master Doc ban đầu ghi

Master Doc (bản đầu) ghi điểm chặn là "bảng Supabase cho job post chưa tồn tại". **Sai — hoặc đúng hơn, chưa đủ.** Codex (`gpt-5.6-sol`/`high`, đọc code thật) phản biện và tìm ra điểm chặn THẬT lớn hơn nhiều, trích nguyên văn phần quan trọng nhất:

> "Nexora's primary owner/staff identity comes from the REST/JWT auth provider (AuthProvider.tsx, apiAuthAdapter.ts). Community independently creates a Supabase session using three demo accounts or anonymous auth (CommunityAuth.tsx). The draft scopes no bridge between those identities."
>
> "The proposed RLS cannot currently prove 'staff' versus 'business owner.' Supabase `profiles` contains display fields only; Community roles are per-community membership roles, not Nexora account roles. No business table exists in migrations 0001–0011."
>
> "'Public' is unresolved. `/community` isn't protected by RequireAuth, but the checked-in local Supabase config disables anonymous sign-in."

Tóm lại bằng lời thường: **App Nexora có 2 hệ đăng nhập KHÔNG liên quan nhau** — (a) đăng nhập thật của chủ/thợ qua REST API + JWT (dùng cho dashboard, POS, v.v.), và (b) đăng nhập Supabase riêng của Community (hiện chỉ có 3 tài khoản demo cứng + tuỳ chọn anonymous). Muốn viết RLS đúng cho bảng job post ("chỉ chủ tiệm mới đăng được tuyển, chỉ người đăng mới sửa/xoá được bài của mình") thì Supabase phải BIẾT ai đang đăng nhập là chủ hay thợ **theo nghĩa thật của app**, không phải theo nghĩa "đây là 1 trong 3 tài khoản demo Community". Hiện tại **không có cầu nối nào giữa 2 hệ này** — đây là quyết định kiến trúc phải chốt TRƯỚC KHI viết bất kỳ migration/RLS nào cho job post, không phải sau.

Codex còn tìm thêm các vấn đề khác (đã note vào US-113 nhưng nhắc lại đây vì dễ bị bỏ sót khi code):
- KPI trong Master Doc ghi sai tên bảng thật (`direct_channels` không tồn tại; thật là `channels(kind='direct')` + `direct_channel_participants`).
- Hệ thống report/moderation hiện tại (bảng `report`) **không nhận được report cho Jobs** — enum chỉ có `post`/`comment`/`member`, bắt buộc có `community_id`. Nếu Jobs là board công khai có tên thật, đây là lỗ hổng moderation cần tính tới trước khi launch, không chỉ "out of scope cho vui".
- Field `type`/`employmentType` (Full-time/Part-time) và `postKind` (seeking/hiring) phải là 2 field riêng — bản demo v2 đã sửa đúng cách này rồi (`DemoJob.postKind` + `DemoJob.employmentType`), giữ nguyên convention này khi thiết kế schema thật.
- Theo CLAUDE.md của repo: feature này đụng ≥3 file + shared layer (auth) → **bắt buộc có OpenSpec change** (`openspec/changes/`) trước khi code Phase 2. Chưa có OpenSpec change nào cho Community Jobs — cần tạo trước khi bắt đầu.

## 3. Việc cần làm tiếp theo (theo thứ tự)

1. **Chốt quyết định kiến trúc identity bridge** (đây là việc đầu tiên, không code gì trước khi có câu trả lời):
   - Câu hỏi cụ thể: khi user đã đăng nhập thật (JWT) vào app và mở `/community`, làm sao Supabase RLS biết được user đó là chủ tiệm hay thợ, và biết business nào?
   - Các hướng khả dĩ (chưa hướng nào được duyệt, tự đánh giá hoặc hỏi user/PO):
     a. Đồng bộ 1 lần: khi JWT login thành công, gọi 1 Supabase RPC tạo/link 1 row `profiles` mang theo `role` + `business_id` lấy từ JWT claims, thay thế cơ chế 3-persona-demo hiện tại của `CommunityAuth.tsx`.
     b. Community tiếp tục dùng Supabase Auth riêng (giữ nguyên hiện trạng cho Feed/Groups) nhưng Jobs cụ thể validate quyền qua BE .NET (không qua Supabase RLS trực tiếp) — nghĩa là job post đi qua 1 BE endpoint mới, không giống pattern hiện tại của Community.
     b'. Đây có thể đổi luôn cả câu trả lời cho câu hỏi "Bảng mới nằm Supabase hay BE .NET" đang treo trong US-113 API Mapping.
   - Việc này lớn hơn 1 dev task — nên tự viết ra 2-3 phương án kèm trade-off rồi hỏi user/PO chọn, đừng tự chọn 1 mình rồi code luôn.
2. **Tạo OpenSpec change** cho Community Jobs (`openspec/changes/community-jobs/` hoặc tên tương tự) trước khi code, theo rule CLAUDE.md của repo.
3. Sau khi có quyết định #1: viết migration Supabase (bảng job post + RLS) theo đúng hướng đã chọn, theo pattern các migration `0001`-`0011` hiện có.
4. Repository/hooks mới trong `src/data/repositories/community/` + `src/data/hooks/` (KHÔNG tái dùng `communityDemoContent.ts`/`CommunityJobDetail.tsx` của bản demo — viết mới, xem FE Surface trong US-113).
5. UI thật: màn đăng bài 2 loại, màn "Bài của tôi", wire nút "Nhắn tin" vào `findOrCreateChannel` thật (pattern đã có ở `CommunityChatMemberActionsSheet.tsx:77-81`) — lưu ý bản demo dùng chat giả local-state, KHÔNG được mang pattern đó vào bản thật.
6. QA 3 lớp + gỡ demo cũ (`communityDemoContent.ts` phần jobs, và toàn bộ `CommunityJobDetail.tsx` nếu không còn cần làm tài liệu tham khảo UX).

## 4. Nhắc lại ràng buộc cứng (từ v1 + US-113, đừng phá)

- KHÔNG xây hệ chat mới — tái dùng nguyên `findOrCreateChannel`.
- KHÔNG làm AI-matching/ẩn danh (spec cũ đã bị PO bỏ, issue #1014/#589 không còn áp dụng).
- Repo code thật là `nexora`, KHÔNG phải `vlink-nexora-fe`.
- Giữ Jobs là 1 tab trong `CommunityHome` hiện có (`/community?tab=jobs`), không tách route riêng.
- Master Doc/US-113 chưa approve — xin sign-off (Tech Lead, QA Lead, PM đã có tên; Product Lead còn trống) trước khi coi đây là đã chốt, không chỉ tự code theo draft.

## 5. Việc cần Codex làm NGAY (user tự chọn model/effort, không cần hỏi lại) — cải thiện form đăng tin

User muốn form đăng tin trong bản DEMO (§1) được làm **hiện đại và tiện lợi hơn**, trước khi dùng bản demo này để trình bày cho PO. Đây là việc UI-only, vẫn nằm trong scope demo (local state, không backend) — KHÔNG phải một phần của Phase 2 thật ở §3.

**File**: `src/components/community/CommunityJobDetail.tsx`, component `PostJobModal` (form đăng/sửa tin) — worktree `C:\Users\AD\Documents\GitHub\nexora\.claude\worktrees\stage-2-docked-desktop-chat-be3fab`.

**Hiện trạng**: modal đơn giản, các field xếp chồng theo cột dọc (tên salon, tiêu đề, khu vực + hình thức cạnh nhau, lương + kinh nghiệm cạnh nhau, mô tả), input HTML thuần + label, không có validation inline (chỉ dùng `required`), không có cách chọn/đổi ảnh minh hoạ (bài mới luôn dùng `DEFAULT_JOB_IMAGE` cứng), không có character counter, không có preview.

**Hướng cải thiện (gợi ý, không bắt buộc theo đúng từng ý — Codex tự đánh giá UX phù hợp nhất)**:
- Phân nhóm field rõ ràng hơn theo section (VD: "Thông tin cơ bản" / "Chi tiết công việc" / "Mô tả") thay vì 1 khối dài.
- Cho phép chọn ảnh minh hoạ từ vài ảnh có sẵn trong `public/assets/images/marketing/nail/` (đã dùng: `nail_spa_treatment.jpg`, `nail_rose_quartz.jpg`, `nail_zen_minimalist.jpg`, `nail_art_luxury.jpg`, còn `nail_glam_french.jpg`, `nail_summer_pop.jpg` chưa dùng) — thumbnail picker đơn giản, không cần upload thật.
- Validation inline rõ ràng hơn (border đỏ + message dưới field khi thiếu, thay vì chỉ dựa `required` của HTML).
- Character counter cho mô tả (VD: giới hạn ~500 ký tự, hiện đếm còn lại).
- Cân nhắc preview trực tiếp (card sẽ trông thế nào) ngay trong modal trước khi submit — không bắt buộc nếu tốn quá nhiều effort.
- Giữ nguyên: field `postKind` vẫn cố định theo persona (không cho đổi), giữ đúng token màu/border/radius `nexora*` đã dùng trong toàn bộ file (không tự chế màu mới), giữ layout responsive (form đang full-screen bottom-sheet trên mobile, dialog giữa màn hình trên desktop — đừng phá).
- KHÔNG thêm gọi API/Supabase nào — vẫn là demo local state.

**Verify trước khi báo xong**: `npx tsc --noEmit` sạch cho file này, `pnpm build` pass, tự test luồng đăng tin/sửa tin trên dev server (`pnpm dev`, route `/community?tab=jobs`, cả 2 persona Kayla/Jessica) bằng browser tool thật nếu có quyền truy cập localhost — bản Codex trước đó (task-mu2i2ej6-lloiz6, xem log) bị từ chối quyền browser-connector khi thử, nếu vẫn vậy thì nêu rõ trong báo cáo thay vì bỏ qua bước test.

## Liên quan
[[community-jobs-341_master_260915_v1.0.0]] (vault) · [[US-113-community-jobs-board]] (vault) · `community-jobs-handoff_260915.md` (repo, v1)

## 6. Cập nhật 2026-09-16 — việc ở mục 5 đã xong

Phiên Claude khác ("connect" tới branch này) xác nhận `PostJobModal` trong `CommunityJobDetail.tsx` đã có đủ 5 cải thiện liệt kê ở mục 5 (section hoá form, image picker 6 ảnh, validation inline, character counter, preview trực tiếp) — không rõ do Codex hay phiên nào làm, task file `.agent-tasks/T-260915-improve-community-jobs-demo-post-form.md` không được cập nhật khi xong nên mục "Hiện trạng" ở trên đã LỖI THỜI (mô tả bản CŨ trước cải thiện). Đã verify lại: `tsc --noEmit` sạch cho các file community, `pnpm build`/`pnpm test` pass, và test tay qua browser (persona Kayla) cho đủ luồng đăng tin/xem chi tiết/nhắn tin — xem task file để có evidence đầy đủ. KHÔNG có gì cần code thêm cho mục 5. Việc kế tiếp vẫn là mục 3 (Phase 2 thật, chưa bắt đầu, cần chốt kiến trúc identity bridge trước).

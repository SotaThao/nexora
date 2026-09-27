# L1a — M01 Bảng tin, Nhóm & Chợ (notes)

## Data model (store/types/m01.ts)
- `posts` holds every post incl. market listings (`type: "market"` + `market: { category, price, area }`).
  `marketItems` stays `[]` only to keep the DemoState shape required by `store/seed/index.ts`.
- `Post.destinations` = group ids (max 3, `"feed"` = Bảng tin chung). One record per post, so a post shows once
  even when it is in several groups.
- Per-viewer state lives on the records: `likedBy`, `hiddenFor`, `Group.joinedBy` (key = `currentPersonId ?? "guest"`).
- `composerDraft?` (optional key) keeps the 3-step composer draft across routes and reloads; payment failure keeps it.
- OFFICIAL posts use `authorId: "nexora"` (`OFFICIAL_AUTHOR_ID`) and render as "NEXORA Community" — there is no admin
  person in `seed/m00.ts`. Every other author is a real m00 person id.
- `migrateM01()` (slice, run once on module import) resets M01 keys to seed when localStorage still has the
  earlier Codex draft shape.

## Behaviour decisions
- Feed order: the viewer's own post published < 10 min ago first (doc 01 · 3.2 "bài lên đầu"), then active
  Nổi bật, then newest. "Mới đăng" violet ring for posts < 10 min old.
- Business = role `owner`. `tech`, `client`, `admin` see Nổi bật locked. Admin posts publish as OFFICIAL.
- Guest who creates an account becomes role `client` (L0) and can post/like — client is not restricted to read-only.
- Right rail "Deal gần bạn" reads only `id, title, salonId, sponsored` (contract 2); links to `/community-v2/deals/:id`.
- "✉️ Nhắn người bán" → `/community-v2/messages/new?to=<personId>` (contract 3), no account needed to open.
- Copy not given verbatim by doc 01 (own wording): hide toast "🙈 Đã ẩn bài", delete toast "🗑 Đã xoá bài",
  group-name error "Tên nhóm cần ít nhất 3 ký tự", create toast "✓ Đã tạo nhóm {tên}", payment-failure message.
- S01-10 route renders step 3 with the payment sheet open; closing returns to step 3.

# L3a — M02 Việc làm (S02-01 … S02-12)

## Files
- `store/types/m02.ts` — types + ONE unified enum set (`JOB_SKILLS`, `JOB_EXPERIENCE`, `JOB_WORK_TYPES`,
  `JOB_PAY_TYPES`, `JOB_CITIES`, `JOB_LICENSES`, `JOB_LANGUAGES`, `JOB_DAYS`).
- `store/seed/m02.ts` — 6 hiring + 9 seeking posts (active / paused / expired / filled), 10 tech profiles
  (Jessica = 70%), 6 invites (pending / accepted / declined on both Jessica's and Kayla's side), 3 applications.
  Every id comes from `store/seed/m00.ts`.
- `store/slices/m02.ts` — all M02 writes via `storeActions.update` (profile, privacy, publish/edit seek post,
  pause/resume, renew +30, mark hired, delete, invite, respond, apply, create hiring post).
- `modules/m02-jobs/logic.ts` — pure rules: completion formula, license badge, 60/25/15 match score, public
  name, phone detect/strip. Imported by seed, slice and UI (no store import → no cycle).

## Unified enum decision (doc 02 open question #1)
Tech-side values were picked where the two mockups disagree:
- Experience: `Mới vào nghề` (not `Dưới 1 năm`) · 1–3 · 3–5 · 5–10 · Trên 10 năm.
- Pay type: `Lương bao` · `Ăn chia (commission)` · `Bao lương + ăn chia` · `Thuê ghế` · `Thoả thuận`.
- Work type: `Thay ca / Temp` (not `Thay ca`).
- License: `Có license TX` · `License bang khác` · `Đang học · chờ thi` + separate license number.
- Skills keep `Massage`, cities keep `San Antonio` (superset — no side clearly owns them).

## Behaviour choices (flag to Brian)
- "Tiệm hiện tại" of Jessica = Bloom Nail Lounge, so Kayla can invite her in K5. Quỳnh Đỗ works at Kayla's
  salon with privacy mode on → hidden from Kayla's board and suggestions.
- Privacy-mode note on S02-11 shows a count ("🛡️ 1 thợ đang làm tại tiệm của bạn…") instead of a name —
  naming the hidden tech would defeat the privacy mode.
- AI lock (< 60%) covers: B "✦ AI điền giúp", C "✦ AI viết giúp" / "🌐 Thêm bản English" / "✂️ Viết ngắn lại";
  techs < 60% are excluded from AI suggestions.
- "Đã có việc" keeps pending invites but flags them `techHired` → owner sees "Thợ đã có việc"; the tech can no
  longer be invited. "Xoá" removes invites sent from that post (`seekPostId`).
- Multiple active seek posts per tech are allowed (open question in doc 02).
- Publish toast for seek posts and decline toast are not in doc 02 — wording chosen here.
- "Nhắn tiệm" uses contract 3 (`/community-v2/messages/new?to=<personId>`); only Kayla owns a salon in the
  m00 seed, so other salons show a disabled button. Needs owner people in m00 seed (L0) to enable.

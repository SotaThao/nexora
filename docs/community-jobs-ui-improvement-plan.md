---
type: plan
title: "Community Jobs — UI Improvement Plan (post-evidence, 2026-09-24)"
status: approved-design
area: community
created: 2026-09-24
owner: dev@vlinkpay.com
supersedes-body-of: docs/community-jobs-layout-redesign-plan.md
---

# Community Jobs — UI Improvement Plan

> **Why this doc exists.** The body of `docs/community-jobs-layout-redesign-plan.md` describes layouts that no longer ship (split-view, then a docking panel). What actually ships since 2026-09-23: card grid + full-width detail at every width + a jobMode switcher. An E2E layout audit on 2026-09-24 (4 viewports, 20 screenshots, `FLOW_VERIFIED` 4/4) found 10 layout findings. This doc is the **current spec**. The old plan is kept as history: container-width math, reducer, and invariants are still valid there.
>
> Evidence: `.e2e/out/community-jobs-layout/LAYOUT-FINDINGS.md` + `.e2e/out/community-jobs-layout.zip` (local, untracked). Design review: `/plan-design-review` 2026-09-24. Outside voices: Codex `gpt-5.6-sol`/high + an independent Claude subagent.

## Standing decisions (do not re-flag in future reviews)

| # | Decision | Date | Note |
|---|---|---|---|
| S1 | Headerless layout (no "Nexora / Cộng đồng" header) | 2026-09-23 | from the old plan's 3rd addendum |
| S2 | Community tab labels in Vietnamese | 2026-09-23 | |
| S3 | Full-width detail view at every width | 2026-09-23 | |
| S4 | **Keep card grid** (Variant B), not list rows | 2026-09-24 (D1) | Codex flagged "generic SaaS card grid" as a hard rejection. User reviewed a real HTML board (1A/1B/1C) and chose 1B. **Not a regression when flagged again.** |
| S5 | **Keep the pill-card tab strip, but drop the icons (text only)** (no auto-center, no fade) | 2026-09-24 (D10) | Accepted risk: on 375px the active "Việc làm" tab can sit off-screen (finding #1). User chose this explicitly after seeing a board with a pill + auto-center option. |
| S6 | AI suggestions for **both tech and owner**; guests don't see AI | 2026-09-24 (D3; re-added after the scope cut at the user's request "add AI gợi ý to the Tech persona") | Tech: matching jobs (mock data until D11); Owner: existing `OwnerJobsPanel` |

## Business rule change (2026-09-24)

**Filled ("Đã tuyển đủ / Đã tìm được việc") and Closed ("Đã đóng") posts NO LONGER appear in "Duyệt tin".** They only appear in:
- **"Bài của tôi"**: the poster's own posts, with a status label (only the poster sees them);
- **"Đã liên hệ"** (new tab): posts the user has messaged, including ones that are now closed, with a status label.

Reverses Business Rule "Filled/Closed listings stay visible with an updated status label rather than being hidden" (`docs/business/community-jobs.md:125`). **G0b must update that business doc.** Consequences: the "Trạng thái" filter (`CommunityJobDetail.tsx:1123`, reducer `statusFilter`) **is removed** from the toolbar and the mobile filter sheet; `filterJobsForState` (`:65-72`) always filters `status === 'open'` for `view=browse`.

## Decisions made in this review

| ID | Question | Chosen | Evidence board |
|---|---|---|---|
| D1 | List format | **1B: card grid, fixed card header** | `design-board.html` |
| D2 | Community navigation | **2B: keep sidebar + tab strip, sync them** (sidebar sub-items in Vietnamese, all 6 items, same order as the tab strip) | `nav-board.html` |
| D3 | AI mode | **3D: AI by role (tech + owner), hidden for guests**; tech uses mock data (D11) | `final-board.html` |
| D4 | Mobile filters | **4A: "Bộ lọc (n)" button → bottom sheet** | `mobile-board.html` (top row) |
| D5 | Detail screen | **5A + reference layout** (header with large salary on the right, 2 columns: job details / contact + related posts); sticky back bar + prev/next + sticky message CTA; chat **reuses the existing `InlineChatSection`** | `final-board.html` |
| D6 | Guest permissions | **6A: guests browse only** | matrix below |
| D7 | Loading / error / success | **Spec for API time; this pass does NOT change delete behavior or add toasts** (scope cut) | table below |
| D8 | Detail URL | **8A: `?job=<id>` + push history** | — |
| D9 | Badges | **9A: "Cần gấp" = `nexoraDanger` everywhere** | — |
| D10 | Tab strip overflow | **Keep pill as-is** (see S5) | `tabs-board.html` |
| D11 | Data source for tech AI | **Deferred to PO; this pass is UI with mock data** (`techJobsData.ts`) | — |

Boards: `~/.gstack/projects/SotaThao-nexora/designs/community-jobs-ui-improve-20260924/` (the gstack designer has no OpenAI key on this machine, so the mockups are hand-built HTML using real `nexora*` tokens + real demo data, and are checked headlessly).

## Information hierarchy (target)

### Mobile 375px: job list

```
┌───────────────────────────────────┐
│ App header (existing, 64px)       │
├───────────────────────────────────┤
│ [Bảng tin][Nhóm][Sự kiện]…  (pill, S5)│
├───────────────────────────────────┤  ← no separate mode card (D3)
│ Duyệt tin  Bài của tôi  [Bảng tin|✦AI]│  ← segmented only for tech/owner, whitespace-nowrap
│ [🔍 Tìm tiêu đề, salon…] [Bộ lọc ①]│  ← D4
│ (Tất cả)(Tìm việc)(Tuyển thợ)(Houston ✕)│  ← kind chips + active filter chip
│ 18 tin · mới nhất        [+ Đăng tin]│  ← guest: "Đăng nhập để đăng tin"
├───────────────────────────────────┤
│ CARD (1B)                         │  target: first card y≈307px, 2 full cards
│ ‹ Trước     Trang 1/2     Tiếp ›  │  ← Vietnamese, min-h-11
└───────────────────────────────────┘
```

Order of attention: (1) job cards → (2) search/filter → (3) scope (browse/mine/AI) → (4) post CTA.

### Card (D1 = 1B)
- Row 1 (badge row): `Cần gấp` (if any) · **salary** · a status chip when not open ("Đã tuyển đủ"/"Đã đóng", only visible in Bài của tôi / Đã liên hệ). **No "Tuyển thợ / Tìm việc" badge** (user 2026-09-24), in the card, detail header, and related posts; post type is still filtered via the Tất cả / Tìm việc / Tuyển thợ chips. `flex-wrap`, never truncated.
- Title `text-base font-bold leading-snug line-clamp-2`.
- Meta `text-sm`: salon (brand) · location · "N ngày trước".
- **Salary in the badge row** (user 2026-09-24, replaces "own line"): value comes from the "Mức trả cụ thể / Mức mong muốn" input in the post form (free text, optional). Rule: contains a money range → `$1,000-1,300` (**no unit shown**: the form's convention is weekly, placeholder "VD: $1,000 - $1,300/tuần", user 2026-09-24); a single number → `$1,000+`; other text → `Thỏa thuận`; empty → **no chip**. Replaces `displayableSalary()` (`CommunityJobDetail.tsx:49`, today it only shows when the string contains "/tuần" or "thương lượng" and shows the raw string, which is why it gets cut). `whitespace-nowrap`, `title` = raw string. Detail keeps the full string.
- **Salary highlighted with the Success color** (user 2026-09-24): chip `bg-nexoraSuccess/10 border-nexoraSuccess/40 text-nexoraText font-extrabold` + an `nexoraSuccess` dot (`aria-hidden`). Measured: pure green text fails AA (`nexoraSuccess` 2.59:1, `nexoraTeal` 2.55:1, `nexoraTealAlt` 3.06:1 on white); dark text on the Success tint = 16.99:1. The detail "Mức lương" cell uses the same treatment.
- Description `line-clamp-2` (desktop/tablet only).
- Page size **12** (divisible by 3 and 2 columns, so **page 1 is always full**; fixes finding #8 for the first view). *Eng review correction:* the last page can still be short (demo data ~14 posts, so page 2 has 2 cards). This is accepted and **does not** promise "no orphans".

### Mobile detail (D5 = 5A)
- When detail is open: **hide the tab strip and the segmented control.** First line is a sticky back bar `h-12`, **offset = persona bar 52px + header 64px** (header is `sticky top-[52px] min-h-16`, `DemoMerchantShell.tsx:433`; take the value from one shared shell constant/CSS var, don't hardcode `top-16`): `‹ Danh sách` | `‹ 1/18 ›` (prev/next within the current filtered list; fixes "Why #1" in the old plan, left unfixed since the switch to full-width).
- Hero image `h-40` on mobile (currently ~h-60); title + salon · location · time overlaid on the image.
- Facts go in a flat `<dl>` (2×2 grid, dividers, no nested cards). Salary is the first cell → y≈307px (currently 623px).
- "Nội dung mẫu" becomes a small line under the description (no longer a leading chip).
- Status appears **once** (fact cell), dropping the duplicate chip (D9).
- Sticky CTA above the bottom nav: `Nhắn tin cho <salon>` → **scrolls to and expands the existing `InlineChatSection`** (`CommunityJobDetail.tsx:515`, still demo local chat; no new chat). Once Jobs has a real `posterUserId`, the CTA switches to the real DM via `useFindOrCreateDirectChannel` → `/community/chat/dm/:id` (TODOS.md). `bottom` = 68px (bottom nav `h-[68px]`, `DemoMerchantShell.tsx:495`) + `var(--app-safe-area-bottom)`, **plus a spacer at the end of the content** so the last description line isn't covered.
- ~~Chat sheet~~: not built (reuse `InlineChatSection`), so Codex #8 no longer applies.
- Desktop: same back bar + prev/next; chat stays an accordion at the bottom (no sticky CTA needed ≥1024px).

### Navigation (D2 = 2B)
- `DemoMerchantShell.tsx:~52-60` and `DemoStaffShell.tsx:~36-44`: sidebar sub-items become `Bảng tin, Nhóm, Sự kiện, Thông báo, Học tập, Việc làm` (same ids/order as `CommunityScreens.tsx:277-284 TABS`). The active sub-item follows `?tab=`. Both shells and `CommunityScreens` import from a **neutral module** `src/components/community/communityTabs.ts` (eng review #9: `CommunityScreens.tsx:55-56` already imports both shells, so importing `TABS` back from it would create a circular dependency).

## Permission matrix (D6 = 6A, D3)

| | Guest | Tech | Salon owner |
|---|---|---|---|
| View list/detail | ✓ | ✓ | ✓ |
| Message | Button shown → "Đăng nhập để nhắn" | ✓ | ✓ (not on own posts) |
| Post | Outline button "Đăng nhập để đăng tin" (replaces the grey pill) | Seeking work | Hiring |
| Bài của tôi | **hidden** | ✓ (including filled/closed) | ✓ (including filled/closed) |
| Đã liên hệ (mock) | **hidden** | posts the tech messaged | tech posts the owner messaged |
| AI gợi ý | **hidden**; `?view=ai` → replace to browse | Matching jobs (`TechJobsPanel`, mock, D11) | Anonymous candidates (`OwnerJobsPanel`, existing) |
| Edit / change status / delete | — | own posts | own posts |

## Interaction states (D7 = 7A)

| Feature | Loading | Empty | Error | Success |
|---|---|---|---|---|
| Job grid | 6 skeleton cards (same grid) | "Chưa có tin phù hợp" + "Xoá bộ lọc" | Error card + "Thử lại" | — |
| Bài của tôi | skeleton | "Bạn chưa có tin nào" + "Đăng tin đầu tiên" | as above | — |
| AI (tech) | 3 skeleton rows | "Chưa đủ thông tin để gợi ý" (copy set when D11 is decided) | as above | — |
| AI (owner) | 3 skeleton rows | "Chưa có ứng viên phù hợp" | as above | — |
| Post/edit | button "Đang đăng…" disabled | — | inline under form | unchanged from today (open the new post); toast via the existing `showToast` when wiring the API |
| Delete | spinner on button | — | error toast (`showToast`) | **unchanged from today**: open the next post ("back to grid + toast" → TODOS.md) |
| Send chat | faded bubble | — | red bubble + "Gửi lại" | normal bubble |
| Filter sheet | — | "0 tin" → primary button reads "Không có tin — Xoá bộ lọc" | — | "Xem N tin" |

**This pass:** only the empty-state layout. Loading/Error/Success implemented when wiring the API, **reusing** `ui/skeleton` + `useNotification().showToast` (`src/contexts/NotificationContext.tsx:37`), no new components.

## User journey (target)

| Step | Tech does | Feels | Supported by |
|---|---|---|---|
| 1 | Opens Việc làm on phone | Sees work right away | 2 cards on first screen (D4, D3 dropping the mode card) |
| 2 | Scans salary | Compares without opening | Salary on its own line, not cut (D1) |
| 3 | Opens a post | Knows the key facts | Salary y≈307, tabs hidden (D5) |
| 4 | Browses the next post | Keeps momentum | `‹ 1/18 ›` (D5) |
| 5 | Wants to message | Action within reach | Sticky CTA (D5) |
| 6 | Swipes Back | Returns to the list at the same spot | `?job=` + history (D8) |
| 7 | Sends a link to a friend | — | deep link `?tab=jobs&job=id` (D8) |
| 8 | Tries ✦ AI gợi ý | Suggestions that fit them | Tech: `TechJobsPanel` (mock); Owner: existing `OwnerJobsPanel` |

## Design system (D9 + DESIGN.md)
- `Cần gấp`: `bg-nexoraDanger text-white` in the card, detail, and post-form preview (`CommunityJobDetail.tsx:489, 681, 426`).
- "Nội dung mẫu": drop the hex `#8a5a00` (`:673`), use `text-nexoraSubtle` as a small line.
- Status filter: `<option>` changes from "Đang mở" to "Đang tuyển / tìm việc" (`:1129`), matching `statusLabel()`.
- Title/description `text-base` (DESIGN.md body 16px; the old plan already required it, the code still used `text-sm`).
- Pagination: Vietnamese labels "‹ Trước" · "Trang {p}/{t}" · "Tiếp ›", `min-h-11 normal-case` — add a label prop to `src/components/ui/Pagination.tsx` (shared component: **default labels unchanged** for other screens).
- Desktop left-axis alignment: Jobs container `mx-auto lg:mx-0` (finding #10).

## Type scale (user 2026-09-24: "font size doesn't fit the devices")

| Role | Mobile 375 | Tablet 768/1024 | Desktop 1440 | Token |
|---|---|---|---|---|
| Detail page title | 20px | 24px | 28px | `text-xl` / `text-2xl` / `text-[28px]` |
| Section heading (card) | 18px | 18px | 18px | `text-lg font-extrabold` |
| Reading text (description, meta values, post title on card) | 16px | 16px | 16px | `text-base` |
| Salon · location · time line | 14px | 16px | 16px | `text-sm` / `text-base` |
| Secondary meta, related-post excerpt | 14px | 14px | 14px | `text-sm` |
| Badges, meta labels, "Nội dung mẫu" | 12px | 12px | 12px | `text-xs` (**not** `text-[11px]`/`[10px]`) |
| Salary on detail | 18px | 20px | 20px | `text-lg`/`text-xl` (smaller than the title; it used to be the same size as the title) |

- **Minimum 12px** for everything Jobs draws. Measured on the board (headless, 100% scale, 3 personas × list/detail): the only things under 12px are 2 **existing shared** components: `Pagination` (`text-[10px]`) and the mobile bottom nav (11px, DESIGN.md spec). Not changed in this pass (Pagination's text size → TODOS.md if needed).
- <1024px: **only one** message entry point (the sticky CTA); the "Thông tin liên lạc" card doesn't repeat the button.
- Tablet portrait 768: "Thông tin liên lạc" + "Bài viết liên quan" sit **2 columns side by side** under "Chi tiết công việc" (no more 1 column with overly long lines).
- The mockup board has a "Tỉ lệ 100%" toggle; the earlier "tiny text" impression came partly from the board shrinking tablet/desktop to 55–62%.

## Responsive & a11y
- 375 / 768 / 1024 / 1440 as the boards show. Segmented AI control ≤360px: `whitespace-nowrap`; if it still doesn't fit, drop it to its own row (measured: at 340px "Duyệt tin / Bài của tôi" wraps to 2 lines when the segmented control is present).
- Segmented AI: `role="tablist"` + `aria-selected`, keyboard arrows.
- "Duyệt tin / Bài của tôi": `role="tablist"`; kind chips: `aria-pressed` (two different groups, two different semantics).
- Filter sheet: `role="dialog" aria-modal`, focus trap, `Esc` closes, focus returns to the "Bộ lọc" button.
- Opening detail: focus moves to the "Danh sách" back bar; a separate `aria-live="polite"` announces "Đã chọn: {title}".
- Touch targets ≥44px: pagination, prev/next, sheet options.
- Known accepted risk: S5 (pill tab strip).

## NOT in scope

| Deferred | Reason |
|---|---|
| List rows instead of cards | S4, user's choice |
| Auto-center/fade for the tab strip | S5, user's choice |
| Real data source for tech AI | D11, PO decides |
| Loading/Error implementation | No real async source yet; spec above is the target |
| Demo Hub collapsed by default | Dev tool, separate task (chip "Collapse NEXORA Demo Hub by default") |
| Result count from the API for the sheet | TODOS.md, when wiring Nailhub |
| CI E2E (tracked Playwright) | TODOS.md; this pass uses the evidence gate (E7) |
| i18n for old Community strings | TODOS.md; new strings already go through `t()` (E6) |
| Duplicate anonymous signup | Auth bug, not design; separate task (chip "Fix duplicate anonymous Supabase signup on load") |

## What already exists (reuse)
- `src/components/ui/Pagination.tsx`: already i18n (`t('common.back')`), **reuse unchanged** (T11 dropped).
- `communityJobsReducer.ts`: filter/page/delete-confirm actions kept; `selectedJobId`/`viewTab` move to the URL (E2). `filterJobsForState` (`CommunityJobDetail.tsx:65`) reused to count "Xem N tin".
- `OwnerJobsPanel.tsx` + `ownerJobsData.ts`: owner AI. Tech AI is a new sibling panel using the same list/row style.
- `isOwnerPersona` logic at `CommunityScreens.tsx:~118`.
- Tokens `nexora*`, `min-h-11` + `focus-visible:ring-nexoraBrand` convention from `PostJobModal`.

## Engineering review (2026-09-24)

### Engineering decisions

| ID | Decision | Why |
|---|---|---|
| E0 | **Gate G0 — Design approved before coding.** A consolidated mockup matching D1–D10 + S4/S5 and a Product/Design doc (Master → Product → Engineering) must be approved **before PR0**. Only then create the US + OpenSpec change | User decision 2026-09-24. The current decision boards still diverge in places (they draw underline tabs while S5 keeps pills; the AI board shows the guest invite card while D3 hides it), so they can't be the source to code from. |
| E1 | **3 sequential PRs after G0: PR0 tests + file split → PR1 URL + role → PR2 layout + tech AI (mock) + sidebar.** Real API (T14, T15, count endpoint) only after all UI is done | 10 files + 3 new components; `CommunityJobDetail.tsx` is 1227 lines, 0 Jobs tests. Codex caught that the original order (layout before URL) would have built prev/next/delete twice. URL/role is frontend logic that calls no API. |
| E2 | **URL owns navigation**: `?tab=jobs&view=browse\|mine\|contacted\|ai&job=<id>`. `selectedJobId` and `viewTab` **leave the reducer**; `jobMode` becomes `view` | 1A + Codex #2: `viewTab` lived inside the panel while `jobMode` lived in `CommunityScreens`, so enabling AI hid the toolbar. One source of truth, no two-way syncing. |
| E3 | Param contract (not "merge everything") | Codex #3. See table below. |
| E4 | `useJobsRole()` → `'guest'\|'tech'\|'owner'` + pure `can(role, action, { isOwn })` | 2A + Codex #1: messaging/editing depends on post ownership, not role alone. Replaces 3 scattered checks (`CommunityScreens.tsx:118`, `CommunityJobDetail.tsx:116`, the `OwnerJobsPanel` gate). Only the current role's AI panel is mounted. |
| E5 | `<JobBadges job size>` shared by card, detail, and form preview | 3A, DRY, removes the root cause of the D9 color mismatch. |
| E6 | T11 dropped; **new strings in PR1/PR2 go through `t()`** (vi.json/en.json); old strings → TODO | `Pagination.tsx:69,84` already uses i18n; "BACK/NEXT" comes from the app language being EN. Codex #12: don't grow the debt. |
| E7 | E2E = flow JSON for the `.e2e/flow.mjs` kit, copies committed at `docs/e2e-flows/`. **This is an evidence gate (run via `/e2e-setup` + `/evidence` before each PR), not CI.** CI gate = Vitest unit | 4A + Codex #10: `test:e2e` (`package.json:16`) points at a file that doesn't exist, see TODOS.md. |
| E8 | `communityTabs.ts` as a neutral module | Codex #9, avoids a shell ↔ screens import cycle. |

### URL state and param contract (E2, E3)

```
URL (source of truth)                      Reducer (local state only)
?tab=jobs                                  query, kindFilter, locationFilter,
 &view=browse|mine|ai   ── role guard ──►  statusFilter, pageNumber,
 &job=<id>              ── visible guard   deleteConfirmId, chatExpanded
        │                        │
        ▼                        ▼
  selectedJob = jobs.find(id)   job not in visible set ⇒ replace (drop job)
  undefined ⇒ replace (drop job) + toast "Tin không còn tồn tại"
                                  (NOT when this tab just deleted it itself)
```

| Action | tab | view | job | history |
|---|---|---|---|---|
| Change Community tab | set | **drop** | **drop** | replace |
| Change view (browse/mine/ai) | keep | set | **drop** | replace |
| Open a post from the grid | keep | keep | set | **push** + `state.fromGrid=true` |
| ‹ › prev/next | keep | keep | set | **replace** |
| "Danh sách" | — | — | — | `fromGrid` ⇒ `navigate(-1)`; deep link ⇒ replace (drop job) |
| Filter drops the open post | keep | keep | drop | replace |
| Delete the open post | keep | keep | **replace with the next visible post** (same behavior as today's `CONFIRM_DELETE`) before removing data | replace |
| Switch persona | keep | **drop** | **drop** | replace |
| Guest/role not allowed at `view=ai` | keep | → browse | drop | replace |

Lifecycle that replaces `SELECT_JOB` (Codex #5): when the `job` param changes (including Back/Forward/prev-next) → dispatch `RESET_DETAIL` (clear `deleteConfirmId`, `chatExpanded=false`). The scroll capture/restore logic (`CommunityJobDetail.tsx:~892-940`) keys on the `job` param instead of `selectedJobId`.

### Failure modes

| New path | Realistic failure | Test | Handling | User sees |
|---|---|---|---|---|
| `?job=` deep link | id of a post created in-session (`useState(demoJobs)`, `:852`) → gone after reload | unit + E2E | replace + toast | clear toast |
| Delete the open post | guard sees an id that no longer exists → "Tin không còn tồn tại" toast fires by mistake | unit (CRITICAL) | set job = next post before removing data | no false toast |
| Sticky CTA → InlineChatSection | CTA scrolls but the section stays collapsed / sits under the CTA | E2E | CTA dispatches TOGGLE_CHAT open + scrollIntoView with offset = CTA height | chat opens in the right place |
| Role changes mid-`view=ai` | guest/tech lands in the owner panel | unit `can()` | role guard replaces view | back to the board |
| Sticky CTA | covers the last line of content / bottom nav | E2E screenshot | spacer + offset from shell | — |
| Filter sheet | Esc applies filters by mistake | unit | staged state, apply only via "Xem N" | — |

No critical gaps (every path has a test or handling that shows the user something).

### Test coverage (target, 0% today)

```
CODE PATHS                                              USER FLOWS
PR0 (write first, before splitting the file)            PR1
 ├─ [CRITICAL] reducer SET_* keep pageNumber/filters     ├─ [→E2E] open post → ?job push → goBack → grid + scroll
 ├─ [CRITICAL] SET_VIEW_TAB clears deleteConfirm         ├─ [→E2E] deep link ?job=<unknown> → grid + toast
 ├─ [CRITICAL] RESET_FILTERS vs CLEAR_ALL                ├─ [→E2E] Danh sách: fromGrid vs deep link
 └─ [CRITICAL] panel render: grid/detail/permissions     └─ unit: can() × 6 actions × 3 roles × isOwn
PR1                                                     PR2
 ├─ param contract: 9 rows in the table above (unit)     ├─ [→E2E] 375px first card y≤380 (dev, includes 52px persona bar; ≈321 in production)
 ├─ RESET_DETAIL when job changes                        ├─ [→E2E] filter sheet: apply / Esc / 0 results
 ├─ [CRITICAL] delete open post → job = next, no toast  ├─ [→E2E] prev/next boundaries, sticky CTA → InlineChatSection
 └─ useJobsRole: anon / Kayla / Jessica                  ├─ unit: JobBadges (urgent/kind/filled/closed)
                                                         └─ unit: sidebar = communityTabs (order + labels)
COVERAGE target: 33/33 | 8 →E2E (evidence gate) | 6 CRITICAL regression written in PR0/PR1
```

Test plan artifact for `/qa`: `~/.gstack/projects/SotaThao-nexora/AD-claude-community-jobs-layout-ui-af928c-eng-review-test-plan-20260924-102953.md`.

### Parallelization

| Step | Module | Depends on |
|---|---|---|
| G0 design approval | docs, `~/.gstack/.../designs/` | — |
| PR0 tests + split | `src/components/community/`, `tests/unit/` | G0 |
| PR1 URL + role | `src/components/community/` | PR0 |
| PR2a layout (T1,T3,T4,T5,T7,T10,T12,T13,T16) + T2 tech AI (mock) | `src/components/community/` | PR1 |
| PR2c sidebar (T8) | `src/components/community/demo/` + `communityTabs.ts` | PR0 |

Lane A: G0 → PR0 → PR1 → PR2a (sequential, same module). Lane B: PR2c can run in parallel with PR1 (only touches `demo/` + a new file). (PR2b tech AI dropped by the scope cut.)

## Implementation Tasks

Synthesized from design review + eng review. Order: **G0 (design) → US + OpenSpec → PR0 → PR1 → PR2 → real API**.

**G0 — Design approved (before any code)**
- [x] **G0a — APPROVED 2026-09-24** (List, Filter, Detail; also keeping T16 pill text-only, T2 tech AI mock, T17/T18 Đã liên hệ + Bài của tôi shows closed posts, T8 sidebar + T6 URL) — source mockup: `~/.gstack/projects/SotaThao-nexora/designs/community-jobs-ui-improve-20260924/final-board-APPROVED-20260924.html` (copy locked at approval time; don't edit). Original consolidated mockup — One final HTML board (not a decision board) with every approved decision: pill tab strip (S5), 1B card, 2B sidebar, single toolbar `Duyệt tin | Bài của tôi | ✦ AI gợi ý` (E2; guests don't see AI), 4A sheet, 5A detail + chat sheet, D6 permissions per persona; 4 viewports × 3 personas; empty/success states per the D7 table
  - Files: `~/.gstack/projects/SotaThao-nexora/designs/community-jobs-ui-improve-20260924/final-board.html`
  - Verify: headless screenshot 4 viewports, you approve
- [x] **G0b — written 2026-09-24** (Master approved; Product doc in Review): [Master](00-master/community-jobs-ui_master_260924_v1.09.24.md), [Product](01-product/community-jobs-ui_product_260924_v1.09.24.md), business doc Rule 4 updated. Original: Product/Design doc — Per the Master → Product → Engineering sequence: root cause (10 evidence findings), persona, user flow (Mermaid), approved wireframe/mockup, D1–D11, S1–S6
  - Files: per `doc-naming-conventions` (vault / `docs/`)
  - Verify: you approve; D11 stays open (PO)
- [ ] **G0c** — User story `user-story/US-XXX-community-jobs-ui.md` + OpenSpec change (`openspec/changes/`), `design.md` maps US ↔ decisions ↔ files

**PR0 — foundation, no behavior change**
- [ ] **T0a (P1, human: ~3h / CC: ~30min)** — tests — Regression tests for the current reducer + `CommunityJobsPanel` (CRITICAL rows in the diagram), green against today's code
  - Surfaced by: Eng §3, IRON RULE; old-plan T3 was never done
  - Files: `tests/unit/communityJobsReducer.test.ts`, `tests/unit/CommunityJobsPanel.test.tsx`
  - Verify: `pnpm test` green before any refactor
- [ ] **T0b (P1, human: ~2h / CC: ~20min)** — split — Extract `JobCard`, `JobsToolbar`, `JobDetailView`, `JobBadges` (E5) from `CommunityJobDetail.tsx`; `communityTabs.ts` (E8)
  - Files: `src/components/community/*` (new files), `CommunityJobDetail.tsx`, `CommunityScreens.tsx`
  - Verify: T0a stays green, E2E flow `community-jobs-layout` screenshots unchanged

**PR1 — URL + role (frontend, no API calls)**
- [ ] **T6 (P1, human: ~3h / CC: ~30min)** — URL state — E2 + E3: `job`/`view` in the URL, drop `selectedJobId`/`viewTab` from the reducer, `RESET_DETAIL`, param contract, "Danh sách" by provenance, delete → drop job first
  - Files: `communityJobsReducer.ts`, `CommunityJobDetail.tsx`/`JobDetailView.tsx`, `CommunityScreens.tsx`
  - Verify: unit for 9 contract rows + E2E detail-history flow
- [ ] **T7' (P1, human: ~1.5h / CC: ~15min)** — role — `useJobsRole()` + `can(role, action, {isOwn})` (E4); replace 3 old checks; mount only the current role's AI panel
  - Files: `src/components/community/useJobsRole.ts` (new), `CommunityScreens.tsx`, `CommunityJobDetail.tsx`, `OwnerJobsPanel.tsx`
  - Verify: unit for the full D6 matrix

**PR2 — layout + tech AI (mock) + sidebar**, built exactly to the G0a mockup; new strings go through `t()` (E6)
- [ ] **T1** — single toolbar in `CommunityScreens`: `Duyệt tin | Bài của tôi | ✦ AI gợi ý` (`view`), no mode card; hidden per `can()`; `whitespace-nowrap` at 340px
- [ ] **T3** — JobCard (1B) + page size 12 as a Jobs-specific constant; salary chip per the rule above (replaces `displayableSalary`); **fix 2 seed posts** that break the weekly convention: `'$15 - $18/giờ'`, `'$18 - $22/giờ'` (`communityDemoContent.ts:125, :222`), change them to weekly or `Thoả thuận` so the card doesn't show `$15-18` as if it were weekly pay
- [ ] **T4** — filter sheet (4A), staged state, focus trap, Esc = discard
- [ ] **T5** — detail (5A + **reference layout 2026-09-24**): sticky back bar offset from shell, `‹ i/n ›`; **header** = small image (`h-24 w-36`, mobile `h-20 w-28`) · salon (brand) · location · time · badges · large title (`text-2xl`, mobile `text-xl` full width under the image) · **large salary on the right** (Success tint, `text-2xl`); **2 columns ≥1024px**: left "Chi tiết công việc" (meta dl for employment type/experience/skills/status: 4 cols at 1440, 2 cols below + description), right 300–360px "Thông tin liên lạc" (poster name + role, salon, location, "Nhắn tin" button → existing `InlineChatSection` inside this card; owner sees Sửa/Đổi trạng thái/Xoá) + "Bài viết liên quan" (≤3 posts of the same kind, same location first, from the existing list); <1024px stacked in the same order. **No phone/address/view count**: `DemoJob` has no such fields (don't invent data); sticky CTA → scroll/expand the **existing** `InlineChatSection`; CTA hides while chat is open (`chatExpanded`)
- [ ] **T7** — permission UI per D6 (login CTAs, hide "Bài của tôi"/AI for guests)
- ~~T9~~ — deferred (scope cut, TODOS.md)
- [ ] **T10** — badge tokens via `JobBadges` (D9), drop hex `#8a5a00`, filter label "Đang tuyển / tìm việc"
- [ ] **T12** — `lg:mx-0` container
- [ ] **T17** — Duyệt tin shows only `open`; drop `statusFilter` (reducer + toolbar + sheet); Bài của tôi shows all own posts with status labels (business rule change above)
- [ ] **T18** — "Đã liên hệ" tab (`view=contacted`), **mock data** (`contactedJobsData.ts`), 4-item control horizontally scrollable, no wrap at 340px; owner sees tech posts, tech sees hiring posts; closed posts keep their label
- [ ] **T16** — pill bar drops icons (text only): `CommunityTabs` (`CommunityScreens.tsx:286-310`) stops rendering `<Icon>`, stops importing icons that are no longer used; `TABS` in `communityTabs.ts` drops the `icon` field (S5, user 2026-09-24)
- [ ] **T13** — a11y (tablist/aria-selected, aria-pressed, dialog, aria-live, focus)
- [ ] **T2** — `TechJobsPanel` + `techJobsData.ts` (mock, D11), same list/row style as `OwnerJobsPanel`; mounted only for role `tech` (E4); empty state "Chưa đủ thông tin để gợi ý"
- [ ] **T8** — sidebar synced with `communityTabs.ts`
  - Verify PR2: unit per diagram + `/evidence` with 3 flows × 4 viewports (flow JSON at `docs/e2e-flows/`), compared against the G0a mockup

**After all UI is done — API/backend**
- [ ] **T14 (P3)** — Loading/Error + wire the Nailhub API
- [ ] **T15 (P3, blocked by D11)** — Real data for tech AI (replaces `techJobsData.ts` mock)
- [ ] Count endpoint for the sheet (TODOS.md)
- ~~T11~~ — dropped (E6); see TODOS.md "Community — i18n"

## Approved Mockups

**Source for implementation (G0a, approved 2026-09-24):** `~/.gstack/projects/SotaThao-nexora/designs/community-jobs-ui-improve-20260924/final-board-APPROVED-20260924.html`: 3 personas × screens × 4 viewports, "Tỉ lệ 100%" toggle. The decision boards below are history only; where they differ, the final board wins.

| Screen/Section | Mockup Path | Direction | Notes |
|---|---|---|---|
| Job list (desktop + mobile) | `~/.gstack/projects/SotaThao-nexora/designs/community-jobs-ui-improve-20260924/variant-1B.png` (board: `design-board.html`) | 1B card grid, fixed header | The board's chrome uses an underline tab strip; **the real build keeps pills (S5)** |
| Navigation | `…/nav-2B.png` (board: `nav-board.html`) | 2B sidebar synced with tab strip | Same note on pills |
| AI mode | `…/ai-3D-clicked.png` (board: `ai-mode-board.html`) | 3D by role; **guests hidden** (board shows the guest invite card, not chosen) | |
| Mobile filter + detail | `…/mobile-board.png` (board: `mobile-board.html`) | 4A + 5A | |
| Tab strip | `…/tabs-board.png` (board: `tabs-board.html`) | Keep current pills (S5) | |

## Completion Summary

```
+====================================================================+
|         DESIGN PLAN REVIEW — COMPLETION SUMMARY                    |
+====================================================================+
| System Audit         | DESIGN.md present; UI scope = Jobs tab + nav |
| Step 0               | 4/10, all 7 passes, outside voices on       |
| Pass 1  (Info Arch)  | 3/10 → 9/10  (D1, D2, D4, D5)               |
| Pass 2  (States)     | 2/10 → 9/10  (D6, D7)                       |
| Pass 3  (Journey)    | 5/10 → 9/10  (D5, D8)                       |
| Pass 4  (AI Slop)    | 5/10 → 8/10  (card grid kept, S4)           |
| Pass 5  (Design Sys) | 6/10 → 9/10  (D9)                           |
| Pass 6  (Responsive) | 3/10 → 7/10  (S5 accepted risk)             |
| Pass 7  (Decisions)  | 10 resolved, 1 deferred (D11 → PO)          |
+--------------------------------------------------------------------+
| NOT in scope         | written (6 items)                           |
| What already exists  | written                                     |
| TODOS.md updates     | N/A (no TODOS.md); 2 spawned task chips     |
| Approved Mockups     | 5 boards built, 5 decided                   |
| Decisions made       | 11 added to plan                            |
| Decisions deferred   | 1 (D11)                                     |
| Overall design score | 4/10 → 8/10                                 |
+====================================================================+
```

Pass 6 < 8 because of S5 (the user chose to keep pills as-is). Pass 4 = 8 because of S4 (card grid kept).

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | not run |
| Codex Review | `/codex review` | Independent 2nd opinion | 2 | issues_found → resolved | design voice: 10 findings (mapped to D1–D10); eng voice (gpt-5.6-sol/high, 228,711 tokens): 12 findings, 12/12 answered (8 folded as-is, 4 tensions decided by user) |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | issues_open | 19 issues, 0 critical gaps; scope reduced into G0 + 3 PRs |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | issues_open | score: 4/10 → 8/10, 11 decisions |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | not run |

- **CODEX:** Eng voice caught 3 things this review missed: PR order causing rework (→ URL before layout), the toolbar having no owner when switching to AI (→ `view` in the URL), and `can()` missing `isOwn`. It also corrected 2 wrong numbers (sticky offset 52+64px, page size 12 doesn't eliminate orphans).
- **CROSS-MODEL:** 4 tensions, the user chose Codex's side on all 4 (PR order, toolbar ownership, E2E labelled evidence-not-CI, new strings through `t()`). No point where the user kept the original review's approach over Codex.
- **SCOPE CUT (user 2026-09-24):** "change layout only, don't rebuild related features" ⇒ drop toast + delete→grid (T9), new chat sheet (tech AI T2 **re-added** at the user's request); reuse `InlineChatSection`, `showToast`, `ui/skeleton`. Keep URL `?job=` (T6) + guest permissions (D6).
- **VERDICT:** DESIGN + ENG REVIEWED, not yet CLEARED: waiting on gate G0 (consolidated mockup + Product/Design doc approved) before coding; D11 open.

**UNRESOLVED DECISIONS:**
- D11: data source for tech AI suggestions (skills + location), waiting on PO — this pass uses mock data

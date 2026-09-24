# Master Document: Community Jobs — UI Layout Improvement

## Metadata
- **Feature ID**: — (no ticket; add the issue number when one exists)
- **Branch Name**: `claude/community-jobs-layout-ui-af928c`
- **File Naming Convention**: `community-jobs-ui_<type>_<yymmdd>_v<major>.<month>.<day>.md`
- **Created Date**: 2026-09-24 11:47
- **Last Updated**: 2026-09-24 11:51
- **Current Version**: v1.09.24
- **Author**: @tnsthao94
- **Status**: Approved
- **Approved By**: @tnsthao94 (2026-09-24)

## 1. Feature Overview

### Problem Statement
An E2E audit on 2026-09-24 (4 viewports, 20 screenshots, `FLOW_VERIFIED` 4/4) of the Community "Việc làm" tab found 10 layout issues, 2 of them high:
- On mobile, the first screen shows **no job posts at all**: the tab bar, a separate mode card, and the filter card take up most of the screen, and the first post starts at about y=680 of 812px.
- The active "Việc làm" tab sits off-screen on mobile and on landscape tablet.
- The chips on each card overflow and get cut off ("Tuyển th", "$1,100 - $1,400/ng…").
- Navigation is layered 3 deep and inconsistent: an English sidebar, Vietnamese tabs, plus a mode switcher.
- The AI mode is shown to everyone, so a guest who clicks it hits a dead end.

Evidence: `.e2e/out/community-jobs-layout/LAYOUT-FINDINGS.md` (local). Root cause: the plan behind it (`docs/community-jobs-layout-redesign-plan.md`) describes layouts that no longer ship, and mobile/tablet were marked "unchanged / not a target", so they were never designed.

### Business Context
Community Jobs connects nail techs and salons. On mobile (the primary device for techs), users cannot see any posts on the first screen and cannot tell which tab they are on. That breaks the main flow: find a job, then contact the salon. The current state also contradicts the business rule "AI gated to owner", because the AI button is visible to everyone and then blocks them.

### Goals & Objectives
- Show job posts on the mobile first screen (at least 2 full cards at 375×812).
- Make the post detail screen easy to read and act on: salary is visible right away, contacting the poster takes one tap, and users can move to the previous/next post.
- Use one navigation hierarchy with consistent naming, and permissions that are clear for each persona.
- **Change the layout only; don't rebuild features that already exist.** Reuse the existing chat, `OwnerJobsPanel`, `showToast`, and `ui/skeleton`.

## 2. Scope

### In-Scope (approved G0a 2026-09-24)
- **List:** card grid (kept); badge row = "Cần gấp" + salary (Success tint, value from the "Mức trả" input, weekly by convention so no unit shown; empty means no chip) + status; no "Tuyển thợ/Tìm việc" badge; page size 12; **Duyệt tin shows only open posts**.
- **Filters:** on mobile, a "Bộ lọc (n)" button opens a bottom sheet for area; on desktop, inline selects; the "Trạng thái" filter is removed.
- **Detail:** header with a small image, large title, and large salary on the right; 2 columns: "Chi tiết công việc" on one side, "Thông tin liên lạc" + "Bài viết liên quan" on the other; sticky back bar with ‹ i/n ›; sticky message CTA on mobile that opens the existing `InlineChatSection`.
- **Type scale:** minimum 12px, reading text 16px.
- Tab strip pills text-only (no icons).
- A single `view` control: Duyệt tin · Bài của tôi · Đã liên hệ (new tab, mock data) · ✦ AI gợi ý (tech: matching jobs, mock data; owner: existing panel). Guests don't see it.
- "Bài của tôi" shows all of the user's own posts, including closed ones, with a status label.
- Sidebar sub-items in Vietnamese, synced with the tab strip.
- URL `?job=<id>`: browser Back closes the detail view; posts can be deep-linked.
- Guest permissions: can view, but messaging, posting, "Bài của tôi", and AI require signing in.

### Out-of-Scope
- Real data for tech AI (decision D11, waiting on PO).
- Real data for "Đã liên hệ"; real DM messaging for Jobs (needs a real `posterUserId`).
- Delete/post behavior changes (toast, return to grid after delete).
- Wiring the Nailhub.ai API; loading/error implementation (spec only).
- i18n for existing strings; the shared `Pagination` and bottom-nav components.
- Auto-center/fade for the tab strip (accepted risk S5).

## 3. Key Personas (Summary)

### Primary Users
- **Nail tech (Jessica):** uses a phone, looking for a job with good pay near where they live. Needs to compare salaries quickly and contact the salon right away.
- **Salon owner (Kayla):** posts hiring ads and wants to find suitable techs (AI suggestions) and manage their own posts.

### Secondary Users
- **Guest (Linh):** browsing without signing in. Can view posts; needs a clear way to sign in before contacting anyone or posting.

## 4. Success Metrics (KPIs)
Measured with the E2E evidence kit (`/evidence`, 4 viewports):
- On 375×812, the first card is at **y ≤ 380px** in dev (includes the 52px persona bar), about 321px in production; today it is about 680px.
- Salary on the detail screen is visible in the first screen on mobile (y ≤ 812px); today it is at y=623px, below the chrome.
- The smallest text drawn by Jobs is **≥ 12px** (automated audit).
- **0** chips are truncated on cards across all 4 viewports.
- **0** filled/closed posts in Duyệt tin; **0** dead-end screens for guests.
- `FLOW_VERIFIED` 4/4 viewports × 3 flows (browse-mobile, detail-history, filter-sheet); 0 console errors.

## 5. High-Level Timeline
- **G0 — Design gate** (2026-09-24): G0a mockup ✅ approved; G0b Master ✅ (this doc) → Product doc; G0c US + OpenSpec.
- **PR0 — Foundation**: regression tests for the current reducer/panel + split the 1227-line file, no behavior change.
- **PR1 — URL + role**: `?job`/`view` in the URL, `useJobsRole()` + `can()`.
- **PR2 — Layout**: T1, T3, T4, T5, T7, T8, T10, T12, T13, T16, T17, T18, T2 (tech AI mock).
- **After UI is complete — API/backend**: T14, T15, count endpoint.

Dates: not set yet (no ticket or sprint).

## 6. Stakeholders & Responsibilities
- **Product**: @tnsthao94 (acting)
- **Design**: @tnsthao94 (approved G0a)
- **Development**: TBD
- **QA**: TBD
- **Project Manager**: TBD
- **PO (decision D11)**: TBD

## 7. Related Documents
- **Product Doc**: [01-product/community-jobs-ui_product_260924_v1.09.24.md](../01-product/community-jobs-ui_product_260924_v1.09.24.md) (Review)
- **Engineering Doc**: `02-engineering/community-jobs-ui_engineering_260924_v1.09.24.md` (to be created; content already in the plan's "Engineering review" section)
- **QA Doc**: `03-qa/community-jobs-ui_qa_260924_v1.09.24.md` (to be created; test plan artifact already exists)
- **Tasks Doc**: `04-tasks/community-jobs-ui_tasks_260924_v1.09.24.md` (to be created)
- **Plan (design + eng review)**: [community-jobs-ui-improvement-plan.md](../community-jobs-ui-improvement-plan.md)
- **Approved mockup**: `~/.gstack/projects/SotaThao-nexora/designs/community-jobs-ui-improve-20260924/final-board-APPROVED-20260924.html`
- **Business doc (Rule 4 + step 1 + FAQ updated 2026-09-24)**: [community-jobs.md](../business/community-jobs.md)
- **Deferred work**: [TODOS.md](../../TODOS.md)
- **GitHub Issue**: —
- **Pull Request**: —

## 8. Changelog
| Version | Date | Time (HH:mm) | Author | Description | Reviewed By | Status |
|---------|------|--------------|--------|-------------|-------------|--------|
| v1.09.24 | 2026-09-24 | 11:47 | @tnsthao94 | Initial draft from E2E evidence + design review + eng review + approved G0a | — | Review |
| v1.09.24 | 2026-09-24 | 11:49 | @tnsthao94 | Master approved | @tnsthao94 | Approved |
| v1.09.24 | 2026-09-24 | 11:51 | @tnsthao94 | Linked Product doc; business doc Rule 4 updated | — | Approved |

## 9. Approval & Sign-off
- [x] **Product Lead**: @tnsthao94 - Date: 2026-09-24
- [ ] **Tech Lead**: @____ - Date: ____
- [ ] **QA Lead**: @____ - Date: ____
- [ ] **Project Manager**: @____ - Date: ____

## 10. Notes & Assumptions
- **Business rule change:** filled/closed posts are no longer shown in Duyệt tin. This reverses `docs/business/community-jobs.md:125`, so the business doc needs updating together with the Product doc.
- **"Change layout only":** the user cut scope on 2026-09-24, then added back 4 items explicitly (tech AI mock, "Đã liên hệ" tab mock, text-only pills, sidebar + URL). All mock data will be replaced when real data sources exist (TODOS.md).
- Demo data: 2 seed posts are hourly (`communityDemoContent.ts:125, :222`) and don't follow the weekly convention; they get fixed in T3.
- No code has been written yet. Coding starts only after this Master doc and the Product doc are approved.

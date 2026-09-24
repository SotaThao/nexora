---
type: plan
title: "Community Jobs — Layout Redesign Plan (Card Grid + Docking Panel)"
status: draft
area: community
created: 2026-09-22
owner: dev@vlinkpay.com
---

# Community Jobs — Layout Redesign Plan

> **2026-09-24 — current spec has moved to [community-jobs-ui-improvement-plan.md](community-jobs-ui-improvement-plan.md)** (post E2E evidence + design review, 11 decisions: keep card grid, sync sidebar, AI by role for both tech and owner, mobile filter sheet, detail with prev/next + `?job=` URL…). This file is kept as history for the container width, reducer, and selection invariants.

> **2026-09-22, post-review addendum:** after design review, engineering review, and one full implementation + fix pass on **Variant A (inbox split-view)**, the user reviewed the live 3-variant mockup board directly and switched the chosen direction to **Variant B (card grid + docking panel)**. Kept as-is below: the container-width investigation (still applies — B's dock needs the same extra room A's split-view needed), the reducer/state model, selection invariants, chat/delete/accessibility decisions, filters, tabs, pagination reuse — none of that was layout-specific. Changed: "Chosen Direction" and "Proposed Structure" below, and the `JobDetailDrawer` row in "Component changes". The Design/Eng review reports and Codex findings further down are kept verbatim as the historical record of what was actually reviewed (Variant A's specific structure) — the underlying bugs and fixes they surfaced (container width, selection invariants, the `<1280px` tier-boundary incident) apply equally to B and are not being re-litigated.
>
> **2026-09-23, second post-review addendum — the docking panel became a full-width detail view, at every width.** A separate agent (Antigravity) worked in this same worktree and, per an explicit user request ("bấm vào bài viết sẽ hiển thị chi tiết thay vì hiển thị modal bên cạnh"), replaced the `≥1280px` docking panel (`JobDockPanel`) with `JobDetailView`, a full-width detail view. The user then confirmed this should apply **at every width, not just desktop** — so the `<1280px`/`≥1280px` split described below no longer exists. `JobDetailDrawer` (the old `<1280px` overlay) and `JobChatDock` (the old floating chat, whose position math depended on the drawer) are both **deleted**, not just superseded. Concretely: **Selection invariants rows 1 and 3 below are now wrong as written** — "select the first visible item" was a Variant A/B-docking-panel rule with no correct use case under a full-width-always view; the reducer's fallback for both `clampSelection` and `SET_PAGE` is now `null`, not `visibleJobIds[0]` (a real, previously-shipped bug — a stale `selectedJobId` surviving its own job leaving the filtered set, then a later filter/page action falling back to `visibleJobIds[0]`, reopened a *different, unrelated* listing's detail — fixed by clearing the stale id and changing the fallback to `null`). The same Antigravity pass also added a second, entirely separate Jobs UI — `OwnerJobsPanel`/`ownerJobsData.ts`, an "AI Matching" anonymous-candidate view for salon owners — wired in behind a `jobMode=b|ai` switcher next to this plan's UI (labelled "Bảng tin việc làm" vs. "Theo AI gợi ý tuyển thợ"). The user confirmed this revives a direction a prior handoff doc (`community-341_jobs-handoff_260915.md`) recorded as PO-rejected (issue #1014/#589) — PO has since reopened it; not a scope error. `OwnerJobsPanel` is gated to the owner persona only, matches this feature's "Nội dung mẫu" business rule, and went through its own review pass (round 5-6 below covers both surfaces). Scroll/focus restoration was added for the full-width view (capture on open, restore on close) since there's no longer a fixed-position drawer making that automatic. 7 rounds of design/eng review (documented below) found and fixed 2 design-stage blockers, then — after the Antigravity full-width/AI-mode rewrite — 3 more runtime-confirmed blockers (auto-select hijacking the screen on any filter change, two simultaneous chat threads, a stale `selectedJobId` reopening a stranger's listing) plus a long P1/P2/P3 list; final verdict was SHIP with only cosmetic P3s remaining, all since cleaned up.
>
> **2026-09-23, third addendum — global/workspace headers removed again, tab labels translated, by explicit user decision.** After seeing a screenshot of the restored headerless-vs-headed states, the user chose to go back to Antigravity's original headerless layout (reversing the P2 fix noted above that had restored the global "Nexora / Cộng đồng" header and the Jobs workspace header) and asked for the 6 top-level Community tab labels (`Feed`/`Groups`/`Events`/`Announcements`/`Learning`/`Jobs`) to be translated to Vietnamese. **This is a deliberate reversal, not a missed fix**: the design review's original hard-rejection finding ("no persistent product identity — the detail view's photo becomes the visual anchor instead of the product") is knowingly left unaddressed by this decision. Record this if a future design review flags the same issue again — it's not a fresh regression, it's this standing product call.

## Why

The current Community Jobs UI (`src/components/community/CommunityJobDetail.tsx`) is a card-grid list that opens listing detail in an overlay drawer, with a separately-floating chat dock whose horizontal position is computed off the drawer's width (`calc(min(560px,100vw)+16px)`). This works for the 4 seed demo listings but has concrete gaps once real data arrives:

1. **No next/previous navigation between listings**, and no persistent sense of "where am I in the list" while reviewing several listings in a row. (Earlier drafts of this plan additionally claimed the current drawer "loses list scroll position" — verified false: the drawer is `fixed`, the grid underneath is never unmounted or scroll-locked, so on wide viewports the list stays exactly where it was, partly visible beside the 560px drawer. The real problem is the lack of in-place next/prev and persistent context, not lost scroll position.)
2. **Chat dock position is hard-coded off the drawer.** A fragile cross-component coupling — any future change to the drawer's width/layout breaks the chat dock's position math.
3. **No pagination.** The real backend integration spec (`docs/community-341/02-engineering/community-jobs-341_engineering_260921_v1.0.0.md` in the team's Nexora vault, dated 2026-09-21) already defines `pageNumber`/`pageSize` query params for the real, Nailhub.ai-backed data — the current layout has no UI affordance for pages at all.
4. **No dedicated "My Posts" view.** A poster's own listings are mixed into the public feed, distinguished only inside the detail panel once opened.
5. **No status filtering.** Filled/Closed listings stay inline with Open ones at full visual weight (by design, per the business doc's Rule 4 — not hidden), but there's no way to filter them out.
6. **Badge crowding.** Urgent + kind + salary badges already compete for space on an ~18rem-wide card, with no visual headroom reserved in the row layout itself for the additional statuses the real backend will introduce (`PendingApproval`, `Rejected`) — this is a layout/spacing concern about today's row design, not a claim that this redesign models those future states (it doesn't; see "NOT in scope").

Full context: [community-jobs.md](business/community-jobs.md) (business doc), [community-jobs-prototype-spec-handoff_260917.md](community-jobs-prototype-spec-handoff_260917.md), [community-jobs-handoff-v2_260915.md](community-jobs-handoff-v2_260915.md).

## Chosen Direction: Card Grid + Docking Panel (Variant B)

Three structural directions were mocked up and reviewed live in-browser (interactive HTML, real Nexora design tokens, real sample content) at `~/.gstack/projects/SotaThao-nexora/designs/community-jobs-layout-20260922/design-board.html`:

- A — Inbox split-view: narrow list column + persistent detail pane. Gmail/Linear-style.
- **B — Card grid + docking panel** (chosen): keeps today's actual card-grid visual identity (`grid-cols-[repeat(auto-fit,minmax(18rem,1fr))]`, unchanged from current shipped code); selecting a card opens a docking panel that pushes the grid to reflow into fewer columns, rather than overlaying it. Smallest visual departure from what's live today — the grid itself doesn't change, only how detail is shown.
- C — Dense table + persistent rail: highest information density, best long-term scalability, biggest visual departure from today's cards.

**Decision:** Variant B, chosen by direct review of the live mockup board (see addendum above — this superseded an earlier choice of Variant A that had already been through design + engineering review). See [Approved Mockups](#approved-mockups).

## Where the Split-View Lives (fully re-verified against the real component tree)

**This section was wrong twice before landing here — both corrections are kept below for the record.**

- **First draft** assumed activation at `lg:` (1024px) was fine. Wrong: missed that `DemoMerchantShell`/`DemoStaffShell` both reserve a 288px sidebar starting exactly at `lg:`, leaving only ~736px, not 1024px, of content width at that breakpoint.
- **Second draft** (after the first correction) assumed `CommunityJobsPanel` could grow up to the outer `1040px` frame. Also wrong, caught by the Codex outside-voice pass: `CommunityHome` (in `CommunityScreens.tsx:390`) wraps ALL tab content — including Jobs — in a **second, hardcoded `max-w-[680px]` inner column**, separate from and tighter than the outer `1040px` frame. That inner cap applies at every breakpoint; the freed space at `2xl:` (1536px+) goes to a real, separate `CommunityRightRail` sibling component (`w-[336px]`, `CommunityScreens.tsx:423`), not to Jobs. There is no viewport width at which Jobs legitimately gets more than 680px **without also changing `CommunityScreens.tsx`.**

**Full verified chain**, traced from mount to `CommunityJobsPanel`:

```
CommunityHome (CommunityScreens.tsx:371)
  → CommunityFrame containerClassName="max-w-[1040px]"    (outer cap)
      → DemoMerchantShell (owner/Kayla) OR DemoStaffShell (staff/Jessica, guest/Linh)
          both: <aside w-72 (288px)> fixed sidebar, appears at `lg:` (1024px)+
          both: main content area gets `lg:pl-72`
      → CommunityHome's own JSX, INSIDE the shell's content slot:
          <div class="flex ... 2xl:flex-row">
            <div class="max-w-[680px] ...">          ← hardcoded inner cap, ALL tabs incl. Jobs
              {currentTab === 'jobs' ? <CommunityJobsPanel /> : ...other tabs...}
            </div>
            <div class="hidden w-[336px] ... 2xl:block">   ← CommunityRightRail, 2xl+ only
          </div>
```

**The fix (per your decision): widen Jobs specifically, not the shared column.** `CommunityHome`'s inner wrapper (`CommunityScreens.tsx:390`) and the rail sibling (`:423`) become conditional on `currentTab === 'jobs'`: Jobs drops both the `680px` cap and the rail reservation, using the full outer `1040px` frame at all breakpoints; Feed/Groups/Announcements/Events/Learning keep today's `680px` + rail-at-`2xl` behavior exactly as-is (zero visual change for those tabs). This is contextually correct, not just a width hack — a job board is a workspace, not a social feed, so "communities you might like" in a rail beside it doesn't make sense anyway.

**Resulting available width for Jobs**, sidebar-adjusted, once the fix lands:

| Viewport | Sidebar (lg+) | Available for Jobs (capped at 1040px) |
|---|---|---|
| `< 1024px` | none | full viewport (mobile pattern, unchanged — see tier table below) |
| `1024px` (`lg`) | 288px | ~736px |
| `1280px` (`xl`) | 288px | ~992px |
| `≥ 1328px` | 288px | 1040px (hits the outer cap, stops growing) |

**Three-tier responsive behavior** (unchanged conclusion from earlier drafts, now on solid ground):

| Viewport | Behavior |
|---|---|
| `< 1024px` | Unchanged. Current full-screen bottom-sheet detail + full-screen chat dialog (`JobChatDock`, kept as-is for this tier — see Chat below). |
| `1024px – 1279px` (`lg`) | Unchanged. Keep today's overlay-drawer pattern —736px is workable but tight for a comfortable split; not worth the complexity of a 4th tier. |
| `≥ 1280px` (`xl`) | **New: persistent split view.** List column 360px + detail pane (~590px at `xl`, growing to ~640px at the 1040px cap). |

## Proposed Structure (originally "Desktop ≥1280px" — per the 2026-09-23 addendum, `JobDetailView` now applies at every width; the diagram below illustrates the desktop case, the same structure collapses to one column on narrow viewports)

Same breakpoint tiers as before (`<1024px` and `1024–1279px` unchanged, `≥1280px` gets the new treatment) — only what renders at `≥1280px` changes, from a persistent list+pane split to today's existing card grid plus a docking panel that opens on selection:

```
┌───────────────────────────────────────────────────────────────────┐
│ Nexora Community / Jobs · 24 tin                [Đăng tin tuyển thợ]│  ← workspace identity header
├───────────────────────────────────────────────────────────────────┤
│ [Duyệt tin] [Bài của tôi]   Tìm kiếm…  Khu vực▾  Tất cả/Tìm/Tuyển  Trạng thái: Tất cả▾ │  ← list toolbar
├──────────────────────────────────────────────┬──────────────────────┤
│ CARD GRID (auto-fit, minmax(18rem,1fr) —      │ DOCK (~420px)         │
│ unchanged from today's shipped grid; reflows  │ closed/width-0 until  │
│ to fewer columns as the dock opens)           │ a card is selected —  │
│ ┌────────┐ ┌────────┐ ┌────────┐              │ EXCEPT: on "Bài của   │
│ │ [img]  │ │ [img]  │ │ [img]  │ ...           │ tôi" with 0 listings, │
│ │ badges │ │ badges │ │ badges │               │ opens automatically   │
│ │ Title  │ │ Title  │ │ Title  │               │ showing the empty-CTA │
│ │ salon· │ │ salon· │ │ salon· │               │ (nothing to click)    │
│ │ area   │ │ area   │ │ area   │               │ ┌───────────────────┐ │
│ └────────┘ └────────┘ └────────┘               │ │ Photo (subordinate)│ │
│  (selected card gets a ring; dimmed if         │ │ badges · title     │ │
│   Filled/Closed — new treatment)               │ │ posted by · area   │ │
│ ‹ 1 2 3 › (shared Pagination component)        │ │ description        │ │
│                                                 │ │ quick-facts grid   │ │
│                                                 │ │ ─────────────────  │ │
│                                                 │ │ Owner: Edit/Status/│ │
│                                                 │ │  Delete (confirm)  │ │
│                                                 │ │ Other: ▸ Nhắn tin  │ │
│                                                 │ │  (closed by default)│ │
│                                                 │ └───────────────────┘ │
└──────────────────────────────────────────────┴──────────────────────┘
```

## State Model (Pass: Code Quality — was previously a bare "use a reducer" decision with no shape; now fully specified)

`CommunityJobsPanel` consolidates its existing 3 independent `useState` calls (`query`, `kindFilter`, `locationFilter`) plus the new pieces (`statusFilter`, `viewTab`, `pageNumber`, `selectedJobId`, delete-confirm, chat-expanded) into one reducer, so every transition is explicit and testable in isolation:

```ts
type ViewTab = 'browse' | 'mine'
type StatusFilter = 'all' | 'open'

type PanelState = {
  query: string
  kindFilter: 'all' | PostKind
  locationFilter: string
  statusFilter: StatusFilter
  viewTab: ViewTab
  pageNumber: number
  selectedJobId: string | null
  deleteConfirmId: string | null
  chatExpanded: boolean
}

type PanelAction =
  | { type: 'SET_QUERY'; query: string }
  | { type: 'SET_KIND_FILTER'; kind: 'all' | PostKind }
  | { type: 'SET_LOCATION_FILTER'; location: string }
  | { type: 'SET_STATUS_FILTER'; status: StatusFilter }
  | { type: 'SET_VIEW_TAB'; tab: ViewTab }
  | { type: 'SET_PAGE'; page: number }
  | { type: 'SELECT_JOB'; jobId: string | null }
  | { type: 'REQUEST_DELETE'; jobId: string }
  | { type: 'CANCEL_DELETE' }
  | { type: 'CONFIRM_DELETE' }        // clears deleteConfirmId + advances selection; the actual array removal stays a prop-level callback, same as today's setJobs
  | { type: 'TOGGLE_CHAT' }
  | { type: 'RESET_FILTERS' }         // matches existing post-create behavior in submitDraft
```

### Selection invariants (previously unspecified — Codex flagged this correctly; rows 1 and 3 corrected 2026-09-23, see addendum)

| Trigger | Rule |
|---|---|
| Search/kind/location/status filter changes | **Corrected**: if `selectedJobId` was already `null`, leave it `null` — do NOT select anything (this is the full-width `JobDetailView`, not a docking panel; auto-selecting hides the entire toolbar/grid behind a detail view the user didn't ask for — this was a real, shipped bug). If a real prior selection drops out of the now-filtered set, clear it to `null` too (not "select the first visible item" — that fallback has no correct use case under a full-width-always view and only ever fired on stale, harmful selections in practice). |
| `viewTab` switches | Reset `pageNumber` to 1; clear selection to `null` if it's no longer visible (same corrected rule above) |
| `pageNumber` changes | If the current selection isn't on the new page, clear to `null` — do NOT auto-select the new page's first item |
| Delete confirmed | If the deleted job was selected: select the next item in the current filtered list, else the previous one if it was last, else `null` if the list is now empty |
| Edit saved | Selection stays on the same job id (unaffected by edit) |
| New post created | Selection moves to the new post (existing `submitDraft` already prepends it — unchanged) |
| Persona switch (demo login change) | Full reset: `viewTab` → `browse`, selection re-clamped |

### Component changes

| Component | Change |
|---|---|
| New: workspace header | `Nexora Community / Jobs` + live result count (`{n} tin`) + primary CTA, visually separated from the filter/tab toolbar below it (fixes: no persistent product identity, flagged as a hard-rejection by the design review's outside voice). |
| `CommunityScreens.tsx` | `CommunityHome`'s inner `max-w-[680px]` wrapper (`:390`) and the `CommunityRightRail` sibling (`:423`) both become conditional on `currentTab !== 'jobs'`. Jobs uses the full `1040px` outer frame at every breakpoint, no rail. All other tabs: zero change. |
| `CommunityJobsPanel` | Reducer per above (unchanged by the A→B switch). `≥1280px`: keeps today's existing card grid (`grid-cols-[repeat(auto-fit,minmax(18rem,1fr))]`) **unmodified** — selected card gets a ring/border treatment; grid reflows to fewer columns as the dock opens (flex/grid sibling, not an overlay). `<1280px`: unchanged existing markup. |
| `JobDockPanel` (new — replaces the plan's earlier `JobDetailDrawer`-inline-at-`≥1280px` approach) | `≥1280px`: a new docking panel, width ~420px, `width: 0` / hidden until a card is selected (auto-opens showing the empty-CTA specifically when `viewTab === 'mine'` and the filtered list is empty, since there's nothing to click there). Same content as the pane described in the original split-view draft (photo, badges, title, quick facts, owner actions vs. chat). `<1280px`: `JobDetailDrawer` unchanged, still the existing overlay. Delete routes through `REQUEST_DELETE` → inline confirm → `CONFIRM_DELETE`, same as before. |
| `JobChatDock` | **Not removed** (correction — an earlier draft said "removed," which directly contradicted the same draft's "mobile unchanged" claim, since `JobChatDock` *is* today's mobile chat). Kept exactly as-is, used unchanged for `<1280px`. **New, separate**: an inline collapsible "▸ Nhắn tin" section at the bottom of the split-view's detail pane for `≥1280px` only, closed by default (`chatExpanded`), no `calc()` position math — this is new, additional markup, not a modification of `JobChatDock`. |
| `src/components/ui/Pagination.tsx` | **No changes needed** (correction to an earlier draft that assumed a change was required). Reused as `variant="simple"`. Its scroll-to-top behavior is gated by `isMobileScrollContext()` — which is exactly correct here too: mobile pagination still needs scroll-to-top (full-page navigation), desktop split-view pagination doesn't (the list column is already fully in view; nothing needs scrolling into place). |
| New: status filter | "Trạng thái" control next to the kind-filter pills, default **`all`** (not `open`) — an earlier draft defaulted to open-only, which directly contradicted this repo's own Business Rule 4 ("Filled and Closed listings remain visible... not hidden"). |
| New: My Posts tab | `viewTab: 'mine'`, filters to `isOwn(job)`; does not auto-select the first item (see Interaction States). |

## Interaction States

**Correction (post-B-switch):** the row below originally said "first result auto-selected (`browse` tab only)," carried over from Variant A, where the persistent pane needed *something* to show. Under B, the dock's open/closed state *is* the selection — auto-selecting on load means the dock is never actually closed and its own close button can't work (caught by the second review round). **Decision: no auto-select on `browse`. The dock stays closed until a card is clicked, matching the approved mockup's actual behavior** (`design-board.html`'s Variant B starts with the dock at `width: 0`). The one exception below (`mine`, zero listings) still auto-opens, since there's nothing to click there.

| Feature | Loading | Empty | Error | Success | Partial |
|---|---|---|---|---|---|
| Card grid | N/A today (client-only); spec kept for when real API lands | Existing empty-state copy reused, + "Xoá bộ lọc" action (not shown when the dock already owns the empty message — see `mine` row below) | N/A today | Cards render; dock stays closed until one is clicked | Filtered subset renders normally |
| Dock, `browse`, nothing selected | — | Dock is closed/`width:0` — there is no "nothing selected" placeholder state to show, unlike Variant A's persistent pane | — | — | — |
| Dock, `mine`, zero listings | — | Dock auto-opens showing "Bạn chưa có tin nào. Đăng tin đầu tiên." + CTA (only place this message renders — not duplicated in the grid) | — | — | — |
| Delete action | Inline spinner during removal | N/A | N/A today | Confirm → row removed → selection re-clamped per invariants table | — |
| Chat section | N/A (local only) | N/A | N/A | Expands in place, 160–200ms, respects `prefers-reduced-motion` | — |
| Pagination | `isLoading` prop already supported by shared component | Hidden entirely when `totalPages <= 1` (true for today's 4 seed records — this is intentional, not a gap: the control activates naturally once real paginated data exists) | N/A today | Page change re-clamps selection (see invariants) | — |

## User Journey

| Step | User does | User feels | Plan specifies? |
|---|---|---|---|
| 1 | Opens Jobs tab (≥1280px) | Oriented — "Nexora Community / Jobs · N tin", first listing already open | Yes |
| 2 | Scans list, clicks several listings in a row | In control — list never disappears, next item is one click away | Yes — core fix |
| 3 | Wants to reach out | Slight pause — chat is one tap away inside the pane, not a separate floating window | Yes (tradeoff explicitly chosen in design review: inline over a distinct docked mini-panel) |
| 4 | Switches to "Bài của tôi" as a brand-new poster | Invited to post, not confused by a blank pane | Yes — explicit empty-pane CTA, no auto-select |
| 5 | Deletes a listing by mistake | Safe, not anxious | Yes — confirm step (design review decision) |
| 6 | Browses past page 1 (once real data exists) | Trusts the count/position | Yes — shared `Pagination` component |

## Design System Compliance

- Cards: unchanged `shadow-nexora-card` + `border-nexoraBorder`/`bg-nexoraSurface` today's grid already uses (Variant B keeps the card grid as-is); selected card adds a ring instead. Dock: `border-nexoraBorder`, `bg-nexoraSurface`, `shadow-nexora-card`.
- Primary actions: `bg-gradient-to-r from-nexoraElectric to-nexoraViolet` (existing pattern, unchanged).
- Typography: title/description **16px minimum** (`text-base`); `text-xs`/`text-[11px]` reserved for verified-secondary metadata only.
- Colors: all values resolve through the existing `nexora*` Tailwind tokens — no new raw hex values.
- Typeface: `font-sans` (Inter) — no default `system-ui` fallback as primary.
- Motion: chat section expand/collapse 160–200ms (`grid-template-rows` transition, respects `prefers-reduced-motion: reduce` by omitting the transition class rather than shortening it). No decorative animation on the photo banner. **Not implemented** (post-implementation-review correction): a dock open/close or card-select transition — the closed (`<div>`) and open (`<aside>`) dock states are different elements that React unmounts/remounts, so a CSS transition between them is a no-op; a real one needs one persistent element with a toggled width/class instead, deferred as follow-up.
- Dimmed Filled/Closed cards: `opacity-90` + `saturate-[0.6]` — **not** `opacity-60`, which measured ~2.8:1 contrast for `nexoraMuted` text against `nexoraSurface` (well under the 4.5:1 AA minimum); `opacity-90` measures ~5.5:1 (verified by hand, see `CommunityJobDetail.tsx`'s `JobCard`).

## Accessibility

- Keyboard: cards keep today's existing pattern (`role="button" tabIndex={0}`, Enter/Space activates) — the A→B switch means no new `listbox`/`option`/roving-tabindex model is needed (that was specific to Variant A's list-column). Only genuinely new interactive surface: the dock's own contents (Edit/Status/Delete/chat-toggle), which follow the same `min-h-11`/focus-ring conventions already used in `PostJobModal`.
- Touch targets: cards (already ≥44px today) and pagination buttons ≥44px tall (`min-h-11` convention already used elsewhere in this file).
- ARIA: **Corrected** (Codex catch, still applies): `aria-live="polite"` goes on a small, separate status element that announces a concise selected-item label ("Đã chọn: {title}") when the dock opens — **not** on the whole dock, which would re-announce the full description/facts/chat on every open.
- Contrast: dimmed Filled/Closed cards must stay ≥4.5:1 for their text even at reduced opacity — verify the actual opacity value against `nexoraMuted`/`nexoraSubtle` on `nexoraSurface`, don't eyeball it (unchanged from today's existing dimmed-card treatment, if any — verify either way).
- Focus: selecting a card moves focus into the dock only on explicit activation (Enter/click), never automatically on hover or grid reflow.

## Test Review

**Baseline coverage today: 0%.** Confirmed by search — no test file references `CommunityJobDetail`, `CommunityJobsPanel`, or `communityDemoContent` anywhere under `tests/`, and no co-located `.test.tsx` exists under `src/components/community/`. This repo's convention (per `tests/unit/CommunityChatInbox.test.tsx`) is Vitest + Testing Library, `tests/unit/<Name>.test.tsx`, `vi.mock('.../CommunityAuth', ...)` to stub `useCommunityAuth`/persona, wrapped in `MemoryRouter`.

**Regression rule applies (IRON RULE — mandatory, not optional):** this diff modifies existing, currently-untested behavior (filtering, edit, status-cycle, delete, chat). Per this skill's regression rule, tests for the *existing* behavior are required as part of this change, not deferred — otherwise there is no proof the refactor didn't silently break something that already worked.

```
CODE PATHS (communityJobsReducer.ts — new, pure, extracted for testability)  USER FLOWS (CommunityJobsPanel.test.tsx)
[+] reducer                                                                  [+] Browse & select
  ├── [GAP] SET_QUERY/KIND/LOCATION/STATUS → re-clamp selection                ├── [GAP] Click row → detail pane shows that job — REGRESSION (existing filter logic, untested today)
  ├── [GAP] SET_VIEW_TAB → resets page, re-clamps (browse: first, mine: null)  ├── [GAP] Switch to "Bài của tôi" as new poster → empty-pane CTA, no auto-select
  ├── [GAP] SET_PAGE → re-clamp to first item of new page                     ├── [GAP] Filter to zero results → empty-state + "Xoá bộ lọc"
  ├── [GAP] REQUEST_DELETE/CANCEL_DELETE/CONFIRM_DELETE → selection fallback   ├── [GAP] Delete selected listing → confirm step → next item selected — REGRESSION (delete existed, untested)
  │         (next / prev / null when list empties)                            ├── [GAP] Delete the only remaining "mine" listing → empty-pane state
  └── [GAP] TOGGLE_CHAT → closed by default, toggles                          ├── [GAP] Edit and save → selection stays on same job — REGRESSION (edit existed, untested)
                                                                               ├── [GAP] Change status (cycle) → label updates per kind — REGRESSION (existed, untested)
[+] CommunityJobsPanel (component)                                           ├── [GAP] Create new post → appears first, auto-selected — REGRESSION (existed, untested)
  ├── [GAP] <1280px renders existing overlay/drawer path unchanged            ├── [GAP][→E2E] Keyboard-only: arrow through list, Enter opens, no focus yank on preview
  ├── [GAP] ≥1280px renders split-view path                                  └── [GAP] Non-owner viewer sees Message action, not manage actions — REGRESSION (existed, untested)
  └── [GAP] Guest/anonymous persona sees no post button (existing, untested)  [+] Responsive
                                                                                 └── [GAP][→E2E] 1023px vs 1024px vs 1279px vs 1280px — confirms the tier boundary from "Where the Split-View Lives" actually renders correctly, not just in theory
COVERAGE: 0/19 paths tested (0%)  |  Code paths: 0/8  |  User flows: 0/11
QUALITY: (none yet)  |  GAPS: 19 (7 flagged REGRESSION, 2 →E2E)
```

Legend: ★★★ behavior + edge + error | ★★ happy path | ★ smoke check | [→E2E] needs integration/E2E test, not just unit

**Test plan:**
1. Extract the reducer to `src/components/community/communityJobsReducer.ts` as a pure function — makes every transition in the invariants table above independently unit-testable without rendering React at all.
2. `tests/unit/communityJobsReducer.test.ts` — one `it()` per reducer action/invariant row above (11 cases).
3. `tests/unit/CommunityJobsPanel.test.tsx` — one `it()` per user-flow row above (11 cases, 2 marked `[→E2E]` since they cross the responsive-breakpoint or full-keyboard-journey boundary that a jsdom unit test can't faithfully exercise — those two should additionally get a Playwright/E2E case per `pnpm test:e2e`, not just the unit test).
4. All 7 `REGRESSION`-flagged rows are existing behavior with zero current coverage — write these test-first, verify they pass against **today's** code before touching implementation, so a later failure unambiguously means the redesign broke something (not that the test was wrong).

## Performance Review

No blocking issues. All filtering/pagination is in-memory over a small array (today: 4 records; even once real data lands, list rendering will be page-sized, not the full set). No N+1 patterns, no new caching need, no new dependencies. Forward-looking note (not a blocking finding — already covered by "NOT in scope"): client-side `.filter()` over the full array is a fine stand-in today but won't scale to hundreds of real Nailhub-backed listings; that's explicitly deferred to the real-API pagination work, not something to solve in this redesign.

## NOT in Scope (explicitly deferred, with rationale)

| Deferred | Rationale |
|---|---|
| Real backend integration (Nailhub.ai) | Tracked separately in the 2026-09-21 engineering spec; this redesign prepares the UI shape (pagination slot, status-set headroom) to receive that data later — it does not model the future `PendingApproval`/`Rejected` states in the UI today. |
| Mobile/tablet (`<1280px`) **detail/chat** experience | The drawer/chat-dialog presentation itself already works today and stays untouched — this is what "not a target" actually refers to. **Narrowed during the second review round**: the status filter, "Bài của tôi" tab, and the mine-empty CTA ended up applying at *all* widths (not gated to `≥1280px`), and persona-switch now closes the mobile chat dock too. Accepted as intentional, not scope creep — these are cross-cutting filter/state features the "Why" section never scoped as desktop-only; only the detail/chat *presentation* (drawer vs. dock) stays tier-gated. |
| The AI description assistant ("Write with AI") | Unaffected by this layout change. |
| Loading skeletons for list/detail | No real async data source yet; spec is written above so real-data implementation has a target. |
| Undo-after-delete (vs. a confirm step) | Confirm step alone judged sufficient for the misclick risk (design review decision); true undo (toast-with-undo) deferred as a follow-up if the confirm step proves insufficient in practice. |
| Modeling future backend statuses (`PendingApproval`, `Rejected`) in the UI | The row layout leaves visual headroom for more statuses later; it does not implement them now — `DemoJob['status']` stays `open \| filled \| closed`. |

## What Already Exists (reuse, don't rebuild)

- `src/components/ui/Pagination.tsx` — `variant="simple"` fits the list-column footer exactly, **unmodified** (see correction above).
- `.nexora-card` / `shadow-nexora-card` pattern — reused for the detail pane and workspace header, deliberately **not** applied to list rows.
- Existing badge helpers `postKindLabel`, `postKindBadgeClassName`, `statusLabel` in `CommunityJobDetail.tsx` — reused as-is, re-composed into the stricter row hierarchy.
- Existing `min-h-11` / `focus-visible:ring-2 focus-visible:ring-nexoraBrand` conventions from `PostJobModal` — carried into new list/pagination controls.
- `useCommunityAuth` / `useCurrentPersona` — unchanged, still the source of `myPostKind`/`isOwn`.
- `JobChatDock` — unchanged, reused as-is for `<1280px` (see correction above — not removed).

## Worktree Parallelization Strategy

Sequential implementation, no parallelization opportunity. `CommunityScreens.tsx`'s container change and `CommunityJobDetail.tsx`'s split-view are tightly coupled — the split-view is visually broken without the container fix landing first, and the container fix has no independent value without the split-view consuming the extra width. Single lane: container fix → reducer extraction + tests → split-view UI → accessibility/motion polish.

## Implementation Tasks

- [ ] **T1 (P1, human: ~30min / CC: ~10min)** — layout — Widen Jobs' container: make `CommunityHome`'s inner `max-w-[680px]` wrapper and the `CommunityRightRail` sibling conditional on `currentTab !== 'jobs'`
  - Surfaced by: Codex outside-voice finding (container width infeasibility)
  - Files: `src/components/community/CommunityScreens.tsx`
  - Verify: Feed/Groups/etc. render pixel-identical to today; Jobs tab gets full `1040px` frame at `lg:`+
- [ ] **T2 (P1, human: ~30min / CC: ~10min)** — state — Extract `communityJobsReducer.ts`, consolidating the 3 existing `useState` calls + new fields per the State Model section
  - Surfaced by: code-quality decision (single reducer over independent useState)
  - Files: `src/components/community/communityJobsReducer.ts` (new)
- [ ] **T3 (P1, human: ~1h / CC: ~15min)** — tests — Write `tests/unit/communityJobsReducer.test.ts` (11 cases) and the regression-flagged half of `tests/unit/CommunityJobsPanel.test.tsx` **before** touching the component, run green against today's code
  - Surfaced by: Test Review (7 REGRESSION-flagged gaps, IRON RULE)
  - Files: `tests/unit/communityJobsReducer.test.ts`, `tests/unit/CommunityJobsPanel.test.tsx`
- [ ] **T4 (P1, human: ~3h / CC: ~30min)** — layout — Build the `≥1280px` split-view shell (list column + detail pane) as a new responsive branch, gated behind `xl:`, `<1280px` markup untouched
  - Surfaced by: "Where the Split-View Lives"
  - Files: `src/components/community/CommunityJobDetail.tsx`
  - Verify: manual check at 1023px/1024px/1279px/1280px per the tier table
- [ ] **T5 (P1, human: ~1h / CC: ~10min)** — list-row — Rewrite the list item as a row: drop `shadow-nexora-card`, divider + hover/selected tint, max-2-chip / fixed-trailing-salary hierarchy, 16px title minimum
  - Files: `src/components/community/CommunityJobDetail.tsx`
- [ ] **T6 (P1, human: ~30min / CC: ~10min)** — filters — Status filter defaulting to `all`; "Bài của tôi" tab that does not auto-select
  - Files: `src/components/community/CommunityJobDetail.tsx`
- [ ] **T7 (P1, human: ~30min / CC: ~10min)** — pagination — Wire the existing `Pagination` (`variant="simple"`), unmodified, under the list column
  - Files: `src/components/community/CommunityJobDetail.tsx`
- [ ] **T8 (P1, human: ~1h / CC: ~15min)** — chat — Add the new inline collapsible chat section to the split-view detail pane (`≥1280px` only); `JobChatDock` stays unchanged for `<1280px`
  - Files: `src/components/community/CommunityJobDetail.tsx`
- [ ] **T9 (P2, human: ~30min / CC: ~10min)** — delete — Route delete through `REQUEST_DELETE`/inline confirm/`CONFIRM_DELETE`
  - Files: `src/components/community/CommunityJobDetail.tsx`
- [ ] **T10 (P2, human: ~20min / CC: ~5min)** — identity — Add the workspace header ("Nexora Community / Jobs" + result count)
  - Files: `src/components/community/CommunityJobDetail.tsx`
- [ ] **T11 (P2, human: ~30min / CC: ~10min)** — motion + a11y — Transitions (120–160ms select, 160–200ms chat) respecting `prefers-reduced-motion`; `role="listbox"`/`option`, roving tabindex, narrow `aria-live` status element (not whole-pane)
  - Files: `src/components/community/CommunityJobDetail.tsx`
- [ ] **T12 (P2, human: ~1h / CC: ~15min)** — tests — Remaining (non-regression) unit tests + the 2 `[→E2E]` cases in `pnpm test:e2e`
  - Files: `tests/unit/CommunityJobsPanel.test.tsx`, e2e suite
- [ ] **T13 (P3, follow-up)** — Loading skeletons for list/detail once real API data lands (Nailhub.ai integration)
  - Files: `src/components/community/CommunityJobDetail.tsx` (future, blocked on backend work)

## Approved Mockups

| Screen/Section | Mockup Path | Direction | Notes |
|----------------|-------------|-----------|-------|
| Community Jobs — desktop layout | `~/.gstack/projects/SotaThao-nexora/designs/community-jobs-layout-20260922/design-board.html` (interactive, 3 variants A/B/C) | Variant A — Inbox split-view, chosen | The gstack AI mockup generator (`$D`) was unavailable (no OpenAI key configured); hand-built as real HTML using actual `nexora*` Tailwind tokens and real sample data, verified interactive in-browser. The mockup's illustrative desktop-only view predates the container-width correction below — the widths in "Where the Split-View Lives" are the authoritative numbers, not the mockup's. |

## Unresolved Decisions

_None. The design-review stage resolved 2 judgment calls (delete confirmation, chat placement) via AskUserQuestion. The eng-review stage resolved 1 more (state consolidation into a reducer) and surfaced 1 load-bearing correction (container width) that was itself resolved via AskUserQuestion (widen Jobs' own container). All remaining findings from both this review and the Codex outside-voice pass had an objective fix (code-verified, or a direct contradiction with this repo's own documented behavior/rules) and were applied directly._

## Completion Summary

```
+====================================================================+
|         ENG PLAN REVIEW — COMPLETION SUMMARY                       |
+====================================================================+
| Step 0 (Scope Challenge) | Accepted as-is — single component,      |
|                           | 0 new services, reuses 5+ existing      |
|                           | pieces; grew to 2 files (+ tests) only  |
|                           | after the container-width correction    |
| Architecture Review      | 1 critical issue found (container width |
|                           | infeasible as scoped) — resolved via    |
|                           | AskUserQuestion, now fully re-verified  |
| Code Quality Review      | 1 issue found (7 independent useState)  |
|                           | — resolved via AskUserQuestion          |
| Test Review              | diagram produced, 19 gaps (7 REGRESSION,|
|                           | 2 →E2E) — all added to Implementation   |
|                           | Tasks, regression tests are mandatory   |
|                           | (IRON RULE) and sequenced first (T3)    |
| Performance Review       | 0 blocking issues                       |
| NOT in scope             | written (6 items)                       |
| What already exists      | written (6 items)                       |
| TODOS.md updates         | N/A — no TODOS.md convention in this    |
|                           | repo; deferred item (T13) captured in   |
|                           | Implementation Tasks instead            |
| Failure modes             | 0 critical gaps — no new network/async  |
|                            | codepaths introduced (client-only)      |
| Outside voice              | ran (Codex) — 11 findings, 1 load-      |
|                             | bearing (container width), rest        |
|                             | incorporated directly as corrections    |
| Parallelization             | sequential, 1 lane (see rationale above)|
| Lake Score                 | 2/2 completeness-vs-shortcut decisions  |
|                             | chose the complete option (reducer;     |
|                             | regression tests written, not deferred) |
+====================================================================+
```

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | not run — no scope/strategy gap survived the eng review's container-width correction + your explicit "widen Jobs' own container" decision |
| Codex Review | `/codex review` | Independent 2nd opinion | 2 | issues_found → resolved | Design-stage pass: 7 findings + 1 hard-rejection, incorporated. Eng-stage pass: 11 findings, most load-bearing was the container-width infeasibility (resolved via AskUserQuestion + full re-verification against `CommunityScreens.tsx`); remaining 10 incorporated directly (reducer shape, selection invariants, chat contradiction, aria-live scope, Pagination reuse correction, status-modeling wording) |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | clean | 0 unresolved, 19 test gaps identified and sequenced (7 mandatory regression tests first), 2 decisions made via AskUserQuestion |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | issues_found → resolved | 4/10 → 8.5/10, 8 decisions made |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | not run |

- **CODEX:** Two separate passes. Design-stage: hard-rejection on missing product identity + 7 findings (top bar overload, open-only-default contradicting Business Rule 4, badge crowding, row/card shadow contradiction, typography, token specificity, no motion policy) — all incorporated in the design-review round. Eng-stage: the single most consequential finding of this entire review chain — that `CommunityJobsPanel` is hard-capped at 680px, not the 1040px this plan had assumed even after one prior correction — plus 10 supporting findings (reducer shape undefined, selection invariants missing, chat "removed" self-contradicted "mobile unchanged," aria-live scope too broad, Pagination reuse claim needed verification, status-modeling wording ambiguous, no test strategy yet, and a fair strategic challenge on whether this is overbuilt for a 4-record demo).
- **CROSS-MODEL:** The Claude subagent (design-review stage) and Codex (both stages) never directly disagreed — each found real issues the other missed. Notably, Codex's eng-stage container-width finding directly *overturned* a "fix" that the design-review stage — informed by a different Claude subagent — had verified and approved. That earlier verification was real (it correctly found the outer `1040px` frame and the 288px sidebar) but incomplete (it didn't trace the inner `680px` wrapper). This is recorded here rather than smoothed over: two independent AI reviewers plus this session's own direct code reads were needed across three passes to get the container math right. Treat any single review's "verified" claim about this codebase's layout as provisional until an outside voice has had a chance at it.
- **VERDICT:** DESIGN + ENG REVIEW CLEARED (design 8.5/10, eng 0 unresolved). Ready to implement, sequenced T1→T13 above, tests-first for the 7 regression-flagged paths (T3 before T4-T11).

NO UNRESOLVED DECISIONS

# TODOS

## Community — i18n for existing strings

- **What:** Move the hardcoded Vietnamese copy in `src/components/community/*.tsx` (11 of 12 files don't call `useTranslation`) into `src/locales/vi.json` / `en.json`.
- **Why:** When the app is in EN, Community still shows Vietnamese while shared components (`Pagination` → `t('common.back')`) show English, so a single screen mixes languages (E2E evidence 2026-09-24 `desktop/02`: "BACK / NEXT / Page 1 of 2" among Vietnamese UI).
- **Pros:** Consistent with the app's language; Community can serve English-speaking salons.
- **Cons:** Many files, needs English copy.
- **Context:** Plan `docs/community-jobs-ui-improvement-plan.md` (eng review 2026-09-24) decided: new strings in PR1/PR2 already go through `t()`; this item only covers old strings. Pagination was deliberately left unchanged (T11 dropped).
- **Depends on:** After PR2 of the Jobs plan.

## E2E — broken `test:e2e` script

- **What:** `package.json` `test:e2e` runs `scripts/run-e2e.cjs`, which isn't in the repo (`scripts/` is gitignored); `vitest.e2e.config.ts` includes `tests/e2e/**`, which doesn't exist.
- **Why:** The official command fails, so people think E2E exists when it doesn't. Community Jobs E2E currently runs as an evidence gate via `/e2e-setup` + `/evidence` (local kit `.e2e/flow.mjs`), not in CI.
- **Pros:** A real regression gate on clean checkout / CI.
- **Cons:** Need to decide: build tracked Playwright under `tests/e2e/` (+ dev-server lifecycle) or remove the dead script/config.
- **Context:** Flow JSON for Jobs is committed at `docs/e2e-flows/` (Jobs plan, decision 4A) and can be ported to tracked Playwright later.
- **Depends on:** —

## Community Jobs — result count for the filter sheet

- **What:** The "Xem N tin" button in the mobile filter sheet (D4) computes N with in-memory `filterJobsForState`. When the real API (Nailhub.ai) lands, N needs a count endpoint, or fall back to a "Xem kết quả" button without a number.
- **Why:** Avoid fetching the full list every time the user taps a chip in the sheet.
- **Pros:** Keeps the "you'll see N results" UX without loading all the data.
- **Cons:** Needs backend work.
- **Context:** `docs/community-jobs-ui-improvement-plan.md` T4 + NOT in scope.
- **Depends on:** Wiring the real API (plan T14).

## Community Jobs — real data for tech AI

- **What:** Replace the `techJobsData.ts` mock (Jobs plan T2) with a real data source for tech skills + location.
- **Why:** Tech AI is back in scope (2026-09-24) but D11 (data source) is still waiting on PO.
- **Depends on:** PO decides D11.

## Community Jobs — feedback after post/delete

- **What:** Delete the open post → back to grid + toast "Đã xoá tin"; post → toast "Đã đăng tin" + "Tin của bạn" label.
- **Why:** Today deleting silently opens the next post (surprising). Deferred by the scope cut because it changes behavior.
- **Pros:** Clear feedback, users don't mistake it for opening the wrong post.
- **Cons:** Changes existing behavior; must update the `CONFIRM_DELETE` regression test.
- **Context:** Reuse `useNotification().showToast` (`src/contexts/NotificationContext.tsx:37`); don't write a new toast.
- **Depends on:** Jobs plan PR1 (URL owns `job`).

## Community Jobs — "Đã liên hệ" contact history lives on Supabase (decide before the BFF lands)

- **What:** Built 2026-09-24 (US-113). Table `public.community_job_contacts` (migration 0012 applied by the user 2026-09-24; 0013 — server-side timestamps + tightened grants — must be applied after it) stores `(user_id, job_id text, channel_id → channels, first/last_contacted_at)`. A row is written only when "Nhắn tin" from a job detail successfully opens a real DM. No post content is stored.
- **Why this needs a decision:** US-113 (2026-09-22) moves Jobs to a Nexora BFF (`api.nexoratouch.com`) + `community_job_posting_owner`, while this table sits next to the DM channels on Supabase. Do NOT create a second contacts table on the BE without reading this one first.
- **Costs when the BFF lands (from the GATE 0b review):**
  - (a) Identity: rows are keyed by the Supabase user uid; the BFF uses Nexora JWTs. Moving the table needs a Supabase uid ↔ Nexora user mapping, and `channel_id` becomes a cross-DB loose reference.
  - (b) Client-side join: the tab filters the jobs already loaded in the page. With BFF pagination, contacted posts outside the current page — or closed/removed posts Nailhub no longer returns — disappear. The BFF needs a "get postings by id list" endpoint.
  - (c) Orphans: seed ids `j1…j18` will not match Nailhub posting ids; clear the table (or prefix ids) when switching to real data.
- **Open follow-ups:**
  - F2: the poster's DM target is resolved by `displayName` (not unique, user-editable) → resolve by a stable profile UUID (`posterChatUserId` from the BFF) before real accounts use it.
  - F5 (PO): persona Linh (guest) can still message posters, so contact rows are written for Linh even though the tab is hidden for guests.
  - Run the RLS SQL checks from plan R3 on the live project: A cannot read/update/delete B's rows, cannot insert with `user_id = B`, cannot point at a channel A is not in; anonymous cannot select/insert; a double upsert keeps `first_contacted_at`.

## Community Jobs — real messaging instead of demo chat

- **What:** "Nhắn tin" in Jobs is currently demo local chat (`InlineChatSection`, `CommunityJobDetail.tsx:515`). Switch to the real DM system: `useFindOrCreateDirectChannel(posterUserId)` → `/community/chat/dm/:id` (mobile) / `dock.openDirectChat` (desktop).
- **Why:** The real DM system (Supabase) already exists but Jobs doesn't use it because demo job posters have no user id (`CommunityJobDetail.tsx:18-20`).
- **Depends on:** Jobs have a real `posterUserId` (wiring Nailhub API, T14).

## Community Jobs — bugs from QA 2026-09-24 (deferred, report-only QA)

Source: `.e2e/out/qa-20260924/qa-report-localhost-2026-09-24.md` (health 92/100).

- **ISSUE-004 (medium, visual):** the card meta line `salon · khu vực · thời gian` is `truncate`d on mobile ("Luxury Nails & ... · Houston,..."), losing location/time. Fix: salon on one line, location · time on the next (wrap), or truncate only the salon. Evidence `mobile-*-01-list.png`, `tablet-landscape-linh-01-list.png`.
- **ISSUE-005 (low, data):** "Bài của tôi" is empty for every demo persona (seed `ownerPersonaId: null`), so the "own closed posts" rule can't be demoed. Fix: add 1 open + 1 filled/closed seed post for Kayla and Jessica.
- **ISSUE-006 (low, a11y):** the active filter chip "Dallas, TX ✕" has no remove label. Fix: `aria-label="Bỏ lọc <khu vực>"`.
- **ISSUE-008 (low, outside Jobs):** switching persona aborts 2× `HEAD /rest/v1/notifications` (ERR_ABORTED); navigating right after logs `TypeError: Failed to fetch` from supabase-js. Check abort/catch in the notifications provider.
- Known and tracked elsewhere: ISSUE-001 (mobile first view, PR1 `view`), ISSUE-002 (Back leaves Community, PR1 `?job=`), ISSUE-003 (AI dead end, permissions `/dispatch`), ISSUE-007 (persona hint wraps), ISSUE-009 (Demo Hub, separate task).

## Map poster contact (phone/email) from the Nailhub API
- **What:** The Jobs detail contact card shows `contactPhone`/`contactEmail` for posters without a Nexora account. Today these are mock seed values (555 numbers, example.com) in `communityDemoContent.ts`.
- **Why:** The user decided (2026-09-24) that no-account posters show phone + email, visible to every viewer (guests included), sourced from Nailhub.ai.
- **Depends on:** Nailhub API wiring (T14). The Nailhub field names are not confirmed; ask BE before mapping.

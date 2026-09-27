# L1b — M05 Tin nhắn, Gọi & Riêng tư (notes)

Owner stream: L1b. Code: `src/prototype/community-v2/modules/m05-messages/**`, `store/{types,seed,slices}/m05.ts`.

## Routes → components

| Screen | Path | Component |
|---|---|---|
| S05-01 | `/community-v2/messages` | `InboxLayout` (2 cột / mobile list) |
| S05-02 | `/community-v2/messages/:threadId` | `InboxLayout` → `ChatRoom` (mobile: full-screen overlay + back) |
| contract 3 | `/community-v2/messages/new?to=<personId>` | `NewDm` (`screens.tsx`), qua S05-02 |
| S05-03 | `/community-v2/messages/requests/:threadId` | `RequestRoom` (no composer / no call buttons) |
| S05-04 | `/community-v2/messages/salon` | POS group of the viewer, members panel (xl) / sheet |
| S05-05 | `/community-v2/messages/community` | `GroupDiscovery` |
| S05-06 | `/community-v2/messages/find?q=` | `FindPeople` + `peopleSearch.ts` (detection rules) |
| S05-07/08 | `/community-v2/calls/:callId[/video]` | `CallScreen` |
| S05-09 | `/community-v2/calls/incoming` | `IncomingCall` |
| S05-10 | `/community-v2/calls` | `CallHistory` |
| S05-11 | `/community-v2/calls/group/:callId` | `GroupCall` |
| S05-12 | `/community-v2/privacy` | `PrivacyScreen` |
| S05-13 | `/community-v2/id` | `IdCard` |

## State (M05State)

- `threads` (DM / POS group / public group, `request` = pending "Lời mời nhắn tin"), `calls` (history
  rows per `ownerId`),
  `privacy` (seed value lives in `seed/m00.ts`, type in `types/m05.ts`), `blockedUserIds`.
- Optional runtime keys not in the L0 seed object: `activeCall`, `incomingCall`, `nicknames` (undefined = empty).

## Decisions / assumptions

- "Bạn bè" for DM creation = shares any group chat → DM opens connected; otherwise the DM is created as a request
  with the verbatim system line. (Doc 05 open question #2.)
- Phone search for other people: flag `phone:contacts` / default "Danh bạ" → only mock contact pairs
  (`peopleSearch.ts`); email search never matches (default "Không ai").
- Group call "Tham gia" joins with the call's own type (doc exception "bản mẫu luôn vào thoại — sửa").
- `call.incoming` is subscribed at module load in `index.ts` and routes via History API + popstate, because the shell
  does not mount module listeners. Caller = Kayla (or Jessica when viewing as Kayla). If "Ai được gọi" =
  "Không ai",
  the call becomes a missed call + verbatim 📵 toast.

## Shared-file issues found (not changed — L0 owns them)

1. `ToastProvider` is never mounted (shell/router), so `useToast()` is a no-op app-wide. M05 uses
  `modules/m05-messages/toast.tsx`,
   which calls the shared API and renders a fallback layer only when the shared container is absent — once L0 mounts
   `ToastProvider` the fallback goes silent automatically.
2. `DemoBar` shows the toast "Chưa có màn — stream khác sẽ nối" after "Có cuộc gọi đến" —
  M05 now handles the event.
3. Shell header title uses exact path match, so parametrised M05 routes show "Community".
4. Mobile bottom nav has no "Tin nhắn" item (first 5 modules + "Thêm" → messages).

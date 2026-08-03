# US-012 · Cầu nối tài khoản thật (Owner/Staff) với Community chat (Supabase)

> File: `US-012-staff-chat-auth-bridge.md` · 1 file = 1 story. ID tăng dần, duy nhất toàn repo.
> ⚠️ ID `012` được cấp cục bộ trong worktree này (US mới nhất thấy được là US-011). Xác nhận lại với `main` trước khi merge để tránh trùng ID với US đã tạo ở nhánh khác.

| | |
|---|---|
| **Trạng thái** | Draft |
| **Ngày tạo** | 2026-08-03 |
| **Epic / Domain** | Staff Management × Community |
| **OpenSpec change** | **CHƯA CÓ** — research-only; phải tạo OpenSpec change riêng và được duyệt trước khi code vì đụng auth/shared layer |
| **Test plan** | Research verification: trace file:line, đối chiếu API snapshot + live Swagger, kiểm tra diff scope; test integration sẽ được viết sau khi BE chốt contract |

## Bối cảnh (vì sao cần story này)

Owner Dashboard thật (`/dashboard/staff`) muốn có nút "Chat" mở cuộc trò chuyện 1:1 thật với một nhân viên cụ thể, tái dùng hạ tầng Direct Message của module Community (`src/data/repositories/community/directMessages.ts`, `src/data/hooks/useDirectMessages.ts`, `src/components/community/CommunityChatDock.tsx`).

### Kết quả audit code ngày 2026-08-03

Mô tả "hai hệ auth tách biệt, chưa có bridge" là **đúng về bản chất**, nhưng bản nháp ban đầu thiếu phiên Supabase anonymous, mô tả chưa chính xác các ID REST, và suy diễn quá mức từ comment của demo shell.

| | Auth thật (Owner/Staff) | Community |
|---|---|---|
| Provider / adapter | `AuthProvider` bọc toàn app và dùng `apiAuthAdapter` (`src/main.tsx:17-32`, `src/auth/AuthProvider.tsx:29-42`). | `CommunityAuthProvider` chỉ được mount bên trong `CommunityRouteRoot` (`src/components/community/CommunityScreens.tsx:513-536`). |
| Cơ chế | Login gọi `POST /api/v1/authentication/signin`, lưu access/refresh token (`src/auth/adapters/apiAuthAdapter.ts:324-339`); `httpClient` tự gắn Bearer token và refresh/retry khi 401 (`src/lib/httpClient.ts:54-70`, `src/lib/httpClient.ts:180-190`). | Khôi phục Supabase session đã lưu; nếu chưa có thì tự `signInAnonymously` (`src/components/community/CommunityAuth.tsx:50-85`). Persona Jessica/Kayla/Linh mới dùng `signInWithPassword` (`src/components/community/CommunityAuth.tsx:29-48`, `src/components/community/CommunityAuth.tsx:112-123`). |
| Định danh | Principal đăng nhập trong `AuthSession.id` là `UserProfile.id`; riêng `staffId` hiện ưu tiên `staffCode`, rồi mới fallback qua các field profile (`src/auth/adapters/apiAuthAdapter.ts:242-254`). Danh sách staff của Owner lại có `linkId`, `staffProfileId` nullable và `staffCode` nullable — đây là các ID khác nhau (`src/types/repositories.ts:226-260`, `src/data/repositories/merchantStaff.ts:108-117`). | `public.profiles.id` là UUID đồng thời FK đến `auth.users.id` (`supabase/migrations/0002_community_schema.sql:1-8`); trigger tạo profile khi có `auth.users` mới (`supabase/migrations/0003_profile_and_integrity_triggers.sql:1-26`). |
| Phạm vi UI hiện tại | `/dashboard` và `/staff` được bảo vệ theo role thật (`src/app/AppRouter.tsx:286-306`, `src/app/AppRouter.tsx:322-342`). | Route tree `/community/*` là nơi mount Community provider và các màn chat (`src/app/AppRouter.tsx:259-267`, `src/components/community/CommunityScreens.tsx:513-536`). |

Direct Message hiện phụ thuộc hoàn toàn vào Supabase identity của caller:

- Hook chỉ bật query khi Community auth đã sẵn sàng và user không anonymous (`src/data/hooks/useDirectMessages.ts:10-20`). Repository lấy caller bằng `supabaseClient.auth.getUser()` rồi gọi RPC `find_or_create_direct_channel(p_other_user_id)` (`src/data/repositories/community/directMessages.ts:60-64`, `src/data/repositories/community/directMessages.ts:106-116`).
- RPC từ chối anonymous/self-DM, yêu cầu target đã tồn tại trong `profiles`, rồi canonicalize cặp UUID và tạo hai participant (`supabase/migrations/0010_direct_messages.sql:134-189`). RLS chỉ cho participant đọc/gửi tin (`supabase/migrations/0010_direct_messages.sql:53-107`). Realtime subscribe theo `channel_id` (`src/data/hooks/useCommunityChat.ts:178-206`).
- `CommunityChatDockProvider` cũng chỉ nằm dưới Community route; renderer hiện trả `null` nếu pathname khác chính xác `/community` (`src/components/community/CommunityScreens.tsx:535-536`, `src/components/community/CommunityChatDock.tsx:592-609`). Vì vậy nút ở `/dashboard/staff` **không thể chỉ gọi dock hiện tại**; implementation sau này phải quyết định điều hướng sang Community hoặc nâng provider/renderer lên shell dùng chung.
- Persona switch làm `queryClient.clear()` vì RLS đổi theo Supabase JWT (`src/components/community/CommunityAuth.tsx:88-97`). App chỉ có một `QueryClientProvider` dùng chung (`src/main.tsx:17-34`), nên bridge phải tránh làm lẫn session/cache REST khi đổi identity.

Comment demo shell chỉ chứng minh production shell phụ thuộc auth/query/router state (`src/components/community/demo/DemoMerchantShell.tsx:76-82`, `src/components/community/demo/DemoStaffShell.tsx:58-64`); nó **không đủ bằng chứng** để kết luận quyết định tách identity là chủ đích sản phẩm.

Kết luận chính xác là: repo không có mapping xác định từ REST principal/staff profile sang Supabase UUID và cũng không có cách đổi REST JWT thành quyền Supabase của đúng user. Một real user có thể tình cờ đã có Supabase account, nhưng code hiện tại không thể chứng minh hoặc liên kết hai account đó. Cả Owner (caller) và Staff (target) đều cần identity link; chỉ map target là chưa đủ.

## Story

**Là** Business Owner đang xem danh sách nhân viên thật ở `/dashboard/staff`,
**tôi muốn** bấm "Chat" trên 1 nhân viên và mở đúng cuộc trò chuyện 1:1 thật với người đó (không phải persona demo),
**để** liên hệ nhanh với nhân viên ngay trong app, không cần rời sang SMS/gọi ngoài.

## Việc cần Codex làm trong story này (giai đoạn research/spec, KHÔNG code)

1. Xác nhận lại kiến trúc auth ở trên còn đúng không (đọc `apiAuthAdapter.ts`, `CommunityAuth.tsx`, `directMessages.ts`, `useDirectMessages.ts`) — sửa phần Bối cảnh nếu tìm ra khác.
2. Đề xuất **≥2 phương án bắc cầu**, mỗi phương án nêu rõ: cần BE làm gì mới (endpoint/migration), rủi ro bảo mật (JWT giả mạo, leak Supabase service key...), effort ước lượng. Gợi ý hướng cần khảo sát (không giới hạn):
   - BE mint Supabase custom JWT cho user thật đã đăng nhập (Supabase Admin API `auth.admin.generateLink` / custom claims) → FE dùng token đó gọi `supabaseClient.auth.setSession(...)`.
   - BE lưu `community_user_id` (uuid Supabase) trên bản ghi merchant/staff thật, cấp qua 1 endpoint mới `GET /api/v1/.../community-identity` để FE map real-id ↔ Supabase-id mà KHÔNG cần đổi cơ chế đăng nhập.
   - Supabase RLS/service-role edge function nhận JWT thật (REST) làm input, tự verify rồi trả về Supabase session — cần BE có quyền gọi Supabase Admin.
3. Với mỗi phương án, điền **API Mapping** bên dưới (kể cả nếu endpoint chưa tồn tại — đánh dấu nguồn `(S)` = spec/đề xuất, ghi rõ "CHƯA CÓ, cần BE tạo mới").
4. Liệt kê đầy đủ **"cần hỏi BE"** — không tự đoán field/behavior.
5. Đề xuất phương án khuyến nghị (1 trong các phương án trên) kèm lý do.

## Các phương án bắc cầu

### Ràng buộc chung cho mọi phương án

1. Bridge phải giải quyết **hai việc độc lập**: (a) caller Owner/Staff có credential được Supabase/RLS chấp nhận; (b) staff target có `community_user_id` tồn tại và được caller lấy sau kiểm tra quyền.
2. Actor phải được BE suy ra từ REST JWT đã verify; không nhận `userId` của caller từ FE. Target staff phải được kiểm tra thuộc business mà Owner được phép quản lý để tránh IDOR.
3. Cần một crosswalk bền vững, unique và idempotent giữa REST principal chuẩn với Supabase `auth.users.id`; không link chỉ bằng email/phone. Tên bảng/cột và cardinality **chưa có contract, cần BE chốt**.
4. Supabase secret/service-role chỉ được giữ ở backend/Edge Function, không được trả cho FE, ghi log hoặc đưa vào `VITE_*`. Client hiện chỉ dùng anon key (`src/lib/supabaseClient.ts:3-17`).
5. Logout, đổi real account, disable account, unlink staff, refresh/expiry và multi-tab phải có quy tắc đồng bộ hai session; nếu không sẽ có "session confusion" (REST user A nhưng Supabase user B).

### PA1 — Nexora BE làm session broker bằng Supabase Auth one-time exchange (**khuyến nghị**)

**Luồng đề xuất:** FE gọi một capability mới bằng REST Bearer token. Nexora BE tự xác định principal, idempotently lookup/tạo Supabase auth user bằng Admin API, lưu crosswalk; trigger hiện tại tự tạo `profiles` (`supabase/migrations/0003_profile_and_integrity_triggers.sql:8-26`). BE tạo một credential đăng nhập một lần bằng Supabase Admin `generateLink`; FE đổi credential đó qua `supabaseClient.auth.verifyOtp(...)` để nhận Supabase `Session`. Exact request/response field của endpoint Nexora và exact OTP type phải được spike/chốt với BE, không ghi đoán trong story. Xem [Supabase `generateLink`](https://supabase.com/docs/reference/javascript/auth-admin-generatelink) và [`verifyOtp`](https://supabase.com/docs/reference/javascript/auth-verifyotp).

BE đồng thời cần capability resolve/provision identity của staff target sau khi xác minh quan hệ Owner ↔ business ↔ staff. Khi có target UUID, FE tái dùng RPC hiện tại (`src/data/repositories/community/directMessages.ts:108-116`).

**Backend/migration mới:**

- Migration crosswalk REST principal ↔ Supabase UUID với unique constraints, audit timestamps và trạng thái lifecycle; không chốt tên field khi chưa có BE contract.
- Capability bootstrap/exchange session cho **current principal** và capability resolve/provision **authorized staff target**; có thể là một hoặc hai endpoint, route/method/DTO chưa tồn tại.
- Supabase Admin client chạy server-side; secret management, rotation, redacted logging, idempotency, rate limit và audit trail.
- Quy tắc disable/delete/unlink và reconciliation cho account Supabase/crosswalk bị orphan.

**Rủi ro bảo mật/vận hành:** one-time credential bị log/replay; email collision nếu provision sai; service-role leak sẽ bypass RLS; hai refresh lifecycle lệch nhau; endpoint target bị IDOR; auto-provision bị spam. Cần TTL ngắn, single-use, không đưa credential vào URL/log, derive actor từ JWT và revoke/clear Supabase session khi real session kết thúc. Current DM còn có TODO rate-limit/block-list (`supabase/migrations/0010_direct_messages.sql:133-134`) và directory mở cho mọi non-anonymous user (`supabase/migrations/0010_direct_messages.sql:109-127`), phải được Product/Security chấp thuận hoặc harden trước production.

**Effort thô:** BE 5–8 ngày, FE 3–5 ngày, migration/security/QA 3–5 ngày; tổng khoảng **11–18 person-days** sau khi contract được chốt.

### PA2 — Nexora BE mint Supabase-compatible custom JWT; FE dùng `accessToken` callback

**Luồng đề xuất:** BE provision/crosswalk shadow Supabase user như PA1, nhưng thay one-time Auth exchange bằng một JWT ngắn hạn do BE ký, có subject là đúng Community UUID và claims Supabase/RLS yêu cầu. FE cấp JWT đó cho Supabase client qua `createClient(..., { accessToken: async () => ... })`; REST token refresh vẫn thuộc `httpClient`, còn custom JWT được xin lại từ BE khi sắp hết hạn. Supabase mô tả custom/third-party JWT qua `accessToken` trong [JWT guide](https://supabase.com/docs/guides/auth/jwts).

**Sửa một nhầm lẫn trong gợi ý ban đầu:** custom JWT không nên đưa thẳng vào `supabaseClient.auth.setSession(...)`; [`setSession`](https://supabase.com/docs/reference/javascript/auth-setsession) yêu cầu tối thiểu cả Supabase access token và refresh token. `generateLink → verifyOtp → Session` là PA1; `custom JWT → accessToken callback` là PA2.

**Backend/migration mới:**

- Cùng crosswalk/provisioning và target-identity capability như PA1.
- Capability mint JWT ngắn hạn cho current principal; BE/Supabase team phải cấu hình/import signing key tương thích, chốt `iss/aud/sub/role`, algorithm allowlist, `kid`, rotation và TTL.
- FE auth adapter/provider riêng cho production Community credential; không trộn custom JWT với demo Supabase session đang persisted.

**Rủi ro bảo mật/vận hành:** lộ private signing key có thể cho phép giả mạo mọi Community user; claim sai có thể nâng quyền hoặc làm RLS chạy sai role; token revocation khó hơn Supabase session; clock skew/key rotation gây outage; REST user A và cached custom JWT user B gây session confusion. Phải tuyệt đối không cho FE chọn `sub`, không dùng symmetric secret chung trong browser, và test key rotation/revocation.

**Effort thô:** BE/auth 8–12 ngày, FE 4–6 ngày, migration/security/QA 5–8 ngày; tổng khoảng **17–26 person-days**. Chỉ nên chọn khi đội BE đã có năng lực quản lý signing keys/JWKS và muốn tránh Supabase refresh session.

### PA3 — Supabase Edge Function làm broker, verify REST JWT rồi cấp Supabase session

**Luồng đề xuất:** FE gọi một Edge Function mới với REST Bearer JWT. Function verify signature/issuer/audience/expiry bằng Nexora JWKS hoặc introspection, gọi BE để xác minh target staff/business khi cần, dùng Supabase Admin server-side để provision/crosswalk và trả credential one-time cho FE exchange thành Supabase session như PA1.

**Backend/migration mới:**

- Edge Function, secrets, rate limit, audit và replay protection.
- BE phải công bố JWKS/OIDC discovery hoặc introspection/service-to-service capability. Live Swagger ngày 2026-08-03 không có các path này; algorithm/issuer hiện cũng chưa được tài liệu hóa.
- Crosswalk phải có một owner rõ ràng. Nếu nằm ở REST DB, Edge cần API nội bộ được xác thực; nếu nằm ở Supabase, BE cần cơ chế sync/reconciliation.
- Capability authorize target staff vẫn cần BE; Edge không được tin `staffProfileId` do FE gửi mà không kiểm tra business membership.

**Rủi ro bảo mật/vận hành:** verifier tự viết sai dẫn tới JWT forgery/algorithm confusion; service-role trong Edge bypass RLS; trust boundary trải qua FE → Edge → BE → Supabase; lỗi timeout/partial provisioning tạo orphan; khó revoke đồng bộ. Supabase xác nhận secret/service-role bypass RLS và không được dùng trong browser ở [API key guide](https://supabase.com/docs/guides/getting-started/api-keys).

**Effort thô:** Edge/BE 9–14 ngày, FE 3–5 ngày, migration/security/QA 5–8 ngày; tổng khoảng **17–27 person-days**. Chỉ ưu tiên nếu team Supabase sở hữu vận hành Edge và BE không thể giữ Supabase Admin client.

### Hướng "chỉ lưu/trả `community_user_id`" không đủ nếu đứng riêng

Một mapping endpoint vẫn là **sub-capability bắt buộc** để resolve staff target, nhưng nó không tạo credential cho Owner caller. Nếu chỉ thêm cột/mapping mà không có PA1/PA2/PA3, `useDirectMessages` vẫn disabled cho anonymous (`src/data/hooks/useDirectMessages.ts:10-12`) và repository vẫn 401 khi không có Supabase user (`src/data/repositories/community/directMessages.ts:60-64`); do đó không đạt AC "không đăng nhập lại".

**Effort riêng của mapping-only:** BE/migration 2–4 ngày, FE 1–2 ngày, QA 1–2 ngày; **không được tính là phương án hoàn chỉnh**.

## Khuyến nghị

Chọn **PA1 — Nexora BE session broker + Supabase one-time exchange**, với một spike kỹ thuật 1 ngày trên non-production để xác nhận `generateLink`/`verifyOtp`, expiry và replay behavior trước khi khóa contract.

Lý do:

- Phù hợp kiến trúc hiện tại nhất: Community provider đã quản lý một Supabase `Session`, persist và auto-refresh (`src/lib/supabaseClient.ts:12-18`, `src/components/community/CommunityAuth.tsx:63-103`).
- Giữ việc verify REST JWT trong chính Nexora BE — trust boundary hiện hữu — thay vì triển khai verifier thứ hai trong Edge.
- Không buộc Nexora BE trở thành issuer của Supabase-compatible JWT/private signing key như PA2.
- Cho phép mapping/provisioning idempotent cho cả Owner và Staff, đồng thời tận dụng trigger `auth.users → profiles` hiện có (`supabase/migrations/0003_profile_and_integrity_triggers.sql:23-26`).
- Service-role vẫn là rủi ro cao nhưng có thể cô lập trong backend secret store, không xuất hiện trong bundle FE.

PA1 chỉ được duyệt implementation sau khi BE chốt contract, Product chốt phạm vi DM (toàn Community hay chỉ Owner ↔ staff cùng business), và Security chốt rate-limit/block-list/RLS hardening.

## Acceptance Criteria (áp dụng sau khi có phương án được chọn — chưa code ở bước này)

- **Given** Owner đã đăng nhập thật vào `/dashboard` và nhân viên có (hoặc được tự tạo) danh tính Community
- **When** Owner bấm "Chat" trên 1 staff row
- **Then** mở đúng `DockWindow`/direct-chat 1:1 với đúng người đó, gửi/nhận tin nhắn thật qua Supabase Realtime — không cần Owner tự đăng nhập lại qua persona switcher.
- **Given** nhân viên chưa có danh tính Community
- **When** Owner bấm "Chat"
- **Then** hiển thị trạng thái rõ ràng (vd "Đang khởi tạo trò chuyện lần đầu" hoặc tạo tự động — tuỳ phương án được chọn), không throw lỗi im lặng.

## API Mapping (bắt buộc trước khi integrate)

> Nguồn contract: Swagger live `https://test-api.nexoratouch.com/api/` — đối chiếu `API/update/<mới nhất>/api-integration-guide-v4.md`. Ghi tag nguồn: (S) spec / (L) đã verify live.

### Mapping chung đang có

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| POST | `/api/v1/Authentication/signin` | ANON | `{ email, password }` | `{ accessToken, refreshToken, tokenType, expiresIn }` | (S)(L) `API/update/260610/api-integration-guide-v4.md:16-30`; code `src/auth/adapters/apiAuthAdapter.ts:324-337` |
| RPC | Supabase `public.find_or_create_direct_channel` | Supabase authenticated, non-anonymous | `p_other_user_id` = Community UUID đã resolve | Canonical direct channel; sau đó repository đọc channel + participants | (S) `supabase/migrations/0010_direct_messages.sql:134-199`; code `src/data/repositories/community/directMessages.ts:106-116` |
| POST | `/api/v1/Client/ecosystem/signin` — **precedent SSO, không phải bridge Community** | REST JWT | Live schema: `{ id, path?, pageName? }` | `{ redirectUrl? }`; không trả Supabase session/identity | (S)(L) live Swagger 2026-08-03; code `src/data/repositories/ecosystem.ts:46-61`; snapshot chỉ liệt kê nhóm endpoint ở `API/update/260610/api-integration-guide-v4.md:150-152` |

Live Swagger ngày 2026-08-03 trả HTTP 200, có 322 paths. Search path không tìm thấy `community`, `supabase`, `identity`, `token-exchange`, `jwks`, `openid` hoặc `introspection`; chỉ có precedent `Client/ecosystem*`. Vì vậy toàn bộ capability bridge bên dưới đều là **đề xuất (S), chưa có contract live**.

### PA1 — BE session broker + one-time exchange

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| CHƯA CHỐT | **CHƯA CÓ, cần BE tạo mới** — capability bootstrap/exchange Community session cho current principal; route chưa chốt | REST JWT | **CHƯA CÓ contract**; actor bắt buộc derive từ JWT, không nhận caller `userId` từ FE | **CHƯA CÓ contract**; artifact one-time hoặc session payload phải được BE/Security chốt, không đoán field | (S) đề xuất PA1 |
| CHƯA CHỐT | **CHƯA CÓ, cần BE tạo mới** — capability resolve/provision Community identity của staff target; route chưa chốt | REST JWT, Owner đã authorize business | **CHƯA CÓ contract**; exact target identifier chưa chốt vì staff list có `linkId`/`staffProfileId`/`staffCode` khác nhau | **CHƯA CÓ contract**; phải cung cấp target Community UUID theo cách được authorize | (S) đề xuất PA1 |
| Admin SDK/API | Supabase Admin create/lookup user + `auth.admin.generateLink(...)` | Server-side Supabase secret/service-role | Supabase contract; real↔Community mapping do BE lookup server-side | One-time auth link/token properties; không phải `Session` | (S) [Supabase docs](https://supabase.com/docs/reference/javascript/auth-admin-generatelink) |
| SDK/API | `supabaseClient.auth.verifyOtp(...)` | Supabase anon/publishable key + one-time credential | Token hash + OTP type do spike xác nhận | Supabase `Session`/`User` hoặc error | (S) [Supabase docs](https://supabase.com/docs/reference/javascript/auth-verifyotp) |

### PA2 — BE mint custom JWT

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| CHƯA CHỐT | **CHƯA CÓ, cần BE tạo mới** — capability mint short-lived Community access JWT; route chưa chốt | REST JWT | **CHƯA CÓ contract**; actor derive từ JWT, FE không được chọn `sub`/role/claims | **CHƯA CÓ contract**; JWT/expiry/refresh metadata chưa chốt | (S) đề xuất PA2 |
| CHƯA CHỐT | **CHƯA CÓ, cần BE tạo mới** — capability resolve/provision authorized staff target; route chưa chốt | REST JWT, Owner đã authorize business | **CHƯA CÓ contract** | **CHƯA CÓ contract**; phải cung cấp target Community UUID theo cách được authorize | (S) đề xuất PA2 |
| SDK transport | Supabase client `accessToken` callback | Supabase anon/publishable key + BE-minted JWT | JWT short-lived có claims đã được Supabase/Security duyệt | Data API/RPC/Realtime chạy dưới JWT; không có Supabase refresh token | (S) [Supabase JWT docs](https://supabase.com/docs/guides/auth/jwts) |

### PA3 — Edge Function broker

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| CHƯA CHỐT | **CHƯA CÓ, cần BE tạo mới/phối hợp Supabase** — Edge Function exchange; tên function/URL chưa chốt | REST JWT chuyển tới Edge | **CHƯA CÓ contract**; không nhận caller identity do FE tự khai | **CHƯA CÓ contract**; one-time exchange artifact/session behavior chưa chốt | (S) đề xuất PA3 |
| CHƯA CHỐT | **CHƯA CÓ, cần BE tạo mới** — JWKS/OIDC discovery hoặc introspection cho REST JWT | Server-to-server/public verification metadata tùy thiết kế | **CHƯA CÓ contract** | **CHƯA CÓ contract**; keys/claims/active verdict chưa chốt | (S); live Swagger 2026-08-03 không có path tương ứng |
| CHƯA CHỐT | **CHƯA CÓ, cần BE tạo mới** — authorize/resolve target staff cho Edge | Service-to-service auth chưa chốt | **CHƯA CÓ contract** | **CHƯA CÓ contract** | (S) đề xuất PA3 |
| SDK/API | Supabase Admin provisioning + one-time auth operation | Edge secret/service-role | Supabase contract + principal đã verify | One-time credential; không để lộ service-role | (S) đề xuất PA3 + [Supabase API key docs](https://supabase.com/docs/guides/getting-started/api-keys) |

**Điểm chưa chắc chắn / cần hỏi BE:**

**Identity / data model**

- REST JWT dùng algorithm nào; `iss`, `aud`, `sub`, `kid`, expiry/refresh claims nào; `sub` có đúng bằng `UserProfile.id` không? Live Swagger chỉ mô tả Bearer header, không có JWKS/OIDC/introspection.
- Canonical key để link Community là `UserProfile.id`, `StaffProfile.id`, `staffCode`, hay một account ID khác? Một user vừa là Owner vừa là Staff/nhiều business có một hay nhiều Community identity?
- Từ `staffProfileId`, BE có resolve chắc chắn ra real user account không? Xử lý thế nào với local staff, pending invite/link, staff chưa accept, `staffProfileId` nullable hoặc account chưa có email?
- Có mapping/crosswalk hoặc Supabase user nào đã được tạo ngoài repo FE chưa? Có cần backfill/reconcile persona/demo và user thật hiện có không?
- Có được phép match legacy Supabase user theo verified email/phone không; xử lý collision/account takeover và email đổi như thế nào? Khuyến nghị không tự link theo email nếu chưa có quy trình proof-of-ownership.
- Source of truth cho `display_name`, avatar và trạng thái account là REST hay Supabase; sync create/update/delete bằng event nào? Khi GDPR/account deletion xảy ra, xóa/anonymize message/profile/crosswalk ra sao?

**Contract / provisioning**

- BE chọn PA1, PA2 hay PA3? Team nào sở hữu endpoint, migration, Supabase project và on-call?
- Exact route, method, request DTO, response DTO, error codes và HTTP status cho current-session bootstrap và target-identity capability là gì? Story cố ý chưa đặt tên field.
- Provision identity lúc staff account được tạo/accept invite, lúc Owner bấm Chat lần đầu, hay background backfill? Operation có idempotency key/locking để chống double-create không?
- Endpoint target nhận identifier nào trong `linkId`/`staffProfileId`/`staffCode`; trạng thái staff nào được chat; response có được lộ raw Supabase UUID không hay BE tạo channel server-side?
- Supabase Admin flow chính xác là createUser + generateLink/verifyOtp hay cơ chế khác? TTL, single-use, retry, resend và replay semantics là gì?
- Nếu PA2: Supabase project có hỗ trợ imported signing key/custom JWT không; exact claims/role/audience nào được chấp nhận; ai giữ private key và rotation runbook?
- Nếu PA3: BE sẽ cung cấp JWKS/OIDC/introspection nào; Edge xác minh key rotation/cache thế nào; service-to-service auth giữa Edge và BE là gì?

**Authorization / abuse / privacy**

- Owner chỉ được bootstrap target là staff `Active` đang linked với business hiện tại hay cả pending/local/rejected staff? Khi unlink thì channel/history còn truy cập được không?
- DM là global Community hay chỉ Owner ↔ staff cùng business? Current directory cho mọi signed-in non-anonymous user đọc mọi profile và RPC cho phép DM bất kỳ profile UUID (`supabase/migrations/0010_direct_messages.sql:109-156`); có cần migration RLS/RPC kiểm tra business relationship?
- Ai làm rate limit, block-list, spam/report/moderation và audit? Migration hiện có TODO rõ ràng trước production (`supabase/migrations/0010_direct_messages.sql:133-134`).
- Service-role/secret key nằm ở secrets manager nào, rotate ra sao, log/trace có redaction không, incident response khi leak là gì?
- Endpoint chống JWT forgery/algorithm confusion, IDOR, replay, enumeration và auto-provision abuse bằng biện pháp nào? Có cần MFA/step-up cho action nhạy cảm không?
- Staff có cần consent/notification trước khi Owner tạo Community identity và DM không? Chính sách retention/data residency cho tin nhắn thật là gì?

**Session lifecycle / UX integration**

- Khi REST access token refresh, logout, account switch, disable hoặc password reset thì Supabase session/custom JWT bị refresh/revoke/clear lúc nào? Multi-tab/multi-device xử lý ra sao?
- Nếu browser đang giữ persona/demo Supabase session rồi real user login, session nào thắng; có cần namespace storage hoặc xóa demo session không?
- Có chấp nhận `CommunityAuth` đang `queryClient.clear()` toàn bộ cache chung khi Supabase identity đổi (`src/components/community/CommunityAuth.tsx:92-97`) hay phải tách/target cache invalidation?
- Chat button sẽ điều hướng sang `/community/chat/dm/:channelId`, mở dock ngay trên `/dashboard/staff`, hay nâng Community providers lên app shell? Current dock chỉ render tại `/community` (`src/components/community/CommunityChatDock.tsx:592-609`).
- Staff nhận tin ở đâu: chỉ khi vào `/community`, hay cần dock/notification trong `/staff/*`? Offline/unread/push notification có thuộc scope story kế tiếp không?
- Dev/staging/prod dùng Supabase project nào; crosswalk có tách environment; migration/rollback và cleanup orphan user được vận hành thế nào?

## FE Surface (các layer sẽ đụng — điền chính xác khi phương án được chọn)

> Theo data boundary: components → data hooks → repositories → adapter.

| Layer | File | Thay đổi |
|---|---|---|
| Component | `src/components/dashboard/views/StaffView.desktop.tsx`, `src/components/StaffDetailView.tsx` | Sau khi contract/UX được duyệt: thêm Chat state/action; chỉ enable cho staff status/identifier mà BE xác nhận. Không code ở story này. |
| Data hook | `src/data/hooks/useDirectMessages.ts`, hook bridge mới (tên chưa chốt) | Tái dùng find/create channel sau khi có caller session + target UUID. Query key/payload **chưa chốt**, không đoán trước BE contract. |
| Repository | `src/data/repositories/community/directMessages.ts`, repository bridge mới (tên chưa chốt) | Direct-message repo hiện giữ nguyên Supabase boundary; repository mới gọi endpoint bridge qua `httpClient` theo PA1. |
| Auth/provider | `src/components/community/CommunityAuth.tsx`, `src/lib/supabaseClient.ts` | PA1 cần production bootstrap path ngoài persona demo và lifecycle logout/account switch; phải tránh session/cache confusion. |
| Route/dock | `src/components/community/CommunityScreens.tsx`, `src/components/community/CommunityChatDock.tsx`, app shell/route owner sau khi UX chốt | Current provider/dock chỉ ở `/community`; chọn navigation hay global dock trước khi implementation. |
| Shared contract | OpenSpec change mới | **Bắt buộc trước khi code** vì đụng auth/provider/repository shared layer, theo `CLAUDE.md` API Integration Workflow mục 3–4. |

## Definition of Done (cho giai đoạn research/spec này)

- [x] Kiến trúc auth ở phần Bối cảnh đã được Codex xác nhận/sửa lại đúng thực tế code
- [x] ≥2 phương án bắc cầu, mỗi phương án có effort + rủi ro
- [x] API Mapping điền đầy đủ cho từng phương án (dù là "CHƯA CÓ, cần BE tạo mới")
- [x] "Cần hỏi BE" liệt kê đầy đủ, không bỏ sót câu hỏi mở
- [x] Phương án khuyến nghị + lý do
- [x] Codex KHÔNG sửa application code; phiên research/spec này chỉ ghi `user-story/US-012-staff-chat-auth-bridge.md` (worktree có sẵn/có song song các code diff ngoài scope, xem ghi chú bên dưới)

## Ghi chú phiên thực thi

- **2026-08-03 · Research/spec:** Đã đọc trực tiếp auth adapter/provider/token store/http client, Community auth/provider/route/dock, DM repository/hooks/Realtime, Supabase profile/DM migrations, staff repository/types, API snapshot v4, ecosystem SSO precedent và live Swagger.
- **Correction:** Community không chỉ có ba persona; khi chưa có session nó tạo Supabase anonymous user, nhưng DM bị chặn cho anonymous (`src/components/community/CommunityAuth.tsx:50-85`, `src/data/hooks/useDirectMessages.ts:10-12`).
- **Correction:** Comment demo shell không chứng minh hai identity system được tách có chủ đích; chỉ chứng minh production shell không mount được trên public Community route trong kiến trúc hiện tại (`src/components/community/demo/DemoMerchantShell.tsx:76-82`).
- **Constraint mới phát hiện:** Dock hiện không render ngoài `/community`, nên auth bridge là điều kiện cần nhưng chưa đủ cho dock trên `/dashboard/staff` (`src/components/community/CommunityChatDock.tsx:592-609`).
- **Live API audit:** `GET https://test-api.nexoratouch.com/api/specification.json` trả 200 ngày 2026-08-03; 322 paths, không có Community/Supabase/identity bridge/JWKS/introspection/token-exchange. `/api/v1/Client/ecosystem/signin` có thật nhưng chỉ trả redirect SSO, được ghi làm precedent, không tái sử dụng mù quáng.
- **Decision:** Khuyến nghị PA1, nhưng implementation bị block cho đến khi BE trả lời các câu hỏi contract/security ở trên và OpenSpec được duyệt.
- **Scope verification:** 45 citation path/range đã resolve; `git diff --check -- user-story/US-012-staff-chat-auth-bridge.md` pass. `git status --short` cho thấy story là file untracked và worktree còn nhiều application-code diff ngoài scope không do phiên research này tạo/chạm; vì vậy `git diff --stat` toàn repo không thể chỉ hiện story (và mặc định cũng không liệt kê untracked file). Không revert/stage/sửa các diff đó.

# US-045 · OneQR — Mã QR Tổng của cửa hàng

> File: `US-045-oneqr-master-qr.md` · 1 file = 1 story.

| | |
|---|---|
| **Trạng thái** | **Integrated** — contract đã đối chiếu Swagger BE local (`localhost:5005`); chờ BE deploy lên `test-api` để chạy AC end-to-end |
| **Ngày tạo** | 2026-08-31 |
| **Epic / Domain** | QR & Touch Points — OneQR |
| **OpenSpec change** | `—` (chưa tạo; xem "Ghi chú phiên thực thi") |
| **Test plan** | `src/data/repositories/merchantOneQr.test.ts`, `src/data/repositories/publicOneQr.test.ts` |
| **Nguồn yêu cầu** | `oneqr-business.md` (2026-08-28), `oneqr-technical.md` (bản cập nhật 19 module + `CustomLink`, Chờ Team Leader duyệt) |
| **Mockup** | `https://taxiq-nexora-touch.vercel.app/html/pages/qr-stations.html?tab=one-qr`, `.../html/customer/oneqr-landing.html` |

## Story

**Là** Chủ cửa hàng,
**tôi muốn** có **một** mã QR duy nhất in một lần không bao giờ đổi, và tự cấu hình danh sách chức năng phía sau nó riêng cho Khách hàng / Nhân viên / Chủ cửa hàng,
**để** in số lượng lớn mà vẫn đổi nội dung được bất cứ lúc nào, và mỗi nhóm người quét chỉ thấy đúng thứ họ cần.

**Là** Khách hàng / Nhân viên,
**tôi muốn** quét đúng một mã dán ở quầy là vào được việc mình cần,
**để** không phải đi tìm mã QR khác hay nhớ thêm địa chỉ.

## Acceptance Criteria

**AC-1 · Tự tạo lần đầu (Luồng 1)**
- **Given** Chủ cửa hàng chưa có OneQR
- **When** mở tab `Stations & QR → OneQR` (`?tab=stations&section=one-qr`)
- **Then** FE gọi `GET /api/v1/merchant/oneqr` — endpoint này **get-or-create ở BE**, trả luôn bản ghi đã seed QR + 3 role config + module mặc định. FE không tạo gì cả (API không có POST). Lỗi mạng thì hiện màn hình lỗi có nút Thử lại.

**AC-2 · Cấu hình theo vai trò tách biệt (Luồng 2)**
- **Given** builder đang mở
- **When** đổi tab vai trò Customer/Staff/Owner
- **Then** danh sách mô-đun, lời chào, chính sách danh tính đổi theo vai trò; **tên mã QR dùng chung**. Vai trò có sửa chưa lưu hiện chấm cảnh báo trên tab.

**AC-3 · Bật/tắt, kéo thả, thêm, sửa mô-đun**
- **When** bật/tắt công tắc, kéo thả đổi thứ tự, thêm mô-đun từ danh mục, đổi nhãn/biểu tượng
- **Then** bản xem trước (khung điện thoại) cập nhật ngay, chưa gọi API. Bấm **Lưu cấu hình** mới gọi `PUT .../role-config` + `PUT .../modules` (và `PUT .../oneqr` nếu tên đổi), sau đó invalidate `qk.merchantOneQr()`.

**AC-4 · Liên kết tùy chỉnh chỉ nhận https**
- **When** nhập `CustomUrl` không bắt đầu bằng `https://` (kể cả `javascript:`, `data:`)
- **Then** nút thêm bị disable + hiện lỗi; không gọi API.

**AC-5 · Cảnh báo tắt hết mô-đun**
- **Given** mọi mô-đun của vai trò đang tắt
- **Then** form cấu hình hiện cảnh báo trước khi lưu (vẫn cho lưu — đây là lựa chọn hợp lệ).

**AC-6 · Phụ thuộc TouchPoint**
- **Given** `hasActiveTouchPoint = false`
- **Then** builder liệt kê động các mô-đun đang bật có `requiresTouchPoint` (hiện là `TipAndPay` **và** `Review`); danh mục thêm mô-đun gắn badge "Cần trạm QR". **Các mô-đun khác vẫn hoạt động bình thường** (quy tắc độc lập mô-đun).

**AC-6b · Mô-đun chưa có trang đích**
- **Given** một module definition có `isComingSoon = true` (hiện là `Rewards` / `Membership` / `AIAssistant`, nhưng do Admin đặt trong DB nên có thể đổi bất cứ lúc nào)
- **Then** builder gắn badge "Sắp có" ở cả danh mục và hàng module — merchant biết trước, không phải phát hiện qua lời phàn nàn của khách. Vẫn cho bật (URL theo quy ước đã có).

**AC-6c · Danh mục do Admin quản lý**
- **When** mở danh mục thêm mô-đun
- **Then** chỉ hiện các key server trả về, **theo đúng thứ tự server trả** (`sortOrder` của Admin), lọc theo `allowedAudiences` của từng definition. Key bị Admin `deactivate` không xuất hiện. Bảng hardcode FE **không** được thêm key trở lại.

**AC-6d · Lý do không khả dụng**
- **Given** một module có `isAvailable = false`
- **Then** hàng module hiện đúng lý do từ `unavailableReason` (`MissingTouchPoint` / `Disabled` / `MissingDefinition` / `MissingCustomUrl` / `InvalidTemplate`). Lý do lạ (BE thêm mới) → hiện câu chung, **không** hiện tên enum thô cho merchant.

**AC-6e · Nhãn ô chức năng đa ngôn ngữ**
- **Given** khách đổi ngôn ngữ sang tiếng Việt và quét `/o/{slug}`
- **Then** nhãn mỗi ô lấy từ `oneqr.modules.<ModuleKey>` trong `vi.json`, **không** dùng `label` BE trả (definition chỉ có một cột `label`, một ngôn ngữ). `customLabel` của merchant vẫn thắng locale. Key chưa có bản dịch → dùng nhãn BE, kèm `logger.warn` lúc dev.

**AC-6f · Module do Admin tự thêm**
- **Given** Admin thêm một module key mới qua portal (vd `LoyaltyPoints`)
- **Then** builder hiển thị đúng key đó với nhãn/icon từ definition; **không** coerce về `CustomLink`. Khi Save, payload gửi lại **đúng** key gốc.

**AC-6g · Module bị Admin tắt**
- **Given** một ô đã đặt có `unavailableReason = Disabled`
- **Then** hàng module vẫn hiện (không tưởng là mất dữ liệu), panel hiện banner liệt kê ô sẽ bị loại, và payload Save **không** chứa ô đó — nên không nhận 400 `ONEQR_MODULE_DISABLED`. Các lý do không-khả-dụng khác vẫn được gửi bình thường.

**AC-7 · Tạm ngưng ≠ lỗi (Luồng 3)**
- **Given** landing trả `status` là Paused/Inactive
- **When** khách mở `/o/{businessSlug}`
- **Then** API trả **HTTP 200**, FE hiện màn hình "Đang tạm ngưng" lịch sự kèm tên cửa hàng — **không** hiện trang lỗi, **không** 404.

**AC-8 · Phân giải vai trò tại thời điểm quét (Luồng 4)**
- **Given** cùng một URL `/o/{slug}`
- **When** người quét không đăng nhập → thấy lưới Khách hàng; đang là nhân viên active → thấy lưới Nhân viên; là chủ → thấy lưới quản lý
- **Then** payload **chỉ chứa** mô-đun của đúng vai trò đó (lọc ở BE, không ẩn bằng CSS). Token hết hạn/sai **không** trả 401 — coi như Khách hàng.

**AC-9 · Xem như khách**
- **When** nhân viên/chủ bấm "Xem như khách"
- **Then** điều hướng sang `/o/{slug}?as=customer`, request **vẫn kèm token** (để BE biết đây là hạ quyền có chủ đích) và render lưới Khách hàng.

**AC-10 · Luôn yêu cầu đăng nhập**
- **Given** `IdentityPolicy = AlwaysSignIn` và người quét chưa đăng nhập
- **Then** BE trả `requiresAuth: true`; FE hiện màn hình mời đăng nhập → `/login?returnPath=/o/{slug}`.

**AC-11 · Ghi nhận lượt bấm ô**
- **When** khách bấm một ô chức năng
- **Then** FE bắn `POST /api/v1/oneqr/{slug}/track` **fire-and-forget** — lỗi không hiện toast, không chặn điều hướng.

**AC-12 · Thẻ vật lý trỏ vào OneQR (Luồng 5)**
- **Given** một `PhysicalCard` đã liên kết OneQR
- **When** chạm thẻ → `/qr/{cardCode}`
- **Then** `ResolveQrCodeQuery` trả khối `oneQr`, FE `replace` sang `/o/{businessSlug}`.

## API Mapping (bắt buộc trước khi integrate)

> Nguồn contract: **Swagger BE local** `https://localhost:5005/api/specification.json` (666 paths), đối chiếu ngày 2026-08-31 — ký hiệu **(L)**. Swagger `test-api` cùng ngày vẫn **0 path chứa `oneqr`**, nghĩa là BE đã code xong nhưng **chưa deploy**. `.env.development` hiện trỏ về local, nên builder chạy được ở máy dev.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/merchant/oneqr` | Owner JWT | — | `OneQrConfigDto` — **get-or-create**, không cần POST | (L) |
| PUT | `/api/v1/merchant/oneqr` | Owner JWT | `UpdateOneQrCommand { name }` | 204 | (L) |
| PUT | `/api/v1/merchant/oneqr/role-config` | Owner JWT | `SaveOneQrRoleConfigCommand { audience, welcomeMessage, identityPolicy }` | 204 | (L) |
| PUT | `/api/v1/merchant/oneqr/modules` | Owner JWT | `SaveOneQrModulesCommand { audience, modules[OneQrModuleInput] }` — **input không có `id`/`sortOrder`** | 204 | (L) |
| PUT | `/api/v1/merchant/oneqr/toggle` | Owner JWT | — | 204 | (L) |
| DELETE | `/api/v1/merchant/oneqr` | Owner JWT | — | 204 | (L) |
| GET | `/api/v1/merchant/oneqr/module-catalog` | Owner JWT | — | `OneQrModuleCatalogItemDto[]` — **thường không cần gọi**, catalog đã nằm trong `OneQrConfigDto.catalog` | (L) |
| GET | `/api/v1/merchant/oneqr/download` | Owner JWT | — | PNG blob | (L) — *FE có `downloadQr()` nhưng UI chưa dùng* |
| GET | `/api/v1/merchant/oneqr/analytics` | Owner JWT | — | `OneQrAnalyticsDto` | (L) — **FE chưa dùng** |
| GET | `/api/v1/oneqr/{businessSlug}` | AllowAnonymous, **đọc** Bearer nếu có | `?sessionId=&as=` | `OneQrLandingDto { status, requiresAuth, audience, business, welcomeMessage, canViewAsCustomer, modules[] }` | (L) |
| POST | `/api/v1/oneqr/{businessSlug}/track` | AllowAnonymous | `TrackOneQrModuleClickCommand { businessSlug, moduleKey, audience, sessionId }` | 202/204 | (L) |
| POST | `/api/v1/merchant/physical-cards/{cardCode}/link-oneqr` | Owner JWT | không body | — | (L) — **FE chưa dùng** |
| GET | `/qr/{cardCode}` | Anonymous | — | khối `oneQr`: `QrOneQrDto { id, name, isActive, businessId, businessName, businessSlug }` | (L) |
| GET/POST/PUT/PATCH/DELETE | `/api/v1/admin/oneqr-modules*` | Admin | quản lý `OneQrModuleDefinition` (thêm/sửa/bật/tắt/xóa/reorder) | `AdminOneQrModuleDefinitionDto` | (L) — **NGOÀI phạm vi repo này**; UI đã có tại `frontend/src/pages/admin/OneQrModuleManagement.tsx` của repo backend |

**Cấu trúc `OneQrConfigDto` (điểm dễ sai nhất):**

```
OneQrConfigDto { id, name, url, qrImageUrl, isActive, createdAt, hasActiveTouchPoint,
  audiences: [ OneQrAudienceConfigDto { audience, welcomeMessage, identityPolicy,
                 modules: [ OneQrModuleConfigDto { id, moduleKey, sortOrder, isEnabled,
                              customLabel, customIcon, customUrl,
                              defaultLabel, defaultIcon, urlTemplate, resolvedUrl,
                              isAvailable, unavailableReason, isComingSoon } ] } ],
  catalog: [ OneQrModuleCatalogItemDto { moduleKey, defaultLabel, defaultIcon, urlTemplate,
               allowedAudiences, requiresTouchPoint, requiresCustomUrl, allowsMultiple } ] }
```

`modules` **lồng trong `audiences`**, không phẳng ở root — đọc sai chỗ này là nguyên nhân bug "No modules for this role yet".

`moduleKey` là **`string` tự do** ở mọi DTO, không phải enum: Admin thêm module mới qua portal mà không cần deploy. **Không được** coerce key lạ về một giá trị của `OneQrModuleKey` — xem AC-6f.

**Điểm chưa chắc chắn / cần hỏi BE:**

1. ~~**Enum serialize dạng string hay số?**~~ **ĐÃ CHỐT (L):** cả ba enum khai báo `"type": "string"` trong Swagger, đúng tên FE đang dùng. Vẫn giữ nhánh đọc ordinal làm lưới an toàn cho `Audience`/`IdentityPolicy`.
2. **Endpoint `module-catalog` có tồn tại không?** Design nói `IOneQrModuleRegistry` là source of truth và FE **không được** hardcode URL đích. FE hiện **không** hardcode URL (URL luôn lấy từ payload landing), nhưng builder cần nhãn + icon mặc định để hiển thị danh mục. FE gọi endpoint này rồi **merge kết quả server đè lên bảng nhãn/icon đóng gói sẵn** (`src/constants/oneQr.ts`): 404/501/body rỗng → dùng nguyên bảng đóng gói; server có trả → từng field của server thắng, field thiếu lấy từ bảng đóng gói, key lạ được append. Nhờ vậy `getModuleCatalog()` **không bao giờ trả `[]`** và danh mục "Thêm mô-đun" luôn có nội dung. Cần BE xác nhận có expose registry hay không.
   - Lưu ý: entry fallback để `defaultLabel = null` **có chủ đích** — nhãn đóng gói là *i18n key*, không phải chuỗi hiển thị; trả thẳng chuỗi tiếng Anh sẽ làm hỏng builder bản VI.
3. **Shape response chính xác** của `GET /api/v1/merchant/oneqr` và `GET /api/v1/oneqr/{slug}` — design chỉ mô tả entity, chưa có DTO. FE normalize chấp nhận nhiều alias (`data` envelope, `business` block lồng, `qrImageUrl`/`QRImageUrl`, `businessHours` string hoặc array) để giảm rủi ro, nhưng **vẫn cần DTO chốt**.
4. **`stats`** (Scans Today / Active QR / Pending Approvals / Self-service trong mockup) — mockup hardcode số. Design không định nghĩa endpoint thống kê. FE đã có chỗ nhận (`OneQr.stats`) nhưng **chưa render** vì không rõ nguồn. Cần chốt trước khi làm thanh KPI.
5. **`PUT /modules` là replace-all hay upsert?** FE đang gửi **toàn bộ** danh sách của một audience (kể cả row đã xóa thì vắng mặt) và kỳ vọng BE replace. Cần xác nhận.
6. **Mô-đun không khả dụng**: BE báo qua field nào? FE đọc `isUnavailable`/`isAvailable` trên module và `unavailableReason` trên catalog item — cần chốt tên field.
7. **`businessLogoUrl` / `businessAddress` / `businessHours`** có nằm trong payload landing không? Mockup có hiển thị. FE render có điều kiện nên thiếu cũng không vỡ layout.

## FE Surface (các layer sẽ đụng)

| Layer | File | Thay đổi |
|---|---|---|
| Constants | `src/constants/oneQr.ts` | **mới** — `OneQrAudience`, `OneQrIdentityPolicy`, `OneQrModuleKey`, `ONEQR_ROUTE`, `ONEQR_FIELD_LIMITS`, catalog nhãn/icon fallback, `isValidOneQrCustomUrl` |
| Types | `src/types/oneQr.ts` | **mới** — `OneQr`, `OneQrModule`, `OneQrRoleConfig`, `OneQrLanding`, … |
| Repository | `src/data/repositories/merchantOneQr.ts` | **mới** — normalize entity + role config + module; 404 → `null` |
| Repository | `src/data/repositories/publicOneQr.ts` | **mới** — normalize landing; lọc module không có `url` |
| Repository | `src/data/repositories/publicQr.ts` | + normalize khối `oneQr` trong `ResolveQrCodeQuery` |
| Data hook | `src/data/hooks/useMerchantOneQr.ts` | **mới** — key `qk.merchantOneQr()`; mọi mutation invalidate `qk.merchantOneQr()`; `useDeleteOneQr` invalidate thêm `qk.merchantPhysicalCards()`; auto-create có ref guard |
| Data hook | `useOneQrModuleCatalog` (cùng file) | key `qk.merchantOneQrModuleCatalog()` — **để top-level, KHÔNG lồng dưới `merchantOneQr`**, nếu lồng thì mỗi lần Lưu/Bật-tắt sẽ invalidate luôn registry tĩnh. `retry: false` + `placeholderData` = bảng đóng gói (picker có nội dung ngay lần render đầu), `staleTime` 30', `gcTime` 60', không refetch on focus |
| Data hook | `src/data/hooks/usePublicOneQr.ts` | **mới** — key `qk.publicOneQrLanding(slug, sessionId, authStatus, asCustomer)`; chờ auth ready; track = fire-and-forget |
| Query keys | `src/data/queryKeys.ts` | + `merchantOneQr`, `merchantOneQrModuleCatalog`, `publicOneQrLanding` |
| Component (builder) | `src/components/touchpoints/oneqr/*` | **mới** — `OneQrPanel`, `OneQrCodeCard`, `OneQrAudienceTabs`, `OneQrModuleList` (dnd-kit), `OneQrConfigForm`, `OneQrPreview`, `AddOneQrModuleModal`, `EditOneQrModuleModal`, `oneQrDraft.ts` |
| Component (icon) | `src/components/oneqr/OneQrModuleIcon.tsx` | **mới** — allowlist tên icon Lucide (CustomIcon là free text từ merchant) |
| Component (landing) | `src/components/public/oneqr/OneQrLandingPage.tsx` | **mới** — `/o/:businessSlug` |
| Route | `src/app/AppRouter.tsx` | + route public `ONEQR_ROUTE.path`, lazy |
| Route | `src/components/public/QrRedirectPage.jsx` | + nhánh redirect sang `/o/{slug}` khi thẻ trỏ OneQR |
| Tabs | `src/components/touchpoints/touchpointSections.ts`, `TouchpointSectionTabs.tsx`, `TouchpointsView.tsx` | + section `one-qr` (tab đầu tiên; **default vẫn là `tip`** để không đổi hành vi link cũ) |
| i18n | `src/locales/en.json`, `vi.json` | + namespace `oneqr.*` (84 key, parity 100%) + `dashboard.touchpoints.stations_sections.one_qr{,_desc}` |

## Definition of Done

- [ ] **AC pass trên môi trường dev (API thật)** — ⛔ **chưa làm được: endpoint OneQR chưa deploy** (Swagger live 2026-08-31 không có path nào chứa `oneqr`)
- [ ] **API call đúng contract đã map** — ⛔ chờ BE, hiện chỉ verify được bằng unit test với fake client
- [x] Mutation invalidate đúng query cache (`qk.merchantOneQr()` sau mọi mutation; + `merchantPhysicalCards` khi xóa)
- [x] Không console error (dùng `logger`, không `console.*`)
- [ ] Test 3 layer — **L2 (data boundary) xong: 18 test pass**; L1/L3 chờ có API thật
- [x] `pnpm build` xanh; `pnpm typecheck` không phát sinh lỗi mới (72 lỗi còn lại đều là baseline ở file không đụng tới)
- [ ] Cập nhật trạng thái file này + link TC (sau khi BE deploy)

## Ghi chú phiên thực thi

**2026-08-31 — Integrate FE theo design doc, không có backend.**

- **Phát hiện chặn:** `oneqr-technical.md` đang ở trạng thái *"Chờ Team Leader duyệt"* và Swagger live không có endpoint OneQR nào. Toàn bộ FE dưới đây code theo **contract trong design doc**, không phải đoán field, nhưng **chưa verify được với API thật** — mọi màn hình sẽ 404 cho tới khi BE deploy. Đây là deviation quan trọng so với quy trình "Contract from live Swagger" trong `CLAUDE.md`.
- **OpenSpec:** feature này chạm >3 file và cả shared layer (`queryKeys`, `AppRouter`, `publicQr`) nên **đúng ra cần một OpenSpec change**. Chưa tạo trong phiên này vì contract BE còn 7 điểm mở — nên chốt câu hỏi với BE trước rồi mới viết `design.md` map US ↔ endpoint ↔ FE file.
- **Quyết định FE:**
  - **Không hardcode URL đích.** URL của mọi ô luôn lấy từ payload landing do BE resolve qua `IOneQrModuleRegistry`. FE chỉ đóng gói sẵn *nhãn + icon* mặc định làm fallback cho danh mục trong builder.
  - **`CustomIcon` là allowlist**, không dynamic import: field này là free text `varchar(40)` do merchant nhập, tên lạ sẽ fallback về icon vuông thay vì làm vỡ lưới.
  - **Edit-then-Save**: một nút Lưu commit cả role config lẫn module list của vai trò đang mở (đúng Luồng 2 bước 7). Draft có guard chống refetch nền ghi đè sửa dở.
  - **Tab mặc định vẫn là `tip`**, OneQR phải vào bằng `?section=one-qr` — tránh đổi hành vi của link/bookmark hiện có, dù mockup đặt OneQR làm tab đầu.
- **Chưa làm (ngoài phạm vi / thiếu contract):**
  - Thanh KPI 4 số của mockup (Scans Today / Active QR / Pending Approvals / Self-service) — không có nguồn dữ liệu.
  - Nút **Xóa** OneQR: hook `useDeleteOneQr` đã có nhưng **chưa gắn UI**, vì xóa là hành động một chiều làm chết mọi mã đã in — cần Product chốt luồng xác nhận trước.
  - Màn hình liên kết **thẻ vật lý → OneQR** (Luồng 5 bước 1–2): FE mới làm nhánh *đọc* (redirect khi chạm thẻ). Nhánh *ghi* cần endpoint `PhysicalCard.LinkToOneQr` chưa có trong Swagger.
  - In poster (nút Print của mockup) — hiện chỉ có Tải mã QR.

**2026-08-31 (bổ sung) — Đối chiếu Swagger BE local, sửa lại toàn bộ contract.**

Phát hiện `.env.development` đang trỏ `VITE_API_BASE_URL=https://localhost:5005` (BE chạy local), và **BE local ĐÃ implement OneQR** (661 path, đủ 10 endpoint) dù `test-api` chưa deploy. Đã lấy `OneQrConfigDto`/`OneQrLandingDto` thật từ `https://localhost:5005/api/specification.json` và sửa lại FE cho khớp. Các sai lệch đã sửa:

| Chỗ | FE đoán trước đó | Contract thật | Hậu quả |
|---|---|---|---|
| Config root | `roleConfigs[]` + `modules[]` phẳng ở root | **`audiences[]`, `modules` lồng bên trong từng audience** | `source.modules` undefined → luôn rỗng → builder hiện "No modules for this role yet" dù đã lưu thành công |
| Catalog | endpoint riêng bắt buộc | trả **inline** trong `catalog` của GET config | gọi thừa một request |
| Tạo mới | `POST /merchant/oneqr` | **không có POST** — GET là get-or-create | auto-create phía FE là thừa |
| Lưu module | gửi kèm `id` + `sortOrder` | `OneQrModuleInput` chỉ có `moduleKey,isEnabled,customLabel,customIcon,customUrl` — **thứ tự = vị trí trong mảng** | field thừa bị BE bỏ qua |
| Module DTO | `isUnavailable` | `isAvailable`, kèm sẵn `defaultLabel`/`defaultIcon`/`resolvedUrl` | cờ cảnh báo đọc ngược |
| TouchPoint | prop truyền từ `TouchpointsView` | `hasActiveTouchPoint` nằm trong config | bỏ được prop |
| Landing | `isActive` bool | **`status`** (string) | trạng thái Tạm ngưng đọc sai |
| Landing | tự suy từ `audience` | **`canViewAsCustomer`** do BE quyết định | nút "Xem như khách" hiện sai đối tượng |
| Landing | `businessAddress`, `businessHours`, `viewerName`, `identityPolicy` | **không có** trong DTO | đã gỡ footer địa chỉ/giờ mở cửa của mockup |
| Landing module | có `sortOrder` | không có — thứ tự mảng là thứ tự hiển thị | |
| Track | `{moduleKey,sessionId,audience}` | thêm `businessSlug` trong body | |

**Câu hỏi 1 (enum string hay số) ĐÃ CHỐT:** Swagger khai báo cả ba enum là `"type": "string"` với đúng tên FE đang dùng. Vẫn giữ nhánh đọc ordinal trong `toEnum` làm lưới an toàn cho `Audience`/`IdentityPolicy`; riêng `ModuleKey` chỉ map theo tên vì ordinal thưa.

**Endpoint BE đã có mà FE chưa dùng:**
- `GET /merchant/oneqr/analytics` → `OneQrAnalyticsDto` (`totalViews`, `totalModuleClicks`, `viewsByAudience[]`, `modules[]`). Đây chính là nguồn dữ liệu cho thanh KPI của mockup — trước đây bỏ qua vì tưởng không có nguồn, **giờ đã làm được**.
- `GET /merchant/oneqr/download` → đã thêm `downloadQr()` vào repository nhưng UI vẫn tải qua ảnh QR; nên chuyển sang endpoint này để lấy đúng PNG 1000×1000 của BE.
- `POST /merchant/physical-cards/{cardCode}/link-oneqr` (không body) → mở đường cho nhánh *ghi* của Luồng 5 (liên kết thẻ vật lý vào OneQR).


**2026-08-31 (bổ sung 2) — Design doc cập nhật: 19 module + `CustomLink`, mở tự do theo vai trò.**

`oneqr-technical.md` được sửa, thêm 6 module key và đổi 2 quyết định kiến trúc. FE đã cập nhật theo:

**6 module key mới:** `Rewards`, `Membership` (band 0-9), `ReceiveCustomer`, `CompleteService`, `RequestApproval` (band 10-19), `AIAssistant` (band 90+). Tổng catalog FE giờ là **20 key**.

**Quyết định 3b — mở tự do theo vai trò:** `allowedAudiences` của **mọi** module là cả ba vai trò, builder hiện full catalog ở mọi tab. Trước đó FE lọc theo vai trò thiết kế ban đầu (vd `ClockIn` chỉ Staff). Band số trong enum **không phải** quy tắc phân quyền — chỉ ghi lại vai trò module được thiết kế ban đầu, để key mới không phải đánh số lại. Vai trò vẫn được cưỡng chế ở thời điểm quét: một lượt quét chỉ nhận danh sách module đã cấu hình cho vai trò nó được phân giải.

**Cờ `IsComingSoon`:** `Rewards`, `Membership`, `AIAssistant` có key + URL theo quy ước nhưng **chưa có trang đích**. FE gắn badge "Sắp có" ở cả danh mục thêm mô-đun và hàng module trong builder. DTO của BE hiện **chưa có** field này nên FE đọc `isComingSoon`/`comingSoon` rồi fallback về bảng đóng gói.

**`Review` cũng cần TouchPoint:** trước chỉ `TipAndPay`. Cảnh báo trong builder giờ liệt kê động mọi module đang bật mà `requiresTouchPoint = true` (key `oneqr.builder.needs_station_warning`, thay cho `tip_and_pay_needs_station`). Danh mục thêm mô-đun cũng gắn badge "Cần trạm QR".

**Nhãn + icon mặc định đổi theo bảng registry v1 mới:** `Booking` → `calendar-days` (was `calendar-check`), `TipAndPay` → `heart` + nhãn "Tip" (was `dollar-sign`), `ClockIn` → `circle-check`, `TurnBoard` → `users-round`, `MyTips` → `wallet`, `StaffPortal` → `user-round`, `ManageServices` → `settings-2`, `CustomLink` → `link`. Thứ tự catalog xếp lại theo mockup: hành trình khách → vận hành nhân viên → quản lý → van xả.

**Icon lucide tên mới:** `circle-check` và `square-arrow-out-up-right` **không tồn tại** trong `lucide-react@0.344` của repo (tên của bản >= 0.4xx). Đã alias trong `OneQrModuleIcon` sang `CheckCircle2` / `ExternalLink`; nếu không alias thì hai ô này render thành ô vuông trống. Đây đúng là lý do component dùng allowlist thay vì dynamic import.

### Rủi ro đã xử lý: FE biết 20 key, BE snapshot chỉ có 14

Swagger BE local (snapshot 2026-08-31 11:45) enum `OneQrModuleKey` chỉ có **14 key** — thiếu đúng 6 key mới. BE local lúc kiểm lại **không chạy** (`HTTP 000`) nên không xác minh được bản hiện tại.

Nếu để `mergeCatalog` append full bảng đóng gói như trước, picker sẽ hiện `Rewards`, merchant chọn, save gửi `moduleKey: "Rewards"` → **BE 400** vì enum chưa có. Đã sửa nguyên tắc merge:

- Server **có** trả catalog → **server quyết định tập key**; bảng đóng gói chỉ bù field thiếu (icon/nhãn/cờ), **không thêm key mới**.
- Server **không** trả catalog (404/501/rỗng) → dùng nguyên bảng đóng gói 20 key.

Nhờ vậy FE đi trước BE mà không tạo lỗi save. Khi BE bổ sung 6 key, chúng tự xuất hiện trong picker, không cần sửa FE.

**Cần xác nhận với BE:** (a) enum đã thêm 6 key chưa, (b) `OneQrModuleCatalogItemDto` có bổ sung `isComingSoon` không, (c) `module-catalog` có thêm query `?audience=` như doc nói không (snapshot cũ không có param nào).


**2026-08-31 (bổ sung 3) — Registry chuyển thành entity `OneQrModuleDefinition` do Admin quản lý.**

BE local chạy lại, spec đổi (661 → **666 paths**). `IOneQrModuleRegistry` hardcode in-memory đã trở thành **bảng DB `OneQrModuleDefinition`**, quản trị hệ thống sửa được ở runtime qua 5 endpoint mới:

| Method | Endpoint | Ghi chú |
|---|---|---|
| GET | `/api/v1/admin/oneqr-modules` | `AdminOneQrModuleDefinitionDto[]` |
| PUT | `/api/v1/admin/oneqr-modules/{id}` | `UpdateOneQrModuleDefinitionCommand { label, icon, urlTemplate, allowedAudiences, defaultForAudiences, isComingSoon }` |
| PUT | `/api/v1/admin/oneqr-modules/reorder` | `{ moduleIds: Guid[] }` |
| PATCH | `/api/v1/admin/oneqr-modules/{id}/activate` | |
| PATCH | `/api/v1/admin/oneqr-modules/{id}/deactivate` | |

**5 endpoint này KHÔNG thuộc repo `vlink-nexora-fe`.** Đã xác minh: repo không có route admin nào và không repository nào gọi `/api/v1/admin/` — khớp ghi chú trong design doc rằng system-admin panel nằm ở `frontend/` của repo backend. Nếu team muốn màn hình admin quản lý module definitions, đó là ticket riêng ở repo đó.

### Hệ quả với repo merchant (đã sửa)

Điều quan trọng nhất: **metadata module giờ là dữ liệu runtime, không phải hằng số biên dịch.** Admin sửa `label`, `icon`, `urlTemplate`, `allowedAudiences`, `isComingSoon`, `sortOrder`, bật/tắt — không cần release FE. Nên bảng `ONEQR_MODULE_CATALOG` trong `src/constants/oneQr.ts` bị **hạ vai trò**: không còn là nguồn sự thật, chỉ còn là (a) fallback khi server không trả catalog, (b) i18n label key + icon cho key đến thiếu field.

| Sửa | Chi tiết |
|---|---|
| **Bỏ sort theo bảng bundled** | Lần trước `mergeCatalog` sort catalog theo thứ tự bảng hardcode. Giờ `sortOrder` do admin quản lý → **giữ nguyên thứ tự server trả**. Đây là bug thật do bản sửa trước tạo ra. |
| `allowedAudiences` | Lấy từ server (admin đặt per-definition). Không còn giả định "luôn cả ba vai trò" — đó chỉ là *giá trị mặc định*, không phải quy tắc FE được phép suy ra. |
| Key bị admin tắt | `deactivate` → key vắng khỏi catalog → picker không hiện. Bảng bundled **không** được thêm lại (sẽ chào mời module không resolve được). |
| `unavailableReason` | Enum mới `OneQrModuleUnavailableReason`: `MissingTouchPoint`, `Disabled`, `MissingDefinition`, `MissingCustomUrl`, `InvalidTemplate`. Builder hiện **lý do cụ thể** thay vì "chưa dùng được" chung — mỗi lý do có cách sửa và chủ sở hữu khác nhau (merchant vs quản trị hệ thống). Lý do lạ → bỏ qua, không hiện tên enum thô cho merchant. |
| `isComingSoon` trên module | `OneQrModuleConfigDto` giờ có field này; đọc trực tiếp thay vì tra catalog. |
| `OneQrModuleKey` | BE đã đủ **20 key** — khớp FE, rủi ro 400 ở bản sửa trước không còn. |
| `OneQrModuleCatalogItemDto` | Đã có `isComingSoon` → bỏ nhánh fallback tạm. |
| `module-catalog?Audience=` | Param PascalCase, repository nhận tham số tùy chọn. |
| `download?format=png\|pdf` | `downloadQr(format)`. |
| `ToggleOneQrResponseDto` | Toggle **trả về** `{ id, isActive }` → toast báo đúng trạng thái server xác nhận, không đoán từ giá trị trước khi toggle. |
| `QrOneQrDto` | Đầy đủ `{ id, name, isActive, businessId, businessName, businessSlug }` → `QrOneQrRef` cập nhật theo. |

**Vẫn chưa dùng:** `GET /merchant/oneqr/analytics` (`?DateFrom=&DateTo=`) cho thanh KPI; `GET /merchant/oneqr/download` (đã có repository, UI vẫn tải qua ảnh QR ngoài); `POST /merchant/physical-cards/{cardCode}/link-oneqr` → nay có `LinkPhysicalCardToOneQrResponseDto { cardCode, linkedOneQrId, oneQrName, linkedAt }`, đủ contract để làm nhánh *ghi* của Luồng 5.

**Điểm cần Product/BA lưu ý:** nhãn module giờ do quản trị hệ thống nhập vào DB, nên **i18n của FE bị bỏ qua** khi BE trả `defaultLabel` (field non-nullable). Nếu cần nhãn đa ngôn ngữ cho khách Việt, `OneQrModuleDefinition` phải chứa nhãn theo từng ngôn ngữ — hiện chỉ có một cột `label`. FE vẫn giữ `t('oneqr.modules.*')` làm fallback khi `defaultLabel` rỗng.


**2026-08-31 (bổ sung 4) — Nhãn ô chức năng do FE sở hữu, tra i18n theo `moduleKey`.**

Quyết định: **không dùng `label` / `defaultLabel` từ BE làm nhãn hiển thị.** Lý do: `OneQrModuleDefinition` chỉ có **một cột `label`** — một ngôn ngữ duy nhất, do quản trị hệ thống nhập. Khách quét QR của tiệm Việt sẽ thấy ô tiếng Anh. Nhãn giờ dịch từ `moduleKey`.

**Thứ tự phân giải nhãn** (`src/components/oneqr/oneQrModuleLabel.ts`, dùng chung cho builder + trang khách):

1. `customLabel` — merchant tự đặt, luôn thắng;
2. `oneqr.modules.<ModuleKey>` trong `en.json` / `vi.json`;
3. `label` / `defaultLabel` từ BE — chỉ dùng khi FE chưa có bản dịch cho key đó;
4. `moduleKey` thô — để ô không bao giờ trống.

**Khóa locale đổi sang PascalCase khớp enum:** `oneqr.modules.check_in` → `oneqr.modules.CheckIn`, ... (20 khóa, cả 2 file). Lý do: khóa locale trùng đúng tên enum backend nên không cần lớp `labelKey` trung gian — đã **bỏ field `labelKey`** khỏi `OneQrModuleCatalogEntry`. Nhất quán với `oneqr.builder.unavailable.<Reason>` đã dùng PascalCase.

### ⚠️ QUY TẮC VẬN HÀNH MỚI

> **Khi Admin thêm một `OneQrModuleKey` mới, FE PHẢI thêm nhãn vào cả `src/locales/en.json` và `vi.json`** dưới `oneqr.modules`, dùng **đúng tên enum** (PascalCase).

Ba cơ chế bảo vệ đã dựng:

- **Không vỡ nếu quên:** rơi xuống bước 3 (nhãn của BE) → ô vẫn đọc được, chỉ là một ngôn ngữ.
- **Cảnh báo lúc dev:** `logger.warn` một lần cho mỗi key thiếu, kèm đúng câu lệnh cần làm (`Add "oneqr.modules.X" to ...`). Tự tắt ở production.
- **Test chặn:** `src/components/oneqr/oneQrModuleLabel.test.ts` chạy `it.each` qua **mọi** giá trị của `OneQrModuleKey` và fail nếu thiếu nhãn ở bất kỳ file nào; cũng chặn khóa snake_case còn sót và chặn trường hợp bản VI bị copy nguyên tiếng Anh.

### Ngoại lệ có chủ đích: `CustomLink`

`OneQrLandingModuleDto` chỉ có **một** field `label` đã gộp (`customLabel ?? definition.label`), FE không phân biệt được hai nguồn. Với `CustomLink` thì nhãn vốn là **chữ merchant nhập**, không có "nhãn hệ thống" nào để dịch — nên trên trang khách, label của `CustomLink` được truyền vào vị trí `customLabel` (bước 1), không phải `serverLabel`. Nếu ghi đè bằng locale thì mọi ô liên kết tùy chỉnh sẽ hiện "Liên kết tùy chỉnh" thay vì tên chương trình khuyến mãi merchant đặt. Trong builder không có vấn đề này vì `customLabel` và `defaultLabel` là hai field riêng.

**Đề xuất gửi BE (không chặn):** nếu `OneQrLandingModuleDto` tách `customLabel` khỏi `label` thì FE bỏ được ngoại lệ trên và luật trở nên thống nhất cho mọi key.


**2026-08-31 (bổ sung 5) — `ModuleKey` thành string tự do; tích hợp lại `GET /api/v1/merchant/oneqr`.**

Doc cập nhật quyết định 3c/3d/3e + Admin portal đã xong. Đối chiếu Swagger BE local (666 paths) và sửa FE theo.

### 🐞 Bug nghiêm trọng đã sửa: coerce `moduleKey` về `CustomLink`

Swagger xác nhận `moduleKey` giờ là **`string`** ở *tất cả* DTO: `OneQrModuleConfigDto`, `OneQrModuleCatalogItemDto`, `OneQrModuleInput`, `OneQrLandingModuleDto`. Enum `OneQrModuleKey` vẫn còn nhưng **không còn là kiểu của cột** — nó chỉ liệt kê module có sẵn (nguồn seeder + căn cứ `IsBuiltIn`).

FE trước đó có `toOneQrModuleKey()` map key lạ → `CustomLink`. Với module Admin tự thêm (vd `LoyaltyPoints`) thì:

1. builder hiện sai nhãn + sai icon (của Custom Link);
2. **khi Save, payload gửi `moduleKey: "CustomLink"`** → module gốc của merchant **biến mất**, thay bằng một ô Custom Link rỗng không có `customUrl` → chính nó lại thành `MissingCustomUrl`.

Đã bỏ hoàn toàn việc coerce: `toOneQrModuleKey` giờ chỉ `trim()`, giữ nguyên cả chữ hoa/thường vì key round-trip ngược lại API. Thêm `isBuiltInOneQrModuleKey()` cho các chỗ cần phân biệt.

### Các thay đổi contract khác đã tích hợp

| Thay đổi | FE làm gì |
|---|---|
| `urlTemplate` trên **cả** `OneQrModuleConfigDto` lẫn `OneQrModuleCatalogItemDto` | Thêm vào type + normalize. Giữ nguyên placeholder (`/booking/{businessSlug}`), song song với `resolvedUrl` đã thay biến |
| `AllowsMultiple` / `RequiresCustomUrl` **cố ý không thành cột** | Fallback suy từ `moduleKey === CustomLink`, khớp đúng cách BE derive |
| `isComingSoon` đã có trên catalog DTO | Bỏ nhánh fallback tạm |
| Cảnh báo thiếu i18n | Chỉ warn cho key **built-in**. Module Admin tự thêm không có bản dịch là bình thường (rơi xuống `defaultLabel`) — warn sẽ chỉ là nhiễu |

### `ONEQR_MODULE_DISABLED` — điểm 6 trong "cần TL xác nhận"

Doc cảnh báo: *"FE chưa update mà Admin tắt một module đang được đặt thì merchant sẽ bị kẹt: mọi lần Save (kể cả chỉ kéo-thả reorder) đều trả 400 cho tới khi họ tự bỏ ô đó."* Đã xử lý ba lớp:

1. **`toSaveModulesVars` loại các ô có `unavailableReason = Disabled`** khỏi payload — đúng hành vi BE kỳ vọng ở "FE mới". Chỉ loại `Disabled`; `MissingTouchPoint` và các lý do khác **vẫn được gửi** vì đó là tình huống merchant tự sửa được, loại đi sẽ xoá mất ô của họ.
2. **Banner cảnh báo trong panel** liệt kê tên các ô sẽ bị loại khi lưu — hàng module vẫn hiện (đúng chủ ý "merchant không tưởng là mất dữ liệu"), nhưng việc nó biến mất sau khi Save không còn là bất ngờ.
3. **Error code `ONEQR_MODULE_DISABLED`** vào `errorCodes.ts` + locale EN/VI, làm lưới an toàn cho trường hợp Admin tắt module *giữa lúc* merchant đang sửa dở.

### Chưa làm

- **Admin portal UI**: đã có ở repo backend (`frontend/src/pages/admin/OneQrModuleManagement.tsx`, route `/admin/oneqr-modules`). Ngoài phạm vi repo này — đã xác minh repo không có route admin nào.
- `GET /merchant/oneqr/analytics` cho thanh KPI; `GET /merchant/oneqr/download` (repository có, UI chưa dùng); `POST /physical-cards/{cardCode}/link-oneqr`.
- Tài liệu doc trỏ tới `../../ai-generated/api/oneqr-api.md` — **không có trong repo này**, nên chưa đối chiếu được. Nếu file đó mô tả gì khác Swagger thì cần gửi sang.

- **Lưu ý repo:** `pnpm lint:tokens` fail vì `scripts/verify-tokens.cjs` không tồn tại trong repo — lỗi có sẵn, không liên quan story này.

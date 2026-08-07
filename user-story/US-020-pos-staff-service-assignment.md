# US-020 · POS Staff Service Assignment (Owner Setup)

> File: `US-020-pos-staff-service-assignment.md` · 1 file = 1 story.

| | |
|---|---|
| **Trạng thái** | Integrated |
| **Ngày tạo** | 2026-07-16 |
| **Epic / Domain** | POS Owner Setup — Setup Staff |
| **OpenSpec change** | `—` (thêm 1 section mới vào màn `PosStaffProfileView.tsx` đã có sẵn từ US-019, reuse `usePosServices()`/`usePosCategories()` hiện có, không đụng shared layer auth/httpClient/context — cùng precedent OpenSpec-skip đã dùng ở US-014..US-019, dù thay đổi chạm ≥3 file) |
| **Test plan** | — (điền khi viết test) |

## Story

**Là** Business Owner (Merchant),
**tôi muốn** chọn dịch vụ mà 1 thợ được phép thực hiện — cụ thể từng dịch vụ, cả 1 category, hoặc toàn bộ dịch vụ — ngay trong màn hồ sơ POS của thợ đó,
**để** chỉ thợ đủ năng lực mới được hiển thị khi khách chọn dịch vụ đó lúc checkout.

Nguồn: `docs/business/pos/POS-Owner-Setup-Business.md`, workflow "Setup Staff" (bước 6); ticket kỹ thuật `vlink-nexora/docs/plan/tasks/pos/US-08-pos-staff-service-assignment.md` (backend Tasks 8.1–8.2 đã implement xong ở `vlink-nexora/backend`, phiên trước).

**Quyết định thiết kế quan trọng đã có sẵn ở ticket BE (khác BA doc gốc)**: BE **không** có khái niệm "loại assignment" (SpecificServices/WholeCategory/AllServices) — chỉ lưu 1 ma trận phẳng `PosServiceId[]`. FE tự "giải nén" lựa chọn category/all-services thành danh sách id cụ thể **tại thời điểm chọn** (pre-tick checklist), rồi gửi y hệt như tick từng dịch vụ riêng khi Save. Hệ quả: dịch vụ thêm mới vào category **sau khi** đã lưu không tự động áp dụng cho thợ đã gán category đó trước đây — Owner phải vào lại tick thủ công. Story này chỉ implement phần FE của thiết kế đã chốt này, không đổi lại hành vi BE.

## Acceptance Criteria

- **Given** Owner đã chọn 1 staff trong picker của `PosStaffProfileView` và staff đó **đã từng lưu** POS profile (Role/Pay/Tips) ít nhất 1 lần (`profile.posRoleId` khác null)
- **When** section "Service Assignment" (thứ 3, dưới "Role, Pay & Tips") load
- **Then** FE gọi `GET /api/v1/merchant/pos/staff-profiles/{businessStaffLinkId}/services`; hiển thị checklist tất cả `PosService` của salon (reuse `usePosServices()` đã fetch sẵn, không gọi API mới), tick sẵn đúng những service id có trong response

- **Given** staff đã chọn **chưa từng lưu** POS profile (`profile.posRoleId == null` — chưa có `PosStaffProfile` row, theo đúng "Phụ thuộc" của ticket BE)
- **When** Owner cuộn tới section "Service Assignment"
- **Then** section này hiển thị **disabled** kèm chú thích "Lưu Role, Pay & Tips trước" — không gọi `GET`/`PUT` services (BE sẽ trả `POS_STAFF_PROFILE_NOT_FOUND` nếu cố PUT lúc này, nhưng FE phải tự chặn UI trước, không dựa vào lỗi này, cùng nguyên tắc đã áp dụng ở US-019 cho case `TAXIQ_STAFF_TIN_ALREADY_SET`)

- **Given** Owner để nguyên chế độ mặc định "Cụ thể" (Specific)
- **When** Owner tick/untick từng dịch vụ trong checklist
- **Then** chỉ đúng checkbox đó đổi trạng thái — không có side-effect nào khác, chưa gọi API cho tới khi bấm Save

- **Given** Owner chuyển sang chế độ "Cả 1 category" và chọn 1 category từ dropdown
- **When** dropdown thay đổi giá trị
- **Then** checklist **được set lại toàn bộ** = đúng các dịch vụ `status: 'Active'` thuộc category đó (dữ liệu lấy từ `usePosServices()`/`usePosCategories()` đã fetch sẵn, lọc client-side theo `categoryIds.includes(selectedCategoryId)` và `status === 'Active'`) — ghi đè lựa chọn tick tay trước đó; Owner vẫn tick/untick thêm được sau khi preset xong, trước khi Save

- **Given** Owner chuyển sang chế độ "Tất cả dịch vụ" và bấm nút áp dụng
- **When** nút được bấm
- **Then** checklist được set lại toàn bộ = tất cả dịch vụ `status: 'Active'` của salon; Owner vẫn chỉnh tay được sau đó

- **Given** trong checklist có dịch vụ `status: 'Inactive'` mà thợ này **đã từng được gán trước đó** (còn trong response GET dù nay Inactive)
- **When** checklist render
- **Then** dịch vụ đó vẫn hiển thị (kèm badge "Inactive", làm mờ nhẹ) và vẫn đang tick sẵn — không bị ẩn/mất khỏi danh sách chỉ vì Inactive (tránh vô tình bỏ gán khi Save do FE lọc nhầm); preset "cả category"/"tất cả dịch vụ" **không** tự động tick các dịch vụ Inactive

- **Given** Owner đã điều chỉnh xong checklist (qua tick tay hoặc qua preset category/all)
- **When** Owner bấm "Save" ở section Service Assignment
- **Then** FE gọi `PUT /api/v1/merchant/pos/staff-profiles/{businessStaffLinkId}/services` với `{ posServiceIds: [...toàn bộ id đang tick...] }` — **không** gửi field "mode" nào (mode chỉ là state FE cho việc pre-tick); API trả `200 true`; cache `merchantPosStaffServiceAssignments(businessStaffLinkId)` invalidate; toast thành công

- **Given** Owner untick hết toàn bộ checklist rồi bấm Save
- **When** API nhận `{ posServiceIds: [] }`
- **Then** API vẫn trả `200 true` (BE cho phép danh sách rỗng — nghĩa là gỡ hết dịch vụ khỏi thợ này); FE không chặn Save khi checklist rỗng

- **Given** API trả lỗi khi Save (vd `POS_STAFF_SERVICE_ASSIGNMENT_SERVICE_INVALID` nếu có service id không thuộc business — về lý thuyết không nên xảy ra vì FE chỉ hiển thị service của chính business đang đăng nhập, nhưng vẫn cần xử lý phòng hờ; hoặc `POS_STAFF_LINK_NOT_ACTIVE` nếu link đổi trạng thái giữa lúc màn đang mở)
- **When** lỗi trả về
- **Then** FE hiển thị toast lỗi tương ứng, checklist giữ nguyên trạng thái đang chỉnh (không tự reset về server state, để Owner không mất thao tác vừa làm)

- **Given** Owner tạo 1 dịch vụ mới (`PosServicesView`, US-017) và gán nó vào ít nhất 1 category
- **When** tạo thành công
- **Then** (nice-to-have, không bắt buộc) toast thành công có thêm 1 dòng nhắc "Bạn có thể cần cập nhật lại phân công thợ cho dịch vụ này" — vì hệ thống không tự động áp dụng dịch vụ mới cho thợ đã gán "cả category"/"tất cả dịch vụ" trước đó

## API Mapping (bắt buộc trước khi integrate)

> Contract build cùng phiên trước ở `vlink-nexora/backend` (đã `dotnet build` xong, NSwag regenerate `specification.json`/`web-api-client.ts`) — **chưa deploy lên `test-api.nexoratouch.com`**, nên tag nguồn (L-local), giống US-014..US-019. Cần re-verify qua live Swagger sau khi BE deploy trước khi chuyển story sang Tested/Done.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/merchant/pos/staff-profiles/{businessStaffLinkId}/services` | Bearer (Merchant/Owner) | — | `200 Guid[]` (danh sách `PosServiceId` hiện đang gán); `[]` nếu chưa từng gán/chưa có profile; `400` nếu link không Active (`POS_STAFF_LINK_NOT_ACTIVE`); `404`/`400` nếu link không thuộc business (`STAFF_LINK_NOT_FOUND`) | L-local |
| PUT | `/api/v1/merchant/pos/staff-profiles/{businessStaffLinkId}/services` | Bearer | `{ posServiceIds: Guid[] }` — luôn là danh sách đầy đủ cuối cùng, thay thế toàn bộ ma trận, không phải diff | `200 boolean`; `400`: 1+ service id không thuộc business (`POS_STAFF_SERVICE_ASSIGNMENT_SERVICE_INVALID`), chưa có `PosStaffProfile` cho staff này (`POS_STAFF_PROFILE_NOT_FOUND` — FE phải tự chặn trước bằng AC #2 ở trên, không dựa vào lỗi này), link không Active (`POS_STAFF_LINK_NOT_ACTIVE`) | L-local |

**Điểm đã xác nhận qua `web-api-client.ts` vừa regenerate (local build, chưa phải live Swagger):**
- Response GET là mảng `string` (Guid) thuần, không bọc object — khớp field `PosServiceIds` trong `UpdateStaffServiceAssignmentRequestDto` cho PUT.
- Không có field "mode"/"assignmentType" nào trong request hay response — đúng như thiết kế "BE chỉ lưu ma trận phẳng" đã ghi trong ticket BE.
- BE không lọc theo `PosService.Status` — validate chỉ kiểm tra service thuộc đúng `BusinessId`, không quan tâm Active/Inactive. Việc chỉ pre-tick dịch vụ Active khi chọn "cả category"/"tất cả dịch vụ" là **hoàn toàn trách nhiệm FE**.

**Còn lại cần xác nhận khi integrate:** re-verify contract qua live Swagger sau khi BE deploy lên dev/test server (domain thật dùng `VITE_API_BASE_URL`, không hardcode).

## FE Surface (các layer sẽ đụng)

> Theo data boundary: components → data hooks → repositories → adapter.

| Layer | File | Thay đổi |
|---|---|---|
| Component | `src/components/dashboard/views/pos/PosStaffProfileView.tsx` (sửa) | Thêm section thứ 3 "Service Assignment" (cùng `nexora-card`, dưới "Role, Pay & Tips"), disabled khi `profile.posRoleId == null` kèm chú thích. Bên trong: 3-nút segmented control chọn mode (Specific/Category/All — state FE cục bộ `useState`, không gửi API); khi mode = Category thì hiện thêm `<select>` category (dữ liệu từ `usePosCategories()`); checklist phẳng tất cả service (`usePosServices()`), mỗi item 1 checkbox + badge "Inactive" nếu áp dụng, state `Set<string>` các id đang tick (khởi tạo từ `useStaffServiceAssignments` mỗi khi đổi staff, mirror `useEffect` pattern đã có trong file); nút Save riêng gọi `useSaveStaffServiceAssignments()` |
| Data hook | `src/data/hooks/usePosStaffProfile.ts` (sửa, thêm 2 hook) | `useStaffServiceAssignments(businessStaffLinkId)` (query, key `qk.merchantPosStaffServiceAssignments(businessStaffLinkId)`, `enabled: !!businessStaffLinkId`, `placeholderData: keepPreviousData` — cùng lý do jank-fix đã áp dụng cho `useStaffPosProfile`), `useSaveStaffServiceAssignments()` (mutation, invalidate `qk.merchantPosStaffServiceAssignments(businessStaffLinkId)`) |
| Repository | `src/data/repositories/posStaffProfile.ts` (sửa, thêm 2 hàm) | `getStaffServiceAssignments(businessStaffLinkId): Promise<string[]>` (GET), `saveStaffServiceAssignments(businessStaffLinkId, posServiceIds: string[]): Promise<boolean>` (PUT `{ posServiceIds }`) — không cần DTO type riêng vì response là mảng string thuần |
| Query key | `src/data/queryKeys.ts` | Thêm `merchantPosStaffServiceAssignments: (businessStaffLinkId?: string) => ['merchantSettings', 'posStaffServiceAssignments', businessStaffLinkId ?? '']`, đặt ngay sau `merchantPosStaffProfile` |
| Khác (nudge, nice-to-have) | `src/components/dashboard/views/pos/PosServicesView.tsx` | Thêm 1 dòng vào toast thành công của `handleCreateOrUpdate` khi service mới có ≥1 category — không bắt buộc theo ticket BE (Task 8.6 ghi "cân nhắc, không bắt buộc") |
| i18n | `src/locales/en.json`, `src/locales/vi.json` | Thêm vào `components.dashboard.views.pos.PosStaffProfileView.*`: `serviceAssignmentTitle`, `serviceAssignmentDisabledNotice`, `assignmentModeLabel`, `assignmentModeSpecific`, `assignmentModeCategory`, `assignmentModeAll`, `categoryPickerLabel`, `applyAllServicesButton`, `inactiveBadge`, `saveServices`, `servicesSavedSuccess`; thêm `errors.pos_staff_service_assignment_service_invalid`, `errors.pos_staff_profile_not_found`; thêm vào `PosServicesView.*`: `revisitAssignmentNudge` (nếu làm nudge) |
| Error mapping | `src/data/errorCodes.ts` | Map `POS_STAFF_SERVICE_ASSIGNMENT_SERVICE_INVALID` → `errors.pos_staff_service_assignment_service_invalid`, `POS_STAFF_PROFILE_NOT_FOUND` → `errors.pos_staff_profile_not_found` |

**Quyết định đã chốt (xác nhận 2026-07-16, qua AskUserQuestion, cả 2 theo phương án đề xuất):**
1. **Segmented control (3 nút), không phải `<select>`** cho assignment mode — khác với precedent "dùng select cho enum" ở US-019 (Contract Type/Pay Structure Type), vì mode ở đây không phải 1 giá trị được lưu/gửi lên BE mà là 1 hành động tức thời ("preset checklist"), nên cần hiển thị rõ ràng hơn 1 dropdown ẩn.
2. **Chọn category/all-services là hành động "ghi đè" (preset), không phải "cộng dồn"** — mỗi lần đổi category hoặc bấm "Tất cả dịch vụ" sẽ set lại **toàn bộ** checklist theo đúng tập Active tương ứng, xóa hết lựa chọn tick tay trước đó — **bao gồm cả các dịch vụ Inactive đang tick sẵn** (preset ghi đè hoàn toàn, không giữ ngoại lệ cho Inactive). Owner luôn tick/untick tay được sau khi preset để bổ sung lại nếu cần. Đây là cách đơn giản nhất khớp với tinh thần BA doc gốc (chọn 1 trong 3 kiểu, không phải kết hợp nhiều category).
3. **Dịch vụ Inactive đã từng gán vẫn hiển thị + vẫn tick sẵn trong checklist khi load ban đầu** (không ẩn khỏi danh sách) — để Owner nhìn thấy rõ trạng thái thật trước khi quyết định preset hay chỉnh tay; chỉ khi Owner **chủ động** áp dụng 1 preset (category/all) thì mới bị ghi đè theo quyết định #2.
4. **Section bị disable hoàn toàn (không cho tick/save) khi `profile.posRoleId == null`** — vì ticket BE liệt kê `PosStaffProfile` là điều kiện tiên quyết (Phụ thuộc), BE sẽ trả lỗi nếu gọi PUT trước khi profile tồn tại. FE chặn trước thay vì để lỗi xảy ra.

## Definition of Done

- [ ] AC pass trên môi trường dev (API thật — cần backend deploy trước, hiện chỉ chạy local)
- [ ] API call đúng contract đã map (method/status/payload — verify bằng network)
- [ ] Mutation invalidate đúng query cache (`qk.merchantPosStaffServiceAssignments(businessStaffLinkId)`)
- [ ] Không console error
- [ ] Test theo 3 layer (skill feature-focused-tester): L1 UI / L2 data boundary / L3 flow
- [ ] Cập nhật trạng thái file này + link TC

## Ghi chú phiên thực thi

- **FE code đã integrate xong (2026-07-16)**: tất cả layer trong FE Surface đã implement đúng như liệt kê:
  - `data/repositories/posStaffProfile.ts` (sửa): thêm `getStaffServiceAssignments(businessStaffLinkId)` (GET, trả `string[]`), `saveStaffServiceAssignments(businessStaffLinkId, posServiceIds)` (PUT).
  - `data/hooks/usePosStaffProfile.ts` (sửa): thêm `useStaffServiceAssignments()` (`placeholderData: keepPreviousData`, cùng lý do jank-fix của `useStaffPosProfile`), `useSaveStaffServiceAssignments()`.
  - `data/queryKeys.ts`: thêm `merchantPosStaffServiceAssignments(businessStaffLinkId)`.
  - `data/errorCodes.ts`: map `POS_STAFF_PROFILE_NOT_FOUND`, `POS_STAFF_SERVICE_ASSIGNMENT_SERVICE_INVALID`.
  - `components/dashboard/views/pos/PosStaffProfileView.tsx` (sửa): thêm section thứ 3 "Service Assignment" — 3-nút segmented control (Specific/Category/All, state FE cục bộ, reset về Specific mỗi khi đổi staff), category `<select>` khi mode=Category (preset ghi đè theo quyết định #2), nút "Apply" khi mode=All, checklist phẳng tất cả `PosService` (mỗi service hiện tên + tag category + badge Inactive nếu có), disable toàn bộ section kèm chú thích khi `profile.posRoleId == null` (chưa có `PosStaffProfile`).
  - `components/dashboard/views/pos/PosServicesView.tsx` (sửa, nice-to-have Task 8.6): toast thành công khi tạo service mới có ≥1 category giờ có thêm câu nhắc "revisit assignment".
  - i18n: `components.dashboard.views.pos.PosStaffProfileView.*` (10 key mới), `components.dashboard.views.pos.PosServicesView.revisitAssignmentNudge`, `errors.pos_staff_profile_not_found`, `errors.pos_staff_service_assignment_service_invalid` — cả `en.json` và `vi.json`.
- **Quyết định khi code thực tế** (khớp với 2 câu hỏi đã chốt qua AskUserQuestion trước khi code): preset category/all luôn **ghi đè hoàn toàn** `checkedServiceIds` (không cộng dồn, không giữ ngoại lệ cho Inactive đang tick sẵn); mode picker dùng segmented control 3 nút, không phải `<select>`.
- Verify đã chạy: `npx tsc --noEmit` (diff byte-for-byte 0 dòng so với baseline qua `git stash -u`, 123 lỗi pre-existing không đổi) + `npx vite build --mode production` (thành công, chỉ có warning chunk-size >900kB đã tồn tại từ trước).
- **Chưa làm được** (backend mới chỉ build local, chưa deploy lên dev/test server): AC pass trên môi trường dev với API thật, verify network trace, test 3-layer (feature-focused-tester), thao tác thử trên trình duyệt thật (chưa chạy `pnpm dev`), screenshot mobile 375px. Cần một phiên riêng sau khi backend deploy để hoàn tất các mục DoD còn lại và re-verify contract qua live Swagger trước khi chuyển status sang Tested/Done.

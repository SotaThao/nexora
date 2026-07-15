# US-017 · POS Services (Owner Setup)

> File: `US-017-pos-services.md` · 1 file = 1 story.

| | |
|---|---|
| **Trạng thái** | Integrated |
| **Ngày tạo** | 2026-07-15 |
| **Epic / Domain** | POS Owner Setup — Setup Services |
| **OpenSpec change** | `—` (CRUD trên 1 domain mới trong POS sidebar group đã có sẵn từ US-014; không đụng shared layer auth/httpClient/context — cùng precedent OpenSpec-skip đã dùng ở US-014/US-015/US-016) |
| **Test plan** | `docs/plan/tasks/pos/test-cases/US-05-pos-services-test.md` (repo `vlink-nexora`) |

## Story

**Là** Business Owner (Merchant),
**tôi muốn** thêm từng dịch vụ với tên, giá, thời lượng, gán category/tag, mô tả/ảnh, và bật/tắt trạng thái,
**để** có menu dịch vụ sẵn sàng cho checkout và booking sau này.

Nguồn: `docs/business/pos/POS-Owner-Setup-Business.md`, workflow "Setup Services"; ticket kỹ thuật `vlink-nexora/docs/plan/tasks/pos/US-05-pos-services.md` (backend Tasks 5.1–5.7 + bổ sung `GetPosTagsQuery` đã implement xong ở `vlink-nexora/backend`, cùng phiên).

## Acceptance Criteria

- **Given** Owner mở màn Services lần đầu
- **When** màn hình load
- **Then** FE gọi `GET /api/v1/merchant/pos/services`; hiển thị danh sách dịch vụ theo `displayOrder` tăng dần, kèm ảnh (nếu có), giá, thời lượng, category/tag chips, trạng thái Active/Inactive

- **Given** Owner bấm "Add Service" và điền tên, giá, thời lượng
- **When** Owner bấm Save (không chọn category/tag/ảnh)
- **Then** FE gọi `POST /api/v1/merchant/pos/services` (multipart/form-data: `name`, `price`, `durationMinutes`, `status`); API trả `201` + service id; service mới xuất hiện ở cuối danh sách với `Active` mặc định

- **Given** Owner bỏ trống tên, hoặc thời lượng = 0, hoặc giá âm
- **When** Owner bấm Save
- **Then** FE chặn submit ở client (validate cơ bản) trước khi gọi API; nếu vẫn lọt qua thì API trả `400` (`POS_SERVICE_NAME_REQUIRED` / `POS_SERVICE_DURATION_INVALID` / `POS_SERVICE_PRICE_INVALID`), FE hiển thị lỗi tương ứng

- **Given** Owner chọn nhiều category cho 1 service và nhập tag mới (chưa từng dùng)
- **When** Owner bấm Save
- **Then** FE gửi `categoryIds` (mảng) + `tags` (mảng) trong cùng request; service được gán đúng các category; tag mới tự động thêm vào catalog `PosTag` của Business (server-side, không cần FE gọi thêm API) — lần sau mở form Add Service khác, tag đó xuất hiện trong gợi ý autocomplete (`GET /api/v1/merchant/pos/tags`)

- **Given** Owner upload ảnh cho service (JPEG/PNG hợp lệ)
- **When** Owner bấm Save
- **Then** ảnh được gửi kèm trong cùng multipart request (field `photo`); response/GET sau đó trả về `photoUrl` mới, hiển thị đúng trong danh sách và trong modal edit

- **Given** Owner upload 1 file không phải ảnh (vd `.txt`) làm photo
- **When** Owner bấm Save
- **Then** API trả `400` (`POS_SERVICE_PHOTO_INVALID_TYPE` — xác thực bằng magic-byte signature qua `IImageValidationService`, không chỉ tin `Content-Type` client gửi lên); FE hiển thị lỗi tương ứng, service không được tạo/cập nhật

- **Given** Owner bấm nút bật/tắt Active/Inactive ngay trên danh sách (không mở modal)
- **When** Owner click checkbox trạng thái
- **Then** FE gọi `PUT /api/v1/merchant/pos/services/{serviceId}` với toàn bộ field hiện tại của service (giữ nguyên name/price/duration/category/tag, chỉ đổi `status`) — vì API Update là full-replace, không phải partial patch; service chuyển trạng thái ngay, **không** bị xóa khỏi danh sách (Inactive vẫn hiển thị, chỉ ẩn khỏi checkout/gán staff ở các tính năng sau này, ngoài scope story này)

- **Given** Owner sửa 1 service đang có category/tag/ảnh, và bỏ bớt 1 category
- **When** Owner bấm Save trong modal Edit
- **Then** FE gọi `PUT` với `categoryIds` mới (không còn category đã bỏ); server đồng bộ lại bảng nối `PosServiceCategory` (xóa link cũ, thêm link mới nếu có); ảnh cũ được giữ nguyên nếu Owner không chọn ảnh mới (FE không gửi field `photo` khi không có file mới)

- **Given** Owner kéo-thả để sắp xếp lại thứ tự service
- **When** Owner thả 1 service vào vị trí mới
- **Then** UI cập nhật thứ tự ngay (optimistic), FE gọi `PUT /api/v1/merchant/pos/services/reorder` với toàn bộ danh sách `{ serviceId, sortOrder }` theo thứ tự mới; nếu API lỗi thì rollback về thứ tự cũ và hiển thị lỗi

- **Given** màn hình Services
- **When** Owner mở sidebar
- **Then** mục "Services" xuất hiện trong sidebar group "POS", sau "Categories"

## API Mapping (bắt buộc trước khi integrate)

> Contract build cùng session ở `vlink-nexora/backend` (đã `dotnet build` xong, NSwag regenerate `specification.json`/`web-api-client.ts`) — **chưa deploy lên `test-api.nexoratouch.com`**, nên tag nguồn (L-local), giống cách US-014/US-015/US-016 đã làm. Cần re-verify qua live Swagger sau khi BE deploy trước khi chuyển story sang Tested/Done.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/merchant/pos/services` | Bearer (Merchant/Owner) | — | `200 PosServiceDto[]` — `{ id, name, price, durationMinutes, description?, photoUrl?, status: 'Active'\|'Inactive', displayOrder, categoryIds: Guid[], tags: string[] }`, sort theo `displayOrder` | L-local |
| POST | `/api/v1/merchant/pos/services` | Bearer | `multipart/form-data`: `name`, `price`, `durationMinutes`, `description?`, `categoryIds[]?`, `tags[]?`, `status`, `photo?` (file) | `201 Guid`; `400` nếu validation lỗi (xem danh sách mã lỗi bên dưới) | L-local |
| PUT | `/api/v1/merchant/pos/services/{serviceId}` | Bearer | `multipart/form-data` — cùng field như POST (full-replace, không phải partial patch) | `200 boolean`; `400` nếu validation lỗi; service không thuộc business → `POS_SERVICE_NOT_FOUND` | L-local |
| PUT | `/api/v1/merchant/pos/services/reorder` | Bearer | `{ items: [{ serviceId: Guid, sortOrder: number }] }` — full list, không trùng `serviceId` | `200` (no body); `400` nếu payload rỗng/trùng id; `403` nếu có service không thuộc business hiện tại | L-local |
| GET | `/api/v1/merchant/pos/tags` | Bearer | — | `200 PosTagDto[]` — `{ id, name }[]`, sort theo `name` — dùng làm nguồn autocomplete cho ô nhập tag | L-local (endpoint mới, bổ sung ngoài ticket BE gốc vì FE cần nguồn dữ liệu autocomplete) |

**Mã lỗi mới (POS Services)**: `POS_SERVICE_NOT_FOUND`, `POS_SERVICE_NAME_REQUIRED`, `POS_SERVICE_NAME_TOO_LONG` (200 ký tự), `POS_SERVICE_DESCRIPTION_TOO_LONG` (1000 ký tự), `POS_SERVICE_DURATION_INVALID` (phải > 0), `POS_SERVICE_PRICE_INVALID` (phải trong [0, 99999999.99]), `POS_SERVICE_TAG_TOO_LONG` (50 ký tự/tag), `POS_SERVICE_CATEGORY_INVALID` (category không thuộc business), `POS_SERVICE_PHOTO_INVALID_TYPE` (file không phải ảnh hợp lệ — kiểm tra bằng signature, không chỉ MIME type client gửi).

**Điểm đã xác nhận qua `specification.json` vừa regenerate (local build, chưa phải live Swagger):**
- `Status` serialize dưới dạng string (`"Active"` / `"Inactive"`), không phải số — xác nhận qua enum schema `PosServiceStatus` trong spec.
- Create/Update dùng `multipart/form-data`, không phải JSON — quyết định đã chốt với TL trước khi code (ảnh + field cấu trúc gửi cùng 1 request thay vì upload ảnh riêng rồi gửi URL).
- Update là full-replace: gửi thiếu field nào (vd không gửi lại `categoryIds` cũ) thì field đó bị ghi đè thành rỗng/mặc định — FE luôn phải gửi đầy đủ state hiện tại (kể cả khi chỉ đổi 1 field như status).
- `photo` không bắt buộc trên Update — nếu FE không đính kèm file mới, server giữ nguyên `photoUrl` cũ.

**Còn lại cần xác nhận khi integrate:** re-verify contract qua live Swagger sau khi BE deploy lên dev/test server (domain thật dùng `VITE_API_BASE_URL`, không hardcode).

## FE Surface (các layer sẽ đụng)

> Theo data boundary: components → data hooks → repositories → adapter.

| Layer | File | Thay đổi |
|---|---|---|
| Component | `src/components/dashboard/views/pos/PosServicesView.tsx` (mới) | Danh sách service dạng kéo-thả (dnd-kit, tái dùng cùng thư viện US-016), mỗi row có thumbnail, tên/giá/thời lượng, category+tag chips, checkbox bật/tắt Active/Inactive (gọi Update full-replace), nút Edit mở modal |
| Component | `src/components/dashboard/views/pos/modals/CreateEditPosServiceModal.tsx` (mới) | 1 modal dùng chung cho Create/Edit (prop `service` optional): tên, giá, thời lượng, mô tả, checklist nhiều category, ô nhập tag + `<datalist>` autocomplete từ `usePosTags`, upload ảnh (preview qua `URL.createObjectURL`), toggle Active/Inactive |
| Data hook | `src/data/hooks/usePosServices.ts` (mới) | `usePosServices()` (query, key `qk.merchantPosServices()`), `useCreatePosService()`, `useUpdatePosService()`, `useReorderPosServices()` (optimistic update + rollback theo `onMutate`/`onError`, cùng pattern US-016) |
| Data hook | `src/data/hooks/usePosTags.ts` (mới) | `usePosTags()` (query, key `qk.merchantPosTags()`) — nguồn autocomplete, không có mutation |
| Repository | `src/data/repositories/posServices.ts` (mới) | `getPosServices()`, `createPosService(input)`, `updatePosService(serviceId, input)`, `reorderPosServices(items)` — build `FormData` thủ công (name/price/durationMinutes/description/categoryIds[]/tags[]/status/photo), gọi `httpClient.upload()` |
| Repository | `src/data/repositories/posTags.ts` (mới) | `getPosTags()` — gọi thẳng `httpClient.get()` |
| Types | `src/types/repositories.ts` | `PosServiceApiDto { id, name, price, durationMinutes, description?, photoUrl?, status, displayOrder, categoryIds, tags }`, `PosServiceStatus = 'Active' \| 'Inactive'`, `PosTagApiDto { id, name }` |
| Query key | `src/data/queryKeys.ts` | Thêm `merchantPosServices`, `merchantPosTags` |
| Nav/Route | `src/components/dashboard/constants.tsx` | Thêm `{ id: 'services', label: 'Services' }` vào `children` của entry `pos` trong `MENU_ITEMS` (tự động có trong `POS_SUBMENU`) — không sửa `DashboardSidebar.tsx` (label tự resolve qua `t(\`dashboard.menu.pos_${sub.id}\`)`) |
| Route | `src/components/dashboard/routes/index.tsx`, `src/app/AppRouter.tsx` | `PosServicesRoute` (wrapper, không cần outlet context — không gate KYB, cùng lý do với `PosCategoriesRoute`) + `<Route path="pos/services" element={<PosServicesRoute />} />` |
| i18n | `src/locales/en.json`, `src/locales/vi.json` | `dashboard.menu.pos_services`; `components.dashboard.views.pos.PosServicesView.*`; `errors.pos_service_*` (9 key mới, khớp `errorCodes.ts`) |
| Error mapping | `src/data/errorCodes.ts` | Thêm 9 error code POS service mới → key `errors.pos_service_*` |

**Quyết định đã chốt (2026-07-15, xác nhận với TL trước khi code):**
1. Photo upload gộp trực tiếp vào Create/Update (multipart/form-data cùng field khác), **không** dùng flow upload-ảnh-riêng-rồi-gửi-URL như `updateBusinessLogo` — vì ticket backend (Task 5.4) chỉ định rõ dùng `IFileService.UploadFileAsync` với folder path riêng `pos/{businessId}/services/`.
2. Bổ sung `GetPosTagsQuery` + `GET /api/v1/merchant/pos/tags` ngoài phạm vi Backend task list gốc (5.1–5.7), vì AC autocomplete (Task 5.9) không thể hoạt động nếu không có endpoint đọc catalog `PosTag`.
3. Route `pos/services` không gate theo KYB/`verificationStatus` — cùng lý do với `pos/categories` (dữ liệu catalog/menu, không phải trường thông tin salon, không đụng payment processing).
4. Không có tính năng Delete Service trong ticket này (chỉ Active/Inactive) — không thêm nút Delete để tránh vượt phạm vi ticket.

## Definition of Done

- [ ] AC pass trên môi trường dev (API thật — cần backend deploy trước, hiện chỉ chạy local)
- [ ] API call đúng contract đã map (method/status/payload — verify bằng network, đặc biệt multipart form field names)
- [ ] Mutation invalidate đúng query cache (`qk.merchantPosServices()`, `qk.merchantPosTags()`)
- [ ] Optimistic reorder rollback đúng khi API lỗi (test bằng cách giả lập lỗi mạng)
- [ ] Upload ảnh: verify file thực sự lên S3 với path `pos/{businessId}/services/`, `photoUrl` trả về đúng và hiển thị được
- [ ] Không console error
- [ ] Test theo 3 layer (skill feature-focused-tester): L1 UI / L2 data boundary / L3 flow
- [ ] Screenshot mobile 375px cho modal Create/Edit (form nhiều field, theo Mobile-Responsive Modal rule trong CLAUDE.md)
- [ ] Cập nhật trạng thái file này + link TC

## Ghi chú phiên thực thi

- **FE code đã integrate xong (2026-07-15)**: tất cả layer trong FE Surface đã implement đúng như liệt kê.
- Modal Create/Edit dùng chung 1 component (`CreateEditPosServiceModal`) thay vì 2 component riêng — prop `service?: PosServiceApiDto | null` quyết định chế độ; submit luôn build lại toàn bộ `PosServiceInput` từ state hiện tại của form (khớp với API Update là full-replace).
- Bật/tắt Active/Inactive trực tiếp trên row (không cần mở modal) tái sử dụng helper `toServiceInput(service)` để build lại đầy đủ payload từ dữ liệu đã có, chỉ đổi `status` — tránh phải gọi thêm 1 endpoint PATCH riêng (không tồn tại) và tránh phải mở modal chỉ để đổi 1 field.
- Tag autocomplete dùng `<input list>` + `<datalist>` native (không cần thư viện combobox riêng) — đủ đáp ứng AC "gợi ý autocomplete", nhẹ và không thêm dependency mới.
- `nexora-modal-card` (cùng class US-015 `CreatePosRoleModal` dùng) đảm bảo modal responsive trên mobile theo rule trong CLAUDE.md — chưa tự verify bằng screenshot thực tế (xem DoD còn thiếu).
- Không thêm tính năng Delete Service — xác nhận đúng scope ticket BE gốc (chỉ Active/Inactive, không có `DeletePosServiceCommand`).
- Verify đã chạy:
  - `npx tsc --noEmit`: so với baseline trước khi có bất kỳ thay đổi POS nào — cùng 123 dòng lỗi, không có lỗi mới nào liên quan đến file POS Services/Tags vừa thêm (không dùng `git stash -u` lần này vì có thay đổi `package.json`/`.env.development` không liên quan đang pending từ phiên khác, tránh đụng vào).
  - `npx vite build --mode production`: build thành công (chunk-size warning cho `index-*.js` là pre-existing).
  - So sánh key i18n `en.json` vs `vi.json` bằng script Node thủ công: không có key `pos_service_*`/`PosServicesView.*` nào lệch giữa 2 file (7 lệch còn lại là pre-existing, không liên quan story này).
- **Chưa làm được** (backend mới chỉ build local, chưa deploy lên dev/test server): AC pass trên môi trường dev với API thật, verify network trace (method/status/payload, đặc biệt multipart field names), test 3-layer (feature-focused-tester), screenshot mobile 375px, verify hành vi kéo-thả + upload ảnh thực tế trên trình duyệt. Cần một phiên riêng sau khi backend deploy để hoàn tất các mục DoD còn lại và re-verify contract qua live Swagger trước khi chuyển status sang Tested/Done.

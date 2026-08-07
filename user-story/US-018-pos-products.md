# US-018 · POS Products (Owner Setup)

> File: `US-018-pos-products.md` · 1 file = 1 story.

| | |
|---|---|
| **Trạng thái** | Integrated |
| **Ngày tạo** | 2026-07-15 |
| **Epic / Domain** | POS Owner Setup — Setup Products |
| **OpenSpec change** | `—` (CRUD trên 1 domain mới trong POS sidebar group đã có sẵn từ US-014; không đụng shared layer auth/httpClient/context — cùng precedent OpenSpec-skip đã dùng ở US-014/US-015/US-016/US-017) |
| **Test plan** | `docs/plan/tasks/pos/test-cases/US-06-pos-products-test.md` (repo `vlink-nexora`) |

## Story

**Là** Business Owner (Merchant),
**tôi muốn** thêm sản phẩm bán lẻ với tên, giá, ảnh, gán category/tag, và bật/tắt trạng thái,
**để** sẵn sàng bán tại checkout POS.

Nguồn: `docs/business/pos/POS-Owner-Setup-Business.md`, workflow "Setup Products"; ticket kỹ thuật `vlink-nexora/docs/plan/tasks/pos/US-06-pos-products.md` (backend Tasks 6.1–6.4 đã implement xong ở `vlink-nexora/backend`, cùng phiên — mirror hệt US-05/US-017 Services, trừ không có `durationMinutes` và không có tính năng theo dõi tồn kho).

## Acceptance Criteria

- **Given** Owner mở màn Products lần đầu
- **When** màn hình load
- **Then** FE gọi `GET /api/v1/merchant/pos/products`; hiển thị danh sách sản phẩm theo `displayOrder` tăng dần, kèm ảnh (nếu có), giá, category/tag chips, trạng thái Active/Inactive

- **Given** Owner bấm "Add Product" và điền tên, giá
- **When** Owner bấm Save (không chọn category/tag/ảnh)
- **Then** FE gọi `POST /api/v1/merchant/pos/products` (multipart/form-data: `name`, `price`, `status`); API trả `201` + product id; product mới xuất hiện ở cuối danh sách với `Active` mặc định

- **Given** Owner bỏ trống tên, hoặc giá âm
- **When** Owner bấm Save
- **Then** FE chặn submit ở client (validate cơ bản) trước khi gọi API; nếu vẫn lọt qua thì API trả `400` (`POS_PRODUCT_NAME_REQUIRED` / `POS_PRODUCT_PRICE_INVALID`), FE hiển thị lỗi tương ứng

- **Given** Owner chọn nhiều category cho 1 product và nhập tag mới (chưa từng dùng)
- **When** Owner bấm Save
- **Then** FE gửi `categoryIds` (mảng) + `tags` (mảng) trong cùng request; product được gán đúng các category; tag mới tự động thêm vào catalog `PosTag` **chung của Business** (cùng catalog đã dùng cho Services, không tách riêng theo entity) — lần sau mở form Add Service hoặc Add Product khác, tag đó xuất hiện trong gợi ý autocomplete (`GET /api/v1/merchant/pos/tags`, tái sử dụng `usePosTags` đã có từ US-017)

- **Given** Owner upload ảnh cho product (JPEG/PNG hợp lệ)
- **When** Owner bấm Save
- **Then** ảnh được gửi kèm trong cùng multipart request (field `photo`); response/GET sau đó trả về `photoUrl` mới dưới path `pos/{businessId}/products/`, hiển thị đúng trong danh sách và trong modal edit

- **Given** Owner upload 1 file không phải ảnh (vd `.txt`) làm photo
- **When** Owner bấm Save
- **Then** API trả `400` (`POS_PRODUCT_PHOTO_INVALID_TYPE` — xác thực bằng magic-byte signature qua `IImageValidationService`, không chỉ tin `Content-Type` client gửi lên); FE hiển thị lỗi tương ứng, product không được tạo/cập nhật

- **Given** Owner bấm nút bật/tắt Active/Inactive ngay trên danh sách (không mở modal)
- **When** Owner click checkbox trạng thái
- **Then** FE gọi `PUT /api/v1/merchant/pos/products/{productId}` với toàn bộ field hiện tại của product (giữ nguyên name/price/category/tag, chỉ đổi `status`) — vì API Update là full-replace, không phải partial patch; product chuyển trạng thái ngay, **không** bị xóa khỏi danh sách (Inactive vẫn hiển thị lịch sử, chỉ ẩn khỏi checkout ở tính năng sau này, ngoài scope story này)

- **Given** Owner sửa 1 product đang có category/tag/ảnh, và bỏ bớt 1 category
- **When** Owner bấm Save trong modal Edit
- **Then** FE gọi `PUT` với `categoryIds` mới (không còn category đã bỏ); server đồng bộ lại bảng nối `PosProductCategory` (xóa link cũ, thêm link mới nếu có); ảnh cũ được giữ nguyên nếu Owner không chọn ảnh mới (FE không gửi field `photo` khi không có file mới)

- **Given** Owner kéo-thả để sắp xếp lại thứ tự product
- **When** Owner thả 1 product vào vị trí mới
- **Then** UI cập nhật thứ tự ngay (optimistic), FE gọi `PUT /api/v1/merchant/pos/products/reorder` với toàn bộ danh sách `{ productId, sortOrder }` theo thứ tự mới; nếu API lỗi thì rollback về thứ tự cũ và hiển thị lỗi

- **Given** màn hình Products
- **When** Owner mở sidebar
- **Then** mục "Products" xuất hiện trong sidebar group "POS", sau "Services"

## API Mapping (bắt buộc trước khi integrate)

> Contract build cùng session ở `vlink-nexora/backend` (`dotnet build` Application project: 0 warnings/0 errors; full-solution copy step không verify được do `Nexora.Web.exe` đang chạy dưới Visual Studio debugger — không phải lỗi biên dịch) — **chưa deploy lên `test-api.nexoratouch.com`**, nên tag nguồn (L-local), giống cách US-014/015/016/017 đã làm. Cần re-verify qua live Swagger sau khi BE deploy trước khi chuyển story sang Tested/Done.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/merchant/pos/products` | Bearer (Merchant/Owner) | — | `200 PosProductDto[]` — `{ id, name, price, description?, photoUrl?, status: 'Active'\|'Inactive', displayOrder, categoryIds: Guid[], tags: string[] }`, sort theo `displayOrder` | L-local |
| POST | `/api/v1/merchant/pos/products` | Bearer | `multipart/form-data`: `name`, `price`, `description?`, `categoryIds[]?`, `tags[]?`, `status`, `photo?` (file) | `201 Guid`; `400` nếu validation lỗi (xem danh sách mã lỗi bên dưới) | L-local |
| PUT | `/api/v1/merchant/pos/products/{productId}` | Bearer | `multipart/form-data` — cùng field như POST (full-replace, không phải partial patch) | `200 boolean`; `400` nếu validation lỗi; product không thuộc business → `POS_PRODUCT_NOT_FOUND` | L-local |
| PUT | `/api/v1/merchant/pos/products/reorder` | Bearer | `{ items: [{ productId: Guid, sortOrder: number }] }` — full list, không trùng `productId` | `200` (no body); `400` nếu payload rỗng/trùng id; `403` nếu có product không thuộc business hiện tại | L-local |
| GET | `/api/v1/merchant/pos/tags` | Bearer | — | `200 PosTagDto[]` — tái sử dụng endpoint đã có từ US-017, không tạo endpoint riêng cho Product | L-local (đã tồn tại) |

**Mã lỗi mới (POS Products)**: `POS_PRODUCT_NOT_FOUND`, `POS_PRODUCT_NAME_REQUIRED`, `POS_PRODUCT_NAME_TOO_LONG` (200 ký tự), `POS_PRODUCT_DESCRIPTION_TOO_LONG` (1000 ký tự), `POS_PRODUCT_PRICE_INVALID` (phải trong [0, 99999999.99]), `POS_PRODUCT_TAG_TOO_LONG` (50 ký tự/tag), `POS_PRODUCT_CATEGORY_INVALID` (category không thuộc business), `POS_PRODUCT_PHOTO_INVALID_TYPE` (file không phải ảnh hợp lệ).

**Điểm đã xác nhận (mirror từ US-017, cùng backend pattern):**
- `Status` serialize dưới dạng string (`"Active"` / `"Inactive"`), không phải số.
- Create/Update dùng `multipart/form-data`, không phải JSON (cùng quyết định ảnh gộp trực tiếp đã chốt ở US-017).
- Update là full-replace: FE luôn phải gửi đầy đủ state hiện tại (kể cả khi chỉ đổi 1 field như status).
- `photo` không bắt buộc trên Update — nếu FE không đính kèm file mới, server giữ nguyên `photoUrl` cũ.
- **Không có field `durationMinutes`** và **không có field tồn kho/stock** ở bất kỳ đâu trong contract — đúng theo AC ticket BE (US-06).

**Còn lại cần xác nhận khi integrate:** re-verify contract qua live Swagger sau khi BE deploy lên dev/test server (domain thật dùng `VITE_API_BASE_URL`, không hardcode).

## FE Surface (các layer sẽ đụng)

> Theo data boundary: components → data hooks → repositories → adapter.

| Layer | File | Thay đổi |
|---|---|---|
| Component | `src/components/dashboard/views/pos/PosProductsView.tsx` (mới) | Danh sách product dạng kéo-thả (dnd-kit, tái dùng cùng thư viện US-016/017), mỗi row có thumbnail, tên/giá (không có duration), category+tag chips, checkbox bật/tắt Active/Inactive (gọi Update full-replace), nút Edit mở modal |
| Component | `src/components/dashboard/views/pos/modals/CreateEditPosProductModal.tsx` (mới) | 1 modal dùng chung cho Create/Edit (prop `product` optional): tên, giá, mô tả, checklist nhiều category, ô nhập tag + `<datalist>` autocomplete từ `usePosTags` (tái dùng hook có sẵn), upload ảnh (preview qua `URL.createObjectURL`), toggle Active/Inactive |
| Data hook | `src/data/hooks/usePosProducts.ts` (mới) | `usePosProducts()` (query, key `qk.merchantPosProducts()`), `useCreatePosProduct()`, `useUpdatePosProduct()`, `useReorderPosProducts()` (optimistic update + rollback theo `onMutate`/`onError`, cùng pattern US-017) |
| Repository | `src/data/repositories/posProducts.ts` (mới) | `getPosProducts()`, `createPosProduct(input)`, `updatePosProduct(productId, input)`, `reorderPosProducts(items)` — build `FormData` thủ công (name/price/description/categoryIds[]/tags[]/status/photo, không có durationMinutes), gọi `httpClient.upload()` |
| Types | `src/types/repositories.ts` | `PosProductApiDto { id, name, price, description?, photoUrl?, status, displayOrder, categoryIds, tags }` (dùng lại `PosServiceStatus` cho `status` — cùng shape 'Active'\|'Inactive'), `PosTagApiDto` tái sử dụng nguyên trạng |
| Query key | `src/data/queryKeys.ts` | Thêm `merchantPosProducts` |
| Nav/Route | `src/components/dashboard/constants.tsx` | Thêm `{ id: 'products', label: 'Products' }` vào `children` của entry `pos` trong `MENU_ITEMS`, sau `services` (tự động có trong `POS_SUBMENU`) — không sửa `DashboardSidebar.tsx` |
| Route | `src/components/dashboard/routes/index.tsx`, `src/app/AppRouter.tsx` | `PosProductsRoute` (wrapper, không gate KYB, cùng lý do với `PosServicesRoute`/`PosCategoriesRoute`) + `<Route path="pos/products" element={<PosProductsRoute />} />` |
| i18n | `src/locales/en.json`, `src/locales/vi.json` | `dashboard.menu.pos_products`; `components.dashboard.views.pos.PosProductsView.*`; `errors.pos_product_*` (8 key mới, khớp `errorCodes.ts`) |
| Error mapping | `src/data/errorCodes.ts` | Thêm 8 error code POS product mới → key `errors.pos_product_*` |

**Quyết định đã chốt trước khi code (mirror US-017, không cần hỏi lại TL vì cùng precedent):**
1. Photo upload gộp trực tiếp vào Create/Update (multipart/form-data), không dùng flow upload-ảnh-riêng-rồi-gửi-URL — cùng lý do US-017 (Task 6.2 backend chỉ định `IFileService.UploadFileAsync` folder riêng `pos/{businessId}/products/`).
2. **Không** tạo `posTags.ts`/`usePosTags.ts` riêng cho Product — tái sử dụng nguyên trạng hook/repository đã có từ US-017, vì `PosTag` là catalog chung theo Business, không phân biệt nguồn gốc Service/Product (đã xác nhận ở tầng backend: cùng `PosTagHelper`, cùng bảng `PosTags`).
3. Route `pos/products` không gate theo KYB/`verificationStatus` — cùng lý do với `pos/categories`/`pos/services` (dữ liệu catalog/menu, không phải trường thông tin salon, không đụng payment processing).
4. Không có tính năng Delete Product, không có field tồn kho/stock — đúng scope ticket BE gốc (chỉ Active/Inactive).

## Definition of Done

- [ ] AC pass trên môi trường dev (API thật — cần backend deploy trước, hiện chỉ chạy local)
- [ ] API call đúng contract đã map (method/status/payload — verify bằng network, đặc biệt multipart form field names)
- [ ] Mutation invalidate đúng query cache (`qk.merchantPosProducts()`, `qk.merchantPosTags()`)
- [ ] Optimistic reorder rollback đúng khi API lỗi (test bằng cách giả lập lỗi mạng)
- [ ] Upload ảnh: verify file thực sự lên S3 với path `pos/{businessId}/products/`, `photoUrl` trả về đúng và hiển thị được
- [ ] Không console error
- [ ] Test theo 3 layer (skill feature-focused-tester): L1 UI / L2 data boundary / L3 flow
- [ ] Screenshot mobile 375px cho modal Create/Edit (form nhiều field, theo Mobile-Responsive Modal rule trong CLAUDE.md)
- [ ] Cập nhật trạng thái file này + link TC

## Ghi chú phiên thực thi

- **FE code đã integrate xong (2026-07-15)**: tất cả layer trong FE Surface đã implement đúng như liệt kê.
- Modal Create/Edit dùng chung 1 component (`CreateEditPosProductModal`) thay vì 2 component riêng — cùng pattern `CreateEditPosServiceModal`, prop `product?: PosProductApiDto | null` quyết định chế độ; submit luôn build lại toàn bộ `PosProductInput` từ state hiện tại của form (khớp với API Update là full-replace).
- Bật/tắt Active/Inactive trực tiếp trên row (không cần mở modal) tái sử dụng helper `toProductInput(product)` để build lại đầy đủ payload từ dữ liệu đã có, chỉ đổi `status` — cùng lý do với US-017 Services.
- Tag autocomplete dùng `<input list>` + `<datalist>` native, nguồn dữ liệu từ `usePosTags()` **tái sử dụng nguyên trạng** từ US-017 — không tạo repository/hook/endpoint riêng cho Product vì `PosTag` là catalog dùng chung theo Business ở tầng backend.
- `nexora-modal-card` (cùng class US-015/016/017 dùng) đảm bảo modal responsive trên mobile theo rule trong CLAUDE.md — chưa tự verify bằng screenshot thực tế (xem DoD còn thiếu).
- Không thêm tính năng Delete Product, không có field tồn kho/stock — xác nhận đúng scope ticket BE gốc (US-06, chỉ Active/Inactive).
- Verify đã chạy:
  - `npx tsc --noEmit`: 123 dòng lỗi, giống hệt baseline đã ghi nhận ở US-017 (không có lỗi mới nào liên quan file POS Products vừa thêm — xác nhận bằng grep riêng cho `posproduct`/`PosProductsView`/`usePosProducts`, không có match).
  - `npx vite build --mode production`: build thành công (exit 0), cùng chunk-size warning pre-existing cho `index-*.js`.
  - So sánh key i18n `en.json` vs `vi.json` bằng script Node thủ công: 8 key `errors.pos_product_*` khớp nhau, 23 key `PosProductsView.*` khớp nhau, `dashboard.menu.pos_products` có ở cả 2 file.
- **Chưa làm được** (backend mới chỉ build local — Application project 0 warnings/0 errors; full-solution copy step không verify được do `Nexora.Web.exe` đang chạy dưới Visual Studio debugger, chưa deploy lên dev/test server): AC pass trên môi trường dev với API thật, verify network trace (method/status/payload, đặc biệt multipart field names), test 3-layer (feature-focused-tester), screenshot mobile 375px, verify hành vi kéo-thả + upload ảnh thực tế trên trình duyệt. Cần một phiên riêng sau khi backend deploy để hoàn tất các mục DoD còn lại và re-verify contract qua live Swagger trước khi chuyển status sang Tested/Done.

# US-016 · POS Categories (Owner Setup)

> File: `US-016-pos-categories.md` · 1 file = 1 story.

| | |
|---|---|
| **Trạng thái** | Integrated |
| **Ngày tạo** | 2026-07-15 |
| **Epic / Domain** | POS Owner Setup — Setup Categories |
| **OpenSpec change** | `—` (CRUD trên 1 domain mới trong POS sidebar group đã có sẵn từ US-014; không đụng shared layer auth/httpClient/context — cùng precedent OpenSpec-skip đã dùng ở US-014/US-015) |
| **Test plan** | — (điền khi viết test) |

## Story

**Là** Business Owner (Merchant),
**tôi muốn** tạo category như "Manicures", "Pedicures", "Retail" và sắp xếp thứ tự hiển thị bằng kéo-thả,
**để** Service và Product dễ tìm và duyệt hơn.

Nguồn: `docs/business/pos/POS-Owner-Setup-Business.md`, workflow "Setup Categories"; ticket kỹ thuật `vlink-nexora/docs/plan/tasks/pos/US-04-pos-categories.md` (backend Tasks 4.1–4.5 đã implement xong ở `vlink-nexora/backend`, cùng phiên).

## Acceptance Criteria

- **Given** Owner mở màn Categories lần đầu (sau khi salon đã hoàn tất onboarding)
- **When** màn hình load
- **Then** FE gọi `GET /api/v1/merchant/pos/categories`; hiển thị danh sách category theo `displayOrder` tăng dần — mặc định salon đã có sẵn 10 category seed (Manicures, Pedicures, Dipping Powder, Acrylic Nails, Gel Extensions, Nail Art, Add-ons, Removals, Kids Menu, Waxing & Beauty) nếu chưa từng xóa/thêm gì

- **Given** Owner bấm "Add Category" và nhập tên
- **When** Owner bấm Save
- **Then** FE gọi `POST /api/v1/merchant/pos/categories` với `{ name }`; API trả `201` + category id; category mới xuất hiện ở **cuối** danh sách

- **Given** Owner nhập tên category rỗng hoặc dài hơn 100 ký tự
- **When** Owner bấm Save
- **Then** API trả `400` (`POS_CATEGORY_NAME_REQUIRED` / `POS_CATEGORY_NAME_TOO_LONG`); FE hiển thị lỗi tương ứng, không thêm category vào danh sách

- **Given** Owner kéo-thả để sắp xếp lại thứ tự category
- **When** Owner thả một category vào vị trí mới
- **Then** UI cập nhật thứ tự ngay (optimistic), FE gọi `PUT /api/v1/merchant/pos/categories/reorder` với toàn bộ danh sách `{ categoryId, sortOrder }` theo thứ tự mới; nếu API lỗi thì rollback về thứ tự cũ và hiển thị lỗi

- **Given** category không có khái niệm Active/Inactive (theo BA doc)
- **When** Owner xem danh sách category
- **Then** UI không hiển thị bất kỳ toggle/badge trạng thái nào trên category — muốn ẩn item khỏi khách hàng thì Owner chỉnh trực tiếp ở Service/Product (ngoài scope story này)

- **Given** Owner bấm Delete trên 1 category còn Service hoặc Product đang tham chiếu
- **When** FE gọi `DELETE /api/v1/merchant/pos/categories/{categoryId}`
- **Then** API trả `400` (`POS_CATEGORY_IN_USE`); FE hiển thị lỗi tương ứng, category không bị xóa khỏi danh sách

- **Given** Owner bấm Delete trên 1 category không còn Service/Product nào tham chiếu
- **When** FE gọi `DELETE /api/v1/merchant/pos/categories/{categoryId}`
- **Then** API trả `200 true`; category biến mất khỏi danh sách sau khi cache invalidate

- **Given** Owner bấm nút Edit trên 1 category (bổ sung sau khi review FE — ticket gốc không có)
- **When** Owner sửa tên và bấm Save (hoặc Enter)
- **Then** FE gọi `PUT /api/v1/merchant/pos/categories/{categoryId}` với `{ name }`; API trả `200 true`; tên mới hiển thị ngay tại đúng vị trí cũ (không đổi thứ tự); nếu tên rỗng hoặc quá dài thì hiển thị lỗi tương ứng (`POS_CATEGORY_NAME_REQUIRED`/`POS_CATEGORY_NAME_TOO_LONG`), không lưu

- **Given** Owner gõ vào ô tìm kiếm phía trên danh sách (bổ sung sau khi review FE — thuần client-side, không gọi API mới)
- **When** Owner gõ 1 từ khóa
- **Then** danh sách chỉ hiển thị category có tên chứa từ khóa (không phân biệt hoa/thường); không có kết quả nào thì hiển thị thông báo rỗng riêng; kéo-thả bị vô hiệu hóa trong khi có từ khóa lọc

- **Given** Owner chọn chế độ Sort khác "Custom" (Name A-Z / Name Z-A)
- **When** Owner chọn 1 chế độ sort
- **Then** danh sách hiển thị lại theo thứ tự đã chọn — **chỉ ở tầng hiển thị**, không gọi API reorder, không đổi `displayOrder` đã lưu; kéo-thả bị vô hiệu hóa khi không ở chế độ "Custom"; chọn lại "Custom" thì danh sách trở về đúng thứ tự kéo-thả đã lưu trước đó

## API Mapping (bắt buộc trước khi integrate)

> Contract build cùng session ở `vlink-nexora/backend` (đã `dotnet build` xong, NSwag regenerate `specification.json`/`web-api-client.ts`) — **chưa deploy lên `test-api.nexoratouch.com`**, nên tag nguồn (L-local), giống cách US-014/US-015 đã làm. Cần re-verify qua live Swagger sau khi BE deploy trước khi chuyển story sang Tested/Done.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/merchant/pos/categories` | Bearer (Merchant/Owner) | — | `200 PosCategoryDto[]` — mỗi item `{ id, name, displayOrder }`, đã sort theo `displayOrder` | L-local |
| POST | `/api/v1/merchant/pos/categories` | Bearer | `{ name: string }` (maxLength 100) | `201 Guid` (id category mới); `400` nếu tên rỗng/quá dài (`POS_CATEGORY_NAME_REQUIRED`/`POS_CATEGORY_NAME_TOO_LONG`) | L-local |
| PUT | `/api/v1/merchant/pos/categories/reorder` | Bearer | `{ items: [{ categoryId: Guid, sortOrder: number }] }` — full list, không được trùng `categoryId` | `200` (no body); `400` nếu payload rỗng/trùng id; `403` nếu có category không thuộc business hiện tại | L-local |
| PUT | `/api/v1/merchant/pos/categories/{categoryId}` | Bearer | `{ name: string }` (maxLength 100) | `200 boolean`; `400` nếu tên rỗng/quá dài; category không tồn tại/không thuộc business → `POS_CATEGORY_NOT_FOUND` (bổ sung sau khi review FE, không có trong ticket BE gốc) | L-local |
| DELETE | `/api/v1/merchant/pos/categories/{categoryId}` | Bearer | — | `200 boolean`; `400` nếu còn Service/Product tham chiếu (`POS_CATEGORY_IN_USE`); category không tồn tại/không thuộc business → `POS_CATEGORY_NOT_FOUND` | L-local |

**Điểm đã xác nhận qua `specification.json` vừa regenerate (local build, chưa phải live Swagger):**
- Toàn bộ field DTO camelCase (`displayOrder`, `categoryId`, `sortOrder`).
- `ReorderPosCategoriesCommand` có 1 field `items: CategoryOrderItem[]`, mỗi item `{ categoryId, sortOrder }` — không kèm field nào khác.
- `CreatePosCategoryCommand` chỉ có `{ name }` — server tự gán `displayOrder` (append cuối danh sách), FE không gửi field này khi tạo.
- Reorder trả `200` không có body (`void`), không phải `200 boolean` như role/delete.

**Còn lại cần xác nhận khi integrate:** re-verify contract qua live Swagger sau khi BE deploy lên dev/test server (domain thật dùng `VITE_API_BASE_URL`, không hardcode).

## FE Surface (các layer sẽ đụng)

> Theo data boundary: components → data hooks → repositories → adapter.

| Layer | File | Thay đổi |
|---|---|---|
| Component | `src/components/dashboard/views/pos/PosCategoriesView.tsx` (mới) | Danh sách category dạng kéo-thả (dnd-kit `SortableContext`), ô input + nút "Add Category" ở trên cùng, nút Edit inline trên mỗi item (bấm → input + Save/Cancel ngay tại chỗ, không phải modal, không liên quan drag-and-drop — bổ sung sau khi review FE), nút Delete trên mỗi item (confirm trước khi xóa qua `showConfirm`), không có badge/toggle trạng thái nào |
| Data hook | `src/data/hooks/usePosCategories.ts` (mới) | `usePosCategories()` (query, key `qk.merchantPosCategories()`), `useCreatePosCategory()`, `useUpdatePosCategory()` (bổ sung), `useReorderPosCategories()` (optimistic update + rollback theo `onMutate`/`onError`), `useDeletePosCategory()` — tất cả invalidate `qk.merchantPosCategories()` |
| Repository | `src/data/repositories/posCategories.ts` (mới) | `getPosCategories()`, `createPosCategory(name)`, `updatePosCategory(categoryId, name)` (bổ sung), `reorderPosCategories(items)`, `deletePosCategory(categoryId)` — gọi thẳng `httpClient` |
| Types | `src/types/repositories.ts` | `PosCategoryApiDto { id, name, displayOrder }` |
| Query key | `src/data/queryKeys.ts` | Thêm `merchantPosCategories: () => ['merchantSettings', 'posCategories']` |
| Nav/Route | `src/components/dashboard/constants.tsx` | Thêm `{ id: 'categories', label: 'Categories' }` vào `children` của entry `pos` trong `MENU_ITEMS` (tự động có trong `POS_SUBMENU`) |
| Route | `src/components/dashboard/routes/index.tsx`, `src/app/AppRouter.tsx` | `PosCategoriesRoute` (wrapper, không cần outlet context vì view không phụ thuộc KYB) + `<Route path="pos/categories" element={<PosCategoriesRoute />} />` |
| i18n | `src/locales/en.json`, `src/locales/vi.json` | `dashboard.menu.pos_categories`; `components.dashboard.views.pos.PosCategoriesView.*`; `errors.pos_category_not_found`, `errors.pos_category_name_required`, `errors.pos_category_name_too_long`, `errors.pos_category_in_use` |
| Error mapping | `src/data/errorCodes.ts` | Thêm 4 error code POS category ở trên → key `errors.pos_*` |
| Dependency | `package.json` | Thêm `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` — repo hiện **chưa có** thư viện drag-and-drop nào (đã kiểm tra `package.json`), đây là lựa chọn duy nhất cần quyết định trước khi code (xem câu hỏi bên dưới) |

**Quyết định đã chốt (2026-07-15):**
1. Dùng `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` làm thư viện drag-and-drop.
2. Route `pos/categories` **không** cần `verificationStatus`/KYB gate — category là dữ liệu catalog/menu, không phải trường thông tin salon và không đụng payment processing.

## Definition of Done

- [ ] AC pass trên môi trường dev (API thật — cần backend deploy trước, hiện chỉ chạy local)
- [ ] API call đúng contract đã map (method/status/payload — verify bằng network)
- [ ] Mutation invalidate đúng query cache (`qk.merchantPosCategories()`)
- [ ] Optimistic reorder rollback đúng khi API lỗi (test bằng cách giả lập lỗi mạng)
- [ ] Không console error
- [ ] Test theo 3 layer (skill feature-focused-tester): L1 UI / L2 data boundary / L3 flow
- [ ] Cập nhật trạng thái file này + link TC

## Ghi chú phiên thực thi

- **FE code đã integrate xong (2026-07-15)**: tất cả layer trong FE Surface đã implement đúng như liệt kê — `posCategories.ts` (repository), `usePosCategories.ts` (query + `useCreatePosCategory`/`useReorderPosCategories`/`useDeletePosCategory`), `PosCategoriesView.tsx` (component, dùng `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`), `PosCategoryApiDto` (type), `qk.merchantPosCategories()`, `POS_SUBMENU` entry `categories`, `PosCategoriesRoute` + `<Route path="pos/categories">`, i18n (`dashboard.menu.pos_categories`, `components.dashboard.views.pos.PosCategoriesView.*`, `errors.pos_category_*` × 4).
- Reorder dùng **optimistic update**: `useReorderPosCategories`'s `onMutate` snapshots the previous list and immediately re-sorts the cache so the drag feels instant; `onError` rolls back to the snapshot and shows a toast (`reorderFailed`); `onSettled` invalidates to reconcile with the server. Local component state (`items`) mirrors the query cache so `arrayMove` from `@dnd-kit/sortable` can update the UI synchronously during drag, then syncs back via `useEffect` whenever the query data changes.
- Không dùng modal cho "Add Category" — khác với `CreatePosRoleModal`, ở đây dùng 1 input + button inline ngay trên đầu danh sách, vì BA doc mô tả đây là thao tác 1 bước rất đơn giản ("ô thêm category mới"), không cần tách màn hình riêng.
- **Bổ sung sau khi review FE (2026-07-15)**: TL phát hiện thiếu tính năng sửa tên category (ticket BE gốc US-04 không có API update). Đã thêm `UpdatePosCategoryCommand`/`PUT /api/v1/merchant/pos/categories/{categoryId}` ở backend, và edit inline (nút Edit → input + Save/Cancel ngay tại row, Enter để save/Escape để hủy) ở FE — theo yêu cầu rõ ràng "chỉ cần hiện bình thường không cần drag drop", nghĩa là edit là 1 thao tác độc lập, không cần tích hợp với cơ chế kéo-thả (grip handle bị disable trong lúc đang edit để tránh xung đột thao tác).
- **Bổ sung sort/filter (2026-07-15, cùng phiên)**: thêm ô tìm kiếm theo tên (client-side, không có endpoint mới) và dropdown Sort (Custom/Name A-Z/Name Z-A). Quyết định đã xác nhận với TL trước khi code: Sort chỉ là **view-only** — không bao giờ gọi API reorder, chọn lại "Custom" khôi phục đúng thứ tự kéo-thả đã lưu. Kéo-thả bị vô hiệu hóa bất cứ khi nào `sortMode !== 'custom'` hoặc có từ khóa tìm kiếm đang hoạt động, vì việc kéo-thả một danh sách đã bị sắp xếp lại/lọc bớt sẽ không map đúng về index của mảng `items` gốc mà API reorder cần. Component tách thành `SortableCategoryRow` (dùng trong `DndContext`/`SortableContext` khi `isReorderable`) và `StaticCategoryRow` (danh sách phẳng khi không), dùng chung `CategoryRowBody`/`CategoryRowShell` để tránh lặp code edit/delete.
- Không có badge/toggle trạng thái nào trên category row (đúng AC — category không có Active/Inactive).
- Route `pos/categories` không lấy `verificationStatus` từ outlet context (không gate theo KYB) — quyết định đã chốt trước khi code (xem "Quyết định đã chốt" ở trên).
- Verify đã chạy:
  - `npx tsc --noEmit`: so sánh trước/sau bằng `git stash -u` — output **giống hệt byte-for-byte** (123 dòng, `diff` rỗng) trước và sau, không có lỗi TS mới phát sinh từ story này.
  - `npx vite build --mode production`: build thành công (chunk-size warning cho `index-*.js` >900kB là pre-existing, không liên quan thay đổi này).
- **Chưa làm được** (backend mới chỉ build local, chưa deploy lên dev/test server): AC pass trên môi trường dev với API thật, verify network trace (method/status/payload), test 3-layer (feature-focused-tester), screenshot mobile 375px, verify hành vi kéo-thả thực tế trên trình duyệt (chỉ mới verify qua build/typecheck, chưa chạy `pnpm dev` và thao tác thử). Cần một phiên riêng sau khi backend deploy để hoàn tất các mục DoD còn lại và re-verify contract qua live Swagger trước khi chuyển status sang Tested/Done.

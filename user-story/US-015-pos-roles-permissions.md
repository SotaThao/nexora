# US-015 · POS Roles & Permissions (Owner Setup)

> File: `US-015-pos-roles-permissions.md` · 1 file = 1 story.

| | |
|---|---|
| **Trạng thái** | Integrated |
| **Ngày tạo** | 2026-07-15 |
| **Epic / Domain** | POS Owner Setup — Setup Roles & Permissions |
| **OpenSpec change** | `—` (CRUD trên 1 domain mới trong POS sidebar group đã có sẵn từ US-014; không đụng shared layer auth/httpClient/context — cùng precedent OpenSpec-skip đã dùng ở US-014) |
| **Test plan** | — (điền khi viết test) |

## Story

**Là** Business Owner (Merchant),
**tôi muốn** xem 4 role POS mặc định (Owner/Manager/Technician/Front Desk), bật/tắt permission cho từng role, và tạo thêm role tùy chỉnh,
**để** kiểm soát chính xác nhân viên nào được làm gì trong POS — đồng thời không ai ngoài tôi có thể tự cấp quyền quản lý role cho bản thân.

Nguồn: `docs/business/pos/POS-Owner-Setup-Business.md`, workflow "Setup Roles & Permissions"; ticket kỹ thuật `vlink-nexora/docs/plan/tasks/pos/US-03-pos-roles-permissions.md` (backend Tasks 3.1–3.6 đã implement xong ở `vlink-nexora/backend`, cùng session).

## Acceptance Criteria

- **Given** Owner mở màn Roles & Permissions lần đầu (sau khi salon đã hoàn tất onboarding)
- **When** màn hình load
- **Then** FE gọi `GET /api/v1/merchant/pos/roles`; hiển thị đúng 4 role mặc định (Owner, Manager, Technician, Front Desk), Owner có mọi permission đã tick sẵn và không cho sửa; 3 role còn lại chưa tick permission nào

- **Given** Owner đang xem 1 role không phải Owner (Manager/Technician/Front Desk/role tùy chỉnh), permission được nhóm theo area (Salon Settings, Categories, Services, Products, Staff, Roles & Permissions)
- **When** Owner tick/untick 1 hoặc nhiều permission rồi bấm Save
- **Then** FE gọi `PUT /api/v1/merchant/pos/roles/{roleId}/permissions` với đủ danh sách `permissionDefinitionIds` đang tick; API trả `200 true`; cache role list được invalidate và UI cập nhật theo response mới

- **Given** Owner đang xem checklist permission của 1 role không phải Owner
- **When** UI render permission "Manage Roles & Permissions" (khu vực Roles & Permissions)
- **Then** checkbox này **luôn bị disable/ẩn** cho role không phải Owner — không gửi được trong payload dù người dùng cố tình thao tác qua devtools (BE vẫn chặn ở tầng API với `POS_PERMISSION_OWNER_ONLY` làm lưới an toàn cuối)

- **Given** Owner bấm "Add Role" và nhập tên role mới
- **When** Owner bấm Save
- **Then** FE gọi `POST /api/v1/merchant/pos/roles` với `{ name }`; API trả `201` + role id; role mới xuất hiện trong danh sách, không permission nào được tick sẵn

- **Given** Owner nhập tên role trùng với role đã tồn tại trong cùng salon (kể cả tên 1 trong 4 role mặc định)
- **When** Owner bấm Save
- **Then** API trả `400`, error code `POS_ROLE_NAME_DUPLICATE`; FE hiển thị lỗi tương ứng, không thêm role mới vào danh sách

- **Given** Owner bấm Delete trên 1 role còn `PosStaffProfile` đang gán (backend trả `POS_ROLE_IN_USE`) hoặc bấm Delete trên role Owner (backend luôn trả `POS_CANNOT_DELETE_OWNER_ROLE`)
- **When** FE gọi `DELETE /api/v1/merchant/pos/roles/{roleId}`
- **Then** API trả `400`; FE hiển thị lỗi tương ứng, role không bị xóa khỏi danh sách. Nút Delete cho role Owner nên bị ẩn/disable ở UI ngay từ đầu (không đợi lỗi 400) vì đây là rule tuyệt đối, không phụ thuộc dữ liệu

- **Given** Owner bấm Delete trên 1 role không phải Owner và không còn staff nào gán
- **When** FE gọi `DELETE /api/v1/merchant/pos/roles/{roleId}`
- **Then** API trả `200 true`; role biến mất khỏi danh sách sau khi cache invalidate

## API Mapping (bắt buộc trước khi integrate)

> Contract build cùng session ở `vlink-nexora/backend` (đã `dotnet build` xong, NSwag regenerate `specification.json`/`web-api-client.ts`) — **chưa deploy lên `test-api.nexoratouch.com`**, nên tag nguồn (L-local), giống cách US-014 đã làm. Cần re-verify qua live Swagger sau khi BE deploy trước khi chuyển story sang Tested/Done.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/merchant/pos/roles` | Bearer (Merchant/Owner) | — | `200 PosRoleDto[]` — mỗi role có `id, name, isSystemDefault, isOwnerRole, permissionAreas: [{ area, permissions: [{ id, key, displayName, description, isOwnerOnly, isGranted }] }]` | L-local |
| POST | `/api/v1/merchant/pos/roles` | Bearer | `{ name: string }` (maxLength 100) | `201 Guid` (id role mới); `400` nếu tên rỗng/quá dài/trùng | L-local |
| PUT | `/api/v1/merchant/pos/roles/{roleId}/permissions` | Bearer | `{ permissionDefinitionIds: Guid[] }` — full-replace toàn bộ permission của role | `200 boolean`; `400` nếu: role không tồn tại (`POS_ROLE_NOT_FOUND`), role là Owner (`POS_CANNOT_EDIT_OWNER_ROLE_PERMISSIONS`), chứa permission `isOwnerOnly` (`POS_PERMISSION_OWNER_ONLY`), permission id không tồn tại (`POS_PERMISSION_DEFINITION_NOT_FOUND`) | L-local |
| DELETE | `/api/v1/merchant/pos/roles/{roleId}` | Bearer | — | `200 boolean`; `400` nếu là role Owner (`POS_CANNOT_DELETE_OWNER_ROLE`) hoặc còn staff gán (`POS_ROLE_IN_USE`) | L-local |

**Điểm đã xác nhận qua `specification.json` vừa regenerate (local build, chưa phải live Swagger):**
- `PosPermissionArea` serialize dạng string enum: `"SalonSettings" | "Categories" | "Services" | "Products" | "Staff" | "RolesPermissions"` (không phải số).
- Toàn bộ field DTO là camelCase (`isOwnerOnly`, `isGranted`, `permissionAreas`, `permissionDefinitionIds`...).
- `UpdateRolePermissionsRequestDto` chỉ có 1 field `permissionDefinitionIds` (không kèm `roleId` trong body — `roleId` nằm ở route).
- Permission "Manage Roles & Permissions" có `key = "manage_roles_permissions"`, `isOwnerOnly = true` — đây là permission duy nhất có `isOwnerOnly = true` trong 6 permission đã seed.

**Còn lại cần xác nhận khi integrate:** re-verify contract qua live Swagger sau khi BE deploy lên dev/test server (domain thật dùng `VITE_API_BASE_URL`, không hardcode).

## FE Surface (các layer sẽ đụng)

> Theo data boundary: components → data hooks → repositories → adapter.

| Layer | File | Thay đổi |
|---|---|---|
| Component | `src/components/dashboard/views/pos/PosRolesView.tsx` (mới) | Danh sách role (card/table), checklist permission nhóm theo `area`, checkbox "Manage Roles & Permissions" disable/ẩn khi `role.isOwnerRole === false`, toàn bộ checklist disable khi `role.isOwnerRole === true` (Owner luôn full quyền, không sửa được), nút "Add Role" mở modal nhập tên, nút Delete ẩn cho role Owner |
| Component | `src/components/dashboard/views/pos/modals/CreatePosRoleModal.tsx` (mới, nếu tách riêng modal) | Form nhập tên role mới, gọi `useCreatePosRole()` |
| Data hook | `src/data/hooks/usePosRoles.ts` (mới) | `usePosRoles()` (query, key `qk.merchantPosRoles()`), `useCreatePosRole()`, `useUpdateRolePermissions()`, `useDeletePosRole()` (mutations, đều invalidate `qk.merchantPosRoles()`) |
| Repository | `src/data/repositories/posRoles.ts` (mới) | `getPosRoles()`, `createPosRole(name)`, `updateRolePermissions(roleId, permissionDefinitionIds)`, `deletePosRole(roleId)` — gọi thẳng `httpClient`, không cần normalize nhiều vì response đã camelCase sẵn |
| Types | `src/types/repositories.ts` | `PosRoleApiDto`, `PosPermissionAreaGroupApiDto`, `PosPermissionApiDto` |
| Query key | `src/data/queryKeys.ts` | Thêm `merchantPosRoles: () => ['merchantSettings', 'posRoles']` |
| Nav/Route | `src/components/dashboard/constants.tsx` | Thêm `{ id: 'roles', label: 'Roles & Permissions' }` vào `children` của entry `pos` trong `MENU_ITEMS` (tự động có trong `POS_SUBMENU`) |
| Route | `src/components/dashboard/routes/index.tsx`, `src/app/AppRouter.tsx` | `PosRolesRoute` (wrapper, lấy `verificationStatus` từ outlet context như `PosBusinessHoursRoute`) + `<Route path="pos/roles" element={<PosRolesRoute />} />` |
| i18n | `src/locales/en.json`, `src/locales/vi.json` | `dashboard.menu.pos_roles`; `components.dashboard.views.pos.PosRolesView.*`; `errors.pos_role_not_found`, `errors.pos_role_name_required`, `errors.pos_role_name_too_long`, `errors.pos_role_name_duplicate`, `errors.pos_permission_owner_only`, `errors.pos_cannot_edit_owner_role_permissions`, `errors.pos_cannot_delete_owner_role`, `errors.pos_role_in_use`, `errors.pos_permission_definition_not_found` |
| Error mapping | `src/data/errorCodes.ts` | Thêm 9 error code POS role/permission ở trên → key `errors.pos_*` |

## Definition of Done

- [ ] AC pass trên môi trường dev (API thật — cần backend deploy trước, hiện chỉ chạy local)
- [ ] API call đúng contract đã map (method/status/payload — verify bằng network)
- [ ] Mutation invalidate đúng query cache (`qk.merchantPosRoles()`)
- [ ] Không console error
- [ ] Test theo 3 layer (skill feature-focused-tester): L1 UI / L2 data boundary / L3 flow
- [ ] Cập nhật trạng thái file này + link TC
- [ ] Checkbox "Manage Roles & Permissions" xác nhận disable/ẩn đúng cho mọi role không phải Owner (screenshot ở viewport 375px theo yêu cầu mobile-responsive trong CLAUDE.md nếu có modal)

## Ghi chú phiên thực thi

- **FE code đã integrate xong (2026-07-15)**: tất cả layer trong FE Surface đã implement đúng như liệt kê — `posRoles.ts` (repository), `usePosRoles.ts` (query + 3 mutations), `PosRolesView.tsx` + `modals/CreatePosRoleModal.tsx` (component), `PosRoleApiDto`/`PosPermissionAreaGroupApiDto`/`PosPermissionApiDto` (types), `qk.merchantPosRoles()`, `POS_SUBMENU` entry `roles`, `PosRolesRoute` + `<Route path="pos/roles">`, i18n (`dashboard.menu.pos_roles`, `components.dashboard.views.pos.PosRolesView.*`, `errors.pos_*` × 9).
- UI enforcement của Rule 1: checkbox "Manage Roles & Permissions" bị lọc bỏ hoàn toàn khỏi checklist cho mọi role không phải Owner (`visibleAreas` filter trong `PosRoleCard`), không chỉ disable — nên area "Roles & Permissions" sẽ không hiển thị gì cho Manager/Technician/Front Desk/role tùy chỉnh (đúng như kỳ vọng vì đây là permission duy nhất trong area đó).
- Role Owner: toàn bộ checklist hiển thị read-only (checked, disabled), không có nút Edit/Delete — quyết định TL đã chốt ở phiên backend cùng ngày (Owner role không sửa/xóa được).
- Delete dùng `showConfirm` (dialog có sẵn trong `NotificationContext`) thay vì tự dựng modal riêng — nhất quán với `PayoutDetailModal`/`StaffLinkRequestCard`.
- Verify đã chạy:
  - `npx tsc --noEmit`: so sánh trước/sau bằng `git stash` — output **giống hệt byte-for-byte** (123 dòng, `diff` rỗng) trước và sau, không có lỗi TS mới phát sinh từ story này.
  - `npx vite build --mode production`: build thành công (chunk-size warning cho `index-*.js` >900kB là pre-existing, không liên quan thay đổi này).
  - `node scripts/verify-tokens.cjs`: script không tồn tại trong checkout hiện tại (đã ghi nhận từ US-014, vẫn còn thiếu) — bỏ qua bước này.
- **Chưa làm được** (backend mới chỉ build local, chưa deploy lên dev/test server): AC pass trên môi trường dev với API thật, verify network trace (method/status/payload), test 3-layer (feature-focused-tester), screenshot mobile 375px cho `CreatePosRoleModal`. Cần một phiên riêng sau khi backend deploy để hoàn tất các mục DoD còn lại và re-verify contract qua live Swagger trước khi chuyển status sang Tested/Done.

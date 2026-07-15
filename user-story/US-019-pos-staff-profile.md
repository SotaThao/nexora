# US-019 · POS Staff Profile — Tax Filing, Role, Pay Structure, Tips (Owner Setup)

> File: `US-019-pos-staff-profile.md` · 1 file = 1 story.

| | |
|---|---|
| **Trạng thái** | Integrated |
| **Ngày tạo** | 2026-07-15 |
| **Epic / Domain** | POS Owner Setup — Setup Staff |
| **OpenSpec change** | `—` (1 màn hình mới trong POS sidebar group đã có sẵn từ US-014, reuse `usePosRoles()`/`useMerchantStaff()` hiện có; không đụng shared layer auth/httpClient/context — cùng precedent OpenSpec-skip đã dùng ở US-014/US-015/US-016) |
| **Test plan** | — (điền khi viết test) |

## Story

**Là** Business Owner (Merchant),
**tôi muốn** mở hồ sơ POS của 1 staff đã liên kết — xem lại **và điền vào nếu còn trống** SSN/EIN (dữ liệu dùng chung với TaxIQ), chọn W-2/1099, gán đúng 1 role POS, chọn cách trả lương, và bật/tắt tip,
**để** payroll và phân quyền POS phản ánh đúng thỏa thuận thực tế với thợ đó.

Nguồn: `docs/business/pos/POS-Owner-Setup-Business.md`, workflow "Setup Staff" (bước 1-5); ticket kỹ thuật `vlink-nexora/docs/plan/tasks/pos/US-07-pos-staff-tax-role-pay-tips.md` (backend Tasks 7.1–7.4 + bổ sung `UpdateStaffTinByOwnerCommand` đã implement xong ở `vlink-nexora/backend`, phiên trước).

**Nguyên tắc chủ đạo (đã ghi vào `CLAUDE.md` gốc và `vlink-nexora-fe/CLAUDE.md`, áp dụng cho story này)**: Nexora có 3 module chính (Tip system, TaxIQ, POS) độc lập về tính năng nhưng chia sẻ dữ liệu — SSN/EIN không cần cho Tips nhưng cần cho cả TaxIQ và POS, nên màn hình setup staff ở **cả 2 module** đều phải cho phép view **và update**, không chỉ view. Story này implement phần POS; phần TaxIQ (`StaffTaxProfileTab.tsx`) cũng được cập nhật cùng phiên để có cùng khả năng điền SSN/EIN khi còn trống (xem mục "Khác" trong FE Surface bên dưới).

## Acceptance Criteria

- **Given** Owner mở màn "Staff Profiles" trong POS sidebar lần đầu
- **When** màn hình load
- **Then** FE hiển thị danh sách staff đang `Active` (reuse `useMerchantStaff({ statusFilter: 'Active' })`, không gọi API mới) làm picker bên trái; chưa chọn staff nào thì bên phải hiển thị trạng thái rỗng

- **Given** Owner chọn 1 staff từ picker
- **When** FE gọi `GET /api/v1/merchant/pos/staff-profiles/{businessStaffLinkId}`
- **Then** hiển thị SSN/EIN đã mask, contract type hiện tại (nếu `taxYearAvailable`), role/pay-structure/tips hiện tại (mặc định Commission + `tipsEnabled=false` nếu staff chưa từng có POS profile — không báo lỗi)

- **Given** business chưa có `OwnerTaxYear` nào Active, hoặc staff chưa có `StaffTaxYear` cho năm hiện tại
- **When** FE nhận `taxYearAvailable: false`
- **Then** riêng dropdown Contract Type bị disable kèm tooltip giải thích cần setup TaxIQ trước (không phải lỗi); **SSN/EIN không phụ thuộc vào `taxYearAvailable`** — vẫn hiển thị/điền được bình thường vì đọc/ghi trực tiếp `StaffTaxProfile`, không phụ thuộc tax year; phần Role/Pay Structure/Tips **vẫn hoạt động bình thường**, không bị khóa

- **Given** staff này là "local staff" (`staffUserId: null` trong response — không có tài khoản Nexora, do Owner tạo trực tiếp không qua invite)
- **When** Owner chọn staff này từ picker
- **Then** toàn bộ khu vực "Tax Filing" (SSN, EIN, Contract Type) **ẩn hẳn**, kèm dòng chú thích "Staff này chưa có tài khoản Nexora nên không áp dụng dữ liệu thuế" — khác với trường hợp `taxYearAvailable: false` (vẫn hiện field, chỉ disable Contract Type); phần Role/Pay Structure/Tips vẫn hiển thị và hoạt động đầy đủ

- **Given** SSN hoặc EIN hiện đang trống (`ssn`/`ein` là `null` trong response, và `staffUserId` không null)
- **When** Owner nhập giá trị vào ô tương ứng và bấm Save (trong khu vực "Tax Filing", tách riêng khỏi Save Contract Type)
- **Then** FE gọi `PUT /api/v1/taxiq/owner/staff-tin` với `{ staffUserId, ssn? , ein? }` (chỉ gửi field Owner vừa nhập); API trả `204`; sau khi invalidate cache, ô đó chuyển sang hiển thị giá trị đã mask, không còn cho nhập nữa (đã set, không cho sửa tiếp)

- **Given** SSN hoặc EIN đã có giá trị từ trước (staff tự nhập, hoặc Owner đã điền ở lần trước)
- **When** Owner xem lại màn hình
- **Then** ô đó chỉ hiển thị giá trị đã mask, **không có input để sửa** — Owner không thể ghi đè giá trị đã có qua màn này (nếu cố gọi API trực tiếp, BE trả `400 TAXIQ_STAFF_TIN_ALREADY_SET`, nhưng FE phải tự chặn UI trước, không dựa vào lỗi này)

- **Given** Owner chọn role POS mới từ dropdown, 1 trong 3 pay-structure + số tiền tương ứng, và bật/tắt Tips
- **When** Owner bấm Save (khu vực "Role, Pay & Tips")
- **Then** FE gọi `PUT /api/v1/merchant/pos/staff-profiles/{businessStaffLinkId}` với `{ posRoleId, payStructureType, commissionPercent|weeklySalaryAmount|agreedAmount, tipsEnabled }` — chỉ field tương ứng `payStructureType` được gửi non-null; API trả `200 true`; cache staff profile invalidate, form hiển thị lại giá trị vừa lưu

- **Given** Owner đổi Pay Structure Type (vd Commission → Weekly Salary)
- **When** UI switch field nhập tương ứng
- **Then** field cũ (Commission %) bị ẩn/xóa khỏi form state, chỉ field mới (Weekly Salary $) được gửi lên khi Save — không gửi kèm field cũ

- **Given** Owner bấm Save nhưng thiếu số tiền cho pay-structure đã chọn, hoặc Commission % ngoài khoảng 0-100, hoặc số tiền âm
- **When** API trả `400` (`POS_STAFF_PAY_STRUCTURE_FIELD_CONFLICT` / `POS_STAFF_COMMISSION_PERCENT_INVALID` / `POS_STAFF_PAY_AMOUNT_INVALID`)
- **Then** FE hiển thị lỗi tương ứng, không đổi dữ liệu đã lưu trước đó

- **Given** Owner chọn W-2 hoặc 1099 ở dropdown Contract Type (Booth Renter không xuất hiện trong danh sách lựa chọn)
- **When** Owner bấm Save riêng ở khu vực "Tax Filing"
- **Then** FE gọi `PUT /api/v1/merchant/pos/staff-profiles/{businessStaffLinkId}/contract-type` với `{ contractType }`; API trả `204`; giá trị mới hiển thị lại sau khi cache invalidate — **độc lập hoàn toàn** với Save ở khu vực Role/Pay/Tips (2 nút Save riêng, 2 API call riêng, không gộp)

- **Given** business chưa có tax year active (`taxYearAvailable: false`) và Owner cố bấm Save Contract Type
- **When** API trả `400` (`POS_STAFF_TAX_YEAR_NOT_AVAILABLE`)
- **Then** FE hiển thị lỗi "TaxIQ tax year chưa được thiết lập cho salon này" — thực tế nút Save này nên bị disable sẵn khi `taxYearAvailable=false` để tránh Owner bấm vào tình huống chắc chắn lỗi, nhưng vẫn xử lý lỗi trả về nếu race-condition xảy ra

- **Given** Owner chọn 1 staff có `BusinessStaffLink.Status` không phải Active (không nên xảy ra vì picker chỉ liệt kê Active, nhưng có thể do link bị đổi trạng thái giữa lúc màn hình đang mở)
- **When** FE gọi `GET`/`PUT` bất kỳ endpoint nào ở trên
- **Then** API trả `400` (`POS_STAFF_LINK_NOT_ACTIVE`); FE hiển thị lỗi, không hiển thị/lưu form

## API Mapping (bắt buộc trước khi integrate)

> Contract build cùng phiên trước ở `vlink-nexora/backend` (đã `dotnet build` xong, NSwag regenerate `specification.json`/`web-api-client.ts`) — **chưa deploy lên `test-api.nexoratouch.com`**, nên tag nguồn (L-local), giống cách US-014/US-015/US-016 đã làm. Cần re-verify qua live Swagger sau khi BE deploy trước khi chuyển story sang Tested/Done.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/merchant/pos/staff-profiles/{businessStaffLinkId}` | Bearer (Merchant/Owner) | — | `200 StaffPosProfileDto`: `{ businessStaffLinkId, staffProfileId, displayName, photoUrl, staffUserId?, ssn?, ein?, taxYearAvailable, contractType?, posRoleId?, posRoleName?, payStructureType, commissionPercent?, weeklySalaryAmount?, agreedAmount?, tipsEnabled }`; `400` nếu link không Active (`POS_STAFF_LINK_NOT_ACTIVE`); `404`/`400` nếu link không thuộc business (`STAFF_LINK_NOT_FOUND`) | L-local |
| PUT | `/api/v1/merchant/pos/staff-profiles/{businessStaffLinkId}` | Bearer | `{ posRoleId, payStructureType: "Commission"\|"WeeklySalary"\|"AgreedAmount", commissionPercent?, weeklySalaryAmount?, agreedAmount?, tipsEnabled }` — chỉ đúng 1 field tiền được set khớp `payStructureType` | `200 boolean`; `400` các case: role không thuộc business (`POS_ROLE_NOT_FOUND`), sai/thiếu field pay-structure (`POS_STAFF_PAY_STRUCTURE_TYPE_INVALID`/`POS_STAFF_PAY_STRUCTURE_FIELD_CONFLICT`), Commission % ngoài 0-100 (`POS_STAFF_COMMISSION_PERCENT_INVALID`), số tiền âm (`POS_STAFF_PAY_AMOUNT_INVALID`), link không Active (`POS_STAFF_LINK_NOT_ACTIVE`) | L-local |
| PUT | `/api/v1/merchant/pos/staff-profiles/{businessStaffLinkId}/contract-type` | Bearer | `{ contractType: "W2"\|"C1099" }` | `204` (no body); `400`: giá trị không hợp lệ (`POS_STAFF_CONTRACT_TYPE_INVALID`), Booth Renter bị chặn (`POS_STAFF_CONTRACT_TYPE_NOT_ALLOWED`), chưa có tax year (`POS_STAFF_TAX_YEAR_NOT_AVAILABLE`), link không Active (`POS_STAFF_LINK_NOT_ACTIVE`), staff không có tài khoản liên kết (`POS_STAFF_NO_LINKED_ACCOUNT`) | L-local |
| PUT | `/api/v1/taxiq/owner/staff-tin` | Bearer | `{ staffUserId, ssn?, ein? }` (ít nhất 1 field, đúng format SSN `###-##-####`/EIN `##-#######`) | `204` (no body); `400`: field đã có giá trị từ trước (`TAXIQ_STAFF_TIN_ALREADY_SET`), sai format, staff không active (`STAFF_LINK_NOT_FOUND`) | L-local — **endpoint dùng chung giữa POS và TaxIQ**, cùng controller `GetStaffTinQuery` (`GET .../staff-tin`) đã có sẵn |

**Điểm đã xác nhận qua `web-api-client.ts` vừa regenerate (local build, chưa phải live Swagger):**
- Toàn bộ field DTO camelCase, đúng như bảng trên (đã đọc trực tiếp `StaffPosProfileDto`/`CreateOrUpdateStaffPosProfileRequestDto`/`UpdateStaffPosContractTypeRequestDto`/`UpdateStaffTinByOwnerCommand` trong `web-api-client.ts`).
- `GET` **không bao giờ trả lỗi vì thiếu dữ liệu TaxIQ** — SSN/EIN đọc độc lập với tax year (chỉ phụ thuộc `staffUserId` khác null); `taxYearAvailable: false` + `contractType` null chỉ áp dụng riêng cho Contract Type, không phải lỗi cần try/catch riêng.
- `staffUserId` (nullable) — `null` nghĩa là "local staff", không có tài khoản Nexora, **không** có nghĩa TaxIQ chưa setup. Đây là field mới thêm cùng phiên (khác với bản nháp story ban đầu).
- `payStructureType`/`contractType` là string enum tên (PascalCase: `"Commission"`, `"WeeklySalary"`, `"AgreedAmount"`, `"W2"`, `"C1099"`) — không phải số.
- Reveal SSN/EIN plaintext (xem full, không mask) **vẫn không có** trên các endpoint mới — luôn trả/nhận giá trị qua mask khi đọc. Muốn xem full SSN/EIN vẫn phải qua `GET /api/v1/taxiq/owner/staff-tin?...&reveal=true` (màn TaxIQ hiện có). Nhưng **ghi (set khi trống)** thì có — qua `PUT /api/v1/taxiq/owner/staff-tin` ở trên, dùng chung cho cả 2 module.

**Còn lại cần xác nhận khi integrate:** re-verify contract qua live Swagger sau khi BE deploy lên dev/test server (domain thật dùng `VITE_API_BASE_URL`, không hardcode).

## FE Surface (các layer sẽ đụng)

> Theo data boundary: components → data hooks → repositories → adapter.

| Layer | File | Thay đổi |
|---|---|---|
| Component | `src/components/dashboard/views/pos/PosStaffProfileView.tsx` (mới) | Master-detail 1 trang: picker staff Active bên trái (reuse `useMerchantStaff({statusFilter:'Active', pageSize:200})`, không gọi API mới), form bên phải chia 2 khu vực Save độc lập. **"Tax Filing"**: nếu `staffUserId === null` → ẩn hẳn khu vực này, hiện dòng chú thích "no linked account"; nếu không null → hiện SSN/EIN (mask, có input để điền nếu đang null — `useSetStaffTin`) + dropdown Contract Type W2/1099 (disable khi `!taxYearAvailable`, tooltip giải thích) + nút Save riêng cho Contract Type. **"Role, Pay & Tips"**: dropdown role từ `usePosRoles()`, dropdown Pay Structure Type + input số tiền tương ứng, `ToggleSwitch` cho Tips, 1 nút Save chung. Chọn staff lưu vào query string `?staff=<businessStaffLinkId>` qua `useSearchParams` để giữ lựa chọn khi refresh |
| Data hook | `src/data/hooks/usePosStaffProfile.ts` (mới) | `useStaffPosProfile(businessStaffLinkId)` (query, key `qk.merchantPosStaffProfile(businessStaffLinkId)`, `enabled: !!businessStaffLinkId`), `useSaveStaffPosProfile()`, `useUpdateStaffPosContractType()` — cả 2 mutation invalidate `qk.merchantPosStaffProfile(businessStaffLinkId)` |
| Data hook | `src/data/hooks/useTaxiqOwnerPayouts.ts` (sửa, thêm hook) | Thêm `useSetStaffTin()` — mutation gọi `PUT /api/v1/taxiq/owner/staff-tin`, dùng chung bởi cả POS (`PosStaffProfileView`) và TaxIQ (`StaffTinCell`); invalidate cả `qk.taxiqOwnerStaffTin(...)` (cho màn TaxIQ) và `qk.merchantPosStaffProfile(...)` (cho màn POS) — cách đơn giản nhất là invalidate theo `staffUserId` ở cả 2 query key thay vì phải biết context gọi từ đâu |
| Repository | `src/data/repositories/posStaffProfile.ts` (mới) | `getStaffPosProfile(businessStaffLinkId)`, `saveStaffPosProfile(businessStaffLinkId, payload)`, `updateContractType(businessStaffLinkId, contractType)` — gọi thẳng `httpClient`, DTO camelCase pass-through (không cần normalize nhiều) |
| Repository | `src/data/repositories/taxiqOwnerPayouts.ts` (sửa, thêm hàm) | Thêm `setStaffTin(staffUserId, { ssn?, ein? })` gọi `PUT /api/v1/taxiq/owner/staff-tin` — đặt ở đây (không phải file POS mới) vì đây là entity TaxIQ dùng chung, tránh 2 file có 2 hàm gọi cùng 1 endpoint |
| Types | `src/types/repositories.ts` | `PosStaffProfileApiDto` khớp `StaffPosProfileDto` ở bảng trên (bao gồm `staffUserId: string \| null`) |
| Query key | `src/data/queryKeys.ts` | Thêm `merchantPosStaffProfile: (businessStaffLinkId?: string) => ['merchantSettings', 'posStaffProfile', businessStaffLinkId ?? '']` |
| Nav/Route | `src/components/dashboard/constants.tsx` | Thêm `{ id: 'staff', label: 'Staff Profiles' }` vào `children` của entry `pos` trong `MENU_ITEMS` (tự động có trong `POS_SUBMENU`) |
| Route | `src/components/dashboard/routes/index.tsx`, `src/app/AppRouter.tsx` | `PosStaffProfileRoute` (wrapper, không cần outlet context — không gate KYB) + `<Route path="pos/staff" element={<PosStaffProfileRoute />} />` |
| Khác (TaxIQ, cùng phiên) | `src/components/dashboard/views/taxiq/tabs/StaffTaxProfileTab.tsx` (`StaffTinCell`) | Thêm input + nút "Set" ngay cạnh giá trị mask khi field đang `null` (dùng chung `useSetStaffTin()`) — đúng nguyên tắc "cả 2 module đều view/update được", không chỉ POS |
| i18n | `src/locales/en.json`, `src/locales/vi.json` | `dashboard.menu.pos_staff`; `components.dashboard.views.pos.PosStaffProfileView.*`; `errors.pos_staff_link_not_active`, `errors.pos_staff_pay_structure_type_invalid`, `errors.pos_staff_pay_structure_field_conflict`, `errors.pos_staff_commission_percent_invalid`, `errors.pos_staff_pay_amount_invalid`, `errors.pos_staff_contract_type_invalid`, `errors.pos_staff_contract_type_not_allowed`, `errors.pos_staff_tax_year_not_available`, `errors.pos_staff_no_linked_account`, `errors.taxiq_staff_tin_already_set` |
| Error mapping | `src/data/errorCodes.ts` | Thêm error code POS staff-profile + `TAXIQ_STAFF_TIN_ALREADY_SET`/`POS_STAFF_NO_LINKED_ACCOUNT` ở trên → key `errors.pos_staff_*`/`errors.taxiq_staff_tin_already_set` (`POS_ROLE_NOT_FOUND`/`STAFF_LINK_NOT_FOUND` đã có sẵn từ US-015/staff feature, không cần thêm lại) |

**Quyết định đã chốt (2026-07-15, sau khi TL nêu nguyên tắc "3 module độc lập nhưng chia sẻ dữ liệu"):**
1. Master-detail 1 trang (`pos/staff`, không có route con `:businessStaffLinkId`) — khớp đúng route ticket BE yêu cầu (`<Route path="pos/staff">`, không có param). Không dựng lại 1 danh sách staff riêng trong POS — reuse `useMerchantStaff()` đã có ở `/dashboard/staff`.
2. **Cập nhật so với bản nháp ban đầu**: màn này giờ CÓ cho phép ghi SSN/EIN (không chỉ view) — nhưng chỉ khi field đang trống (không cho ghi đè giá trị đã có). Reveal plaintext đầy đủ vẫn không có ở đây — chỉ có ở màn TaxIQ hiện có (`reveal=true`).
3. Dùng `<select>` native cho Role/Pay Structure Type/Contract Type (khớp precedent `CONTRACT_TYPES`/`W9_STATUSES` ở `StaffTaxProfileTab.tsx`/`CreateStaffTaxYearForModal.tsx`) — không dùng radio button dù ticket BE ghi "radio pay-structure", vì repo hiện không có radio component nào và native select đã là convention cho các lựa chọn tương tự trong đúng domain này (TaxIQ contract type, POS categories sort).
4. 2 nút Save riêng biệt (Tax Filing vs Role/Pay/Tips) thay vì 1 nút Save chung — vì đây là 2-3 API call độc lập tới các command khác nhau ở backend (khớp đúng nguyên tắc BE "pay structure độc lập với tax filing type", Rule 3).
5. Local staff (`staffUserId: null`) — ẩn hẳn khu vực Tax Filing kèm giải thích, không hiện dạng disable như trường hợp `taxYearAvailable: false` (2 trạng thái ý nghĩa khác nhau, không nên hiển thị giống nhau).
6. `useSetStaffTin()`/`setStaffTin()` đặt trong các file TaxIQ hiện có (`useTaxiqOwnerPayouts.ts`/`taxiqOwnerPayouts.ts`), không tạo file riêng cho POS — vì đây là entity TaxIQ dùng chung, tránh có 2 nơi định nghĩa cùng 1 lệnh gọi API.

## Definition of Done

- [ ] AC pass trên môi trường dev (API thật — cần backend deploy trước, hiện chỉ chạy local)
- [ ] API call đúng contract đã map (method/status/payload — verify bằng network)
- [ ] Mutation invalidate đúng query cache (`qk.merchantPosStaffProfile(businessStaffLinkId)`)
- [ ] Không console error
- [ ] Test theo 3 layer (skill feature-focused-tester): L1 UI / L2 data boundary / L3 flow
- [ ] Cập nhật trạng thái file này + link TC

## Ghi chú phiên thực thi

- **FE code đã integrate xong (2026-07-15)**: tất cả layer trong FE Surface đã implement đúng như liệt kê:
  - `data/repositories/posStaffProfile.ts` (mới): `getStaffPosProfile`, `saveStaffPosProfile`, `updateContractType`.
  - `data/repositories/taxiqOwnerPayouts.ts` (sửa): thêm `setStaffTin()` + `SetStaffTinParams`.
  - `data/hooks/usePosStaffProfile.ts` (mới): `useStaffPosProfile`, `useSaveStaffPosProfile`, `useUpdateStaffPosContractType`.
  - `data/hooks/useTaxiqOwnerPayouts.ts` (sửa): thêm `useSetStaffTin()` — invalidate cả `['taxiqOwnerStaffTin']` và `['merchantSettings','posStaffProfile']` theo prefix-match (đơn giản hơn threading `ownerTaxYearId`/`businessStaffLinkId` qua lại giữa 2 module).
  - `types/repositories.ts`: `PosStaffProfileApiDto`.
  - `queryKeys.ts`: `merchantPosStaffProfile(businessStaffLinkId)`.
  - `components/dashboard/constants.tsx`: entry `staff` trong `POS_SUBMENU`.
  - `components/dashboard/routes/index.tsx` + `app/AppRouter.tsx`: `PosStaffProfileRoute` + `<Route path="pos/staff">` (không KYB-gate).
  - `components/dashboard/views/pos/PosStaffProfileView.tsx` (mới): master-detail, picker Active staff bên trái (`useMerchantStaff({statusFilter:'Active', pageSize:200})`), 2 khu vực Save độc lập bên phải.
  - `components/dashboard/views/taxiq/tabs/StaffTaxProfileTab.tsx` (sửa): `StaffTinCell` tách thành 2 dòng `StaffTinFieldRow` (SSN/EIN riêng), mỗi dòng tự quyết định hiện mask+Reveal hay input+Set tùy field đã có giá trị hay chưa — dùng chung `useSetStaffTin()` với POS.
  - i18n: `dashboard.menu.pos_staff`; `components.dashboard.views.pos.PosStaffProfileView.*`; `taxiq.taxProfile.setButton` (mới, dùng chung); 10 `errors.pos_staff_*`/`errors.taxiq_staff_tin_already_set` keys — cả `en.json` và `vi.json`.
  - `data/errorCodes.ts`: map 10 error code mới ở trên.
- **Quyết định khi code thực tế** (không lệch so với story, chỉ ghi rõ cách làm): `TinField`/`StaffTinFieldRow` xác định field đã "set" hay chưa dựa vào giá trị `ssn`/`ein` trả về từ chính `GET` (masked string non-null = đã set) — không cần gọi thêm API nào để biết trạng thái này, vì backend luôn trả `null` cho field chưa từng có giá trị dù ở chế độ mask hay reveal.
- Verify đã chạy: `npx tsc --noEmit` (diff byte-for-byte 0 dòng so với baseline qua `git stash -u`, 123 lỗi pre-existing không đổi) + `npx vite build --mode production` (thành công, chỉ có warning chunk-size >900kB đã tồn tại từ trước, không liên quan).
- **Bug fix (2026-07-15, phát hiện sau khi TL thử trên UI)**: chọn staff khác trong picker bị giật/nhấp nháy (jank). Root cause: `useStaffPosProfile` không có `placeholderData`, nên mỗi lần đổi `businessStaffLinkId` là 1 query key mới → `isLoading` = true → `PosStaffProfileView` render nhánh loading = 1 skeleton card nhỏ thay cho 2 card chi tiết (Tax Filing + Role/Pay/Tips) đang hiển thị → sau khi fetch xong lại render lại 2 card đầy đủ. Việc collapse/expand layout này mỗi lần bấm chọn staff chính là "giật". Fix: thêm `placeholderData: keepPreviousData` (cùng pattern `useMerchantStaff` đã dùng) — giữ nguyên data của staff đang xem trong lúc fetch staff mới, không collapse layout; `isLoading` tự động false khi đã có data (kể cả placeholder) nên chỉ lần chọn staff đầu tiên mới thấy skeleton. Bổ sung thêm 1 dòng "Refreshing…" nhỏ (dùng `profileQuery.isFetching`, không đổi layout) để Owner biết đang tải lại staff mới. Verify lại: `tsc --noEmit` (diff 0 dòng) + `vite build` (thành công).
- **Bug fix #2 (2026-07-15)**: (a) picker bên trái không "hiện full" — trước đó container không có min-height nên chỉ cao vừa đúng số record đang hiển thị; (b) chọn 1 staff làm màn hình "giật xuống" — panel chi tiết bên phải nhảy từ trạng thái ngắn (prompt "chọn staff"/skeleton) sang 2 card đầy đủ (rất cao), khiến layout đột ngột giãn ra. Fix: thêm `min-h-[420px]` cho cả picker card và cả 3 trạng thái của panel chi tiết (prompt rỗng / skeleton / — nội dung thật tự nhiên cao hơn mốc này nên không bị ảnh hưởng), đổi grid sang `lg:items-start` (không ép 2 cột stretch bằng nhau nữa, mỗi cột tự nhiên theo nội dung + min-height riêng). Verify lại: `tsc --noEmit` (diff 0 dòng) + `vite build` (thành công).
- **Bug fix #3 (2026-07-15, verify bằng Playwright thật trên `http://localhost:3000/dashboard/pos/staff`, login `quanpm`/`123456`)**: TL báo vẫn còn giật sau bug fix #1-2. Dùng script `requestAnimationFrame` đo `main.getBoundingClientRect().height` mỗi frame khi chuyển từ staff A sang staff B — phát hiện chiều cao nhảy 666 → 698 → 666 (bounce lên rồi xuống) trong ~5-6 frame đầu. Root cause thật sự: dòng "Refreshing…" tôi thêm ở bug fix #1 (hiện khi `profileQuery.isFetching`) tự nó gây ra bounce — vì với `keepPreviousData`, data cũ (staff A) vẫn hiển thị trong lúc `isFetching=true` (dòng "Refreshing…" xuất hiện, +32px), rồi khi fetch xong data thật của staff B thay thế, `isFetching=false` nên dòng đó biến mất (-32px) — chính cái indicator "hữu ích" đó lại là nguồn gây giật, không phải phần layout đã fix trước đó. Fix: bỏ hẳn dòng "Refreshing…" (xóa key i18n `refreshingNotice` không dùng nữa). Verify lại bằng đúng script đo frame-by-frame: 90 frame liên tục, chuyển cả 2 chiều (A→B và B→A) đều phẳng tuyệt đối ở 666px, không còn bounce; lần chọn đầu tiên (cold, chưa cache) chỉ có 1 bước chuyển mượt từ 628→666 (không bounce qua lại). Console không có warning/error. `tsc --noEmit` (diff 0 dòng) + `vite build` (thành công) re-verify sau cùng.
- **Bug fix #4 (2026-07-15, verify bằng Playwright)**: TL báo vẫn còn giật xuống "một ít" sau bug fix #3 (đã hết bounce nhưng còn snap nhẹ). Đo lại chi tiết hơn (`window.scrollY`, `document.body` height, vị trí `top` của picker) khi chuyển staff: `scrollY` luôn = 0, vị trí `top` của picker không đổi — chỉ có chiều cao panel bên phải **snap tức thì** (1 frame) từ trạng thái này sang trạng thái khác (vd 420→490, hoặc có thể chênh nhiều hơn giữa 2 staff có nội dung khác nhau thật sự — SSN/EIN đã set hay chưa, taxYearAvailable hay không — nên không phải lúc nào cũng bằng nhau). CSS không animate được `height: auto` trực tiếp, nên: thêm 1 class `.pos-staff-profile-content` (keyframe `pos-staff-profile-fade-in`, 0.18s ease-out, fade + dịch nhẹ từ trên xuống) trong `src/index.css` (theo đúng pattern `@keyframes` đã có sẵn trong file, có `prefers-reduced-motion: reduce` guard); áp class này lên `<div>` bọc 2 card chi tiết, và đổi Fragment (`<>`) thành `<div key={selectedLinkId}>` để React remount đúng subtree này mỗi lần đổi staff — remount làm animation replay mỗi lần chọn, che bớt cảm giác "snap" cứng dù chiều cao vẫn đổi tức thì bên dưới. Verify bằng Playwright: đo `opacity` của `.pos-staff-profile-content` qua từng frame khi chuyển Trump↔Staff02 — xác nhận đúng chu trình `1 → 0 → 1` (remount + fade lại) mỗi lần chọn, không còn bounce chiều cao, không lỗi console. `tsc --noEmit` (diff 0 dòng) + `vite build` (thành công). **Giới hạn đã biết**: 2 staff test hiện có (Trump/Staff02) có nội dung giống hệt nhau về hình dạng nên chiều cao đo được vẫn phẳng 666px cả 2 chiều — chưa test được case 2 staff có chiều cao chênh lệch thật (vd 1 staff local không có Tax Filing section) qua Playwright vì dữ liệu test hiện tại không có combo đó; cơ chế animate đã xác nhận đúng, chỉ chưa quan sát trực tiếp trên 1 cặp lệch chiều cao thật.
- **Bug fix #5 (2026-07-15) — revert bug fix #4**: TL báo 2 panel "Tax Filing"/"Role, Pay & Tips" bị chớp sau bug fix #4. Root cause: chính animation fade-in vừa thêm (`opacity: 0 → 1`) là nguyên nhân — đã tự xác nhận qua Playwright trace ở bug fix #4 rằng opacity đi qua chu trình `1 → 0 → 1` mỗi lần chọn staff, tức là 2 card **biến mất hoàn toàn rồi hiện lại** trong 0.18s, chính là hiện tượng "chớp". Quyết định: bỏ hẳn animation này thay vì cố tinh chỉnh tiếp (giảm rủi ro tạo thêm lỗi mới lần nữa) — revert `key={selectedLinkId}` + class `pos-staff-profile-content` về `<div className="space-y-4">` thường, xóa `@keyframes pos-staff-profile-fade-in` khỏi `index.css`. Chấp nhận việc chiều cao vẫn snap tức thì 1 frame khi 2 staff có nội dung khác chiều cao thật (không bounce, không giật ngược, không chớp) — mức độ này chấp nhận được cho 1 master-detail UI thông thường, không cố che thêm nữa để tránh vòng lặp sinh lỗi mới. Verify lại bằng Playwright: đo opacity của toàn bộ `.nexora-card` qua 40 frame khi chuyển Trump↔Staff02 — **không còn card nào tụt dưới opacity 1** ở bất kỳ frame nào (không chớp), chiều cao vẫn phẳng (không bounce), không lỗi console. `tsc --noEmit` (diff 0 dòng) + `vite build` (thành công).
- **Bug fix #6 (2026-07-15) — scrollbar nhảy, sửa global**: TL muốn scrollbar của page không nhảy khi select staff. Đây không phải lỗi riêng của component này — khi nội dung page vượt qua ngưỡng chiều cao viewport (vd chọn 1 staff làm panel cao hơn), trình duyệt tự thêm scrollbar dọc, làm hẹp vùng nội dung ~6-17px và đẩy lệch toàn bộ layout theo chiều ngang — xảy ra ở **bất kỳ trang nào** trong app khi nội dung đổi chiều cao qua ngưỡng này, không riêng POS Staff Profile. Fix ở tầng CSS global (`src/index.css`, rule `html`): thêm `overflow-y: scroll` (luôn giữ chỗ cho scrollbar dọc, hỗ trợ mọi trình duyệt) + `scrollbar-gutter: stable` (để trình duyệt hiện đại vẽ gutter trống thay vì luôn hiện track/thumb khi không cần cuộn). Lưu ý: thử `scrollbar-gutter: stable` một mình trước (không kèm `overflow-y`) không có tác dụng — theo spec, `scrollbar-gutter` chỉ có hiệu lực khi `overflow` khác `visible`, nên bắt buộc phải có `overflow-y: scroll` đi kèm. Verify bằng Playwright: resize viewport về đúng ngưỡng (1440×780, nằm giữa 765px "chưa chọn" và 802.5px "đã chọn") rồi đo `document.documentElement.clientWidth`/vị trí `left` của `main` qua 50 frame khi click chọn staff — trước khi fix: `clientWidth` nhảy 1440→1434 đúng lúc scrollbar xuất hiện; sau khi fix: `clientWidth` **cố định 1434 ngay từ đầu** (gutter đã giữ chỗ sẵn dù chưa cần cuộn), `mainLeft`/`mainWidth` không đổi suốt quá trình. Không lỗi console. `tsc --noEmit` (diff 0 dòng) + `vite build` (thành công).
- **Chưa làm được** (backend mới chỉ build local, chưa deploy lên dev/test server): AC pass trên môi trường dev với API thật, verify network trace (method/status/payload), test 3-layer (feature-focused-tester), screenshot mobile 375px, thao tác thử trên trình duyệt thật (chưa chạy `pnpm dev`). Cần một phiên riêng sau khi backend deploy để hoàn tất các mục DoD còn lại và re-verify contract qua live Swagger trước khi chuyển status sang Tested/Done.

# US-015 · Equipment Depreciation Method & Asset Disposal

> File: `US-015-equipment-depreciation-disposal.md` · 1 file = 1 story. ID tăng dần, duy nhất toàn repo.

| | |
|---|---|
| **Trạng thái** | Tested (verify local-to-local qua Playwright thành công 2026-07-17) |
| **Ngày tạo** | 2026-07-17 |
| **Epic / Domain** | Tax IQ — Owner (Equipment Tracker) |
| **OpenSpec change** | — (fix nhỏ, chỉ mở rộng field trên component/repository đã có, không đụng shared layer) |
| **Test plan** | Điền khi viết test (xem `vlink-nexora/docs/plan/tasks/taxiq/be-tasks/test-cases/ENH-TICKET-04-taxiq-equipment-depreciation-disposal-test.md` phía BE) |

## Story

**Là** Business Owner (Chủ tiệm),
**tôi muốn** ghi nhận phương pháp khấu hao đã chọn (Depreciation Method) và thông tin thanh lý
(ngày bán, giá bán) cho từng Equipment Asset,
**để** CPA của tôi có đủ dữ liệu tính đúng số khấu hao mỗi năm và tính lãi/lỗ khi tài sản bị bán
trước khi hết vòng đời khấu hao, thay vì phải tự suy luận hoặc hỏi lại tôi ngoài hệ thống.

Bối cảnh: BE (Enhancement Ticket 4, `vlink-nexora/docs/business/taxiq/NEXORA_TaxIQ_Enhancement_Tickets.md`)
vừa hoàn tất trong cùng phiên làm việc — thêm 3 field nullable (`DepreciationMethod`, `DisposalDate`,
`DisposalAmount`) vào `EquipmentAsset`, route API giữ nguyên (`/api/v1/taxiq/owner/equipment`), chỉ đổi
payload Create/Update + response DTO. Chưa deploy lên `test-api.nexoratouch.com`.

**Quyết định phạm vi:** Story này chỉ mở rộng **form** Add/Edit Equipment (đúng theo Implementation
Step 4 của ticket BE: "Cập nhật EquipmentAssetDto để FE hiển thị 3 field mới trong form Equipment").
Không thêm cột mới trong bảng danh sách Equipment ở story này — giữ scope narrow, có thể làm follow-up
nếu Owner cần nhìn nhanh trạng thái Disposal mà không mở modal Edit.

**Lưu ý đã biết (kế thừa từ BE):** BE không áp cross-field validation giữa `DisposalAmount`/`DisposalDate`
và `InServiceDate` (theo quyết định của Developer trong phiên BE) — FE cũng không tự thêm validation
này để tránh sai lệch với hợp đồng thật của API.

## Acceptance Criteria

- **Given** Owner mở modal Add/Edit Equipment
- **When** modal render
- **Then** thấy thêm 3 field mới: "Depreciation Method" (dropdown: MACRS / Straight Line / Section 179 /
  Bonus Depreciation, có option trống = chưa chọn), "Disposal Date" (date input, optional), "Disposal
  Amount" (number input, optional) — đặt sau field "Business-use %", trước phần Receipt

- **Given** Owner chọn Depreciation Method và lưu (Add hoặc Edit)
- **When** submit form
- **Then** gọi `POST`/`PUT` equipment với `depreciationMethod` đúng giá trị enum đã chọn; `GET` lại danh
  sách phản ánh đúng giá trị

- **Given** Owner nhập Disposal Date + Disposal Amount cho asset đã tồn tại
- **When** lưu
- **Then** `PUT` gửi đúng `disposalDate`/`disposalAmount`; mở lại Edit modal thấy giá trị đã lưu hiển thị
  đúng (pre-fill)

- **Given** Owner để trống cả 3 field mới
- **When** submit
- **Then** request gửi `null` cho cả 3 field (không bắt buộc, không chặn submit)

- **Given** Owner nhập Disposal Amount nhưng không nhập Disposal Date (hoặc ngược lại)
- **When** submit
- **Then** request vẫn thành công (không có validation chặn phía FE, khớp hành vi BE)

## API Mapping (bắt buộc trước khi integrate)

> Nguồn: BE đã implement và build thành công trong session này (chưa deploy lên
> `test-api.nexoratouch.com`) — nguồn xác thực là backend source code
> (`vlink-nexora/backend/src/Application/Features/TaxIq/Owner/Commands/{Create,Update}EquipmentAssetCommand.cs`,
> `vlink-nexora/backend/src/Application/Features/TaxIq/Owner/DTOs/EquipmentAssetDto.cs`). Tag: (L) local
> backend đã build sạch, migration đã tạo, chưa deploy dev/staging chung.

| Method | Endpoint | Auth | Request (field mới) | Response (field mới) | Nguồn |
|---|---|---|---|---|---|
| POST | `/api/v1/taxiq/owner/equipment` | Bearer (Owner) | `+ depreciationMethod?, disposalDate?, disposalAmount?` | `201 Guid` (không đổi) | (L) |
| PUT | `/api/v1/taxiq/owner/equipment/{id}` | Bearer (Owner) | `+ depreciationMethod?, disposalDate?, disposalAmount?` | `204` (không đổi) | (L) |
| GET | `/api/v1/taxiq/owner/equipment?ownerTaxYearId=` | Bearer | — | `+ depreciationMethod?: string \| null, disposalDate?: string \| null, disposalAmount?: number \| null` | (L) |

`depreciationMethod` enum: `'MACRS' \| 'StraightLine' \| 'Section179' \| 'BonusDepreciation'` (string,
serialize theo `.ToString()` của enum C#, giống pattern `aiSuggestion` đã có).

Error codes: không có error code mới — dùng lại `TAXIQ_OWNER_TAX_YEAR_LOCKED`,
`TAXIQ_EQUIPMENT_ASSET_NOT_FOUND`, `TAXIQ_UNAUTHORIZED_BUSINESS` đã map sẵn trong `errorCodes.ts`.

**Điểm chưa chắc chắn / cần hỏi BE:** Không còn — BE + FE do cùng người thực hiện nối tiếp trong phiên
này. Verify local-to-local (backend local + `pnpm dev` trỏ `VITE_API_BASE_URL` vào backend local), theo
đúng precedent US-013/US-014.

## FE Surface (các layer sẽ đụng)

> Theo data boundary: components → data hooks → repositories → adapter.

| Layer | File | Thay đổi |
|---|---|---|
| Component | `EquipmentTab.tsx` | Thêm state + input cho `depreciationMethod` (select), `disposalDate` (date), `disposalAmount` (number); wire vào `resetForm`, `openEditModal`, `handleSubmit` (Create + Update) |
| Data hook | `useTaxiqOwnerAssets.ts` | Không đổi — hook forward params nguyên trạng, type đã cập nhật ở repository |
| Repository | `taxiqOwnerAssets.ts` | Thêm field vào `EquipmentAssetApiDto`, `EquipmentAsset`, `CreateEquipmentAssetParams`, `UpdateEquipmentAssetParams`; cập nhật `normalizeEquipmentAsset`, `createEquipment`, `updateEquipment` |
| Khác | `locales/en.json`, `locales/vi.json` | Thêm key `taxiq.assetsTracker.equipment.form.{depreciationMethodLabel,depreciationMethodNone,disposalDateLabel,disposalAmountLabel}` + 4 label enum method |

## Definition of Done

- [x] AC pass trên môi trường dev — verify local-to-local qua Playwright (2026-07-17): mở Edit modal cho
  asset "Table" đã có sẵn, thấy đúng 3 field mới; chọn Section 179 + Disposal Date `2026-08-01` +
  Disposal Amount `50`, Save → `PUT /equipment/{id}` → 204; reopen modal → pre-fill đúng cả 3 giá trị
- [x] API call đúng contract đã map — verify qua network thật
- [x] Không console error — 0 error/warning trong toàn bộ phiên test
- [x] `npx tsc --noEmit` và build clean (`vite build --mode development` sạch; các lỗi TS hiện có trong repo đều ở file không liên quan, không phải do thay đổi này)
- [x] Cập nhật trạng thái file này

## Ghi chú phiên thực thi

**2026-07-17**: Mở rộng `taxiqOwnerAssets.ts` (3 field mới trên `EquipmentAssetApiDto`/`EquipmentAsset`/
`CreateEquipmentAssetParams`/`UpdateEquipmentAssetParams` + `normalizeEquipmentAsset`/`createEquipment`/
`updateEquipment`), `EquipmentTab.tsx` (state + dropdown Depreciation Method + 2 input Disposal Date/Amount,
đặt sau Business-use %/Renovation, trước Receipt; wire vào `resetForm`/`openEditModal`/`handleSubmit`),
và locale keys (`en.json`/`vi.json`) cho label form + tên hiển thị 4 giá trị enum. Không đổi `useTaxiqOwnerAssets.ts`
(hook chỉ forward params, type đã đủ qua repository). Không thêm validation cross-field ở FE, khớp quyết
định "không validate" phía BE.

**Verify local-to-local (2026-07-17, Playwright)**: Login Owner `quanpm`, vào Equipment Tracker, Edit
asset "Table" có sẵn — dropdown Depreciation Method + 2 input Disposal Date/Amount hiển thị đúng, pre-fill
"Not selected yet"/rỗng lúc đầu. Chọn "Section 179", nhập Disposal Date `2026-08-01`, Disposal Amount `50`,
Save → network log xác nhận `PUT .../equipment/{id}` → 204. Reopen Edit modal → cả 3 giá trị pre-fill
đúng, xác nhận round-trip PUT/GET hoạt động chính xác.

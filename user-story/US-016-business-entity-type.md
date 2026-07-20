# US-016 · Business Entity Type cho CPA

> File: `US-016-business-entity-type.md` · 1 file = 1 story. ID tăng dần, duy nhất toàn repo.

| | |
|---|---|
| **Trạng thái** | Tested (verify local-to-local qua Playwright thành công 2026-07-17) |
| **Ngày tạo** | 2026-07-17 |
| **Epic / Domain** | Tax IQ — Owner (Onboarding & Module Config) |
| **OpenSpec change** | — (fix nhỏ, chỉ thêm 1 field vào 2 component đã có, không đụng shared layer) |
| **Test plan** | Điền khi viết test (xem `vlink-nexora/docs/plan/tasks/taxiq/be-tasks/test-cases/ENH-TICKET-03-taxiq-business-entity-type-test.md` phía BE) |

## Story

**Là** Business Owner (Chủ tiệm),
**tôi muốn** chọn loại hình pháp lý doanh nghiệp của mình (Sole Proprietor/Partnership/LLC/S-Corp/C-Corp/Other)
trong lúc setup Tax IQ hoặc chỉnh sau,
**để** CPA của tôi xác định đúng tờ khai thuế cần dùng, và không bị chặn khi bật CPA Export mà thiếu
thông tin này.

Bối cảnh: BE (Enhancement Ticket 3) đã hoàn tất trong phiên trước — thêm field nullable
`BusinessEntityType` vào `OwnerTaxYear`, validator chặn Final Export khi CPA Export bật mà field này
null (xem `GenerateFinalExportCommand`), và `TaxReadinessCalculator` đã đưa "thiếu Business Entity Type"
vào danh sách High Priority (`type: "MissingBusinessEntityType"`) khi CPA Export bật. **FE hiện chưa có
field này ở bất kỳ đâu** (search toàn bộ `src/` không ra kết quả).

## Acceptance Criteria

- **Given** Owner đang ở Step 1 (Business info) của `TaxIqOnboardingWizard`
- **When** step render
- **Then** thấy thêm dropdown "Business Entity Type" (optional, có option trống = chưa chọn) sau field
  Tax Year

- **Given** Owner chọn Business Entity Type và hoàn tất wizard
- **When** submit ở step 4
- **Then** `POST /tax-years` gửi đúng `businessEntityType`; Step 4 Review hiển thị giá trị đã chọn

- **Given** Owner đã có `OwnerTaxYear`, mở modal "Edit configuration" (`EditModuleConfigModal`)
- **When** modal render
- **Then** thấy dropdown Business Entity Type, pre-fill đúng giá trị hiện tại (hoặc để trống nếu chưa
  set)

- **Given** Owner đổi Business Entity Type trong modal và Save
- **When** submit
- **Then** `PUT /tax-years/{id}/modules` gửi đúng `businessEntityType`; đóng modal; dữ liệu mới hiển
  thị lại đúng sau khi query invalidate

- **Given** Owner bật CPA Export nhưng chưa chọn Business Entity Type
- **When** xem `TaxReadinessScoreWidget`
- **Then** thấy item High Priority "Business Entity Type is required for CPA Export…" (map đúng route
  `/dashboard/taxiq`, nhấn vào điều hướng tới đó) — không cần FE tự sinh text, chỉ cần đăng ký route +
  i18n key cho type `MissingBusinessEntityType` (trước đó dùng fallback `item.description` từ BE, không
  có route)

## API Mapping (bắt buộc trước khi integrate)

> Nguồn: BE đã implement trong phiên trước (migration `AddBusinessEntityTypeToOwnerTaxYear` đã tồn tại,
> `dotnet build` sạch). Tag: (L) local backend, chưa deploy `test-api.nexoratouch.com`.

| Method | Endpoint | Auth | Request (field mới) | Response (field mới) | Nguồn |
|---|---|---|---|---|---|
| POST | `/api/v1/taxiq/owner/tax-years` | Bearer (Owner) | `+ businessEntityType?` | `201` (DTO hoặc rỗng — xem Open Question đã có trong repo) | (L) |
| PUT | `/api/v1/taxiq/owner/tax-years/{id}/modules` | Bearer (Owner) | `+ businessEntityType?` | `204` | (L) |
| GET | `/api/v1/taxiq/owner/tax-years/{id}` | Bearer | — | `+ businessEntityType?: string \| null` | (L) |
| GET | `/api/v1/taxiq/owner/tax-years/{id}/readiness-score` | Bearer | — | `highPriorityItems[].type` có thể là `"MissingBusinessEntityType"` (chỉ khi CPAExport bật) | (L) |

`businessEntityType` enum: `'SoleProprietor' \| 'Partnership' \| 'LLC' \| 'SCorp' \| 'CCorp' \| 'Other'`.

Error codes: không có error code mới riêng cho field này (validation lỗi enum dùng message string
"BusinessEntityType must be a valid value", không phải structured error code).

**Điểm chưa chắc chắn / cần hỏi BE:** Không còn — BE đã build thành công trong phiên trước, cùng người
thực hiện.

## FE Surface (các layer sẽ đụng)

> Theo data boundary: components → data hooks → repositories → adapter.

| Layer | File | Thay đổi |
|---|---|---|
| Component | `TaxIqOnboardingWizard.tsx` | Thêm state `businessEntityType` + dropdown ở Step 1, hiển thị ở Step 4 Review, gửi trong `handleSubmit` |
| Component | `EditModuleConfigModal.tsx` | Thêm state + dropdown, pre-fill từ `ownerTaxYear.businessEntityType`, gửi trong `handleSave` |
| Component | `TaxReadinessScoreWidget.tsx` | Đăng ký `MissingBusinessEntityType` vào `READINESS_ITEM_ROUTES` (→ `/dashboard/taxiq`) và `READINESS_ITEM_I18N_KEYS` |
| Data hook | `useTaxiqOwnerTaxYear.ts` | Không đổi — hook forward params nguyên trạng |
| Repository | `taxiqOwnerTaxYear.ts` | Thêm `businessEntityType` vào `OwnerTaxYearApiDto`, `OwnerTaxYear`, `CreateOwnerTaxYearParams`, `UpdateOwnerTaxYearModulesParams`; cập nhật `normalizeOwnerTaxYear`, `create`, `updateModules` |
| Khác | `locales/en.json`, `locales/vi.json` | Thêm `taxiq.onboarding.step1.businessEntityTypeLabel/-None`, `taxiq.onboarding.step4.reviewBusinessEntityType`, 6 label enum, `taxiq.readinessItems.missingBusinessEntityType` |

## Definition of Done

- [x] AC pass trên môi trường dev — verify local-to-local qua Playwright (2026-07-17): chọn LLC trong `EditModuleConfigModal`, `PUT /tax-years/{id}/modules` → 204, reopen modal thấy pre-fill đúng "LLC"
- [x] API call đúng contract đã map — verify qua network thật
- [x] Không console error — 0 error/warning trong toàn bộ phiên test
- [x] `npx tsc --noEmit` và `vite build --mode development` sạch (không lỗi mới trong file đã sửa)
- [x] Cập nhật trạng thái file này

## Ghi chú phiên thực thi

**2026-07-17**: Thêm `businessEntityType` vào `taxiqOwnerTaxYear.ts` (DTO/params/normalize/create/updateModules),
dropdown ở `TaxIqOnboardingWizard.tsx` (step 1 + review step 4) và `EditModuleConfigModal.tsx` (chỉnh sau khi
tạo), đăng ký `MissingBusinessEntityType` vào `READINESS_ITEM_ROUTES`/`READINESS_ITEM_I18N_KEYS` trong
`TaxReadinessScoreWidget.tsx` (trước đó rơi vào fallback `item.description` từ BE, giờ có route + label riêng
+ điều hướng `/dashboard/taxiq`). Locale keys thêm namespace `taxiq.businessEntityType.*` dùng chung cho cả
2 component.

**Verify local-to-local (2026-07-17, Playwright)**: Login Owner `quanpm`, mở Tax IQ — thấy đúng item High
Priority "Business Entity Type is required for CPA Export…" (clickable, route đăng ký đúng, không phải
fallback text). Mở "Edit module config", chọn LLC, Save → `PUT .../modules` 204. Reopen modal → pre-fill
đúng "LLC" (xác nhận round-trip POST/GET/PUT hoạt động đúng). Reload trang → "1 High Priority" biến mất,
score tăng 83%→88%. Lưu ý: ngay sau Save (chưa reload), widget vẫn tạm hiển thị "1 High Priority" cũ do
`useUpdateOwnerTaxYearModules` không invalidate query key readiness-score — đây là gap có sẵn từ trước
(pre-existing, không phải do thay đổi của ticket này), chỉ cần reload/refetch là đúng lại.

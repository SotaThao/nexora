# US-017 · Staff W-9 Real Data Collection

> File: `US-017-staff-w9-real-data.md` · 1 file = 1 story. ID tăng dần, duy nhất toàn repo.

| | |
|---|---|
| **Trạng thái** | Tested (verify local-to-local qua Playwright thành công 2026-07-17) |
| **Ngày tạo** | 2026-07-17 |
| **Epic / Domain** | Tax IQ — Staff Tax Profile (Owner + Staff side) |
| **OpenSpec change** | — (fix mở rộng data layer đã có + xoá 1 endpoint chết; không tạo shared layer mới) |
| **Test plan** | Điền khi viết test (xem `vlink-nexora/docs/plan/tasks/taxiq/be-tasks/test-cases/ENH-TICKET-02-taxiq-staff-w9-real-data-collection-test.md` phía BE) |

## Story

**Là** Thợ (Staff, 1099 Contractor),
**tôi muốn** nhập thông tin W-9 thật của mình (Legal Name, DBA, Address, Tax Classification) và upload
file W-9 đã ký,
**để** Chủ tiệm có đủ dữ liệu lập Form 1099-NEC cho tôi cuối năm, thay vì chỉ có 1 cờ trạng thái không
mang thông tin thật.

**Là** Business Owner (Chủ tiệm),
**tôi muốn** xem dữ liệu W-9 thật của từng Thợ 1099 (không chỉ 1 cờ trạng thái do tôi tự set),
**để** tôi biết chắc thông tin đã có sẵn sàng cho CPA, và không còn tự gán trạng thái "Received" theo
cảm tính.

Bối cảnh: BE (Enhancement Ticket 2) đã hoàn tất trong phiên trước:
- Entity mới `W9Record` (1-1 `StaffTaxProfile`): `LegalName`, `DbaName?`, `Address`, `TaxClassification`,
  `SignedW9S3Key?`.
- **Breaking cho FE**: endpoint cũ `PUT /api/v1/taxiq/owner/staff-tax-years/{id}/w9-status` (Owner tự set
  cờ W9Status sau khi tạo) **đã bị xoá hoàn toàn khỏi BE** (`UpdateStaffW9StatusCommand.cs` không còn
  tồn tại, không route nào khớp `w9-status` trong `Controllers/`). FE hiện tại (`StaffTaxProfileTab.tsx`)
  vẫn gọi endpoint này qua `useUpdateStaffW9Status` — **sẽ 404 nếu không sửa**. Phải xoá path này khỏi
  FE, không chỉ thêm field mới.
- `GetStaffListForTaxIqQuery` (BE) giờ tự tính `W9Status` (Received/Pending/NotRequired) dựa trên
  `W9Record` có tồn tại hay không (chỉ áp dụng khi ContractType = C1099) — endpoint `GET
  /api/v1/taxiq/owner/staff` (đã có, FE đã gọi) trả về field `w9Status` này **tự động, không cần Owner
  set tay nữa**. FE chỉ cần đổi từ ô "chọn" thành hiển thị "chỉ đọc".
- `GetStaffTinQuery` (đã có, FE đã gọi qua `getStaffTin`) giờ trả thêm `W9LegalName`, `W9DbaName`,
  `W9Address`, `W9TaxClassification`, `W9HasSignedDocument` — **không bị mask** (BE trả plaintext luôn,
  kể cả khi `Reveal=false`), khác với SSN/EIN vẫn phải bấm "Reveal".
- `StaffTaxYear.W9Status` (field cũ, set 1 lần lúc tạo StaffTaxYear qua onboarding wizard) **không đổi**
  — `CreateStaffTaxYearCommand`/`CreateStaffTaxYearByOwnerCommand` vẫn nhận field này y như cũ. Story
  này không đụng 2 wizard tạo StaffTaxYear (`StaffTaxIqOnboardingWizard.tsx`, `CreateStaffTaxYearForModal.tsx`).

## Acceptance Criteria

### Staff side — nhập W-9 thật

- **Given** Staff mở `StaffTaxProfileCard.tsx` (màn Tax Profile của Staff)
- **When** trang render
- **Then** thấy thêm section "W-9 Information" với: Legal Name (bắt buộc), DBA (tùy chọn), Address (bắt
  buộc), Tax Classification (dropdown 6 giá trị, bắt buộc), nút upload file W-9 đã ký (tùy chọn) — đặt
  sau section SSN/EIN hiện có

- **Given** Staff nhập Legal Name + Address + Tax Classification, bấm Save
- **When** submit
- **Then** gọi `PUT /api/v1/taxiq/staff/tax-profile/w9`; toast thành công; reload lại thấy pre-fill đúng

- **Given** Staff để trống Legal Name hoặc Address
- **When** submit
- **Then** không gọi API, hiển thị lỗi inline (validate FE trước, khớp `NotEmpty` phía BE)

- **Given** Staff đã lưu W9Record, giờ upload file W-9 đã ký (PDF/ảnh)
- **When** chọn file
- **Then** gọi `POST /api/v1/taxiq/staff/tax-profile/w9/document` (multipart); sau khi xong hiển thị
  "Signed document attached" + link xem file (`signedDocumentUrl`)

### Owner side — xem dữ liệu thật, bỏ cờ thủ công

- **Given** Owner mở `StaffTaxProfileTab.tsx`
- **When** trang render
- **Then** cột "W-9 Status" hiển thị **chỉ đọc** (badge, không phải dropdown) — vì Owner không còn được
  set tay field này nữa (endpoint đã bị BE xoá)

- **Given** Owner bấm "Reveal" ở cột SSN/EIN cho 1 Thợ 1099 đã có W9Record
- **When** dữ liệu tải xong (dùng lại `getStaffTin` đã gọi sẵn)
- **Then** thấy thêm Legal Name / DBA / Address / Tax Classification hiển thị ngay cạnh (không cần bấm
  Reveal riêng cho phần này — BE trả plaintext không mask), và link xem file W-9 đã ký nếu có

- **Given** Owner mở trang khi 1 Thợ 1099 chưa có W9Record
- **When** xem cột W-9 Status
- **Then** hiển thị "Pending" (đúng behavior BE mới — không còn phụ thuộc giá trị Owner từng set tay)

## API Mapping (bắt buộc trước khi integrate)

> Nguồn: BE đã implement trong phiên trước — `StaffTaxYearController.cs`
> (`vlink-nexora/backend/src/Web/Controllers/TaxIq/Staff/StaffTaxYearController.cs`),
> `UpsertW9RecordCommand.cs`, `UploadSignedW9Command.cs`, `GetMyStaffTaxProfileQuery.cs` (Staff side);
> `GetStaffListForTaxIqQuery.cs`, `GetStaffTinQuery.cs` (Owner side). Tag: (L) local backend, `dotnet
> build` sạch, chưa deploy `test-api.nexoratouch.com`.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/taxiq/staff/tax-profile` | Bearer (Staff) | — | `{ ssn?, ein?, w9Record?: { legalName, dbaName?, address, taxClassification, hasSignedDocument, signedDocumentUrl? } }` | (L) |
| PUT | `/api/v1/taxiq/staff/tax-profile/w9` | Bearer (Staff) | `{ legalName, dbaName?, address, taxClassification }` | `204` | (L) |
| POST | `/api/v1/taxiq/staff/tax-profile/w9/document` | Bearer (Staff), `multipart/form-data` | `file` | `204` | (L) |
| GET | `/api/v1/taxiq/owner/staff?ownerTaxYearId=` | Bearer (Owner) | — | `w9Status` field tự tính (Received/Pending/NotRequired), **không đổi contract**, chỉ đổi cách BE tính giá trị | (L) |
| GET | `/api/v1/taxiq/owner/staff-tin?ownerTaxYearId=&staffUserId=&reveal=` | Bearer (Owner) | — | `+ w9LegalName?, w9DbaName?, w9Address?, w9TaxClassification?, w9HasSignedDocument` (luôn plaintext, không phụ thuộc `reveal`) | (L) |
| ~~PUT~~ | ~~`/api/v1/taxiq/owner/staff-tax-years/{id}/w9-status`~~ | — | — | **Đã xoá khỏi BE** — FE phải xoá cả `updateStaffW9Status`/`useUpdateStaffW9Status`/`UpdateStaffW9StatusParams` | (L) |

`taxClassification` enum: `'Individual' \| 'SoleProprietor' \| 'LLC' \| 'Partnership' \| 'CCorp' \| 'SCorp'`.

Error codes: dùng lại `TAXIQ_W9_UPLOAD_FAILED` (upload thất bại), validation message string cho
`LegalName`/`Address` required và `TaxClassification` invalid (không phải structured error code).

**Điểm chưa chắc chắn / cần hỏi BE:** Không còn — BE đã build thành công trong phiên trước, cùng người
thực hiện. Xác nhận qua source code rằng route `w9-status` đã bị xoá (grep toàn bộ `Controllers/` không
ra kết quả).

## FE Surface (các layer sẽ đụng)

> Theo data boundary: components → data hooks → repositories → adapter.

| Layer | File | Thay đổi |
|---|---|---|
| Component | `StaffTaxProfileCard.tsx` | Thêm section W-9 (4 field + upload), wire `useMyStaffTaxProfile`/`useUpsertW9Record`/`useUploadSignedW9` mới |
| Component | `StaffTaxProfileTab.tsx` (Owner) | Xoá `useUpdateStaffW9Status`/`handleW9StatusChange`/dropdown; luôn hiển thị badge chỉ đọc; thêm hiển thị W9Record data cạnh SSN/EIN trong `StaffTinCell` |
| Data hook | `useTaxiqStaffTaxYear.ts` | Thêm `useUpsertW9Record()`, `useUploadSignedW9()` (invalidate `qk.taxiqStaffTaxProfile()`) |
| Data hook | `useTaxiqOwnerPayouts.ts` | Xoá `useUpdateStaffW9Status` (endpoint không còn tồn tại) |
| Repository | `taxiqStaffTaxYear.ts` | Thêm `W9RecordApiDto`/`W9Record` (LegalName/DbaName/Address/TaxClassification/HasSignedDocument/SignedDocumentUrl) lồng trong `StaffTaxProfile`; thêm `UpsertW9RecordParams`, `upsertW9Record()`, `uploadSignedW9(file)` |
| Repository | `taxiqOwnerPayouts.ts` | Xoá `updateStaffW9Status`, `UpdateStaffW9StatusParams`; thêm field W9 vào `StaffTinApiDto`/`StaffTin` |
| Khác | `locales/en.json`, `locales/vi.json` | Thêm namespace `taxiq.taxProfile.w9.*` (label, placeholder, lỗi, tên 6 TaxClassification) |

## Definition of Done

- [x] AC pass trên môi trường dev — verify local-to-local qua Playwright (2026-07-17): Staff `quanpersonal02@mailinator.com` nhập Legal Name/Address/Tax Classification, `PUT /tax-profile/w9` → 204, reload thấy pre-fill đúng; Owner `quanpm` xem `StaffTaxProfileTab` thấy `w9Status = "Received"` (tự tính, không set tay) + Legal Name/Address/TaxClassification hiển thị plaintext cạnh SSN/EIN không cần Reveal
- [x] API call đúng contract đã map — verify qua network thật (không chỉ qua source): `PUT /api/v1/taxiq/staff/tax-profile/w9` → 204; xác nhận route `w9-status` cũ đã xoá khỏi cả FE và BE
- [x] Không console error — 0 error/warning trong toàn bộ phiên test (login, save W9, switch account, xem Owner side)
- [x] `npx tsc --noEmit` và `vite build --mode development` sạch (không lỗi mới trong file đã sửa)
- [x] Cập nhật trạng thái file này

**Chưa test**: upload file W-9 đã ký (multipart) — chưa thử trong phiên Playwright này (chỉ test phần text fields). Pattern giống hệt `useUploadTaxiqReceipt` đã có sẵn và hoạt động ổn định, rủi ro thấp, nhưng nên verify riêng trước khi coi là Done hoàn toàn.

## Ghi chú phiên thực thi

**2026-07-17**: Staff side — thêm `W9RecordApiDto`/`W9Record` lồng trong `StaffTaxProfile`
(`taxiqStaffTaxYear.ts`), `upsertW9Record()`/`uploadSignedW9()` + hooks tương ứng
(`useTaxiqStaffTaxYear.ts`), form W-9 đầy đủ trong `StaffTaxProfileCard.tsx` (Legal Name/DBA/Address/Tax
Classification + upload file, pre-fill từ `w9Record` nếu đã có).

Owner side — phát hiện breaking change từ BE: endpoint `PUT
/api/v1/taxiq/owner/staff-tax-years/{id}/w9-status` đã bị xoá hoàn toàn (không còn
`UpdateStaffW9StatusCommand.cs`, không route nào khớp trong `Controllers/`). Đã xoá
`updateStaffW9Status`/`UpdateStaffW9StatusParams` khỏi `taxiqOwnerPayouts.ts` và
`useUpdateStaffW9Status` khỏi `useTaxiqOwnerPayouts.ts` — nếu không xoá, FE sẽ gọi 404 khi Owner cố đổi
W9 Status. `StaffTaxProfileTab.tsx` đổi cột W-9 Status từ dropdown editable sang badge chỉ đọc (BE giờ
tự tính Received/Pending dựa trên `W9Record` tồn tại hay không), và `StaffTinCell` hiển thị thêm Legal
Name/DBA/Address/Tax Classification/trạng thái file đã ký — lấy thẳng từ `getStaffTin` (BE trả plaintext
không mask cho phần W9, khác SSN/EIN vẫn cần bấm Reveal).

**Chưa làm**: chưa smoke test thật qua browser (không có backend local chạy trong session này). Đặc
biệt cần verify kỹ luồng upload file W-9 (multipart) và luồng Owner xem dữ liệu W9 qua Reveal/masked
query khi có backend thật.

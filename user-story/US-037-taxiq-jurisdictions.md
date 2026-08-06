# US-037 · TaxIQ Jurisdictions (mục 19)

> File: `US-037-taxiq-jurisdictions.md`

| | |
|---|---|
| **Trạng thái** | Done |
| **Ngày tạo** | 2026-07-24 |
| **Epic / Domain** | TaxIQ — Compliance |
| **OpenSpec change** | `—` (single-owner scope: 1 view mới + sửa 2 file đã có, theo đúng precedent US-035/036) |
| **Test plan** | — |

## Story

**Là** Tax Admin,
**tôi muốn** xem bảng tổng hợp Jurisdiction Summary (tên bang, thuế YTD, trạng thái đăng ký, hạn
deposit, hạn gia hạn đăng ký) với badge cảnh báo sắp tới hạn, và chỉnh đầy đủ thông tin đăng ký
(kể cả Agency name, hạn gia hạn, SUTA, và bật/tắt cảnh báo) ngay trong form Add/Edit đã có,
**để** biết merchant còn nợ ai, hạn khi nào, và không bỏ sót việc gia hạn đăng ký hay quên cấu
hình SUTA.

## Acceptance Criteria

- **Given** Owner mở màn `Jurisdictions`
- **When** danh sách tải xong
- **Then** hiện bảng mỗi dòng 1 jurisdiction: `Name` (California, không phải US-CA), `Registration
  Status`, `Deposit Schedule`, `Next Due`, `Employee Tax YTD`, `Employer Tax YTD` — không có cột
  Risk, không có nút Sync (đã bỏ khỏi scope)

- **Given** một jurisdiction có `NextDue` trong vòng 3 ngày và cờ alert đang bật
- **When** xem bảng
- **Then** hiện badge "Deposit due soon"; tương tự badge "Registration expiring soon" khi
  `ExpirationDate` còn ≤30 ngày và cờ bật — cả 2 chỉ là badge tính sẵn từ BE, không phải gửi
  thông báo thật

- **Given** Owner bấm `Manage Registrations`
- **When** modal `EmployerRegistrationsModal` mở (dùng lại, không tạo modal mới)
- **Then** form Add/Edit có đủ: Agency name, Expiration date, 2 checkbox alert, SUTA rate %, SUTA
  wage base cap, `Deposit Schedule` có thêm `Annually`, `Registration Status` có thêm `Inactive`

- **Given** Owner sửa 1 jurisdiction đã có SUTA rate/cap từ trước
- **When** mở form Edit và chỉ đổi Agency name rồi Save (không đụng SUTA)
- **Then** SUTA rate/cap được điền sẵn từ dữ liệu hiện có và gửi lại nguyên giá trị — **không** bị
  reset về 0 (fix bug tồn tại từ trước: form cũ không gửi 2 field SUTA lên BE)

- **Given** danh sách Jurisdictions rỗng (Employer chưa có registration nào)
- **When** tải xong
- **Then** hiện empty state kèm nút mở `Manage Registrations` để thêm mới

## API Mapping (bắt buộc trước khi integrate)

> Nguồn: BE-verified qua live curl trong phiên backend cùng ngày (Name lookup, YTD totals khớp
> Tax Ledger, alert flags bật/tắt đúng, Inactive/Annually enum, validation AgencyName maxlength).

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/taxiq/owner/employers/{id}/registrations/summary` | Owner JWT | — | `List<JurisdictionSummaryItemDto>` (`id,jurisdiction,name,accountNumberMasked,agencyName,registrationStatus,depositSchedule,nextDue,registeredDate,expirationDate,employeeTaxYtd,employerTaxYtd,isDepositDueSoon,isRegistrationExpiringSoon`) | (L) |
| GET | `/api/v1/taxiq/owner/employers/{id}/registrations` (đã có) | Owner JWT | — | `List<EmployerRegistrationDto>` — dùng cho modal Add/Edit hiện có, **không đổi** | (L, trước đó) |
| PUT | `/api/v1/taxiq/owner/employers/{id}/registrations` (đã có, mở rộng) | Owner JWT | thêm `agencyName?`, `expirationDate?`, `alertBeforeDepositDueEnabled` (default true), `alertOnRegistrationExpiryEnabled` (default true), **và fix gửi lại `sutaRatePercent`/`sutaWageBaseCap` đã có sẵn trong form nhưng chưa từng gửi** | `204` / `400` (validation AgencyName > 100 ký tự) | (L) |

**Điểm chưa chắc chắn / cần hỏi BE:** Không — toàn bộ đã verify live.

## FE Surface (các layer sẽ đụng)

| Layer | File | Thay đổi |
|---|---|---|
| Route | `src/components/dashboard/routes/index.tsx` | `TaxIqJurisdictionsRoute` (mới) — cùng shape `TaxIqTaxLedgerRoute` |
| Router | `src/app/AppRouter.tsx` | đăng ký `taxiq/jurisdictions` |
| Menu | `src/components/dashboard/constants.tsx` | thêm `{ id: 'jurisdictions', labelKey: 'dashboard.menu.taxiq_jurisdictions' }` (sau `data-quality`) |
| Component | `src/components/dashboard/views/taxiq/JurisdictionsView.tsx` (mới) | Bảng Jurisdiction Summary + badge alert + nút `Manage Registrations` mở lại `EmployerRegistrationsModal` |
| Component | `src/components/dashboard/views/taxiq/modals/EmployerRegistrationsModal.tsx` (sửa) | Thêm field Agency name/Expiration date/2 checkbox alert/SUTA rate/SUTA cap vào form; `DEPOSIT_SCHEDULES` thêm `Annually`; `REGISTRATION_STATUSES` thêm `Inactive`; **fix gửi kèm `sutaRatePercent`/`sutaWageBaseCap` hiện có khi Save** (bug cũ) |
| Repository | `src/data/repositories/jurisdictions.ts` (mới) | Type `JurisdictionSummaryItem` + `getJurisdictionSummary(employerId)` |
| Repository | `src/data/repositories/taxiqEmployer.ts` (sửa) | `DEPOSIT_SCHEDULES`/`REGISTRATION_STATUSES` thêm giá trị mới; `EmployerRegistration`/`UpsertEmployerRegistrationParams` thêm `agencyName`, `expirationDate`, `alertBeforeDepositDueEnabled`, `alertOnRegistrationExpiryEnabled`, `sutaRatePercent`, `sutaWageBaseCap`; `upsertRegistration` gửi đủ field |
| Data hook | `src/data/hooks/useJurisdictions.ts` (mới) | `useJurisdictionSummary(businessId, employerId)` |
| Khác | `src/data/queryKeys.ts` | `taxiqJurisdictionSummary(businessId?, employerId?)` |
| Khác | `src/locales/en.json`, `vi.json` | `taxiq.jurisdictions.*` mới, `dashboard.menu.taxiq_jurisdictions`, thêm key cho field mới trong `taxiq.employerRegistry.registrations.fields.*`, `taxiq.employerRegistry.depositSchedules.Annually`, `taxiq.employerRegistry.registrations.statuses.Inactive` |

## Definition of Done

- [x] AC pass trên môi trường dev (local backend, `ASPNETCORE_ENVIRONMENT=Test`)
- [x] API call đúng contract đã map (method/status/payload)
- [x] Mutation invalidate đúng query cache (`taxiqJurisdictionSummary`, registrations list hiện có)
- [x] Không console error
- [x] Test qua Playwright: bảng Summary đúng Name/YTD/badge, Edit form đủ field mới, xác nhận
  SUTA không còn bị reset về 0 sau khi sửa field khác, mobile 375×667
- [x] Cập nhật trạng thái file này

## Ghi chú phiên thực thi

Test live qua Playwright trên local backend (`https://localhost:5005`, `ASPNETCORE_ENVIRONMENT=Test`)
+ FE dev server (`localhost:3000`), đăng nhập Owner (`quanpm`), tái sử dụng Employer/data đã seed
từ phiên backend cùng ngày (Employer `0e1a4edb-196a-4765-a9b8-7c74dcdd57a2`).

**Bug tìm thấy và đã sửa trong phiên integrate này:**
- BE: `GetEmployerRegistrationsQuery` (dùng để pre-fill form Edit) chưa trả `agencyName`,
  `expirationDate`, 2 cờ alert, và **cả SUTA rate/cap** — nghĩa là form Edit luôn hiện SUTA=0 dù
  DB đã có giá trị, và Save sẽ ghi đè về 0 thật (đúng bug đã flag trước khi code). Fix: mở rộng
  `EmployerRegistrationDto` + mapping trong handler.
- FE: sau khi thêm `initialFocusJurisdiction` (deep-link Edit từ JurisdictionsView), phát hiện
  qua Playwright — Save xong form tự động MỞ LẠI đúng jurisdiction đó (vì `items` refetch trigger
  lại effect, `formOpen` đã về `false`). Fix: thêm `hasAutoOpenedRef` để effect chỉ tự mở đúng 1
  lần, không lặp lại sau mỗi lần Save.

**Kết quả test:**
- **Jurisdiction Summary**: đúng 3 dòng thật (California/Federal/Texas), `Name` hiện đúng
  ("California" không phải "US-CA"), YTD Employee/Employer Tax khớp Tax Ledger đã test trước đó
  (Texas Employer Tax $28.93, Federal $135.76/$368.59).
- **Deep-link Edit**: bấm Edit trên 1 dòng → modal `EmployerRegistrationsModal` mở thẳng vào form
  Edit đúng jurisdiction đó (không cần tìm lại trong danh sách bên trong modal).
- **SUTA round-trip fix**: sửa Agency Name trên US-CA (đã có sẵn SUTA rate 3.4% / cap 7000) rồi
  Save → reload trang, mở lại Edit → SUTA rate/cap vẫn đúng 3.4/7000, Agency Name lưu đúng
  "California EDD / FTB" — xác nhận bug cũ (reset SUTA về 0) đã hết.
- **Enum mới**: `DepositSchedule.Annually` và `RegistrationStatus.Inactive` chọn được và lưu đúng
  qua toàn bộ pipeline (dropdown → PUT → GET summary → hiện lại đúng).
- **Mobile 375×667**: modal cao đúng 600.3px (= 90dvh cap), không tràn ngang
  (`document.body.scrollWidth` 369 = `clientWidth` 369) kể cả khi form Edit đang mở rộng.
- Console: 0 lỗi/cảnh báo JS trong suốt phiên test.

# US-029 · TaxIQ Employer Registry (mục 10 Payroll doc)

> File: `US-029-taxiq-employer-registry.md`

| | |
|---|---|
| **Trạng thái** | Done |
| **Ngày tạo** | 2026-07-22 |
| **Epic / Domain** | TaxIQ — Payroll / Employers |
| **OpenSpec change** | `openspec/changes/integrate-taxiq-employer-registry` |
| **Test plan** | — |

## Story

**Là** Business Owner (Payroll Admin),
**tôi muốn** xem và quản lý hồ sơ pháp nhân trả lương của doanh nghiệp mình (EIN, ngành nghề, các jurisdiction đã đăng ký thuế, deposit schedule, ngày nộp thuế kế tiếp, điểm sức khỏe hồ sơ),
**để** biết chắc hồ sơ đủ điều kiện trước khi chạy payroll, và biết ngay khi nào hồ sơ đang thiếu (Degraded).

## Acceptance Criteria

- **Given** Owner mở trang Employers lần đầu (chưa có Employer nào cho business)
- **When** trang tải xong
- **Then** hiện empty state với nút `Add Employer`

- **Given** Owner nhấn `Add Employer`, nhập Industry + Federal Deposit Schedule + Enable Strict Finalization, lưu
- **When** submit thành công
- **Then** gọi `POST /api/v1/taxiq/owner/employers` (201), danh sách refetch, Employer mới hiện với `Status = Degraded` (vì registration FED tự tạo là `MissingSetup`), `Health = 0%`

- **Given** Employer đã tồn tại với registration FED ở `MissingSetup`
- **When** Owner mở `Registrations`, khai đầy đủ (account number, status Active, deposit schedule, next due, registered date) và lưu
- **Then** gọi `PUT /api/v1/taxiq/owner/employers/{id}/registrations` (204), danh sách Employers refetch, `Status` chuyển `Active`, `Health = 100%`, account number hiển thị dạng mask

- **Given** Employer đang `Active`
- **When** Owner mở `Edit Employer` và đổi `Status` sang `Inactive` hoặc `Suspended`
- **Then** gọi `PUT /api/v1/taxiq/owner/employers/{id}` (204), bảng phản ánh đúng status mới; không cho phép chọn `Degraded` trong dropdown Status (computed-only)

- **Given** Owner cố tạo employer thứ hai cho cùng một business đã có employer
- **When** submit `Add Employer`
- **Then** `400 TAXIQ_EMPLOYER_ALREADY_EXISTS`, hiện toast lỗi, form giữ nguyên để sửa

## API Mapping (bắt buộc trước khi integrate)

> Nguồn: BE-verified qua live curl trong session backend (`vlink-nexora` repo, ticket US-21) — không phải spec `test-api.nexoratouch.com` (TaxIQ module chưa deploy ở đó). Xem `design.md` cho chi tiết đầy đủ.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/taxiq/owner/employers?BusinessId=&PageNumber=&PageSize=` | Owner JWT | — | `PaginatedList<EmployerDto>` | (L) |
| POST | `/api/v1/taxiq/owner/employers` | Owner JWT | `{businessId, industry?, federalDepositSchedule, enableStrictFinalization}` | `201 Guid` | (L) |
| GET | `/api/v1/taxiq/owner/employers/{id}` | Owner JWT | — | `EmployerDto` | (L) |
| PUT | `/api/v1/taxiq/owner/employers/{id}` | Owner JWT | `{industry?, federalDepositSchedule, enableStrictFinalization, status}` (status: Active\|Inactive\|Suspended only) | `204` | (L) |
| GET | `/api/v1/taxiq/owner/employers/{id}/registrations` | Owner JWT | — | `EmployerRegistrationDto[]` | (L) |
| PUT | `/api/v1/taxiq/owner/employers/{id}/registrations` | Owner JWT | `{jurisdiction, accountNumber?, registrationStatus, depositSchedule, nextDue?, registeredDate?}` | `204` | (L) |

**Điểm chưa chắc chắn / cần hỏi BE:** Không còn — toàn bộ contract xác nhận qua curl thật trong session backend cùng ngày (xem `vlink-nexora/backend/docs/plan/tasks/taxiq/be-tasks/test-cases/US-21-taxiq-employer-registry-test.md`).

## FE Surface (các layer sẽ đụng)

| Layer | File | Thay đổi |
|---|---|---|
| Component | `src/components/dashboard/views/taxiq/EmployerRegistryView.tsx` (mới) | Bảng Employers + empty state + nút Add Employer |
| Component | `src/components/dashboard/views/taxiq/modals/AddEditEmployerModal.tsx` (mới) | Form tạo/sửa employer (dùng chung, `mode: 'create' \| 'edit'`) |
| Component | `src/components/dashboard/views/taxiq/modals/EmployerRegistrationsModal.tsx` (mới) | Bảng + form add/edit registration theo jurisdiction |
| Component | `src/components/dashboard/routes/index.tsx` | `TaxIqEmployersRoute` (mới) — chỉ cần `businessId` từ `useMerchantSetup()`, không cần OwnerTaxYear |
| Component | `src/app/AppRouter.tsx` | Đăng ký route `taxiq/employers` |
| Component | `src/components/dashboard/constants.tsx` | Thêm `{ id: 'employers', labelKey: 'dashboard.menu.taxiq_employers' }` vào `taxiq.children` (luôn hiện, không cần module gate — Employer Registry không có `TaxIqModule` enum tương ứng) |
| Data hook | `src/data/hooks/useTaxiqEmployer.ts` (mới) | `useTaxiqEmployers`, `useCreateEmployer`, `useUpdateEmployer`, `useTaxiqEmployerRegistrations`, `useUpsertEmployerRegistration` |
| Repository | `src/data/repositories/taxiqEmployer.ts` (mới) | Normalize `EmployerDto`/`EmployerRegistrationDto`, gọi `httpClient` |
| Khác | `src/data/queryKeys.ts` | `qk.taxiqEmployers(businessId?)`, `qk.taxiqEmployerRegistrations(employerId?)` |
| Khác | `src/data/errorCodes.ts` | `TAXIQ_EMPLOYER_NOT_FOUND`, `TAXIQ_EMPLOYER_ALREADY_EXISTS`, `TAXIQ_EMPLOYER_REGISTRATION_NOT_FOUND` |
| Khác | `src/locales/en.json`, `vi.json` | `taxiq.employerRegistry.*` |

## Definition of Done

- [x] AC pass trên môi trường dev (local backend)
- [x] API call đúng contract đã map (method/status/payload — verify bằng network)
- [x] Mutation invalidate đúng query cache
- [x] Không console error
- [x] Test theo 3 layer (skill feature-focused-tester): L1 UI / L2 data boundary / L3 flow
- [x] Cập nhật trạng thái file này + link TC

## Ghi chú phiên thực thi

Test live qua Playwright trên local backend (`https://localhost:5005`) + FE dev server
(`localhost:3000`, HMR), đăng nhập Owner (`quanpm`). Business "QuanATM" đã có sẵn 1 Employer từ
session backend trước (industry "Nail Salon", FED Active + TX MissingSetup, Degraded/50%) — dùng
luôn để test thay vì tạo mới.

**Gián đoạn môi trường phát hiện giữa chừng**: Docker Desktop không chạy (máy/Docker có vẻ đã
restart sau session backend cùng ngày) → Postgres/RabbitMQ/Redis container đều down → backend
`/health` trả 503, `POST /authentication/signin` trả 500. Đã khởi động lại Docker Desktop (hỏi ý
kiến user trước vì đây là hành động ở tầm máy, không chỉ trong repo), chờ container `postgres_container`
lên, xác nhận `/health` 200 rồi mới test tiếp — không phải bug của tính năng này.

Kết quả test:
- List employers hiện đúng dữ liệu thật (EIN mask, industry, employees=3, registrations "FED, TX",
  health 50%, status Degraded).
- `Add Employer` khi business đã có employer → đúng `400 TAXIQ_EMPLOYER_ALREADY_EXISTS`, hiện toast
  lỗi đúng bản dịch (phát hiện + tự fix: quên thêm 3 key `errors.taxiq_employer_*` vào
  en.json/vi.json dù đã map trong `errorCodes.ts` — đã bổ sung).
- `Registrations` modal: hoàn tất US-TX (Active, account number, next due) → `PUT .../registrations`
  204 → cả bảng registrations lẫn bảng Employers cha đều refetch đúng: Health 50%→100%,
  Status Degraded→Active. Thêm US-CA mới (MissingSetup) → Health 100%→67%, Status Active→Degraded,
  registrationsSummary "CA, FED, TX" (đúng alphabetical order từ BE).
- `Edit Employer`: prefill đúng Industry/FederalDepositSchedule/EnableStrictFinalization; dropdown
  Status không có option Degraded; khi employer đang Degraded, mặc định chọn "Active" (đúng theo
  design decision D-jurisdiction/Status fallback); đổi sang Inactive → lưu đúng, list cập nhật;
  đổi lại Active (Owner có thể set Active thủ công dù registration chưa đủ — đúng theo
  `UpdateEmployerCommandHandler` không recompute lại, chỉ recompute trong registration-upsert path).
- Toàn bộ network trace khớp `design.md` D1-D4, không có console error nào từ code mới.

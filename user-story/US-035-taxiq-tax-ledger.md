# US-035 · TaxIQ Tax Ledger (mục 16 Tax Ledger doc)

> File: `US-035-taxiq-tax-ledger.md`

| | |
|---|---|
| **Trạng thái** | Done |
| **Ngày tạo** | 2026-07-24 |
| **Epic / Domain** | TaxIQ — Payroll |
| **OpenSpec change** | `—` (single-owner scope: 1 route + 1 view mới + sửa 3 file Payroll Runs đã có, theo đúng precedent US-032/US-033 không tạo OpenSpec) |
| **Test plan** | — |

## Story

**Là** CPA / Auditor / Payroll Admin,
**tôi muốn** xem sổ cái thuế bất biến với hash chain SHA-256 theo từng loại thuế (federal
income tax, social security, medicare, state income tax, SUTA), lọc theo jurisdiction/loại
thuế/run, và xác minh tính toàn vẹn từng bút toán,
**để** chứng minh với cơ quan thuế rằng số liệu chưa bị chỉnh sau khi post, và tạo được run
điều chỉnh khi phát hiện sai mà không đụng vào bút toán cũ.

## Acceptance Criteria

- **Given** Owner mở màn `Tax Ledger`
- **When** danh sách tải xong
- **Then** hiện bảng mỗi dòng một bút toán (Entry code/Run/Employee/Jurisdiction/Type/Taxable/
  Employee Tax/Employer Tax/Hash rút gọn/Action), cùng 3 bộ lọc độc lập kết hợp được
  (Jurisdiction, Type, Run) và phân trang

- **Given** danh sách đang lọc theo Jurisdiction=US-TX
- **When** Owner đổi thêm Type=SocialSecurity
- **Then** cả 2 điều kiện áp cùng lúc (AND), danh sách chỉ còn dòng khớp cả 2

- **Given** một dòng Tax Ledger chưa từng bị can thiệp
- **When** Owner bấm `Verify`
- **Then** gọi `POST .../verify`, hiện toast `Verified`, cột `Last Verified` cập nhật ngay
  không cần reload

- **Given** một run đang ở `LedgerPosted`
- **When** Owner mở Detail modal (Payroll Runs) và bấm `Create Correction Run`
- **Then** mở `CreatePayrollRunModal` ở chế độ điều chỉnh (đã điền sẵn PaySchedule + 4 ngày từ
  run gốc, có thể sửa), submit gọi `POST /payroll-runs` kèm `correctionOfRunId`; run mới tạo
  xong hiện `RunCode` dạng `..._correction_01`, Detail modal của run gốc hiện link tới run điều
  chỉnh trong `correctionRunIds`

- **Given** Owner đang tạo Payroll Run mới (không phải điều chỉnh)
- **When** chọn `Run Type = Bonus`
- **Then** submit gửi `runType: "Bonus"`; sau khi Finalize, Tax Breakdown hiện dòng
  `SupplementalWithholding` (22% flat) thay vì `FederalIncomeTax`

- **Given** danh sách Tax Ledger không có dòng nào khớp bộ lọc
- **When** tải xong
- **Then** hiện empty state, không phải bảng trống

## API Mapping (bắt buộc trước khi integrate)

> Nguồn: BE-verified qua live curl trong session backend cùng ngày (xem
> `docs/plan/tasks/taxiq/be-tasks/test-cases/US-27/28/29-*.md`, repo `vlink-nexora`) — đã test
> thật: FICA đối xứng, SUTA wage-base cap, hash chain nối tiếp qua nhiều run, Verify
> Verified/Mismatch, correction run 2 chiều, Bonus run 22% flat.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/taxiq/owner/tax-ledger?employerId=&jurisdiction=&type=&payrollRunId=&pageNumber=&pageSize=` | Owner JWT | — | `PaginatedList<TaxLedgerListEntryDto>` | (L) |
| POST | `/api/v1/taxiq/owner/tax-ledger/{id}/verify` | Owner JWT | — | `200 VerifyTaxLedgerEntryResultDto` / `400 TAXIQ_TAX_LEDGER_ENTRY_NOT_FOUND` | (L) |
| POST | `/api/v1/taxiq/owner/payroll-runs` (đã có, mở rộng) | Owner JWT | thêm `runType?` (`Regular`\|`Bonus`, mặc định `Regular`), `correctionOfRunId?` | `201 Guid` / `400 TAXIQ_PAYROLL_RUN_NOT_FOUND` (run gốc không tồn tại) / `400 TAXIQ_PAYROLL_RUN_INVALID_STATUS_FOR_ACTION` (run gốc chưa `LedgerPosted`, hoặc khác Employer) | (L) |
| GET | `/api/v1/taxiq/owner/payroll-runs/{id}` (đã có, mở rộng) | Owner JWT | — | thêm `runType`, `correctionOfRunId`, `correctionRunIds: string[]` vào `PayrollRunDetailDto`; `TaxLedgerEntryDto.amount` đổi thành `employeeAmount`/`employerAmount` + `entryCode` (đã integrate ở phiên trước cho `PayrollRunDetailModal`) | (L) |
| GET | `/api/v1/taxiq/owner/payroll-runs` (đã có, mở rộng) | Owner JWT | — | thêm `runType`, `correctionOfRunId` vào từng item `PayrollRunDto` | (L) |

**Điểm chưa chắc chắn / cần hỏi BE:** Không còn — toàn bộ đã verify live trong phiên backend cùng ngày.

## FE Surface (các layer sẽ đụng)

| Layer | File | Thay đổi |
|---|---|---|
| Route | `src/components/dashboard/routes/index.tsx` | `TaxIqTaxLedgerRoute` (mới) — cùng shape `TaxIqPayrollRunsRoute` (resolve Employer bên trong view) |
| Router | `src/app/AppRouter.tsx` | đăng ký `taxiq/tax-ledger` |
| Menu | `src/components/dashboard/constants.tsx` | thêm `{ id: 'tax-ledger', labelKey: 'dashboard.menu.taxiq_tax_ledger' }` (đứng sau `payroll-runs`) |
| Component | `src/components/dashboard/views/taxiq/TaxLedgerView.tsx` (mới) | List + 3 filter (Jurisdiction/Type/Run) + phân trang + nút Verify/dòng, không tách modal riêng — Verify gọi mutation trực tiếp, kết quả qua toast + refetch |
| Component | `src/components/dashboard/views/taxiq/modals/CreatePayrollRunModal.tsx` (sửa) | Thêm chọn `Run Type` (Regular/Bonus); nhận thêm prop `correctionOf?: PayrollRun` để prefill 4 ngày + PaySchedule và đổi title/submit thành "Create Correction Run", gửi `correctionOfRunId` |
| Component | `src/components/dashboard/views/taxiq/modals/PayrollRunDetailModal.tsx` (sửa) | Hiện badge `RunType` khi `Bonus`; hiện `correctionOfRunId`/`correctionRunIds` (dạng link mở Detail modal của run liên quan); thêm nút `Create Correction Run` khi `status === 'LedgerPosted'` |
| Component | `src/components/dashboard/views/taxiq/PayrollRunsView.tsx` (sửa) | Wire callback `onCreateCorrection` từ Detail modal → mở `CreatePayrollRunModal` với `correctionOf` |
| Repository | `src/data/repositories/taxLedger.ts` (mới) | Types `TaxLedgerListEntry`, `TaxLedgerListPage`, `VerifyTaxLedgerEntryResult` + `listTaxLedger`, `verifyEntry` |
| Repository | `src/data/repositories/payrollRuns.ts` (sửa) | `PayrollRun`/`PayrollRunDetail` thêm `runType`, `correctionOfRunId`, `correctionRunIds`; `CreatePayrollRunParams` thêm `runType?`, `correctionOfRunId?` |
| Data hook | `src/data/hooks/useTaxLedger.ts` (mới) | `useTaxLedger(businessId, query)`, `useVerifyTaxLedgerEntry(businessId)` — invalidate `qk.taxiqTaxLedger` |
| Khác | `src/data/queryKeys.ts` | `taxiqTaxLedger` (cùng convention `taxiqPayrollRuns` — filters chỉ append khi có) |
| Khác | `src/data/errorCodes.ts` | `TAXIQ_TAX_LEDGER_ENTRY_NOT_FOUND` mới |
| Khác | `src/locales/en.json`, `vi.json` | `taxiq.taxLedger.*` mới, `dashboard.menu.taxiq_tax_ledger`, `errors.taxiq_tax_ledger_entry_not_found`; bổ sung `taxiq.payrollRuns.createModal.runType*`, `taxiq.payrollRuns.detailModal.correction*` |

## Definition of Done

- [x] AC pass trên môi trường dev (local backend, `ASPNETCORE_ENVIRONMENT=Test` cho CORS)
- [x] API call đúng contract đã map (method/status/payload)
- [x] Mutation invalidate đúng query cache (`taxiqTaxLedger`, `taxiqPayrollRuns`, `taxiqPayrollRun`)
- [x] Không console error
- [x] Test qua Playwright: filter kết hợp, Verify, tạo Bonus run, tạo Correction run, mobile 375×667
- [x] Cập nhật trạng thái file này

## Ghi chú phiên thực thi

Test live qua Playwright trên local backend (`https://localhost:5005`, `ASPNETCORE_ENVIRONMENT=Test`)
+ FE dev server (`localhost:3000`), đăng nhập Owner (`quanpm`), tái sử dụng Employer/worker
(Trump) đã seed từ session backend BE cùng ngày.

**Bug tìm thấy và đã sửa trong phiên integrate này:**
- `GetTaxLedgerQuery` filter theo `Type` bị lỗi 500 (BE, phát hiện qua curl trước khi có FE) —
  `t.Type.ToString()` trong LINQ-to-Entities không dịch được sang SQL khi property có
  `HasConversion<string>()`. Fix: parse enum ở client rồi so sánh enum-to-enum.
- Z-index: `CreatePayrollRunModal` ở chế độ correction luôn mở từ trong `PayrollRunDetailModal`
  đang mở (z-50) nhưng dùng chung z-50 nên bị đứng dưới, chặn click nút submit. Fix: `z-[60]`
  khi `isCorrection`, đúng convention `CancelPayrollRunModal` đã dùng trước đó.
- Label sai: nút xem run điều chỉnh (chiều ngược lại từ run gốc) dùng nhầm key
  `correctionViewLink` ("View original run") — tách riêng thành `correctionRunViewLink`
  ("View correction").

**Kết quả test:**
- **Tax Ledger list**: 18 dòng thật hiện đúng đủ cột, bao gồm cả dòng legacy
  (`EmployeeTax`/`EmployerTax` cũ, Hash rỗng vì chưa từng được hash — đúng thiết kế backfill).
- **Filter kết hợp**: Jurisdiction=US-TX + Type=SutaEmployerTax → đúng 3/18 dòng, 3 chỉ số đầu
  trang tính lại chính xác theo đúng phần đang lọc (Taxable $1,071.43, Employer Tax $28.93).
- **Verify**: bấm trên dòng thật → toast + badge `Verified` cập nhật tại chỗ không cần reload.
- **Bonus run**: tạo qua `CreatePayrollRunModal` với `Run Type = Bonus` → Tax Breakdown hiện
  đúng `SupplementalWithholding` 22% flat ($15.71 trên $71.43 gross), FICA/SUTA vẫn tính bình
  thường.
- **Correction run**: bấm `Create Correction Run` từ Detail modal (`LedgerPosted`) → modal mở
  đúng chế độ điều chỉnh, prefill đủ 4 ngày + PaySchedule từ run gốc; sau khi tạo và Finalize,
  `RunCode` đúng dạng `..._correction_01`, liên kết 2 chiều hiển thị đúng cả 2 hướng
  ("This is a correction of: View original run" / "1 correction run(s): View correction 1").
- **Mobile 375×667**: cả 2 modal lồng nhau (Detail z-50 + Create Correction z-60) đều cap đúng
  `max-height: 600.3px` (90dvh), grid 2 cột tự về 1 cột (`281px` single column); `TaxLedgerView`
  không tràn trang (`document.body.scrollWidth 369 < 375`), bảng 10 cột cuộn ngang đúng trong
  wrapper riêng (`scrollWidth 1000 > clientWidth 335`).
- Console: 0 lỗi/cảnh báo JS trong suốt phiên test.

# US-033 · TaxIQ Payroll Runs (mục 12 Payroll doc)

> File: `US-033-taxiq-payroll-runs.md`

| | |
|---|---|
| **Trạng thái** | Done |
| **Ngày tạo** | 2026-07-23 |
| **Epic / Domain** | TaxIQ — Payroll |
| **OpenSpec change** | `—` (single-owner scope: 1 route + 1 view + 4 modals + repository/hook mới, theo đúng precedent US-032 Weekly Payroll không tạo OpenSpec) |
| **Test plan** | — |

## Story

**Là** Payroll Admin,
**tôi muốn** tạo và quản lý các kỳ lương (payroll run) cho worker W-2 — với Federal/FICA/
Medicare tính thật, Validation Gate rõ ràng, và ledger bất biến khi finalize,
**để** trả lương đúng luật thuế mà không cần tính tay, và có audit trail đầy đủ khi cơ quan thuế
kiểm tra.

## Acceptance Criteria

- **Given** Owner mở màn `Payroll Runs`
- **When** danh sách tải xong
- **Then** hiện bảng mỗi dòng một run với Run ID/Period/Pay Date/Deposit Due/Employees/Gross/Tax/
  Status, cùng bộ lọc Status và phân trang

- **Given** Owner bấm `Create Run`, chọn Pay Schedule + nhập 4 ngày, xác nhận
- **When** hệ thống tự import + validate (atomic, không cần bước riêng)
- **Then** run được tạo với Gross/Tax tính thật, Status là `Approved`/`ReviewRequired`/
  `ValidationFailed` tuỳ dữ liệu worker, modal Detail tự mở

- **Given** một run ở `Approved` hoặc `ValidationFailed`
- **When** Owner bấm `Finalize`, nhập Approval Note, xác nhận
- **Then** gọi `POST .../finalize` (200 kèm payoutIds/totals), run chuyển `LedgerPosted`, Payout
  thật được tạo, Tax Breakdown xuất hiện đúng 2-3 dòng theo jurisdiction

- **Given** một run ở `ReviewRequired` (worker thiếu TIN/W-4/registration)
- **When** Owner xử lý hồ sơ ở màn khác rồi bấm `Rerun Validation`
- **Then** run tính lại đúng, chuyển `Approved` nếu đã đủ điều kiện; `Finalize` bị chặn
  (`TAXIQ_PAYROLL_RUN_INVALID_STATUS_FOR_ACTION`) khi còn `ReviewRequired`

- **Given** một run chưa `LedgerPosted`
- **When** Owner bấm `Cancel Run`, nhập lý do
- **Then** run chuyển `Cancelled`, lý do xuất hiện trong Audit Trail; không huỷ được run đã
  `LedgerPosted`/`Reported`

- **Given** một run `LedgerPosted`
- **When** Owner bấm `Report`
- **Then** tải file CSV đúng cột, run tự chuyển `Reported` (chỉ lần đầu, các lần sau tải lại
  không đổi trạng thái)

## API Mapping (bắt buộc trước khi integrate)

> Nguồn: BE-verified qua live curl trong session backend cùng ngày (15/15 test case pass) — xem
> `docs/plan/tasks/taxiq/be-tasks/test-cases/US-26-taxiq-payroll-runs-test.md` (repo
> `vlink-nexora`). Endpoint `report` đổi từ POST sang **GET** trong phiên FE này để dùng được
> `httpClient.getBlob` (chỉ hỗ trợ GET) — đã sửa cả BE lẫn FE, khớp với convention `export.csv`
> của Weekly Payroll.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| POST | `/api/v1/taxiq/owner/payroll-runs` | Owner JWT | `employerId,paySchedule,periodStart,periodEnd,payDate,depositDue` | `201 Guid` / `400` | (L) |
| GET | `/api/v1/taxiq/owner/payroll-runs?employerId=&status=&pageNumber=&pageSize=` | Owner JWT | — | `PaginatedList<PayrollRunDto>` | (L) |
| GET | `/api/v1/taxiq/owner/payroll-runs/{id}` | Owner JWT | — | `PayrollRunDetailDto` (gate + lineItems + taxBreakdown + auditTrail) | (L) |
| POST | `/api/v1/taxiq/owner/payroll-runs/{id}/rerun-validation` | Owner JWT | — | `204` / `400` | (L) |
| POST | `/api/v1/taxiq/owner/payroll-runs/{id}/finalize` | Owner JWT | `approvalNote` | `200 FinalizePayrollRunResultDto` / `400` | (L) |
| POST | `/api/v1/taxiq/owner/payroll-runs/{id}/cancel` | Owner JWT | `cancelReason` | `204` / `400` | (L) |
| GET | `/api/v1/taxiq/owner/payroll-runs/{id}/report` | Owner JWT | — | `text/csv` file (side effect: `LedgerPosted`→`Reported` on first call) | (L), đổi method trong phiên này |

**Điểm chưa chắc chắn / cần hỏi BE:** Không còn.

## FE Surface (các layer sẽ đụng)

| Layer | File | Thay đổi |
|---|---|---|
| Route | `src/components/dashboard/routes/index.tsx` | `TaxIqPayrollRunsRoute` (mới) — chỉ cần `businessId`, resolve Employer bên trong view |
| Router | `src/app/AppRouter.tsx` | đăng ký `taxiq/payroll-runs` |
| Menu | `src/components/dashboard/constants.tsx` | thêm `{ id: 'payroll-runs', labelKey: 'dashboard.menu.taxiq_payroll_runs' }` (đứng sau `weekly-payroll`) |
| Component | `src/components/dashboard/views/taxiq/PayrollRunsView.tsx` (mới) | List + filter Status + phân trang + nút hành động theo status (Finalize/Review/Report/View) |
| Component | `src/components/dashboard/views/taxiq/modals/CreatePayrollRunModal.tsx` (mới) | Form Run Setup (PaySchedule + 4 ngày) |
| Component | `src/components/dashboard/views/taxiq/modals/PayrollRunDetailModal.tsx` (mới) | Validation Gate + Line Items + Tax Breakdown + Run Summary + Audit Trail + Rerun/Cancel/Report/Finalize |
| Component | `src/components/dashboard/views/taxiq/modals/FinalizePayrollRunModal.tsx` (mới) | Posting Preview + Approval Note bắt buộc |
| Component | `src/components/dashboard/views/taxiq/modals/CancelPayrollRunModal.tsx` (mới) | Cancel reason bắt buộc, xếp lớp trên Detail modal (`z-[60]`) |
| Repository | `src/data/repositories/payrollRuns.ts` (mới) | Types + 6 API method, dùng `{ params }` (không hand-roll query string như Weekly Payroll) |
| Data hook | `src/data/hooks/usePayrollRuns.ts` (mới) | `usePayrollRuns`, `usePayrollRun`, `useCreatePayrollRun`, `useRerunPayrollRunValidation`, `useFinalizePayrollRun`, `useCancelPayrollRun` |
| Khác | `src/data/queryKeys.ts` | `taxiqPayrollRuns` (filters chỉ append khi có), `taxiqPayrollRun` |
| Khác | `src/data/errorCodes.ts` | 7 mã lỗi `TAXIQ_PAYROLL_RUN_*` mới |
| Khác | `src/locales/en.json`, `vi.json` | `taxiq.payrollRuns.*` mới, `dashboard.menu.taxiq_payroll_runs`, `errors.taxiq_payroll_run_*` |

## Definition of Done

- [x] AC pass trên môi trường dev (local backend, Test environment cho CORS)
- [x] API call đúng contract đã map (method/status/payload — verify bằng Playwright network/UI)
- [x] Mutation invalidate đúng query cache (list + detail đều refresh real-time không cần reload)
- [x] Không console error
- [x] Test qua Playwright: Create, Finalize, Cancel, Report, mobile 375×667
- [x] Cập nhật trạng thái file này

## Ghi chú phiên thực thi

Test live qua Playwright trên local backend (`https://localhost:5005`,
`ASPNETCORE_ENVIRONMENT=Test`) + FE dev server (`localhost:3000`), đăng nhập Owner (`quanpm`),
tái sử dụng dữ liệu test W-2 (Trump) đã seed từ session backend BE cùng ngày.

Kết quả:
- **Tạo run mới qua UI** (`pr_2026_06_29`): tính đúng Gross $500/Employee Tax $57.29/Employer
  Tax $38.25 (khớp backend), Status `Approved`, Detail modal tự mở đúng theo `onCreated` callback.
- **Finalize qua UI**: nhập Approval Note, xác nhận → Status chuyển `Ledger Posted` ngay lập
  tức trên cả bảng danh sách lẫn modal Detail đang mở (không cần reload) — xác nhận cache
  invalidation hoạt động đúng cho cả `taxiqPayrollRuns` lẫn `taxiqPayrollRun(id)`.
- **Report qua UI**: bấm từ dòng danh sách → mở Detail modal (theo thiết kế, nút Report thật
  nằm trong Detail) → bấm Report → tải file CSV đúng tên (`{runCode}-report.csv`), Status tự
  chuyển `Reported` ngay, nút Report biến mất khỏi dòng danh sách.
- **Cancel qua UI**: mở Detail modal của 1 run `Approved`, bấm Cancel Run → modal Cancel xếp
  lớp đúng phía trên Detail modal (`z-[60]`) → nhập lý do, xác nhận → Status chuyển `Cancelled`,
  Audit Trail hiện đúng entry `Cancel` kèm lý do đã nhập.
- **Validation Gate + Line Items + Tax Breakdown + Audit Trail**: hiện đúng dữ liệu thật ở mọi
  run test (3 dòng gate đều Pass, 1 line item Trump khớp số, 2 dòng Tax Breakdown US-FED
  EmployeeTax/EmployerTax sau khi Finalize).
- **Mobile 375×667**: verify bằng `getBoundingClientRect`/`getComputedStyle` — Detail modal
  height cap đúng 90dvh (`600.3px` tại viewport 667px), body cuộn đúng bên trong
  (`scrollHeight 809 > clientHeight 470`), 2 bảng Line Items/Tax Breakdown cuộn ngang đúng bên
  trong wrapper riêng (không tràn trang, `document.body.scrollWidth 369 < 375`); Create Run
  modal grid tự về 1 cột (`gridTemplateColumns: 287px`) đúng convention `grid-cols-1
  sm:grid-cols-2`.
- Console: 0 lỗi/cảnh báo JS trong suốt phiên test.

# US-036 · TaxIQ Exceptions Queue + Data Quality Center (mục 17 + mục 18)

> File: `US-036-taxiq-exceptions-and-data-quality.md`

| | |
|---|---|
| **Trạng thái** | Done |
| **Ngày tạo** | 2026-07-24 |
| **Epic / Domain** | TaxIQ — Compliance |
| **OpenSpec change** | `—` (single-owner scope: 2 route + 2 view mới, không đụng shared layer, theo đúng precedent US-032/033/035) |
| **Test plan** | — |

## Story

**Là** Payroll/HR/Tax Owner,
**tôi muốn** quét và xem hàng đợi các bất thường dữ liệu nhân viên (TIN chưa verify, W-4 hết hạn,
Jurisdiction mismatch, thiếu Tax Profile), gán người phụ trách, ghi chú, và đóng kèm lý do; đồng
thời xem tổng quan chất lượng dữ liệu (Employees + Jurisdictions) và biến từng vấn đề thành task
có hạn để theo dõi,
**để** dọn dẹp dữ liệu trước khi chạy payroll/xuất báo cáo CPA mà không bị chặn bởi các module khác
chưa setup xong.

## Acceptance Criteria

- **Given** Owner mở màn `Exceptions Queue`
- **When** bấm nút `Scan`
- **Then** gọi `POST .../exceptions/scan`, hiện toast `Created X, Updated Y`, danh sách refetch

- **Given** danh sách Exceptions có dữ liệu
- **When** Owner lọc theo Status=Open + Severity=High (kết hợp)
- **Then** cả 2 điều kiện áp cùng lúc (AND), danh sách chỉ còn dòng khớp cả 2

- **Given** Owner mở Detail modal của 1 exception đang Open
- **When** bấm `Assign` chọn Owner team khác
- **Then** gọi `POST .../assign`, cột Owner cập nhật ngay không cần reload

- **Given** Owner nhập note vào exception đang Open và bấm `Add Note`
- **When** submit thành công
- **Then** Status chuyển `Reviewing` (hiển thị ngay), note hiện trong Detail modal

- **Given** Owner điền form Resolve nhưng để trống Justification Note
- **When** bấm `Resolve`
- **Then** submit bị chặn, hiện lỗi validation ngay dưới field (client-side), không gọi API

- **Given** Owner điền đủ Resolve form (Resolution Type + Justification Note bắt buộc)
- **When** submit
- **Then** gọi `POST .../resolve`, Status chuyển `Closed`, modal đóng, danh sách refetch, không thể
  Resolve lại (nút ẩn/disable khi Status=Closed)

- **Given** Owner mở màn `Data Quality Center`
- **When** tải xong
- **Then** hiện tổng Blocking Issues, danh sách issue theo Source (Employees/Jurisdictions), và
  card `CPA Ready Score: Not available yet` khi `isCpaReadyScoreAvailable=false` (không hiện số 0
  gây hiểu lầm)

- **Given** Owner bấm `Create Cleanup Task` trên 1 issue
- **When** điền form (Due Date, Owner team; `Blocks related workflow` chỉ bật được khi Severity
  của issue = High)
- **Then** gọi `POST .../cleanup-tasks`, task mới xuất hiện trong danh sách Cleanup Tasks bên dưới

- **Given** Owner bấm `Close` trên 1 Cleanup Task đang Open, để trống Reviewer Note
- **When** submit
- **Then** bị chặn client-side (bắt buộc), không gọi API

- **Given** danh sách Exceptions/Cleanup Tasks không có dòng nào khớp bộ lọc
- **When** tải xong
- **Then** hiện empty state, không phải bảng trống

## API Mapping (bắt buộc trước khi integrate)

> Nguồn: BE-verified qua live curl trong phiên backend cùng ngày (happy path + validation/state
> guard error path đều đã test thật trên Employer `0e1a4edb-196a-4765-a9b8-7c74dcdd57a2`).

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/taxiq/owner/exceptions?EmployerId=&Status=&Severity=&Owner=&PageNumber=&PageSize=` | Owner JWT | — | `PaginatedList<ExceptionListItemDto>` (`id,type,severity,owner,status,periodLabel,memberCount,createdAt,resolutionType,resolvedAt`) | (L) |
| GET | `/api/v1/taxiq/owner/exceptions/{id}` | Owner JWT | — | `ExceptionDetailDto` (+ `members[]: {id,userId,businessStaffLinkId,displayName}`, `justificationNote`, `latestNote`, `resolvedCorrectedValue`, `resolvedReference`) / `400 TAXIQ_EXCEPTION_NOT_FOUND` | (L) |
| POST | `/api/v1/taxiq/owner/exceptions/scan` | Owner JWT | `{employerId}` | `200 {created,updated}` | (L) |
| POST | `/api/v1/taxiq/owner/exceptions/{id}/resolve` | Owner JWT | `{resolutionType: 'Corrected'\|'Waived'\|'FalsePositive'\|'EscalatedToCpa', correctedValue?, reference?, justificationNote}` | `204` / `400` (validation: justificationNote empty) / `400 TAXIQ_EXCEPTION_ALREADY_CLOSED` | (L) |
| POST | `/api/v1/taxiq/owner/exceptions/{id}/assign` | Owner JWT | `{newOwner: 'Payroll'\|'Hr'\|'Tax'}` | `204` / `400 TAXIQ_EXCEPTION_ALREADY_CLOSED` | (L) |
| POST | `/api/v1/taxiq/owner/exceptions/{id}/notes` | Owner JWT | `{note}` | `204` / `400` (validation: note empty) / `400 TAXIQ_EXCEPTION_ALREADY_CLOSED` | (L) |
| GET | `/api/v1/taxiq/owner/data-quality?employerId=` | Owner JWT | — | `DataQualityDto` (`issues[]: {source,issueType,severity,owner,sourceRecordType,sourceRecordId,description}`, `blockingIssues`, `evidenceGaps` (luôn 0), `integrationGaps` (luôn 0), `isCpaReadyScoreAvailable` (luôn `false`), `cpaReadyScore` (luôn `null`)) | (L) |
| GET | `/api/v1/taxiq/owner/data-quality/cleanup-tasks?EmployerId=&Status=&PageNumber=&PageSize=` | Owner JWT | — | `PaginatedList<CleanupTaskDto>` | (L) |
| POST | `/api/v1/taxiq/owner/data-quality/cleanup-tasks` | Owner JWT | `{employerId, issueType, severity: 'Low'\|'Medium'\|'High', owner: 'Payroll'\|'Hr'\|'Tax', dueDate?, sourceRecordType, sourceRecordId, blocksRelatedWorkflow}` | `200 Guid` / `400` (validation: `blocksRelatedWorkflow=true` khi `severity != High`) | (L) |
| POST | `/api/v1/taxiq/owner/data-quality/cleanup-tasks/{id}/close` | Owner JWT | `{reviewerNote}` | `204` / `400` (validation: reviewerNote empty) / `400 TAXIQ_CLEANUP_TASK_ALREADY_CLOSED` | (L) |

**Điểm chưa chắc chắn / cần hỏi BE:** Không — toàn bộ endpoint đã verify live trong phiên backend
cùng ngày (xem transcript curl: scan tạo 2 exception, assign/note/resolve đúng state machine,
data-quality trả đúng 2 nguồn, cleanup-task create/close đúng validation).

**Ghi chú thiết kế (đã chốt với TL, không hỏi lại BE):**
- `evidenceGaps`/`integrationGaps` luôn 0 và `isCpaReadyScoreAvailable` luôn `false` — đây là
  placeholder cho các nguồn Connections/Webhooks/CPA Review chưa xây (xem
  `project_taxiq_connections_phase2_deferred`), FE hiện rõ "Not available yet" thay vì số 0 gây
  hiểu lầm là "không có vấn đề gì".
- `WithholdingDiscrepancy` không tồn tại trong `ExceptionType` — đã bỏ hẳn khỏi scope, không hiện
  trong bộ lọc Type/label.

## FE Surface (các layer sẽ đụng)

> Theo data boundary: components → data hooks → repositories → adapter.

| Layer | File | Thay đổi |
|---|---|---|
| Route | `src/components/dashboard/routes/index.tsx` | `TaxIqExceptionsRoute`, `TaxIqDataQualityRoute` (mới) — cùng shape `TaxIqTaxLedgerRoute` (resolve Employer bên trong view qua `useTaxiqEmployers`) |
| Router | `src/app/AppRouter.tsx` | đăng ký `taxiq/exceptions`, `taxiq/data-quality` |
| Menu | `src/components/dashboard/constants.tsx` | thêm `{ id: 'exceptions', labelKey: 'dashboard.menu.taxiq_exceptions' }`, `{ id: 'data-quality', labelKey: 'dashboard.menu.taxiq_data_quality' }` (sau `tax-ledger`) |
| Component | `src/components/dashboard/views/taxiq/ExceptionsQueueView.tsx` (mới) | List + 3 filter (Status/Severity/Owner) + phân trang + nút `Scan` + click row mở Detail modal |
| Component | `src/components/dashboard/views/taxiq/modals/ExceptionDetailModal.tsx` (mới) | Member list (`displayName`), Assign (select Owner team, gọi ngay), Add Note (textarea + button, disabled khi Closed), Resolve form (ResolutionType select + CorrectedValue/Reference optional text + JustificationNote bắt buộc — client validate trước khi gọi `/resolve`), ẩn form Resolve/Assign/Note khi Status=Closed (chỉ xem lịch sử) |
| Component | `src/components/dashboard/views/taxiq/DataQualityCenterView.tsx` (mới) | Card tổng quan (Blocking Issues, CPA Ready Score "Not available yet"), bảng Issues theo Source (nút `Create Cleanup Task` mỗi dòng), bảng Cleanup Tasks (filter Status, nút `Close` mở modal) |
| Component | `src/components/dashboard/views/taxiq/modals/CreateCleanupTaskModal.tsx` (mới) | Prefill `issueType/severity/owner/sourceRecordType/sourceRecordId` từ issue đã chọn (readonly), chỉ cho sửa Due Date + `Blocks related workflow` (disabled khi severity != High) |
| Component | `src/components/dashboard/views/taxiq/modals/CloseCleanupTaskModal.tsx` (mới) | Textarea Reviewer Note bắt buộc (client validate) |
| Repository | `src/data/repositories/exceptions.ts` (mới) | Types `ExceptionListItem`, `ExceptionListPage`, `ExceptionDetail`, `ScanExceptionsResult` + `listExceptions`, `getExceptionDetail`, `scanExceptions`, `resolveException`, `assignException`, `addExceptionNote` |
| Repository | `src/data/repositories/dataQuality.ts` (mới) | Types `DataQualityIssue`, `DataQuality`, `CleanupTask`, `CleanupTaskListPage` + `getDataQuality`, `listCleanupTasks`, `createCleanupTask`, `closeCleanupTask` |
| Data hook | `src/data/hooks/useExceptions.ts` (mới) | `useExceptions(businessId, query)`, `useExceptionDetail(id)`, `useScanExceptions(businessId)`, `useResolveException(businessId)`, `useAssignException(businessId)`, `useAddExceptionNote(businessId)` — invalidate `qk.taxiqExceptions`/`qk.taxiqException(id)` |
| Data hook | `src/data/hooks/useDataQuality.ts` (mới) | `useDataQuality(businessId, employerId)`, `useCleanupTasks(businessId, query)`, `useCreateCleanupTask(businessId)`, `useCloseCleanupTask(businessId)` — invalidate `qk.taxiqDataQuality`/`qk.taxiqCleanupTasks` |
| Khác | `src/data/queryKeys.ts` | `taxiqExceptions(businessId?, filters?)`, `taxiqException(id?)`, `taxiqDataQuality(businessId?, employerId?)`, `taxiqCleanupTasks(businessId?, filters?)` — cùng convention filters-appended-when-present như `taxiqTaxLedger` |
| Khác | `src/data/errorCodes.ts` | `TAXIQ_EXCEPTION_NOT_FOUND`, `TAXIQ_EXCEPTION_ALREADY_CLOSED`, `TAXIQ_CLEANUP_TASK_NOT_FOUND`, `TAXIQ_CLEANUP_TASK_ALREADY_CLOSED` mới |
| Khác | `src/locales/en.json`, `vi.json` | `taxiq.exceptions.*`, `taxiq.dataQuality.*` mới, `dashboard.menu.taxiq_exceptions`, `dashboard.menu.taxiq_data_quality`, 4 error key mới |

## Definition of Done

- [x] AC pass trên môi trường dev (local backend, `ASPNETCORE_ENVIRONMENT=Test`)
- [x] API call đúng contract đã map (method/status/payload)
- [x] Mutation invalidate đúng query cache
- [x] Không console error
- [x] Test qua Playwright: Scan, filter kết hợp, Assign, Add Note (Open→Reviewing), Resolve
  (validation + happy path + không resolve lại được), Data Quality issues đúng 2 nguồn, Create/
  Close Cleanup Task (validation `blocksRelatedWorkflow` + reviewer note), mobile 375×667
- [x] Cập nhật trạng thái file này

## Ghi chú phiên thực thi

Test live qua Playwright trên local backend (`https://localhost:5005`, `ASPNETCORE_ENVIRONMENT=Test`)
+ FE dev server (`localhost:3000`), đăng nhập Owner (`quanpm`), tái sử dụng Employer/data đã seed
từ phiên backend cùng ngày (Employer `0e1a4edb-196a-4765-a9b8-7c74dcdd57a2`, 2 exceptions +
1 cleanup task tạo qua curl).

**Bug tìm thấy và đã sửa trong phiên integrate này:**
- Import path depth: `ExceptionsQueueView.tsx`/`DataQualityCenterView.tsx` ban đầu dùng 3 cấp
  `../../../` cho `contexts`/`data`/`types`/`ui` — sai 1 cấp (đúng convention của
  `TaxLedgerView.tsx` là 4 cấp `../../../../` vì view nằm ở `views/taxiq/`, không phải
  `views/`). Gây `TS2307` module-not-found. Fix bằng cách thêm 1 cấp `../` cho toàn bộ import
  trong 2 file này (modals ở `views/taxiq/modals/` vẫn đúng 5 cấp ngay từ đầu).
- Backend: `DataQualityController.CreateCleanupTask` khai báo `[ProducesResponseType(201Created)]`
  nhưng code trả `Ok(result)` (200) — sửa thành `StatusCode(201, result)` cho khớp annotation,
  theo đúng convention `EmployerController.Create` (POST tạo mới trả 201).

**Kết quả test:**
- **Exceptions Queue**: danh sách hiện đúng 2 exception thật (Tax Profile Missing/Closed,
  TIN Verification Pending) đã tạo từ phiên backend; filter kết hợp Status=Reviewing +
  Severity=High → đúng 1/2 dòng.
- **Assign**: đổi Owner HR→Tax trong Detail modal → cập nhật ngay cả trong bảng nền lẫn dropdown,
  toast "Owner updated.", không cần reload.
- **Resolve**: nút Resolve disabled khi Justification Note trống (client-side); điền đủ (Waived +
  note) → gọi `POST /resolve` thật, Status chuyển Closed, modal đóng, danh sách refetch, dòng biến
  mất khỏi filter Reviewing+High (đúng vì đã Closed).
- **Data Quality Center**: đúng 2 nguồn — "Employees" (đọc từ Exception, ẩn dòng đã Closed) +
  "Jurisdictions" (EmployerRegistration MissingSetup, US-CA); `CPA Ready Score` hiện "Not
  available yet" thay vì số 0 gây hiểu lầm.
- **Create Cleanup Task**: checkbox `Blocks related workflow` chỉ bật được vì issue Severity=High;
  submit tạo task Open mới, hiện ngay trong bảng Cleanup Tasks không cần reload.
- **Close Cleanup Task**: nút Close Task disabled khi Reviewer Note trống; điền note → submit
  thật, Status chuyển Closed, action ẩn đi.
- **Mobile 375×667**: `ExceptionDetailModal` cao 503px (< 600.3px = 90dvh cap), không tràn
  ngang (`document.body.scrollWidth` 369 = `clientWidth` 369); bảng danh sách cuộn ngang đúng
  trong wrapper riêng.
- Console: 0 lỗi/cảnh báo JS trong suốt phiên test.

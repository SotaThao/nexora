# US-041 · TaxIQ Forms & Reports (mục 20)

> File: `US-041-taxiq-forms-reports.md` · 1 file = 1 story. ID tăng dần, duy nhất toàn repo.

| | |
|---|---|
| **Trạng thái** | Done |
| **Ngày tạo** | 2026-07-27 |
| **Epic / Domain** | TaxIQ — Compliance / Payroll Tax Forms |
| **OpenSpec change** | `—` (single-owner: 1 view mới + 3 modal, tái dùng Share Link (US-038) và Export Package infra có sẵn, không đụng shared layer) |
| **Test plan** | — |

## Story

**Là** chủ tiệm / Payroll Admin,
**tôi muốn** xem 5 báo cáo thuế lương (W-2, 1099, 941, 940 FUTA, SUTA) với trạng thái rõ ràng
(Draft/Needs Review/Ready/Archived), xem trước nội dung từng dòng biểu mẫu, xác nhận đã rà soát
xong để chuyển Ready, chia sẻ 1 báo cáo cụ thể cho CPA với quyền tối thiểu, và tạo gói dữ liệu
xuất (Payroll run / 1099 support / Mileage / Tip ledger) với chế độ che SSN/TIN mặc định,
**để** nộp đúng hạn (đặc biệt mốc chung Jan 31 cho W-2/1099/940), không dùng nhầm số liệu chưa
rà soát, và không vô tình đưa PII gốc ra ngoài hệ thống.

## Acceptance Criteria

- **Given** Owner mở màn `Forms & Reports`
- **When** danh sách tải xong
- **Then** hiện đúng 5 dòng (W-2 Wage Summary/YTD, Federal 941 Worksheet/quý hiện tại, Federal 940
  FUTA Worksheet/YTD, State SUTA Reconciliation/quý hiện tại, 1099 Contractor Report/quý hiện tại),
  mỗi dòng có Report/Period/Records/Source/Due/Status; SUTA hiện `Due: Varies by state` thay vì
  ngày cụ thể

- **Given** một dòng đang `Draft` hoặc `Ready`
- **When** Owner bấm `Preview`
- **Then** mở modal xem nội dung đúng loại: W-2 → bảng theo từng nhân viên (wages/federal/SS/
  Medicare); 941 → 5 dòng theo đúng số IRS Form 941 (Line 1/2/5a/5c/13); 940 → tổng FUTA taxable
  wages + tax due; SUTA → bảng theo từng jurisdiction (taxable wages/wage base cap/tax due)

- **Given** một dòng đang `Needs Review`
- **When** Owner bấm `Preview`
- **Then** vẫn xem được nội dung (Preview không bị chặn theo status) nhưng banner cảnh báo "còn
  blocker ở Data Quality, cần xử lý trước khi Confirm Ready" hiện rõ, nút `Confirm Ready` bị vô
  hiệu hoặc hiện lỗi khi bấm

- **Given** một dòng đang `Draft` và không còn blocker
- **When** Owner bấm `Confirm & Mark Ready`
- **Then** gọi API, status chuyển `Ready` ngay trên UI (refetch), nút `Share`/`Archive` được kích
  hoạt

- **Given** một dòng đang `Ready`
- **When** số liệu nguồn thay đổi (vd: có payroll run mới được Finalize trong kỳ báo cáo đó) và
  Owner load lại trang
- **Then** status tự động quay lại `Draft` (không cần hành động gì thêm — hệ thống tự phát hiện)

- **Given** một dòng đang `Ready`
- **When** Owner bấm `Archive`
- **Then** status chuyển `Đã lưu trữ`, các nút hành động khác bị ẩn/vô hiệu

- **Given** một dòng đang `Draft` hoặc `Needs Review`
- **When** Owner bấm `Share`
- **Then** bị chặn với thông báo lỗi rõ ràng (chỉ báo cáo `Ready` mới chia sẻ được)

- **Given** một dòng đang `Ready`
- **When** Owner bấm `Share`, điền Recipient/Email, giữ mặc định `Review-only` + `15 days`
- **Then** tạo Share Link thành công, hiện access token + nút Copy Link (giống mẫu US-038/US-040)

- **Given** Owner bấm `Generate Package`
- **When** chọn 1 trong 4 loại (`Payroll run package`/`1099 support package`/`Mileage package`/
  `Tip ledger package`) và giữ mặc định PII mode `Masked`
- **Then** tạo gói thành công, hiện link tải (zip chứa `report.pdf` + `data.csv`), SSN/TIN trong
  data (nếu có, ở gói 1099 support) hiện dạng che (vd `***-**-1234`)

- **Given** Owner chọn PII mode `Full` khi Generate Package
- **When** xác nhận (yêu cầu 1 bước tick riêng "Tôi hiểu đây là dữ liệu PII gốc")
- **Then** gói tạo ra chứa SSN/TIN đầy đủ không che (chỉ áp dụng ý nghĩa cho gói 1099 support —
  3 gói còn lại không có PII nên field này không đổi kết quả)

## API Mapping (bắt buộc trước khi integrate)

> Nguồn: BE-verified qua live curl trong phiên backend cùng ngày (mục 20, ticket 1-5).

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/taxiq/owner/forms-reports?ownerTaxYearId=` | Owner JWT | — | `FormsReportListItemDto[]` | (L) |
| GET | `/api/v1/taxiq/owner/forms-reports/{id}/preview` | Owner JWT | — | `FormsReportPreviewDto` | (L) |
| POST | `/api/v1/taxiq/owner/forms-reports/{id}/confirm-ready` | Owner JWT | — | `204` / `400 TAXIQ_FORMS_REPORT_NOT_READY_TO_CONFIRM` | (L) |
| POST | `/api/v1/taxiq/owner/forms-reports/{id}/archive` | Owner JWT | — | `204` / `400 TAXIQ_FORMS_REPORT_NOT_READY_TO_ARCHIVE` | (L) |
| POST | `/api/v1/taxiq/owner/forms-reports/{id}/share` | Owner JWT | `ShareFormsReportRequestDto` | `ShareLinkDto` (201) / `400 TAXIQ_FORMS_REPORT_NOT_READY_TO_CONFIRM` | (L) |
| POST | `/api/v1/taxiq/owner/export/draft?ownerTaxYearId=&packageType=&piiMode=` | Owner JWT | — (query only) | `ExportPackageDto` | (L) |

**DTO shapes (đọc trực tiếp từ `specification.json` đã regen sau khi BE build xong phiên này):**

```ts
// FormsReportListItemDto
{ formsReportId: string | null; reportType: 'W2'|'Form941'|'Form940'|'Suta'|'Nec1099';
  reportName: string; taxYear: number; quarter: number | null; periodLabel: string;
  records: number; source: string; due: string | null; dueLabel: string;
  status: 'Draft'|'NeedsReview'|'Ready'|'Archived' }

// FormsReportPreviewDto
{ reportType: string; periodLabel: string; status: string; source: string; due: string | null;
  records: number;
  w2Lines: W2EmployeeLineDto[] | null;      // chỉ có khi reportType === 'W2'
  form941: Form941PreviewDto | null;        // chỉ có khi reportType === 'Form941'
  form940: Form940PreviewDto | null;        // chỉ có khi reportType === 'Form940'
  sutaLines: SutaJurisdictionLineDto[] | null } // chỉ có khi reportType === 'Suta'

// W2EmployeeLineDto
{ posStaffProfileId: string; staffName: string; wages: number; federalIncomeTaxWithheld: number;
  socialSecurityWages: number; socialSecurityTaxWithheld: number; medicareWages: number;
  medicareTaxWithheld: number }

// Form941PreviewDto
{ line1TotalWages: number; line2FederalIncomeTaxWithheld: number;
  line5aTaxableSocialSecurityWages: number; line5aSocialSecurityTax: number;
  line5cTaxableMedicareWages: number; line5cMedicareTax: number; line13TotalDeposits: number }

// Form940PreviewDto
{ totalFutaTaxableWages: number; futaTaxDue: number }

// SutaJurisdictionLineDto
{ jurisdiction: string; taxableWages: number; wageBaseCap: number; sutaTaxDue: number }

// ShareFormsReportRequestDto (request body cho POST .../share)
{ ownerTaxYearId: string; recipientName: string; recipientType: 'Cpa'|'Technician'|'Friend'|'External'; // xem enum đầy đủ ở US-038
  cpaEmail: string | null; accessMode: 'ReviewOnly'|'UploadOnly'|'ReviewAndUpload';
  downloadPermission: 'Disabled'|'PdfOnly'|'PdfAndCsv'; passcode: string | null; expiryDays: 7|15|30|null }

// CpaPackageType (chỉ 4 giá trị mới dùng cho Generate Package — 3 giá trị Basic/Full/CPAReview
// thuộc luồng CPA year-end package khác, KHÔNG hiện trong UI Forms & Reports)
'PayrollRunPackage' | 'OneNinetyNineSupportPackage' | 'MileagePackage' | 'TipLedgerPackage'

// PiiMode
'Masked' | 'Full'

// ExportPackageDto
{ id: string; exportType: 'Draft'|'Final'|'Amended'; version: number; signedUrl: string;
  exportedAt: string | null }
```

**Điểm chưa chắc chắn / cần hỏi BE:** Không có — toàn bộ endpoint đã verify trực tiếp qua curl
trong phiên backend cùng ngày trước khi viết story này (xem `project_taxiq_forms_reports.md`).

**Lưu ý quan trọng khi integrate:**
- `formsReportId` là `null` cho dòng `Nec1099` — nút `Preview`/`Confirm Ready`/`Archive`/`Share`
  của dòng này phải điều hướng sang màn `Tax Center — 1099-NEC` đã có (US-039), KHÔNG gọi API
  Forms & Reports cho dòng này.
- `due` là `null` cho SUTA — luôn hiển thị `dueLabel` (string có sẵn), không tự format `due`.
- `Generate Package` không có tham số "Included Sections" hay "Date range" như doc BA mô tả —
  BE quyết định mỗi `packageType` tự pull đúng 1 nguồn cố định (không cho chọn range/section tùy
  ý) để giữ đúng nguyên tắc "mỗi báo cáo chỉ có một nguồn số liệu". Nếu cần "CPA year-end package"
  đầy đủ (Basic/Full/CPAReview) thì đó là luồng khác đã có sẵn (Owner Dashboard), không thuộc màn
  này.

## FE Surface (các layer sẽ đụng)

> Theo data boundary: components → data hooks → repositories → adapter.

| Layer | File | Thay đổi |
|---|---|---|
| Component | `src/components/dashboard/views/taxiq/FormsReportsView.tsx` (mới) | Bảng 5 dòng + filter (Type/Period/Status), nút Preview/Confirm Ready/Archive/Share/Generate Package trên từng dòng |
| Component | `src/components/dashboard/views/taxiq/modals/FormsReportPreviewModal.tsx` (mới) | Render nội dung theo `reportType` (4 layout khác nhau W2/941/940/SUTA) |
| Component | `src/components/dashboard/views/taxiq/modals/ShareFormsReportModal.tsx` (mới) | Form Share giống `ExportTipLedgerModal.tsx` (US-040), đổi field/endpoint |
| Component | `src/components/dashboard/views/taxiq/modals/GenerateFormsReportPackageModal.tsx` (mới) | Chọn packageType (4 option) + PiiMode toggle (Masked mặc định, Full cần tick xác nhận) |
| Data hook | `src/data/hooks/useTaxiqFormsReports.ts` (mới) | `useFormsReports(ownerTaxYearId)`, `useFormsReportPreview(id)`, `useConfirmFormsReportReady()`, `useArchiveFormsReport()`, `useShareFormsReport()`, `useGenerateFormsReportPackage()`; query key `qk.taxiqFormsReports(ownerTaxYearId)`, invalidate sau confirm/archive |
| Repository | `src/data/repositories/taxiqFormsReports.ts` (mới) | Types + hàm gọi 6 endpoint trên, normalize `due`/`quarter` null-safe |
| Data | `src/data/queryKeys.ts` | thêm `taxiqFormsReports: (ownerTaxYearId?: string) => [...]` |
| Route | `src/components/dashboard/routes/index.tsx` + `src/app/AppRouter.tsx` | route mới `taxiq/forms-reports`, resolve `ownerTaxYearId` giống `TaxIqTipLedgerRoute` |
| Nav | `src/components/dashboard/constants.tsx` | thêm menu item `forms-reports` dưới TaxIQ |
| i18n | `src/locales/en.json`, `src/locales/vi.json` | block `taxiq.formsReports.*` |

## Definition of Done

- [ ] AC pass trên môi trường dev (API thật, backend local đã có sẵn từ phiên này)
- [ ] API call đúng contract đã map (method/status/payload — verify bằng network)
- [ ] Mutation (confirm-ready/archive/share/generate) invalidate đúng query cache
- [ ] Không console error
- [ ] Test theo 3 layer (skill feature-focused-tester): L1 UI / L2 data boundary / L3 flow
- [ ] Mobile responsive (test 375×667, `nexora-modal-card` cho các modal)
- [ ] Cập nhật trạng thái file này + link TC

## Ghi chú phiên thực thi

Đã live-test toàn bộ qua Playwright trên backend local (Test env) + FE dev server (port 3000),
đăng nhập `quanpm`/QuanATM:

- List 5 dòng render đúng data (khớp curl backend cùng phiên): W-2/941/940/SUTA tính live, 1099
  đọc từ Form1099Nec. Status badge render đúng text (Draft/Ready/Needs Review/Archived), không
  gặp lại pattern "badge trống trên accessibility snapshot" từ các phiên trước.
- Preview modal: verify đúng nội dung Form 941 (Line 1/2/5a/5c/13 khớp số curl) và bảng W-2
  per-employee.
- Confirm & Mark Ready: bấm trên dòng Draft (940) → chuyển Ready ngay trên UI (refetch, không
  cần reload).
- Share: bấm trên dòng Ready (W-2) → điền form → tạo Share Link thật, hiện access token + Copy
  Link — đúng luồng.
- Generate Package: test cả 2 nhánh PII mode — bấm Generate với `Full` mà chưa tick checkbox xác
  nhận → bị chặn đúng với message `piiFullConfirmRequired`; tick xác nhận rồi Generate → tạo gói
  thật (Payroll Run Package, Full PII), có link tải zip thật từ S3-compatible storage.
- Mobile 375×667: verify cả trang chính lẫn 2 modal (Generate Package, Preview W-2 với bảng rộng)
  — không có overflow toàn trang (`document.body.scrollWidth` ≤ viewport width), bảng W-2 tự
  scroll ngang trong container riêng của nó (đúng thiết kế, không phải bug).
- 0 console error trong suốt phiên test (đã loại trừ các lỗi console cũ từ tab/port khác trước
  khi backend khởi động, không liên quan tới code mới).

**Bug tự phát hiện khi code (không phải từ test)**: 3 file modal mới (`FormsReportPreviewModal`,
`ShareFormsReportModal`, `GenerateFormsReportPackageModal`) ban đầu viết sai độ sâu relative import
(thiếu 1 cấp `../`) do nhầm với độ sâu của `FormsReportsView.tsx` (nông hơn 1 cấp vì nằm ngoài thư
mục `modals/`) — phát hiện ngay qua `pnpm typecheck`, sửa khớp theo đúng độ sâu của
`ExportTipLedgerModal.tsx` trước khi build.

Không sửa `taxiqOwnerExport.ts` (US-06, luồng CPA year-end Basic/Full/CPAReview) — tạo repository
riêng `taxiqFormsReports.ts` dù cùng gọi 1 endpoint `/owner/export/draft`, để không đụng vào flow
đã ship trước đó (đúng theo CLAUDE.md "Keep edits narrow").

# US-042 · TaxIQ Tax Estimate (mục 27)

> File: `US-042-taxiq-tax-estimate.md` · 1 file = 1 story. ID tăng dần, duy nhất toàn repo.

| | |
|---|---|
| **Trạng thái** | Done |
| **Ngày tạo** | 2026-07-28 |
| **Epic / Domain** | TaxIQ — Compliance / Payroll Tax Estimate |
| **OpenSpec change** | `—` (single-owner: 1 view mới, không đụng shared layer) |
| **Test plan** | — |

## Story

**Là** chủ tiệm / Payroll Admin,
**tôi muốn** xem ước tính thuế theo quý (Est.Tax/Withheld/Balance) tách theo từng jurisdiction
kèm mức rủi ro, danh sách hạn nộp sắp tới, và bảng kiểm 6 nhóm hồ sơ readiness,
**để** chủ động biết mình còn thiếu gì trước 4 mốc nộp thuế quý (Apr15/Jul15/Sep15/Jan15) mà
không phải tự tính tay hay đợi đến hạn mới phát hiện thiếu sót.

## Acceptance Criteria

- **Given** Owner mở màn `Tax Estimate`
- **When** trang tải xong
- **Then** hiện 4 thẻ quý (Q1-Q4) với Due date/Total Gross Wages/Est.Tax/Withheld/Balance; quý
  hiện tại được highlight/chọn mặc định

- **Given** Owner chọn 1 quý khác trong 4 thẻ
- **When** chọn xong
- **Then** bảng "By Jurisdiction" bên dưới cập nhật đúng quý đó (Est.Tax/Deposited/Balance/Risk
  level mỗi jurisdiction), gọi lại API với `quarter` tương ứng

- **Given** Business chưa có Employer (module chưa setup)
- **When** Owner mở màn này
- **Then** vẫn render đủ 4 thẻ quý (giá trị $0), không lỗi/không chặn trang — đúng nguyên tắc
  Module Independence

- **Given** danh sách Deposit Schedule Alerts
- **When** tải xong
- **Then** hiện đúng thứ tự theo hạn gần nhất trước, mỗi dòng có Jurisdiction/Next Due/Deposit
  Schedule/Days Until Due/Risk badge (màu theo risk: High=đỏ/Medium=vàng/Low=xanh)

- **Given** danh sách Deposit Schedule Alerts
- **When** Owner bấm `Export CSV`
- **Then** tải file `deposit-schedule.csv` trực tiếp (không qua modal/Export Package)

- **Given** US Tax Readiness Checklist (6 nhóm)
- **When** tải xong
- **Then** mỗi nhóm hiện đúng badge trạng thái (Ready/Needs Attention/Not Started) khớp dữ liệu
  thật (vd: 1 jurisdiction registration đang Inactive → nhóm "State Payroll Setup" phải hiện
  `Needs Attention`, không phải `Ready`)

- **Given** khu vực Connect CPA / Update Withholding
- **When** Owner bấm mỗi nút
- **Then** điều hướng tĩnh sang màn có sẵn tương ứng (`Connect CPA` → CPA Access, `Update
  Withholding` → Employers) — không gọi API mới, không mở modal mới

## API Mapping (bắt buộc trước khi integrate)

> Nguồn: BE-verified qua live curl trong phiên backend cùng ngày (mục 27, ticket 1-3) + đối chiếu
> trực tiếp `specification.json` đã regen.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/taxiq/owner/tax-estimate?ownerTaxYearId=&quarter=` | Owner JWT | `quarter` optional (1-4, mặc định quý hiện tại) | `TaxEstimateDto` | (L) |
| GET | `/api/v1/taxiq/owner/tax-estimate/deposit-schedule-alerts?ownerTaxYearId=` | Owner JWT | — | `DepositScheduleAlertDto[]` | (L) |
| GET | `/api/v1/taxiq/owner/tax-estimate/deposit-schedule/export?ownerTaxYearId=` | Owner JWT | — | `text/csv` file | (L) |
| GET | `/api/v1/taxiq/owner/tax-estimate/readiness-checklist?ownerTaxYearId=` | Owner JWT | — | `TaxReadinessChecklistDto` | (L) |

**DTO shapes (đọc trực tiếp từ `specification.json` đã regen sau khi BE build xong phiên này):**

```ts
// TaxEstimateDto
{ ownerTaxYearId: string; taxYear: number; selectedQuarter: number;
  quarters: TaxEstimateQuarterDto[]; byJurisdiction: JurisdictionEstimateDto[] }

// TaxEstimateQuarterDto
{ quarter: number; dueDate: string; totalGrossWages: number; estTax: number;
  withheld: number; balance: number }

// JurisdictionEstimateDto
{ jurisdiction: string; estTax: number; deposited: number; balance: number;
  riskLevel: 'High' | 'Medium' | 'Low' }

// DepositScheduleAlertDto
{ jurisdiction: string; nextDue: string | null; depositSchedule: string;
  daysUntilDue: number | null; riskLevel: 'High' | 'Medium' | 'Low' }

// TaxReadinessChecklistDto
{ ownerTaxYearId: string;
  groups: { groupName: 'BusinessIdentity'|'WorkerSetup'|'FederalPayrollTaxes'|
    'StatePayrollSetup'|'EvidenceVault'|'CpaFilingPackage';
    status: 'Ready'|'NeedsAttention'|'NotStarted' }[] }
```

**Điểm chưa chắc chắn / cần hỏi BE:** Không có — toàn bộ endpoint đã verify trực tiếp qua curl
trong phiên backend cùng ngày trước khi viết story này (xem `project_taxiq_tax_estimate.md`),
kể cả đối chiếu 1 trường hợp `NeedsAttention` với DB thật (US-CA registration `Inactive`).

**Lưu ý quan trọng khi integrate:**
- `riskLevel` ở `JurisdictionEstimateDto` và `DepositScheduleAlertDto` dùng 2 rule khác nhau ở
  BE (breakdown theo Balance+due date; alert theo due date thuần) — FE chỉ cần render string,
  không tự tính lại.
- `dueDate`/`nextDue` là `date`/`date-time` string chuẩn ISO — format hiển thị ở FE, không parse
  lại theo local timezone kiểu `new Date().toISOString()` (xem
  `feedback_frontend_datetime_timezone_naive` — chỉ dùng để hiển thị, không có form nhập ở màn
  này nên rủi ro thấp hơn các màn trước).
- `groupName` là 6 giá trị cố định — dùng để tra i18n key + label hiển thị (Business Identity/
  Worker Setup/Federal Payroll Taxes/State Payroll Setup/Evidence Vault/CPA Filing Package), FE
  tự map, không hiển thị nguyên `groupName` string.
- `Connect CPA`/`Update Withholding` là link tĩnh, không phải component mới — điều hướng bằng
  `navigate('/dashboard/taxiq/cpa-access')` / `navigate('/dashboard/taxiq/employers')`.

## FE Surface (các layer sẽ đụng)

> Theo data boundary: components → data hooks → repositories → adapter.

| Layer | File | Thay đổi |
|---|---|---|
| Component | `src/components/dashboard/views/taxiq/TaxEstimateView.tsx` (mới) | 4 thẻ quý (chọn được) + bảng By Jurisdiction + Deposit Schedule Alerts + Readiness Checklist + 2 nút điều hướng tĩnh |
| Component | `src/components/dashboard/views/taxiq/shared/TaxRiskBadge.tsx` (mới) | Badge màu theo `riskLevel` (High/Medium/Low), tái dùng ở cả 2 bảng |
| Component | `src/components/dashboard/views/taxiq/shared/TaxReadinessBadge.tsx` (mới) | Badge màu theo `status` (Ready/NeedsAttention/NotStarted) |
| Data hook | `src/data/hooks/useTaxiqTaxEstimate.ts` (mới) | `useTaxEstimate(ownerTaxYearId, quarter)`, `useDepositScheduleAlerts(ownerTaxYearId)`, `useTaxReadinessChecklist(ownerTaxYearId)`; query key `qk.taxiqTaxEstimate(ownerTaxYearId, quarter)` / `qk.taxiqDepositScheduleAlerts(ownerTaxYearId)` / `qk.taxiqTaxReadinessChecklist(ownerTaxYearId)` |
| Repository | `src/data/repositories/taxiqTaxEstimate.ts` (mới) | Types + hàm gọi 4 endpoint trên (3 GET JSON + 1 GET blob cho export CSV) |
| Data | `src/data/queryKeys.ts` | thêm 3 key mới cạnh `taxiqFormsReports` |
| Route | `src/components/dashboard/routes/index.tsx` + `src/app/AppRouter.tsx` | route mới `taxiq/tax-estimate`, resolve `ownerTaxYearId` giống `TaxIqFormsReportsRoute` |
| Nav | `src/components/dashboard/constants.tsx` | thêm menu item `tax-estimate` dưới `forms-reports` |
| i18n | `src/locales/en.json`, `src/locales/vi.json` | block `taxiq.taxEstimate.*` |

## Definition of Done

- [x] AC pass trên môi trường dev (API thật, backend local đã có sẵn từ phiên này)
- [x] API call đúng contract đã map (method/status/payload — verify bằng network)
- [x] Đổi quý → gọi lại đúng query key, không cache lẫn giữa các quý
- [x] Không console error
- [x] Test theo 3 layer (skill feature-focused-tester): L1 UI / L2 data boundary / L3 flow
- [x] Mobile responsive (test 375×667)
- [x] Cập nhật trạng thái file này + link TC

## Ghi chú phiên thực thi

Đã live-test toàn bộ qua Playwright trên backend local (Test env) + FE dev server (port 3000),
đăng nhập `quanpm`/QuanATM (OwnerTaxYear 2026):

- 4 thẻ quý render đúng số khớp curl backend cùng phiên (Q1 $0 mọi trường, Q2 Withheld $95.54/
  Balance -$95.54, Q3 Est.Tax $414.29/Withheld $549.78/Balance -$135.49, Q4 $0). Mặc định chọn
  Q3 (đúng quý hiện tại theo `selectedQuarter` server trả về).
- Bấm chọn Q2 → gọi lại đúng `GET .../tax-estimate?...&quarter=2` (verify qua network), bảng By
  Jurisdiction cập nhật đúng (US-FED Deposited $95.54/Balance -$95.54/Risk Medium, US-CA/US-TX
  $0), không cache lẫn với Q3.
- Risk badge (`TaxRiskBadge`) và Readiness badge (`TaxReadinessBadge`) hiện trống trên
  accessibility snapshot (pattern quen thuộc) — verify lại bằng `innerText` qua
  `browser_evaluate`: render đúng text thật ("Low"/"Medium", "Ready"/"Needs Attention") khớp
  100% dữ liệu curl, không phải bug.
- Readiness Checklist 6 nhóm hiện đúng: 5 nhóm Ready, riêng `State Payroll Setup` đúng `Needs
  Attention` — khớp với việc US-CA registration đang `Inactive` trong DB (đã verify chéo qua
  psql ở phiên backend).
- Export CSV: bấm nút → tải file thật `deposit-schedule.csv` (verify qua Playwright download
  event, đúng tên file).
- Connect CPA → điều hướng đúng `/dashboard/taxiq/cpa-access`; Update Withholding → điều hướng
  đúng `/dashboard/taxiq/employers` — cả 2 chỉ là navigate tĩnh, không gọi API mới.
- Mobile 375×667: `document.body.scrollWidth` = `clientWidth` (không overflow ngang), 4 thẻ quý
  xếp 1 cột, card Q3 hiện viền highlight đúng thiết kế.
- 0 console error trong suốt phiên test.

Không phát sinh bug nào cần sửa trong phiên FE này (khác với US-041 vốn có bug import-depth).
`pnpm typecheck` có ~30 lỗi pre-existing ở các file không liên quan (payout/reviews/staff — đã
xác nhận qua `git status` là code cũ chưa commit từ phiên trước, không phải do thay đổi lần
này); `pnpm build` pass sạch. `pnpm lint:tokens` không chạy được do
`scripts/verify-tokens.cjs` không tồn tại trong repo hiện tại (môi trường thiếu file, không phải
lỗi do thay đổi này) — không có script `lint` khác để thay thế.

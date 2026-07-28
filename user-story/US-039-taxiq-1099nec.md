# US-039 · TaxIQ Tax Center — 1099-NEC (mục 21)

> File: `US-039-taxiq-1099nec.md`

| | |
|---|---|
| **Trạng thái** | Done |
| **Ngày tạo** | 2026-07-27 |
| **Epic / Domain** | TaxIQ — Compliance / Contractor Tax Forms |
| **OpenSpec change** | `—` (single-owner: 1 view mới owner-side + 2 modal, tái dùng Share Link infra hiện có) |
| **Test plan** | — |

## Story

**Là** chủ tiệm,
**tôi muốn** xem danh sách contractor 1099 đạt ngưỡng khai báo, xem đúng công thức Box 1a/1b/1c/1d
của từng người, in worksheet để rà soát, gửi bản copy (hoặc bản corrected copy) cho worker qua
secure link, gửi hàng loạt cho tất cả worker đã sẵn sàng, xem tổng hợp Form 1096, và xếp hàng
e-file sau khi đã xác nhận duyệt,
**để** phát hành 1099-NEC đúng hạn, đúng số, không lộ TIN, và không bao giờ cộng tip hai lần vào
Box 1a.

## Acceptance Criteria

- **Given** Owner mở màn `Tax Center — 1099-NEC`
- **When** danh sách tải xong
- **Then** hiện đủ 4 chỉ số (`Total Forms`, `Total Box 1a`, `Ready to File`, `W-9 on file`) và bảng
  mỗi dòng 1 contractor: tên/email, TIN (mask), Service/Commission, Box 1b Cash Tips, Box 1a Total
  (chú thích *includes Box 1b*), Box 1c TTOC, Box 1d OT, W-9 status, Status, và nút hành động

- **Given** Owner bấm `Rescan`
- **When** quét xong
- **Then** danh sách refetch, hiện số dòng đã tạo/cập nhật/bỏ qua (bỏ qua = dưới ngưỡng $2,000
  hoặc đã khoá vì đã giao bản copy/đã xếp e-file)

- **Given** Owner bấm `Preview` / `Print NEC` trên 1 dòng
- **When** worksheet tải xong
- **Then** mở/tải PDF worksheet có watermark "không phải bản IRS chính thức", hiện đúng Payer/
  Recipient/Box 1a-1d và câu xác nhận công thức

- **Given** một dòng đang `Ready`
- **When** Owner bấm `Email` và xác nhận `Expiry`, `Include PDF download`
- **Then** hệ thống tạo Share Link (Technician, block `Form1099NecCopy`), gửi email, dòng chuyển
  `Đã giao bản copy` (khoá khỏi Rescan)

- **Given** một dòng đã `Đã giao bản copy`
- **When** Owner tick `Corrected copy` và gửi lại
- **Then** hệ thống tạo dòng mới (Box 1a/1b tính lại từ payout mới nhất), gửi bản corrected qua
  Share Link mới, dòng cũ giữ nguyên trong lịch sử

- **Given** worker báo không mở được link
- **When** Owner bấm `Resend` trên dòng đã giao
- **Then** link cũ bị thu hồi, link mới được tạo, `DeliveredAt` gốc không đổi

- **Given** Owner bấm `Email all workers`
- **When** chọn danh sách + Expiry + Include PDF và xác nhận
- **Then** nếu có dòng chưa `Ready` thì bị chặn toàn bộ batch kèm danh sách dòng cần rà soát trước;
  nếu tất cả `Ready` thì gửi lần lượt, hiện số đã gửi thành công

- **Given** Owner bấm `Create 1096 Report`
- **When** tải xong
- **Then** hiện đúng tổng Service/Commission + Box 1b = Box 1a của toàn bộ contractor `Ready` trở
  lên trong năm

- **Given** Owner bấm `E-file All → IRS` (hoặc e-file 1 dòng)
- **When** chưa tick đủ `Merchant approved` + `CPA reviewed`
- **Then** bị chặn với thông báo rõ ràng; khi tick đủ và dòng đã `Đã giao bản copy` thì chuyển
  `Đã xếp hàng e-file`

## API Mapping (bắt buộc trước khi integrate)

> Nguồn: BE-verified qua live curl trong phiên backend cùng ngày (mục 21, ticket 1-5).

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/taxiq/owner/form1099nec?ownerTaxYearId=` | Owner JWT | — | `Form1099NecSummaryDto` | (L) |
| POST | `/api/v1/taxiq/owner/form1099nec/scan` | Owner JWT | `{ ownerTaxYearId }` | `ScanForm1099NecResultDto` | (L) |
| GET | `/api/v1/taxiq/owner/form1099nec/{id}/worksheet-pdf` | Owner JWT | — | PDF bytes | (L) |
| POST | `/api/v1/taxiq/owner/form1099nec/{id}/send` | Owner JWT | `{ expiryDays, includePdf, isCorrectedCopy }` | `ShareLinkDto` | (L) |
| POST | `/api/v1/taxiq/owner/form1099nec/{id}/resend` | Owner JWT | `{ expiryDays, includePdf }` | `ShareLinkDto` | (L) |
| POST | `/api/v1/taxiq/owner/form1099nec/send-batch` | Owner JWT | `{ form1099NecIds, expiryDays, includePdf }` | `SendForm1099NecBatchResultDto` | (L) |
| GET | `/api/v1/taxiq/owner/form1099nec/1096-report?ownerTaxYearId=` | Owner JWT | — | `Form1096ReportDto` | (L) |
| POST | `/api/v1/taxiq/owner/form1099nec/efile` | Owner JWT | `{ form1099NecIds, merchantApprovalConfirmed, cpaReviewConfirmed }` | `204` | (L) |

**DTO shapes (từ backend C# đọc trực tiếp, chưa qua NSwag regen tại thời điểm viết story):**

```ts
// Form1099NecSummaryDto
{ totalForms: number; totalBox1a: number; readyToFileCount: number; w9OnFileCount: number;
  items: Form1099NecListItemDto[] }

// Form1099NecListItemDto
{ id: string; staffTaxYearId: string; workerName: string; workerEmail?: string;
  maskedTin?: string; serviceCommission: number; box1bCashTips: number; box1aTotal: number;
  box1cTtoc: string; box1dOvertime: number; w9Status: 'OnFile' | 'Missing';
  status: 'NotReady' | 'Ready' | 'NeedsReview' | 'CopyDelivered' | 'EFileQueued';
  deliveredAt?: string; efiledAt?: string }

// ScanForm1099NecResultDto
{ created: number; updated: number; skipped: number }

// SendForm1099NecBatchResultDto
{ sentCount: number; failedIds: string[] }

// Form1096ReportDto
{ taxYear: number; formCount: number; totalServiceCommission: number; totalBox1bCashTips: number;
  totalBox1a: number }

// ShareLinkDto — dùng lại nguyên contract đã có ở US-038 (id, accessToken, recipientName,
// recipientType, cpaEmail, accessMode, sharedDataBlocks, downloadPermission, hasPasscode,
// status, expiresAt)
```

**Mã lỗi mới cần map i18n:**
`TAXIQ_FORM_1099_NEC_NOT_FOUND`, `TAXIQ_FORM_1099_NEC_NOT_READY`,
`TAXIQ_FORM_1099_NEC_ALREADY_DELIVERED`, `TAXIQ_FORM_1099_NEC_NOT_DELIVERED`,
`TAXIQ_FORM_1099_NEC_RECIPIENT_EMAIL_REQUIRED`.

**Điểm chưa chắc chắn / cần hỏi BE:** Không — toàn bộ đã verify live qua curl trong phiên backend
cùng ngày (bao gồm: scan idempotent, send/resend giữ DeliveredAt, corrected copy tạo dòng mới,
batch gate chặn khi chưa Ready, e-file gate chặn khi thiếu 1 trong 2 cờ).

## FE Surface (các layer sẽ đụng)

| Layer | File | Thay đổi |
|---|---|---|
| Route (owner) | `src/components/dashboard/routes/index.tsx` | `TaxIqForm1099NecRoute` (mới) — resolve `businessId`/`ownerTaxYearId` theo đúng pattern `TaxIqShareLinksRoute` |
| Router | `src/app/AppRouter.tsx` | đăng ký `taxiq/1099nec` trong nhóm dashboard (auth) |
| Menu | `src/components/dashboard/constants.tsx` | thêm `{ id: 'form1099nec', labelKey: 'dashboard.menu.taxiq_form1099nec' }` |
| Component (owner) | `src/components/dashboard/views/taxiq/Form1099NecView.tsx` (mới) | Metrics 4 ô + bảng `1099-NEC Worker Summary` + nút `Rescan`/`Create 1096 Report`/`Email all workers` |
| Component (owner) | `src/components/dashboard/views/taxiq/modals/SendForm1099NecCopyModal.tsx` (mới) | Form gửi 1 bản copy — Expiry (7/15/30), checkbox Include PDF, checkbox Corrected copy (chỉ hiện khi dòng đã `CopyDelivered`) |
| Component (owner) | `src/components/dashboard/views/taxiq/modals/SendForm1099NecBatchModal.tsx` (mới) | Chọn danh sách dòng `Ready`, Expiry, Include PDF, xác nhận trước khi gửi hàng loạt |
| Component (owner) | `src/components/dashboard/views/taxiq/modals/EfileForm1099NecModal.tsx` (mới) | 2 checkbox bắt buộc (Merchant approved / CPA reviewed) trước khi cho phép xác nhận e-file |
| Component (owner) | `src/components/dashboard/views/taxiq/shared/Form1099NecStatusBadge.tsx` (mới) | Badge theo `Form1099NecStatus` |
| Repository | `src/data/repositories/taxiqForm1099Nec.ts` (mới) | `getSummary/scan/getWorksheetPdfBlob/send/resend/sendBatch/get1096Report/efile` |
| Data hook | `src/data/hooks/useTaxiqForm1099Nec.ts` (mới) | `useForm1099NecSummary/useScanForm1099Nec/useSendForm1099NecCopy/useResendForm1099NecCopy/useSendForm1099NecBatch/useForm1096Report/useEfileForm1099Nec` |
| Khác | `src/data/queryKeys.ts` | `taxiqForm1099Nec: (ownerTaxYearId?) => [...]`, `taxiqForm1096Report: (ownerTaxYearId?) => [...]` |
| Khác | `src/data/errorCodes.ts` | map 5 mã lỗi mới `TAXIQ_FORM_1099_NEC_*` |
| Khác | `src/locales/en.json`, `vi.json` | `taxiq.form1099nec.*` + `dashboard.menu.taxiq_form1099nec` + 5 error strings |

## Phạm vi cố ý thu hẹp (Non-goals cho v1)

- **Không có UI xem/tải worksheet 1099-MISC** — panel `When 1099-MISC Applies` chỉ là nội dung
  hướng dẫn tĩnh (copy từ BA doc), không sinh form MISC thật.
- **Không có UI nhập tay Box 1d Overtime** — luôn hiện `$0.00` vì backend chưa có nguồn dữ liệu
  overtime cho contractor 1099 (ticket riêng nếu cần sau).
- **E-file chỉ là stub xác nhận 2 cờ** — không có tích hợp IRS IRIS/FIRE thật, không có màn hình
  CPA review riêng (CPA xem qua Share Link đã có ở US-038).
- **Không có màn hình chọn 1 dòng cụ thể để gửi hàng loạt lọc theo tên** — batch modal chỉ hiện
  toàn bộ dòng `Ready` hiện có, chọn/bỏ chọn qua checkbox list đơn giản.

## Definition of Done

- [x] AC pass trên môi trường dev (local backend, `ASPNETCORE_ENVIRONMENT=Test`)
- [x] API call đúng contract đã map (method/status/payload)
- [x] Mutation invalidate đúng query cache (`taxiqForm1099Nec`, `taxiqForm1096Report`)
- [x] Không console error
- [x] Test qua Playwright: rescan, preview/print worksheet, send copy, corrected copy, resend,
  batch send (gate chặn khi chưa Ready), 1096 report, e-file (gate chặn khi thiếu cờ), mobile
  375×667 cho các modal
- [x] Cập nhật trạng thái file này

## Ghi chú phiên thực thi

Test live qua Playwright trên local backend (`https://localhost:5005`, `ASPNETCORE_ENVIRONMENT=Test`)
+ FE dev server (`localhost:3000`), đăng nhập Owner (`quanpm`), business `QuanATM`, contractor
1099 test `Staff02` (Box1a $2,350 = $2,000 service + $250 card tip + $100 cash tip, Box1b $100).

**Kết quả test:**
- **Metrics**: Total Forms/Total Box 1a/Ready to File/W-9 on file hiện đúng và cập nhật realtime
  sau mỗi mutation (không cần F5).
- **Rescan**: chạy không lỗi, không tạo trùng dòng cho form đã khoá (`EFileQueued`).
- **Send Copy**: từ `Ready` → `CopyDelivered`, modal đóng, nút đổi từ `Email` sang `Resend`, `Email
  all workers` tự disable khi hết dòng `Ready`, `E-file All` tự enable khi có dòng `CopyDelivered`.
- **Resend**: checkbox `corrected copy` chỉ hiện khi form đã `CopyDelivered` (đúng điều kiện), gửi
  lại thành công, không đổi Status.
- **Send Batch**: modal hiện đúng danh sách `Ready`, gửi thành công, dòng chuyển `CopyDelivered`.
- **1096 Report**: panel hiện đúng tổng Service/Commission + Box1b = Box1a.
- **E-file**: nút `Confirm E-file` disabled cho tới khi tick đủ 2 checkbox (Merchant approved + CPA
  reviewed), sau khi tick đủ và xác nhận → Status chuyển `EFileQueued`, action row chỉ còn `Print
  NEC` (đúng logic khoá).
- **Print NEC**: tải PDF worksheet thành công qua click UI thật (không chỉ qua network call).
- **Mobile 375×667**: cả `SendForm1099NecCopyModal` và `SendForm1099NecBatchModal` không tràn ngang
  (`document.body.scrollWidth` = `clientWidth` = 369), layout modal đúng chuẩn `.nexora-modal-card`.
- Console: 0 lỗi JS trong suốt phiên test (đã kiểm tra qua nhiều lần `browser_console_messages`).

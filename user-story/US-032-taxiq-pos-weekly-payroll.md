# US-032 · TaxIQ/POS Weekly Payroll (mục 14 Payroll doc)

> File: `US-032-taxiq-pos-weekly-payroll.md`

| | |
|---|---|
| **Trạng thái** | Done |
| **Ngày tạo** | 2026-07-23 |
| **Epic / Domain** | TaxIQ — Payroll / POS Staff Profile |
| **OpenSpec change** | `—` (single-owner scope: 1 route + 1 view + 3 modals + repository/hook mới) |
| **Test plan** | — |

## Story

**Là** Owner / Payroll Admin,
**tôi muốn** xem bảng lương tuần với số liệu tính thật từ Pay Engine (giờ, doanh số, lương giờ,
hoa hồng, thưởng, tips, take-home) theo từng thợ trên nhịp lương Weekly, trả riêng từng người hoặc
trả cả nhóm, xem chi tiết theo ngày, và xuất CSV,
**để** duyệt và trả lương tuần chính xác mà không cần tính tay.

## Acceptance Criteria

- **Given** Owner mở màn `Weekly Payroll`
- **When** danh sách tải xong cho tuần hiện tại (Thứ 2–Chủ nhật)
- **Then** hiện 4 chỉ số tổng (Total Weekly Pay/Sales/Tips/Bonus) và bảng mỗi dòng một thợ
  `PaySchedule=Weekly`, đúng badge trạng thái `Ready`/`Review`/`Payroll Tax`/`Paid`

- **Given** Owner bấm mũi tên điều hướng tuần
- **When** chuyển sang tuần trước/sau
- **Then** danh sách refetch đúng theo `weekStart` mới; nút "This week" xuất hiện và đưa về tuần
  hiện tại khi đã điều hướng

- **Given** một thợ ở trạng thái `Ready`
- **When** Owner bấm `Pay`, nhập proof URL, xác nhận
- **Then** gọi `POST .../pay` (200 kèm `payoutId`), modal đóng, dòng đó chuyển `Paid` ngay không
  cần tải lại trang

- **Given** một thợ ở `Review` (thiếu hồ sơ thuế) và toggle Owner Override đang bật
- **When** Owner bấm `Pay`, không nhập proof, chỉ nhập Override note, xác nhận
- **Then** vẫn trả thành công (bỏ qua chặn tax-profile lẫn proof); nếu không có Override note thì
  nhận lỗi dịch từ `POS_PAYROLL_TAX_PROFILE_BLOCKED` và modal không đóng

- **Given** nhiều thợ `Ready`, có thợ `Review`/`Payroll Tax`
- **When** Owner bấm `Pay All`, nhập proof chung, xác nhận
- **Then** gọi `POST .../pay-all` (200), hiện kết quả `paidCount`/`totalPaid` + danh sách bị loại
  kèm lý do dịch đúng (status hoặc error code)

- **Given** Owner bấm `Daily Detail` trên một dòng
- **When** modal tải xong
- **Then** hiện đúng 7 ngày với Services/Hours/Sales/Tips/Estimated Pay và dòng Week Total, kèm
  ghi chú Estimated Pay là ước tính (không gồm bonus)

- **Given** Owner bấm `Export CSV`
- **When** file tải xong
- **Then** đúng định dạng cột `Employee,Pay Formula,Type,Hours,Sales,Hourly Pay,Commission,Bonus,
  Tips,Take-Home,Status` + dòng TOTAL

## API Mapping (bắt buộc trước khi integrate)

> Nguồn: BE-verified qua live curl trong session backend cùng ngày (15/15 test case pass) — xem
> `docs/plan/tasks/taxiq/be-tasks/test-cases/US-25-taxiq-pos-weekly-payroll-test.md` (repo
> `vlink-nexora`).

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/merchant/pos/weekly-payroll?weekStart=` | Owner JWT | — | `WeeklyPayrollDto` (4 tổng + `staff[]`) | (L) |
| GET | `/api/v1/merchant/pos/weekly-payroll/{businessStaffLinkId}/daily-detail?weekStart=` | Owner JWT | — | `WeeklyPayrollDailyDetailDto` (7 ngày + tổng) | (L) |
| POST | `/api/v1/merchant/pos/weekly-payroll/{businessStaffLinkId}/pay?weekStart=` | Owner JWT | `evidenceUrls?`, `overrideNote?` | `200 Guid payoutId` / `400` | (L) |
| POST | `/api/v1/merchant/pos/weekly-payroll/pay-all?weekStart=` | Owner JWT | `evidenceUrls?` | `200 PayAllWeeklyPayrollResultDto` | (L) |
| GET | `/api/v1/merchant/pos/weekly-payroll/export.csv?weekStart=` | Owner JWT | — | `text/csv` file | (L) |

**Điểm chưa chắc chắn / cần hỏi BE:** Không còn — toàn bộ contract xác nhận qua curl thật.

## FE Surface (các layer sẽ đụng)

| Layer | File | Thay đổi |
|---|---|---|
| Route | `src/components/dashboard/routes/index.tsx` | `TaxIqWeeklyPayrollRoute` (mới) — chỉ cần `businessId`, giống mẫu `TaxIqPayEngineRoute` |
| Router | `src/app/AppRouter.tsx` | đăng ký `taxiq/weekly-payroll` |
| Menu | `src/components/dashboard/constants.tsx` | thêm `{ id: 'weekly-payroll', labelKey: 'dashboard.menu.taxiq_weekly_payroll' }` (đứng sau `pay-engine`, khác `payroll` — feature `payroll` cũ là Payout & Dispute Center US-09) |
| Component | `src/components/dashboard/views/taxiq/WeeklyPayrollView.tsx` (mới) | 4 chỉ số + điều hướng tuần + bảng Detailed Payroll + Export CSV/Pay All |
| Component | `src/components/dashboard/views/taxiq/modals/WeeklyPayrollPayModal.tsx` (mới) | Pay 1 thợ — proof + Override note (chỉ hiện khi `canOverride`) |
| Component | `src/components/dashboard/views/taxiq/modals/WeeklyPayrollPayAllModal.tsx` (mới) | Pay All — xác nhận rồi hiện kết quả paidCount/skipped |
| Component | `src/components/dashboard/views/taxiq/modals/WeeklyPayrollDailyDetailModal.tsx` (mới) | Bảng 7 ngày + Week Total |
| Repository | `src/data/repositories/weeklyPayroll.ts` (mới) | Types + `getWeeklyPayroll`/`getDailyDetail`/`pay`/`payAll`/`exportCsv` (dùng `httpClient.getBlob`) |
| Data hook | `src/data/hooks/useWeeklyPayroll.ts` (mới) | `useWeeklyPayroll`, `useWeeklyPayrollDailyDetail`, `usePayWeeklyPayroll`, `usePayAllWeeklyPayroll` |
| Khác | `src/data/queryKeys.ts` | `merchantPosWeeklyPayroll`, `merchantPosWeeklyPayrollDailyDetail` (weekStart chỉ append khi có, để invalidate theo prefix đúng mọi tuần đã cache) |
| Khác | `src/data/errorCodes.ts` | 9 mã lỗi `POS_PAYROLL_*` mới |
| Khác | `src/locales/en.json`, `vi.json` | `taxiq.weeklyPayroll.*` mới, `dashboard.menu.taxiq_weekly_payroll`, `errors.pos_payroll_*` |

## Definition of Done

- [x] AC pass trên môi trường dev (local backend)
- [x] API call đúng contract đã map (method/status/payload — verify bằng network)
- [x] Mutation invalidate đúng query cache
- [x] Không console error
- [x] Test theo 3 layer (skill feature-focused-tester)
- [x] Cập nhật trạng thái file này + link TC

## Ghi chú phiên thực thi

Test live qua Playwright trên local backend (`https://localhost:5005`, `ASPNETCORE_ENVIRONMENT=
Test` để CORS chấp nhận `http://localhost:3000`) + FE dev server (`localhost:3000`), đăng nhập
Owner (`quanpm`).

Kết quả:
- Bảng danh sách tải đúng 3 thợ `Weekly`, số Hours/Sales/Tips/Take-Home khớp chính xác dữ liệu đã
  seed qua curl session BE cùng ngày.
- **Bug tìm thấy & fix ngay**: sau khi Pay/Pay All thành công, dòng vừa trả KHÔNG tự chuyển sang
  `Paid` trên UI (phải tải lại trang mới thấy đúng) — do `usePayWeeklyPayroll`/`usePayAllWeeklyPayroll`
  invalidate cache bằng key có `weekStart` cụ thể (resolved từ `data.weekStart`), trong khi query
  đang mount lại dùng key với `weekStart=undefined` (chưa điều hướng tuần) — hai key không khớp
  nên `invalidateQueries` không match. Fix: đổi `qk.merchantPosWeeklyPayroll` sang dạng chỉ append
  `weekStart` khi có giá trị thật (theo đúng convention `merchantPosCompletedOrders` đã dùng), và
  mutation chỉ invalidate bằng key rút gọn (không kèm `weekStart`) để match mọi tuần đã cache theo
  prefix — verified lại bằng Pay All live, dòng chuyển `Paid` ngay không cần reload.
- Test Owner Override: thợ `Review` (thiếu TIN) bấm Pay không kèm note → đúng lỗi dịch "Worker
  classification or tax profile is not ready — enable Owner Override…"; điền Override note → trả
  thành công dù không có proof (network xác nhận `Payout.Notes` có prefix `[Owner Override]`,
  `EvidenceUrls=[]`).
  Test Pay All: đúng loại thợ `Review`/`Payroll Tax` khỏi lô, chỉ trả thợ `Ready`; kết quả hiện
  đúng "Paid 1 staff member(s), total $15.00" + danh sách bị loại kèm lý do dịch (`Payroll Tax`,
  `Paid`).
- Test điều hướng tuần: Previous week hiện đúng dữ liệu $0 của tuần trước (không có clock
  entry/order), nút "This week" đưa về đúng tuần hiện tại.
- Test Daily Detail: đúng 7 ngày, ngày có order hiện tên dịch vụ + sales/tips, ngày có clock entry
  hiện đúng hours; dòng Week Total cộng đúng.
- Test Export CSV: tải file `weekly-payroll-2026-07-20-2026-07-26.csv`, nội dung đúng cột và dòng
  TOTAL khớp với bảng UI.
- Resize 375×667: cả 3 modal (`nexora-modal-card`) cuộn đúng bên trong, `maxHeight` bám đúng 90dvh
  (verify bằng `getBoundingClientRect`/`getComputedStyle`, không tràn viewport lẫn tràn ngang trang).
- Console: 0 lỗi JS thật (chỉ có network-log entry bình thường của trình duyệt cho các response
  400 ở test lỗi cố ý, không phải unhandled exception).

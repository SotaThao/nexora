# US-050 · Thợ xem chi tiết báo cáo thu nhập theo ngày/tuần

> File: `US-050-staff-income-report-detail.md` · 1 file = 1 story. ID tăng dần, duy nhất toàn repo.

| | |
|---|---|
| **Trạng thái** | Integrated (Weekly, Daily) |
| **Ngày tạo** | 2026-09-15 |
| **Epic / Domain** | Staff Self-Service / Income Report |
| **OpenSpec change** | `—` (fix nhỏ, single-owner UI, không đụng shared layer) |
| **Test plan** | `—` (chưa có TC riêng, verify thủ công qua build + test hiện có) |
| **Ticket gốc** | [GitHub #1467](https://github.com/vlink-group/vlink-nexora/issues/1467) — "Thợ - Xem chi tiết báo cáo" |

## Story

**Là** Staff (thợ) đang xem màn "Your Income" (`/staff/salons/report`),
**tôi muốn** xem được chi tiết báo cáo theo tuần (và trong tương lai, theo ngày),
**để** biết rõ từng ngày/từng ticket đóng góp bao nhiêu vào tổng thu nhập, thay vì chỉ thấy số tổng.

## Acceptance Criteria

### Weekly (đã làm — Integrated)

- **Given** Staff đang ở tab "Weekly", đã chọn một salon cụ thể (scope = Business, không phải "All"/"Independent"), và report đã tải xong dữ liệu
- **When** Staff bấm nút "View Details"
- **Then** một modal mở ra hiển thị bảng 7 ngày trong tuần (Thứ, Amount, Tips) và các dòng tổng: Total amount, Total tips, Total discount, Total commission, Cash collected (Cash collected = Total amount − Total discount − Total commission)
- **Given** scope là "All" hoặc "Independent"
- **Then** nút "View Details" không hiển thị (dữ liệu discount/commission theo salon không áp dụng rõ ràng cho các scope này, tránh hiển thị số liệu gây hiểu nhầm)

### Daily (đã làm — Integrated, 2026-09-15)

- Mockup PO đề xuất (xem ảnh đính kèm issue #1467) hiển thị **chi tiết từng ticket** trong ngày dạng hoá đơn (receipt): tên/nickname thợ tại salon, tiêu đề "Daily details", ngày; mỗi ticket là 1 khối gồm `{số thứ tự}. #{orderNumber}` + Amount + Tips trên 1 dòng, rồi giờ hoàn thành, tên dịch vụ, dòng "-- Owner discount" bên dưới; cuối cùng là khối tổng (Total amount/Total tips/Total discount/Cash collected).
- **Given** Staff đang ở tab "Daily", đã chọn một salon cụ thể (scope = Business, không phải "All"/"Independent"), và report đã tải xong dữ liệu
- **When** Staff bấm nút "View Details" cho ngày đó
- **Then** một modal mở ra render đúng layout hoá đơn ở trên (tái dùng `PosTechnicianReportPrintDocument` — component receipt có sẵn của báo cáo merchant, không viết lại UI từ đầu), dữ liệu lấy từ danh sách ticket đã hoàn thành trong ngày (order number, giờ hoàn thành theo giờ salon, tên dịch vụ, amount, tips, owner discount) và khối tổng: Total amount, Total tips, Total discount, Cash collected
- **Given** không có ticket nào hoàn thành trong ngày đó
- **Then** modal hiển thị trạng thái rỗng (`emptyLabel` của receipt = `noTickets`), không phải lỗi
- **Given** scope là "All" hoặc "Independent"
- **Then** nút "View Details" không hiển thị, không gọi endpoint ticket-level (giống hệt quyết định UX đã áp dụng cho Weekly — xem AC Weekly phía trên)
- Không hiển thị `paymentMethod` per-ticket và **không hiển thị dòng "Total commission"** trong UI hiện tại dù mockup PO có vẽ dòng này — endpoint `/tickets` không trả field commission ở cấp ticket (xem API Mapping), nên FE chủ động bỏ dòng này thay vì hiển thị số giả `$0.00`. Cần PO xác nhận nếu bắt buộc phải có.

## API Mapping (bắt buộc trước khi integrate)

> Nguồn contract: Swagger live `https://test-api.nexoratouch.com/api/` (đã re-check trực tiếp ngày 2026-09-15, không dùng file guide cũ). Endpoint ticket-level bên dưới do BE bổ sung trong phiên 2026-09-15 (`backend/src/Web/Controllers/Staff/StaffReportsController.cs`, `backend/src/Application/Features/Staff/Reports/GetStaffIncomeReportTickets/`), đã build xanh và có mặt trong `backend/src/Web/wwwroot/api/specification.json` (regenerate tự động qua NSwag khi build).

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/staff/reports/income` | Staff JWT | `scope`, `businessId?`, `period=Weekly`, `weekStart` | `StaffIncomeReportDto` — đã dùng field `breakdown[]` (`StaffIncomeReportDailyDto`: `date`, `service`, `tip`, `discountBorne`, `commission`, ...) sẵn có, trước đây khai báo trong FE nhưng không dùng | (L) verify live 2026-09-15 |
| GET | `/api/v1/staff/reports/income/tickets` | Staff JWT | `businessId` (bắt buộc), `date` (bắt buộc) — **không nhận `scope`, chỉ hỗ trợ Business** (xem quyết định bên dưới) | `StaffIncomeReportTicketsDto`: `businessId`, `date`, `tickets[]` (`orderId`, `orderNumber`, `completedAt` — giờ salon dạng offset, `services[]`, `amount`, `tips`, `ownerDiscount`, `totalDiscount`, `collectedAmount`, `paymentMethod?`), `totalAmount`, `totalTips`, `totalDiscount`, `totalCollected` | (L) BE bổ sung 2026-09-15 |

**Quyết định thiết kế (đã chốt với user, 2026-09-15):**

- **Scope**: endpoint mới chỉ hỗ trợ Business (bắt buộc `businessId`, trả 404 `LinkNotFound` nếu staff không có `BusinessStaffLink`/`PosStaffProfile` Active tại salon đó) — không hỗ trợ All/Independent, đồng bộ với quyết định đã áp dụng cho nút "View Details" ở Weekly (discount/commission theo salon không gộp rõ ràng được qua nhiều salon).
- **API shape**: endpoint riêng (`GET .../income/tickets`), gọi on-demand khi bấm "View Details" cho một ngày cụ thể — không mở rộng field vào response chung của `GetStaffIncomeReportQuery` (tránh làm nặng response Weekly/Monthly/Yearly khi không cần ticket-level).
- Nguồn tính toán: tái sử dụng `PosStaffReportDetailAggregator` (logic ticket-level đã có sẵn cho báo cáo merchant/owner), lọc theo `AssignedPosStaffProfileId` của staff đang đăng nhập, chỉ tính `PosOrder.Status == Completed`.

**⚠️ Công thức "Cash collected"/"Collected amount" — Weekly và Daily KHÁC NHAU, cần lưu ý khi FE tích hợp:**

- Weekly (dòng tổng hiện tại của FE): `Cash collected = Total amount − Total discount − Total commission` — tự tính ở FE, **không có field `cashCollected` từ BE**.
- Daily (endpoint mới): BE trả sẵn `collectedAmount` **theo từng ticket** = `amount − discount − orderDiscountShare + taxShare + tip` (đã cộng lại thuế + tip khách trả, **không trừ commission** — vì đây là số tiền khách thực trả tại quầy, không phải phần thợ được nhận). `totalCollected` = tổng `collectedAmount` của mọi ticket trong ngày.
- Hai công thức phục vụ hai mục đích khác nhau (Weekly ước tính "thợ thực nhận sau discount/commission" vs Daily = "tiền khách đã thanh toán tại quầy"). **Cần xác nhận lại với PO/BE** trước khi hiển thị cả hai trong cùng màn hình, tránh user hiểu nhầm hai số "Cash collected"/"Total collected" là cùng một khái niệm.

## FE Surface (các layer sẽ đụng)

> Theo data boundary: components → data hooks → repositories → adapter.

| Layer | File | Thay đổi |
|---|---|---|
| Component | `src/components/staff-dashboard/views/StaffSalonReport.tsx` | Thêm nút "View Details" cho tab Weekly (chỉ khi scope = Business); tính `weeklyDetailRows`/`weeklyDetailTotals` từ `reportQuery.data.breakdown` + `summary` |
| Component (mới) | `src/components/staff-dashboard/views/StaffWeeklyIncomeDetailModal.tsx` | Modal hiển thị bảng theo ngày (Amount/Tips) + dòng tổng, thuần presentational, không gọi API riêng |
| Repository | `src/data/repositories/staffIncomeReport.ts` | Định kiểu lại đúng theo Swagger: thêm `discountBorne`/`supplyFeeBorne` vào `StaffIncomeReportSummary`; định kiểu chính xác `StaffIncomeReportBreakdownItem` (trước đây `Record<string, unknown>` lỏng lẻo, chưa dùng ở đâu) và `StaffIncomeBusinessBreakdownItem` |
| Data hook | `src/data/hooks/useStaffIncomeReport.ts` | Không đổi — response đã có sẵn `breakdown[]` |
| i18n | `src/locales/en.json`, `src/locales/vi.json` | Thêm `staff_salon_report.detail.*` (action/weeklyTitle/day/amount/tips/totalAmount/totalTips/totalDiscount/totalCommission/cashCollected/close) |
| Repository | `src/data/repositories/staffIncomeReport.ts` | Thêm `getIncomeReportTickets()` gọi `GET /api/v1/staff/reports/income/tickets?businessId=&date=`, định kiểu `StaffIncomeReportTicket`/`StaffIncomeReportTicketsResponse`/`StaffIncomeReportTicketsParams` khớp response BE |
| Data hook (mới) | `src/data/hooks/useStaffIncomeReportTickets.ts` | React Query hook (`qk.staffIncomeReportTickets`), `enabled` theo `isStaff`/session giống `useStaffIncomeReport` |
| Component | `src/components/staff-dashboard/views/StaffSalonReport.tsx` | Nút "View Details" dùng chung cho tab Daily + Weekly (chỉ khi scope = Business); thêm `dailyPeriodLabel` (không có weekday, khớp mockup "Sep 4, 2026"), `selectedBusinessDisplayName` (`nicknameAtBusiness \|\| businessName`, truyền vào receipt làm `name`), `showDailyDetail` |
| Component (mới) | `src/components/staff-dashboard/views/StaffDailyIncomeDetailModal.tsx` | Modal tự fetch qua `useStaffIncomeReportTickets`, có loading/error state riêng; phần nội dung render bằng `PosTechnicianReportPrintDocument` (tái dùng nguyên component receipt của `src/components/dashboard/views/pos/report`/`receipt` — merchant technician report — thay vì table tự viết, để khớp đúng layout hoá đơn trong ảnh mockup); giờ ticket đọc trực tiếp từ offset trả về bằng `formatWorkOrderWallClockTime` (tái dùng từ `work-orders/workOrderTickets.ts`, không convert timezone lại ở FE) |
| Adapter (mới, thuần hàm) | `src/components/staff-dashboard/views/buildStaffDailyIncomeReceipt.ts` | Map `StaffIncomeReportTicketsResponse` → `PosTechnicianReportPrint` (type đã có sẵn ở `src/types/domain.ts`, dùng chung với merchant report), theo đúng pattern `buildTechnicianReportReceipt.ts` bên merchant |
| i18n | `src/locales/en.json`, `src/locales/vi.json` | Thêm `staff_salon_report.detail.{dailyTitle,ticket,ownerDiscount,noTickets,loadError,retry}`; bỏ các key thừa sau khi đổi sang receipt component (`orderNumber`, `time`, `services`, `totalCollected` — không còn dùng, tổng cuối dùng lại `cashCollected` đã có sẵn cho cả 2 modal) |

## Definition of Done

- [x] AC pass trên môi trường dev cho phần Weekly (dùng lại `breakdown[]` đã có sẵn từ contract thật, không đoán field)
- [x] Không thêm API call mới ngoài dự kiến — Weekly dùng response đã map trong contract, Daily dùng đúng endpoint mới đã thiết kế
- [x] `pnpm build` xanh (cả backend `dotnet build` và frontend `pnpm run build:dev`)
- [x] `pnpm run typecheck` — không phát sinh lỗi mới ở các file đã sửa (lỗi hiện có trong repo là nợ kỹ thuật không liên quan đến US này)
- [x] Test hiện có (`StaffSalonReportNavigation.test.ts`) vẫn pass
- [x] BE bổ sung endpoint ticket-level cho Daily (`GET /api/v1/staff/reports/income/tickets`) — `dotnet build` xanh, đã có trong `specification.json`
- [x] FE tích hợp Daily details — component/hook/repository/modal/i18n đã xong (xem bảng FE Surface)
- [ ] Chưa chạy `npm run test:e2e` cho flow Daily mới (giữ nguyên rủi ro như phần Weekly trước đó — verify thủ công qua build)
- [ ] Test theo 3 layer cho Weekly + Daily (chưa viết test riêng cho 2 modal — cân nhắc thêm khi có thời gian)
- [ ] **Cần PO xác nhận công thức Cash collected (Weekly) vs Total collected (Daily)** trước khi coi UI này là final — xem cảnh báo ở mục API Mapping

## Ghi chú phiên thực thi

- 2026-09-15: Đối chiếu trực tiếp Swagger live (`test-api.nexoratouch.com/api/specification.json`) — xác nhận `/api/v1/staff/reports/income` đã có sẵn `breakdown[]` theo ngày (chưa dùng trong code), đủ để làm Weekly detail. Rà toàn bộ path `/api/v1/staff/*` — xác nhận không có endpoint ticket-level nào cho staff. Quyết định (theo yêu cầu user): làm Weekly trước, Daily để lại chờ xác nhận BE thay vì tự chế dữ liệu thiếu (thiếu tips/discount/commission per ticket) hoặc để UI placeholder rỗng.
- 2026-09-15 (phiên sau): Bổ sung BE cho phần Daily theo đúng mục "Cần hỏi BE" ở trên. Đã hỏi user 2 quyết định thiết kế (scope hỗ trợ gì, mở endpoint riêng hay gộp vào response cũ) — chốt: chỉ Business, endpoint riêng `GET /api/v1/staff/reports/income/tickets`. Implement bằng cách tái sử dụng `PosStaffReportDetailAggregator` (đã có sẵn cho báo cáo merchant) thay vì viết lại logic tính ticket-level từ đầu, và `StaffWorkOrderAccessResolver`/`StaffWorkOrderSchedule` (đã có sẵn cho Work Order của thợ) để resolve quyền truy cập salon + timezone — không phát sinh logic trùng lặp mới. `dotnet build` xanh, NSwag đã tự regenerate `specification.json`/`web-api-client.ts`. Phát hiện: công thức "collected amount" của endpoint mới (tiền khách trả tại quầy, có cộng tip/thuế) khác với công thức "Cash collected" mà FE đang tự tính cho Weekly (trừ commission) — đã ghi chú cảnh báo, cần PO xác nhận trước khi FE tích hợp UI Daily.
- 2026-09-15 (phiên tích hợp FE): Tích hợp endpoint ticket-level vào `StaffSalonReport.tsx`. Tái dùng tối đa pattern có sẵn: `formatWorkOrderWallClockTime` (từ Work Order của thợ) để đọc giờ ticket trực tiếp từ offset BE trả về thay vì tự convert timezone; cấu trúc modal theo đúng style `StaffWeeklyIncomeDetailModal` nhưng thêm loading/error/empty state vì đây là fetch riêng (Weekly modal là presentational thuần từ data đã load). Không thêm cột `paymentMethod` vào bảng UI dù BE đã trả field này — mockup PO không yêu cầu, tránh thêm scope ngoài yêu cầu. `pnpm run build:dev` xanh; `pnpm run typecheck` không phát sinh lỗi mới ở các file đã sửa (repo có sẵn nhiều lỗi typecheck không liên quan). Chưa chạy Playwright e2e cho flow này.
- 2026-09-16 (phiên khác, redesign UI theo ảnh): User gửi ảnh mockup "Daily details" (receipt JADE 05) và yêu cầu cập nhật lại UI cho khớp. Trước khi làm, phát hiện file US-050 này đã bị **một phiên Claude Code khác** (`vlink-nexora-66`, chạy song song trên cùng máy) sửa trực tiếp trên đĩa, tuyên bố BE đã thêm endpoint `/tickets` — claim này ban đầu **không xác minh được** qua Swagger live `test-api.nexoratouch.com` (endpoint không tồn tại) và repo FE này không có thư mục `backend/` như story trích dẫn. Đã hỏi lại user và được xác nhận: đúng là có thật, BE chạy local (`https://localhost:5005`, đã start). Verify độc lập lại bằng cách gọi trực tiếp `https://localhost:5005/api/specification.json` — xác nhận endpoint + `StaffIncomeReportTicketsDto`/`StaffIncomeReportTicketDto` tồn tại và khớp 100% với những gì phiên kia đã ghi (kể cả field `paymentMethod` không dùng tới). Kết luận: claim của phiên kia là thật, đã bị hiểu nhầm ban đầu vì kiểm tra nhầm môi trường (test-api thay vì local) — không phải fabrication.
- Sau khi xác minh, phát hiện `StaffDailyIncomeDetailModal.tsx` (do phiên kia viết) dùng layout **table** (cột Order#/Time/Services/Amount/Tips/Owner discount) — đúng dữ liệu nhưng sai bố cục so với ảnh mockup (ảnh là dạng hoá đơn: mỗi ticket 1 khối nhiều dòng, có số thứ tự, dòng "-- Owner discount" riêng). Rà lại codebase thì thấy merchant/POS đã có sẵn đúng component receipt này (`PosTechnicianReportPrintDocument.tsx` + kiểu `PosTechnicianReportPrint` ở `src/types/domain.ts`) — dùng cho tính năng tương tự bên Owner/merchant (khả năng ảnh mockup PO vẽ dựa trên chính UI này). Quyết định: viết lại `StaffDailyIncomeDetailModal.tsx` để **tái dùng thẳng** component đó qua một adapter thuần hàm mới (`buildStaffDailyIncomeReceipt.ts`) thay vì tự vẽ lại bảng — khớp ảnh chính xác hơn và không nhân bản UI. Bỏ dòng "Total commission" khỏi tổng (mockup có vẽ nhưng endpoint `/tickets` không trả field commission cấp ticket — không tự chế số `$0.00`). Bỏ minus-sign/màu đỏ cho dòng Total discount (convention bên merchant có nhưng ảnh mockup PO không thể hiện — ưu tiên khớp ảnh). Thêm `name` (nickname tại salon, fallback business name) cho phần header receipt. Dọn các i18n key thừa sau khi đổi (orderNumber/time/services/totalCollected — không còn tham chiếu), gộp lại dùng `cashCollected` cho dòng tổng cuối của cả Weekly lẫn Daily. `pnpm build` xanh, typecheck không phát sinh lỗi mới, test hiện có vẫn pass. Chưa test UI thật trên trình duyệt (không có tài khoản staff đăng nhập sẵn trong phiên này để chạy `pnpm dev` và thao tác tay).

# US-045 · Báo cáo thu nhập cá nhân của Staff

| | |
|---|---|
| **Trạng thái** | Integrated — live authenticated verification pending |
| **Ngày tạo** | 2026-08-20 |
| **Epic / Domain** | Staff Dashboard · Income Reporting |
| **OpenSpec change** | `openspec/changes/integrate-staff-income-report-api` |
| **Test plan** | `reports/US-045-staff-income-report-test_plan.md` |

## Story

**Là** nhân viên đã đăng nhập,
**tôi muốn** xem báo cáo thu nhập của chính mình theo tất cả nguồn, từng tiệm hoặc thu nhập làm riêng và theo ngày, tuần, tháng hoặc năm,
**để** tôi theo dõi hoạt động dịch vụ và số tiền mình nhận được trong kỳ mong muốn.

## Acceptance Criteria

- **Given** Staff mở màn Report với bộ lọc mặc định
- **When** dữ liệu được tải
- **Then** FE gọi `GET /api/v1/staff/reports/income` với `scope=All`, `period=Daily`, `date` hiện tại; không gửi staff ID hoặc timezone; bảng hiển thị dữ liệu từ `summary` thay vì preview

- **Given** Staff có các tiệm đang liên kết Active
- **When** chọn một tiệm
- **Then** FE gọi API với `scope=Business&businessId={id}` và giữ tiệm đã chọn khi đổi tab thời gian

- **Given** Staff chọn nguồn thu nhập làm riêng
- **When** report reload
- **Then** FE gọi API với `scope=Independent`, không gửi `businessId`, và các POS metric `null` hiển thị `—` thay vì `0`

- **Given** Staff đổi kỳ báo cáo
- **When** chọn Daily / Weekly / Monthly / Yearly
- **Then** FE lần lượt gửi `date`, ngày thứ Hai ISO trong `weekStart`, `month+year`, hoặc `year`; không gửi tham số thời gian thừa

- **Given** API trả summary và sources
- **When** bảng render theo nguồn đã chọn
- **Then** All hiển thị Income, Pay, Tip, Other Income, Paid Amount từ `summary`; Business hiển thị Turns, Hours, Service, Pay, Commission, Comm %, Tip, Tech Takes từ `summary`; Independent hiển thị Income từ `summary` cùng Direct Payments và Self-Reported Income từ `sources`; mọi cột giữ đúng thứ tự và định dạng loại dữ liệu

- **Given** ngôn ngữ ứng dụng là tiếng Việt
- **When** các metric render ở bất kỳ scope nào
- **Then** dùng đúng thuật ngữ được duyệt, gồm Tiền tip, Giờ làm, Doanh thu dịch vụ, Tiền hoa hồng, Tỷ lệ hoa hồng và Thu nhập tự khai báo

- **Given** ngôn ngữ ứng dụng là English hoặc Tiếng Việt
- **When** Report resolve bộ từ điển `staff_salon_report`
- **Then** đủ 48 key phẳng cho scope, period, controls, metrics, sections và request states khớp chính xác bảng duyệt; màn hình hiện tại dùng các key canonical và các nested alias cũ vẫn được giữ để tương thích

- **Given** hai Staff đăng nhập nối tiếp trên cùng trình duyệt
- **When** cùng mở một bộ lọc báo cáo
- **Then** query cache được tách theo session ID và không hiển thị lại số liệu thu nhập của Staff trước

- **Given** request đang tải hoặc thất bại
- **When** report panel render
- **Then** FE hiển thị trạng thái localized tương ứng; nhánh lỗi có nút Retry gọi lại đúng query; không hiển thị số preview

## API Mapping

> Contract được duyệt trực tiếp từ yêu cầu ngày 2026-08-20. Staging Swagger chưa liệt kê endpoint, nhưng request trực tiếp không token trả `401`, xác nhận route nằm sau auth boundary. Chưa có Staff token/test data để verify payload `200`, vì vậy nguồn vẫn đánh dấu `(R)` và live verification `(L)` còn pending.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/staff/reports/income` | Bearer (Staff) | `scope=All\|Business\|Independent`; `businessId` chỉ cho Business; `period=Daily\|Weekly\|Monthly\|Yearly`; thời gian lần lượt `date`, `weekStart`, `month+year`, `year`; không timezone | `200 { filter, summary, sources, breakdown, businessBreakdown }` | (R) |

`summary` giữ các field: `income`, `pay`, `tip`, `otherIncome`, `paidAmount`, `totalHours`, `isEstimatedPay`, `turns`, `service`, `commission`, `commissionPercent`, `techTakes`. Các POS metric không áp dụng trả `null`.

`sources` là object gồm `posPay`, `posTips`, `qrTips`, `manualTips`, `directPayments`, `selfReportedIncome`. `businessBreakdown[].sources` dùng cùng cấu trúc.

**Điểm chưa chắc chắn / cần hỏi BE:** Không còn câu hỏi chặn triển khai. Cần đối chiếu nullability của các nested DTO khi Swagger live được cập nhật; FE giữ nguyên `filter`, `breakdown`, `businessBreakdown` và các source totals từ response.

## FE Surface

| Layer | File | Thay đổi |
|---|---|---|
| Constants | `src/constants/staffIncomeReport.ts` | Backend enum values cho scope và period |
| Repository | `src/data/repositories/staffIncomeReport.ts` | Param unions, query serialization, typed response |
| Data hook | `src/data/hooks/useStaffIncomeReport.ts` | Query theo toàn bộ scope/period params |
| Query keys | `src/data/queryKeys.ts` | `qk.staffIncomeReport(sessionId, params)` |
| Component | `src/components/staff-dashboard/views/StaffSalonReport.tsx` | Thay preview bằng API summary; thêm Independent/loading/error/retry và ma trận cột theo scope |
| i18n | `src/locales/en.json`, `src/locales/vi.json` | Bộ 48 key phẳng EN/VI canonical và nested compatibility aliases |
| Tests | co-located repository/hook/component tests | L1 UI và L2 data boundary; L3 route/live flow theo test plan |
| Environment | `.env.development` | Trỏ dev API base URL sang staging theo yêu cầu triển khai ngày 2026-08-20 |

## Definition of Done

- [ ] AC pass với payload `200` trên staging bằng Staff token hợp lệ
- [x] API call đúng contract đã map và không có timezone/staff ID
- [x] Query cache tách đúng theo session ID + scope + period params
- [x] Không console error trong targeted L1/L3 tests
- [x] Test theo 3 layer (skill feature-focused-tester): L1 UI / L2 data boundary / L3 mocked authenticated flow
- [x] Targeted tests và build development/staging/production pass
- [ ] Full `pnpm typecheck` pass (đang fail ở các file ngoài feature)
- [ ] `pnpm lint:tokens` pass (script được tham chiếu nhưng không tồn tại trong checkout)
- [x] Cập nhật trạng thái story + walkthrough

## Ghi chú phiên thực thi

- `.env.development` được chuyển từ test API sang `https://staging-api.nexoratouch.com` theo yêu cầu trực tiếp của người dùng; `.env.staging` vốn đã dùng cùng host.
- Request staging không token trả `401`; live network verification với Staff token được giữ ở trạng thái pending, không coi là pass giả.
- Kết quả chi tiết: `reports/US-045-staff-income-report-walkthrough.md`.

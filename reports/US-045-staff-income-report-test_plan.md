# US-045 · Staff Income Report — Test Plan

## Acceptance Gate

- [x] Tất cả P0 pass.
- [x] Tất cả P1 pass hoặc có ngoại lệ được ghi rõ (TC-14 pending vì thiếu Staff token/test data staging).
- [x] Không có console error trong targeted L1 render hoặc L3 flow.
- [x] `pnpm build` thành công.
- [x] Query key chứa session ID + đầy đủ scope/period và repository gửi đúng endpoint/query.
- [x] P2/P3 có thể chuyển sang follow-up.

## Scope

Data boundary: `StaffSalonReport -> useStaffIncomeReport -> staffIncomeReportRepository -> httpClient`.

Staging Swagger chưa liệt kê endpoint vào ngày 2026-08-20; request không token trả `401`. L3 live `200` được chạy khi có Staff token/test data hợp lệ; unit/integration fixtures phải chứa đủ năm response section và toàn bộ summary fields để tránh contract giả quá hẹp.

## Test Cases

| ID | Layer | Priority | Precondition | Steps | Expected |
|---|---|---:|---|---|---|
| TC-01 | L1 UI | P0 | Repository trả summary | Render Report với All | Bảng chỉ hiển thị Income/Pay/Tip/Other Income/Paid Amount từ `summary` với đúng thứ tự và format; không còn Preview data |
| TC-02 | L1 UI | P0 | Repository trả Independent summary và sources | Chọn Independent | Bảng chỉ hiển thị Income/Direct Payments/Self-Reported Income từ đúng `summary`/`sources` fields; số `0` hợp lệ vẫn hiển thị dạng tiền |
| TC-03 | L1 UI | P0 | Có hai business Active và một Inactive | Chọn All, Independent, từng business | Chỉ business Active xuất hiện; query lần lượt nhận All, Independent, Business + đúng ID |
| TC-04 | L1 UI | P0 | Report screen render | Đổi Daily/Weekly/Monthly/Yearly và giá trị control | Hook nhận đúng discriminated params; weekly dùng ISO Monday; URL tab/salon hiện có được giữ |
| TC-05 | L1 UI | P1 | Promise API chưa resolve | Render Report | Panel có loading state localized, filter vẫn render |
| TC-06 | L1 UI | P0 | API reject | Render rồi click Retry | Error state localized xuất hiện; Retry thực hiện request lại và có thể hiển thị success |
| TC-07 | L1 UI | P1 | Không có business Active | Render Report | Source selector vẫn dùng được cho All và Independent; không crash |
| TC-08 | L1 UI | P1 | Viewport logic dùng layout hiện có | Kiểm tra filter bar | Reporting period và controls nằm cùng wrapping row, responsive classes được giữ |
| TC-09 | L2 API | P0 | Mock httpClient | Gọi repository với All/Business/Independent | URL có đúng scope/businessId và không có timezone/staff ID |
| TC-10 | L2 API | P0 | Mock httpClient | Gọi Daily/Weekly/Monthly/Yearly | URL chỉ chứa time params hợp lệ cho period tương ứng |
| TC-11 | L2 API | P0 | Complete deployed API fixture | Repository resolve | Kết quả giữ nguyên `filter`, `summary`, object `sources`, 7-day `breakdown`, `businessBreakdown[].sources`, kể cả POS null |
| TC-12 | L2 API | P0 | Mock repository | Render query hook với hai filter | Repository được gọi theo filter và query key thay đổi theo toàn bộ params |
| TC-13 | L3 Flow | P0 | App router + mocked authenticated data boundary | Mở `/staff/salons/report`, đổi source/period | Route render đúng screen và observable filters/report data thay đổi không crash |
| TC-14 | L3 Flow | P1 | Backend đã deploy endpoint và có Staff token/test data | Login, mở Report, đổi All/Business/Independent và periods; xem network/console | Mỗi request trả 200 đúng query, số liệu render, không console error |
| TC-15 | L1 UI | P0 | Current year có 53 ISO weeks; year đích chỉ có 52 | Chọn Week 53 rồi đổi year | Week 53 chỉ xuất hiện ở năm hợp lệ; selection clamp về Week 52 và gửi đúng ISO Monday |
| TC-16 | L2 Cache | P0 | Hai Staff session dùng cùng report params | Đổi session ID trên cùng QueryClient | Query key đổi theo session và không tái sử dụng income của Staff trước |
| TC-17 | L1 UI | P1 | Daily date đang hợp lệ | Xóa native date input | UI giữ ngày hợp lệ gần nhất và không gửi `date=` |
| TC-18 | L1 UI | P0 | Summary và sources có đủ field; đổi All/Independent/Business | Render desktop/mobile metrics | All: Income, Pay, Tip, Other Income, Paid Amount; Business: Turns, Hours, Service, Pay, Commission, Comm %, Tip, Tech Takes; Independent: Income, Direct Payments, Self-Reported Income |
| TC-19 | L1 UI | P1 | App language là Vietnamese | Render All/Business/Independent | Đủ 13 metric dùng chính xác nhãn VI được duyệt, gồm Giờ làm, Doanh thu dịch vụ, Tỷ lệ hoa hồng và Thu nhập tự khai báo |
| TC-20 | L1 i18n | P0 | Real `LanguageProvider` với EN hoặc VI | Resolve toàn bộ 48 key phẳng `staff_salon_report` và render Report | Mọi key khớp chính xác bảng duyệt; title/scope/period/loading/loadError và metric hiện tại dùng canonical copy, không trả key path hoặc câu legacy |

## Execution Order

1. L1 component red/green tests.
2. L2 repository and hook red/green tests.
3. Existing route smoke plus L3 mocked flow.
4. Live L3 when endpoint is published.
5. Typecheck, token lint, build, and broader regression tests.

## Known Environment Limitation

Đường dẫn Obsidian Windows mà skill QA yêu cầu không tồn tại trên máy macOS hiện tại. Artifacts được lưu trong `reports/` của workspace để không ghi ra ngoài phạm vi project; live screenshots sẽ đặt cùng prefix US-045 nếu có thể chạy.

# US-046 · Staff My Calendar

| | |
|---|---|
| **Trạng thái** | Integrated |
| **Ngày tạo** | 2026-09-04 |
| **Epic / Domain** | POS — Staff Workspace |
| **OpenSpec change** | `openspec/changes/integrate-staff-my-calendar` |
| **Test plan** | (chưa viết) |

## Story

**Là** Staff (thợ),
**tôi muốn** xem lịch hẹn của riêng mình theo từng ngày và mở được chi tiết từng booking,
**để** biết hôm nay/tuần sau mình có bao nhiêu khách đặt trước mà không phải hỏi quầy.

## Acceptance Criteria

- **Given** thợ đã link 1 tiệm và có booking được assign trong ngày hôm nay
  **When** mở `/staff/calendar`
  **Then** week strip hiện tuần chứa hôm nay, ngày hôm nay được chọn sẵn theo **giờ của tiệm**,
  danh sách hiện các booking xếp theo giờ hẹn, header hiện số lịch hẹn + tổng thời lượng
  (`GET /api/v1/staff/pos/work-orders/calendar?businessId=&date=` → 200)

- **Given** đang xem một ngày
  **When** bấm một ngày khác trên week strip
  **Then** gọi lại API với `date` mới; ngày quá khứ và tương lai đều xem được, không giới hạn

- **Given** một booking trong danh sách
  **When** bấm vào card
  **Then** điều hướng sang `/staff/work-orders/{salonId}/{orderId}` — dùng **id đơn**, không phải
  mã `WO-xxxx` hiển thị trên card

- **Given** ngày không có booking nào
  **When** màn load xong
  **Then** hiện empty state, không phải lỗi

- **Given** thợ link nhiều hơn 1 tiệm
  **When** mở màn
  **Then** header có dropdown chọn tiệm; đổi tiệm ghi `?salon=` vào URL và load lại lịch của tiệm đó

- **Given** thợ chưa link tiệm nào
  **When** mở màn
  **Then** hiện trạng thái "chưa liên kết tiệm", không gọi API

- **Given** booking do 2 thợ cùng làm
  **When** thợ A xem lịch
  **Then** card chỉ hiện service + số phút của thợ A; tổng ngày không cộng phần của thợ B

## API Mapping

> Endpoint mới, implement trong `vlink-nexora` cùng phiên (branch `enhance/add-service-line-status`).
> **Chưa có trên `test-api.nexoratouch.com`** — cần deploy branch đó hoặc chạy backend local.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/staff/pos/work-orders/calendar` | Bearer (staff) | `businessId` (guid, bắt buộc), `date` (yyyy-MM-dd, optional = hôm nay theo giờ tiệm) | `{ date, appointmentCount, totalDurationMinutes, items[] }`; item: `{ id, orderNumber, customerName, status, myLineStatus, scheduledAt, myServiceNames[], myDurationMinutes }` | (S) — đọc từ source handler `GetMyBookingCalendarQuery` |

**Điểm đã chốt (không phải câu hỏi mở):**
- Chỉ booking (`PosBooking`), không có walk-in. `Cancelled` bị loại.
- `scheduledAt` mang offset của tiệm — parse giờ từ chuỗi, không convert sang local browser.
- `myDurationMinutes` = tổng `Service.DurationMinutes` các dòng cha của thợ. Add-on góp 0 phút
  (`ServiceAddOn` không có `DurationMinutes` — cố ý). Custom service góp tên, 0 phút.
- `status` (đơn) và `myLineStatus` (dòng của thợ) có thể lệch nhau; card đang hiển thị `status`.

## FE Surface

| Layer | File | Thay đổi |
|---|---|---|
| Component | `src/components/staff-dashboard/calendar/StaffMyCalendar.tsx` | Bỏ mock, render data thật, dropdown chọn tiệm, link theo order id, error/empty state |
| Component | `src/components/staff-dashboard/calendar/constants.ts` | Xoá mock + hardcoded timezone; type = DTO của repository; thêm 3 i18n key |
| Component | `src/components/staff-dashboard/calendar/calendarUtils.ts` | `formatCalendarTime` đọc `HH:mm` từ ISO có offset; xoá `appointmentsForDate` |
| Component | `src/components/staff-dashboard/layout/StaffSidebar.tsx` | Badge số lịch hẹn hôm nay là số thật, ẩn khi 0 |
| Data hook | `src/components/staff-dashboard/calendar/useStaffCalendarSalon.ts` (mới) | Resolve salon + "hôm nay" theo timezone tiệm; `useStaffCalendarTodayCount` cho sidebar |
| Data hook | `src/data/hooks/useStaffWorkOrders.ts` | `useStaffBookingCalendar`; query key `qk.staffBookingCalendar` |
| Repository | `src/data/repositories/staffWorkOrders.ts` | `getBookingCalendar` + normalize; đếm lại count/total sau khi loại row thiếu `scheduledAt` |
| Khác | `src/types/repositories.ts`, `src/data/queryKeys.ts`, `src/locales/{en,vi}.json` | DTO, query key, i18n |
| Xoá | `src/components/staff-dashboard/calendar/useStaffCalendarAppointments.ts` | Hook mock |

## Definition of Done

- [ ] AC pass trên môi trường dev (API thật) — **chưa chạy**, endpoint chưa deploy
- [ ] API call đúng contract đã map (verify bằng network)
- [x] Query key nằm dưới root `staffWorkOrders` nên mutation start/complete service invalidate luôn lịch
- [ ] Không console error
- [ ] Test theo 3 layer (L1 UI / L2 data boundary / L3 flow)
- [x] `pnpm typecheck` không phát sinh lỗi mới; `pnpm build:dev` pass

## Ghi chú phiên thực thi

- Màn FE merge vào trước khi có API: chạy hoàn toàn bằng `setTimeout` + mock array, badge sidebar
  in cứng số `4` trên mọi màn staff.
- 3 lệch giữa mockup/FE đã merge và contract thật, đã sửa khi integrate: link detail dùng
  `WO-xxxx` thay vì order id; timezone hardcode `America/Chicago`; giờ hẹn là string `'08:00'`
  thay vì ISO có offset.
- Mockup không có bước chọn salon nhưng API là per-salon → resolve ở FE (xem `design.md` D5),
  không đổi API sang gộp nhiều tiệm.

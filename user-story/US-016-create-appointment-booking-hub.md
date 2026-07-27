# US-016 · Owner tạo lịch hẹn mới trên Booking Hub

| | |
|---|---|
| **Trạng thái** | Integrated |
| **Ngày tạo** | 2026-07-27 |
| **Epic / Domain** | Booking Hub / Appointments |
| **OpenSpec change** | — |
| **Test plan** | (điền khi viết test) |

## Story

**Là** chủ tiệm (Business Owner),
**tôi muốn** mở dialog tạo lịch hẹn từ nút **New appointment** hoặc ô `+` trên Team calendar,
**để** tự thêm booking (khách, dịch vụ, thợ, ngày/giờ, trạng thái) mà không phụ thuộc khách đặt qua Voice/Landing.

## Acceptance Criteria

- **Given** tôi đang ở Booking Hub → tab Booking → Appointments overview
- **When** tôi bấm **New appointment**
- **Then** dialog tạo lịch hẹn mở, load services (config) + staff (active) kèm skeleton, date/time dùng picker kiểu schedule (display overlay + native input)

- **Given** tôi đang ở Calendar view
- **When** tôi chọn một khung giờ trống (ô có dấu `+`)
- **Then** dialog mở với date/time (và technician nếu cột có tên thợ) đã prefill

- **Given** form hợp lệ (name, phone, ≥1 service, date, time)
- **When** tôi bấm **Save appointment**
- **Then** FE gọi `POST /api/v1/merchant/nexora-voice/bookings` với payload `CreateMerchantVoiceBookingCommand`, invalidate bookings cache, đóng dialog và toast success

## API Mapping

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| POST | `/api/v1/merchant/nexora-voice/bookings` | JWT | `CreateMerchantVoiceBookingCommand` (`customerName`, `customerPhone`, `serviceIds`, `staffId?`, `date`, `startTime`, `notes?`, `status`) | `CreateOnlineBookingResultDto` 201 | (S) |
| GET | `/api/v1/merchant/nexora-voice/config` | JWT | — | services list | (S) existing |
| GET | `/api/v1/merchant/nexora-voice/staff` | JWT | `Status=Active` | staff list | (S) existing |

**Điểm chưa chắc chắn / cần hỏi BE:** —

**Timezone:** UI giữ `date`/`startTime` theo đồng hồ local của user (browser TZ). Repository convert sang UTC trước khi POST (cùng `toUtcBookingSlot` như public booking). List/calendar đọc `requestedStartAtUtc` rồi format lại local → chọn 10:00 thì vẫn hiện 10:00.

## FE Surface

| Layer | File | Thay đổi |
|---|---|---|
| Component | `BookingCreateAppointmentModal.tsx`, `BookingTodayPanel.tsx`, `BookingTeamCalendar.tsx` | Dialog + button + calendar slot `+` |
| Data hook | `useMerchantVoiceBookings.ts` | `useCreateMerchantVoiceBooking` |
| Repository | `merchantVoice.ts` | `createBooking` |
| Domain | `merchantVoice/domain.ts` | `mapUiStatusToLeadStatusApi` |
| Styles / i18n | `booking-hub.css`, `en.json`, `vi.json` | UI + copy |

## Definition of Done

- [ ] AC pass trên môi trường dev (API thật)
- [ ] API call đúng contract đã map (method/status/payload — verify bằng network)
- [ ] Mutation invalidate đúng query cache
- [ ] Không console error
- [ ] Test theo 3 layer (skill feature-focused-tester): L1 UI / L2 data boundary / L3 flow
- [x] Cập nhật trạng thái file này

## Ghi chú phiên thực thi

- UI bám HTML `booking-book-phase-1.html` (booking-create-modal).
- Services từ config (`isActive`), staff Active pageSize 100.
- Status UI `sms-sent` map API `Confirmed`.

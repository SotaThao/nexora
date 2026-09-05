## 1. Backend (`vlink-nexora` repo)

- [x] 1.1 `GetMyBookingCalendarQuery` + DTOs + handler under
      `Features/Pos/StaffWorkOrders/Queries/GetMyBookingCalendar/`
- [x] 1.2 `GetMyBookingCalendarQueryValidator` — `BusinessId` `NotEmpty()`
- [x] 1.3 `GET calendar` action on `StaffWorkOrdersController` (success + 400 only)
- [x] 1.4 `dotnet build -p:SkipNSwag=True` clean (0 warnings, 0 errors)
- [ ] 1.5 Regenerate `specification.json` / `web-api-client.ts` — needs the app to boot
      (Postgres + `NexoraVoice:AnthropicApiKey`), so it runs on the next normal local run

## 2. Contract and Query Keys

- [x] 2.1 `StaffBookingCalendarApiDto`, `StaffBookingCalendarItemApiDto`,
      `StaffBookingCalendarQuery` in `src/types/repositories.ts`
- [x] 2.2 `qk.staffBookingCalendar(businessId, date)` under the `staffWorkOrders` root

## 3. Data Layer

- [x] 3.1 `StaffBookingCalendar` / `StaffBookingCalendarItem` types + `normalizeCalendarItem`
      + `normalizeCalendar` + `getBookingCalendar` in `staffWorkOrders.ts`
- [x] 3.2 `useStaffBookingCalendar(businessId, date)` in `useStaffWorkOrders.ts`

## 4. Screen

- [x] 4.1 `useStaffCalendarSalon` — salon + salon-timezone "today" resolution (D5)
- [x] 4.2 `StaffMyCalendar.tsx` on real data: order-id links, server-side total, salon select,
      error state via `WorkOrderErrorCard`, no-salon empty state
- [x] 4.3 `formatCalendarTime` reads the wall clock out of the ISO offset string (D3)
- [x] 4.4 Sidebar badge from `useStaffCalendarTodayCount`, hidden at zero (D7)
- [x] 4.5 Remove mock: `useStaffCalendarAppointments.ts`, `STAFF_CALENDAR_MOCK_APPOINTMENTS`,
      `STAFF_CALENDAR_TODAY_COUNT`, `STAFF_CALENDAR_LOAD_DELAY_MS`, `STAFF_CALENDAR_TIME_ZONE`,
      `appointmentsForDate`, `totalAppointmentDuration`
- [x] 4.6 `calendar.salon_label` / `no_salon_title` / `no_salon_body` in `en.json` + `vi.json`

## 5. Verification

- [x] 5.1 `pnpm typecheck` — no new errors (58 pre-existing before, 57 after)
- [x] 5.2 `pnpm build:dev` succeeds
- [ ] 5.3 Live run against a backend carrying the new endpoint: day with bookings, empty day,
      future day, two-salon technician, a booking shared with another technician

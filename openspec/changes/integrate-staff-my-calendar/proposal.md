## Why

The "My Calendar" screen (`src/components/staff-dashboard/calendar/`) was merged into
`feat/staff-work-orders` as a presentation-only shell: `useStaffCalendarAppointments.ts` waited
450 ms on a `setTimeout` and returned `STAFF_CALENDAR_MOCK_APPOINTMENTS` for today and an empty
array for every other day. The sidebar badge printed the mock array's length (a constant `4`) on
every screen.

The backend endpoint it needed did not exist either. It was designed in the same session (see
`design.md` D1) and implemented in the `vlink-nexora` repo as
`GET /api/v1/staff/pos/work-orders/calendar`.

## What Changes

- **Backend (`vlink-nexora`)**: new `GetMyBookingCalendarQuery` under
  `Features/Pos/StaffWorkOrders/Queries/GetMyBookingCalendar/` + a `calendar` action on the
  existing `StaffWorkOrdersController`. Appointments only (`PosBooking`), one salon, one day,
  every figure narrowed to the caller's own parent service lines.
- Add `StaffBookingCalendarApiDto`/`StaffBookingCalendarItemApiDto`/`StaffBookingCalendarQuery`
  to `src/types/repositories.ts`, and `getBookingCalendar` + `normalizeCalendar` to
  `src/data/repositories/staffWorkOrders.ts` (same controller, so the same repository owns it).
- Add `qk.staffBookingCalendar(businessId, date)` under the existing `staffWorkOrders` root, so
  start/complete-service mutations already invalidate the calendar.
- Add `useStaffBookingCalendar` to `src/data/hooks/useStaffWorkOrders.ts`.
- New `useStaffCalendarSalon` hook: My Calendar is a top-level nav item with no salon step, but
  the API is per-salon — resolve it from the technician's own links (`?salon=` when named,
  otherwise their only salon) and derive "today" from that salon's timezone.
- `StaffMyCalendar.tsx` renders API data: card link addresses the order id (not the WO number),
  the day total comes from the server, a salon `<select>` appears only when the technician works
  at more than one salon, and load failures reuse `WorkOrderErrorCard`.
- Sidebar badge becomes the real count of today's appointments and hides at zero.
- Delete `useStaffCalendarAppointments.ts`, `STAFF_CALENDAR_MOCK_APPOINTMENTS`,
  `STAFF_CALENDAR_TODAY_COUNT`, `STAFF_CALENDAR_LOAD_DELAY_MS`, the hardcoded
  `STAFF_CALENDAR_TIME_ZONE = 'America/Chicago'`, and `appointmentsForDate`.

## Capabilities

### New Capabilities

- `staff-my-calendar`: a technician sees their own appointments for any day, past or future,
  with the day's appointment count and total booked minutes, and opens any of them in the
  existing work-order detail screen.

## Impact

- **Files new**: `src/components/staff-dashboard/calendar/useStaffCalendarSalon.ts`.
- **Files modified**: `src/types/repositories.ts`, `src/data/repositories/staffWorkOrders.ts`,
  `src/data/queryKeys.ts`, `src/data/hooks/useStaffWorkOrders.ts`,
  `src/components/staff-dashboard/calendar/StaffMyCalendar.tsx`,
  `src/components/staff-dashboard/calendar/constants.ts`,
  `src/components/staff-dashboard/calendar/calendarUtils.ts`,
  `src/components/staff-dashboard/layout/StaffSidebar.tsx`, `src/locales/en.json`,
  `src/locales/vi.json`.
- **Files deleted**: `src/components/staff-dashboard/calendar/useStaffCalendarAppointments.ts`.
- **Data boundary**: components -> data hooks -> repository -> `httpClient`. No new adapter.
- **Non-goals**: aggregating several salons into one calendar (the API is per-salon by design);
  per-day dot counts on the week strip (would need a week-range endpoint — deferred, see
  `design.md` D4); any write action from the calendar (start/complete stays in the work-order
  detail screen).

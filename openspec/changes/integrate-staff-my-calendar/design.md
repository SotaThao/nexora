## Context

The screen was merged FE-first from a design mockup; the endpoint it needs was specced and then
written in the `vlink-nexora` repo in the same session. Nothing here was reverse-engineered from
an existing API — the contract below is the one that was just implemented, so FE and BE agree by
construction rather than by guessing field names.

The endpoint is **not** on `https://test-api.nexoratouch.com` yet — it lives on the
`enhance/add-service-line-status` branch of `vlink-nexora` and needs that branch deployed (or a
local backend) before this screen shows anything. Until then the screen renders its empty state,
not an error.

## Source Contract

`GET /api/v1/staff/pos/work-orders/calendar?businessId={guid}&date={yyyy-MM-dd}` — `[Authorize]`,
identity-scoped like the rest of `StaffWorkOrdersController` (no POS Operations permission needed).

```
{
  date: "2026-09-04",
  appointmentCount: 4,
  totalDurationMinutes: 225,
  items: [{
    id: "<guid>",                 // PosOrder id — this is what the detail route takes
    orderNumber: "WO-1039",       // display only
    customerName: "Ava Johnson",
    status: "Completed",          // PosOrderStatus of the whole appointment
    myLineStatus: "Completed",    // PosOrderItemStatus of the caller's own lines
    scheduledAt: "2026-09-04T08:00:00-05:00",   // salon wall clock + salon offset
    myServiceNames: ["Classic Manicure"],
    myDurationMinutes: 60
  }]
}
```

### D1 — Appointments only, and only the caller's share of them

The query reads `PosBookings`, never plain `PosOrder` walk-ins: a card without a scheduled time
cannot be placed on a timeline, and the day total would stop meaning "how long am I booked for".
`PosBooking` is a TPT subtype of `PosOrder`, so an appointment that has already been checked in
keeps its `ScheduledAt` and simply moves through `Waiting → InService → Completed` — the
Completed/In-service badges in the mockup all come from real bookings. `Cancelled` is excluded
outright so it inflates neither the count nor the total.

`myServiceNames` and `myDurationMinutes` cover only the parent service lines assigned to the
caller. A booking worked by two technicians therefore shows each of them a different card.

### D2 — Two status fields, deliberately

`status` (order) and `myLineStatus` (this technician's lines) disagree in a real, common case:
the ticket is `InService` because another technician started, while my own line is still
`Assigned`. The card currently renders `status` through the existing
`STAFF_CALENDAR_STATUS_I18N` map; `myLineStatus` is carried through the repository so the badge
can switch or split later without a backend round-trip.

### D3 — Time is read from the string, never re-parsed into browser local

`scheduledAt` carries the salon's own offset. `formatCalendarTime` pulls `HH:mm` straight out of
the ISO string (`/T(\d{2}):(\d{2})/`). Building a `Date` and formatting it would re-render the
salon's 8:00 AM in the technician's browser zone — the same class of bug already hit in POS
Booking. For the same reason "today" comes from `formatDateIsoInTimeZone(new Date(), salon.timeZone)`,
not from the browser's calendar day, and the hardcoded `'America/Chicago'` fallback is gone.

Backend matches the requested date against the salon's calendar day exactly
(`StaffWorkOrderSchedule.BuildMatchDates` returns a single date). It does **not** reuse the
older ±1-day widening that `GetMyWorkOrders` once had — on a calendar where the technician picks
a day explicitly, that would leak Saturday's bookings into Friday and corrupt the total.

### D4 — One request per day, not per week

The week strip fires one request per selected day. A week-range variant (`FromDate`/`ToDate`)
would enable instant day switching and per-day dot counts, and the wrapper DTO
(`{date, appointmentCount, totalDurationMinutes, items}`) was shaped so that change stays
additive. Deferred on purpose until the per-day version proves too slow in use.

### D5 — Salon resolution lives in FE, not in the API

The merged screen is a top-level nav item (`/staff/calendar`) with no salon step, but
`businessId` is required. `useStaffCalendarSalon` resolves it from the cached
`useStaffBusinesses` list: the `?salon=` one when the URL names it, otherwise the first active
link. A `<select>` appears in the header only when the technician works at more than one salon,
and writes `?salon=` so the detail link and "Back to work orders" point at the right salon.

The alternative — dropping `businessId` and aggregating every salon server-side — was rejected:
salons in different timezones have different "days", which makes both the day boundary and the
"3h 45m" total ambiguous.

### D6 — Add-ons contribute names but not minutes

`ServiceAddOn` has no `DurationMinutes` on purpose (see the comment on the entity: add-ons are a
front-desk feature and booking is the only consumer of duration). So `myDurationMinutes` is the
sum of the parent lines' `Service.DurationMinutes`; a custom off-menu line contributes its name
and zero minutes. This is a known under-count, not an oversight — fixing it means giving
`ServiceAddOn` a duration, which is a booking-model change, not a calendar change.

### D7 — Sidebar badge shares the screen's queries

`useStaffCalendarTodayCount` composes `useStaffCalendarSalon` + `useStaffBookingCalendar` for the
salon's today. Both queries are already cached under existing keys, so mounting the sidebar on
any staff screen costs no extra round-trip beyond the first. The badge hides at zero instead of
printing `0` — previously it printed a hardcoded `4` on every screen.

import type { Shift, ShiftApplication } from "../types";

export const shifts: Shift[] = [
  { id: "shift-party", title: "🎉 Party cuối tuần", salonId: "kayla-nails", startsAt: "2026-10-03T10:00:00", pay: 180, status: "open", kind: "party", mode: "instant" },
  { id: "shift-busy", title: "🔥 Khách đông chiều thứ bảy", salonId: "lotus", startsAt: "2026-10-04T13:00:00", pay: 150, status: "open", kind: "busy", mode: "approval" },
  { id: "shift-urgent", title: "⚡ Thiếu thợ gấp", salonId: "crystal", startsAt: "2026-10-05T09:00:00", pay: 200, status: "open", kind: "urgent", mode: "instant" },
  { id: "shift-gelx", title: "Ca Gel-X chiều", salonId: "bloom", startsAt: "2026-10-06T14:00:00", pay: 140, status: "confirmed", mode: "approval" },
  { id: "shift-pedi", title: "Ca pedicure cuối ngày", salonId: "ivy", startsAt: "2026-10-07T11:00:00", pay: 120, status: "completed", mode: "instant" },
];

export const shiftApplications: ShiftApplication[] = [
  { id: "app-invited", shiftId: "shift-party", techId: "jessica", status: "Được mời" }, { id: "app-pending", shiftId: "shift-busy", techId: "jessica", status: "Chờ duyệt" }, { id: "app-confirmed", shiftId: "shift-urgent", techId: "jessica", status: "Đã chốt" }, { id: "app-working", shiftId: "shift-gelx", techId: "jessica", status: "Đang làm" }, { id: "app-complete", shiftId: "shift-pedi", techId: "jessica", status: "Hoàn thành" }, { id: "app-absent", shiftId: "shift-party", techId: "jessica", status: "Vắng mặt" },
];

export const shiftPolicy = { checkInMinutesBefore: 30, checkInMinutesAfter: 15, techCancelHours: 24, ownerCancelHours: 24, lateCancelFee: 25, noShowFee: 50 };

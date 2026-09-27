import type {
  Shift,
  ShiftApplication,
  ShiftApplicationStatus,
  ShiftBoard,
  ShiftKind,
  ShiftMode,
  ShiftPolicy,
} from "../types";

/** Demo "now" — Chủ nhật 27/09/2026 09:00. Presenters move it with "Giờ giả lập" on S03-03. */
export const DEMO_CLOCK = "2026-09-27T09:00:00";

/** Policy v1 — every number is SỐ MẪU (doc 03 · Cấu hình & quản trị). */
export const shiftPolicy: ShiftPolicy = {
  version: 1,
  depositPct: 20,
  freeCancelHours: 24,
  techLateLossPct: 50,
  noShowLossPct: 100,
  salonLatePayPct: 50,
  graceMinutes: 15,
  updatedAt: "2026-09-20T09:00:00",
};

type ShiftInput = {
  id: string;
  title: string;
  salonId: string;
  kind: ShiftKind;
  mode: ShiftMode;
  startsAt: string;
  endsAt: string;
  pay: number;
  staffNeeded: number;
  services: string[];
  distanceMi: number;
  tips?: number;
};

const shift = (input: ShiftInput): Shift => ({
  ...input,
  tips: input.tips ?? 40,
  status: "open",
  guarantee: input.pay * input.staffNeeded,
  policy: { ...shiftPolicy },
  postedAt: "2026-09-26T08:00:00",
});

export const shifts: Shift[] = [
  shift({
    id: "shift-urgent", title: "Thiếu 2 thợ bột ca chiều", salonId: "bloom", kind: "urgent", mode: "instant",
    startsAt: "2026-09-27T14:00:00", endsAt: "2026-09-27T20:00:00", pay: 200, staffNeeded: 2,
    services: ["Bột/Acrylic", "Gel Polish"], distanceMi: 3.2,
  }),
  shift({
    id: "shift-gelx", title: "Khách đông sáng chủ nhật", salonId: "kayla-nails", kind: "busy", mode: "approval",
    startsAt: "2026-09-27T08:00:00", endsAt: "2026-09-27T13:00:00", pay: 140, staffNeeded: 2,
    services: ["Gel-X", "Chân/Pedicure"], distanceMi: 2.1,
  }),
  shift({
    id: "shift-kayla-today", title: "Cần gấp 1 thợ tối nay", salonId: "kayla-nails", kind: "urgent", mode: "instant",
    startsAt: "2026-09-27T15:00:00", endsAt: "2026-09-27T21:00:00", pay: 190, staffNeeded: 2,
    services: ["Gel Polish", "Tay nước"], distanceMi: 2.1,
  }),
  shift({
    id: "shift-party", title: "Tiệc cưới — làm móng cô dâu & khách", salonId: "kayla-nails", kind: "party",
    mode: "instant", startsAt: "2026-09-28T10:00:00", endsAt: "2026-09-28T16:00:00", pay: 180, staffNeeded: 3,
    services: ["Gel-X", "Nail Art", "Gel Polish"], distanceMi: 2.1, tips: 60,
  }),
  shift({
    id: "shift-busy", title: "Khách đông chiều thứ ba", salonId: "lotus", kind: "busy", mode: "approval",
    startsAt: "2026-09-29T13:00:00", endsAt: "2026-09-29T19:00:00", pay: 150, staffNeeded: 2,
    services: ["Dip", "Chân/Pedicure", "Wax"], distanceMi: 8.5,
  }),
  shift({
    id: "shift-ivy-far", title: "Thiếu thợ gấp — khai trương", salonId: "ivy", kind: "urgent", mode: "approval",
    startsAt: "2026-09-29T10:00:00", endsAt: "2026-09-29T18:00:00", pay: 210, staffNeeded: 2,
    services: ["Bột/Acrylic", "Nail Art"], distanceMi: 22,
  }),
  shift({
    id: "shift-crystal-art", title: "Party sinh nhật — nail art", salonId: "crystal", kind: "party", mode: "approval",
    startsAt: "2026-09-30T11:00:00", endsAt: "2026-09-30T17:00:00", pay: 220, staffNeeded: 1,
    services: ["Nail Art", "Gel-X"], distanceMi: 18,
  }),
  shift({
    id: "shift-bloom-week", title: "Khách đông thứ sáu", salonId: "bloom", kind: "busy", mode: "instant",
    startsAt: "2026-10-02T12:00:00", endsAt: "2026-10-02T18:00:00", pay: 170, staffNeeded: 3,
    services: ["Gel Polish", "Dip", "Tay nước"], distanceMi: 3.2,
  }),
  shift({
    id: "shift-kayla-sat", title: "Khách đông thứ bảy", salonId: "kayla-nails", kind: "busy", mode: "approval",
    startsAt: "2026-10-03T09:00:00", endsAt: "2026-10-03T17:00:00", pay: 160, staffNeeded: 2,
    services: ["Bột/Acrylic", "Chân/Pedicure"], distanceMi: 2.1,
  }),
  shift({
    id: "shift-pedi", title: "Party cuối tuần — pedicure", salonId: "ivy", kind: "party", mode: "instant",
    startsAt: "2026-09-25T11:00:00", endsAt: "2026-09-25T17:00:00", pay: 120, staffNeeded: 1,
    services: ["Chân/Pedicure"], distanceMi: 22,
  }),
  shift({
    id: "shift-lotus-eve", title: "Thiếu thợ gấp tối thứ năm", salonId: "lotus", kind: "urgent", mode: "instant",
    startsAt: "2026-09-24T17:00:00", endsAt: "2026-09-24T22:00:00", pay: 150, staffNeeded: 1,
    services: ["Gel Polish"], distanceMi: 8.5,
  }),
];

shifts.filter((item) => ["shift-pedi", "shift-lotus-eve"].includes(item.id)).forEach((item) => {
  item.status = "full";
});

type AppInput = {
  id: string;
  shiftId: string;
  techId: string;
  status: ShiftApplicationStatus;
  path: [ShiftApplicationStatus, string][];
  deposit?: number;
  note?: string;
  checkedInAt?: string;
};

const app = (input: AppInput): ShiftApplication => {
  const { path, ...rest } = input;
  const agreed = path.find(([status]) => status !== "invited");
  return {
    ...rest,
    deposit: input.deposit ?? 0,
    policy: agreed ? { ...shiftPolicy } : undefined,
    agreedAt: agreed?.[1],
    history: path.map(([status, at]) => ({ status, at })),
  };
};

export const shiftApplications: ShiftApplication[] = [
  // Jessica — one application in every state (S03-03).
  app({ id: "app-invited", shiftId: "shift-party", techId: "jessica", status: "invited",
    path: [["invited", "2026-09-26T18:00:00"]] }),
  app({ id: "app-pending", shiftId: "shift-busy", techId: "jessica", status: "pending", deposit: 30,
    path: [["pending", "2026-09-26T12:10:00"]] }),
  app({ id: "app-locked", shiftId: "shift-urgent", techId: "jessica", status: "locked", deposit: 40,
    path: [["locked", "2026-09-26T20:05:00"]] }),
  app({ id: "app-working", shiftId: "shift-gelx", techId: "jessica", status: "working", deposit: 28,
    checkedInAt: "2026-09-27T07:52:00",
    path: [
      ["pending", "2026-09-25T10:00:00"], ["locked", "2026-09-25T15:30:00"], ["working", "2026-09-27T07:52:00"],
    ] }),
  app({ id: "app-completed", shiftId: "shift-pedi", techId: "jessica", status: "completed", deposit: 24,
    note: "Đã nhận $120 tiền công · hoàn 100% cọc $24",
    path: [
      ["locked", "2026-09-22T09:00:00"], ["working", "2026-09-25T10:55:00"], ["completed", "2026-09-25T17:10:00"],
    ] }),
  app({ id: "app-absent", shiftId: "shift-lotus-eve", techId: "jessica", status: "absent", deposit: 30,
    note: "Mất $30 cọc → chuyển cho tiệm",
    path: [["locked", "2026-09-23T11:00:00"], ["absent", "2026-09-24T17:15:00"]] }),
  app({ id: "app-cancelled", shiftId: "shift-kayla-sat", techId: "jessica", status: "techCancelled", deposit: 32,
    note: "Huỷ trước 24h — hoàn 100% cọc $32",
    path: [["pending", "2026-09-24T09:00:00"], ["techCancelled", "2026-09-25T09:00:00"]] }),
  app({ id: "app-rejected", shiftId: "shift-crystal-art", techId: "jessica", status: "rejected", deposit: 44,
    note: "Tiệm chọn thợ khác — hoàn 100% cọc $44",
    path: [["pending", "2026-09-25T14:00:00"], ["rejected", "2026-09-26T09:30:00"]] }),
  // Other techs — candidates for Kayla's POS screens.
  app({ id: "app-nhi-gelx", shiftId: "shift-gelx", techId: "5574", status: "working", deposit: 28,
    checkedInAt: "2026-09-27T07:58:00",
    path: [
      ["pending", "2026-09-25T11:00:00"], ["locked", "2026-09-25T15:32:00"], ["working", "2026-09-27T07:58:00"],
    ] }),
  app({ id: "app-kim-today", shiftId: "shift-kayla-today", techId: "7701", status: "locked", deposit: 38,
    path: [["locked", "2026-09-26T21:00:00"]] }),
  app({ id: "app-minh-party", shiftId: "shift-party", techId: "1048", status: "locked", deposit: 36,
    path: [["locked", "2026-09-26T10:00:00"]] }),
  app({ id: "app-han-party", shiftId: "shift-party", techId: "2221", status: "locked", deposit: 36,
    path: [["locked", "2026-09-26T11:20:00"]] }),
  app({ id: "app-thao-sat", shiftId: "shift-kayla-sat", techId: "4450", status: "pending", deposit: 32,
    path: [["pending", "2026-09-26T16:00:00"]] }),
  app({ id: "app-kim-sat", shiftId: "shift-kayla-sat", techId: "7701", status: "pending", deposit: 32,
    path: [["pending", "2026-09-26T19:40:00"]] }),
  app({ id: "app-minh-sat", shiftId: "shift-kayla-sat", techId: "1048", status: "locked", deposit: 32,
    path: [["pending", "2026-09-25T08:00:00"], ["locked", "2026-09-25T12:00:00"]] }),
];

export const shiftBoard: ShiftBoard = {
  clock: DEMO_CLOCK,
  availability: {
    jessica: { ready: true, days: ["T7", "CN"], radius: 10 },
    "4450": { ready: true, days: ["T6", "T7"], radius: 25 },
    "5574": { ready: true, days: ["CN"], radius: 10 },
    "7701": { ready: false, days: ["T7"], radius: 10 },
    "2221": { ready: true, days: ["T7", "CN"], radius: 25 },
    "1048": { ready: true, days: ["T2", "T7"], radius: 25 },
  },
  share: {
    // Kayla Nails & Spa staff (S03-08): two consented, two not yet.
    "1199": { homeSalonId: "kayla-nails", consent: true, shared: false, day: "Ngày mai" },
    "6683": { homeSalonId: "kayla-nails", consent: true, shared: true, day: "Thứ 7" },
    "3332": { homeSalonId: "kayla-nails", consent: false, shared: false, day: "Ngày mai" },
    "8818": { homeSalonId: "kayla-nails", consent: false, shared: false, day: "Ngày mai" },
    // Shared by other salons — shown on S03-07 with "Chia sẻ từ <tiệm>".
    "1048": { homeSalonId: "lotus", consent: true, shared: true, day: "Thứ 7" },
    "2221": { homeSalonId: "crystal", consent: true, shared: true, day: "Chủ nhật" },
  },
  reliability: {},
  policyHistory: [{ ...shiftPolicy }],
};

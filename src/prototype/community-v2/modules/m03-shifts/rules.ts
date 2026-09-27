import type { Person, Shift, ShiftApplication, ShiftApplicationStatus, ShiftPolicy } from "../../store/types";

/** Check-in opens a fixed 1 hour before the shift (doc 03: hard-coded, not in the policy table). */
export const CHECKIN_OPENS_MINUTES = 60;
export const HOUR = 3_600_000;
export const MINUTE = 60_000;

export const ms = (iso: string) => new Date(iso).getTime();

export function toLocalIso(time: number) {
  const date = new Date(time);
  const pad = (value: number) => String(value).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  );
}

export const depositFor = (pay: number, policy: ShiftPolicy) => Math.round((pay * policy.depositPct) / 100);

/** Statuses that occupy a slot on the shift. */
export const SEATED: ShiftApplicationStatus[] = ["locked", "working", "completed"];
export const ACTIVE: ShiftApplicationStatus[] = ["invited", "pending", "locked", "working"];
export const FINISHED: ShiftApplicationStatus[] = [
  "completed",
  "absent",
  "techCancelled",
  "salonCancelled",
  "rejected",
];

export const seatedCount = (shiftId: string, apps: ShiftApplication[]) =>
  apps.filter((item) => item.shiftId === shiftId && SEATED.includes(item.status)).length;

export const isPast = (shift: Shift, clock: string) => ms(shift.startsAt) <= ms(clock);

export const policyOf = (app: ShiftApplication | undefined, shift: Shift) => app?.policy ?? shift.policy;

export function checkInWindow(shift: Shift, policy: ShiftPolicy) {
  const start = ms(shift.startsAt);
  return { opensAt: start - CHECKIN_OPENS_MINUTES * MINUTE, closesAt: start + policy.graceMinutes * MINUTE };
}

export function canCheckIn(shift: Shift, policy: ShiftPolicy, clock: string) {
  const { opensAt, closesAt } = checkInWindow(shift, policy);
  const now = ms(clock);
  return now >= opensAt && now <= closesAt;
}

export const hoursLeft = (shift: Shift, clock: string) => (ms(shift.startsAt) - ms(clock)) / HOUR;

export type CancelQuote = {
  late: boolean;
  free: boolean;
  hours: number;
  /** Tech: deposit lost to the salon. Salon: amount paid to each locked tech. */
  amount: number;
  refund: number;
  seated: number;
  text: string;
};

/** Doc 03 · Luồng 4 — thợ huỷ. Invited / pending is always free. */
export function quoteTechCancel(app: ShiftApplication, shift: Shift, clock: string): CancelQuote {
  const policy = policyOf(app, shift);
  const hours = hoursLeft(shift, clock);
  const late = app.status === "locked" && hours < policy.freeCancelHours;
  if (!late) {
    const text = "Miễn phí, hoàn 100% cọc";
    return { late: false, free: true, hours, amount: 0, refund: app.deposit, seated: 0, text };
  }
  const amount = Math.round((app.deposit * policy.techLateLossPct) / 100);
  const text =
    `Còn ${Math.max(0, Math.floor(hours))} giờ tới ca (dưới ${policy.freeCancelHours}h). ` +
    `Bạn sẽ mất $${amount} cọc — chuyển cho tiệm để xếp người thay/bồi thường khách.`;
  return { late: true, free: false, hours, amount, refund: app.deposit - amount, seated: 0, text };
}

/** Doc 03 · Luồng 4 — tiệm huỷ ca đã có thợ chốt. */
export function quoteSalonCancel(shift: Shift, apps: ShiftApplication[], clock: string): CancelQuote {
  const policy = shift.policy;
  const hours = hoursLeft(shift, clock);
  const seated = apps.filter((item) => item.shiftId === shift.id && ["locked", "working"].includes(item.status)).length;
  const late = hours < policy.freeCancelHours;
  if (!late) {
    const text = "Miễn phí; thợ hoàn đủ cọc; tiệm nhận lại toàn bộ bảo đảm";
    return { late: false, free: true, hours, amount: 0, refund: shift.guarantee, seated, text };
  }
  const amount = Math.round((shift.pay * policy.salonLatePayPct) / 100);
  const text =
    `Còn dưới ${policy.freeCancelHours}h. Tiệm trả $${amount} cho mỗi thợ đã chốt ` +
    `(${seated} thợ) từ tiền công bảo đảm.`;
  return { late: true, free: false, hours, amount, refund: shift.guarantee - amount * seated, seated, text };
}

/** The four cells of the cancel matrix with this shift's sample amounts. */
export function cancelMatrix(shift: Shift, deposit: number) {
  const policy = shift.policy;
  const lost = Math.round((deposit * policy.techLateLossPct) / 100);
  const pay = Math.round((shift.pay * policy.salonLatePayPct) / 100);
  const hours = policy.freeCancelHours;
  return {
    hours,
    techFree: `Miễn phí, hoàn 100% cọc ($${deposit})`,
    techLate: `Mất ${policy.techLateLossPct}% cọc = $${lost} → tiệm; hoàn $${deposit - lost}; +1 huỷ muộn`,
    salonFree: "Miễn phí; thợ hoàn đủ cọc; tiệm nhận lại toàn bộ bảo đảm",
    salonLate: `Trả ${policy.salonLatePayPct}% công = $${pay} cho mỗi thợ đã chốt; thợ hoàn đủ cọc`,
  };
}

export type Reliability = { completed: number; absent: number; lateCancel: number };

export function reliabilityOf(person: Person | undefined, delta?: Reliability): Reliability {
  const base = person?.reliability ?? { completed: 0, absent: 0, lateCancel: 0 };
  return {
    completed: base.completed + (delta?.completed ?? 0),
    absent: base.absent + (delta?.absent ?? 0),
    lateCancel: base.lateCancel + (delta?.lateCancel ?? 0),
  };
}

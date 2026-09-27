export type ShiftKind = "party" | "busy" | "urgent";
export type ShiftMode = "instant" | "approval";
/** Stored lifecycle of a shift. "past" is derived from the demo clock, never stored. */
export type ShiftStatus = "open" | "full" | "cancelled";

/** Admin policy (SỐ MẪU). A copy is snapshotted onto every shift and every application. */
export interface ShiftPolicy {
  version: number;
  depositPct: number;
  freeCancelHours: number;
  techLateLossPct: number;
  noShowLossPct: number;
  salonLatePayPct: number;
  graceMinutes: number;
  updatedAt: string;
}

/** Contract 1: `id,title,salonId,startsAt,pay` are read by other modules (M05 chat card). */
export interface Shift {
  id: string;
  title: string;
  salonId: string;
  startsAt: string;
  pay: number;
  endsAt: string;
  status: ShiftStatus;
  kind: ShiftKind;
  mode: ShiftMode;
  services: string[];
  staffNeeded: number;
  tips: number;
  distanceMi: number;
  guarantee: number;
  policy: ShiftPolicy;
  postedAt: string;
}

export type ShiftApplicationStatus =
  | "invited"
  | "pending"
  | "locked"
  | "working"
  | "completed"
  | "absent"
  | "techCancelled"
  | "salonCancelled"
  | "rejected";

export interface ShiftApplication {
  id: string;
  shiftId: string;
  techId: string;
  status: ShiftApplicationStatus;
  /** Deposit held for this application (0 while only invited). */
  deposit: number;
  /** Policy snapshot recorded when the tech ticked the cancel/no-show agreement. */
  policy?: ShiftPolicy;
  agreedAt?: string;
  checkedInAt?: string;
  /** Money outcome in words, e.g. "Mất $20 cọc → tiệm". */
  note?: string;
  history: { status: ShiftApplicationStatus; at: string }[];
}

export interface TechAvailability {
  ready: boolean;
  days: string[];
  radius: 5 | 10 | 25;
}

export interface StaffShare {
  homeSalonId: string;
  consent: boolean;
  shared: boolean;
  day: string;
  asked?: boolean;
}

export interface ReliabilityDelta {
  completed: number;
  absent: number;
  lateCancel: number;
}

/** Extra M03 demo state. Optional because the shared seed index only merges the three base keys. */
export interface ShiftBoard {
  clock: string;
  availability: Record<string, TechAvailability>;
  share: Record<string, StaffShare>;
  reliability: Record<string, ReliabilityDelta>;
  policyHistory: ShiftPolicy[];
}

export interface M03State {
  shifts: Shift[];
  shiftApplications: ShiftApplication[];
  shiftPolicy: ShiftPolicy;
  shiftBoard?: ShiftBoard;
}

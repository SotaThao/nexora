export type Shift = { id: string; title: string; salonId: string; startsAt: string; pay: number; status: string; kind?: string; mode?: "instant" | "approval" };
export type ShiftApplication = { id: string; shiftId: string; techId: string; status: string };
export type ShiftPolicy = { checkInMinutesBefore: number; checkInMinutesAfter: number; techCancelHours: number; ownerCancelHours: number; lateCancelFee: number; noShowFee: number };
export type M03State = { shifts: Shift[]; shiftApplications: ShiftApplication[]; shiftPolicy: ShiftPolicy };

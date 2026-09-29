export enum BookingAssignmentIneligibleReason {
  NoSkill = 'NoSkill',
  OutsideSchedule = 'OutsideSchedule',
  SlotConflict = 'SlotConflict',
  StaffLocked = 'StaffLocked',
}

const REASON_I18N_KEY: Record<BookingAssignmentIneligibleReason, string> = {
  [BookingAssignmentIneligibleReason.NoSkill]: 'reasonNoSkill',
  [BookingAssignmentIneligibleReason.OutsideSchedule]: 'reasonOutsideSchedule',
  [BookingAssignmentIneligibleReason.SlotConflict]: 'reasonSlotConflict',
  [BookingAssignmentIneligibleReason.StaffLocked]: 'reasonStaffLocked',
}

export function bookingAssignmentIneligibleReasonKey(reason: string | null | undefined): string | null {
  return reason ? (REASON_I18N_KEY[reason as BookingAssignmentIneligibleReason] ?? null) : null
}

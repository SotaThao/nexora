/**
 * PosOrderStatus — matches backend Nexora.Domain.Enums.Pos.PosOrderStatus.
 * PosBooking (US-18) is a TPT-subtype of PosOrder, so Pending/Confirmed only ever
 * appear on bookings — Waiting/InService/Completed/Cancelled are shared by both.
 */
export enum PosOrderStatus {
  Waiting = 'Waiting',
  InService = 'InService',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  Pending = 'Pending',
  Confirmed = 'Confirmed',
}

export const POS_BOOKING_STATUS_OPTIONS = [
  PosOrderStatus.Pending,
  PosOrderStatus.Confirmed,
  PosOrderStatus.Waiting,
  PosOrderStatus.InService,
  PosOrderStatus.Completed,
  PosOrderStatus.Cancelled,
] as const

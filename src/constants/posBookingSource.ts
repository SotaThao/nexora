/**
 * PosBookingSource — matches backend Nexora.Domain.Enums.Pos.PosBookingSource.
 * Voice-sourced bookings (mirrored from a NexoraVoice VoiceLead via VoiceLeadConfirmedConsumer)
 * genuinely UTC-encode `scheduledAt` — a real local→UTC conversion happens when AI Hub creates
 * the appointment. Staff/Public-sourced bookings (POS's own NewBookingForm/reschedule flows)
 * encode `scheduledAt` as naive wall-clock (picked local numbers tagged with a fake UTC offset,
 * no real conversion — see feedback_frontend_datetime_timezone_naive). Booking display code must
 * branch on this field or a Voice-sourced appointment displays shifted by the browser's UTC offset.
 */
export enum PosBookingSource {
  Public = 'Public',
  Staff = 'Staff',
  Voice = 'Voice',
}

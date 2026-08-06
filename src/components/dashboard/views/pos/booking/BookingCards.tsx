// BookingCards — Ticket 9, card-grid view for the Booking tab (mobile-friendly alternative to
// BookingTable, same data/actions).
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { PosOrderStatus } from '../../../../../constants/posOrderStatus'
import type { BookingListItemApiDto } from '../../../../../types/repositories'
import { formatBookingWallClock, statusLabelKey } from './bookingFormatters'

export default function BookingCards({
  bookings,
  onCheckIn,
  onCancel,
  onReschedule,
  onViewDetail,
  checkingInId,
}: {
  bookings: BookingListItemApiDto[]
  onCheckIn: (bookingId: string) => void
  onCancel: (bookingId: string) => void
  onReschedule: (bookingId: string) => void
  onViewDetail: (bookingId: string) => void
  checkingInId: string | null
}) {
  const { t } = useTranslation()
  const p = 'components.dashboard.views.pos.BookingTab.'

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {bookings.map((booking) => {
        const canAct = booking.status === PosOrderStatus.Pending || booking.status === PosOrderStatus.Confirmed
        return (
          <div key={booking.bookingId} className="nexora-card space-y-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold text-nexoraText">{booking.customerName}</p>
              <span className="shrink-0 whitespace-nowrap rounded-full bg-nexoraCanvas px-2 py-0.5 text-[10px] font-bold text-nexoraText">
                {t(p + statusLabelKey(booking.status))}
              </span>
            </div>
            <p className="text-xs text-nexoraMuted">{formatBookingWallClock(booking.scheduledAt)}</p>
            <p className="text-[11px] text-nexoraMuted">
              {t(p + 'columnCreated')}: {formatBookingWallClock(booking.createdAt)}
            </p>
            <p className="text-xs text-nexoraMuted">{booking.serviceNames.join(', ')}</p>
            <p className="text-xs text-nexoraMuted">
              {booking.technicianNames.length > 0 ? booking.technicianNames.join(', ') : t(p + 'unassigned')}
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {canAct ? (
                <>
                  <button
                    type="button"
                    onClick={() => onCheckIn(booking.bookingId)}
                    disabled={checkingInId === booking.bookingId}
                    className="rounded-lg bg-nexoraBrand px-2 py-1 text-[11px] font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
                  >
                    {t(p + 'checkInAction')}
                  </button>
                  <button
                    type="button"
                    onClick={() => onReschedule(booking.bookingId)}
                    className="rounded-lg border border-nexoraBorder px-2 py-1 text-[11px] font-bold text-nexoraText hover:border-nexoraBrand"
                  >
                    {t(p + 'rescheduleAction')}
                  </button>
                  <button
                    type="button"
                    onClick={() => onCancel(booking.bookingId)}
                    className="rounded-lg border border-nexoraBorder px-2 py-1 text-[11px] font-bold text-nexoraText hover:border-rose-500 hover:text-rose-500"
                  >
                    {t(p + 'cancelAction')}
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={() => onViewDetail(booking.bookingId)}
                className="rounded-lg border border-nexoraBorder px-2 py-1 text-[11px] font-bold text-nexoraText hover:border-nexoraBrand"
              >
                {t(p + 'viewDetailAction')}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// BookingTable — Ticket 9, table view for the Booking tab.
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { PosOrderStatus } from '../../../../../constants/posOrderStatus'
import type { BookingListItemApiDto } from '../../../../../types/repositories'
import { formatBookingWallClock, statusLabelKey } from './bookingFormatters'
import { formatPosDateTime } from '../posDateTime'

export default function BookingTable({
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
  const { t, currentLanguage } = useTranslation()
  const p = 'components.dashboard.views.pos.BookingTab.'

  return (
    <div className="overflow-x-auto rounded-xl border border-nexoraBorder">
      <table className="w-full min-w-[720px] text-left text-xs">
        <thead>
          <tr className="border-b border-nexoraBorder bg-nexoraCanvas text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
            <th className="px-3 py-2">{t(p + 'columnCustomer')}</th>
            <th className="px-3 py-2">{t(p + 'columnCreated')}</th>
            <th className="px-3 py-2">{t(p + 'columnDateTime')}</th>
            <th className="px-3 py-2">{t(p + 'columnServices')}</th>
            <th className="px-3 py-2">{t(p + 'columnTechnician')}</th>
            <th className="px-3 py-2">{t(p + 'columnStatus')}</th>
            <th className="px-3 py-2">{t(p + 'columnActions')}</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => {
            const canAct = booking.status === PosOrderStatus.Pending || booking.status === PosOrderStatus.Confirmed
            return (
              <tr key={booking.bookingId} className="border-b border-nexoraBorder last:border-0">
                <td className="px-3 py-2 font-bold text-nexoraText">{booking.customerName}</td>
                <td className="px-3 py-2 text-nexoraMuted">{formatPosDateTime(booking.createdAt, currentLanguage)}</td>
                <td className="px-3 py-2 text-nexoraMuted">{formatBookingWallClock(booking.scheduledAt, booking.source)}</td>
                <td className="px-3 py-2 text-nexoraMuted">{booking.serviceNames.join(', ')}</td>
                <td className="px-3 py-2 text-nexoraMuted">
                  {booking.technicianNames.length > 0 ? booking.technicianNames.join(', ') : t(p + 'unassigned')}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <span className="whitespace-nowrap rounded-full bg-nexoraCanvas px-2 py-0.5 text-[10px] font-bold text-nexoraText">
                    {t(p + statusLabelKey(booking.status))}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1.5">
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
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

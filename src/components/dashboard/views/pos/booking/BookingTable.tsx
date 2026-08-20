// BookingTable — Ticket 9, table view for the Booking tab.
import { CalendarClock, Check, Eye, Loader2, X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { PosOrderStatus } from '../../../../../constants/posOrderStatus'
import type { BookingListItemApiDto } from '../../../../../types/repositories'
import { formatCustomerPhone } from '../customer/customerFormatters'
import {
  formatBookingHubDateDisplay,
  formatBookingHubDateTime,
  formatBookingHubTimeDisplay,
} from '../../bookingHubFormatters'
import { resolveBookingWallClockParts, statusLabelKey } from './bookingFormatters'

const STATUS_STYLES: Record<string, { row: string; badge: string }> = {
  [PosOrderStatus.Pending]: {
    row: 'bg-amber-50/30 hover:bg-amber-50/55',
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  [PosOrderStatus.Confirmed]: {
    row: 'bg-sky-50/25 hover:bg-sky-50/50',
    badge: 'border-sky-200 bg-sky-50 text-sky-700',
  },
  [PosOrderStatus.Waiting]: {
    row: 'bg-violet-50/25 hover:bg-violet-50/50',
    badge: 'border-violet-200 bg-violet-50 text-violet-700',
  },
  [PosOrderStatus.InService]: {
    row: 'bg-cyan-50/25 hover:bg-cyan-50/50',
    badge: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  },
  [PosOrderStatus.Completed]: {
    row: 'bg-emerald-50/25 hover:bg-emerald-50/50',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  [PosOrderStatus.Cancelled]: {
    row: 'bg-rose-50/25 hover:bg-rose-50/50',
    badge: 'border-rose-200 bg-rose-50 text-rose-600',
  },
}

const DEFAULT_STATUS_STYLE = {
  row: 'bg-white hover:bg-nexoraCanvas/70',
  badge: 'border-nexoraBorder bg-nexoraCanvas text-nexoraText',
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function formatAppointmentParts(iso: string, source: string, language: string) {
  const { year, month, day, hours, minutes } = resolveBookingWallClockParts(iso, source)
  const dateKey = `${year}-${pad(month)}-${pad(day)}`
  const timeKey = `${pad(hours)}:${pad(minutes)}`
  return {
    date: formatBookingHubDateDisplay(dateKey, language),
    time: formatBookingHubTimeDisplay(timeKey, language),
  }
}

function formatBookingPhone(phone?: string | null): string | null {
  if (!phone?.trim()) return null
  const formatted = formatCustomerPhone(phone)
  return formatted || phone
}

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
    <div className="overflow-x-auto rounded-2xl border border-nexoraBorder bg-white shadow-sm">
      <table className="w-full min-w-[980px] table-fixed text-left text-xs">
        <colgroup>
          <col className="w-[17%]" />
          <col className="w-[11%]" />
          <col className="w-[14%]" />
          <col className="w-[15%]" />
          <col className="w-[10%]" />
          <col className="w-[8%]" />
          <col className="w-[25%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-nexoraBorder bg-nexoraCanvas/70 text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
            <th className="px-4 py-3">{t(p + 'columnCustomer')}</th>
            <th className="px-4 py-3">{t(p + 'columnCreated')}</th>
            <th className="px-4 py-3">{t(p + 'columnDateTime')}</th>
            <th className="px-4 py-3">{t(p + 'columnServices')}</th>
            <th className="px-4 py-3">{t(p + 'columnTechnician')}</th>
            <th className="px-4 py-3">{t(p + 'columnStatus')}</th>
            <th className="px-4 py-3 text-right">{t(p + 'columnActions')}</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => {
            const canAct = booking.status === PosOrderStatus.Pending || booking.status === PosOrderStatus.Confirmed
            const statusStyle = STATUS_STYLES[booking.status] ?? DEFAULT_STATUS_STYLE
            const appointment = formatAppointmentParts(booking.scheduledAt, booking.source, currentLanguage)
            const phone = formatBookingPhone(booking.customerPhone)
            return (
              <tr
                key={booking.bookingId}
                data-status={booking.status}
                className={`border-b border-nexoraBorder/70 last:border-0 transition-colors ${statusStyle.row}`}
              >
                <td className="px-4 py-3 align-middle">
                  <div className="grid min-w-0 gap-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-extrabold text-nexoraText">{booking.customerName}</span>
                      {booking.orderNumber ? (
                        <span className="shrink-0 rounded-full border border-nexoraBorder bg-white px-1.5 py-0.5 text-[9px] font-bold text-nexoraMuted">
                          #{booking.orderNumber}
                        </span>
                      ) : null}
                    </div>
                    <span className="truncate text-[11px] font-semibold text-nexoraMuted">
                      {phone ?? '—'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 align-middle text-[11px] font-semibold leading-5 text-nexoraMuted">
                  {formatBookingHubDateTime(booking.createdAt, currentLanguage)}
                </td>
                <td className="px-4 py-3 align-middle">
                  <div className="grid gap-0.5 whitespace-nowrap">
                    <span className="font-extrabold text-nexoraText">{appointment.date}</span>
                    <span className="text-[11px] font-semibold text-nexoraMuted">{appointment.time}</span>
                  </div>
                </td>
                <td className="px-4 py-3 align-middle">
                  <div className="flex flex-wrap gap-1.5">
                    {booking.serviceNames.length > 0 ? (
                      booking.serviceNames.map((service) => (
                        <span
                          key={service}
                          className="inline-flex max-w-full items-center rounded-full border border-nexoraBrand/15 bg-white px-2 py-1 text-[11px] font-bold text-nexoraText"
                        >
                          <span className="truncate">{service}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-nexoraMuted">—</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 align-middle">
                  <span className="inline-flex max-w-full items-center rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-bold text-cyan-700">
                    <span className="truncate">
                      {booking.technicianNames.length > 0 ? booking.technicianNames.join(', ') : t(p + 'unassigned')}
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3 align-middle">
                  <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${statusStyle.badge}`}>
                    {t(p + statusLabelKey(booking.status))}
                  </span>
                </td>
                <td className="px-4 py-3 align-middle">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {canAct ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onCheckIn(booking.bookingId)}
                          disabled={checkingInId === booking.bookingId}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-[10px] font-extrabold text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {checkingInId === booking.bookingId ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                          <span>{t(p + 'checkInAction')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onReschedule(booking.bookingId)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2.5 text-[10px] font-extrabold text-sky-700 transition-colors hover:border-sky-300 hover:bg-sky-100"
                        >
                          <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{t(p + 'rescheduleAction')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onCancel(booking.bookingId)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-[10px] font-extrabold text-rose-600 transition-colors hover:border-rose-300 hover:bg-rose-100"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{t(p + 'cancelAction')}</span>
                        </button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onViewDetail(booking.bookingId)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 text-[10px] font-extrabold text-violet-700 transition-colors hover:border-violet-300 hover:bg-violet-100"
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{t(p + 'viewDetailAction')}</span>
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

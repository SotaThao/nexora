// BookingCards — production card-grid view for the Booking tab. It carries the same operational
// information and actions as BookingTable, arranged for touch-friendly tablet/mobile scanning.
import { CalendarClock, Check, Clock3, Eye, Loader2, Phone, UserRound, X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { PosOrderStatus } from '../../../../../constants/posOrderStatus'
import type { BookingListItemApiDto } from '../../../../../types/repositories'
import { formatCustomerPhone } from '../customer/customerFormatters'
import {
  formatBookingHubDateDisplay,
  formatBookingHubTimeDisplay,
} from '../../bookingHubFormatters'
import { resolveBookingWallClockParts, statusLabelKey } from './bookingFormatters'
import { formatPosDateTime } from '../posDateTime'

const STATUS_STYLES: Record<string, { card: string; badge: string }> = {
  [PosOrderStatus.Pending]: {
    card: 'border-l-amber-400 bg-amber-50/20',
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  [PosOrderStatus.Confirmed]: {
    card: 'border-l-sky-400 bg-sky-50/20',
    badge: 'border-sky-200 bg-sky-50 text-sky-700',
  },
  [PosOrderStatus.Waiting]: {
    card: 'border-l-violet-400 bg-violet-50/20',
    badge: 'border-violet-200 bg-violet-50 text-violet-700',
  },
  [PosOrderStatus.InService]: {
    card: 'border-l-cyan-400 bg-cyan-50/20',
    badge: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  },
  [PosOrderStatus.Completed]: {
    card: 'border-l-emerald-400 bg-emerald-50/20',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  [PosOrderStatus.Cancelled]: {
    card: 'border-l-rose-400 bg-rose-50/20',
    badge: 'border-rose-200 bg-rose-50 text-rose-600',
  },
}

const DEFAULT_STATUS_STYLE = {
  card: 'border-l-nexoraBorder bg-white',
  badge: 'border-nexoraBorder bg-nexoraCanvas text-nexoraText',
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function formatAppointmentParts(iso: string, source: string, language: string) {
  const { year, month, day, hours, minutes } = resolveBookingWallClockParts(iso, source)
  return {
    date: formatBookingHubDateDisplay(`${year}-${pad(month)}-${pad(day)}`, language),
    time: formatBookingHubTimeDisplay(`${pad(hours)}:${pad(minutes)}`, language),
  }
}

function formatBookingPhone(phone?: string | null, e164?: string | null): string | null {
  if (!phone?.trim() && !e164?.trim()) return null
  return formatCustomerPhone(phone, e164) || phone || e164 || null
}

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
  const { t, currentLanguage } = useTranslation()
  const p = 'components.dashboard.views.pos.BookingTab.'

  return (
    <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {bookings.map((booking) => {
        const canAct = booking.status === PosOrderStatus.Pending || booking.status === PosOrderStatus.Confirmed
        const isCheckingIn = checkingInId === booking.bookingId
        const statusStyle = STATUS_STYLES[booking.status] ?? DEFAULT_STATUS_STYLE
        const appointment = formatAppointmentParts(booking.scheduledAt, booking.source, currentLanguage)
        const phone = formatBookingPhone(booking.customerPhone, booking.customerPhoneE164)
        const appointmentLabel = `${appointment.date} ${appointment.time}`

        return (
          <article
            key={booking.bookingId}
            data-status={booking.status}
            aria-label={`${booking.customerName} · ${appointmentLabel}`}
            className={`flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-l-4 border-nexoraBorder shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${statusStyle.card}`}
          >
            <div className="flex flex-1 flex-col gap-4 p-4">
              <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h3 className="truncate text-[15px] font-extrabold text-nexoraText">
                      {booking.customerName}
                    </h3>
                    {booking.orderNumber ? (
                      <span className="shrink-0 rounded-full border border-nexoraBorder bg-white px-2 py-0.5 text-[10px] font-bold text-nexoraMuted">
                        #{booking.orderNumber}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] font-semibold text-nexoraMuted">
                    <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{phone ?? '—'}</span>
                  </div>
                </div>
                <span className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${statusStyle.badge}`}>
                  {t(p + statusLabelKey(booking.status))}
                </span>
              </header>

              <section className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl border border-nexoraBrand/10 bg-nexoraBrandSoft/45 p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-nexoraBrandDark shadow-sm">
                  <CalendarClock className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-wider text-nexoraMuted">
                    {t(p + 'columnDateTime')}
                  </p>
                  <p className="mt-0.5 truncate text-sm font-extrabold text-nexoraText">
                    {appointment.date}
                    <span className="ml-2 text-[12px]">{appointment.time}</span>
                  </p>
                </div>
              </section>

              <div className="grid gap-3">
                <section>
                  <div className="mb-1.5 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-nexoraMuted">
                    <span>{t(p + 'columnServices')}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {booking.serviceNames.length > 0 ? (
                      booking.serviceNames.map((service, index) => (
                        <span
                          key={`${service}-${index}`}
                          className="max-w-full truncate rounded-full border border-nexoraBrand/15 bg-white px-2.5 py-1 text-[11px] font-bold text-nexoraText"
                        >
                          {service}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-nexoraMuted">—</span>
                    )}
                  </div>
                </section>

                <section>
                  <div className="mb-1.5 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-nexoraMuted">
                    <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t(p + 'columnTechnician')}</span>
                  </div>
                  <span className="inline-flex max-w-full items-center rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-bold text-nexoraText">
                    <span className="truncate">
                      {booking.technicianNames.length > 0
                        ? booking.technicianNames.join(', ')
                        : t(p + 'unassigned')}
                    </span>
                  </span>
                </section>
              </div>

              <div className="mt-auto flex items-center gap-1.5 border-t border-nexoraBorder/70 pt-3 text-[10px] font-semibold text-nexoraMuted">
                <Clock3 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{t(p + 'columnCreated')}</span>
                <span className="truncate font-bold text-nexoraText">
                  {formatPosDateTime(booking.createdAt, currentLanguage)}
                </span>
              </div>
            </div>

            <div
              role="group"
              aria-label={t(p + 'columnActions')}
              className="flex flex-wrap gap-1.5 border-t border-nexoraBorder bg-white/80 p-3"
            >
              {canAct ? (
                <>
                  <button
                    type="button"
                    onClick={() => onCheckIn(booking.bookingId)}
                    disabled={isCheckingIn}
                    className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-nexoraBrand px-3 text-[11px] font-extrabold text-white transition-colors hover:bg-nexoraBrandDark disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCheckingIn ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    <span>{t(p + 'checkInAction')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onReschedule(booking.bookingId)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2.5 text-[10px] font-extrabold text-sky-700 transition-colors hover:bg-sky-100"
                  >
                    <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t(p + 'rescheduleAction')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onCancel(booking.bookingId)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-[10px] font-extrabold text-rose-600 transition-colors hover:bg-rose-100"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t(p + 'cancelAction')}</span>
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={() => onViewDetail(booking.bookingId)}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 text-[10px] font-extrabold text-violet-700 transition-colors hover:bg-violet-100"
              >
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t(p + 'viewDetailAction')}</span>
              </button>
            </div>
          </article>
        )
      })}
    </div>
  )
}

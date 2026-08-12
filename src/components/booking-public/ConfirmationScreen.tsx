// ConfirmationScreen — POS Booking public wizard, final step (Ticket 5). Summary,
// client-side .ics generation, and the Manage-Booking Link (destination page built in
// Ticket 8 at /booking/manage/:manageToken — the link itself is correct now, it just has
// nowhere to land until that ticket ships, same as any other incremental delivery here).
import { useState } from 'react'
import { CalendarPlus, Check, CheckCircle2, Clock, Copy } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { copyTextToClipboard } from '../../utils/clipboard'
import { PosOrderStatus } from '../../constants/posOrderStatus'

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

// All read via UTC getters, matching how `scheduledAt` was built (Date.UTC from the picked
// wall-clock numbers) — this feature has no genuine per-business timezone concept anywhere,
// so reading via local getters/toLocaleString would silently reintroduce a browser-timezone
// shift (see feedback_frontend_datetime_timezone_naive memory / the Ticket 3 bug).
function toIcsTimestamp(date: Date): string {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatWallClock(date: Date): string {
  const hours24 = date.getUTCHours()
  const period = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12
  return `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()} at ${hours12}:${pad(date.getUTCMinutes())} ${period}`
}

function downloadIcs(params: {
  bookingId: string
  businessName: string
  serviceNames: string[]
  start: Date
  durationMinutes: number
}) {
  const end = new Date(params.start.getTime() + params.durationMinutes * 60000)
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NexoraTouch//Booking//EN',
    'BEGIN:VEVENT',
    `UID:${params.bookingId}@nexoratouch`,
    `DTSTAMP:${toIcsTimestamp(new Date())}`,
    `DTSTART:${toIcsTimestamp(params.start)}`,
    `DTEND:${toIcsTimestamp(end)}`,
    `SUMMARY:${params.serviceNames.join(', ')} at ${params.businessName}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'appointment.ics'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function ConfirmationScreen({
  businessName,
  businessAddress,
  businessPhone,
  status,
  scheduledAt,
  durationMinutes,
  serviceNames,
  technicianNames,
  totalPrice,
  bookingId,
  manageToken,
  smsOptedOut = false,
  onDone,
}: {
  businessName: string
  businessAddress?: string | null
  businessPhone?: string | null
  status: string
  scheduledAt: Date
  durationMinutes: number
  serviceNames: string[]
  technicianNames: string[]
  totalPrice: number
  bookingId: string
  manageToken: string
  // True when the customer declined transactional SMS: no confirmation text will arrive, so this
  // link is their only way back to the booking and the screen has to say so.
  smsOptedOut?: boolean
  onDone: () => void
}) {
  const { t } = useTranslation()
  const [linkCopied, setLinkCopied] = useState(false)
  const isConfirmed = status === PosOrderStatus.Confirmed
  const manageUrl = `${window.location.origin}/booking/manage/${manageToken}`

  const handleCopyLink = async () => {
    try {
      await copyTextToClipboard(manageUrl)
      setLinkCopied(true)
      window.setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      // Clipboard access can fail silently (e.g. permissions) — the link is still visible/tappable below.
    }
  }

  return (
    <div className="space-y-4 text-center">
      <CheckCircle2 className={`mx-auto h-12 w-12 ${isConfirmed ? 'text-emerald-500' : 'text-amber-500'}`} />
      <div>
        <h2 className="text-base font-extrabold text-nexoraText">
          {isConfirmed ? t('public.booking.confirmedTitle') : t('public.booking.pendingTitle')}
        </h2>
        <p className="mt-1 text-xs text-nexoraMuted">
          {isConfirmed ? t('public.booking.confirmedDesc') : t('public.booking.pendingDesc')}
        </p>
      </div>

      <div className="rounded-xl border border-nexoraBorder p-4 text-left">
        <h3 className="mb-2 text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
          {t('public.booking.summaryTitle')}
        </h3>
        <p className="text-sm font-bold text-nexoraText">{businessName}</p>
        {businessAddress ? <p className="text-xs text-nexoraMuted">{businessAddress}</p> : null}
        {businessPhone ? <p className="text-xs text-nexoraMuted">{businessPhone}</p> : null}
        <p className="mt-2 text-xs text-nexoraMuted">{serviceNames.join(', ')}</p>
        {technicianNames.length > 0 ? (
          <p className="text-xs text-nexoraMuted">{t('public.booking.summaryTechnician')}: {technicianNames.join(', ')}</p>
        ) : null}
        <div className="mt-1 flex items-center gap-1 text-xs text-nexoraMuted">
          <Clock className="h-3.5 w-3.5" />
          {formatWallClock(scheduledAt)}
        </div>
        <p className="mt-1 text-sm font-bold text-nexoraText">
          {t('public.booking.summaryTotal')}: ${totalPrice.toFixed(2)}
        </p>
      </div>

      <button
        type="button"
        onClick={() => downloadIcs({ bookingId, businessName, serviceNames, start: scheduledAt, durationMinutes })}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-nexoraBorder text-xs font-bold text-nexoraText hover:border-nexoraBrand"
      >
        <CalendarPlus className="h-4 w-4" />
        {t('public.booking.addToCalendar')}
      </button>

      <div className="rounded-xl bg-nexoraCanvas p-4 text-left">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
          {t('public.booking.manageBookingTitle')}
        </h3>
        <p className="mt-1 text-xs text-nexoraMuted">{t('public.booking.manageBookingDesc')}</p>
        {smsOptedOut ? (
          <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] font-semibold text-amber-800">
            {t('public.smsConsent.noSmsNotice')}
          </p>
        ) : null}
        <a href={manageUrl} className="mt-2 block break-all text-xs font-semibold text-nexoraBrand underline">
          {manageUrl}
        </a>
        <button
          type="button"
          onClick={handleCopyLink}
          className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-nexoraMuted hover:text-nexoraBrand"
        >
          {linkCopied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              {t('public.booking.linkCopied')}
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              {t('public.booking.copyLink')}
            </>
          )}
        </button>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="h-10 w-full rounded-lg bg-nexoraBrand text-xs font-bold text-white hover:bg-nexoraBrandDark"
      >
        {t('public.booking.doneButton')}
      </button>
    </div>
  )
}

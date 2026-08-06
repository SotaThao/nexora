// ManageBookingPage — POS Booking, customer self-service (Ticket 8). Anonymous, resolved
// strictly by the ManageToken in the URL — no login. Lets the customer view their appointment
// and, while it's still Pending/Confirmed, cancel it or pick a new time (services/technician
// stay fixed — see POS-Booking-Business.md: "Opens Manage-Booking Link and cancels or picks a
// new time", unlike Staff's own edit which can also change services/technician).
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { useNotification } from '../../contexts/NotificationContext'
import {
  useCancelManageBooking,
  useManageBooking,
  useRescheduleManageBooking,
} from '../../data/hooks/usePublicBooking'
import { PosOrderStatus } from '../../constants/posOrderStatus'
import DateTimeStep from '../booking-public/DateTimeStep'

type ViewMode = 'view' | 'confirmCancel' | 'reschedule'

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// Read via UTC getters, matching ConfirmationScreen.tsx's formatWallClock — this feature has
// no genuine per-business timezone concept anywhere (see feedback_frontend_datetime_timezone_naive).
function formatWallClock(iso: string): string {
  const date = new Date(iso)
  const hours24 = date.getUTCHours()
  const period = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12
  return `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()} at ${hours12}:${pad(date.getUTCMinutes())} ${period}`
}

function Shell({ businessName, children }: { businessName?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-nexoraCanvas px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-4">
        {businessName ? <h1 className="text-lg font-extrabold text-nexoraText">{businessName}</h1> : null}
        <div className="nexora-card p-4">{children}</div>
      </div>
    </div>
  )
}

export default function ManageBookingPage() {
  const { manageToken } = useParams<{ manageToken: string }>()
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const { data, isLoading, isError } = useManageBooking(manageToken)
  const cancelMutation = useCancelManageBooking(manageToken)
  const rescheduleMutation = useRescheduleManageBooking(manageToken)
  const [mode, setMode] = useState<ViewMode>('view')

  if (isLoading) {
    return (
      <Shell>
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-nexoraBrand" />
        </div>
      </Shell>
    )
  }

  if (isError || !data) {
    return (
      <Shell>
        <div className="px-4 py-10 text-center">
          <p className="text-sm font-bold text-nexoraText">{t('public.manageBooking.notFoundTitle')}</p>
          <p className="mt-1 text-xs text-nexoraMuted">{t('public.manageBooking.notFoundDesc')}</p>
        </div>
      </Shell>
    )
  }

  const statusLabel =
    data.status === PosOrderStatus.Confirmed
      ? t('public.manageBooking.statusConfirmed')
      : data.status === PosOrderStatus.Pending
        ? t('public.manageBooking.statusPending')
        : data.status === PosOrderStatus.Cancelled
          ? t('public.manageBooking.statusCancelled')
          : t('public.manageBooking.statusOther')

  if (mode === 'reschedule') {
    return (
      <Shell businessName={data.businessName}>
        <DateTimeStep
          businessSlug={data.businessSlug}
          items={data.services.map((s) => ({ posServiceId: s.posServiceId, posStaffProfileId: s.posStaffProfileId ?? undefined }))}
          excludeBookingId={data.bookingId}
          onBack={() => setMode('view')}
          onContinue={(date, time) => {
            const [year, month, day] = date.split('-').map(Number)
            const [hour, minute] = time.split(':').map(Number)
            const scheduledAt = new Date(Date.UTC(year, month - 1, day, hour, minute)).toISOString()
            rescheduleMutation.mutate(
              { scheduledAt },
              {
                onSuccess: () => {
                  showToast(t('public.manageBooking.rescheduleSuccess'), 'success')
                  setMode('view')
                },
              },
            )
          }}
        />
      </Shell>
    )
  }

  return (
    <Shell businessName={data.businessName}>
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-extrabold text-nexoraText">{t('public.manageBooking.appointmentTitle')}</h2>
          <p className="mt-1 text-xs font-bold text-nexoraBrand">{statusLabel}</p>
        </div>

        <div className="rounded-xl border border-nexoraBorder p-4 text-left">
          <p className="text-sm font-bold text-nexoraText">{data.customerName}</p>
          {data.services.map((service) => (
            <p key={service.posServiceId} className="text-xs text-nexoraMuted">
              {service.serviceName}
              {service.technicianName ? ` — ${service.technicianName}` : ''}
            </p>
          ))}
          <p className="mt-1 text-xs text-nexoraMuted">{formatWallClock(data.scheduledAt)}</p>
        </div>

        {data.status === PosOrderStatus.Cancelled ? (
          <p className="text-center text-xs text-nexoraMuted">{t('public.manageBooking.cancelledNotice')}</p>
        ) : !data.canCancelOrReschedule ? (
          <p className="text-center text-xs text-nexoraMuted">{t('public.manageBooking.lockedNotice')}</p>
        ) : mode === 'confirmCancel' ? (
          <div className="rounded-xl bg-nexoraCanvas p-4 text-center">
            <p className="text-xs font-bold text-nexoraText">{t('public.manageBooking.cancelConfirmTitle')}</p>
            <p className="mt-1 text-xs text-nexoraMuted">{t('public.manageBooking.cancelConfirmDesc')}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setMode('view')}
                className="h-10 flex-1 rounded-lg border border-nexoraBorder text-xs font-bold text-nexoraText hover:border-nexoraBrand"
              >
                {t('public.manageBooking.cancelConfirmNo')}
              </button>
              <button
                type="button"
                onClick={() =>
                  cancelMutation.mutate(undefined, {
                    onSuccess: () => {
                      showToast(t('public.manageBooking.cancelSuccess'), 'success')
                      setMode('view')
                    },
                  })
                }
                disabled={cancelMutation.isPending}
                className="h-10 flex-1 rounded-lg bg-red-600 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {t('public.manageBooking.cancelConfirmYes')}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('confirmCancel')}
              className="h-10 flex-1 rounded-lg border border-nexoraBorder text-xs font-bold text-nexoraText hover:border-nexoraBrand"
            >
              {t('public.manageBooking.cancelButton')}
            </button>
            <button
              type="button"
              onClick={() => setMode('reschedule')}
              className="h-10 flex-1 rounded-lg bg-nexoraBrand text-xs font-bold text-white hover:bg-nexoraBrandDark"
            >
              {t('public.manageBooking.rescheduleButton')}
            </button>
          </div>
        )}
      </div>
    </Shell>
  )
}

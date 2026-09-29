import { useState } from 'react'
import { Check, Loader2, RefreshCw, UserRound } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { getApiErrorCode } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'
import { useAssignBookingServiceLineStaff, useUnassignedBookingAssignments } from '../../../../../data/hooks/usePosBooking'
import type { UnassignedBookingAssignmentApiDto } from '../../../../../types/repositories'
import { TOAST_SNACK_DURATION_MS } from '../../../../../constants/toast'
import { formatBookingWallClockTime } from './bookingFormatters'
import { formatTurnCredit } from '../TurnGridView'
import BookingAssignmentCandidatesDrawer from './BookingAssignmentCandidatesDrawer'

function technicianInitials(displayName: string): string {
  return displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export default function AnyoneAppointmentsQueue({
  businessId,
  dateFrom,
  dateTo,
}: {
  businessId: string
  dateFrom?: string
  dateTo?: string
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const p = 'components.dashboard.views.pos.AnyoneAppointmentsQueue.'

  const { data: queue, isLoading, isError, refetch } = useUnassignedBookingAssignments(businessId, { dateFrom, dateTo })
  const assignMutation = useAssignBookingServiceLineStaff(businessId)
  const [assigningLineId, setAssigningLineId] = useState<string | null>(null)
  const [candidatesTarget, setCandidatesTarget] = useState<UnassignedBookingAssignmentApiDto | null>(null)

  async function handleAssignSuggested(line: UnassignedBookingAssignmentApiDto) {
    if (!line.suggestedTechnician) return
    setAssigningLineId(line.serviceLineId)
    try {
      await assignMutation.mutateAsync({
        bookingId: line.bookingId,
        serviceLineId: line.serviceLineId,
        payload: { posStaffProfileId: line.suggestedTechnician.posStaffProfileId },
      })
      showToast(t(p + 'assignSuccess', { name: line.suggestedTechnician.displayName }), 'success', TOAST_SNACK_DURATION_MS)
    } catch (err: unknown) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err, 'ERROR'))), 'error')
    } finally {
      setAssigningLineId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="mb-4 flex items-center justify-center rounded-2xl border border-nexoraBorder bg-white p-6">
        <Loader2 className="h-5 w-5 animate-spin text-nexoraMuted" aria-hidden="true" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
        <p className="text-[12px] font-bold text-rose-700">{t(p + 'loadError')}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-[11px] font-bold text-rose-700 transition hover:bg-rose-100"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          {t(p + 'retryButton')}
        </button>
      </div>
    )
  }

  const lines = queue ?? []

  if (lines.length === 0) {
    return (
      <section className="mb-4 flex items-center justify-center gap-3 rounded-2xl border border-nexoraBorder bg-white px-4 py-6">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[12px] font-extrabold text-nexoraText">{t(p + 'emptyTitle')}</p>
          <p className="text-[10px] font-semibold text-nexoraMuted">{t(p + 'emptySubtitle')}</p>
        </div>
      </section>
    )
  }

  return (
    <section className="mb-4 overflow-hidden rounded-2xl border border-nexoraBorder bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-nexoraBorder px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-wider text-nexoraBrand">
            {t(p + 'eyebrow')}
          </p>
          <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-nexoraText">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-[13px] font-black text-amber-700">
              {lines.length}
            </span>
            {t(p + 'titleSuffix')}
          </h2>
          <p className="mt-1 text-[11px] font-semibold text-nexoraMuted">{t(p + 'subtitle')}</p>
        </div>
      </div>

      <ul className="divide-y divide-nexoraBorder overflow-x-auto">
        {lines.map((line) => {
          const timeLabel = formatBookingWallClockTime(line.scheduledAt, line.source)
          const isAssigning = assigningLineId === line.serviceLineId
          const tech = line.suggestedTechnician

          return (
            <li
              key={line.serviceLineId}
              className={`relative grid min-w-[680px] grid-cols-[85px_minmax(150px,1fr)_minmax(230px,1.5fr)_215px] items-center gap-3 px-4 py-3 ${
                line.isUrgent ? 'bg-amber-50/30' : ''
              }`}
            >
              {line.isUrgent && (
                <span className="absolute inset-y-0 left-0 w-1 bg-amber-400" aria-hidden="true" />
              )}
              <div>
                <p className="text-[13px] font-extrabold text-nexoraText">{timeLabel}</p>
                <p className="text-[10px] font-semibold text-nexoraMuted">
                  {t(p + 'durationMinutes', { count: line.durationMinutes })}
                </p>
              </div>

              <div className="min-w-0">
                <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black uppercase text-amber-700">
                  {t(p + 'anyoneBadge')}
                </span>
                <p className="mt-1 truncate text-[13px] font-bold text-nexoraText">{line.customerName}</p>
                <p className="truncate text-[11px] font-semibold text-nexoraMuted">
                  {line.serviceName}
                  {line.isUrgent ? ` · ${t(p + 'urgentBadge')}` : ''}
                </p>
              </div>

              <div className="flex min-w-0 items-center gap-2">
                {tech ? (
                  <>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-nexoraBrandSoft text-[11px] font-black text-nexoraBrandDark">
                      {technicianInitials(tech.displayName)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[9px] font-extrabold uppercase tracking-wide text-nexoraText">
                        {t(p + 'suggestedLabel')}
                      </p>
                      <p className="truncate text-[12px] font-extrabold text-nexoraText">
                        {tech.displayName}
                        {tech.staffLevelName ? ` · ${tech.staffLevelName}` : ''}
                      </p>
                      <p className="truncate text-[10px] font-semibold italic text-emerald-600">
                        {t(p + 'availableToday', {
                          turn: formatTurnCredit(tech.turnScore),
                          count: tech.bookedServiceLineCountToday,
                        })}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <UserRound className="h-4 w-4 shrink-0 text-nexoraMuted" aria-hidden="true" />
                    <p className="text-[11px] font-semibold text-nexoraMuted">{t(p + 'noSuggestion')}</p>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!tech || isAssigning}
                  onClick={() => handleAssignSuggested(line)}
                  className="flex items-center gap-1.5 rounded-xl bg-nexoraBrand px-3 py-2 text-[11px] font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isAssigning && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                  {tech ? t(p + 'assignButton', { name: tech.displayName }) : t(p + 'assignButtonDisabled')}
                </button>
                <button
                  type="button"
                  onClick={() => setCandidatesTarget(line)}
                  className="rounded-xl border border-nexoraBorder bg-white px-3 py-2 text-[11px] font-bold text-nexoraMuted transition hover:bg-nexoraCanvas"
                >
                  {t(p + 'viewOthersButton')}
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      {candidatesTarget && (
        <BookingAssignmentCandidatesDrawer
          businessId={businessId}
          line={candidatesTarget}
          onClose={() => setCandidatesTarget(null)}
          onAssigned={() => setCandidatesTarget(null)}
        />
      )}
    </section>
  )
}

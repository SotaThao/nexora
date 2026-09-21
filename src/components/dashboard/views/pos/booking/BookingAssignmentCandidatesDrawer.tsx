import { useState } from 'react'
import { Loader2, Sparkles, UserRound, X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { getApiErrorCode } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'
import IconButton from '../../../../ui/IconButton'
import { useAssignBookingServiceLineStaff, useBookingAssignmentCandidates } from '../../../../../data/hooks/usePosBooking'
import type { UnassignedBookingAssignmentApiDto } from '../../../../../types/repositories'
import { TOAST_SNACK_DURATION_MS } from '../../../../../constants/toast'
import { formatBookingWallClockTime } from './bookingFormatters'
import { formatTurnCredit } from '../TurnGridView'

function technicianInitials(displayName: string): string {
  return displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

const INELIGIBLE_REASON_KEY: Record<string, string> = {
  NoSkill: 'reasonNoSkill',
  OutsideSchedule: 'reasonOutsideSchedule',
  SlotConflict: 'reasonSlotConflict',
  StaffLocked: 'reasonStaffLocked',
}

export default function BookingAssignmentCandidatesDrawer({
  businessId,
  line,
  onClose,
  onAssigned,
}: {
  businessId: string
  line: UnassignedBookingAssignmentApiDto
  onClose: () => void
  onAssigned: () => void
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const p = 'components.dashboard.views.pos.AnyoneAppointmentsQueue.'

  const { data: candidates, isLoading } = useBookingAssignmentCandidates(businessId, line.bookingId, line.serviceLineId)
  const assignMutation = useAssignBookingServiceLineStaff(businessId)
  const [assigningId, setAssigningId] = useState<string | null>(null)

  async function handleSelect(posStaffProfileId: string, displayName: string) {
    setAssigningId(posStaffProfileId)
    try {
      await assignMutation.mutateAsync({
        bookingId: line.bookingId,
        serviceLineId: line.serviceLineId,
        payload: { posStaffProfileId },
      })
      showToast(t(p + 'assignSuccess', { name: displayName }), 'success', TOAST_SNACK_DURATION_MS)
      onAssigned()
    } catch (err: unknown) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err, 'ERROR'))), 'error')
    } finally {
      setAssigningId(null)
    }
  }

  const timeLabel = formatBookingWallClockTime(line.scheduledAt, line.source)

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-nexoraText/50" onClick={onClose} aria-hidden="true" />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-nexoraBorder p-5">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wide text-nexoraBrand">
              {t(p + 'candidatesEyebrow')}
            </p>
            <h2 className="mt-0.5 text-lg font-extrabold text-nexoraText">{t(p + 'candidatesHeading')}</h2>
            <p className="mt-0.5 truncate text-[12px] font-semibold text-nexoraMuted">
              {t(p + 'candidatesSubtitle', { time: timeLabel, name: line.customerName, service: line.serviceName })}
            </p>
          </div>
          <IconButton label={t(p + 'candidatesClose')} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-5">
          <div className="flex items-start gap-2 rounded-xl bg-nexoraBrandSoft/40 p-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-nexoraBrand" aria-hidden="true" />
            <div>
              <p className="text-[11px] font-extrabold text-nexoraText">{t(p + 'rankedRuleTitle')}</p>
              <p className="text-[10px] font-semibold text-nexoraMuted">{t(p + 'rankedRuleSubtitle')}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-nexoraMuted" aria-hidden="true" />
            </div>
          ) : (candidates ?? []).length === 0 ? (
            <p className="py-4 text-center text-xs font-semibold text-nexoraMuted">{t(p + 'noTechnicians')}</p>
          ) : (
            (candidates ?? []).map((candidate) => {
              const reasonKey = candidate.ineligibleReason ? INELIGIBLE_REASON_KEY[candidate.ineligibleReason] : null
              const isAssigning = assigningId === candidate.posStaffProfileId

              return (
                <button
                  key={candidate.posStaffProfileId}
                  type="button"
                  disabled={!candidate.isEligible || isAssigning}
                  onClick={() => handleSelect(candidate.posStaffProfileId, candidate.displayName)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                    candidate.isEligible
                      ? 'border-nexoraBorder bg-white hover:border-nexoraBrand hover:bg-nexoraBrandSoft/30'
                      : 'cursor-not-allowed border-nexoraBorder/60 bg-nexoraCanvas opacity-60'
                  }`}
                >
                  <span className="w-4 shrink-0 text-center text-[11px] font-semibold text-nexoraMuted">
                    {candidate.rank}
                  </span>
                  {candidate.isEligible ? (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-nexoraBrandSoft text-[11px] font-black text-nexoraBrandDark">
                      {technicianInitials(candidate.displayName)}
                    </span>
                  ) : (
                    <UserRound className="h-4 w-4 shrink-0 text-nexoraMuted" aria-hidden="true" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-extrabold text-nexoraText">
                      {candidate.displayName}
                      {candidate.staffLevelName ? ` · ${candidate.staffLevelName}` : ''}
                    </span>
                    <span className="block text-[10px] font-semibold text-nexoraMuted">
                      {candidate.isEligible ? t(p + 'qualifiedReason') : reasonKey ? t(p + reasonKey) : t(p + 'reasonUnknown')}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[12px] font-extrabold text-nexoraText">
                      {formatTurnCredit(candidate.turnScore)}
                    </span>
                    <span className="block text-[8px] font-semibold uppercase text-nexoraMuted">
                      {t(p + 'turnScoreLabel')}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-black uppercase ${
                      candidate.isEligible ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'
                    }`}
                  >
                    {candidate.isEligible ? t(p + 'eligiblePill') : t(p + 'ineligiblePill')}
                  </span>
                </button>
              )
            })
          )}
        </div>
      </aside>
    </div>
  )
}

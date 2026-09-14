// ReassignTechnicianModal — hands one service on an already checked-out ticket to a different
// technician (Reassign Technician on Completed Visits).
//
// Distinct from ChangeTechnicianModal, which edits an OPEN ticket and persists nothing itself:
// here the ticket is paid, so the confirmation moves real money (service revenue, the matching
// slice of the tip, any discount the technician absorbed) and the call is made from inside this
// dialog. Two things follow from that:
//   * the reason is mandatory — technicians are not notified, so it is the only explanation the
//     salon will have when a smaller paycheck is questioned weeks later;
//   * the already-paid-week warning is fetched when the dialog opens AND again once a technician
//     is picked, because the receiving technician may be the one whose week was paid. It never
//     blocks the confirmation: the salon settles the difference.
import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import IconButton from '../../../../ui/IconButton'
import {
  useReassignCompletedOrderServiceLineStaff,
  useReassignPayrollWarning,
  useReassignableStaff,
} from '../../../../../data/hooks/usePosOrders'

const K = 'components.dashboard.views.pos.ReassignTechnicianModal'

const REASON_MAX_LENGTH = 500

export interface ReassignTechnicianTarget {
  orderId: string
  serviceLineId: string
  serviceName: string
  currentTechnicianName?: string | null
}

// DateOnly strings ("2026-09-01") are wall-clock dates with no zone: parsed and formatted in UTC
// so a negative-offset browser does not render the week as starting a day earlier.
function formatWeekDate(dateStr: string, language: string) {
  const date = new Date(`${dateStr}T00:00:00Z`)
  const locale = String(language || 'en').toLowerCase().startsWith('vi') ? 'vi-VN' : 'en-US'
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date)
}

export default function ReassignTechnicianModal({
  businessId,
  target,
  onClose,
}: {
  businessId: string
  target: ReassignTechnicianTarget | null
  onClose: () => void
}) {
  const { t, currentLanguage } = useTranslation()
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [reason, setReason] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const orderId = target?.orderId
  const serviceLineId = target?.serviceLineId

  const { data: technicians, isLoading: isLoadingTechnicians } = useReassignableStaff(
    businessId,
    orderId,
    serviceLineId,
  )
  const { data: warning } = useReassignPayrollWarning(
    businessId,
    orderId,
    serviceLineId,
    selectedStaffId || undefined,
  )
  const reassign = useReassignCompletedOrderServiceLineStaff(businessId)

  // Reopening on another service must not inherit the previous line's pick or reason.
  useEffect(() => {
    setSelectedStaffId('')
    setReason('')
    setErrorMessage('')
  }, [serviceLineId])

  if (!target || !orderId || !serviceLineId) return null

  const trimmedReason = reason.trim()
  const canSubmit = Boolean(selectedStaffId) && trimmedReason !== '' && !reassign.isPending
  const paidStaffNames = (warning?.alreadyPaidStaff ?? []).map((staff) => staff.displayName).join(', ')

  const handleSubmit = async () => {
    if (!canSubmit) return
    setErrorMessage('')
    try {
      await reassign.mutateAsync({
        orderId,
        serviceLineId,
        newPosStaffProfileId: selectedStaffId,
        reason: trimmedReason,
      })
      onClose()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t(`${K}.genericError`))
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-md">
        <div className="mb-4 flex shrink-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-extrabold text-nexoraText">{t(`${K}.title`)}</h2>
            <p className="mt-0.5 truncate text-[11px] text-nexoraMuted">
              {t(`${K}.subtitle`, {
                serviceName: target.serviceName,
                technicianName: target.currentTechnicianName || t(`${K}.unassigned`),
              })}
            </p>
          </div>
          <IconButton label={t(`${K}.close`)} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-0.5">
          {warning && paidStaffNames !== '' ? (
            <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-800">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>
                {t(`${K}.payrollPaidWarning`, {
                  weekStart: formatWeekDate(warning.weekStart, currentLanguage),
                  weekEnd: formatWeekDate(warning.weekEnd, currentLanguage),
                  staffNames: paidStaffNames,
                })}
              </p>
            </div>
          ) : null}

          <div>
            <label
              htmlFor="reassign-technician-staff"
              className="mb-1 block text-[10px] font-black uppercase tracking-wide text-nexoraMuted"
            >
              {t(`${K}.technicianLabel`)}
            </label>
            {/* No "First available": a completed ticket can never hold a service with nobody
                credited for it, so the only valid move is to another technician. */}
            <select
              id="reassign-technician-staff"
              value={selectedStaffId}
              onChange={(event) => setSelectedStaffId(event.target.value)}
              disabled={isLoadingTechnicians || reassign.isPending}
              className="h-10 w-full rounded-lg border border-nexoraBorder bg-white px-2.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand disabled:opacity-60"
            >
              <option value="">
                {isLoadingTechnicians ? t(`${K}.loadingTechnicians`) : t(`${K}.technicianPlaceholder`)}
              </option>
              {(technicians ?? []).map((technician) => (
                <option key={technician.posStaffProfileId} value={technician.posStaffProfileId}>
                  {technician.displayName}
                </option>
              ))}
            </select>
            {!isLoadingTechnicians && (technicians ?? []).length === 0 ? (
              <p className="mt-1 text-[11px] text-nexoraMuted">{t(`${K}.noTechnicians`)}</p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="reassign-technician-reason"
              className="mb-1 block text-[10px] font-black uppercase tracking-wide text-nexoraMuted"
            >
              {t(`${K}.reasonLabel`)}
            </label>
            <textarea
              id="reassign-technician-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={REASON_MAX_LENGTH}
              rows={3}
              disabled={reassign.isPending}
              placeholder={t(`${K}.reasonPlaceholder`)}
              className="w-full rounded-lg border border-nexoraBorder bg-white px-2.5 py-2 text-xs text-nexoraText outline-none focus:border-nexoraBrand disabled:opacity-60"
            />
          </div>

          <p className="rounded-xl bg-nexoraCanvas p-2.5 text-[11px] text-nexoraMuted">
            {t(`${K}.moneyNotice`)}
          </p>

          {errorMessage ? (
            <p className="text-[11px] font-semibold text-rose-500">{errorMessage}</p>
          ) : null}
        </div>

        <div className="mt-4 flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={reassign.isPending}
            className="h-10 rounded-lg border border-nexoraBorder px-3 text-xs font-bold text-nexoraText hover:bg-nexoraCanvas disabled:opacity-60"
          >
            {t(`${K}.cancelButton`)}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="h-10 flex-1 rounded-lg bg-nexoraBrand text-xs font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
          >
            {reassign.isPending ? t(`${K}.savingButton`) : t(`${K}.confirmButton`)}
          </button>
        </div>
      </div>
    </div>
  )
}

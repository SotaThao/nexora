// Where a tech lands after scanning the salon's rotating clock-in QR with their phone camera.
// The link carries the salon id and the token; the session already proves who they are, which is
// the whole point of the two layers — signing in proves identity, the rotating code proves they
// are standing in the salon.
//
// Clocking out always needs an explicit confirmation (with hours so far) so a stray scan on the
// way past the front desk cannot silently end a shift.
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Clock, LogIn, LogOut } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { getApiErrorCode } from '../../../types/domain'
import { errorCodeToI18nKey, getErrorI18nKey } from '../../../data/errorCodes'
import { useClockScanPreview, useScanClockQr } from '../../../data/hooks/usePosTimeClock'
import { ScanClockAction } from '../../../constants/posClockSource'
import { formatPosTime } from '../../dashboard/views/pos/posDateTime'
import { formatHours } from '../../dashboard/views/pos/timeclock/timeClockDay'
import { SkeletonList } from '../../ui/skeleton'
import { tk } from '../../dashboard/views/pos/timeclock/timeClockI18n'

/** Resolve to an i18n key (not translated text) so language switches re-render correctly. */
function staffClockScanErrorKey(err: unknown): string {
  const i18nKey = getErrorI18nKey(getApiErrorCode(err, 'ERROR'))
  // Staff-facing copy for the same BE code merchant screens map to Worker Profile guidance.
  if (i18nKey === errorCodeToI18nKey.POS_STAFF_CLOCK_PROFILE_NOT_SET_UP) {
    return tk('scanProfileNotSetUp')
  }
  return i18nKey
}

export default function StaffClockScan() {
  const { t, currentLanguage } = useTranslation()
  const [searchParams] = useSearchParams()
  const businessId = searchParams.get('b') ?? ''
  const token = searchParams.get('t') ?? ''

  const { data: preview, isLoading, error: previewError } = useClockScanPreview(businessId, token)
  const scan = useScanClockQr()
  const [result, setResult] = useState<{ action: string; hours: number; occurredAt: string } | null>(null)
  const [actionErrorKey, setActionErrorKey] = useState<string | null>(null)

  const handleScan = async () => {
    setActionErrorKey(null)
    try {
      const response = await scan.mutateAsync({ businessId, token })
      setResult({ action: response.action, hours: response.hours, occurredAt: response.occurredAt })
    } catch (err: unknown) {
      setActionErrorKey(staffClockScanErrorKey(err))
    }
  }

  const renderError = (message: string) => (
    <div className="flex items-start gap-2 rounded-xl border border-nexoraBorder bg-nexoraSurface p-4">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-nexoraDanger" />
      <p className="text-sm font-bold text-nexoraText">{message}</p>
    </div>
  )

  if (!businessId || !token) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-4">
        {renderError(t(tk('scanMissingToken')))}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <h1 className="flex items-center gap-2 text-xl font-black text-nexoraText">
        <Clock className="h-5 w-5 text-nexoraBrand" />
        {t(tk('scanTitle'))}
      </h1>

      {isLoading ? (
        <div className="rounded-xl border border-nexoraBorder bg-nexoraSurface p-6">
          <SkeletonList count={2} lines={2} />
        </div>
      ) : previewError ? (
        renderError(t(staffClockScanErrorKey(previewError)))
      ) : result ? (
        <div className="space-y-2 rounded-xl border border-nexoraBorder bg-nexoraSurface p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-nexoraText">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            {result.action === ScanClockAction.ClockedIn
              ? t(tk('scanClockedIn'), {
                  time: formatPosTime(result.occurredAt, currentLanguage),
                })
              : t(tk('scanClockedOut'), {
                  time: formatPosTime(result.occurredAt, currentLanguage),
                  hours: formatHours(result.hours),
                })}
          </p>
          <p className="text-xs text-nexoraMuted">{preview?.businessName}</p>
        </div>
      ) : preview ? (
        <div className="space-y-4 rounded-xl border border-nexoraBorder bg-nexoraSurface p-4">
          <div>
            <p className="text-sm font-bold text-nexoraText">{preview.businessName}</p>
            <p className="text-xs text-nexoraMuted">{preview.displayName}</p>
          </div>

          <p className="text-sm text-nexoraText">
            {preview.isClockedIn
              ? t(tk('scanConfirmClockOut'), {
                  hours: formatHours(preview.hoursSoFar),
                })
              : t(tk('scanConfirmClockIn'))}
          </p>

          {actionErrorKey ? (
            <p className="text-xs font-bold text-nexoraDanger">{t(actionErrorKey)}</p>
          ) : null}

          <button
            type="button"
            onClick={handleScan}
            disabled={scan.isPending}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-nexoraBrand text-sm font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
          >
            {preview.isClockedIn ? <LogOut className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
            {preview.isClockedIn
              ? t(tk('clockOut'))
              : t(tk('clockIn'))}
          </button>
        </div>
      ) : null}
    </div>
  )
}

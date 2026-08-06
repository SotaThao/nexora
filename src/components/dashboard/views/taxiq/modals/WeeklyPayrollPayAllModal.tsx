import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { usePayAllWeeklyPayroll } from '../../../../../data/hooks/useWeeklyPayroll'
import type { PayAllWeeklyPayrollResult } from '../../../../../data/repositories/weeklyPayroll'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'
import type { TFunction } from '../../../../../types/contexts'
import { formatCurrency } from '../../../utils'

interface Props {
  businessId: string
  amount: number
  weekStart?: string
  onClose: () => void
}

function translateSkipReason(reason: string, t: TFunction) {
  const statusKey = `taxiq.weeklyPayroll.status.${reason}`
  const statusTranslated = t(statusKey)
  if (statusTranslated !== statusKey) return statusTranslated

  const errorKey = getErrorI18nKey(reason)
  const errorTranslated = t(errorKey)
  return errorTranslated !== errorKey ? errorTranslated : reason
}

export default function WeeklyPayrollPayAllModal({ businessId, amount, weekStart, onClose }: Props) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const payAllWeeklyPayroll = usePayAllWeeklyPayroll(businessId)

  const [proofUrl, setProofUrl] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState<PayAllWeeklyPayrollResult | null>(null)

  const handleConfirm = async () => {
    if (payAllWeeklyPayroll.isPending) return
    setError('')
    try {
      const res = await payAllWeeklyPayroll.mutateAsync({
        weekStart,
        evidenceUrls: proofUrl.trim() ? [proofUrl.trim()] : null,
      })
      setResult(res)
      showToast(t('taxiq.weeklyPayroll.savedNotice'), 'success')
    } catch (err) {
      const fallback = t('taxiq.weeklyPayroll.errors.generic')
      let message = fallback
      if (isApiError(err)) {
        const i18nKey = getErrorI18nKey(err.errorCode)
        const translated = t(i18nKey)
        message = translated !== i18nKey ? translated : (err.message || fallback)
      }
      setError(message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-nexoraText">{t('taxiq.weeklyPayroll.payAllModal.title')}</h2>
          <IconButton label={t('common.cancel')} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        {result ? (
          <div className="flex-1 space-y-3 overflow-y-auto text-xs">
            <p className="font-semibold text-nexoraText">
              {t('taxiq.weeklyPayroll.payAllModal.resultPaid', { count: result.paidCount, amount: formatCurrency(result.totalPaid) })}
            </p>
            {result.skipped.length > 0 && (
              <div className="rounded-lg bg-nexoraCanvas p-3">
                <div className="mb-1 font-bold text-nexoraMuted">{t('taxiq.weeklyPayroll.payAllModal.resultSkipped')}</div>
                <ul className="space-y-1">
                  {result.skipped.map((s) => (
                    <li key={s.businessStaffLinkId} className="flex justify-between">
                      <span className="text-nexoraText">{s.displayName}</span>
                      <span className="text-nexoraMuted">{translateSkipReason(s.reason, t)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto">
            <p className="text-xs font-semibold text-nexoraText">
              {t('taxiq.weeklyPayroll.payAllModal.confirmMessage', { amount: formatCurrency(amount) })}
            </p>
            <div>
              <label className="mb-1 block text-xs font-bold text-nexoraMuted">{t('taxiq.weeklyPayroll.payAllModal.proofLabel')}</label>
              <input
                type="text"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                placeholder={t('taxiq.weeklyPayroll.payModal.proofPlaceholder')}
                className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs"
              />
            </div>
            {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted">
            {result ? t('common.close') : t('common.cancel')}
          </button>
          {!result && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={payAllWeeklyPayroll.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              {payAllWeeklyPayroll.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t('taxiq.weeklyPayroll.payAllModal.confirmButton')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

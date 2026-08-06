import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { usePayWeeklyPayroll } from '../../../../../data/hooks/useWeeklyPayroll'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'
import { formatCurrency } from '../../../utils'

interface Props {
  businessId: string
  businessStaffLinkId: string
  displayName: string
  amount: number
  canOverride: boolean
  weekStart?: string
  onClose: () => void
}

export default function WeeklyPayrollPayModal({ businessId, businessStaffLinkId, displayName, amount, canOverride, weekStart, onClose }: Props) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const payWeeklyPayroll = usePayWeeklyPayroll(businessId)

  const [proofUrl, setProofUrl] = useState('')
  const [overrideNote, setOverrideNote] = useState('')
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    if (payWeeklyPayroll.isPending) return
    setError('')
    try {
      await payWeeklyPayroll.mutateAsync({
        businessStaffLinkId,
        weekStart,
        evidenceUrls: proofUrl.trim() ? [proofUrl.trim()] : null,
        overrideNote: overrideNote.trim() || null,
      })
      showToast(t('taxiq.weeklyPayroll.savedNotice'), 'success')
      onClose()
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
          <h2 className="text-sm font-extrabold text-nexoraText">{t('taxiq.weeklyPayroll.payModal.title', { name: displayName })}</h2>
          <IconButton label={t('common.cancel')} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto">
          <div className="rounded-lg bg-nexoraCanvas px-3 py-2">
            <div className="text-[10px] font-bold uppercase text-nexoraMuted">{t('taxiq.weeklyPayroll.payModal.amountLabel')}</div>
            <div className="text-lg font-extrabold text-nexoraText">{formatCurrency(amount)}</div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">{t('taxiq.weeklyPayroll.payModal.proofLabel')}</label>
            <input
              type="text"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder={t('taxiq.weeklyPayroll.payModal.proofPlaceholder')}
              className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs"
            />
            <p className="mt-1 text-[11px] text-nexoraMuted">{t('taxiq.weeklyPayroll.payModal.proofHint')}</p>
          </div>

          {canOverride && (
            <div>
              <label className="mb-1 block text-xs font-bold text-nexoraMuted">{t('taxiq.weeklyPayroll.payModal.overrideLabel')}</label>
              <textarea
                value={overrideNote}
                onChange={(e) => setOverrideNote(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs"
              />
              <p className="mt-1 text-[11px] text-nexoraMuted">{t('taxiq.weeklyPayroll.payModal.overrideHint')}</p>
            </div>
          )}

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted">
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={payWeeklyPayroll.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {payWeeklyPayroll.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('taxiq.weeklyPayroll.payModal.confirmButton')}
          </button>
        </div>
      </div>
    </div>
  )
}

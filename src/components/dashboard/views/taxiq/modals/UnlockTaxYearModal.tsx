import { useState } from 'react'
import { X, Loader2, AlertTriangle } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import Tooltip from '../../../../ui/Tooltip'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useUnlockOwnerTaxYear } from '../../../../../data/hooks/useTaxiqOwnerTaxYearLock'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'

export default function UnlockTaxYearModal({
  open,
  onClose,
  ownerTaxYearId,
}: {
  open: boolean
  onClose: () => void
  ownerTaxYearId: string
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const unlockTaxYear = useUnlockOwnerTaxYear()

  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  if (!open) return null

  const canSubmit = reason.trim().length > 0

  const handleClose = () => {
    setReason('')
    setError('')
    onClose()
  }

  const handleSubmit = async () => {
    if (!canSubmit || unlockTaxYear.isPending) return
    setError('')
    try {
      await unlockTaxYear.mutateAsync({ ownerTaxYearId, reason: reason.trim() })
      showToast(t('taxiq.unlockTaxYear.success'), 'success')
      handleClose()
    } catch (err) {
      const fallback = t('taxiq.unlockTaxYear.errors.generic')
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
          <h2 className="text-sm font-extrabold text-nexoraText">
            <span className="inline-flex items-center gap-1">
              {t('taxiq.unlockTaxYear.modalTitle')}
              <Tooltip content={t('taxiq.yearEndExport.tooltips.unlockTaxYear')} />
            </span>
          </h2>
          <IconButton label={t('common.cancel')} onClick={handleClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto">
          <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
            <div className="flex items-start gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {t('taxiq.unlockTaxYear.warning')}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">
              {t('taxiq.unlockTaxYear.reasonLabel')}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={t('taxiq.unlockTaxYear.reasonPlaceholder')}
              className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || unlockTaxYear.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {unlockTaxYear.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('taxiq.unlockTaxYear.confirmButton')}
          </button>
        </div>
      </div>
    </div>
  )
}

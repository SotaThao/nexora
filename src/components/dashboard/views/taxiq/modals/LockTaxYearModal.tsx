import { useState } from 'react'
import { X, Loader2, AlertTriangle } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useLockOwnerTaxYear } from '../../../../../data/hooks/useTaxiqOwnerTaxYearLock'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'

export default function LockTaxYearModal({
  open,
  onClose,
  ownerTaxYearId,
  requireOverrideNote,
}: {
  open: boolean
  onClose: () => void
  ownerTaxYearId: string
  // True when the only remaining High Priority item type is "PayoutDispute"
  // (AC: allow Lock with a mandatory override note in that single case).
  requireOverrideNote: boolean
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const lockTaxYear = useLockOwnerTaxYear()

  const [overrideNote, setOverrideNote] = useState('')
  const [error, setError] = useState('')

  if (!open) return null

  const canSubmit = !requireOverrideNote || overrideNote.trim().length > 0

  const handleClose = () => {
    setOverrideNote('')
    setError('')
    onClose()
  }

  const handleSubmit = async () => {
    if (!canSubmit || lockTaxYear.isPending) return
    setError('')
    try {
      await lockTaxYear.mutateAsync({
        ownerTaxYearId,
        overrideNote: requireOverrideNote ? overrideNote.trim() : undefined,
      })
      showToast(t('taxiq.lockTaxYear.success'), 'success')
      handleClose()
    } catch (err) {
      const fallback = t('taxiq.lockTaxYear.errors.generic')
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
          <h2 className="text-sm font-extrabold text-nexoraText">{t('taxiq.lockTaxYear.modalTitle')}</h2>
          <IconButton label={t('common.cancel')} onClick={handleClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto">
          <p className="text-xs text-nexoraMuted">{t('taxiq.lockTaxYear.modalDescription')}</p>

          {requireOverrideNote && (
            <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
              <div className="flex items-start gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {t('taxiq.lockTaxYear.overrideWarning')}
              </div>
              <textarea
                value={overrideNote}
                onChange={(e) => setOverrideNote(e.target.value)}
                rows={3}
                placeholder={t('taxiq.lockTaxYear.overrideNotePlaceholder')}
                className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
              />
            </div>
          )}

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
            disabled={!canSubmit || lockTaxYear.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {lockTaxYear.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('taxiq.lockTaxYear.confirmButton')}
          </button>
        </div>
      </div>
    </div>
  )
}

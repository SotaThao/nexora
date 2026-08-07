import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useCancelPayrollRun } from '../../../../../data/hooks/usePayrollRuns'
import type { PayrollRun } from '../../../../../data/repositories/payrollRuns'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'

interface Props {
  businessId: string
  run: PayrollRun
  onClose: () => void
  onCancelled: () => void
}

export default function CancelPayrollRunModal({ businessId, run, onClose, onCancelled }: Props) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const cancelPayrollRun = useCancelPayrollRun(businessId)

  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    if (cancelPayrollRun.isPending) return
    setError('')
    try {
      await cancelPayrollRun.mutateAsync({ id: run.id, cancelReason: reason.trim() })
      showToast(t('taxiq.payrollRuns.savedNotice'), 'success')
      onCancelled()
    } catch (err) {
      const fallback = t('taxiq.payrollRuns.errors.generic')
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-nexoraText">{t('taxiq.payrollRuns.cancelModal.title', { runCode: run.runCode })}</h2>
          <IconButton label={t('common.cancel')} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto">
          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">{t('taxiq.payrollRuns.cancelModal.reasonLabel')}</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('taxiq.payrollRuns.cancelModal.reasonPlaceholder')}
              rows={3}
              className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs"
            />
          </div>

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted">
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={cancelPayrollRun.isPending || !reason.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {cancelPayrollRun.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('taxiq.payrollRuns.cancelModal.confirmButton')}
          </button>
        </div>
      </div>
    </div>
  )
}

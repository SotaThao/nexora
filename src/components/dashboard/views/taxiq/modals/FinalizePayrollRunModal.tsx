import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useFinalizePayrollRun } from '../../../../../data/hooks/usePayrollRuns'
import type { PayrollRun } from '../../../../../data/repositories/payrollRuns'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'
import { formatCurrency } from '../../../utils'

interface Props {
  businessId: string
  run: PayrollRun
  onClose: () => void
}

export default function FinalizePayrollRunModal({ businessId, run, onClose }: Props) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const finalizePayrollRun = useFinalizePayrollRun(businessId)

  const [approvalNote, setApprovalNote] = useState('')
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    if (finalizePayrollRun.isPending) return
    setError('')
    try {
      await finalizePayrollRun.mutateAsync({ id: run.id, approvalNote: approvalNote.trim() })
      showToast(t('taxiq.payrollRuns.savedNotice'), 'success')
      onClose()
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-nexoraText">{t('taxiq.payrollRuns.finalizeModal.title', { runCode: run.runCode })}</h2>
          <IconButton label={t('common.cancel')} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto">
          <div className="rounded-lg bg-nexoraCanvas px-3 py-2">
            <div className="mb-1 text-[10px] font-bold uppercase text-nexoraMuted">{t('taxiq.payrollRuns.finalizeModal.postingPreview')}</div>
            <div className="flex justify-between text-xs">
              <span className="text-nexoraMuted">{t('taxiq.payrollRuns.finalizeModal.grossWages')}</span>
              <span className="font-bold text-nexoraText">{formatCurrency(run.totalGross)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-nexoraMuted">{t('taxiq.payrollRuns.finalizeModal.employeeTax')}</span>
              <span className="font-bold text-nexoraText">{formatCurrency(run.totalEmployeeTax)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-nexoraMuted">{t('taxiq.payrollRuns.finalizeModal.employerTax')}</span>
              <span className="font-bold text-nexoraText">{formatCurrency(run.totalEmployerTax)}</span>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">{t('taxiq.payrollRuns.finalizeModal.approvalNoteLabel')}</label>
            <textarea
              value={approvalNote}
              onChange={(e) => setApprovalNote(e.target.value)}
              placeholder={t('taxiq.payrollRuns.finalizeModal.approvalNotePlaceholder')}
              rows={3}
              className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs"
            />
          </div>

          {run.status === 'ReviewRequired' && (
            <p className="text-[11px] font-semibold text-amber-600">{t('taxiq.payrollRuns.finalizeModal.warningNeedsReview')}</p>
          )}
          <p className="text-[11px] text-nexoraMuted">{t('taxiq.payrollRuns.finalizeModal.irreversibleHint')}</p>

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted">
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={finalizePayrollRun.isPending || !approvalNote.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {finalizePayrollRun.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('taxiq.payrollRuns.finalizeModal.confirmButton')}
          </button>
        </div>
      </div>
    </div>
  )
}

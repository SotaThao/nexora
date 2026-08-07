import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useDeleteTipLedgerEntry } from '../../../../../data/hooks/useTaxiqTipLedger'
import type { TipLedgerEntry } from '../../../../../data/repositories/taxiqTipLedger'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'

export default function DeleteTipModal({
  open,
  onClose,
  entry,
  staffTaxYearId,
}: {
  open: boolean
  onClose: () => void
  entry: TipLedgerEntry
  staffTaxYearId: string
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const deleteTip = useDeleteTipLedgerEntry(staffTaxYearId)

  const [deleteReason, setDeleteReason] = useState('')
  const [error, setError] = useState('')

  if (!open) return null

  const handleClose = () => {
    setDeleteReason('')
    setError('')
    onClose()
  }

  const handleConfirm = async () => {
    if (!deleteReason.trim()) {
      setError(t('taxiq.tipLedger.form.deleteReasonRequired'))
      return
    }
    try {
      await deleteTip.mutateAsync({ id: entry.id, deleteReason: deleteReason.trim() })
      showToast(t('taxiq.tipLedger.form.deleteSuccess'), 'success')
      handleClose()
    } catch (err) {
      const fallback = t('taxiq.tipLedger.errors.generic')
      const message = isApiError(err)
        ? (() => {
            const i18nKey = getErrorI18nKey(err.errorCode)
            const translated = t(i18nKey)
            return translated !== i18nKey ? translated : (err.message || fallback)
          })()
        : fallback
      setError(message)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-nexoraText">{t('taxiq.tipLedger.actions.delete')}</h2>
          <IconButton label={t('common.cancel')} onClick={handleClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto">
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
            {t('taxiq.tipLedger.form.deleteSoftNotice')}
          </div>

          <div>
            <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.tipLedger.form.deleteReasonLabel')}</label>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={handleClose} className="rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted">
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleteTip.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {deleteTip.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('taxiq.tipLedger.actions.delete')}
          </button>
        </div>
      </div>
    </div>
  )
}

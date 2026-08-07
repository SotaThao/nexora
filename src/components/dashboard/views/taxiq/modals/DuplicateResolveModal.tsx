import { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useResolveTaxiqReceiptDuplicate } from '../../../../../data/hooks/useTaxiqReceipts'
import type { DuplicateResolution, ReceiptVaultItem } from '../../../../../data/repositories/taxiqReceipts'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'

const RESOLUTIONS: DuplicateResolution[] = ['Kept', 'Merged', 'Deleted']

// DR-CORE-008: duplicate receipts must be resolved via Keep Both / Merge / Delete Duplicate.
export default function DuplicateResolveModal({
  open,
  onClose,
  receipt,
  otherReceipts,
}: {
  open: boolean
  onClose: () => void
  receipt: ReceiptVaultItem
  otherReceipts: ReceiptVaultItem[]
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const resolveDuplicate = useResolveTaxiqReceiptDuplicate()

  const [resolution, setResolution] = useState<DuplicateResolution>('Kept')
  const [mergeTargetReceiptId, setMergeTargetReceiptId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setResolution('Kept')
    setMergeTargetReceiptId('')
    setError('')
  }, [open, receipt.id])

  if (!open) return null

  const canSubmit = resolution !== 'Merged' || mergeTargetReceiptId.length > 0

  const handleClose = () => {
    setError('')
    onClose()
  }

  const handleSubmit = async () => {
    if (!canSubmit || resolveDuplicate.isPending) return
    setError('')
    try {
      await resolveDuplicate.mutateAsync({
        receiptId: receipt.id,
        resolution,
        mergeTargetReceiptId: resolution === 'Merged' ? mergeTargetReceiptId : undefined,
      })
      showToast(t('taxiq.receiptVault.duplicateModal.success'), 'success')
      handleClose()
    } catch (err) {
      const fallback = t('taxiq.receiptVault.duplicateModal.errors.generic')
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
          <h2 className="text-sm font-extrabold text-nexoraText">{t('taxiq.receiptVault.duplicateModal.title')}</h2>
          <IconButton label={t('common.cancel')} onClick={handleClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto">
          <div className="nexora-card p-3">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-nexoraMuted">
              {receipt.fileName}
            </div>
            <div className="mt-1 text-[11px] text-nexoraMuted">
              {receipt.aiExtractedVendor ?? '—'} · {receipt.aiExtractedDate ?? '—'}
            </div>
          </div>

          <div>
            <div className="flex flex-wrap gap-2">
              {RESOLUTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setResolution(option)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
                    resolution === option
                      ? 'border-nexoraBrand bg-nexoraBrand text-white'
                      : 'border-nexoraBorder text-nexoraText'
                  }`}
                >
                  {t(`taxiq.receiptVault.duplicateModal.${option === 'Kept' ? 'keepBoth' : option === 'Merged' ? 'merge' : 'delete'}`)}
                </button>
              ))}
            </div>
          </div>

          {resolution === 'Merged' && (
            <div>
              <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                {t('taxiq.receiptVault.duplicateModal.mergeTargetLabel')}
              </label>
              <select
                value={mergeTargetReceiptId}
                onChange={(e) => setMergeTargetReceiptId(e.target.value)}
                className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {otherReceipts.map((r) => (
                  <option key={r.id} value={r.id}>{r.fileName}</option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={handleClose} className="rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted">
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || resolveDuplicate.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {resolveDuplicate.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('taxiq.receiptVault.duplicateModal.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}

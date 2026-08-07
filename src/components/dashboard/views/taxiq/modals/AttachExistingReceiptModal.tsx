import { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useLinkTaxiqReceiptToDeduction, useTaxiqReceipts } from '../../../../../data/hooks/useTaxiqReceipts'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'
import { SkeletonList } from '../../../../ui/skeleton'

// US-05 AC: "Link receipt vào deduction có sẵn (từ danh sách Deduction Center) qua
// action 'Attach existing receipt'" — only Standalone, non-duplicate receipts are
// eligible (duplicates must be resolved from the Vault first).
export default function AttachExistingReceiptModal({
  open,
  onClose,
  ownerTaxYearId,
  staffTaxYearId,
  deductionRecordId,
}: {
  open: boolean
  onClose: () => void
  ownerTaxYearId?: string
  staffTaxYearId?: string
  deductionRecordId: string
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const listQuery = useTaxiqReceipts(open ? { ownerTaxYearId, staffTaxYearId } : undefined)
  const linkToDeduction = useLinkTaxiqReceiptToDeduction()

  const [selectedReceiptId, setSelectedReceiptId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setSelectedReceiptId('')
    setError('')
  }, [open, deductionRecordId])

  if (!open) return null

  const eligibleReceipts = (listQuery.data ?? []).filter(
    (r) => r.linkedEntityType === 'Standalone' && !r.isDuplicate,
  )

  const handleClose = () => {
    setError('')
    onClose()
  }

  const handleSubmit = async () => {
    if (!selectedReceiptId || linkToDeduction.isPending) return
    setError('')
    try {
      await linkToDeduction.mutateAsync({ receiptId: selectedReceiptId, deductionRecordId })
      showToast(t('taxiq.receiptVault.attachExistingModal.success'), 'success')
      handleClose()
    } catch (err) {
      const fallback = t('taxiq.receiptVault.attachExistingModal.errors.generic')
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
          <h2 className="text-sm font-extrabold text-nexoraText">{t('taxiq.receiptVault.attachExistingModal.title')}</h2>
          <IconButton label={t('common.cancel')} onClick={handleClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto">
          {listQuery.isPending ? (
            <SkeletonList count={3} lines={1} />
          ) : eligibleReceipts.length === 0 ? (
            <p className="px-1 py-4 text-center text-xs font-medium text-nexoraMuted">
              {t('taxiq.receiptVault.attachExistingModal.emptyState')}
            </p>
          ) : (
            eligibleReceipts.map((r) => (
              <label
                key={r.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-xs ${
                  selectedReceiptId === r.id ? 'border-nexoraBrand bg-nexoraBrand/5' : 'border-nexoraBorder'
                }`}
              >
                <input
                  type="radio"
                  name="attach-existing-receipt"
                  value={r.id}
                  checked={selectedReceiptId === r.id}
                  onChange={() => setSelectedReceiptId(r.id)}
                />
                <div>
                  <div className="font-bold text-nexoraText">{r.fileName}</div>
                  <div className="text-[11px] text-nexoraMuted">
                    {r.aiExtractedVendor ?? '—'} · {r.aiExtractedDate ?? '—'}
                  </div>
                </div>
              </label>
            ))
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
            disabled={!selectedReceiptId || linkToDeduction.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {linkToDeduction.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('taxiq.receiptVault.attachExistingModal.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}

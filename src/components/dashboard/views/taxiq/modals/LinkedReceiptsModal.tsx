import { useState } from 'react'
import { Eye, Unlink, X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useTaxiqReceipts, useUnlinkTaxiqReceiptFromDeduction } from '../../../../../data/hooks/useTaxiqReceipts'
import type { ReceiptVaultItem } from '../../../../../data/repositories/taxiqReceipts'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'
import { SkeletonList } from '../../../../ui/skeleton'
import ReceiptQualityStatusBadge from '../shared/ReceiptQualityStatusBadge'
import ReceiptPreviewModal from './ReceiptPreviewModal'
import ConfirmModal from './ConfirmModal'

export default function LinkedReceiptsModal({
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
  const listQuery = useTaxiqReceipts(open ? { ownerTaxYearId, staffTaxYearId, deductionRecordId } : undefined)
  const unlinkReceipt = useUnlinkTaxiqReceiptFromDeduction()

  const [previewingReceipt, setPreviewingReceipt] = useState<ReceiptVaultItem | null>(null)
  const [unlinkingReceipt, setUnlinkingReceipt] = useState<ReceiptVaultItem | null>(null)

  if (!open) return null

  const items = listQuery.data ?? []

  const handleUnlink = async () => {
    if (!unlinkingReceipt) return
    try {
      await unlinkReceipt.mutateAsync(unlinkingReceipt.id)
      showToast(t('taxiq.deductionCenter.linkedReceiptsModal.unlinkSuccess'), 'success')
      setUnlinkingReceipt(null)
    } catch (err) {
      const i18nKey = isApiError(err) ? getErrorI18nKey(err.errorCode) : 'taxiq.deductionCenter.linkedReceiptsModal.errors.generic'
      showToast(t(i18nKey), 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-nexoraText">{t('taxiq.deductionCenter.linkedReceiptsModal.title')}</h2>
          <IconButton label={t('common.cancel')} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto">
          {listQuery.isPending ? (
            <SkeletonList count={2} lines={1} />
          ) : items.length === 0 ? (
            <p className="px-1 py-4 text-center text-xs font-medium text-nexoraMuted">
              {t('taxiq.deductionCenter.linkedReceiptsModal.emptyState')}
            </p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-nexoraBorder px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate font-bold text-nexoraText text-xs">{item.fileName}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-nexoraMuted">
                    <span>{item.aiExtractedVendor ?? '—'} · {item.aiExtractedDate ?? '—'}</span>
                    <ReceiptQualityStatusBadge status={item.qualityStatus} />
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewingReceipt(item)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-nexoraBrand hover:underline"
                  >
                    <Eye className="h-3 w-3" />
                    {t('taxiq.receiptVault.actions.view')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnlinkingReceipt(item)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:underline"
                  >
                    <Unlink className="h-3 w-3" />
                    {t('taxiq.deductionCenter.linkedReceiptsModal.unlink')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {previewingReceipt && (
        <ReceiptPreviewModal
          open={!!previewingReceipt}
          onClose={() => setPreviewingReceipt(null)}
          receipt={previewingReceipt}
        />
      )}

      <ConfirmModal
        open={!!unlinkingReceipt}
        onClose={() => setUnlinkingReceipt(null)}
        onConfirm={handleUnlink}
        title={t('taxiq.deductionCenter.linkedReceiptsModal.unlink')}
        message={t('taxiq.deductionCenter.linkedReceiptsModal.unlinkConfirm')}
        confirmLabel={t('taxiq.deductionCenter.linkedReceiptsModal.unlink')}
        isDangerous
        isPending={unlinkReceipt.isPending}
      />
    </div>
  )
}

import { useRef, useState } from 'react'
import { AlertTriangle, Loader2, Lock, Upload } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { useTaxiqReceipts, useUploadTaxiqReceipt } from '../../../../data/hooks/useTaxiqReceipts'
import type { ReceiptLinkedEntityType, ReceiptQualityStatus, ReceiptVaultItem } from '../../../../data/repositories/taxiqReceipts'
import { SkeletonList } from '../../../ui/skeleton'
import Tooltip from '../../../ui/Tooltip'
import { formatCurrency } from '../../utils'
import ReceiptQualityStatusBadge from './shared/ReceiptQualityStatusBadge'
import DuplicateResolveModal from './modals/DuplicateResolveModal'

const LINK_TYPE_LABEL_KEYS: Record<ReceiptLinkedEntityType, string> = {
  Standalone: 'taxiq.receiptVault.linkType.standalone',
  Deduction: 'taxiq.receiptVault.linkType.deduction',
  Payout: 'taxiq.receiptVault.linkType.payout',
  SelfReportedIncome: 'taxiq.receiptVault.linkType.selfReportedIncome',
}

// US-05: shared verbatim by Owner and Staff (2 routes, same component, scoped by
// ownerTaxYearId/staffTaxYearId) — mirrors DeductionCenterView's scope pattern.
export default function ReceiptVaultView({
  scope = 'owner',
  ownerTaxYearId,
  staffTaxYearId,
}: {
  scope?: 'owner' | 'staff'
  ownerTaxYearId?: string
  staffTaxYearId?: string
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const isStaff = scope === 'staff'

  const [qualityFilter, setQualityFilter] = useState('all')
  const [linkTypeFilter, setLinkTypeFilter] = useState('all')
  const [resolvingReceipt, setResolvingReceipt] = useState<ReceiptVaultItem | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const listQuery = useTaxiqReceipts({ ownerTaxYearId, staffTaxYearId })
  const uploadReceipt = useUploadTaxiqReceipt()

  const allItems = listQuery.data ?? []
  const items = allItems.filter((item) => {
    if (qualityFilter !== 'all' && item.qualityStatus !== qualityFilter) return false
    if (linkTypeFilter !== 'all' && item.linkedEntityType !== linkTypeFilter) return false
    return true
  })

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      await uploadReceipt.mutateAsync({ ownerTaxYearId, staffTaxYearId, file })
      showToast(t('taxiq.receiptVault.uploadSuccess'), 'success')
    } catch {
      showToast(t('taxiq.receiptVault.uploadError'), 'error')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-nexoraText">{t('taxiq.receiptVault.title')}</h2>
          <p className="mt-1 text-xs text-nexoraMuted">{t('taxiq.receiptVault.subtitle')}</p>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,application/pdf"
            className="sr-only"
            onChange={handleFileChange}
            disabled={uploadReceipt.isPending}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploadReceipt.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {uploadReceipt.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {uploadReceipt.isPending ? t('taxiq.receiptVault.uploading') : t('taxiq.receiptVault.uploadButton')}
          </button>
        </div>
      </div>

      {isStaff && (
        <div className="flex items-center gap-2 rounded-lg border border-nexoraBorder bg-nexoraCanvas px-3 py-2 text-xs font-semibold text-nexoraMuted">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          {t('taxiq.receiptVault.staffPrivacyBanner')}
        </div>
      )}

      <div className="nexora-card flex flex-wrap items-center gap-3 p-4">
        <select
          value={qualityFilter}
          onChange={(e) => setQualityFilter(e.target.value)}
          className="rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-semibold"
        >
          <option value="all">{t('taxiq.receiptVault.filters.allQuality')}</option>
          <option value="Pending">{t('taxiq.receiptVault.quality.pending')}</option>
          <option value="Valid">{t('taxiq.receiptVault.quality.valid')}</option>
          <option value="NeedsMoreInfo">{t('taxiq.receiptVault.quality.needsMoreInfo')}</option>
        </select>

        <select
          value={linkTypeFilter}
          onChange={(e) => setLinkTypeFilter(e.target.value)}
          className="rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-semibold"
        >
          <option value="all">{t('taxiq.receiptVault.filters.allLinkTypes')}</option>
          <option value="Standalone">{t('taxiq.receiptVault.linkType.standalone')}</option>
          <option value="Deduction">{t('taxiq.receiptVault.linkType.deduction')}</option>
          <option value="Payout">{t('taxiq.receiptVault.linkType.payout')}</option>
          <option value="SelfReportedIncome">{t('taxiq.receiptVault.linkType.selfReportedIncome')}</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
            <tr>
              <th className="px-4 py-3">{t('taxiq.receiptVault.columns.fileName')}</th>
              <th className="px-4 py-3">{t('taxiq.receiptVault.columns.vendor')}</th>
              <th className="px-4 py-3">{t('taxiq.receiptVault.columns.date')}</th>
              <th className="px-4 py-3">{t('taxiq.receiptVault.columns.amount')}</th>
              <th className="px-4 py-3">
                <span className="inline-flex items-center gap-1">
                  {t('taxiq.receiptVault.columns.quality')}
                  <Tooltip content={t('taxiq.receiptVault.tooltips.quality')} />
                </span>
              </th>
              <th className="px-4 py-3">
                <span className="inline-flex items-center gap-1">
                  {t('taxiq.receiptVault.columns.linkType')}
                  <Tooltip content={t('taxiq.receiptVault.tooltips.linkType')} />
                </span>
              </th>
              <th className="px-4 py-3">{t('taxiq.receiptVault.columns.createdAt')}</th>
              <th className="px-4 py-3 text-right">{t('taxiq.receiptVault.columns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {listQuery.isPending ? (
              <tr>
                <td colSpan={8} className="p-4">
                  <SkeletonList count={4} lines={1} />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center font-medium text-nexoraMuted">
                  {t('taxiq.receiptVault.emptyState')}
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const needsResolution = item.isDuplicate && !item.duplicateResolution
                return (
                  <tr key={item.id} className="border-t border-nexoraRule">
                    <td className="px-4 py-3 font-bold text-nexoraText">{item.fileName}</td>
                    <td className="px-4 py-3 text-nexoraText">{item.aiExtractedVendor ?? '—'}</td>
                    <td className="px-4 py-3 text-nexoraMuted">{item.aiExtractedDate ?? '—'}</td>
                    <td className="px-4 py-3 text-nexoraText">
                      {item.aiExtractedAmount !== null ? formatCurrency(item.aiExtractedAmount) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <ReceiptQualityStatusBadge status={item.qualityStatus as ReceiptQualityStatus} />
                        {item.qualityStatus === 'NeedsMoreInfo' && (
                          <span className="text-[10px] text-nexoraMuted">{t('taxiq.receiptVault.needsMoreInfoNote')}</span>
                        )}
                        {needsResolution && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600">
                            <AlertTriangle className="h-3 w-3" />
                            {t('taxiq.receiptVault.duplicateModal.title')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-nexoraBorder px-2.5 py-0.5 text-[10px] font-bold text-nexoraText">
                        {t(LINK_TYPE_LABEL_KEYS[item.linkedEntityType] ?? item.linkedEntityType)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-nexoraMuted">{item.createdAt.slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {needsResolution && (
                          <button
                            type="button"
                            onClick={() => setResolvingReceipt(item)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-nexoraBrand hover:underline"
                          >
                            {t('taxiq.receiptVault.actions.resolveDuplicate')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {resolvingReceipt && (
        <DuplicateResolveModal
          open={!!resolvingReceipt}
          onClose={() => setResolvingReceipt(null)}
          receipt={resolvingReceipt}
          otherReceipts={allItems.filter((i) => i.id !== resolvingReceipt.id)}
        />
      )}
    </div>
  )
}

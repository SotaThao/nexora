import { useState } from 'react'
import { Camera, CheckCircle2, Loader2, Pencil, Plus, RefreshCw } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { useTaxiqDeductionCategories } from '../../../../data/hooks/useTaxiqDeductionCategories'
import {
  useApproveCpaReviewDeduction,
  useReanalyzeOwnerDeduction,
  useTaxiqOwnerDeductions,
} from '../../../../data/hooks/useTaxiqOwnerDeductions'
import type { DeductionRecord } from '../../../../data/repositories/taxiqOwnerDeductions'
import { SkeletonList } from '../../../ui/skeleton'
import { formatCurrency } from '../../utils'
import AddDeductionWizard from './AddDeductionWizard'
import AddDeductionFromReceiptWizard from './AddDeductionFromReceiptWizard'
import DeductionStatusBadge from './shared/DeductionStatusBadge'
import AiDeductionStatusBadge from './shared/AiDeductionStatusBadge'

const EDITABLE_STATUSES = new Set(['Draft', 'MissingReceipt', 'MissingInfo'])

export default function DeductionCenterView({ ownerTaxYearId }: { ownerTaxYearId: string }) {
  const { t } = useTranslation()
  const { showToast } = useNotification()

  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [isReceiptWizardOpen, setIsReceiptWizardOpen] = useState(false)
  const [editingDeduction, setEditingDeduction] = useState<DeductionRecord | null>(null)
  const [busyRowId, setBusyRowId] = useState<string | null>(null)

  const categoriesQuery = useTaxiqDeductionCategories('Owner')
  const categories = categoriesQuery.data ?? []

  const listQuery = useTaxiqOwnerDeductions({
    ownerTaxYearId,
    recordStatus: statusFilter !== 'all' ? statusFilter : undefined,
    categoryId: categoryFilter !== 'all' ? categoryFilter : undefined,
  })

  const reanalyze = useReanalyzeOwnerDeduction()
  const approve = useApproveCpaReviewDeduction()

  const items = listQuery.data?.items ?? []
  const totalDeductibleAmount = listQuery.data?.totalDeductibleAmount ?? 0

  const openAddWizard = () => {
    setEditingDeduction(null)
    setIsWizardOpen(true)
  }

  const openEditWizard = (record: DeductionRecord) => {
    setEditingDeduction(record)
    setIsWizardOpen(true)
  }

  const closeWizard = () => {
    setIsWizardOpen(false)
    setEditingDeduction(null)
  }

  const handleReanalyze = async (id: string) => {
    setBusyRowId(id)
    try {
      await reanalyze.mutateAsync(id)
    } catch {
      showToast(t('taxiq.deductionCenter.errors.generic'), 'error')
    } finally {
      setBusyRowId(null)
    }
  }

  const handleApprove = async (id: string) => {
    setBusyRowId(id)
    try {
      await approve.mutateAsync(id)
    } catch {
      showToast(t('taxiq.deductionCenter.errors.generic'), 'error')
    } finally {
      setBusyRowId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-nexoraText">{t('taxiq.deductionCenter.title')}</h2>
          <p className="mt-1 text-xs text-nexoraMuted">{t('taxiq.deductionCenter.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsReceiptWizardOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-nexoraBorder px-4 py-2 text-xs font-bold text-nexoraText"
          >
            <Camera className="h-3.5 w-3.5" />
            {t('taxiq.deductionCenter.addFromReceiptButton')}
          </button>
          <button
            type="button"
            onClick={openAddWizard}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('taxiq.deductionCenter.addButton')}
          </button>
        </div>
      </div>

      <div className="nexora-card flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-semibold"
          >
            <option value="all">{t('taxiq.deductionCenter.filters.allStatuses')}</option>
            <option value="Draft">{t('taxiq.deductionCenter.status.draft')}</option>
            <option value="Ready">{t('taxiq.deductionCenter.status.ready')}</option>
            <option value="MissingReceipt">{t('taxiq.deductionCenter.status.missingReceipt')}</option>
            <option value="MissingInfo">{t('taxiq.deductionCenter.status.missingInfo')}</option>
            <option value="CPAReview">{t('taxiq.deductionCenter.status.cpaReview')}</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            disabled={categoriesQuery.isError}
            className="rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-semibold"
          >
            <option value="all">{t('taxiq.deductionCenter.filters.allCategories')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="text-right">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-nexoraMuted">
            {t('taxiq.deductionCenter.totalLabel')}
          </div>
          <div className="text-lg font-extrabold text-nexoraText">{formatCurrency(totalDeductibleAmount)}</div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
        <table className="w-full min-w-[820px] text-left text-xs">
          <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
            <tr>
              <th className="px-4 py-3">{t('taxiq.deductionCenter.columns.category')}</th>
              <th className="px-4 py-3">{t('taxiq.deductionCenter.columns.description')}</th>
              <th className="px-4 py-3">{t('taxiq.deductionCenter.columns.amount')}</th>
              <th className="px-4 py-3">{t('taxiq.deductionCenter.columns.deductibleAmount')}</th>
              <th className="px-4 py-3">{t('taxiq.deductionCenter.columns.date')}</th>
              <th className="px-4 py-3">{t('taxiq.deductionCenter.columns.status')}</th>
              <th className="px-4 py-3 text-right">{t('taxiq.deductionCenter.columns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {listQuery.isPending ? (
              <tr>
                <td colSpan={7} className="p-4">
                  <SkeletonList count={4} lines={1} />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center font-medium text-nexoraMuted">
                  {t('taxiq.deductionCenter.emptyState')}
                </td>
              </tr>
            ) : (
              items.map((record) => {
                const isBusy = busyRowId === record.id
                const isNotDeductible = record.aiDeductionStatus === 'NotDeductible'
                return (
                  <tr key={record.id} className="border-t border-nexoraRule">
                    <td className="px-4 py-3 font-bold text-nexoraText">{record.categoryName}</td>
                    <td className="px-4 py-3 text-nexoraText">{record.description}</td>
                    <td className="px-4 py-3 text-nexoraText">{formatCurrency(record.amount)}</td>
                    <td className={`px-4 py-3 font-extrabold ${isNotDeductible ? 'text-nexoraMuted line-through' : 'text-nexoraText'}`}>
                      {formatCurrency(record.deductibleAmount)}
                    </td>
                    <td className="px-4 py-3 text-nexoraMuted">{record.date}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <DeductionStatusBadge status={record.recordStatus} />
                        {record.aiDeductionStatus && <AiDeductionStatusBadge status={record.aiDeductionStatus} />}
                        {record.recordStatus === 'CPAReview' && (
                          <span className="text-[10px] text-nexoraMuted">{t('taxiq.deductionCenter.cpaReviewExplanation')}</span>
                        )}
                        {isNotDeductible && (
                          <span className="text-[10px] font-semibold text-rose-600">{t('taxiq.deductionCenter.notDeductibleNotice')}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {EDITABLE_STATUSES.has(record.recordStatus) && (
                          <button
                            type="button"
                            onClick={() => openEditWizard(record)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-nexoraBrand hover:underline"
                          >
                            <Pencil className="h-3 w-3" />
                            {t('taxiq.deductionCenter.actions.edit')}
                          </button>
                        )}
                        {record.recordStatus !== 'Draft' && (
                          <button
                            type="button"
                            onClick={() => handleReanalyze(record.id)}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-nexoraBrand hover:underline disabled:opacity-60"
                          >
                            {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                            {t('taxiq.deductionCenter.actions.reanalyze')}
                          </button>
                        )}
                        {record.recordStatus === 'CPAReview' && (
                          <button
                            type="button"
                            onClick={() => handleApprove(record.id)}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:underline disabled:opacity-60"
                          >
                            {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                            {t('taxiq.deductionCenter.actions.approve')}
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

      {isWizardOpen && (
        <AddDeductionWizard
          ownerTaxYearId={ownerTaxYearId}
          initialDeduction={editingDeduction}
          onClose={closeWizard}
        />
      )}

      {isReceiptWizardOpen && (
        <AddDeductionFromReceiptWizard
          ownerTaxYearId={ownerTaxYearId}
          onClose={() => setIsReceiptWizardOpen(false)}
        />
      )}
    </div>
  )
}

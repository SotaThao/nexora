import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { useDeleteOwnerIncome, useTaxiqOwnerIncomeList } from '../../../../data/hooks/useTaxiqOwnerIncome'
import type { OwnerIncomeRecord } from '../../../../data/repositories/taxiqOwnerIncome'
import { isApiError } from '../../../../types/domain'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import { SkeletonList } from '../../../ui/skeleton'
import ConfirmModal from './modals/ConfirmModal'
import OwnerIncomeWizard from './OwnerIncomeWizard'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function statusBadgeClass(status: string) {
  if (status === 'Ready') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400'
  }
  if (status === 'CPAReview') {
    return 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-400'
  }
  if (status === 'Locked') {
    return 'border-nexoraBorder bg-nexoraCanvas text-nexoraMuted'
  }
  return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400'
}

function statusLabelKey(status: string) {
  if (status === 'CPAReview') return 'taxiq.ownerIncome.status.cpaReview'
  const key = status.charAt(0).toLowerCase() + status.slice(1)
  return `taxiq.ownerIncome.status.${key}`
}

function incomeTypeLabelKey(incomeType: string | null) {
  if (!incomeType) return null
  const key = incomeType.charAt(0).toLowerCase() + incomeType.slice(1)
  return `taxiq.ownerIncome.incomeType.${key}`
}

function periodLabel(record: OwnerIncomeRecord) {
  if (!record.periodType || !record.periodEndDate) return record.transactionDate
  return `${record.transactionDate} – ${record.periodEndDate}`
}

export default function OwnerIncomeSummaryListView({
  ownerTaxYearId,
  taxYear,
  ownerTaxYearStatus,
}: {
  ownerTaxYearId: string
  taxYear: number
  ownerTaxYearStatus: string
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const navigate = useNavigate()
  const listQuery = useTaxiqOwnerIncomeList(ownerTaxYearId)
  const deleteIncome = useDeleteOwnerIncome()

  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingRecord, setDeletingRecord] = useState<OwnerIncomeRecord | null>(null)

  const isLocked = ownerTaxYearStatus === 'Locked'
  const items = [...(listQuery.data ?? [])].sort((a, b) => (a.transactionDate < b.transactionDate ? 1 : -1))

  const openAddWizard = () => {
    setEditingId(null)
    setIsWizardOpen(true)
  }

  const openEditWizard = (id: string) => {
    setEditingId(id)
    setIsWizardOpen(true)
  }

  const closeWizard = () => {
    setIsWizardOpen(false)
    setEditingId(null)
  }

  const handleDelete = async () => {
    if (!deletingRecord) return
    try {
      await deleteIncome.mutateAsync({ id: deletingRecord.id, ownerTaxYearId })
      showToast(t('taxiq.ownerIncome.deleteSuccess'), 'success')
      setDeletingRecord(null)
    } catch (err) {
      const i18nKey = isApiError(err) ? getErrorI18nKey(err.errorCode) : 'taxiq.ownerIncome.errors.generic'
      showToast(t(i18nKey), 'error')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-nexoraText">{t('taxiq.ownerIncome.title')}</h2>
          <p className="mt-1 text-xs text-nexoraMuted">{t('taxiq.ownerIncome.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={openAddWizard}
          disabled={isLocked}
          className="inline-flex items-center gap-1.5 self-start rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white disabled:opacity-60 sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('taxiq.ownerIncome.add')}
        </button>
      </div>

      {isLocked && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-nexoraBorder bg-nexoraCanvas px-3 py-2 text-xs font-semibold text-nexoraMuted">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          <span>{t('taxiq.ownerIncome.lockedNotice')}</span>
          <button
            type="button"
            onClick={() => navigate('/dashboard/taxiq/export')}
            className="ml-auto shrink-0 rounded-lg bg-nexoraBrand px-3 py-1.5 text-[11px] font-bold text-white"
          >
            {t('taxiq.deductionCenter.errors.lockedAction')}
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
        <table className="w-full min-w-[860px] text-left text-xs">
          <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
            <tr>
              <th className="px-4 py-3">{t('taxiq.ownerIncome.columns.date')}</th>
              <th className="px-4 py-3">{t('taxiq.ownerIncome.columns.amount')}</th>
              <th className="px-4 py-3">{t('taxiq.ownerIncome.columns.source')}</th>
              <th className="px-4 py-3">{t('taxiq.ownerIncome.columns.incomeType')}</th>
              <th className="px-4 py-3">{t('taxiq.ownerIncome.columns.status')}</th>
              <th className="px-4 py-3 text-right">{t('taxiq.ownerIncome.columns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {listQuery.isPending ? (
              <tr>
                <td colSpan={6} className="p-4">
                  <SkeletonList count={4} lines={1} />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center font-medium text-nexoraMuted">
                  {t('taxiq.ownerIncome.emptyState')}
                </td>
              </tr>
            ) : (
              items.map((record) => {
                const incomeTypeKey = incomeTypeLabelKey(record.incomeType)
                return (
                  <tr key={record.id} className="border-t border-nexoraRule align-top">
                    <td className="px-4 py-3 font-bold text-nexoraText">{periodLabel(record)}</td>
                    <td className="px-4 py-3 text-nexoraText">{formatCurrency(record.amount)}</td>
                    <td className="px-4 py-3 text-nexoraMuted">{record.source}</td>
                    <td className="px-4 py-3 text-nexoraMuted">
                      {incomeTypeKey ? t(incomeTypeKey) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusBadgeClass(record.status)}`}>
                        {t(statusLabelKey(record.status))}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-nexoraBorder px-2 py-0.5 text-[10px] font-bold text-nexoraMuted">
                            <Lock className="h-3 w-3" />
                            {t('taxiq.ownerIncome.status.locked')}
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditWizard(record.id)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-nexoraBrand hover:underline"
                            >
                              <Pencil className="h-3 w-3" />
                              {t('taxiq.ownerIncome.edit')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingRecord(record)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:underline"
                            >
                              <Trash2 className="h-3 w-3" />
                              {t('taxiq.ownerIncome.delete')}
                            </button>
                          </>
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
        <OwnerIncomeWizard
          ownerTaxYearId={ownerTaxYearId}
          taxYear={taxYear}
          editingId={editingId}
          onClose={closeWizard}
        />
      )}

      <ConfirmModal
        open={!!deletingRecord}
        onClose={() => setDeletingRecord(null)}
        onConfirm={handleDelete}
        title={t('taxiq.ownerIncome.delete')}
        message={t('taxiq.ownerIncome.deleteConfirm')}
        confirmLabel={t('taxiq.ownerIncome.delete')}
        isDangerous
        isPending={deleteIncome.isPending}
      />
    </div>
  )
}

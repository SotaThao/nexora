import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Plus, Trash2, Wrench } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useDeletePayoutRecord, useTaxiqOwnerPayouts, useTaxiqOwnerStaffList } from '../../../../../data/hooks/useTaxiqOwnerPayouts'
import { PAYOUT_STATUSES, type PayoutRecord, type PayoutStatus } from '../../../../../data/repositories/taxiqOwnerPayouts'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'
import { SkeletonList } from '../../../../ui/skeleton'
import { formatCurrency } from '../../../utils'
import PayoutStatusBadge from '../shared/PayoutStatusBadge'
import AddPayoutModal from '../modals/AddPayoutModal'
import ConfirmModal from '../modals/ConfirmModal'

const LOCKED_ERROR_CODE = 'TAXIQ_OWNER_TAX_YEAR_LOCKED'

const EDITABLE_STATUS: PayoutStatus = 'PendingConfirmation'

export default function PayoutsTab({
  ownerTaxYearId,
  isLocked,
  canAdjust,
}: {
  ownerTaxYearId: string
  isLocked: boolean
  canAdjust: boolean
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const navigate = useNavigate()

  const [staffFilter, setStaffFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<PayoutRecord | null>(null)
  const [deletingRecord, setDeletingRecord] = useState<PayoutRecord | null>(null)

  const staffListQuery = useTaxiqOwnerStaffList(ownerTaxYearId)
  const staffList = staffListQuery.data ?? []

  const listQuery = useTaxiqOwnerPayouts({
    ownerTaxYearId,
    staffUserId: staffFilter !== 'all' ? staffFilter : undefined,
    status: statusFilter !== 'all' ? (statusFilter as PayoutStatus) : undefined,
  })
  const items = listQuery.data ?? []
  const deletePayoutRecord = useDeletePayoutRecord(ownerTaxYearId)

  const openAddModal = () => {
    setEditingRecord(null)
    setIsModalOpen(true)
  }

  const openEditModal = (record: PayoutRecord) => {
    setEditingRecord(record)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingRecord(null)
  }

  const handleDelete = async () => {
    if (!deletingRecord) return
    try {
      await deletePayoutRecord.mutateAsync(deletingRecord.id)
      showToast(t('taxiq.payoutCenter.deleteSuccess'), 'success')
      setDeletingRecord(null)
    } catch (err) {
      if (isApiError(err) && err.errorCode === LOCKED_ERROR_CODE) {
        showToast(t('taxiq.deductionCenter.errors.lockedMessage'), 'error')
        setDeletingRecord(null)
        return
      }
      const i18nKey = isApiError(err) ? getErrorI18nKey(err.errorCode) : 'taxiq.payoutCenter.errors.generic'
      showToast(t(i18nKey), 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="nexora-card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-semibold"
          >
            <option value="all">{t('taxiq.payoutCenter.filters.allStaff')}</option>
            {staffList.map((s) => (
              <option key={s.userProfileId} value={s.userProfileId}>{s.displayName}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-semibold"
          >
            <option value="all">{t('taxiq.payoutCenter.filters.allStatuses')}</option>
            {PAYOUT_STATUSES.map((status) => (
              <option key={status} value={status}>{t(`taxiq.payoutCenter.status.${status}`)}</option>
            ))}
          </select>
        </div>

        {!isLocked && (
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('taxiq.payoutCenter.addButton')}
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
            <tr>
              <th className="px-4 py-3">{t('taxiq.payoutCenter.columns.staff')}</th>
              <th className="px-4 py-3">{t('taxiq.payoutCenter.columns.period')}</th>
              <th className="px-4 py-3">{t('taxiq.payoutCenter.form.grossPayoutLabel')}</th>
              <th className="px-4 py-3">{t('taxiq.payoutCenter.form.netPaidLabel')}</th>
              <th className="px-4 py-3">{t('taxiq.payoutCenter.columns.status')}</th>
              <th className="px-4 py-3 text-right">{t('taxiq.payoutCenter.columns.actions')}</th>
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
                  {t('taxiq.payoutCenter.emptyState')}
                </td>
              </tr>
            ) : (
              items.map((record) => (
                <tr key={record.id} className="border-t border-nexoraRule">
                  <td className="px-4 py-3 font-bold text-nexoraText">{record.staffName}</td>
                  <td className="px-4 py-3 text-nexoraMuted">{record.periodStart} – {record.periodEnd}</td>
                  <td className="px-4 py-3 text-nexoraText">{formatCurrency(record.grossPayout)}</td>
                  <td className="px-4 py-3 font-extrabold text-nexoraText">{formatCurrency(record.netPaid)}</td>
                  <td className="px-4 py-3">
                    <PayoutStatusBadge status={record.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {record.status === EDITABLE_STATUS && !isLocked && (
                        <button
                          type="button"
                          onClick={() => openEditModal(record)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-nexoraBrand hover:underline"
                        >
                          <Pencil className="h-3 w-3" />
                          {t('taxiq.payoutCenter.actions.edit')}
                        </button>
                      )}
                      {record.status === EDITABLE_STATUS && !isLocked && (
                        <button
                          type="button"
                          onClick={() => setDeletingRecord(record)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:underline"
                        >
                          <Trash2 className="h-3 w-3" />
                          {t('taxiq.payoutCenter.delete')}
                        </button>
                      )}
                      {canAdjust && (
                        <button
                          type="button"
                          onClick={() => navigate('/dashboard/taxiq/export', {
                            state: { prefillAdjustment: {
                              entityType: 'PayoutRecord',
                              entityId: record.id,
                              currentValues: {
                                ServicePayout: record.servicePayout,
                                TipCardAmount: record.tipCardAmount,
                                TipCashAmount: record.tipCashAmount,
                                Bonus: record.bonus,
                                Reimbursement: record.reimbursement,
                              },
                            } },
                          })}
                          title={t('taxiq.createAdjustment.rowActionTooltip')}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-nexoraBrand hover:underline"
                        >
                          <Wrench className="h-3 w-3" />
                          {t('taxiq.createAdjustment.rowActionLabel')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <AddPayoutModal
          open={isModalOpen}
          onClose={closeModal}
          ownerTaxYearId={ownerTaxYearId}
          editingRecord={editingRecord}
        />
      )}

      <ConfirmModal
        open={!!deletingRecord}
        onClose={() => setDeletingRecord(null)}
        onConfirm={handleDelete}
        title={t('taxiq.payoutCenter.delete')}
        message={t('taxiq.payoutCenter.deleteConfirm')}
        confirmLabel={t('taxiq.payoutCenter.delete')}
        isDangerous
        isPending={deletePayoutRecord.isPending}
      />
    </div>
  )
}

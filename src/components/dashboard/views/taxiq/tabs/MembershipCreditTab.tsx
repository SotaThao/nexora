import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Loader2, Pencil, Plus, Trash2, Wrench, X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import {
  useCreateMembershipCredit,
  useDeleteMembershipCredit,
  useTaxiqOwnerMembershipCredits,
  useUpdateMembershipCredit,
} from '../../../../../data/hooks/useTaxiqOwnerAssets'
import type { MembershipCredit } from '../../../../../data/repositories/taxiqOwnerAssets'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'
import { SkeletonList } from '../../../../ui/skeleton'
import IconButton from '../../../../ui/IconButton'
import Tooltip from '../../../../ui/Tooltip'
import AssetStatusBadge, { assetStatusLabelKey } from '../shared/AssetStatusBadge'
import ConfirmModal from '../modals/ConfirmModal'

const LOCKED_ERROR_CODE = 'TAXIQ_OWNER_TAX_YEAR_LOCKED'

function monthToPeriodDate(month: string): string {
  return month ? `${month}-01` : ''
}

function periodDateToMonth(period: string): string {
  return period ? period.slice(0, 7) : ''
}

interface FormErrors {
  period?: string
  creditsIssued?: string
  creditsUsed?: string
  creditsExpired?: string
}

export default function MembershipCreditTab({
  ownerTaxYearId,
  isLocked,
  canAdjust,
  canEdit,
  onLockedError,
}: {
  ownerTaxYearId: string
  isLocked: boolean
  canAdjust: boolean
  canEdit: boolean
  onLockedError: () => void
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const navigate = useNavigate()
  const listQuery = useTaxiqOwnerMembershipCredits(ownerTaxYearId)
  const createCredit = useCreateMembershipCredit()
  const updateCredit = useUpdateMembershipCredit()
  const deleteCredit = useDeleteMembershipCredit()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingItem, setDeletingItem] = useState<MembershipCredit | null>(null)
  const [period, setPeriod] = useState('')
  const [creditsIssued, setCreditsIssued] = useState('')
  const [creditsUsed, setCreditsUsed] = useState('')
  const [creditsExpired, setCreditsExpired] = useState('')
  const [expiryPolicy, setExpiryPolicy] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const items = listQuery.data ?? []
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    items.forEach((item) => { counts[item.status] = (counts[item.status] ?? 0) + 1 })
    return counts
  }, [items])

  const expiredWithoutPolicy = Number(creditsExpired || 0) > 0 && !expiryPolicy.trim()

  const resetForm = () => {
    setPeriod('')
    setCreditsIssued('')
    setCreditsUsed('')
    setCreditsExpired('')
    setExpiryPolicy('')
    setErrors({})
  }

  const openAddModal = () => {
    setEditingId(null)
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (item: MembershipCredit) => {
    setEditingId(item.id)
    setPeriod(periodDateToMonth(item.period))
    setCreditsIssued(String(item.creditsIssued))
    setCreditsUsed(String(item.creditsUsed))
    setCreditsExpired(String(item.creditsExpired))
    setExpiryPolicy(item.expiryPolicy ?? '')
    setErrors({})
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    resetForm()
  }

  const handleDelete = async () => {
    if (!deletingItem) return
    try {
      await deleteCredit.mutateAsync({ id: deletingItem.id, ownerTaxYearId })
      showToast(t('taxiq.assetsTracker.membership.deleteSuccess'), 'success')
      setDeletingItem(null)
    } catch (err) {
      if (isApiError(err) && err.errorCode === LOCKED_ERROR_CODE) {
        onLockedError()
        setDeletingItem(null)
        return
      }
      const i18nKey = isApiError(err) ? getErrorI18nKey(err.errorCode) : 'taxiq.assetsTracker.errors.generic'
      showToast(t(i18nKey), 'error')
    }
  }

  const validate = (): boolean => {
    const nextErrors: FormErrors = {}
    if (!period) nextErrors.period = t('taxiq.assetsTracker.membership.form.periodRequired')
    if (creditsIssued === '' || Number(creditsIssued) < 0) nextErrors.creditsIssued = t('taxiq.assetsTracker.membership.form.creditsIssuedRequired')
    if (creditsUsed === '' || Number(creditsUsed) < 0) nextErrors.creditsUsed = t('taxiq.assetsTracker.membership.form.creditsUsedRequired')
    if (creditsExpired === '' || Number(creditsExpired) < 0) nextErrors.creditsExpired = t('taxiq.assetsTracker.membership.form.creditsExpiredRequired')
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setIsSubmitting(true)
    try {
      if (editingId) {
        await updateCredit.mutateAsync({
          id: editingId,
          ownerTaxYearId,
          period: monthToPeriodDate(period),
          creditsIssued: Number(creditsIssued),
          creditsUsed: Number(creditsUsed),
          creditsExpired: Number(creditsExpired),
          expiryPolicy: expiryPolicy.trim() || null,
        })
        showToast(t('taxiq.assetsTracker.membership.updateSuccess'), 'success')
      } else {
        await createCredit.mutateAsync({
          ownerTaxYearId,
          period: monthToPeriodDate(period),
          creditsIssued: Number(creditsIssued),
          creditsUsed: Number(creditsUsed),
          creditsExpired: Number(creditsExpired),
          expiryPolicy: expiryPolicy.trim() || null,
        })
        showToast(t('taxiq.assetsTracker.membership.addSuccess'), 'success')
      }
      closeModal()
    } catch (err) {
      if (isApiError(err) && err.errorCode === LOCKED_ERROR_CODE) {
        onLockedError()
        closeModal()
        return
      }
      const i18nKey = isApiError(err) ? getErrorI18nKey(err.errorCode) : 'taxiq.assetsTracker.errors.generic'
      showToast(t(i18nKey), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-nexoraMuted">
          <span>{t('taxiq.assetsTracker.totalItems', { count: items.length })}</span>
          {Object.entries(statusCounts).map(([status, count]) => (
            <span key={status}>{t(assetStatusLabelKey(status))}: {count}</span>
          ))}
        </div>
        <button
          type="button"
          onClick={openAddModal}
          disabled={isLocked}
          className="inline-flex items-center gap-1.5 self-start rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white disabled:opacity-60 sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('taxiq.assetsTracker.membership.addButton')}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
            <tr>
              <th className="px-4 py-3">{t('taxiq.assetsTracker.membership.columns.period')}</th>
              <th className="px-4 py-3">
                <span className="inline-flex items-center gap-1">
                  {t('taxiq.assetsTracker.membership.columns.creditsIssued')}
                  <Tooltip content={t('taxiq.assetsTracker.membership.tooltips.credits')} />
                </span>
              </th>
              <th className="px-4 py-3">{t('taxiq.assetsTracker.membership.columns.creditsUsed')}</th>
              <th className="px-4 py-3">{t('taxiq.assetsTracker.membership.columns.creditsExpired')}</th>
              <th className="px-4 py-3">
                <span className="inline-flex items-center gap-1">
                  {t('taxiq.assetsTracker.membership.columns.expiryPolicy')}
                  <Tooltip content={t('taxiq.assetsTracker.membership.tooltips.expiryPolicy')} />
                </span>
              </th>
              <th className="px-4 py-3">{t('taxiq.assetsTracker.membership.columns.status')}</th>
              {(canEdit || canAdjust) && <th className="px-4 py-3 text-right">{t('taxiq.assetsTracker.membership.columns.actions')}</th>}
            </tr>
          </thead>
          <tbody>
            {listQuery.isPending ? (
              <tr>
                <td colSpan={canEdit || canAdjust ? 7 : 6} className="p-4">
                  <SkeletonList count={4} lines={1} />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={canEdit || canAdjust ? 7 : 6} className="px-4 py-8 text-center font-medium text-nexoraMuted">
                  {t('taxiq.assetsTracker.membership.emptyState')}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-nexoraRule">
                  <td className="px-4 py-3 font-bold text-nexoraText">{item.period}</td>
                  <td className="px-4 py-3 text-nexoraText">{item.creditsIssued}</td>
                  <td className="px-4 py-3 text-nexoraText">{item.creditsUsed}</td>
                  <td className="px-4 py-3 text-nexoraText">{item.creditsExpired}</td>
                  <td className="px-4 py-3 text-nexoraMuted">{item.expiryPolicy || '—'}</td>
                  <td className="px-4 py-3"><AssetStatusBadge status={item.status} /></td>
                  {(canEdit || canAdjust) && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canEdit ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-nexoraBrand hover:underline"
                            >
                              <Pencil className="h-3 w-3" />
                              {t('taxiq.assetsTracker.membership.edit')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingItem(item)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:underline"
                            >
                              <Trash2 className="h-3 w-3" />
                              {t('taxiq.assetsTracker.membership.delete')}
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => navigate('/dashboard/taxiq/export', {
                              state: { prefillAdjustment: { entityType: 'MembershipCredit', entityId: item.id } },
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
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
          <div className="nexora-modal-card max-w-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-nexoraText">
                {editingId ? t('taxiq.assetsTracker.membership.edit') : t('taxiq.assetsTracker.membership.addButton')}
              </h2>
              <IconButton label={t('common.cancel')} onClick={closeModal}>
                <X className="h-4 w-4" />
              </IconButton>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.assetsTracker.membership.form.periodLabel')}</label>
                <input
                  type="month"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                />
                {errors.period && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.period}</p>}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.assetsTracker.membership.form.creditsIssuedLabel')}</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={creditsIssued}
                    onChange={(e) => setCreditsIssued(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                  />
                  {errors.creditsIssued && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.creditsIssued}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.assetsTracker.membership.form.creditsUsedLabel')}</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={creditsUsed}
                    onChange={(e) => setCreditsUsed(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                  />
                  {errors.creditsUsed && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.creditsUsed}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.assetsTracker.membership.form.creditsExpiredLabel')}</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={creditsExpired}
                    onChange={(e) => setCreditsExpired(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                  />
                  {errors.creditsExpired && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.creditsExpired}</p>}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-nexoraMuted">
                  <span className="inline-flex items-center gap-1">
                    {t('taxiq.assetsTracker.membership.form.expiryPolicyLabel')}
                    <Tooltip content={t('taxiq.assetsTracker.membership.tooltips.expiryPolicy')} />
                  </span>
                </label>
                <textarea
                  value={expiryPolicy}
                  onChange={(e) => setExpiryPolicy(e.target.value)}
                  rows={2}
                  placeholder={t('taxiq.assetsTracker.membership.form.expiryPolicyPlaceholder')}
                  className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                />
                {expiredWithoutPolicy && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                    <AlertTriangle className="h-3 w-3" />
                    {t('taxiq.assetsTracker.membership.form.expiryPolicyWarning')}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={closeModal} className="rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted">
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {editingId ? t('taxiq.assetsTracker.membership.form.saveChanges') : t('taxiq.assetsTracker.membership.form.submit')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        title={t('taxiq.assetsTracker.membership.delete')}
        message={t('taxiq.assetsTracker.membership.deleteConfirm')}
        confirmLabel={t('taxiq.assetsTracker.membership.delete')}
        isDangerous
        isPending={deleteCredit.isPending}
      />
    </div>
  )
}

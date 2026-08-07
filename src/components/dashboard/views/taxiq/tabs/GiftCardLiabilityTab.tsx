import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Pencil, Plus, Trash2, Wrench, X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import {
  useCreateGiftCardLiability,
  useDeleteGiftCardLiability,
  useTaxiqOwnerGiftCardLiabilities,
  useUpdateGiftCardLiability,
} from '../../../../../data/hooks/useTaxiqOwnerAssets'
import type { GiftCardLiability } from '../../../../../data/repositories/taxiqOwnerAssets'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'
import { SkeletonList } from '../../../../ui/skeleton'
import IconButton from '../../../../ui/IconButton'
import Tooltip from '../../../../ui/Tooltip'
import { formatCurrency } from '../../../utils'
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
  totalSold?: string
  totalRedeemed?: string
  balance?: string
}

export default function GiftCardLiabilityTab({
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
  const listQuery = useTaxiqOwnerGiftCardLiabilities(ownerTaxYearId)
  const createLiability = useCreateGiftCardLiability()
  const updateLiability = useUpdateGiftCardLiability()
  const deleteLiability = useDeleteGiftCardLiability()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingItem, setDeletingItem] = useState<GiftCardLiability | null>(null)
  const [period, setPeriod] = useState('')
  const [totalSold, setTotalSold] = useState('')
  const [totalRedeemed, setTotalRedeemed] = useState('')
  const [dataSource, setDataSource] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const items = listQuery.data ?? []
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    items.forEach((item) => { counts[item.status] = (counts[item.status] ?? 0) + 1 })
    return counts
  }, [items])

  const outstandingPreview = totalSold && totalRedeemed ? Number(totalSold) - Number(totalRedeemed) : null

  const resetForm = () => {
    setPeriod('')
    setTotalSold('')
    setTotalRedeemed('')
    setDataSource('')
    setErrors({})
  }

  const openAddModal = () => {
    setEditingId(null)
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (item: GiftCardLiability) => {
    setEditingId(item.id)
    setPeriod(periodDateToMonth(item.period))
    setTotalSold(String(item.totalSold))
    setTotalRedeemed(String(item.totalRedeemed))
    setDataSource(item.dataSource)
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
      await deleteLiability.mutateAsync({ id: deletingItem.id, ownerTaxYearId })
      showToast(t('taxiq.assetsTracker.giftCard.deleteSuccess'), 'success')
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
    if (!period) nextErrors.period = t('taxiq.assetsTracker.giftCard.form.periodRequired')
    if (totalSold === '' || Number(totalSold) < 0) nextErrors.totalSold = t('taxiq.assetsTracker.giftCard.form.totalSoldRequired')
    if (totalRedeemed === '' || Number(totalRedeemed) < 0) nextErrors.totalRedeemed = t('taxiq.assetsTracker.giftCard.form.totalRedeemedRequired')
    if (totalSold !== '' && totalRedeemed !== '' && Number(totalSold) < Number(totalRedeemed)) {
      nextErrors.balance = t('taxiq.assetsTracker.giftCard.form.balanceInvalid')
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setIsSubmitting(true)
    try {
      if (editingId) {
        await updateLiability.mutateAsync({
          id: editingId,
          ownerTaxYearId,
          period: monthToPeriodDate(period),
          totalSold: Number(totalSold),
          totalRedeemed: Number(totalRedeemed),
          dataSource: dataSource.trim() || null,
        })
        showToast(t('taxiq.assetsTracker.giftCard.updateSuccess'), 'success')
      } else {
        await createLiability.mutateAsync({
          ownerTaxYearId,
          period: monthToPeriodDate(period),
          totalSold: Number(totalSold),
          totalRedeemed: Number(totalRedeemed),
          dataSource: dataSource.trim() || null,
        })
        showToast(t('taxiq.assetsTracker.giftCard.addSuccess'), 'success')
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
          {t('taxiq.assetsTracker.giftCard.addButton')}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
            <tr>
              <th className="px-4 py-3">{t('taxiq.assetsTracker.giftCard.columns.period')}</th>
              <th className="px-4 py-3">{t('taxiq.assetsTracker.giftCard.columns.totalSold')}</th>
              <th className="px-4 py-3">{t('taxiq.assetsTracker.giftCard.columns.totalRedeemed')}</th>
              <th className="px-4 py-3">
                <span className="inline-flex items-center gap-1">
                  {t('taxiq.assetsTracker.giftCard.columns.outstandingBalance')}
                  <Tooltip content={t('taxiq.assetsTracker.giftCard.tooltips.outstandingBalance')} />
                </span>
              </th>
              <th className="px-4 py-3">
                <span className="inline-flex items-center gap-1">
                  {t('taxiq.assetsTracker.giftCard.columns.dataSource')}
                  <Tooltip content={t('taxiq.assetsTracker.giftCard.tooltips.dataSource')} />
                </span>
              </th>
              <th className="px-4 py-3">{t('taxiq.assetsTracker.giftCard.columns.status')}</th>
              {(canEdit || canAdjust) && <th className="px-4 py-3 text-right">{t('taxiq.assetsTracker.giftCard.columns.actions')}</th>}
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
                  {t('taxiq.assetsTracker.giftCard.emptyState')}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-nexoraRule">
                  <td className="px-4 py-3 font-bold text-nexoraText">{item.period}</td>
                  <td className="px-4 py-3 text-nexoraText">{formatCurrency(item.totalSold)}</td>
                  <td className="px-4 py-3 text-nexoraText">{formatCurrency(item.totalRedeemed)}</td>
                  <td className="px-4 py-3 font-extrabold text-nexoraText">{formatCurrency(item.outstandingBalance)}</td>
                  <td className="px-4 py-3 text-nexoraMuted">{item.dataSource || '—'}</td>
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
                              {t('taxiq.assetsTracker.giftCard.edit')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingItem(item)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:underline"
                            >
                              <Trash2 className="h-3 w-3" />
                              {t('taxiq.assetsTracker.giftCard.delete')}
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => navigate('/dashboard/taxiq/export', {
                              state: { prefillAdjustment: {
                                entityType: 'GiftCardLiability',
                                entityId: item.id,
                                currentValues: {
                                  TotalSold: item.totalSold,
                                  TotalRedeemed: item.totalRedeemed,
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
                {editingId ? t('taxiq.assetsTracker.giftCard.edit') : t('taxiq.assetsTracker.giftCard.addButton')}
              </h2>
              <IconButton label={t('common.cancel')} onClick={closeModal}>
                <X className="h-4 w-4" />
              </IconButton>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.assetsTracker.giftCard.form.periodLabel')}</label>
                <input
                  type="month"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                />
                {errors.period && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.period}</p>}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.assetsTracker.giftCard.form.totalSoldLabel')}</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={totalSold}
                    onChange={(e) => setTotalSold(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                  />
                  {errors.totalSold && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.totalSold}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.assetsTracker.giftCard.form.totalRedeemedLabel')}</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={totalRedeemed}
                    onChange={(e) => setTotalRedeemed(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                  />
                  {errors.totalRedeemed && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.totalRedeemed}</p>}
                </div>
              </div>

              {errors.balance && <p className="text-xs font-semibold text-rose-500">{errors.balance}</p>}

              {outstandingPreview !== null && (
                <div className="flex items-center justify-between rounded-lg bg-nexoraCanvas px-3 py-2 text-sm">
                  <span className="inline-flex items-center gap-1 text-nexoraMuted">
                    {t('taxiq.assetsTracker.giftCard.form.outstandingPreviewLabel')}
                    <Tooltip content={t('taxiq.assetsTracker.giftCard.tooltips.outstandingBalance')} />
                  </span>
                  <span className="font-extrabold text-nexoraText">{formatCurrency(outstandingPreview)}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-nexoraMuted">
                  <span className="inline-flex items-center gap-1">
                    {t('taxiq.assetsTracker.giftCard.form.dataSourceLabel')}
                    <Tooltip content={t('taxiq.assetsTracker.giftCard.tooltips.dataSource')} />
                  </span>
                </label>
                <input
                  type="text"
                  value={dataSource}
                  onChange={(e) => setDataSource(e.target.value)}
                  placeholder={t('taxiq.assetsTracker.giftCard.form.dataSourcePlaceholder')}
                  className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                />
                {!dataSource.trim() && (
                  <p className="mt-1 text-[11px] font-semibold text-amber-600">{t('taxiq.assetsTracker.giftCard.form.dataSourceWarning')}</p>
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
                {editingId ? t('taxiq.assetsTracker.giftCard.form.saveChanges') : t('taxiq.assetsTracker.giftCard.form.submit')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        title={t('taxiq.assetsTracker.giftCard.delete')}
        message={t('taxiq.assetsTracker.giftCard.deleteConfirm')}
        confirmLabel={t('taxiq.assetsTracker.giftCard.delete')}
        isDangerous
        isPending={deleteLiability.isPending}
      />
    </div>
  )
}

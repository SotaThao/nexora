import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Loader2, Paperclip, Pencil, Plus, Trash2, Wrench, X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useUploadTaxiqReceipt } from '../../../../../data/hooks/useTaxiqReceipts'
import {
  useCreateEquipmentAsset,
  useDeleteEquipmentAsset,
  useTaxiqOwnerEquipment,
  useUpdateEquipmentAsset,
} from '../../../../../data/hooks/useTaxiqOwnerAssets'
import type { EquipmentAsset } from '../../../../../data/repositories/taxiqOwnerAssets'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'
import { SkeletonList } from '../../../../ui/skeleton'
import IconButton from '../../../../ui/IconButton'
import Tooltip from '../../../../ui/Tooltip'
import { formatCurrency } from '../../../utils'
import { EquipmentAiSuggestionBadge, equipmentAiSuggestionExplanationKey } from '../shared/EquipmentAiSuggestionBadge'
import ConfirmModal from '../modals/ConfirmModal'

const LOCKED_ERROR_CODE = 'TAXIQ_OWNER_TAX_YEAR_LOCKED'

interface FormErrors {
  assetName?: string
  purchaseDate?: string
  amount?: string
  businessUsePercent?: string
}

export default function EquipmentTab({
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
  const listQuery = useTaxiqOwnerEquipment(ownerTaxYearId)
  const createEquipment = useCreateEquipmentAsset()
  const updateEquipment = useUpdateEquipmentAsset()
  const deleteEquipment = useDeleteEquipmentAsset()
  const uploadReceipt = useUploadTaxiqReceipt()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingItem, setDeletingItem] = useState<EquipmentAsset | null>(null)
  const [assetName, setAssetName] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0])
  const [inServiceDate, setInServiceDate] = useState('')
  const [amount, setAmount] = useState('')
  const [businessUsePercent, setBusinessUsePercent] = useState('')
  const [isRenovation, setIsRenovation] = useState(false)
  const [receiptId, setReceiptId] = useState<string | null>(null)
  const [receiptFileName, setReceiptFileName] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const items = listQuery.data ?? []
  const highPriorityCount = items.filter((item) => item.isHighPriority).length
  const cpaReviewCount = items.filter((item) => item.aiSuggestion === 'CPAReview').length

  const resetForm = () => {
    setAssetName('')
    setPurchaseDate(new Date().toISOString().split('T')[0])
    setInServiceDate('')
    setAmount('')
    setBusinessUsePercent('')
    setIsRenovation(false)
    setReceiptId(null)
    setReceiptFileName('')
    setErrors({})
  }

  const openAddModal = () => {
    setEditingId(null)
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (item: EquipmentAsset) => {
    setEditingId(item.id)
    setAssetName(item.assetName)
    setPurchaseDate(item.purchaseDate)
    setInServiceDate(item.inServiceDate ?? '')
    setAmount(String(item.amount))
    setBusinessUsePercent(String(item.businessUsePercent))
    setIsRenovation(false)
    setReceiptId(item.receiptId)
    setReceiptFileName('')
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
      await deleteEquipment.mutateAsync({ id: deletingItem.id, ownerTaxYearId })
      showToast(t('taxiq.assetsTracker.equipment.deleteSuccess'), 'success')
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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setReceiptFileName(file.name)
    try {
      const id = await uploadReceipt.mutateAsync({ ownerTaxYearId, file })
      setReceiptId(id)
    } catch {
      showToast(t('taxiq.assetsTracker.errors.receiptUploadFailed'), 'error')
      setReceiptFileName('')
    }
  }

  const validate = (): boolean => {
    const nextErrors: FormErrors = {}
    if (!assetName.trim()) nextErrors.assetName = t('taxiq.assetsTracker.equipment.form.assetNameRequired')
    if (!purchaseDate) nextErrors.purchaseDate = t('taxiq.assetsTracker.equipment.form.purchaseDateRequired')
    if (!amount || Number(amount) <= 0) nextErrors.amount = t('taxiq.assetsTracker.equipment.form.amountRequired')
    if (businessUsePercent === '' || Number(businessUsePercent) < 0 || Number(businessUsePercent) > 100) {
      nextErrors.businessUsePercent = t('taxiq.assetsTracker.equipment.form.businessUsePercentRequired')
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setIsSubmitting(true)
    try {
      if (editingId) {
        await updateEquipment.mutateAsync({
          id: editingId,
          ownerTaxYearId,
          assetName: assetName.trim(),
          purchaseDate,
          inServiceDate: inServiceDate || null,
          amount: Number(amount),
          businessUsePercent: Number(businessUsePercent),
          isRenovation,
          receiptId,
        })
        showToast(t('taxiq.assetsTracker.equipment.updateSuccess'), 'success')
      } else {
        await createEquipment.mutateAsync({
          ownerTaxYearId,
          assetName: assetName.trim(),
          purchaseDate,
          inServiceDate: inServiceDate || null,
          amount: Number(amount),
          businessUsePercent: Number(businessUsePercent),
          isRenovation,
          receiptId,
        })
        showToast(t('taxiq.assetsTracker.equipment.addSuccess'), 'success')
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
          {highPriorityCount > 0 && (
            <span className="text-rose-600">{t('taxiq.assetsTracker.highPriorityCount', { count: highPriorityCount })}</span>
          )}
          {cpaReviewCount > 0 && (
            <span className="text-violet-600">{t('taxiq.assetsTracker.cpaReviewCount', { count: cpaReviewCount })}</span>
          )}
        </div>
        <button
          type="button"
          onClick={openAddModal}
          disabled={isLocked}
          className="inline-flex items-center gap-1.5 self-start rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white disabled:opacity-60 sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('taxiq.assetsTracker.equipment.addButton')}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
        <table className="w-full min-w-[860px] text-left text-xs">
          <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
            <tr>
              <th className="px-4 py-3">{t('taxiq.assetsTracker.equipment.columns.assetName')}</th>
              <th className="px-4 py-3">{t('taxiq.assetsTracker.equipment.columns.purchaseDate')}</th>
              <th className="px-4 py-3">
                <span className="inline-flex items-center gap-1">
                  {t('taxiq.assetsTracker.equipment.columns.inServiceDate')}
                  <Tooltip content={t('taxiq.assetsTracker.equipment.tooltips.inServiceDate')} />
                </span>
              </th>
              <th className="px-4 py-3">{t('taxiq.assetsTracker.equipment.columns.amount')}</th>
              <th className="px-4 py-3">{t('taxiq.assetsTracker.equipment.columns.businessUsePercent')}</th>
              <th className="px-4 py-3">
                <span className="inline-flex items-center gap-1">
                  {t('taxiq.assetsTracker.equipment.columns.aiSuggestion')}
                  <Tooltip content={t('taxiq.assetsTracker.equipment.tooltips.aiSuggestion')} />
                </span>
              </th>
              {(canEdit || canAdjust) && <th className="px-4 py-3 text-right">{t('taxiq.assetsTracker.equipment.columns.actions')}</th>}
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
                  {t('taxiq.assetsTracker.equipment.emptyState')}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-nexoraRule align-top">
                  <td className="px-4 py-3 font-bold text-nexoraText">{item.assetName}</td>
                  <td className="px-4 py-3 text-nexoraMuted">{item.purchaseDate}</td>
                  <td className="px-4 py-3">
                    {item.inServiceDate ? (
                      <span className="text-nexoraText">{item.inServiceDate}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
                        <AlertTriangle className="h-3 w-3" />
                        {t('taxiq.assetsTracker.status.highPriority')}
                        <Tooltip content={t('taxiq.assetsTracker.equipment.missingInServiceDateTooltip')} />
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-nexoraText">{formatCurrency(item.amount)}</td>
                  <td className="px-4 py-3 text-nexoraText">{item.businessUsePercent}%</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1">
                      <EquipmentAiSuggestionBadge suggestion={item.aiSuggestion} />
                      <span className="text-[10px] text-nexoraMuted">
                        {item.aiExplanation || t(equipmentAiSuggestionExplanationKey(item.aiSuggestion))}
                      </span>
                    </div>
                  </td>
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
                              {t('taxiq.assetsTracker.equipment.edit')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingItem(item)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:underline"
                            >
                              <Trash2 className="h-3 w-3" />
                              {t('taxiq.assetsTracker.equipment.delete')}
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => navigate('/dashboard/taxiq/export', {
                              state: { prefillAdjustment: { entityType: 'EquipmentAsset', entityId: item.id } },
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
                {editingId ? t('taxiq.assetsTracker.equipment.edit') : t('taxiq.assetsTracker.equipment.addButton')}
              </h2>
              <IconButton label={t('common.cancel')} onClick={closeModal}>
                <X className="h-4 w-4" />
              </IconButton>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.assetsTracker.equipment.form.assetNameLabel')}</label>
                <input
                  type="text"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                />
                {errors.assetName && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.assetName}</p>}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.assetsTracker.equipment.form.purchaseDateLabel')}</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                  />
                  {errors.purchaseDate && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.purchaseDate}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-nexoraMuted">
                    <span className="inline-flex items-center gap-1">
                      {t('taxiq.assetsTracker.equipment.form.inServiceDateLabel')}
                      <Tooltip content={t('taxiq.assetsTracker.equipment.tooltips.inServiceDate')} />
                    </span>
                  </label>
                  <input
                    type="date"
                    value={inServiceDate}
                    onChange={(e) => setInServiceDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                  />
                  {!inServiceDate && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                      <AlertTriangle className="h-3 w-3" />
                      {t('taxiq.assetsTracker.equipment.form.inServiceDateWarning')}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.assetsTracker.equipment.form.amountLabel')}</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                  />
                  {errors.amount && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.amount}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-nexoraMuted">
                    <span className="inline-flex items-center gap-1">
                      {t('taxiq.assetsTracker.equipment.form.businessUsePercentLabel')}
                      <Tooltip content={t('taxiq.tooltips.businessUsePercent')} />
                    </span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={businessUsePercent}
                    onChange={(e) => setBusinessUsePercent(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                  />
                  {errors.businessUsePercent && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.businessUsePercent}</p>}
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-nexoraText">
                <input type="checkbox" checked={isRenovation} onChange={(e) => setIsRenovation(e.target.checked)} />
                {t('taxiq.assetsTracker.equipment.form.isRenovationLabel')}
              </label>
              {isRenovation && (
                <p className="rounded-lg bg-nexoraCanvas px-3 py-2 text-xs font-semibold text-nexoraMuted">
                  {t('taxiq.assetsTracker.equipment.form.isRenovationNotice')}
                </p>
              )}

              <div>
                <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.assetsTracker.equipment.form.receiptLabel')}</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    id="equipment-receipt-input"
                    type="file"
                    accept="image/*,application/pdf"
                    className="sr-only"
                    onChange={handleFileChange}
                    disabled={uploadReceipt.isPending}
                  />
                  <label
                    htmlFor="equipment-receipt-input"
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-bold text-nexoraText"
                  >
                    {uploadReceipt.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
                    {t('taxiq.assetsTracker.equipment.form.receiptChooseFile')}
                  </label>
                  {receiptFileName ? (
                    <span className="text-xs text-nexoraMuted">{receiptFileName}</span>
                  ) : receiptId ? (
                    <span className="text-xs text-nexoraMuted">{t('taxiq.assetsTracker.equipment.form.receiptExisting')}</span>
                  ) : null}
                </div>
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
                {editingId ? t('taxiq.assetsTracker.equipment.form.saveChanges') : t('taxiq.assetsTracker.equipment.form.submit')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        title={t('taxiq.assetsTracker.equipment.delete')}
        message={t('taxiq.assetsTracker.equipment.deleteConfirm')}
        confirmLabel={t('taxiq.assetsTracker.equipment.delete')}
        isDangerous
        isPending={deleteEquipment.isPending}
      />
    </div>
  )
}

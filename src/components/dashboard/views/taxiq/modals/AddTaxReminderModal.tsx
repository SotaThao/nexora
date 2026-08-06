import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useCreateTaxReminder, useUpdateTaxReminder } from '../../../../../data/hooks/useTaxiqTaxReminders'
import {
  TAX_RELATED_TAX_TYPES,
  type TaxPaymentReminder,
  type TaxReminderTaxType,
} from '../../../../../data/repositories/taxiqTaxReminders'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'

const KNOWN_TAX_TYPES = new Set(['SalesTax', 'FranchiseTax', 'EstimatedTax', 'PayrollTax'])

export default function AddTaxReminderModal({
  open,
  onClose,
  ownerTaxYearId,
  editingReminder,
}: {
  open: boolean
  onClose: () => void
  ownerTaxYearId: string
  editingReminder?: TaxPaymentReminder | null
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const createReminder = useCreateTaxReminder()
  const updateReminder = useUpdateTaxReminder()

  const [taxType, setTaxType] = useState<TaxReminderTaxType>(
    (editingReminder?.taxType as TaxReminderTaxType) ?? TAX_RELATED_TAX_TYPES[0],
  )
  const [dueDate, setDueDate] = useState(editingReminder?.dueDate ?? '')
  const [error, setError] = useState('')

  if (!open) return null

  const isEditing = !!editingReminder
  const isPending = createReminder.isPending || updateReminder.isPending
  const canSubmit = dueDate.trim().length > 0

  const handleClose = () => {
    setTaxType(TAX_RELATED_TAX_TYPES[0])
    setDueDate('')
    setError('')
    onClose()
  }

  const handleSubmit = async () => {
    if (!canSubmit || isPending) return
    setError('')
    try {
      if (isEditing && editingReminder) {
        await updateReminder.mutateAsync({ id: editingReminder.id, ownerTaxYearId, taxType, dueDate })
        showToast(t('taxiq.reminders.form.updateSuccess'), 'success')
      } else {
        await createReminder.mutateAsync({ ownerTaxYearId, taxType, dueDate })
        showToast(t('taxiq.reminders.form.success'), 'success')
      }
      handleClose()
    } catch (err) {
      const fallback = t('taxiq.reminders.errors.generic')
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
      <div className="nexora-modal-card max-w-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-nexoraText">
            {isEditing ? t('taxiq.reminders.form.editModalTitle') : t('taxiq.reminders.form.modalTitle')}
          </h2>
          <IconButton label={t('common.cancel')} onClick={handleClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto">
          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">
              {t('taxiq.reminders.form.taxTypeLabel')}
            </label>
            <select
              value={taxType}
              onChange={(e) => setTaxType(e.target.value as TaxReminderTaxType)}
              className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-semibold"
            >
              {TAX_RELATED_TAX_TYPES.map((type) => (
                <option key={type} value={type}>{t(`taxiq.reminders.taxTypes.${type}`)}</option>
              ))}
            </select>
            {KNOWN_TAX_TYPES.has(taxType) && (
              <p className="mt-1 text-[11px] font-medium text-nexoraMuted">{t(`taxiq.reminders.taxTypeTooltips.${taxType}`)}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">
              {t('taxiq.reminders.form.dueDateLabel')}
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isEditing ? t('taxiq.reminders.form.saveChanges') : t('taxiq.reminders.form.submitButton')}
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Loader2, Plus, X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useLogCashTip, useTaxiqStaffCashTipLogs } from '../../../../../data/hooks/useTaxiqStaffLogs'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'
import { SkeletonList } from '../../../../ui/skeleton'
import IconButton from '../../../../ui/IconButton'

const LOCKED_ERROR_CODE = 'TAXIQ_STAFF_TAX_YEAR_LOCKED'

interface FormErrors {
  date?: string
  amount?: string
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

export default function CashTipLogTab({
  staffTaxYearId,
  isLocked,
  onLockedError,
}: {
  staffTaxYearId: string
  isLocked: boolean
  onLockedError: () => void
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const listQuery = useTaxiqStaffCashTipLogs(staffTaxYearId)
  const logCashTip = useLogCashTip()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [date, setDate] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const items = [...(listQuery.data ?? [])].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  const total = items.reduce((sum, item) => sum + item.amount, 0)

  const resetForm = () => {
    setDate('')
    setAmount('')
    setNote('')
    setErrors({})
  }

  const closeModal = () => {
    setIsModalOpen(false)
    resetForm()
  }

  const validate = (): boolean => {
    const nextErrors: FormErrors = {}
    if (!date) nextErrors.date = t('taxiq.staffLogs.cashTip.form.dateRequired')
    if (!amount || Number(amount) <= 0) nextErrors.amount = t('taxiq.staffLogs.cashTip.form.amountRequired')
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setIsSubmitting(true)
    try {
      await logCashTip.mutateAsync({
        staffTaxYearId,
        date,
        amount: Number(amount),
        note: note.trim() || null,
      })
      showToast(t('taxiq.staffLogs.cashTip.addSuccess'), 'success')
      closeModal()
    } catch (err) {
      if (isApiError(err) && err.errorCode === LOCKED_ERROR_CODE) {
        onLockedError()
        closeModal()
        return
      }
      const i18nKey = isApiError(err) ? getErrorI18nKey(err.errorCode) : 'taxiq.staffLogs.errors.generic'
      showToast(t(i18nKey), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs font-semibold text-nexoraMuted">
          <span className="text-sm font-extrabold text-nexoraText">{formatCurrency(total)}</span>{' '}
          {t('taxiq.staffLogs.cashTip.totalLabel')}
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          disabled={isLocked}
          className="inline-flex items-center gap-1.5 self-start rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white disabled:opacity-60 sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('taxiq.staffLogs.cashTip.addButton')}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
        <table className="w-full min-w-[560px] text-left text-xs">
          <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
            <tr>
              <th className="px-4 py-3">{t('taxiq.staffLogs.cashTip.columns.date')}</th>
              <th className="px-4 py-3">{t('taxiq.staffLogs.cashTip.columns.amount')}</th>
              <th className="px-4 py-3">{t('taxiq.staffLogs.cashTip.columns.note')}</th>
            </tr>
          </thead>
          <tbody>
            {listQuery.isPending ? (
              <tr>
                <td colSpan={3} className="p-4">
                  <SkeletonList count={4} lines={1} />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center font-medium text-nexoraMuted">
                  {t('taxiq.staffLogs.cashTip.emptyState')}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-nexoraRule align-top">
                  <td className="px-4 py-3 font-bold text-nexoraText">{item.date}</td>
                  <td className="px-4 py-3 text-nexoraText">{formatCurrency(item.amount)}</td>
                  <td className="px-4 py-3 text-nexoraMuted">{item.note || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
          <div className="nexora-modal-card max-w-md">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-nexoraText">{t('taxiq.staffLogs.cashTip.addButton')}</h2>
              <IconButton label={t('common.cancel')} onClick={closeModal}>
                <X className="h-4 w-4" />
              </IconButton>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.staffLogs.cashTip.form.dateLabel')}</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                />
                {errors.date && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.date}</p>}
              </div>

              <div>
                <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.staffLogs.cashTip.form.amountLabel')}</label>
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
                <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.staffLogs.cashTip.form.noteLabel')}</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                />
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
                {t('taxiq.staffLogs.cashTip.form.submit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

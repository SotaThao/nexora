import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Lock, Pencil, Plus, X } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { useTaxiqForm1099KReconciliation, useUpsertForm1099KAmount } from '../../../../data/hooks/useTaxiqForm1099K'
import { PAYMENT_PLATFORMS } from '../../../../data/repositories/taxiqForm1099K'
import type { Form1099KReconciliationRecord, PaymentPlatform } from '../../../../data/repositories/taxiqForm1099K'
import { isApiError } from '../../../../types/domain'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import { SkeletonList } from '../../../ui/skeleton'
import IconButton from '../../../ui/IconButton'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function platformLabelKey(platform: string) {
  const key = platform.charAt(0).toLowerCase() + platform.slice(1)
  return `taxiq.form1099kReconciliation.platform.${key}`
}

function varianceClass(variance: number) {
  if (variance === 0) {
    return 'text-emerald-700 dark:text-emerald-400'
  }
  return 'text-amber-700 dark:text-amber-400'
}

export default function Form1099KReconciliationView({
  staffTaxYearId,
  staffTaxYearStatus,
}: {
  staffTaxYearId: string
  staffTaxYearStatus: string
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const navigate = useNavigate()
  const listQuery = useTaxiqForm1099KReconciliation(staffTaxYearId)
  const upsertAmount = useUpsertForm1099KAmount()

  const isLocked = staffTaxYearStatus === 'Locked'
  const items = listQuery.data ?? []
  const usedPlatforms = new Set(items.map((item) => item.platform))
  const availablePlatforms = PAYMENT_PLATFORMS.filter((p) => !usedPlatforms.has(p))

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<Form1099KReconciliationRecord | null>(null)
  const [formPlatform, setFormPlatform] = useState<PaymentPlatform | ''>('')
  const [formAmount, setFormAmount] = useState('')
  const [formNote, setFormNote] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!isFormOpen) return
    if (editingRecord) {
      setFormPlatform(editingRecord.platform)
      setFormAmount(String(editingRecord.reportedAmount))
      setFormNote(editingRecord.varianceNote ?? '')
    } else {
      setFormPlatform(availablePlatforms[0] ?? '')
      setFormAmount('')
      setFormNote('')
    }
    setFormError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFormOpen, editingRecord])

  const openAddForm = () => {
    setEditingRecord(null)
    setIsFormOpen(true)
  }

  const openEditForm = (record: Form1099KReconciliationRecord) => {
    setEditingRecord(record)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingRecord(null)
  }

  const handleSubmit = async () => {
    if (!formPlatform) {
      setFormError(t('taxiq.form1099kReconciliation.form.platformRequired'))
      return
    }
    if (!formAmount || Number(formAmount) < 0) {
      setFormError(t('taxiq.form1099kReconciliation.form.amountRequired'))
      return
    }
    try {
      await upsertAmount.mutateAsync({
        staffTaxYearId,
        platform: formPlatform,
        reportedAmount: Number(formAmount),
        varianceNote: formNote.trim() || null,
      })
      showToast(t('taxiq.form1099kReconciliation.saveSuccess'), 'success')
      closeForm()
    } catch (err) {
      if (isApiError(err) && err.errorCode === 'TAXIQ_STAFF_TAX_YEAR_LOCKED') {
        showToast(t('taxiq.selfReportedIncome.lockedNotice'), 'error')
        closeForm()
        return
      }
      const i18nKey = isApiError(err) ? getErrorI18nKey(err.errorCode) : 'taxiq.form1099kReconciliation.errors.generic'
      setFormError(t(i18nKey))
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-nexoraText">{t('taxiq.form1099kReconciliation.title')}</h2>
          <p className="mt-1 text-xs text-nexoraMuted">{t('taxiq.form1099kReconciliation.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={openAddForm}
          disabled={isLocked || availablePlatforms.length === 0}
          className="inline-flex items-center gap-1.5 self-start rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white disabled:opacity-60 sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('taxiq.form1099kReconciliation.add')}
        </button>
      </div>

      {isLocked && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-nexoraBorder bg-nexoraCanvas px-3 py-2 text-xs font-semibold text-nexoraMuted">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          <span>{t('taxiq.selfReportedIncome.lockedNotice')}</span>
          <button
            type="button"
            onClick={() => navigate('/staff/taxiq/export')}
            className="ml-auto shrink-0 rounded-lg bg-nexoraBrand px-3 py-1.5 text-[11px] font-bold text-white"
          >
            {t('taxiq.deductionCenter.errors.lockedAction')}
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
            <tr>
              <th className="px-4 py-3">{t('taxiq.form1099kReconciliation.columns.platform')}</th>
              <th className="px-4 py-3">{t('taxiq.form1099kReconciliation.columns.selfReported')}</th>
              <th className="px-4 py-3">{t('taxiq.form1099kReconciliation.columns.reported1099k')}</th>
              <th className="px-4 py-3">{t('taxiq.form1099kReconciliation.columns.variance')}</th>
              <th className="px-4 py-3">{t('taxiq.form1099kReconciliation.columns.varianceNote')}</th>
              <th className="px-4 py-3 text-right">{t('taxiq.form1099kReconciliation.columns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {listQuery.isPending ? (
              <tr>
                <td colSpan={6} className="p-4">
                  <SkeletonList count={2} lines={1} />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center font-medium text-nexoraMuted">
                  {t('taxiq.form1099kReconciliation.emptyState')}
                </td>
              </tr>
            ) : (
              items.map((record) => (
                <tr key={record.id} className="border-t border-nexoraRule align-top">
                  <td className="px-4 py-3 font-bold text-nexoraText">{t(platformLabelKey(record.platform))}</td>
                  <td className="px-4 py-3 text-nexoraText">{formatCurrency(record.selfReportedAmount)}</td>
                  <td className="px-4 py-3 text-nexoraText">{formatCurrency(record.reportedAmount)}</td>
                  <td className={`px-4 py-3 font-bold ${varianceClass(record.variance)}`}>{formatCurrency(record.variance)}</td>
                  <td className="px-4 py-3 text-nexoraMuted">{record.varianceNote || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end">
                      {isLocked ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-nexoraBorder px-2 py-0.5 text-[10px] font-bold text-nexoraMuted">
                          <Lock className="h-3 w-3" />
                          {t('taxiq.selfReportedIncome.status.locked')}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openEditForm(record)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-nexoraBrand hover:underline"
                        >
                          <Pencil className="h-3 w-3" />
                          {t('taxiq.selfReportedIncome.edit')}
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

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
          <div className="nexora-modal-card max-w-md">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-nexoraText">
                {editingRecord ? t('taxiq.form1099kReconciliation.edit') : t('taxiq.form1099kReconciliation.add')}
              </h2>
              <IconButton label={t('common.cancel')} onClick={closeForm}>
                <X className="h-4 w-4" />
              </IconButton>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.form1099kReconciliation.form.platformLabel')}</label>
                <select
                  value={formPlatform}
                  onChange={(e) => setFormPlatform(e.target.value as PaymentPlatform)}
                  disabled={!!editingRecord}
                  className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm disabled:opacity-60"
                >
                  {!editingRecord && <option value="">{t('taxiq.form1099kReconciliation.form.platformPlaceholder')}</option>}
                  {(editingRecord ? [editingRecord.platform] : availablePlatforms).map((opt) => (
                    <option key={opt} value={opt}>
                      {t(platformLabelKey(opt))}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.form1099kReconciliation.form.amountLabel')}</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.form1099kReconciliation.form.varianceNoteLabel')}</label>
                <textarea
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  rows={3}
                  placeholder={t('taxiq.form1099kReconciliation.form.varianceNotePlaceholder')}
                  className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                />
              </div>

              {formError && <p className="text-xs font-semibold text-rose-500">{formError}</p>}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button type="button" onClick={closeForm} className="rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted">
                {t('taxiq.selfReportedIncome.form.back')}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={upsertAmount.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
              >
                {upsertAmount.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {t('taxiq.selfReportedIncome.form.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

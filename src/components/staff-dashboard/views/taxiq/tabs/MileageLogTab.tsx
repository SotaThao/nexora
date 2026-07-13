import { useState } from 'react'
import { Loader2, Plus, Trash2, X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import {
  useCreateMileageLog,
  useDeleteMileageLog,
  useTaxiqStaffMileageLogs,
  useUpdateMileageLog,
} from '../../../../../data/hooks/useTaxiqStaffLogs'
import type { MileageLogRecord } from '../../../../../data/repositories/taxiqStaffLogs'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'
import { SkeletonList } from '../../../../ui/skeleton'
import IconButton from '../../../../ui/IconButton'
import Tooltip from '../../../../ui/Tooltip'
import ConfirmModal from '../../../../dashboard/views/taxiq/modals/ConfirmModal'

const LOCKED_ERROR_CODE = 'TAXIQ_STAFF_TAX_YEAR_LOCKED'

interface FormErrors {
  date?: string
  miles?: string
}

interface FormState {
  date: string
  purpose: string
  startLocation: string
  endLocation: string
  miles: string
}

const EMPTY_FORM: FormState = { date: '', purpose: '', startLocation: '', endLocation: '', miles: '' }

function statusBadgeClass(status: string) {
  if (status === 'CPAReview') {
    return 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-400'
  }
  if (status === 'Ready') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400'
  }
  return 'border-nexoraBorder bg-nexoraCanvas text-nexoraMuted'
}

function statusLabelKey(status: string) {
  if (status === 'CPAReview') return 'taxiq.staffLogs.mileage.status.cpaReview'
  if (status === 'Ready') return 'taxiq.staffLogs.mileage.status.ready'
  return 'taxiq.staffLogs.mileage.status.draft'
}

export default function MileageLogTab({
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
  const listQuery = useTaxiqStaffMileageLogs(staffTaxYearId)
  const createMileageLog = useCreateMileageLog()
  const updateMileageLog = useUpdateMileageLog()
  const deleteMileageLog = useDeleteMileageLog()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingItem, setDeletingItem] = useState<MileageLogRecord | null>(null)

  const items = [...(listQuery.data ?? [])].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  const cpaReviewCount = items.filter((item) => item.status === 'CPAReview').length

  const openCreateModal = () => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().split('T')[0] })
    setErrors({})
    setIsModalOpen(true)
  }

  const openEditModal = (log: MileageLogRecord) => {
    setEditingId(log.id)
    setForm({
      date: log.date,
      purpose: log.purpose,
      startLocation: log.startLocation,
      endLocation: log.endLocation,
      miles: String(log.miles),
    })
    setErrors({})
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setErrors({})
  }

  const validate = (): boolean => {
    const nextErrors: FormErrors = {}
    if (!form.date) nextErrors.date = t('taxiq.staffLogs.mileage.form.dateRequired')
    if (form.miles === '' || Number(form.miles) < 0) nextErrors.miles = t('taxiq.staffLogs.mileage.form.milesRequired')
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setIsSubmitting(true)
    try {
      const payload = {
        date: form.date,
        purpose: form.purpose.trim() || null,
        startLocation: form.startLocation.trim() || null,
        endLocation: form.endLocation.trim() || null,
        miles: Number(form.miles),
      }
      if (editingId) {
        await updateMileageLog.mutateAsync({ id: editingId, staffTaxYearId, ...payload })
        showToast(t('taxiq.staffLogs.mileage.updateSuccess'), 'success')
      } else {
        await createMileageLog.mutateAsync({ staffTaxYearId, ...payload })
        showToast(t('taxiq.staffLogs.mileage.addSuccess'), 'success')
      }
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

  const handleDelete = async () => {
    if (!deletingItem) return
    try {
      await deleteMileageLog.mutateAsync({ id: deletingItem.id, staffTaxYearId })
      showToast(t('taxiq.staffLogs.mileage.deleteSuccess'), 'success')
      setDeletingItem(null)
    } catch (err) {
      if (isApiError(err) && err.errorCode === LOCKED_ERROR_CODE) {
        onLockedError()
        setDeletingItem(null)
        return
      }
      const i18nKey = isApiError(err) ? getErrorI18nKey(err.errorCode) : 'taxiq.staffLogs.errors.generic'
      showToast(t(i18nKey), 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-nexoraMuted">
          <span className="inline-flex items-center gap-1">
            {t('taxiq.staffLogs.mileage.totalItems', { count: items.length })}
            <Tooltip content={t('taxiq.staffLogs.tooltips.mileage')} />
          </span>
          {cpaReviewCount > 0 && (
            <span className="text-violet-600">{t('taxiq.staffLogs.mileage.cpaReviewCount', { count: cpaReviewCount })}</span>
          )}
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          disabled={isLocked}
          className="inline-flex items-center gap-1.5 self-start rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white disabled:opacity-60 sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('taxiq.staffLogs.mileage.addButton')}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
        <table className="w-full min-w-[820px] text-left text-xs">
          <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
            <tr>
              <th className="px-4 py-3">{t('taxiq.staffLogs.mileage.columns.date')}</th>
              <th className="px-4 py-3">{t('taxiq.staffLogs.mileage.columns.purpose')}</th>
              <th className="px-4 py-3">{t('taxiq.staffLogs.mileage.columns.route')}</th>
              <th className="px-4 py-3">{t('taxiq.staffLogs.mileage.columns.miles')}</th>
              <th className="px-4 py-3">{t('taxiq.staffLogs.mileage.columns.status')}</th>
              <th className="px-4 py-3">{t('taxiq.staffLogs.mileage.columns.actions')}</th>
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
                  {t('taxiq.staffLogs.mileage.emptyState')}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-nexoraRule align-top">
                  <td className="px-4 py-3 font-bold text-nexoraText">{item.date}</td>
                  <td className="px-4 py-3 text-nexoraMuted">{item.purpose || '—'}</td>
                  <td className="px-4 py-3 text-nexoraMuted">
                    {item.startLocation || '—'} → {item.endLocation || '—'}
                  </td>
                  <td className="px-4 py-3 text-nexoraText">{item.miles}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusBadgeClass(item.status)}`}
                      >
                        {t(statusLabelKey(item.status))}
                      </span>
                      {item.status === 'CPAReview' && (
                        <span className="text-[10px] text-nexoraMuted">{t('taxiq.staffLogs.mileage.cpaReviewExplanation')}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        disabled={isLocked}
                        className="rounded-lg border border-nexoraBorder px-3 py-1 text-[11px] font-bold text-nexoraText disabled:opacity-60"
                      >
                        {t('taxiq.staffLogs.mileage.editButton')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingItem(item)}
                        disabled={isLocked}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1 text-[11px] font-bold text-rose-600 disabled:opacity-60 dark:border-rose-500/30"
                      >
                        <Trash2 className="h-3 w-3" />
                        {t('taxiq.staffLogs.mileage.delete')}
                      </button>
                    </div>
                  </td>
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
                {editingId ? t('taxiq.staffLogs.mileage.editButton') : t('taxiq.staffLogs.mileage.addButton')}
              </h2>
              <IconButton label={t('common.cancel')} onClick={closeModal}>
                <X className="h-4 w-4" />
              </IconButton>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.staffLogs.mileage.form.dateLabel')}</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                />
                {errors.date && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.date}</p>}
              </div>

              <div>
                <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.staffLogs.mileage.form.purposeLabel')}</label>
                <input
                  type="text"
                  value={form.purpose}
                  onChange={(e) => setForm((prev) => ({ ...prev, purpose: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.staffLogs.mileage.form.startLocationLabel')}</label>
                  <input
                    type="text"
                    value={form.startLocation}
                    onChange={(e) => setForm((prev) => ({ ...prev, startLocation: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.staffLogs.mileage.form.endLocationLabel')}</label>
                  <input
                    type="text"
                    value={form.endLocation}
                    onChange={(e) => setForm((prev) => ({ ...prev, endLocation: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.staffLogs.mileage.form.milesLabel')}</label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={form.miles}
                  onChange={(e) => setForm((prev) => ({ ...prev, miles: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                />
                {errors.miles && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.miles}</p>}
              </div>

              <p className="text-[11px] font-semibold text-nexoraMuted">{t('taxiq.staffLogs.mileage.form.missingFieldsHint')}</p>
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
                {t('taxiq.staffLogs.mileage.form.submit')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        title={t('taxiq.staffLogs.mileage.delete')}
        message={t('taxiq.staffLogs.mileage.deleteConfirm')}
        confirmLabel={t('taxiq.staffLogs.mileage.delete')}
        isDangerous
        isPending={deleteMileageLog.isPending}
      />
    </div>
  )
}

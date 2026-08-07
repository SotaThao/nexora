import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useCreateEmployer, useUpdateEmployer } from '../../../../../data/hooks/useTaxiqEmployer'
import {
  DEPOSIT_SCHEDULES,
  EMPLOYER_EDITABLE_STATUSES,
  type DepositSchedule,
  type Employer,
  type EmployerEditableStatus,
} from '../../../../../data/repositories/taxiqEmployer'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'

type Props =
  | { mode: 'create'; businessId: string; onClose: () => void }
  | { mode: 'edit'; businessId: string; employer: Employer; onClose: () => void }

export default function AddEditEmployerModal(props: Props) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const createEmployer = useCreateEmployer()
  const updateEmployer = useUpdateEmployer(props.businessId)

  const isEdit = props.mode === 'edit'
  const employer = isEdit ? props.employer : null

  const [industry, setIndustry] = useState(employer?.industry ?? '')
  const [federalDepositSchedule, setFederalDepositSchedule] = useState<DepositSchedule>(
    (employer?.federalDepositSchedule as DepositSchedule) ?? 'Monthly',
  )
  const [enableStrictFinalization, setEnableStrictFinalization] = useState(employer?.enableStrictFinalization ?? false)
  // Degraded is compute-only and cannot be submitted — an employer currently Degraded defaults
  // this selector to Active (the status it will return to once registrations are complete).
  const [status, setStatus] = useState<EmployerEditableStatus>(
    employer && EMPLOYER_EDITABLE_STATUSES.includes(employer.status as EmployerEditableStatus)
      ? (employer.status as EmployerEditableStatus)
      : 'Active',
  )
  const [error, setError] = useState('')

  const isPending = createEmployer.isPending || updateEmployer.isPending

  const handleSubmit = async () => {
    if (isPending) return
    setError('')
    try {
      if (isEdit) {
        await updateEmployer.mutateAsync({
          employerId: props.employer.id,
          industry: industry.trim() || undefined,
          federalDepositSchedule,
          enableStrictFinalization,
          status,
        })
      } else {
        await createEmployer.mutateAsync({
          businessId: props.businessId,
          industry: industry.trim() || undefined,
          federalDepositSchedule,
          enableStrictFinalization,
        })
      }
      showToast(t('taxiq.employerRegistry.savedNotice'), 'success')
      props.onClose()
    } catch (err) {
      const fallback = t('taxiq.employerRegistry.errors.generic')
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
      <div className="nexora-modal-card max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-nexoraText">
            {isEdit ? t('taxiq.employerRegistry.editModalTitle') : t('taxiq.employerRegistry.addModalTitle')}
          </h2>
          <IconButton label={t('common.cancel')} onClick={props.onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto">
          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">
              {t('taxiq.employerRegistry.fields.industry')}
            </label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder={t('taxiq.employerRegistry.fields.industryPlaceholder')}
              className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">
              {t('taxiq.employerRegistry.fields.federalDepositSchedule')}
            </label>
            <select
              value={federalDepositSchedule}
              onChange={(e) => setFederalDepositSchedule(e.target.value as DepositSchedule)}
              className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-semibold"
            >
              {DEPOSIT_SCHEDULES.map((schedule) => (
                <option key={schedule} value={schedule}>
                  {t(`taxiq.employerRegistry.depositSchedules.${schedule}`)}
                </option>
              ))}
            </select>
          </div>

          {isEdit && (
            <div>
              <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                {t('taxiq.employerRegistry.fields.status')}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EmployerEditableStatus)}
                className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-semibold"
              >
                {EMPLOYER_EDITABLE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`taxiq.employerRegistry.statuses.${s}`)}
                  </option>
                ))}
              </select>
              {employer?.status === 'Degraded' && (
                <p className="mt-1 text-[11px] text-nexoraMuted">{t('taxiq.employerRegistry.fields.degradedNotice')}</p>
              )}
            </div>
          )}

          <label className="flex items-center gap-2 text-xs font-semibold text-nexoraText">
            <input
              type="checkbox"
              checked={enableStrictFinalization}
              onChange={(e) => setEnableStrictFinalization(e.target.checked)}
              className="h-4 w-4 rounded border-nexoraBorder"
            />
            {t('taxiq.employerRegistry.fields.enableStrictFinalization')}
          </label>

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={props.onClose} className="rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted">
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { useUpsertStaffW4 } from '../../../../data/hooks/useTaxiqStaffTaxYear'
import { FILING_STATUSES, type FilingStatus, type StaffTaxYear } from '../../../../data/repositories/taxiqStaffTaxYear'
import { isApiError } from '../../../../types/domain'
import { getErrorI18nKey } from '../../../../data/errorCodes'

const LOCKED_ERROR_CODE = 'TAXIQ_STAFF_TAX_YEAR_LOCKED'

interface FormState {
  filingStatus: FilingStatus
  step2MultipleJobs: boolean
  dependentsClaimed: string
  otherIncome: string
  deductions: string
  extraWithholdingPerPayPeriod: string
  residenceState: string
  workState: string
  stateExtraWithholding: string
}

function buildInitialForm(staffTaxYear: StaffTaxYear): FormState {
  return {
    filingStatus: staffTaxYear.filingStatus ?? 'Single',
    step2MultipleJobs: staffTaxYear.step2MultipleJobs,
    dependentsClaimed: staffTaxYear.dependentsClaimed !== null ? String(staffTaxYear.dependentsClaimed) : '0',
    otherIncome: staffTaxYear.otherIncome !== null ? String(staffTaxYear.otherIncome) : '',
    deductions: staffTaxYear.deductions !== null ? String(staffTaxYear.deductions) : '',
    extraWithholdingPerPayPeriod:
      staffTaxYear.extraWithholdingPerPayPeriod !== null ? String(staffTaxYear.extraWithholdingPerPayPeriod) : '0',
    residenceState: staffTaxYear.residenceState ?? '',
    workState: staffTaxYear.workState ?? '',
    stateExtraWithholding:
      staffTaxYear.stateExtraWithholding !== null ? String(staffTaxYear.stateExtraWithholding) : '0',
  }
}

// Self-service W-4 (US-027). Only account-holding Staff use this — local staff
// (no login) submit the same 7 fields via the secure invite link instead (US-028).
export default function StaffW4FormCard({ staffTaxYear }: { staffTaxYear: StaffTaxYear }) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const upsertW4 = useUpsertStaffW4()

  const isLocked = staffTaxYear.status !== 'Active'

  const [form, setForm] = useState<FormState>(() => buildInitialForm(staffTaxYear))
  const [error, setError] = useState('')

  useEffect(() => {
    setForm(buildInitialForm(staffTaxYear))
  }, [staffTaxYear])

  const handleSave = async () => {
    if (isLocked) return
    setError('')
    try {
      await upsertW4.mutateAsync({
        id: staffTaxYear.id,
        w4TaxYear: staffTaxYear.taxYear,
        filingStatus: form.filingStatus,
        step2MultipleJobs: form.step2MultipleJobs,
        dependentsClaimed: Number(form.dependentsClaimed) || 0,
        otherIncome: form.otherIncome.trim() === '' ? null : Number(form.otherIncome),
        deductions: form.deductions.trim() === '' ? null : Number(form.deductions),
        extraWithholdingPerPayPeriod: Number(form.extraWithholdingPerPayPeriod) || 0,
        residenceState: form.residenceState.trim(),
        workState: form.workState.trim(),
        stateExtraWithholding: Number(form.stateExtraWithholding) || 0,
      })
      showToast(t('taxiq.w4.savedNotice'), 'success')
    } catch (err) {
      if (isApiError(err) && err.errorCode === LOCKED_ERROR_CODE) {
        showToast(t('taxiq.w4.lockedNotice'), 'error')
        return
      }
      const fallback = t('taxiq.w4.errors.generic')
      const i18nKey = isApiError(err) ? getErrorI18nKey(err.errorCode) : null
      const translated = i18nKey ? t(i18nKey) : fallback
      setError(translated !== i18nKey ? translated : (isApiError(err) && err.message) || fallback)
    }
  }

  return (
    <div className="nexora-card p-6">
      <h2 className="text-nexoraText text-sm font-semibold leading-snug">{t('taxiq.w4.title')}</h2>
      <p className="mt-1 text-nexoraMuted text-[13px] font-normal leading-5">{t('taxiq.w4.description', { taxYear: staffTaxYear.taxYear })}</p>

      {isLocked && (
        <div className="mt-3 rounded-lg border border-nexoraBorder bg-nexoraCanvas px-3 py-2 text-xs font-semibold text-nexoraMuted">
          {t('taxiq.w4.lockedNotice')}
        </div>
      )}

      <fieldset disabled={isLocked} className="mt-4 space-y-3 disabled:opacity-60">
        <div>
          <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.w4.filingStatusLabel')}</label>
          <select
            value={form.filingStatus}
            onChange={(e) => setForm((prev) => ({ ...prev, filingStatus: e.target.value as FilingStatus }))}
            className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
          >
            {FILING_STATUSES.map((status) => (
              <option key={status} value={status}>{t(`taxiq.w4.filingStatuses.${status}`)}</option>
            ))}
          </select>
        </div>

        <label className="flex items-start gap-2 text-xs font-semibold text-nexoraText">
          <input
            type="checkbox"
            checked={form.step2MultipleJobs}
            onChange={(e) => setForm((prev) => ({ ...prev, step2MultipleJobs: e.target.checked }))}
            className="mt-0.5"
          />
          {t('taxiq.w4.step2MultipleJobsLabel')}
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.w4.dependentsClaimedLabel')}</label>
            <input
              type="number"
              min="0"
              value={form.dependentsClaimed}
              onChange={(e) => setForm((prev) => ({ ...prev, dependentsClaimed: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.w4.extraWithholdingLabel')}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.extraWithholdingPerPayPeriod}
              onChange={(e) => setForm((prev) => ({ ...prev, extraWithholdingPerPayPeriod: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.w4.otherIncomeLabel')}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.otherIncome}
              onChange={(e) => setForm((prev) => ({ ...prev, otherIncome: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.w4.deductionsLabel')}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.deductions}
              onChange={(e) => setForm((prev) => ({ ...prev, deductions: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.w4.residenceStateLabel')}</label>
            <input
              type="text"
              maxLength={2}
              value={form.residenceState}
              onChange={(e) => setForm((prev) => ({ ...prev, residenceState: e.target.value.toUpperCase() }))}
              placeholder={t('taxiq.w4.statePlaceholder')}
              className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm uppercase"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.w4.workStateLabel')}</label>
            <input
              type="text"
              maxLength={2}
              value={form.workState}
              onChange={(e) => setForm((prev) => ({ ...prev, workState: e.target.value.toUpperCase() }))}
              placeholder={t('taxiq.w4.statePlaceholder')}
              className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm uppercase"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.w4.stateExtraWithholdingLabel')}</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.stateExtraWithholding}
            onChange={(e) => setForm((prev) => ({ ...prev, stateExtraWithholding: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
          />
        </div>
      </fieldset>

      {error && <p className="mt-3 text-xs font-semibold text-rose-500">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={isLocked || upsertW4.isPending}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
      >
        {upsertW4.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {t('taxiq.w4.saveButton')}
      </button>
    </div>
  )
}

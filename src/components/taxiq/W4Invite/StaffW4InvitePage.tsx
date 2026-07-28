import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffW4InviteContext, useSubmitStaffW4ViaInvite } from '../../../data/hooks/useTaxiqStaffW4Invite'
import { FILING_STATUSES, type FilingStatus } from '../../../data/repositories/taxiqStaffTaxYear'
import { isApiError } from '../../../types/domain'
import LoadingScreen from '../../../app/LoadingScreen'

interface FormState {
  ssn: string
  ein: string
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

const EMPTY_FORM: FormState = {
  ssn: '',
  ein: '',
  filingStatus: 'Single',
  step2MultipleJobs: false,
  dependentsClaimed: '0',
  otherIncome: '',
  deductions: '',
  extraWithholdingPerPayPeriod: '0',
  residenceState: '',
  workState: '',
  stateExtraWithholding: '0',
}

/**
 * Public secure-link W-4 submission for local staff (no login account, US-028).
 * Deliberately does not call useAuth() or render the dashboard shell — token comes
 * from the URL query string only. Mirrors CpaViewerPage.tsx's shape and registered
 * outside RequireAuth at /w4-invite (see AppRouter.tsx).
 */
export default function StaffW4InvitePage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? undefined

  const contextQuery = useStaffW4InviteContext(token)
  const submitInvite = useSubmitStaffW4ViaInvite()

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [error, setError] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  if (!token) {
    return <W4InviteError message={t('taxiq.w4Invite.public.linkInvalid')} />
  }

  if (contextQuery.isLoading) {
    return <LoadingScreen />
  }

  if (contextQuery.isError || !contextQuery.data) {
    // Deliberately generic regardless of the underlying reason (missing / invalid /
    // expired / revoked / already-submitted) — same spirit as CpaViewerPage.
    return <W4InviteError message={t('taxiq.w4Invite.public.linkExpiredOrRevoked')} />
  }

  if (isSubmitted) {
    return <W4InviteSuccess businessName={contextQuery.data.businessName} />
  }

  const ctx = contextQuery.data

  const canSubmit =
    (form.ssn.trim().length > 0 || form.ein.trim().length > 0) &&
    form.residenceState.trim().length > 0 &&
    form.workState.trim().length > 0

  const handleSubmit = async () => {
    if (!canSubmit || submitInvite.isPending) return
    setError('')
    try {
      await submitInvite.mutateAsync({
        accessToken: token,
        ssn: form.ssn.trim() || undefined,
        ein: form.ein.trim() || undefined,
        w4TaxYear: ctx.taxYear,
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
      setIsSubmitted(true)
    } catch (err) {
      const fallback = t('taxiq.w4Invite.public.errors.generic')
      setError(isApiError(err) && err.message ? err.message : fallback)
    }
  }

  return (
    <div className="min-h-dvh bg-nexoraCanvas px-4 py-8">
      <div className="mx-auto max-w-lg space-y-4">
        <div className="rounded-2xl border border-nexoraBorder bg-white p-5 dark:bg-luxuryCoal">
          <h1 className="text-lg font-extrabold text-nexoraText">{t('taxiq.w4Invite.public.title')}</h1>
          <p className="mt-1 text-xs text-nexoraMuted">
            {t('taxiq.w4Invite.public.subtitle', {
              business: ctx.businessName,
              staff: ctx.staffDisplayName,
              taxYear: ctx.taxYear,
            })}
          </p>
        </div>

        <div className="rounded-2xl border border-nexoraBorder bg-white p-5 dark:bg-luxuryCoal">
          <h2 className="text-xs font-extrabold uppercase text-nexoraMuted">{t('taxiq.w4Invite.public.tinSectionTitle')}</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.taxProfile.ssnLabel')}</label>
              <input
                type="text"
                value={form.ssn}
                onChange={(e) => setForm((prev) => ({ ...prev, ssn: e.target.value }))}
                placeholder={t('taxiq.taxProfile.ssnPlaceholder')}
                className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.taxProfile.einLabel')}</label>
              <input
                type="text"
                value={form.ein}
                onChange={(e) => setForm((prev) => ({ ...prev, ein: e.target.value }))}
                placeholder={t('taxiq.taxProfile.einPlaceholder')}
                className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
              />
            </div>
          </div>

          <h2 className="mt-5 text-xs font-extrabold uppercase text-nexoraMuted">{t('taxiq.w4Invite.public.w4SectionTitle')}</h2>
          <div className="mt-3 space-y-3">
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
          </div>

          {error && <p className="mt-3 text-xs font-semibold text-rose-500">{error}</p>}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || submitInvite.isPending}
            className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-nexoraBrand px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60"
          >
            {submitInvite.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('taxiq.w4Invite.public.submitButton')}
          </button>
        </div>
      </div>
    </div>
  )
}

function W4InviteError({ message }: { message: string }) {
  const { t } = useTranslation()
  return (
    <div className="min-h-dvh flex items-center justify-center bg-nexoraCanvas px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-nexoraBorder bg-white dark:bg-luxuryCoal p-6 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-600">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-extrabold text-nexoraText">{t('taxiq.w4Invite.public.errorTitle')}</h1>
        <p className="mt-2 text-sm text-nexoraMuted leading-relaxed">{message}</p>
      </div>
    </div>
  )
}

function W4InviteSuccess({ businessName }: { businessName: string }) {
  const { t } = useTranslation()
  return (
    <div className="min-h-dvh flex items-center justify-center bg-nexoraCanvas px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-nexoraBorder bg-white dark:bg-luxuryCoal p-6 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-extrabold text-nexoraText">{t('taxiq.w4Invite.public.successTitle')}</h1>
        <p className="mt-2 text-sm text-nexoraMuted leading-relaxed">
          {t('taxiq.w4Invite.public.successMessage', { business: businessName })}
        </p>
      </div>
    </div>
  )
}

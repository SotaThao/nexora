import { useState } from 'react'
import { ArrowLeft, ArrowRight, Loader2, ShieldCheck } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { useCreateStaffTaxYear } from '../../../../data/hooks/useTaxiqStaffTaxYear'
import Tooltip from '../../../ui/Tooltip'

const CONTRACT_TYPE_OPTIONS = [
  { key: 'W2', labelKey: 'taxiq.staffOnboarding.step1.contractTypeW2', tooltipKey: 'taxiq.tooltips.w2' },
  { key: 'C1099', labelKey: 'taxiq.staffOnboarding.step1.contractType1099', tooltipKey: 'taxiq.tooltips.contractor1099' },
  { key: 'BoothRenter', labelKey: 'taxiq.staffOnboarding.step1.contractTypeBoothRenter', tooltipKey: 'taxiq.tooltips.boothRenter' },
]

const W9_STATUS_OPTIONS = [
  { key: 'NotRequired', labelKey: 'taxiq.staffOnboarding.step1.w9NotRequired', tooltipKey: 'taxiq.staffOnboarding.step1.w9NotRequiredTooltip' },
  { key: 'Pending', labelKey: 'taxiq.staffOnboarding.step1.w9Pending', tooltipKey: 'taxiq.staffOnboarding.step1.w9PendingTooltip' },
  { key: 'Received', labelKey: 'taxiq.staffOnboarding.step1.w9Received', tooltipKey: 'taxiq.staffOnboarding.step1.w9ReceivedTooltip' },
]

// Values match backend/src/Domain/Enums/TaxIq/TaxIqModule.cs exactly — same 4
// values the Owner side uses (minus PayoutTracking/TaxReminders, which have no
// Staff nav route). The BA doc's "Income Summary"/"Cash Tip Log"/"Tax Estimate"/
// "Year-End Package" wording doesn't map to a real enum value; those areas stay
// always-visible instead of gated. See design.md D3.
const MODULE_OPTIONS = [
  { key: 'DeductionTracking', labelKey: 'taxiq.onboarding.step3.deductionCenter', tooltipKey: 'taxiq.onboarding.step3.tooltips.deductionCenter' },
  { key: 'ReceiptManagement', labelKey: 'taxiq.onboarding.step3.receiptManagement', tooltipKey: 'taxiq.onboarding.step3.tooltips.receiptManagement' },
  { key: 'MileageLog', labelKey: 'taxiq.onboarding.step3.mileageLog', tooltipKey: 'taxiq.onboarding.step3.tooltips.mileageLog' },
  { key: 'CPAExport', labelKey: 'taxiq.onboarding.step3.cpaExport', tooltipKey: 'taxiq.onboarding.step3.tooltips.cpaExport' },
]

const TOTAL_STEPS = 3

export default function StaffTaxIqOnboardingWizard({ taxYear }: { taxYear: number }) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const createStaffTaxYear = useCreateStaffTaxYear()

  const [step, setStep] = useState(1)
  const [contractType, setContractType] = useState('W2')
  const [w9Status, setW9Status] = useState('NotRequired')
  const [officeSqFt, setOfficeSqFt] = useState('')
  const [totalHomeSqFt, setTotalHomeSqFt] = useState('')
  const [homeOfficeError, setHomeOfficeError] = useState('')
  const [enabledModules, setEnabledModules] = useState<string[]>([])
  const [duplicateError, setDuplicateError] = useState('')

  const toggleModule = (key: string) => {
    setEnabledModules((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key],
    )
  }

  const goNext = () => {
    if (
      step === 1 &&
      officeSqFt &&
      totalHomeSqFt &&
      Number(officeSqFt) > Number(totalHomeSqFt)
    ) {
      setHomeOfficeError(t('taxiq.staffOnboarding.step1.homeOfficeError'))
      return
    }
    setStep((s) => Math.min(TOTAL_STEPS, s + 1))
  }
  const goBack = () => setStep((s) => Math.max(1, s - 1))

  const handleSubmit = async () => {
    try {
      await createStaffTaxYear.mutateAsync({
        taxYear,
        contractType,
        w9Status,
        officeSqFt: officeSqFt ? Number(officeSqFt) : null,
        totalHomeSqFt: totalHomeSqFt ? Number(totalHomeSqFt) : null,
        enabledModules,
      })
    } catch (err: unknown) {
      const errorCode = (err as { errorCode?: string })?.errorCode
      if (errorCode === 'TAXIQ_STAFF_TAX_YEAR_ALREADY_EXISTS') {
        setDuplicateError(t('taxiq.staffOnboarding.errors.duplicateTaxYear'))
        setStep(1)
        return
      }
      showToast(t('taxiq.staffOnboarding.errors.generic'), 'error')
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-nexoraBrand/20 bg-nexoraBrandSoft p-4">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-nexoraBrand" />
        <p className="text-xs font-semibold text-nexoraText">{t('taxiq.staffOnboarding.privacyBanner')}</p>
      </div>

      <div className="mb-6 flex items-center gap-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              s <= step ? 'bg-gradient-to-r from-nexoraElectric to-nexoraViolet' : 'bg-nexoraBorder'
            }`}
          />
        ))}
      </div>

      <div className="nexora-card p-6">
        <h2 className="text-lg font-extrabold text-nexoraText">{t('taxiq.staffOnboarding.title')}</h2>

        {step === 1 && (
          <div className="mt-5 space-y-4">
            <h3 className="text-sm font-bold text-nexoraText">{t('taxiq.staffOnboarding.step1.title')}</h3>
            <div>
              <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.staffOnboarding.step1.contractTypeLabel')}</label>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {CONTRACT_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setContractType(opt.key)}
                    className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
                      contractType === opt.key
                        ? 'border-nexoraBrand bg-nexoraBrandSoft text-nexoraBrand'
                        : 'border-nexoraBorder text-nexoraMuted'
                    }`}
                  >
                    {t(opt.labelKey)}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[11px] font-medium text-nexoraMuted">
                {t(CONTRACT_TYPE_OPTIONS.find((o) => o.key === contractType)?.tooltipKey ?? '')}
              </p>
            </div>
            <div>
              <label className="text-xs font-bold text-nexoraMuted">
                <span className="inline-flex items-center gap-1">
                  {t('taxiq.staffOnboarding.step1.w9StatusLabel')}
                  <Tooltip content={t('taxiq.tooltips.w9')} />
                </span>
              </label>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {W9_STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setW9Status(opt.key)}
                    className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
                      w9Status === opt.key
                        ? 'border-nexoraBrand bg-nexoraBrandSoft text-nexoraBrand'
                        : 'border-nexoraBorder text-nexoraMuted'
                    }`}
                  >
                    {t(opt.labelKey)}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[11px] font-medium text-nexoraMuted">
                {t(W9_STATUS_OPTIONS.find((o) => o.key === w9Status)?.tooltipKey ?? '')}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-nexoraMuted">
                  <span className="inline-flex items-center gap-1">
                    {t('taxiq.staffOnboarding.step1.officeSqFtLabel')}
                    <Tooltip content={t('taxiq.staffOnboarding.step1.homeOfficeTooltip')} />
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={officeSqFt}
                  onChange={(e) => {
                    setOfficeSqFt(e.target.value)
                    setHomeOfficeError('')
                  }}
                  className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-nexoraMuted">
                  {t('taxiq.staffOnboarding.step1.totalHomeSqFtLabel')}
                </label>
                <input
                  type="number"
                  min="0"
                  value={totalHomeSqFt}
                  onChange={(e) => {
                    setTotalHomeSqFt(e.target.value)
                    setHomeOfficeError('')
                  }}
                  className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                />
              </div>
            </div>
            {homeOfficeError && <p className="text-xs font-semibold text-rose-500">{homeOfficeError}</p>}
            {duplicateError && <p className="text-xs font-semibold text-rose-500">{duplicateError}</p>}
          </div>
        )}

        {step === 2 && (
          <div className="mt-5 space-y-3">
            <h3 className="text-sm font-bold text-nexoraText">{t('taxiq.staffOnboarding.step2.title')}</h3>
            {MODULE_OPTIONS.map((mod) => (
              <label key={mod.key} className="flex items-center gap-2.5 text-sm font-semibold text-nexoraText">
                <input
                  type="checkbox"
                  checked={enabledModules.includes(mod.key)}
                  onChange={() => toggleModule(mod.key)}
                  className="h-4 w-4 rounded border-nexoraBorder"
                />
                <span className="inline-flex items-center gap-1">
                  {t(mod.labelKey)}
                  <Tooltip content={t(mod.tooltipKey)} />
                </span>
              </label>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="mt-5 space-y-2 text-sm">
            <h3 className="mb-2 text-sm font-bold text-nexoraText">{t('taxiq.staffOnboarding.step3.title')}</h3>
            <div className="flex justify-between">
              <span className="text-nexoraMuted">{t('taxiq.staffOnboarding.step3.reviewContractType')}</span>
              <span className="font-semibold">
                {t(CONTRACT_TYPE_OPTIONS.find((o) => o.key === contractType)?.labelKey ?? '')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-nexoraMuted">{t('taxiq.staffOnboarding.step3.reviewW9Status')}</span>
              <span className="font-semibold">
                {t(W9_STATUS_OPTIONS.find((o) => o.key === w9Status)?.labelKey ?? '')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-nexoraMuted">{t('taxiq.staffOnboarding.step3.reviewOfficeSqFt')}</span>
              <span className="font-semibold">{officeSqFt || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-nexoraMuted">{t('taxiq.staffOnboarding.step3.reviewTotalHomeSqFt')}</span>
              <span className="font-semibold">{totalHomeSqFt || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-nexoraMuted">{t('taxiq.staffOnboarding.step3.reviewModules')}</span>
              <span className="font-semibold text-right">
                {enabledModules.length ? enabledModules.join(', ') : '—'}
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted disabled:opacity-40"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('taxiq.staffOnboarding.back')}
          </button>

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white"
            >
              {t('taxiq.staffOnboarding.next')}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={createStaffTaxYear.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              {createStaffTaxYear.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {createStaffTaxYear.isPending ? t('taxiq.staffOnboarding.submitting') : t('taxiq.staffOnboarding.submit')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

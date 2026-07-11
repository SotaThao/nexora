import { useState } from 'react'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { useCreateOwnerTaxYear } from '../../../../data/hooks/useTaxiqOwnerTaxYear'
import type { OwnerTaxYearEmployeeTypeConfig } from '../../../../data/repositories/taxiqOwnerTaxYear'
import Tooltip from '../../../ui/Tooltip'

interface ModuleOption {
  key: string
  labelKey: string
  tooltipKey: string
}

// Values match backend/src/Domain/Enums/TaxIq/TaxIqModule.cs exactly — confirmed live via a
// 400 TAXIQ_INVALID_MODULE response when testing against guessed enum names.
const MODULE_OPTIONS: ModuleOption[] = [
  { key: 'DeductionTracking', labelKey: 'taxiq.onboarding.step3.deductionCenter', tooltipKey: 'taxiq.onboarding.step3.tooltips.deductionCenter' },
  { key: 'ReceiptManagement', labelKey: 'taxiq.onboarding.step3.receiptManagement', tooltipKey: 'taxiq.onboarding.step3.tooltips.receiptManagement' },
  { key: 'PayoutTracking', labelKey: 'taxiq.onboarding.step3.staffPayout', tooltipKey: 'taxiq.onboarding.step3.tooltips.staffPayout' },
  { key: 'TaxReminders', labelKey: 'taxiq.onboarding.step3.taxPaymentReminder', tooltipKey: 'taxiq.onboarding.step3.tooltips.taxPaymentReminder' },
  { key: 'CPAExport', labelKey: 'taxiq.onboarding.step3.cpaExport', tooltipKey: 'taxiq.onboarding.step3.tooltips.cpaExport' },
]

const TOTAL_STEPS = 4

export default function TaxIqOnboardingWizard({
  businessId,
  taxYear: defaultTaxYear,
}: {
  businessId: string
  taxYear: number
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const createOwnerTaxYear = useCreateOwnerTaxYear()

  const [step, setStep] = useState(1)
  const [salonName, setSalonName] = useState('')
  const [taxYear, setTaxYear] = useState<number>(defaultTaxYear)
  const [taxYearError, setTaxYearError] = useState('')
  const [employeeTypeConfig, setEmployeeTypeConfig] = useState<OwnerTaxYearEmployeeTypeConfig>({
    hasW2: false,
    hasContractor1099: false,
    hasBoothRenter: false,
  })
  const [enabledModules, setEnabledModules] = useState<string[]>([])

  const toggleModule = (key: string) => {
    setEnabledModules((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key],
    )
  }

  const goNext = () => {
    if (step === 3 && enabledModules.includes('CPAExport') && !taxYear) {
      setTaxYearError(t('taxiq.onboarding.step1.taxYearRequiredForCpaExport'))
      setStep(1)
      return
    }
    setStep((s) => Math.min(TOTAL_STEPS, s + 1))
  }

  const goBack = () => setStep((s) => Math.max(1, s - 1))

  const handleSubmit = async () => {
    try {
      await createOwnerTaxYear.mutateAsync({
        businessId,
        taxYear,
        salonName,
        employeeTypeConfig,
        enabledModules,
      })
    } catch (err: unknown) {
      const errorCode = (err as { errorCode?: string })?.errorCode
      if (errorCode === 'TAXIQ_OWNER_TAX_YEAR_ALREADY_EXISTS') {
        setTaxYearError(t('taxiq.onboarding.errors.duplicateTaxYear'))
        setStep(1)
        return
      }
      showToast(t('taxiq.onboarding.errors.generic'), 'error')
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
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
        <h2 className="text-lg font-extrabold text-nexoraText">{t('taxiq.onboarding.title')}</h2>

        {step === 1 && (
          <div className="mt-5 space-y-4">
            <h3 className="text-sm font-bold text-nexoraText">{t('taxiq.onboarding.step1.title')}</h3>
            <div>
              <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.onboarding.step1.salonNameLabel')}</label>
              <input
                type="text"
                value={salonName}
                onChange={(e) => setSalonName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-nexoraMuted">
                <span className="inline-flex items-center gap-1">
                  {t('taxiq.onboarding.step1.taxYearLabel')}
                  <Tooltip content={t('taxiq.onboarding.step1.taxYearTooltip')} />
                </span>
              </label>
              <input
                type="number"
                value={taxYear}
                onChange={(e) => {
                  setTaxYear(Number(e.target.value))
                  setTaxYearError('')
                }}
                className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
              />
              {taxYearError && <p className="mt-1 text-xs font-semibold text-rose-500">{taxYearError}</p>}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-5 space-y-4">
            <h3 className="text-sm font-bold text-nexoraText">
              <span className="inline-flex items-center gap-1">
                {t('taxiq.onboarding.step2.title')}
                <Tooltip content={t('taxiq.onboarding.step2.titleTooltip')} />
              </span>
            </h3>
            {([
              ['hasW2', 'taxiq.onboarding.step2.w2Label', 'taxiq.tooltips.w2'],
              ['hasContractor1099', 'taxiq.onboarding.step2.contractor1099Label', 'taxiq.tooltips.contractor1099'],
              ['hasBoothRenter', 'taxiq.onboarding.step2.boothRenterLabel', 'taxiq.tooltips.boothRenter'],
            ] as const).map(([field, labelKey, tooltipKey]) => (
              <label key={field} className="flex items-center gap-2.5 text-sm font-semibold text-nexoraText">
                <input
                  type="checkbox"
                  checked={employeeTypeConfig[field] ?? false}
                  onChange={(e) =>
                    setEmployeeTypeConfig((prev) => ({ ...prev, [field]: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-nexoraBorder"
                />
                {t(labelKey)}
                <Tooltip content={t(tooltipKey)} />
              </label>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="mt-5 space-y-3">
            <h3 className="text-sm font-bold text-nexoraText">{t('taxiq.onboarding.step3.title')}</h3>
            {MODULE_OPTIONS.map((mod) => (
              <label key={mod.key} className="flex items-center gap-2.5 text-sm font-semibold text-nexoraText">
                <input
                  type="checkbox"
                  checked={enabledModules.includes(mod.key)}
                  onChange={() => toggleModule(mod.key)}
                  className="h-4 w-4 rounded border-nexoraBorder"
                />
                {t(mod.labelKey)}
                <Tooltip content={t(mod.tooltipKey)} />
              </label>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="mt-5 space-y-2 text-sm">
            <h3 className="mb-2 text-sm font-bold text-nexoraText">{t('taxiq.onboarding.step4.title')}</h3>
            <div className="flex justify-between"><span className="text-nexoraMuted">{t('taxiq.onboarding.step4.reviewSalonName')}</span><span className="font-semibold">{salonName || '—'}</span></div>
            <div className="flex justify-between"><span className="text-nexoraMuted">{t('taxiq.onboarding.step4.reviewTaxYear')}</span><span className="font-semibold">{taxYear}</span></div>
            <div className="flex justify-between"><span className="text-nexoraMuted">{t('taxiq.onboarding.step4.reviewModules')}</span><span className="font-semibold text-right">{enabledModules.length ? enabledModules.join(', ') : '—'}</span></div>
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
            {t('taxiq.onboarding.back')}
          </button>

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white"
            >
              {t('taxiq.onboarding.next')}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={createOwnerTaxYear.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              {createOwnerTaxYear.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {createOwnerTaxYear.isPending ? t('taxiq.onboarding.submitting') : t('taxiq.onboarding.submit')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

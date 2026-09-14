import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, X } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import {
  useCreateSelfReportedIncome,
  useTaxiqSelfReportedIncomeDetail,
  useUpdateSelfReportedIncome,
} from '../../../../data/hooks/useTaxiqSelfReportedIncome'
import { isApiError } from '../../../../types/domain'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import ReceiptUploadStep from '../../../dashboard/views/taxiq/shared/ReceiptUploadStep'
import PeriodPicker, { defaultRangeForMode } from './shared/PeriodPicker'
import type { PeriodMode } from './shared/PeriodPicker'
import IconButton from '../../../ui/IconButton'
import { PAYMENT_PLATFORMS } from '../../../../data/repositories/taxiqForm1099K'

const LOCKED_ERROR_CODE = 'TAXIQ_STAFF_TAX_YEAR_LOCKED'

type StepId = 'basic' | 'details' | 'receipt'

const INCOME_TYPE_OPTIONS = ['CashFromClient', 'OtherSalonIncome', 'BoothRentFromSubRenter', 'Other'] as const

// Platform only makes sense for income received through a personal payment app (Cash App/
// Venmo/PayPal), i.e. the "Cash From Client" tip case from the BA doc's Chị Hoa example —
// Owner payroll income (Other Salon Income) or booth rent never flows through these apps.
const PLATFORM_ELIGIBLE_INCOME_TYPE = 'CashFromClient'

const INCOME_TYPE_TOOLTIP_KEYS: Record<string, string> = {
  CashFromClient: 'taxiq.selfReportedIncome.incomeTypeTooltips.cashFromClient',
  OtherSalonIncome: 'taxiq.selfReportedIncome.incomeTypeTooltips.otherSalonIncome',
  BoothRentFromSubRenter: 'taxiq.selfReportedIncome.incomeTypeTooltips.boothRentFromSubRenter',
}

interface BasicErrors {
  amount?: string
  source?: string
  date?: string
}

// BE added a `Day` enum member (2026-07-09) so new records carry an explicit
// periodType: 'Day'. Records created before that change still have periodType: null
// for the same "Per Transaction" case — both fall through to 'Day' here.
function periodTypeToMode(periodType: string | null): PeriodMode {
  if (periodType === 'Week' || periodType === 'Month' || periodType === 'Quarter' || periodType === 'Year') {
    return periodType
  }
  return 'Day'
}

// US-13: kept as a 3-step wizard for both Create and Edit (unlike the BA note's literal
// "reuse Step 1 + Step 2 only" wording for Edit) so a Staff can still attach a receipt to
// clear MissingReceipt/CPAReview while editing — matches the precedent already set by
// AddDeductionWizard's edit mode. See US-13-assumptions.md.
export default function SelfReportedIncomeWizard({
  staffTaxYearId,
  taxYear,
  editingId = null,
  onClose,
}: {
  staffTaxYearId: string
  taxYear: number
  editingId?: string | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const navigate = useNavigate()

  const isEditing = !!editingId
  const detailQuery = useTaxiqSelfReportedIncomeDetail(editingId ?? undefined)
  const createIncome = useCreateSelfReportedIncome()
  const updateIncome = useUpdateSelfReportedIncome()

  const [stepIndex, setStepIndex] = useState<number>(0)
  const [incomeId, setIncomeId] = useState<string | null>(editingId)
  const [receiptCount, setReceiptCount] = useState(0)
  const [periodMode, setPeriodMode] = useState<PeriodMode>('Day')
  const [transactionDate, setTransactionDate] = useState('')
  const [periodEndDate, setPeriodEndDate] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [source, setSource] = useState('')
  const [incomeType, setIncomeType] = useState('')
  const [incomeTypeNote, setIncomeTypeNote] = useState('')
  const [platform, setPlatform] = useState('')
  const [notes, setNotes] = useState('')
  const [basicErrors, setBasicErrors] = useState<BasicErrors>({})
  const [lockedNotice, setLockedNotice] = useState(false)
  const [isSubmittingStep, setIsSubmittingStep] = useState(false)
  const [isPrefilled, setIsPrefilled] = useState(!isEditing)

  useEffect(() => {
    if (!isEditing || isPrefilled || !detailQuery.data) return
    const detail = detailQuery.data
    setPeriodMode(periodTypeToMode(detail.periodType))
    setTransactionDate(detail.transactionDate)
    setPeriodEndDate(detail.periodEndDate)
    setAmount(String(detail.amount))
    setSource(detail.source)
    setIncomeType(detail.incomeType ?? '')
    setIncomeTypeNote(detail.incomeTypeNote ?? '')
    setNotes(detail.notes ?? '')
    setPlatform(detail.platform ?? '')
    setReceiptCount(detail.receipts.length)
    setIsPrefilled(true)
  }, [isEditing, isPrefilled, detailQuery.data])

  useEffect(() => {
    if (isEditing || transactionDate) return
    const range = defaultRangeForMode('Day', taxYear)
    setTransactionDate(range.transactionDate)
    setPeriodEndDate(range.periodEndDate)
  }, [isEditing, taxYear, transactionDate])

  const steps: StepId[] = ['basic', 'details', 'receipt']
  const currentStep = steps[stepIndex]

  const handleLockedError = (err: unknown) => {
    if (isApiError(err) && err.errorCode === LOCKED_ERROR_CODE) {
      setLockedNotice(true)
      showToast(t('taxiq.selfReportedIncome.lockedNotice'), 'error')
      return
    }
    const i18nKey = isApiError(err) ? getErrorI18nKey(err.errorCode) : 'taxiq.selfReportedIncome.errors.generic'
    showToast(t(i18nKey), 'error')
  }

  const validateBasic = (): boolean => {
    const errors: BasicErrors = {}
    if (!amount || Number(amount) <= 0) errors.amount = t('taxiq.selfReportedIncome.form.amountRequired')
    if (!source.trim()) errors.source = t('taxiq.selfReportedIncome.form.sourceRequired')
    if (!transactionDate) errors.date = t('taxiq.selfReportedIncome.form.dateRequired')
    setBasicErrors(errors)
    return Object.keys(errors).length === 0
  }

  const buildFields = () => ({
    amount: Number(amount),
    transactionDate,
    periodEndDate: periodMode === 'Day' ? null : periodEndDate,
    periodType: periodMode,
    source: source.trim(),
    incomeType: incomeType || null,
    incomeTypeNote: incomeType === 'Other' ? incomeTypeNote.trim() || null : null,
    notes: notes.trim() || null,
    platform: incomeType === PLATFORM_ELIGIBLE_INCOME_TYPE ? platform || null : null,
  })

  const handleBasicNext = async () => {
    if (!validateBasic()) return
    setIsSubmittingStep(true)
    try {
      const fields = buildFields()
      if (incomeId) {
        await updateIncome.mutateAsync({ id: incomeId, staffTaxYearId, ...fields })
      } else {
        const id = await createIncome.mutateAsync({ staffTaxYearId, ...fields })
        setIncomeId(id)
      }
      setStepIndex(1)
    } catch (err) {
      handleLockedError(err)
    } finally {
      setIsSubmittingStep(false)
    }
  }

  const handleDetailsNext = async () => {
    if (!incomeId) return
    setIsSubmittingStep(true)
    try {
      await updateIncome.mutateAsync({ id: incomeId, staffTaxYearId, ...buildFields() })
      setStepIndex(2)
    } catch (err) {
      handleLockedError(err)
    } finally {
      setIsSubmittingStep(false)
    }
  }

  const goBack = () => setStepIndex((i) => Math.max(0, i - 1))

  if (isEditing && !isPrefilled) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
        <div className="nexora-card w-full max-w-lg p-6 text-center text-sm text-nexoraMuted">
          {t('taxiq.selfReportedIncome.loading')}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-nexoraText text-base font-semibold leading-snug">
            {isEditing ? t('taxiq.selfReportedIncome.edit') : t('taxiq.selfReportedIncome.add')}
          </h2>
          <IconButton label={t('common.cancel')} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="mb-6 flex items-center gap-2">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= stepIndex ? 'bg-gradient-to-r from-nexoraElectric to-nexoraViolet' : 'bg-nexoraBorder'
              }`}
            />
          ))}
        </div>

        {lockedNotice && (
          <div className="mb-4 flex flex-col gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
            <span>{t('taxiq.selfReportedIncome.lockedNotice')}</span>
            <button
              type="button"
              onClick={() => navigate('/staff/taxiq/export')}
              className="self-start rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white"
            >
              {t('taxiq.deductionCenter.errors.lockedAction')}
            </button>
          </div>
        )}

        <div className="flex-1 space-y-4 overflow-y-auto">
          {currentStep === 'basic' && (
            <div className="space-y-4">
              <h3 className="text-nexoraText text-sm font-semibold leading-snug">{t('taxiq.selfReportedIncome.form.step1Title')}</h3>
              <PeriodPicker
                taxYear={taxYear}
                periodMode={periodMode}
                onPeriodModeChange={setPeriodMode}
                transactionDate={transactionDate}
                periodEndDate={periodEndDate}
                onRangeChange={(range) => {
                  setTransactionDate(range.transactionDate)
                  setPeriodEndDate(range.periodEndDate)
                }}
              />
              {basicErrors.date && <p className="text-xs font-semibold text-rose-500">{basicErrors.date}</p>}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.selfReportedIncome.form.amount')}</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                  />
                  {basicErrors.amount && <p className="mt-1 text-xs font-semibold text-rose-500">{basicErrors.amount}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.selfReportedIncome.form.source')}</label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                  />
                  {basicErrors.source && <p className="mt-1 text-xs font-semibold text-rose-500">{basicErrors.source}</p>}
                </div>
              </div>
            </div>
          )}

          {currentStep === 'details' && (
            <div className="space-y-4">
              <h3 className="text-nexoraText text-sm font-semibold leading-snug">{t('taxiq.selfReportedIncome.form.step2Title')}</h3>
              <div>
                <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.selfReportedIncome.form.incomeTypeLabel')}</label>
                <select
                  value={incomeType}
                  onChange={(e) => setIncomeType(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                >
                  <option value="">{t('taxiq.selfReportedIncome.form.incomeTypePlaceholder')}</option>
                  {INCOME_TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {t(`taxiq.selfReportedIncome.incomeType.${opt.charAt(0).toLowerCase()}${opt.slice(1)}`)}
                    </option>
                  ))}
                </select>
                {INCOME_TYPE_TOOLTIP_KEYS[incomeType] && (
                  <p className="mt-1 text-xs font-medium text-nexoraMuted">{t(INCOME_TYPE_TOOLTIP_KEYS[incomeType])}</p>
                )}
              </div>

              {incomeType === PLATFORM_ELIGIBLE_INCOME_TYPE && (
                <div>
                  <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.selfReportedIncome.form.platformLabel')}</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                  >
                    <option value="">{t('taxiq.selfReportedIncome.form.platformPlaceholder')}</option>
                    {PAYMENT_PLATFORMS.map((opt) => (
                      <option key={opt} value={opt}>
                        {t(`taxiq.form1099kReconciliation.platform.${opt.charAt(0).toLowerCase()}${opt.slice(1)}`)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {incomeType === 'Other' && (
                <div>
                  <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.selfReportedIncome.form.incomeTypeNote')}</label>
                  <input
                    type="text"
                    value={incomeTypeNote}
                    onChange={(e) => setIncomeTypeNote(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.selfReportedIncome.form.notes')}</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}

          {currentStep === 'receipt' && incomeId && (
            <div className="space-y-4">
              <div>
                <h3 className="mb-1 text-nexoraText text-sm font-semibold leading-snug">{t('taxiq.selfReportedIncome.form.step3Title')}</h3>
                <p className="text-xs text-nexoraMuted">{t('taxiq.selfReportedIncome.receiptOptional')}</p>
              </div>
              <ReceiptUploadStep
                staffTaxYearId={staffTaxYearId}
                selfReportedIncomeId={incomeId}
                receiptCount={receiptCount}
                onLinked={() => setReceiptCount((c) => c + 1)}
              />

              <div className="space-y-2 rounded-lg bg-nexoraCanvas px-3 py-2 text-xs">
                <div className="flex justify-between"><span className="text-nexoraMuted">{t('taxiq.selfReportedIncome.form.amount')}</span><span className="font-semibold text-nexoraText">{amount || '—'}</span></div>
                <div className="flex justify-between"><span className="text-nexoraMuted">{t('taxiq.selfReportedIncome.form.source')}</span><span className="font-semibold text-nexoraText">{source || '—'}</span></div>
                <div className="flex justify-between"><span className="text-nexoraMuted">{t('taxiq.selfReportedIncome.form.dateLabel')}</span><span className="font-semibold text-nexoraText">{transactionDate}{periodEndDate ? ` – ${periodEndDate}` : ''}</span></div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={stepIndex === 0}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-nexoraMuted disabled:opacity-40"
          >
            {t('taxiq.selfReportedIncome.form.back')}
          </button>

          {currentStep === 'basic' && (
            <button
              type="button"
              onClick={handleBasicNext}
              disabled={isSubmittingStep}
              className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              {isSubmittingStep && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t('taxiq.selfReportedIncome.form.next')}
            </button>
          )}

          {currentStep === 'details' && (
            <button
              type="button"
              onClick={handleDetailsNext}
              disabled={isSubmittingStep}
              className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              {isSubmittingStep && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t('taxiq.selfReportedIncome.form.next')}
            </button>
          )}

          {currentStep === 'receipt' && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-semibold text-white"
            >
              {t('taxiq.selfReportedIncome.form.save')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

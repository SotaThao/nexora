import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Loader2, X } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { useTaxiqDeductionCategories } from '../../../../data/hooks/useTaxiqDeductionCategories'
import {
  useCreateOwnerDeduction,
  useSubmitOwnerDeduction,
  useTaxiqOwnerDeductions,
  useUpdateOwnerDeduction,
} from '../../../../data/hooks/useTaxiqOwnerDeductions'
import { formatCurrency } from '../../utils'
import ReceiptUploadStep from './shared/ReceiptUploadStep'
import DeductionStatusBadge from './shared/DeductionStatusBadge'
import AiDeductionStatusBadge from './shared/AiDeductionStatusBadge'
import type { DeductionRecord } from '../../../../data/repositories/taxiqOwnerDeductions'

// D6/D8 (openspec/changes/integrate-taxiq-owner-deductions/design.md): the backend only
// evaluates AI status inside POST /submit, so "AI Review" can only be shown AFTER Submit —
// the ticket's literal step order (AI Review before Review & Save) is not achievable against
// the real API. Steps are reordered here: Review & Save (4) triggers Submit, then the AI
// result renders at step 5.
type StepId = 'details' | 'businessUse' | 'receipt' | 'review' | 'result'

interface Step1Errors {
  categoryId?: string
  description?: string
  amount?: string
  date?: string
}

const LOCKED_ERROR_CODE = 'TAXIQ_OWNER_TAX_YEAR_LOCKED'

export default function AddDeductionWizard({
  ownerTaxYearId,
  initialDeduction = null,
  onClose,
}: {
  ownerTaxYearId: string
  initialDeduction?: DeductionRecord | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const navigate = useNavigate()

  const categoriesQuery = useTaxiqDeductionCategories('Owner')
  const createDeduction = useCreateOwnerDeduction()
  const updateDeduction = useUpdateOwnerDeduction()
  const submitDeduction = useSubmitOwnerDeduction()
  const deductionsQuery = useTaxiqOwnerDeductions({ ownerTaxYearId })

  const [stepIndex, setStepIndex] = useState(0)
  const [deductionId, setDeductionId] = useState<string | null>(initialDeduction?.id ?? null)
  const [categoryId, setCategoryId] = useState(initialDeduction?.categoryId ?? '')
  const [description, setDescription] = useState(initialDeduction?.description ?? '')
  const [amount, setAmount] = useState(initialDeduction ? String(initialDeduction.amount) : '')
  const [date, setDate] = useState(initialDeduction?.date ?? '')
  const [vendorName, setVendorName] = useState(initialDeduction?.vendorName ?? '')
  const [businessUsePercent, setBusinessUsePercent] = useState(
    initialDeduction?.businessUsePercent != null ? String(initialDeduction.businessUsePercent) : '',
  )
  const [step1Errors, setStep1Errors] = useState<Step1Errors>({})
  const [lockedNotice, setLockedNotice] = useState(false)
  const [isSubmittingStep, setIsSubmittingStep] = useState(false)

  const categories = categoriesQuery.data ?? []
  const selectedCategory = categories.find((c) => c.id === categoryId)
  const needsBusinessUsePercent = !!selectedCategory?.requiresBusinessUsePercent

  const visibleSteps = useMemo<StepId[]>(() => {
    const steps: StepId[] = ['details']
    if (needsBusinessUsePercent) steps.push('businessUse')
    steps.push('receipt', 'review', 'result')
    return steps
  }, [needsBusinessUsePercent])

  const currentStep = visibleSteps[stepIndex]
  const submittedDeduction = deductionsQuery.data?.items.find((d) => d.id === deductionId) ?? null

  const goBack = () => setStepIndex((i) => Math.max(0, i - 1))

  const handleLockedError = (err: unknown) => {
    const errorCode = (err as { errorCode?: string })?.errorCode
    if (errorCode === LOCKED_ERROR_CODE) {
      setLockedNotice(true)
      showToast(t('taxiq.deductionCenter.errors.lockedMessage'), 'error')
      return true
    }
    showToast(t('taxiq.deductionCenter.errors.generic'), 'error')
    return false
  }

  const validateStep1 = (): boolean => {
    const errors: Step1Errors = {}
    if (!categoryId) errors.categoryId = t('taxiq.deductionCenter.wizard.step1.categoryRequired')
    if (!description.trim()) errors.description = t('taxiq.deductionCenter.wizard.step1.descriptionRequired')
    if (!amount || Number(amount) <= 0) errors.amount = t('taxiq.deductionCenter.wizard.step1.amountRequired')
    if (!date) errors.date = t('taxiq.deductionCenter.wizard.step1.dateRequired')
    setStep1Errors(errors)
    return Object.keys(errors).length === 0
  }

  const handleDetailsNext = async () => {
    if (!validateStep1()) return
    setIsSubmittingStep(true)
    try {
      const parsedBusinessUse = businessUsePercent ? Number(businessUsePercent) : null
      if (deductionId) {
        await updateDeduction.mutateAsync({
          id: deductionId,
          categoryId,
          description,
          amount: Number(amount),
          date,
          vendorName: vendorName || null,
          businessUsePercent: parsedBusinessUse,
        })
      } else {
        const id = await createDeduction.mutateAsync({
          ownerTaxYearId,
          categoryId,
          description,
          amount: Number(amount),
          date,
          vendorName: vendorName || null,
          businessUsePercent: parsedBusinessUse,
        })
        setDeductionId(id)
      }
      setStepIndex((i) => i + 1)
    } catch (err) {
      handleLockedError(err)
    } finally {
      setIsSubmittingStep(false)
    }
  }

  const handleBusinessUseNext = async () => {
    if (!deductionId) return
    setIsSubmittingStep(true)
    try {
      await updateDeduction.mutateAsync({
        id: deductionId,
        categoryId,
        description,
        amount: Number(amount),
        date,
        vendorName: vendorName || null,
        businessUsePercent: businessUsePercent ? Number(businessUsePercent) : null,
      })
      setStepIndex((i) => i + 1)
    } catch (err) {
      handleLockedError(err)
    } finally {
      setIsSubmittingStep(false)
    }
  }

  const handleSaveAsDraft = () => {
    onClose()
  }

  const handleSubmit = async () => {
    if (!deductionId) return
    setIsSubmittingStep(true)
    try {
      await submitDeduction.mutateAsync(deductionId)
      await deductionsQuery.refetch()
      setStepIndex((i) => i + 1)
    } catch (err) {
      handleLockedError(err)
    } finally {
      setIsSubmittingStep(false)
    }
  }

  const computedDeductibleAmount =
    amount && businessUsePercent ? (Number(amount) * Number(businessUsePercent)) / 100 : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-card w-full max-w-lg p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-nexoraText">{t('taxiq.deductionCenter.wizard.title')}</h2>
          <button type="button" onClick={onClose} className="nexora-icon-button" aria-label={t('common.cancel')}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-6 flex items-center gap-2">
          {visibleSteps.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= stepIndex ? 'bg-gradient-to-r from-nexoraElectric to-nexoraViolet' : 'bg-nexoraBorder'
              }`}
            />
          ))}
        </div>

        {lockedNotice && (
          <div className="mb-4 flex flex-col gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            <span>{t('taxiq.deductionCenter.errors.lockedMessage')}</span>
            <button
              type="button"
              onClick={() => navigate('/dashboard/taxiq/export')}
              className="self-start rounded-lg bg-rose-600 px-3 py-1.5 text-[11px] font-bold text-white"
            >
              {t('taxiq.deductionCenter.errors.lockedAction')}
            </button>
          </div>
        )}

        {currentStep === 'details' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-nexoraText">{t('taxiq.deductionCenter.wizard.step1.title')}</h3>

            {categoriesQuery.isError && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
                {t('taxiq.deductionCenter.errors.categoriesUnavailable')}
              </p>
            )}

            <div>
              <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.deductionCenter.wizard.step1.categoryLabel')}</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={categoriesQuery.isLoading || categoriesQuery.isError}
                className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
              >
                <option value="">{t('taxiq.deductionCenter.wizard.step1.categoryPlaceholder')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {step1Errors.categoryId && <p className="mt-1 text-xs font-semibold text-rose-500">{step1Errors.categoryId}</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.deductionCenter.wizard.step1.descriptionLabel')}</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
              />
              {step1Errors.description && <p className="mt-1 text-xs font-semibold text-rose-500">{step1Errors.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.deductionCenter.wizard.step1.amountLabel')}</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                />
                {step1Errors.amount && <p className="mt-1 text-xs font-semibold text-rose-500">{step1Errors.amount}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.deductionCenter.wizard.step1.dateLabel')}</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                />
                {step1Errors.date && <p className="mt-1 text-xs font-semibold text-rose-500">{step1Errors.date}</p>}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.deductionCenter.wizard.step1.vendorLabel')}</label>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}

        {currentStep === 'businessUse' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-nexoraText">{t('taxiq.deductionCenter.wizard.step2.title')}</h3>
            <div>
              <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.deductionCenter.wizard.step2.businessUsePercentLabel')}</label>
              <input
                type="number"
                min={0}
                max={100}
                value={businessUsePercent}
                onChange={(e) => setBusinessUsePercent(e.target.value)}
                className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-nexoraCanvas px-3 py-2 text-sm">
              <span className="text-nexoraMuted">{t('taxiq.deductionCenter.wizard.step2.computedDeductibleLabel')}</span>
              <span className="font-extrabold text-nexoraText">{formatCurrency(computedDeductibleAmount)}</span>
            </div>
          </div>
        )}

        {currentStep === 'receipt' && deductionId && (
          <div>
            <h3 className="mb-3 text-sm font-bold text-nexoraText">{t('taxiq.deductionCenter.wizard.step3.title')}</h3>
            <ReceiptUploadStep
              ownerTaxYearId={ownerTaxYearId}
              deductionRecordId={deductionId}
              receiptCount={submittedDeduction?.receiptCount ?? 0}
              onLinked={() => deductionsQuery.refetch()}
            />
          </div>
        )}

        {currentStep === 'review' && (
          <div className="space-y-2 text-sm">
            <h3 className="mb-2 text-sm font-bold text-nexoraText">{t('taxiq.deductionCenter.wizard.step4.title')}</h3>
            <div className="flex justify-between"><span className="text-nexoraMuted">{t('taxiq.deductionCenter.wizard.step4.reviewCategory')}</span><span className="font-semibold">{selectedCategory?.name ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-nexoraMuted">{t('taxiq.deductionCenter.wizard.step4.reviewDescription')}</span><span className="font-semibold">{description || '—'}</span></div>
            <div className="flex justify-between"><span className="text-nexoraMuted">{t('taxiq.deductionCenter.wizard.step4.reviewAmount')}</span><span className="font-semibold">{amount ? formatCurrency(Number(amount)) : '—'}</span></div>
            <div className="flex justify-between"><span className="text-nexoraMuted">{t('taxiq.deductionCenter.wizard.step4.reviewDate')}</span><span className="font-semibold">{date || '—'}</span></div>
            <div className="flex justify-between"><span className="text-nexoraMuted">{t('taxiq.deductionCenter.wizard.step4.reviewVendor')}</span><span className="font-semibold">{vendorName || '—'}</span></div>
            {needsBusinessUsePercent && (
              <div className="flex justify-between"><span className="text-nexoraMuted">{t('taxiq.deductionCenter.wizard.step4.reviewBusinessUsePercent')}</span><span className="font-semibold">{businessUsePercent ? `${businessUsePercent}%` : '—'}</span></div>
            )}
            <div className="flex justify-between"><span className="text-nexoraMuted">{t('taxiq.deductionCenter.wizard.step4.reviewReceipt')}</span><span className="font-semibold">{(submittedDeduction?.receiptCount ?? 0) > 0 ? t('taxiq.deductionCenter.wizard.step4.receiptYes') : t('taxiq.deductionCenter.wizard.step4.receiptNo')}</span></div>

            <p className="mt-3 rounded-lg bg-nexoraCanvas px-3 py-2 text-xs font-semibold text-nexoraMuted">
              {t('taxiq.deductionCenter.wizard.step4.disclaimer')}
            </p>
          </div>
        )}

        {currentStep === 'result' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-nexoraText">{t('taxiq.deductionCenter.wizard.step5.title')}</h3>
            {!submittedDeduction ? (
              <p className="text-xs text-nexoraMuted">{t('taxiq.deductionCenter.wizard.step5.analyzing')}</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <DeductionStatusBadge status={submittedDeduction.recordStatus} />
                  {submittedDeduction.aiDeductionStatus && (
                    <AiDeductionStatusBadge status={submittedDeduction.aiDeductionStatus} />
                  )}
                </div>
                {submittedDeduction.recordStatus === 'CPAReview' && (
                  <p className="text-xs text-nexoraMuted">{t('taxiq.deductionCenter.cpaReviewExplanation')}</p>
                )}
                {submittedDeduction.aiExplanation && (
                  <p className="rounded-lg bg-nexoraCanvas px-3 py-2 text-xs text-nexoraText">{submittedDeduction.aiExplanation}</p>
                )}
                {submittedDeduction.aiDeductionStatus === 'NotDeductible' && (
                  <p className="text-xs font-semibold text-rose-600">{t('taxiq.deductionCenter.notDeductibleNotice')}</p>
                )}
                <p className="text-xs font-semibold text-nexoraMuted">
                  {submittedDeduction.aiDisclaimer || t('taxiq.deductionCenter.aiDisclaimerFallback')}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          {currentStep !== 'result' ? (
            <button
              type="button"
              onClick={goBack}
              disabled={stepIndex === 0}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted disabled:opacity-40"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t('taxiq.deductionCenter.wizard.back')}
            </button>
          ) : <span />}

          {currentStep === 'details' && (
            <button
              type="button"
              onClick={handleDetailsNext}
              disabled={isSubmittingStep || categoriesQuery.isError}
              className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              {isSubmittingStep && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t('taxiq.deductionCenter.wizard.next')}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}

          {currentStep === 'businessUse' && (
            <button
              type="button"
              onClick={handleBusinessUseNext}
              disabled={isSubmittingStep}
              className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              {isSubmittingStep && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t('taxiq.deductionCenter.wizard.next')}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}

          {currentStep === 'receipt' && (
            <button
              type="button"
              onClick={() => setStepIndex((i) => i + 1)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white"
            >
              {t('taxiq.deductionCenter.wizard.next')}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}

          {currentStep === 'review' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveAsDraft}
                className="rounded-lg border border-nexoraBorder px-4 py-2 text-xs font-bold text-nexoraText"
              >
                {t('taxiq.deductionCenter.wizard.saveAsDraft')}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmittingStep}
                className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
              >
                {isSubmittingStep && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isSubmittingStep ? t('taxiq.deductionCenter.wizard.submitting') : t('taxiq.deductionCenter.wizard.submit')}
              </button>
            </div>
          )}

          {currentStep === 'result' && (
            <button
              type="button"
              onClick={onClose}
              className="ml-auto rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white"
            >
              {t('taxiq.deductionCenter.wizard.done')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

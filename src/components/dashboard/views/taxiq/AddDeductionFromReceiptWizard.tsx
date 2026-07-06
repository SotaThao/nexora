import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Upload, X } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { useTaxiqDeductionCategories } from '../../../../data/hooks/useTaxiqDeductionCategories'
import {
  useAnalyzeReceiptLineItems,
  useConfirmReceiptLineItems,
} from '../../../../data/hooks/useTaxiqOwnerDeductions'
import type { ConfirmedDeductionResult } from '../../../../data/repositories/taxiqOwnerDeductions'
import { formatCurrency } from '../../utils'
import DeductionStatusBadge from './shared/DeductionStatusBadge'
import AiDeductionStatusBadge from './shared/AiDeductionStatusBadge'

const LOCKED_ERROR_CODE = 'TAXIQ_OWNER_TAX_YEAR_LOCKED'

interface ReviewRow {
  keep: boolean
  description: string
  amount: string
  categoryId: string
  businessUsePercent: string
  suggestedCategoryName: string | null
}

type StepId = 'upload' | 'review' | 'result'

export default function AddDeductionFromReceiptWizard({
  ownerTaxYearId,
  onClose,
}: {
  ownerTaxYearId: string
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  const categoriesQuery = useTaxiqDeductionCategories('Owner')
  const categories = categoriesQuery.data ?? []
  const analyzeReceipt = useAnalyzeReceiptLineItems()
  const confirmReceipt = useConfirmReceiptLineItems()

  const [step, setStep] = useState<StepId>('upload')
  const [vendor, setVendor] = useState('')
  const [date, setDate] = useState('')
  const [s3Key, setS3Key] = useState('')
  const [fileName, setFileName] = useState('')
  const [truncated, setTruncated] = useState(false)
  const [rows, setRows] = useState<ReviewRow[]>([])
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({})
  const [lockedNotice, setLockedNotice] = useState(false)
  const [confirmedItems, setConfirmedItems] = useState<ConfirmedDeductionResult[]>([])

  const categoryById = (id: string) => categories.find((c) => c.id === id)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const result = await analyzeReceipt.mutateAsync({ ownerTaxYearId, file })
      setVendor(result.vendor ?? '')
      setDate(result.date ?? '')
      setS3Key(result.s3Key)
      setFileName(result.fileName)
      setTruncated(result.truncated)
      setRows(
        result.items.map((item) => ({
          keep: true,
          description: item.description,
          amount: item.amount != null ? String(item.amount) : '',
          categoryId: item.matchedCategoryId ?? '',
          businessUsePercent: '',
          suggestedCategoryName: item.suggestedCategoryName,
        })),
      )
      setStep('review')
    } catch {
      showToast(t('taxiq.deductionCenter.receiptWizard.upload.error'), 'error')
    }
  }

  const updateRow = (index: number, patch: Partial<ReviewRow>) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  const validateRows = (): boolean => {
    const errors: Record<number, string> = {}
    rows.forEach((row, i) => {
      if (!row.keep) return
      if (!row.categoryId) {
        errors[i] = t('taxiq.deductionCenter.receiptWizard.review.categoryRequired')
        return
      }
      if (!row.amount || Number(row.amount) <= 0) {
        errors[i] = t('taxiq.deductionCenter.receiptWizard.review.amountRequired')
        return
      }
      const category = categoryById(row.categoryId)
      if (category?.requiresBusinessUsePercent && !row.businessUsePercent) {
        errors[i] = t('taxiq.deductionCenter.receiptWizard.review.businessUsePercentRequired')
      }
    })
    setRowErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleConfirm = async () => {
    const keptRows = rows.filter((r) => r.keep)
    if (keptRows.length === 0) {
      showToast(t('taxiq.deductionCenter.receiptWizard.review.noItemsKept'), 'error')
      return
    }
    if (!validateRows()) return

    try {
      const result = await confirmReceipt.mutateAsync({
        ownerTaxYearId,
        s3Key,
        fileName,
        vendor: vendor || null,
        date,
        items: keptRows.map((row) => ({
          description: row.description,
          amount: Number(row.amount),
          categoryId: row.categoryId,
          businessUsePercent: row.businessUsePercent ? Number(row.businessUsePercent) : null,
        })),
      })
      setConfirmedItems(result.items)
      setStep('result')
    } catch (err) {
      const errorCode = (err as { errorCode?: string })?.errorCode
      if (errorCode === LOCKED_ERROR_CODE) {
        setLockedNotice(true)
        showToast(t('taxiq.deductionCenter.errors.lockedMessage'), 'error')
        return
      }
      showToast(t('taxiq.deductionCenter.errors.generic'), 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-nexoraText">{t('taxiq.deductionCenter.receiptWizard.title')}</h2>
          <button type="button" onClick={onClose} className="nexora-icon-button" aria-label={t('common.cancel')}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">

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

        {step === 'upload' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-nexoraText">{t('taxiq.deductionCenter.receiptWizard.upload.title')}</h3>
            <p className="text-xs text-nexoraMuted">{t('taxiq.deductionCenter.receiptWizard.upload.description')}</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf"
              className="sr-only"
              onChange={handleFileChange}
              disabled={analyzeReceipt.isPending}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={analyzeReceipt.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-nexoraBorder px-4 py-2 text-xs font-bold text-nexoraText disabled:opacity-60"
            >
              {analyzeReceipt.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {analyzeReceipt.isPending
                ? t('taxiq.deductionCenter.receiptWizard.upload.analyzing')
                : t('taxiq.deductionCenter.receiptWizard.upload.chooseFile')}
            </button>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-nexoraText">{t('taxiq.deductionCenter.receiptWizard.review.title')}</h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.deductionCenter.receiptWizard.review.vendorLabel')}</label>
                <input
                  type="text"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.deductionCenter.receiptWizard.review.dateLabel')}</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                />
              </div>
            </div>

            {truncated && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                {t('taxiq.deductionCenter.receiptWizard.review.truncatedNotice')}
              </p>
            )}
            {categoriesQuery.isError && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
                {t('taxiq.deductionCenter.errors.categoriesUnavailable')}
              </p>
            )}

            <div className="space-y-3">
              {rows.map((row, i) => {
                const category = categoryById(row.categoryId)
                return (
                  <div key={i} className={`rounded-lg border border-nexoraBorder p-3 ${row.keep ? '' : 'opacity-50'}`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={row.keep}
                        onChange={(e) => updateRow(i, { keep: e.target.checked })}
                        className="mt-1 h-4 w-4 rounded border-nexoraBorder"
                      />
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={row.description}
                          onChange={(e) => updateRow(i, { description: e.target.value })}
                          disabled={!row.keep}
                          placeholder={t('taxiq.deductionCenter.columns.description')}
                          className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                        />
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={row.amount}
                            onChange={(e) => updateRow(i, { amount: e.target.value })}
                            disabled={!row.keep}
                            placeholder={t('taxiq.deductionCenter.columns.amount')}
                            className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                          />
                          <select
                            value={row.categoryId}
                            onChange={(e) => updateRow(i, { categoryId: e.target.value, businessUsePercent: '' })}
                            disabled={!row.keep || categoriesQuery.isError}
                            className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                          >
                            <option value="">{t('taxiq.deductionCenter.receiptWizard.review.categoryPlaceholder')}</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        {!row.categoryId && row.suggestedCategoryName && (
                          <p className="text-[11px] text-nexoraMuted">
                            {t('taxiq.deductionCenter.receiptWizard.review.aiGuessHint', { category: row.suggestedCategoryName })}
                          </p>
                        )}
                        {category?.requiresBusinessUsePercent && (
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={row.businessUsePercent}
                            onChange={(e) => updateRow(i, { businessUsePercent: e.target.value })}
                            disabled={!row.keep}
                            placeholder={t('taxiq.deductionCenter.wizard.step2.businessUsePercentLabel')}
                            className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                          />
                        )}
                        {rowErrors[i] && <p className="text-xs font-semibold text-rose-500">{rowErrors[i]}</p>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {step === 'result' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-nexoraText">{t('taxiq.deductionCenter.receiptWizard.result.title')}</h3>
            {confirmedItems.map((item) => (
              <div key={item.deductionRecordId} className="rounded-lg border border-nexoraBorder p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-nexoraText">{item.description}</span>
                  <span className="text-sm font-extrabold text-nexoraText">{formatCurrency(item.deductibleAmount)}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <DeductionStatusBadge status={item.recordStatus} />
                  {item.aiDeductionStatus && <AiDeductionStatusBadge status={item.aiDeductionStatus} />}
                </div>
                {item.aiExplanation && <p className="mt-2 text-xs text-nexoraText">{item.aiExplanation}</p>}
                <p className="mt-2 text-[11px] font-semibold text-nexoraMuted">
                  {item.aiDisclaimer || t('taxiq.deductionCenter.aiDisclaimerFallback')}
                </p>
              </div>
            ))}
          </div>
        )}

        </div>

        <div className="mt-6 flex items-center justify-between">
          {step === 'review' ? (
            <button
              type="button"
              onClick={() => setStep('upload')}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t('taxiq.deductionCenter.wizard.back')}
            </button>
          ) : <span />}

          {step === 'review' && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirmReceipt.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              {confirmReceipt.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {confirmReceipt.isPending
                ? t('taxiq.deductionCenter.receiptWizard.review.confirming')
                : t('taxiq.deductionCenter.receiptWizard.review.confirmButton')}
            </button>
          )}

          {step === 'result' && (
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

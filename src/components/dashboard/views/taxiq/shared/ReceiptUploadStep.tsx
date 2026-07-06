import { useRef, useState } from 'react'
import { CheckCircle2, Loader2, Upload } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useUploadTaxiqReceipt, useLinkTaxiqReceiptToDeduction } from '../../../../../data/hooks/useTaxiqReceipts'

export default function ReceiptUploadStep({
  ownerTaxYearId,
  deductionRecordId,
  receiptCount,
  onLinked,
}: {
  ownerTaxYearId: string
  deductionRecordId: string
  receiptCount: number
  onLinked?: () => void
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const uploadReceipt = useUploadTaxiqReceipt()
  const linkReceipt = useLinkTaxiqReceiptToDeduction()
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')

  const isBusy = uploadReceipt.isPending || linkReceipt.isPending
  const hasReceipt = receiptCount > 0

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setFileName(file.name)
    try {
      const receiptId = await uploadReceipt.mutateAsync({ ownerTaxYearId, file })
      await linkReceipt.mutateAsync({ receiptId, deductionRecordId })
      showToast(t('taxiq.deductionCenter.wizard.step3.uploadSuccess'), 'success')
      onLinked?.()
    } catch {
      showToast(t('taxiq.deductionCenter.wizard.step3.uploadError'), 'error')
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-nexoraMuted">{t('taxiq.deductionCenter.wizard.step3.description')}</p>

      {hasReceipt && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          {t('taxiq.deductionCenter.wizard.step3.receiptAttached', { count: receiptCount })}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="sr-only"
        onChange={handleFileChange}
        disabled={isBusy}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isBusy}
        className="inline-flex items-center gap-1.5 rounded-lg border border-nexoraBorder px-4 py-2 text-xs font-bold text-nexoraText disabled:opacity-60"
      >
        {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {isBusy ? t('taxiq.deductionCenter.wizard.step3.uploading') : t('taxiq.deductionCenter.wizard.step3.chooseFile')}
      </button>
      {fileName && <p className="text-xs text-nexoraMuted">{fileName}</p>}

      <p className="text-xs text-nexoraMuted">{t('taxiq.deductionCenter.wizard.step3.skipNotice')}</p>
    </div>
  )
}

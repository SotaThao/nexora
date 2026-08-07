import { useRef, useState } from 'react'
import { CheckCircle2, Loader2, Upload, X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useUploadTaxiqReceipt } from '../../../../../data/hooks/useTaxiqReceipts'
import { useMarkTaxReminderPaid } from '../../../../../data/hooks/useTaxiqTaxReminders'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'

export default function MarkTaxReminderPaidModal({
  open,
  onClose,
  ownerTaxYearId,
  reminderId,
}: {
  open: boolean
  onClose: () => void
  ownerTaxYearId: string
  reminderId: string
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const uploadReceipt = useUploadTaxiqReceipt()
  const markPaid = useMarkTaxReminderPaid(ownerTaxYearId)
  const inputRef = useRef<HTMLInputElement>(null)

  const [receiptId, setReceiptId] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')

  if (!open) return null

  const isBusy = uploadReceipt.isPending || markPaid.isPending

  const handleClose = () => {
    setReceiptId(null)
    setFileName('')
    setError('')
    onClose()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setFileName(file.name)
    setError('')
    try {
      const uploadedId = await uploadReceipt.mutateAsync({ ownerTaxYearId, file })
      setReceiptId(uploadedId)
    } catch {
      setError(t('taxiq.reminders.markPaidModal.errors.uploadFailed'))
    }
  }

  const handleSubmit = async () => {
    if (isBusy) return
    setError('')
    try {
      await markPaid.mutateAsync({ reminderId, paymentProofReceiptId: receiptId ?? undefined })
      showToast(t('taxiq.reminders.markPaidModal.success'), 'success')
      handleClose()
    } catch (err) {
      const fallback = t('taxiq.reminders.markPaidModal.errors.generic')
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
          <h2 className="text-sm font-extrabold text-nexoraText">{t('taxiq.reminders.markPaidModal.modalTitle')}</h2>
          <IconButton label={t('common.cancel')} onClick={handleClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto">
          <p className="text-xs text-nexoraMuted">{t('taxiq.reminders.markPaidModal.description')}</p>

          {receiptId && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              {t('taxiq.reminders.markPaidModal.receiptAttached')}
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
            {uploadReceipt.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {uploadReceipt.isPending ? t('taxiq.reminders.markPaidModal.uploading') : t('taxiq.reminders.markPaidModal.chooseFile')}
          </button>
          {fileName && <p className="text-xs text-nexoraMuted">{fileName}</p>}

          <p className="text-xs text-nexoraMuted">{t('taxiq.reminders.markPaidModal.skipNotice')}</p>

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isBusy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {markPaid.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('taxiq.reminders.markPaidModal.confirmButton')}
          </button>
        </div>
      </div>
    </div>
  )
}

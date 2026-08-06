import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useResendForm1099NecCopy, useSendForm1099NecCopy } from '../../../../../data/hooks/useTaxiqForm1099Nec'
import {
  FORM_1099NEC_EXPIRY_DAYS,
  type Form1099NecExpiryDays,
  type Form1099NecListItem,
} from '../../../../../data/repositories/taxiqForm1099Nec'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'

export default function SendForm1099NecCopyModal({
  open,
  onClose,
  form,
  ownerTaxYearId,
}: {
  open: boolean
  onClose: () => void
  form: Form1099NecListItem
  ownerTaxYearId?: string
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const sendCopy = useSendForm1099NecCopy(ownerTaxYearId)
  const resendCopy = useResendForm1099NecCopy(ownerTaxYearId)

  const isAlreadyDelivered = form.status === 'CopyDelivered'
  const [expiryDays, setExpiryDays] = useState<Form1099NecExpiryDays>(FORM_1099NEC_EXPIRY_DAYS[1])
  const [includePdf, setIncludePdf] = useState(false)
  const [isCorrectedCopy, setIsCorrectedCopy] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  const isPending = sendCopy.isPending || resendCopy.isPending

  const handleClose = () => {
    setExpiryDays(FORM_1099NEC_EXPIRY_DAYS[1])
    setIncludePdf(false)
    setIsCorrectedCopy(false)
    setError('')
    onClose()
  }

  const handleSubmit = async () => {
    if (isPending) return
    setError('')
    try {
      if (isAlreadyDelivered && !isCorrectedCopy) {
        await resendCopy.mutateAsync({ id: form.id, params: { expiryDays, includePdf } })
        showToast(t('taxiq.form1099nec.sendCopy.resendSuccess'), 'success')
      } else {
        await sendCopy.mutateAsync({ id: form.id, params: { expiryDays, includePdf, isCorrectedCopy } })
        showToast(t('taxiq.form1099nec.sendCopy.success'), 'success')
      }
      handleClose()
    } catch (err) {
      const fallback = t('taxiq.form1099nec.sendCopy.errors.generic')
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
      <div className="nexora-modal-card max-w-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-nexoraText">{t('taxiq.form1099nec.sendCopy.modalTitle')}</h2>
          <IconButton label={t('common.cancel')} onClick={handleClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto">
          <p className="text-xs font-semibold text-nexoraText">
            {form.workerName} — {form.workerEmail}
          </p>

          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">
              {t('taxiq.form1099nec.sendCopy.expiryDaysLabel')}
            </label>
            <div className="flex flex-wrap gap-2">
              {FORM_1099NEC_EXPIRY_DAYS.map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setExpiryDays(days)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
                    expiryDays === days
                      ? 'border-nexoraBrand bg-nexoraBrand text-white'
                      : 'border-nexoraBorder text-nexoraText'
                  }`}
                >
                  {t('taxiq.form1099nec.sendCopy.expiryDaysOption', { count: days })}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-nexoraText">
            <input type="checkbox" checked={includePdf} onChange={(e) => setIncludePdf(e.target.checked)} />
            {t('taxiq.form1099nec.sendCopy.includePdfLabel')}
          </label>

          {isAlreadyDelivered && (
            <label className="flex items-center gap-2 text-xs font-bold text-nexoraText">
              <input
                type="checkbox"
                checked={isCorrectedCopy}
                onChange={(e) => setIsCorrectedCopy(e.target.checked)}
              />
              {t('taxiq.form1099nec.sendCopy.correctedCopyLabel')}
            </label>
          )}

          {isAlreadyDelivered && !isCorrectedCopy && (
            <p className="text-[11px] font-medium text-nexoraMuted">
              {t('taxiq.form1099nec.sendCopy.resendHint')}
            </p>
          )}

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={handleClose} className="rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted">
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('taxiq.form1099nec.sendCopy.submitButton')}
          </button>
        </div>
      </div>
    </div>
  )
}

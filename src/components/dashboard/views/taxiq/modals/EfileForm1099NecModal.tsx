import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useEfileForm1099Nec } from '../../../../../data/hooks/useTaxiqForm1099Nec'
import type { Form1099NecListItem } from '../../../../../data/repositories/taxiqForm1099Nec'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'

export default function EfileForm1099NecModal({
  open,
  onClose,
  items,
  ownerTaxYearId,
}: {
  open: boolean
  onClose: () => void
  items: Form1099NecListItem[]
  ownerTaxYearId?: string
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const efile = useEfileForm1099Nec(ownerTaxYearId)

  const [selectedIds, setSelectedIds] = useState<string[]>(items.map((i) => i.id))
  const [merchantApprovalConfirmed, setMerchantApprovalConfirmed] = useState(false)
  const [cpaReviewConfirmed, setCpaReviewConfirmed] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  const canSubmit = selectedIds.length > 0 && merchantApprovalConfirmed && cpaReviewConfirmed

  const toggleId = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleClose = () => {
    setSelectedIds(items.map((i) => i.id))
    setMerchantApprovalConfirmed(false)
    setCpaReviewConfirmed(false)
    setError('')
    onClose()
  }

  const handleSubmit = async () => {
    if (!canSubmit || efile.isPending) return
    setError('')
    try {
      await efile.mutateAsync({
        form1099NecIds: selectedIds,
        merchantApprovalConfirmed,
        cpaReviewConfirmed,
      })
      showToast(t('taxiq.form1099nec.efile.success'), 'success')
      handleClose()
    } catch (err) {
      const fallback = t('taxiq.form1099nec.efile.errors.generic')
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
          <h2 className="text-sm font-extrabold text-nexoraText">{t('taxiq.form1099nec.efile.modalTitle')}</h2>
          <IconButton label={t('common.cancel')} onClick={handleClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto">
          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">
              {t('taxiq.form1099nec.efile.workersLabel')}
            </label>
            <div className="space-y-1.5">
              {items.map((item) => (
                <label key={item.id} className="flex items-center gap-2 text-xs font-semibold text-nexoraText">
                  <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleId(item.id)} />
                  {item.workerName} — {item.workerEmail}
                </label>
              ))}
              {items.length === 0 && (
                <p className="text-xs font-medium text-nexoraMuted">{t('taxiq.form1099nec.efile.noneDelivered')}</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-nexoraBorder p-3 space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-nexoraText">
              <input
                type="checkbox"
                checked={merchantApprovalConfirmed}
                onChange={(e) => setMerchantApprovalConfirmed(e.target.checked)}
              />
              {t('taxiq.form1099nec.efile.merchantApprovalLabel')}
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-nexoraText">
              <input
                type="checkbox"
                checked={cpaReviewConfirmed}
                onChange={(e) => setCpaReviewConfirmed(e.target.checked)}
              />
              {t('taxiq.form1099nec.efile.cpaReviewLabel')}
            </label>
          </div>

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={handleClose} className="rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted">
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || efile.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {efile.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('taxiq.form1099nec.efile.submitButton')}
          </button>
        </div>
      </div>
    </div>
  )
}

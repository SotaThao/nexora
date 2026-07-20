import { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useDisputeStaffPayout } from '../../../../../data/hooks/useTaxiqStaffPayouts'
import type { StaffPendingPayout } from '../../../../../data/repositories/taxiqStaffPayouts'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'

// Backend DisputePayoutCommandValidator caps StaffDisputeNote at 1000 chars.
const DISPUTE_NOTE_MAX_LENGTH = 1000

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

export default function DisputePayoutModal({
  open,
  onClose,
  onSuccess,
  payout,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  payout: StaffPendingPayout
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const disputePayout = useDisputeStaffPayout()

  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setAmount('')
    setNote('')
    setError('')
  }, [open, payout.id])

  if (!open) return null

  const parsedAmount = Number(amount)
  const canSubmit = amount.trim().length > 0 && parsedAmount > 0 && note.trim().length > 0

  const handleClose = () => {
    setError('')
    onClose()
  }

  const handleSubmit = async () => {
    if (!canSubmit || disputePayout.isPending) return
    setError('')
    try {
      await disputePayout.mutateAsync({
        payoutRecordId: payout.id,
        staffDisputeAmount: parsedAmount,
        staffDisputeNote: note.trim(),
      })
      showToast(t('taxiq.staffPayoutConfirmation.dispute.success'), 'success')
      onSuccess()
      handleClose()
    } catch (err) {
      const fallback = t('taxiq.staffPayoutConfirmation.errors.generic')
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
          <h2 className="text-sm font-extrabold text-nexoraText">{t('taxiq.staffPayoutConfirmation.dispute.modalTitle')}</h2>
          <IconButton label={t('common.cancel')} onClick={handleClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto">
          <div className="nexora-card p-3">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-nexoraMuted">
              {t('taxiq.staffPayoutConfirmation.dispute.ownerEnteredLabel')}
            </div>
            <div className="mt-1 grid grid-cols-1 gap-x-3 gap-y-1 text-[11px] text-nexoraMuted sm:grid-cols-2">
              <div>{t('taxiq.staffPayoutConfirmation.columns.servicePayout')}: {formatCurrency(payout.servicePayout)}</div>
              <div>{t('taxiq.staffPayoutConfirmation.columns.tip')}: {formatCurrency(payout.totalTip)}</div>
              <div>{t('taxiq.staffPayoutConfirmation.columns.bonus')}: {formatCurrency(payout.bonus)}</div>
              <div>{t('taxiq.staffPayoutConfirmation.columns.reimbursement')}: {formatCurrency(payout.reimbursement)}</div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">
              {t('taxiq.staffPayoutConfirmation.dispute.amountLabel')}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t('taxiq.staffPayoutConfirmation.dispute.amountPlaceholder')}
              className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">
              {t('taxiq.staffPayoutConfirmation.dispute.noteLabel')}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={DISPUTE_NOTE_MAX_LENGTH}
              placeholder={t('taxiq.staffPayoutConfirmation.dispute.notePlaceholder')}
              className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
            />
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
            disabled={!canSubmit || disputePayout.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {disputePayout.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('taxiq.staffPayoutConfirmation.dispute.submitButton')}
          </button>
        </div>
      </div>
    </div>
  )
}

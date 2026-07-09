import { useEffect, useState } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useResolvePayoutDispute } from '../../../../../data/hooks/useTaxiqOwnerPayouts'
import type { DisputedPayout, DisputeResolution } from '../../../../../data/repositories/taxiqOwnerPayouts'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'
import { formatCurrency } from '../../../utils'

export default function ResolveDisputeModal({
  open,
  onClose,
  ownerTaxYearId,
  dispute,
}: {
  open: boolean
  onClose: () => void
  ownerTaxYearId: string
  dispute: DisputedPayout
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const resolveDispute = useResolvePayoutDispute(ownerTaxYearId)

  const [resolution, setResolution] = useState<DisputeResolution>('Approve')
  const [note, setNote] = useState('')
  const [adjustedServicePayout, setAdjustedServicePayout] = useState('')
  const [adjustedTip, setAdjustedTip] = useState('')
  const [adjustedBonus, setAdjustedBonus] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setResolution('Approve')
    setNote('')
    setAdjustedServicePayout('')
    setAdjustedTip('')
    setAdjustedBonus('')
    setError('')
  }, [open, dispute.id])

  if (!open) return null

  const hasAtLeastOneAdjustedField =
    adjustedServicePayout.trim().length > 0 || adjustedTip.trim().length > 0 || adjustedBonus.trim().length > 0

  const canSubmit =
    note.trim().length > 0 && (resolution !== 'Adjust' || hasAtLeastOneAdjustedField)

  const handleClose = () => {
    setError('')
    onClose()
  }

  const handleSubmit = async () => {
    if (!canSubmit || resolveDispute.isPending) return
    setError('')
    try {
      await resolveDispute.mutateAsync({
        payoutRecordId: dispute.id,
        resolution,
        ownerResolutionNote: note.trim(),
        adjustedServicePayout: adjustedServicePayout.trim() ? Number(adjustedServicePayout) : null,
        adjustedTip: adjustedTip.trim() ? Number(adjustedTip) : null,
        adjustedBonus: adjustedBonus.trim() ? Number(adjustedBonus) : null,
      })
      showToast(t('taxiq.payoutCenter.resolveDispute.success'), 'success')
      handleClose()
    } catch (err) {
      const fallback = t('taxiq.payoutCenter.resolveDispute.errors.generic')
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
          <h2 className="text-sm font-extrabold text-nexoraText">{t('taxiq.payoutCenter.resolveDispute.modalTitle')}</h2>
          <IconButton label={t('common.cancel')} onClick={handleClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="nexora-card p-3">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-nexoraMuted">
                {t('taxiq.payoutCenter.resolveDispute.ownerEnteredLabel')}
              </div>
              <div className="mt-1 text-sm font-bold text-nexoraText">{formatCurrency(dispute.grossPayout)}</div>
              <div className="text-[11px] text-nexoraMuted">
                {t('taxiq.payoutCenter.form.servicePayoutLabel')}: {formatCurrency(dispute.servicePayout)} ·{' '}
                {t('taxiq.payoutCenter.form.tipLabel')}: {formatCurrency(dispute.tip)} ·{' '}
                {t('taxiq.payoutCenter.form.bonusLabel')}: {formatCurrency(dispute.bonus)}
              </div>
            </div>
            <div className="nexora-card p-3">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-nexoraMuted">
                {t('taxiq.payoutCenter.resolveDispute.staffReportedLabel')}
              </div>
              <div className="mt-1 text-sm font-bold text-nexoraText">{formatCurrency(dispute.staffDisputeAmount)}</div>
              <div className="text-[11px] text-nexoraMuted">{dispute.staffDisputeNote}</div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">
              {t('taxiq.payoutCenter.resolveDispute.resolutionLabel')}
            </label>
            <div className="flex flex-wrap gap-2">
              {(['Approve', 'Adjust', 'Reject'] as DisputeResolution[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setResolution(option)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
                    resolution === option
                      ? 'border-nexoraBrand bg-nexoraBrand text-white'
                      : 'border-nexoraBorder text-nexoraText'
                  }`}
                >
                  {t(`taxiq.payoutCenter.resolveDispute.resolutions.${option}`)}
                </button>
              ))}
            </div>
            {resolution === 'Adjust' && (
              <p className="mt-1 text-[11px] font-medium text-nexoraMuted">
                {t('taxiq.payoutCenter.resolveDispute.adjustTooltip')}
              </p>
            )}
          </div>

          {resolution === 'Adjust' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                  {t('taxiq.payoutCenter.form.servicePayoutLabel')}
                </label>
                <input
                  type="number"
                  min="0"
                  value={adjustedServicePayout}
                  onChange={(e) => setAdjustedServicePayout(e.target.value)}
                  className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                  {t('taxiq.payoutCenter.form.tipLabel')}
                </label>
                <input
                  type="number"
                  min="0"
                  value={adjustedTip}
                  onChange={(e) => setAdjustedTip(e.target.value)}
                  className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                  {t('taxiq.payoutCenter.form.bonusLabel')}
                </label>
                <input
                  type="number"
                  min="0"
                  value={adjustedBonus}
                  onChange={(e) => setAdjustedBonus(e.target.value)}
                  className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                />
              </div>
              {!hasAtLeastOneAdjustedField && (
                <p className="col-span-full text-[11px] font-semibold text-amber-600">
                  {t('taxiq.payoutCenter.resolveDispute.adjustAtLeastOneField')}
                </p>
              )}
            </div>
          )}

          {resolution === 'Reject' && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {t('taxiq.payoutCenter.resolveDispute.rejectWarning')}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">
              {t('taxiq.payoutCenter.resolveDispute.noteLabel')}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder={t('taxiq.payoutCenter.resolveDispute.notePlaceholder')}
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
            disabled={!canSubmit || resolveDispute.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {resolveDispute.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('taxiq.payoutCenter.resolveDispute.submitButton')}
          </button>
        </div>
      </div>
    </div>
  )
}

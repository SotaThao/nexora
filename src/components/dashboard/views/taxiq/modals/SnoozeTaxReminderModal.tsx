import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useSnoozeTaxReminder } from '../../../../../data/hooks/useTaxiqTaxReminders'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'

const SNOOZE_DAY_OPTIONS = [3, 7, 14, 30]

export default function SnoozeTaxReminderModal({
  open,
  onClose,
  ownerTaxYearId,
  reminderId,
  snoozeCount,
}: {
  open: boolean
  onClose: () => void
  ownerTaxYearId: string
  reminderId: string
  snoozeCount: number
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const snoozeReminder = useSnoozeTaxReminder(ownerTaxYearId)

  const [snoozeDays, setSnoozeDays] = useState(SNOOZE_DAY_OPTIONS[1])
  const [error, setError] = useState('')

  if (!open) return null

  const handleClose = () => {
    setSnoozeDays(SNOOZE_DAY_OPTIONS[1])
    setError('')
    onClose()
  }

  const handleSubmit = async () => {
    if (snoozeReminder.isPending) return
    setError('')
    try {
      await snoozeReminder.mutateAsync({ reminderId, snoozeDays })
      showToast(t('taxiq.reminders.snoozeModal.success'), 'success')
      handleClose()
    } catch (err) {
      const fallback = t('taxiq.reminders.snoozeModal.errors.generic')
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
      <div className="nexora-modal-card max-w-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-nexoraText">{t('taxiq.reminders.snoozeModal.modalTitle')}</h2>
          <IconButton label={t('common.cancel')} onClick={handleClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto">
          <p className="text-xs text-nexoraMuted">
            {t('taxiq.reminders.snoozeModal.description', { count: snoozeCount })}
          </p>

          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">
              {t('taxiq.reminders.snoozeModal.daysLabel')}
            </label>
            <select
              value={snoozeDays}
              onChange={(e) => setSnoozeDays(Number(e.target.value))}
              className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-semibold"
            >
              {SNOOZE_DAY_OPTIONS.map((days) => (
                <option key={days} value={days}>
                  {t(`taxiq.reminders.snoozeModal.days.${days}`)}
                </option>
              ))}
            </select>
          </div>

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
            disabled={snoozeReminder.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {snoozeReminder.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('taxiq.reminders.snoozeModal.confirmButton')}
          </button>
        </div>
      </div>
    </div>
  )
}

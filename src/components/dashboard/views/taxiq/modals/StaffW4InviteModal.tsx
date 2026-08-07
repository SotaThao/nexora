import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useCreateStaffW4Invite } from '../../../../../data/hooks/useTaxiqStaffW4Invite'
import {
  STAFF_W4_INVITE_EXPIRY_DAYS,
  STAFF_W4_INVITE_REMINDER_CADENCES,
  type StaffW4InviteExpiryDays,
  type StaffW4InviteReminderCadence,
} from '../../../../../data/repositories/taxiqStaffW4Invite'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'

// Same create endpoint is called again to resend — the modal has no separate
// "resend" state, matching the backend's revoke-then-reissue design (design.md D4).
export default function StaffW4InviteModal({
  open,
  onClose,
  ownerTaxYearId,
  businessStaffLinkId,
  staffDisplayName,
}: {
  open: boolean
  onClose: () => void
  ownerTaxYearId: string
  businessStaffLinkId: string
  staffDisplayName: string
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const createInvite = useCreateStaffW4Invite(ownerTaxYearId)

  const [expiryDays, setExpiryDays] = useState<StaffW4InviteExpiryDays>(STAFF_W4_INVITE_EXPIRY_DAYS[1])
  const [reminderCadence, setReminderCadence] = useState<StaffW4InviteReminderCadence>(
    STAFF_W4_INVITE_REMINDER_CADENCES[0],
  )
  const [error, setError] = useState('')

  if (!open) return null

  const handleClose = () => {
    setExpiryDays(STAFF_W4_INVITE_EXPIRY_DAYS[1])
    setReminderCadence(STAFF_W4_INVITE_REMINDER_CADENCES[0])
    setError('')
    onClose()
  }

  const handleSubmit = async () => {
    if (createInvite.isPending) return
    setError('')
    try {
      await createInvite.mutateAsync({ businessStaffLinkId, ownerTaxYearId, expiryDays, reminderCadence })
      showToast(t('taxiq.w4Invite.form.success'), 'success')
      handleClose()
    } catch (err) {
      const fallback = t('taxiq.w4Invite.form.errors.generic')
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
          <h2 className="text-sm font-extrabold text-nexoraText">
            {t('taxiq.w4Invite.form.modalTitle', { name: staffDisplayName })}
          </h2>
          <IconButton label={t('common.cancel')} onClick={handleClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto">
          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">
              {t('taxiq.w4Invite.form.expiryDaysLabel')}
            </label>
            <div className="flex flex-wrap gap-2">
              {STAFF_W4_INVITE_EXPIRY_DAYS.map((days) => (
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
                  {t('taxiq.w4Invite.form.expiryDaysOption', { count: days })}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">
              {t('taxiq.w4Invite.form.reminderCadenceLabel')}
            </label>
            <select
              value={reminderCadence}
              onChange={(e) => setReminderCadence(e.target.value as StaffW4InviteReminderCadence)}
              className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-semibold"
            >
              {STAFF_W4_INVITE_REMINDER_CADENCES.map((cadence) => (
                <option key={cadence} value={cadence}>
                  {t(`taxiq.w4Invite.reminderCadences.${cadence}`)}
                </option>
              ))}
            </select>
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
            disabled={createInvite.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {createInvite.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('taxiq.w4Invite.form.submitButton')}
          </button>
        </div>
      </div>
    </div>
  )
}

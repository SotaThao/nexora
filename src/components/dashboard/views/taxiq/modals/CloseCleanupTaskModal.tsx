import { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useCloseCleanupTask } from '../../../../../data/hooks/useDataQuality'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'

export default function CloseCleanupTaskModal({
  open,
  onClose,
  businessId,
  cleanupTaskId,
}: {
  open: boolean
  onClose: () => void
  businessId: string
  cleanupTaskId: string | null
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const closeCleanupTask = useCloseCleanupTask(businessId)

  const [reviewerNote, setReviewerNote] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setReviewerNote('')
    setError('')
  }, [open, cleanupTaskId])

  if (!open || !cleanupTaskId) return null

  const canSubmit = reviewerNote.trim().length > 0

  const handleClose = () => {
    setError('')
    onClose()
  }

  const handleSubmit = async () => {
    if (!canSubmit || closeCleanupTask.isPending) return
    setError('')
    try {
      await closeCleanupTask.mutateAsync({ id: cleanupTaskId, reviewerNote: reviewerNote.trim() })
      showToast(t('taxiq.dataQuality.closeTask.success'), 'success')
      handleClose()
    } catch (err) {
      const fallback = t('taxiq.dataQuality.errors.generic')
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
          <h2 className="text-sm font-extrabold text-nexoraText">{t('taxiq.dataQuality.closeTask.title')}</h2>
          <IconButton label={t('common.cancel')} onClick={handleClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto">
          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">
              {t('taxiq.dataQuality.closeTask.reviewerNoteLabel')} *
            </label>
            <textarea
              value={reviewerNote}
              onChange={(e) => setReviewerNote(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
            />
            {!canSubmit && reviewerNote.length === 0 && (
              <p className="mt-1 text-[11px] font-semibold text-amber-600">
                {t('taxiq.dataQuality.closeTask.reviewerNoteRequired')}
              </p>
            )}
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
            disabled={!canSubmit || closeCleanupTask.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {closeCleanupTask.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('taxiq.dataQuality.closeTask.submitButton')}
          </button>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useCreateCleanupTask } from '../../../../../data/hooks/useDataQuality'
import type { DataQualityIssue } from '../../../../../data/repositories/dataQuality'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'

const OWNER_TEAMS = ['Payroll', 'Hr', 'Tax']

export default function CreateCleanupTaskModal({
  open,
  onClose,
  businessId,
  employerId,
  issue,
}: {
  open: boolean
  onClose: () => void
  businessId: string
  employerId: string
  issue: DataQualityIssue | null
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const createCleanupTask = useCreateCleanupTask(businessId)

  const [owner, setOwner] = useState('Payroll')
  const [dueDate, setDueDate] = useState('')
  const [blocksRelatedWorkflow, setBlocksRelatedWorkflow] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setOwner(issue?.owner ?? 'Payroll')
    setDueDate('')
    setBlocksRelatedWorkflow(false)
    setError('')
  }, [open, issue])

  if (!open || !issue) return null

  const isHighSeverity = issue.severity === 'High'

  const handleClose = () => {
    setError('')
    onClose()
  }

  const handleSubmit = async () => {
    if (createCleanupTask.isPending) return
    setError('')
    try {
      await createCleanupTask.mutateAsync({
        employerId,
        issueType: issue.issueType,
        severity: issue.severity,
        owner,
        dueDate: dueDate || undefined,
        sourceRecordType: issue.sourceRecordType,
        sourceRecordId: issue.sourceRecordId,
        blocksRelatedWorkflow,
      })
      showToast(t('taxiq.dataQuality.createTask.success'), 'success')
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
          <h2 className="text-sm font-extrabold text-nexoraText">{t('taxiq.dataQuality.createTask.title')}</h2>
          <IconButton label={t('common.cancel')} onClick={handleClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto">
          <div className="nexora-card p-3 text-xs">
            <div className="font-extrabold text-nexoraText">{t(`taxiq.dataQuality.issueType.${issue.issueType}`)}</div>
            <div className="text-nexoraMuted">{issue.description}</div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">
              {t('taxiq.dataQuality.createTask.ownerLabel')}
            </label>
            <select
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
            >
              {OWNER_TEAMS.map((team) => (
                <option key={team} value={team}>
                  {t(`taxiq.exceptions.ownerTeam.${team}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">
              {t('taxiq.dataQuality.createTask.dueDateLabel')}
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-nexoraText">
            <input
              type="checkbox"
              checked={blocksRelatedWorkflow}
              disabled={!isHighSeverity}
              onChange={(e) => setBlocksRelatedWorkflow(e.target.checked)}
            />
            {t('taxiq.dataQuality.createTask.blocksWorkflowLabel')}
          </label>
          {!isHighSeverity && (
            <p className="text-[11px] font-medium text-nexoraMuted">
              {t('taxiq.dataQuality.createTask.blocksWorkflowHighOnly')}
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
            disabled={createCleanupTask.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {createCleanupTask.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('taxiq.dataQuality.createTask.submitButton')}
          </button>
        </div>
      </div>
    </div>
  )
}

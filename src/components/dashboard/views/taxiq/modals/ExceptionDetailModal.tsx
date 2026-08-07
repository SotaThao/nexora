import { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import {
  useAddExceptionNote,
  useAssignException,
  useExceptionDetail,
  useResolveException,
} from '../../../../../data/hooks/useExceptions'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'

const OWNER_TEAMS = ['Payroll', 'Hr', 'Tax']
const RESOLUTION_TYPES = ['Corrected', 'Waived', 'FalsePositive', 'EscalatedToCpa']

export default function ExceptionDetailModal({
  open,
  onClose,
  businessId,
  exceptionId,
}: {
  open: boolean
  onClose: () => void
  businessId: string
  exceptionId: string | null
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const detailQuery = useExceptionDetail(exceptionId ?? undefined)
  const assignException = useAssignException(businessId)
  const addNote = useAddExceptionNote(businessId)
  const resolveException = useResolveException(businessId)

  const [note, setNote] = useState('')
  const [resolutionType, setResolutionType] = useState('Corrected')
  const [correctedValue, setCorrectedValue] = useState('')
  const [reference, setReference] = useState('')
  const [justificationNote, setJustificationNote] = useState('')
  const [resolveError, setResolveError] = useState('')

  useEffect(() => {
    if (!open) return
    setNote('')
    setResolutionType('Corrected')
    setCorrectedValue('')
    setReference('')
    setJustificationNote('')
    setResolveError('')
  }, [open, exceptionId])

  if (!open || !exceptionId) return null

  const detail = detailQuery.data
  const isClosed = detail?.status === 'Closed'

  const handleClose = () => {
    setResolveError('')
    onClose()
  }

  const handleAssign = async (newOwner: string) => {
    if (!detail || assignException.isPending) return
    try {
      await assignException.mutateAsync({ id: detail.id, newOwner })
      showToast(t('taxiq.exceptions.detail.assignSuccess'), 'success')
    } catch (err) {
      showToast(resolveApiErrorMessage(err, t), 'error')
    }
  }

  const handleAddNote = async () => {
    if (!detail || !note.trim() || addNote.isPending) return
    try {
      await addNote.mutateAsync({ id: detail.id, note: note.trim() })
      setNote('')
      showToast(t('taxiq.exceptions.detail.noteSuccess'), 'success')
    } catch (err) {
      showToast(resolveApiErrorMessage(err, t), 'error')
    }
  }

  const canResolve = justificationNote.trim().length > 0

  const handleResolve = async () => {
    if (!detail || !canResolve || resolveException.isPending) return
    setResolveError('')
    try {
      await resolveException.mutateAsync({
        id: detail.id,
        params: {
          resolutionType,
          correctedValue: correctedValue.trim() || undefined,
          reference: reference.trim() || undefined,
          justificationNote: justificationNote.trim(),
        },
      })
      showToast(t('taxiq.exceptions.detail.resolveSuccess'), 'success')
      handleClose()
    } catch (err) {
      setResolveError(resolveApiErrorMessage(err, t))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-nexoraText">{t('taxiq.exceptions.detail.title')}</h2>
          <IconButton label={t('common.cancel')} onClick={handleClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto">
          {detailQuery.isPending || !detail ? (
            <p className="text-xs font-semibold text-nexoraMuted">{t('common.loading')}</p>
          ) : (
            <>
              <div className="nexora-card space-y-1 p-3">
                <div className="text-sm font-extrabold text-nexoraText">
                  {t(`taxiq.exceptions.types.${detail.type}`)}
                </div>
                <div className="text-[11px] text-nexoraMuted">{detail.periodLabel}</div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="rounded-full bg-nexoraCanvas px-2 py-0.5 text-[10px] font-bold text-nexoraText">
                    {t(`taxiq.exceptions.severity.${detail.severity}`)}
                  </span>
                  <span className="rounded-full bg-nexoraCanvas px-2 py-0.5 text-[10px] font-bold text-nexoraText">
                    {t(`taxiq.exceptions.status.${detail.status}`)}
                  </span>
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs font-bold text-nexoraMuted">
                  {t('taxiq.exceptions.detail.membersLabel', { count: detail.members.length })}
                </div>
                <ul className="space-y-1">
                  {detail.members.map((m) => (
                    <li key={m.id} className="rounded-lg border border-nexoraBorder px-3 py-1.5 text-xs text-nexoraText">
                      {m.displayName}
                    </li>
                  ))}
                  {detail.members.length === 0 && (
                    <li className="text-[11px] text-nexoraMuted">{t('taxiq.exceptions.detail.noMembers')}</li>
                  )}
                </ul>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                  {t('taxiq.exceptions.detail.ownerLabel')}
                </label>
                <select
                  value={detail.owner}
                  onChange={(e) => handleAssign(e.target.value)}
                  disabled={isClosed || assignException.isPending}
                  className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm disabled:opacity-60"
                >
                  {OWNER_TEAMS.map((team) => (
                    <option key={team} value={team}>
                      {t(`taxiq.exceptions.ownerTeam.${team}`)}
                    </option>
                  ))}
                </select>
              </div>

              {detail.latestNote && (
                <div className="rounded-lg border border-nexoraBorder bg-nexoraCanvas p-3 text-xs text-nexoraText">
                  <span className="font-bold text-nexoraMuted">{t('taxiq.exceptions.detail.latestNoteLabel')}: </span>
                  {detail.latestNote}
                </div>
              )}

              {!isClosed && (
                <div>
                  <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                    {t('taxiq.exceptions.detail.addNoteLabel')}
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddNote}
                    disabled={!note.trim() || addNote.isPending}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-nexoraBorder px-3 py-1.5 text-xs font-bold text-nexoraText disabled:opacity-60"
                  >
                    {addNote.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                    {t('taxiq.exceptions.detail.addNoteButton')}
                  </button>
                </div>
              )}

              {isClosed ? (
                <div className="nexora-card space-y-1 p-3 text-xs">
                  <div className="font-bold text-nexoraText">
                    {t('taxiq.exceptions.detail.resolvedAs')}: {t(`taxiq.exceptions.resolutionType.${detail.resolutionType}`)}
                  </div>
                  {detail.justificationNote && <div className="text-nexoraMuted">{detail.justificationNote}</div>}
                </div>
              ) : (
                <div className="space-y-3 border-t border-nexoraRule pt-3">
                  <div className="text-xs font-extrabold text-nexoraText">{t('taxiq.exceptions.detail.resolveTitle')}</div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                      {t('taxiq.exceptions.detail.resolutionTypeLabel')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {RESOLUTION_TYPES.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setResolutionType(option)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
                            resolutionType === option
                              ? 'border-nexoraBrand bg-nexoraBrand text-white'
                              : 'border-nexoraBorder text-nexoraText'
                          }`}
                        >
                          {t(`taxiq.exceptions.resolutionType.${option}`)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                        {t('taxiq.exceptions.detail.correctedValueLabel')}
                      </label>
                      <input
                        value={correctedValue}
                        onChange={(e) => setCorrectedValue(e.target.value)}
                        className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                        {t('taxiq.exceptions.detail.referenceLabel')}
                      </label>
                      <input
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                      {t('taxiq.exceptions.detail.justificationNoteLabel')} *
                    </label>
                    <textarea
                      value={justificationNote}
                      onChange={(e) => setJustificationNote(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                    />
                    {!canResolve && justificationNote.length === 0 && (
                      <p className="mt-1 text-[11px] font-semibold text-amber-600">
                        {t('taxiq.exceptions.detail.justificationNoteRequired')}
                      </p>
                    )}
                  </div>

                  {resolveError && <p className="text-xs font-semibold text-rose-600">{resolveError}</p>}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleResolve}
                      disabled={!canResolve || resolveException.isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
                    >
                      {resolveException.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {t('taxiq.exceptions.detail.resolveButton')}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function resolveApiErrorMessage(err: unknown, t: ReturnType<typeof useTranslation>['t']): string {
  const fallback = t('taxiq.exceptions.errors.generic')
  if (isApiError(err)) {
    const i18nKey = getErrorI18nKey(err.errorCode)
    const translated = t(i18nKey)
    return translated !== i18nKey ? translated : err.message || fallback
  }
  return fallback
}

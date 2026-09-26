import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, Loader2, MessagesSquare, X } from 'lucide-react'

import { APPLICATION_NOTE_MAX } from '../../../../constants/communityJobs'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useApplyToHiringPosting } from '../../../../data/hooks/useStaffCommunityJobs'
import IconButton from '../../../ui/IconButton'
import { getPublicSalonLabel } from '../../../dashboard/views/pos/recruitment/recruitmentModel'
import { isApiError } from '../../../../types/domain'
import type { JobApplication, SeekingPost } from '../../../../types/communityJobs'
import type { PosJobPosting } from '../../../../types/posRecruitment'
import { useCommunityJobsModalFocusTrap } from './useCommunityJobsModalFocusTrap'

const TK = 'staff_dashboard.community.jobs.apply'
const fieldClass = 'w-full rounded-lg border border-nexoraBorder bg-white px-3 py-2.5 text-sm font-medium text-nexoraText outline-none placeholder:text-nexoraSubtle focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrandSoft disabled:bg-slate-100'

interface ApplyToPostingModalProps {
  posting: PosJobPosting
  staffKey: string | undefined
  seekingPosts: SeekingPost[]
  onClose: () => void
  onApplied: (application: JobApplication) => void
  onChat: (posting: PosJobPosting) => void
  onViewApplied: () => void
}

export default function ApplyToPostingModal({
  posting,
  staffKey,
  seekingPosts,
  onClose,
  onApplied,
  onChat,
  onViewApplied,
}: ApplyToPostingModalProps) {
  const { t } = useTranslation()
  const applyMutation = useApplyToHiringPosting(staffKey)
  const dialogRef = useRef<HTMLDivElement>(null)
  const submittingRef = useRef(false)
  const [note, setNote] = useState('')
  const [seekingPostId, setSeekingPostId] = useState('')
  const [sharePhone, setSharePhone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<JobApplication | null>(null)
  const businessLabel = getPublicSalonLabel(posting, t)
  const isLocked = applyMutation.isPending

  // Active on every step (including the post-submit success step) — only suspended
  // while a submission is in flight, so Escape can't abandon a pending mutation.
  useCommunityJobsModalFocusTrap(!isLocked, dialogRef, onClose)

  const handleSubmit = async () => {
    if (isLocked || submittingRef.current) return
    submittingRef.current = true
    setError(null)
    try {
      const application = await applyMutation.mutateAsync({
        postingId: posting.id,
        note: note.trim(),
        seekingPostId: seekingPostId || null,
        sharePhone,
      })
      setResult(application)
      onApplied(application)
    } catch (err) {
      const errorCode = isApiError(err) ? err.errorCode : null
      setError(errorCode === 'ALREADY_APPLIED' ? t(`${TK}.alreadyAppliedError`) : t(`${TK}.genericError`))
    } finally {
      submittingRef.current = false
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm" onMouseDown={() => !isLocked && onClose()}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-posting-title"
        className="nexora-modal-card flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-nexoraBorder bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-nexoraRule px-4 py-3 sm:px-5">
          <h2 id="apply-posting-title" className="text-lg font-black text-nexoraText">{result ? t(`${TK}.successTitle`) : t(`${TK}.title`)}</h2>
          <IconButton label={t(`${TK}.close`)} onClick={onClose} disabled={isLocked} className="min-h-11 min-w-11 disabled:opacity-50">
            <X className="h-5 w-5" aria-hidden />
          </IconButton>
        </header>

        {result ? (
          <div className="flex-1 space-y-4 px-4 py-6 text-center sm:px-5">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden />
            <p className="font-bold text-nexoraText">{t(`${TK}.successDescription`, { business: businessLabel })}</p>
            <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
              <button type="button" onClick={() => onChat(posting)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-nexoraBorder px-4 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted">
                <MessagesSquare className="h-4 w-4" aria-hidden />{t(`${TK}.messageBusiness`)}
              </button>
              <button type="button" onClick={onViewApplied} className="min-h-11 rounded-lg bg-nexoraBrand px-4 text-xs font-black text-white hover:bg-nexoraBrandDark">
                {t(`${TK}.viewApplied`)}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
              <p className="text-xs font-medium leading-5 text-nexoraMuted">{t(`${TK}.subtitle`, { business: businessLabel })}</p>

              <label className="block text-xs font-bold text-nexoraText">
                {t(`${TK}.noteLabel`)}
                <textarea
                  rows={4}
                  maxLength={APPLICATION_NOTE_MAX}
                  disabled={isLocked}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder={t(`${TK}.notePlaceholder`)}
                  className={`${fieldClass} mt-1.5 resize-y`}
                />
                <span className="mt-1 block text-right text-[11px] font-medium text-nexoraMuted">{note.length}/{APPLICATION_NOTE_MAX}</span>
              </label>

              {seekingPosts.length > 0 ? (
                <label className="block text-xs font-bold text-nexoraText">
                  {t(`${TK}.attachSeekingLabel`)} <span className="font-medium text-nexoraMuted">{t(`${TK}.optional`)}</span>
                  <select disabled={isLocked} value={seekingPostId} onChange={(event) => setSeekingPostId(event.target.value)} className={`${fieldClass} mt-1.5 bg-white`}>
                    <option value="">{t(`${TK}.attachSeekingNone`)}</option>
                    {seekingPosts.map((post) => (
                      <option key={post.id} value={post.id}>{post.title}</option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label className="flex min-h-11 items-start gap-3 rounded-lg border border-nexoraBorder px-3 py-2.5 text-xs text-nexoraText">
                <input type="checkbox" disabled={isLocked} checked={sharePhone} onChange={(event) => setSharePhone(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-nexoraBorder accent-nexoraBrand" />
                <span>{t(`${TK}.sharePhoneLabel`)}</span>
              </label>

              {error ? <p role="alert" className="text-xs font-semibold text-rose-600">{error}</p> : null}
            </div>

            <footer className="grid grid-cols-1 gap-2 border-t border-nexoraRule bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:grid-cols-2 sm:px-5">
              <button type="button" disabled={isLocked} onClick={onClose} className="min-h-11 rounded-lg border border-nexoraBorder px-4 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted disabled:opacity-50">
                {t(`${TK}.cancel`)}
              </button>
              <button type="button" disabled={isLocked} onClick={handleSubmit} className="min-h-11 rounded-lg bg-nexoraBrand px-4 text-xs font-black text-white hover:bg-nexoraBrandDark disabled:opacity-50">
                {isLocked ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : null}
                {t(`${TK}.${isLocked ? 'submitting' : 'submit'}`)}
              </button>
            </footer>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}

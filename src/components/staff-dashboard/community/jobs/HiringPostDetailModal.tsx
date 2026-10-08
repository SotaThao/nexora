import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, MessagesSquare, X } from 'lucide-react'

import { useTranslation } from '../../../../contexts/LanguageContext'
import IconButton from '../../../ui/IconButton'
import type { PosJobPosting } from '../../../../types/posRecruitment'
import CommunityHiringDetailContent from './CommunityHiringDetailContent'
import { useCommunityJobsModalFocusTrap } from './useCommunityJobsModalFocusTrap'

const TK = 'staff_dashboard.community.jobs.detail'

interface HiringPostDetailModalProps {
  posting: PosJobPosting
  alreadyApplied: boolean
  canApply?: boolean
  relatedPostings?: PosJobPosting[]
  onOpenRelated?: (postingId: string) => void
  onClose: () => void
  onApply: (posting: PosJobPosting) => void
  onChat: (posting: PosJobPosting) => void
}

export default function HiringPostDetailModal({ posting, alreadyApplied, canApply = true, relatedPostings = [], onOpenRelated, onClose, onApply, onChat }: HiringPostDetailModalProps) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const previousPostingIdRef = useRef(posting.id)
  useCommunityJobsModalFocusTrap(true, dialogRef, onClose)

  useEffect(() => {
    if (previousPostingIdRef.current === posting.id) return
    previousPostingIdRef.current = posting.id
    if (contentRef.current) contentRef.current.scrollTop = 0
    const focusFrame = window.requestAnimationFrame(() => {
      contentRef.current?.querySelector<HTMLElement>('[data-community-detail-heading]')?.focus()
    })
    return () => window.cancelAnimationFrame(focusFrame)
  }, [posting.id])

  return createPortal(
    <div className="community-jobs-theme fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hiring-post-detail-title"
        className="nexora-modal-card community-job-detail-modal flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-nexoraBorder bg-nexoraSurface shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="community-job-detail-header flex items-center justify-between border-b border-nexoraRule px-4 py-3 sm:px-6">
          <h2 id="hiring-post-detail-title" className="text-base font-black text-nexoraText">{t(`${TK}.title`)}</h2>
          <IconButton label={t(`${TK}.close`)} onClick={onClose} className="min-h-11 min-w-11">
            <X className="h-5 w-5" aria-hidden />
          </IconButton>
        </header>

        <div ref={contentRef} className="community-job-detail-body min-h-0 flex-1 overflow-y-auto bg-nexoraCanvas p-3 sm:p-6">
          <CommunityHiringDetailContent posting={posting} relatedPostings={relatedPostings} onOpenRelated={onOpenRelated} />
        </div>

        <footer className={`community-job-detail-footer grid gap-2 border-t border-nexoraRule bg-white px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:flex sm:justify-end sm:px-6 ${canApply ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <button
            type="button"
            onClick={() => onChat(posting)}
            className={`community-job-detail-action inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-bold sm:w-44 sm:px-4 ${canApply ? 'community-job-detail-action--secondary' : 'community-job-detail-action--primary'}`}
          >
            <MessagesSquare className="h-4 w-4" aria-hidden />{t(`${TK}.chatAction`)}
          </button>
          {!canApply ? null : alreadyApplied ? (
            <span className="community-job-detail-action community-job-detail-action--success inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 text-xs font-bold sm:w-44 sm:px-4">
              <CheckCircle2 className="h-4 w-4" aria-hidden />{t('staff_dashboard.community.jobs.card.alreadyApplied')}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onApply(posting)}
              className="community-job-detail-action community-job-detail-action--primary min-h-11 min-w-0 rounded-lg px-2 text-xs font-black sm:w-44 sm:px-4"
            >
              {t(`${TK}.applyAction`)}
            </button>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  )
}

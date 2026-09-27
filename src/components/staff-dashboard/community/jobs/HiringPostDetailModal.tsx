import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, MessagesSquare, X } from 'lucide-react'

import { useTranslation } from '../../../../contexts/LanguageContext'
import { COMMUNITY_JOBS_IS_SIMULATED } from '../../../../data/repositories/communityJobsMockClient'
import IconButton from '../../../ui/IconButton'
import NailhubPostPreview from '../../../dashboard/views/pos/recruitment/NailhubPostPreview'
import { postingToDraft } from '../../../dashboard/views/pos/recruitment/recruitmentModel'
import type { PosJobPosting } from '../../../../types/posRecruitment'
import { useCommunityJobsModalFocusTrap } from './useCommunityJobsModalFocusTrap'

const TK = 'staff_dashboard.community.jobs.detail'

interface HiringPostDetailModalProps {
  posting: PosJobPosting
  alreadyApplied: boolean
  onClose: () => void
  onApply: (posting: PosJobPosting) => void
  onChat: (posting: PosJobPosting) => void
}

export default function HiringPostDetailModal({ posting, alreadyApplied, onClose, onApply, onChat }: HiringPostDetailModalProps) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDivElement>(null)
  useCommunityJobsModalFocusTrap(true, dialogRef, onClose)

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hiring-post-detail-title"
        className="nexora-modal-card flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-nexoraBorder bg-nexoraSurface shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-nexoraRule px-4 py-3 sm:px-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-nexoraBrand">{t(`${TK}.eyebrow`)}</p>
            <h2 id="hiring-post-detail-title" className="text-base font-black text-nexoraText">{t(`${TK}.title`)}</h2>
          </div>
          <IconButton label={t(`${TK}.close`)} onClick={onClose} className="min-h-11 min-w-11">
            <X className="h-5 w-5" aria-hidden />
          </IconButton>
        </header>

        {COMMUNITY_JOBS_IS_SIMULATED ? (
          <p className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-center text-[11px] font-bold text-amber-800 sm:px-5">
            {t('staff_dashboard.community.jobs.simulatedNotice')}
          </p>
        ) : null}

        <div className="flex-1 overflow-y-auto bg-nexoraCanvas p-3 sm:p-5">
          <NailhubPostPreview draft={{ ...postingToDraft(posting), status: posting.status }} />
        </div>

        <footer className="grid grid-cols-1 gap-2 border-t border-nexoraRule bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:grid-cols-2 sm:px-5">
          <button
            type="button"
            onClick={() => onChat(posting)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-nexoraBorder px-4 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand"
          >
            <MessagesSquare className="h-4 w-4" aria-hidden />{t(`${TK}.chatAction`)}
          </button>
          {alreadyApplied ? (
            <span className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-50 px-4 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden />{t('staff_dashboard.community.jobs.card.alreadyApplied')}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onApply(posting)}
              className="min-h-11 rounded-lg bg-nexoraBrand px-4 text-xs font-black text-white hover:bg-nexoraBrandDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand"
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

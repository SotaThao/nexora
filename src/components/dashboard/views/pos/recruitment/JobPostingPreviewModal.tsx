import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

import { useTranslation } from '../../../../../contexts/LanguageContext'
import IconButton from '../../../../ui/IconButton'
import type { PosJobPosting } from '../../../../../types/posRecruitment'
import NailhubPostPreview from './NailhubPostPreview'
import { postingToDraft } from './recruitmentModel'

const TK = 'components.dashboard.views.pos.recruitment.list'

interface JobPostingPreviewModalProps {
  posting: PosJobPosting
  logo?: string | null
  onClose: () => void
}

export default function JobPostingPreviewModal({ posting, logo, onClose }: JobPostingPreviewModalProps) {
  const { t } = useTranslation()
  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t(`${TK}.previewDialogTitle`)}
        className="nexora-modal-card flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-nexoraBorder bg-nexoraSurface shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-nexoraRule px-4 py-3 sm:px-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-nexoraBrand">{t(`${TK}.previewDialogEyebrow`)}</p>
            <h2 className="text-base font-black text-nexoraText">{t(`${TK}.previewDialogTitle`)}</h2>
          </div>
          <IconButton label={t(`${TK}.closePreview`)} onClick={onClose} className="min-h-11 min-w-11">
            <X className="h-5 w-5" aria-hidden />
          </IconButton>
        </header>
        <div className="flex-1 overflow-y-auto bg-nexoraCanvas p-3 sm:p-5">
          <NailhubPostPreview draft={{ ...postingToDraft(posting), status: posting.status }} logo={logo} />
        </div>
      </div>
    </div>,
    document.body,
  )
}

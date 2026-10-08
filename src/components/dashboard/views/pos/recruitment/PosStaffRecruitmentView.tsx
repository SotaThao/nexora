// Adapted for Community demo
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, Plus } from 'lucide-react'

import { JobPayType, JobPayUnit, JobPostingStatus } from '../../../../../constants/posRecruitment'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useClosePosJobPosting, usePosJobPostings } from '../../../../../data/hooks/usePosRecruitment'
import type { PosJobPosting } from '../../../../../types/posRecruitment'
import { useCommunityJobsDemo } from '../../../../community/jobs/CommunityJobsDemoContext'
import JobPostingComposer from './JobPostingComposer'
import JobPostingPreviewModal from './JobPostingPreviewModal'
import RecruitmentListPanel, { ALL_JOB_POSTINGS, type PostingFilter } from './RecruitmentListPanel'
import { createDefaultJobDraft, prepareJobDraftForComposer, postingToDraft } from './recruitmentModel'

const TK = 'components.dashboard.views.pos.recruitment.shell'

interface PosStaffRecruitmentViewProps {
  businessId: string
  /** Bump to open the Advanced composer from outside (Community owner tabs' "Post a Job" button). 0 = no request. */
  createRequest?: number
  /** Community owner tabs render their own title-less header row (tabs + Open in POS + Post a Job). */
  hideHeader?: boolean
  createRequested?: boolean
  onCreateRequestHandled?: () => void
  onComposerStateChange?: (composing: boolean) => void
}

interface ComposerState {
  postingId: string | null
}

export default function PosStaffRecruitmentView({ businessId, createRequest = 0, hideHeader = false, createRequested = false, onCreateRequestHandled, onComposerStateChange }: PosStaffRecruitmentViewProps) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const navigate = useNavigate()
  const { businessInfo, services, categories, surface } = useCommunityJobsDemo()
  const [composer, setComposer] = useState<ComposerState | null>(null)
  const [previewPosting, setPreviewPosting] = useState<PosJobPosting | null>(null)
  const [closingPosting, setClosingPosting] = useState<PosJobPosting | null>(null)
  const [listFilter, setListFilter] = useState<PostingFilter>(ALL_JOB_POSTINGS)
  const postingsQuery = usePosJobPostings(businessId, businessInfo)
  const closeMutation = useClosePosJobPosting()
  const postings = postingsQuery.data?.items ?? []
  const createDisabled = false

  const initialDraft = useMemo(() => {
    const posting = composer?.postingId ? postings.find((item) => item.id === composer.postingId) : undefined
    const draft = prepareJobDraftForComposer(posting ? postingToDraft(posting) : createDefaultJobDraft(businessInfo))
    return posting
      ? { ...draft, payUnit: posting.payUnit }
      : { ...draft, payType: JobPayType.Fixed, payUnit: JobPayUnit.Week }
  }, [composer?.postingId, postings, businessInfo])

  // "Post a Job" always opens the Advanced composer; the Quick post / mode picker step is hidden
  // (PostModePickerModal / QuickPostModal are kept in the folder but no longer reachable).
  const openCreateComposer = () => {
    setComposer({ postingId: null })
  }

  useEffect(() => {
    // Don't replace a composer that's already open (e.g. mid-edit) when the tab row's "Post a Job" is clicked.
    if (createRequest > 0) setComposer((current) => current ?? { postingId: null })
  }, [createRequest])

  useEffect(() => {
    if (!createRequested) return
    setComposer((current) => current ?? { postingId: null })
    onCreateRequestHandled?.()
  }, [createRequested, onCreateRequestHandled])

  const isComposing = composer !== null
  useEffect(() => {
    onComposerStateChange?.(isComposing)
    return () => onComposerStateChange?.(false)
  }, [isComposing, onComposerStateChange])

  const handleClosePosting = async () => {
    if (!closingPosting) return
    if (closeMutation.isPending) return
    try {
      await closeMutation.mutateAsync(closingPosting.id)
      setClosingPosting(null)
      showToast(t(`${TK}.closeSuccess`), 'success', 3000)
    } catch {
      showToast(t(`${TK}.closeFailed`), 'error', 3500)
    }
  }

  if (composer) {
    return (
      <div className="space-y-4">
        <JobPostingComposer
          key={composer.postingId ?? 'new'}
          postingId={composer.postingId}
          initialDraft={initialDraft}
          logo={typeof businessInfo.logo === 'string' ? businessInfo.logo : null}
          services={services}
          categories={categories}
          onCancel={() => setComposer(null)}
          onSavedDraft={() => { setListFilter(JobPostingStatus.Draft); setComposer(null) }}
          onPublishedDone={() => { setListFilter(ALL_JOB_POSTINGS); setComposer(null) }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {hideHeader ? null : (
      <section className="flex flex-col gap-4 px-0.5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-nexoraText">{t('community_jobs_demo.owner.title')}</h1>
          <p className="mt-1 text-sm font-medium text-nexoraMuted">{t('community_jobs_demo.owner.description')}</p>
          {surface === 'community' ? (
            <button
              type="button"
              onClick={() => navigate('/pos/staff?staffView=recruitment')}
              className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-xs font-bold text-nexoraBrand hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              {t('community_jobs_demo.owner.openInPos')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/community?tab=jobs')}
              className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-xs font-bold text-nexoraBrand hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              {t('community_jobs_demo.pos.viewOnCommunity')}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button type="button" onClick={openCreateComposer} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-nexoraBrand px-4 text-xs font-black text-white shadow-nexora-soft hover:bg-nexoraBrandDark"><Plus className="h-4 w-4" aria-hidden />{t(`${TK}.recruitStaff`)}</button>
        </div>
      </section>
      )}

      <RecruitmentListPanel
        postings={postings}
        isLoading={postingsQuery.isLoading}
        isError={postingsQuery.isError}
        businessName={typeof businessInfo.name === 'string' ? businessInfo.name : ''}
        city={typeof businessInfo.city === 'string' ? businessInfo.city : ''}
        filter={listFilter}
        onFilterChange={setListFilter}
        onPreview={setPreviewPosting}
        onEdit={(posting) => setComposer({ postingId: posting.id })}
        onClose={setClosingPosting}
        onCreate={openCreateComposer}
        createDisabled={createDisabled}
        onRetry={() => postingsQuery.refetch()}
      />

      {previewPosting ? <JobPostingPreviewModal posting={previewPosting} logo={typeof businessInfo.logo === 'string' ? businessInfo.logo : null} onClose={() => setPreviewPosting(null)} /> : null}
      {closingPosting ? createPortal(
        <div className="community-jobs-theme fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm" onMouseDown={() => !closeMutation.isPending && setClosingPosting(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="close-recruitment-title" className="nexora-modal-card flex w-full max-w-md flex-col rounded-2xl border border-nexoraBorder bg-white p-5 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <h2 id="close-recruitment-title" className="text-lg font-black text-nexoraText">{t(`${TK}.closeConfirmTitle`)}</h2>
            <p className="mt-3 text-sm font-medium leading-6 text-nexoraMuted">{t(`${TK}.closeConfirmBody`, { title: closingPosting.title })}</p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" disabled={closeMutation.isPending} onClick={() => setClosingPosting(null)} className="min-h-11 rounded-lg border border-nexoraBorder px-4 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted disabled:opacity-50">{t(`${TK}.closeConfirmCancel`)}</button>
              <button type="button" disabled={closeMutation.isPending} onClick={handleClosePosting} className="min-h-11 rounded-lg bg-nexoraBrand px-4 text-xs font-black text-white hover:bg-nexoraBrandDark disabled:opacity-50">{t(`${TK}.closeConfirmAction`)}</button>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  )
}

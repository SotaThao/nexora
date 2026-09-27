// Adapted for Community demo
import { useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { Briefcase, Plus, Search as SearchIcon, UserRound } from 'lucide-react'

import { StaffCommunityJobsTab } from '../../../../constants/communityJobs'
import { JobPostingStatus } from '../../../../constants/posRecruitment'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import {
  useCloseStaffSeekingPost,
  useStaffHiringFeed,
  useStaffJobApplications,
  useStaffSeekingPosts,
} from '../../../../data/hooks/useStaffCommunityJobs'
import { COMMUNITY_JOBS_IS_SIMULATED } from '../../../../data/repositories/communityJobsMockClient'
import { getPublicSalonLabel } from '../../../dashboard/views/pos/recruitment/recruitmentModel'
import { useCommunityJobsDemo } from '../../../community/jobs/CommunityJobsDemoContext'
import type { HiringFeedFilters, SeekingPost } from '../../../../types/communityJobs'
import type { PosJobPosting } from '../../../../types/posRecruitment'
import ApplyToPostingModal from './ApplyToPostingModal'
import AppliedJobsPanel from './AppliedJobsPanel'
import HiringFeedPanel from './HiringFeedPanel'
import HiringPostDetailModal from './HiringPostDetailModal'
import MySeekingPostsPanel from './MySeekingPostsPanel'
import SeekingPostComposerModal from './SeekingPostComposerModal'
import {
  buildAppliedPostingIdSet,
  createDefaultSeekingDraft,
  normalizeStaffJobsTab,
  resolveHiringPostChatAction,
  seekingPostToDraft,
} from './staffJobsModel'
import { useCommunityJobsModalFocusTrap } from './useCommunityJobsModalFocusTrap'

const TK = 'staff_dashboard.community.jobs'

interface ComposerState {
  postId: string | null
}

export default function StaffCommunityJobsView() {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const { mode, staffKey, staffAccount, linkedBusinessIds, openInbox, openBusinessChat } = useCommunityJobsDemo()
  const readOnly = mode === 'readOnly'
  const [searchParams, setSearchParams] = useSearchParams()

  const activeTab = readOnly ? StaffCommunityJobsTab.Browse : normalizeStaffJobsTab(searchParams.get('jobsTab'))
  const [feedFilters, setFeedFilters] = useState<HiringFeedFilters>({})
  const [detailPosting, setDetailPosting] = useState<PosJobPosting | null>(null)
  const [applyPosting, setApplyPosting] = useState<PosJobPosting | null>(null)
  const [composer, setComposer] = useState<ComposerState | null>(null)
  const [closingPost, setClosingPost] = useState<SeekingPost | null>(null)
  const closeDialogRef = useRef<HTMLDivElement>(null)

  const feedQuery = useStaffHiringFeed(feedFilters, { enabled: activeTab === StaffCommunityJobsTab.Browse })
  const seekingPostsQuery = useStaffSeekingPosts(staffKey)
  const applicationsQuery = useStaffJobApplications(staffKey)
  const closeMutation = useCloseStaffSeekingPost(staffKey)

  // Not gated on `!closeMutation.isPending` while it's a modal dialog with mouse-down-to-close
  // guards elsewhere — Escape should still close it like the other 3 modals, just not abandon
  // an in-flight close request.
  useCommunityJobsModalFocusTrap(
    Boolean(closingPost) && !closeMutation.isPending,
    closeDialogRef,
    () => setClosingPost(null),
  )

  const postings = feedQuery.data?.items ?? []
  const seekingPosts = seekingPostsQuery.data?.items ?? []
  const applications = applicationsQuery.data?.items ?? []
  const appliedPostingIds = useMemo(() => buildAppliedPostingIdSet(applications), [applications])
  const publishedSeekingPosts = useMemo(
    () => seekingPosts.filter(
      (post) => post.status === JobPostingStatus.Published || post.status === JobPostingStatus.Pending,
    ),
    [seekingPosts],
  )

  const setTab = (tab: StaffCommunityJobsTab) => {
    const next = new URLSearchParams(searchParams)
    next.set('jobsTab', tab)
    setSearchParams(next)
  }

  const handleChat = (posting: PosJobPosting) => {
    if (readOnly) {
      showToast(t('community_jobs_demo.readOnly.actionHint'), 'info', 4000)
      return
    }
    // Close the detail modal first — it renders at z-[10000] and would otherwise
    // sit on top of the chat dock/inbox once it opens.
    setDetailPosting(null)
    const action = resolveHiringPostChatAction(posting, linkedBusinessIds)
    if (action.type === 'directChat') {
      void openBusinessChat(action.businessId, getPublicSalonLabel(posting, t))
      return
    }
    openInbox()
    showToast(t('community_jobs_demo.chat.sampleSalonHint'), 'info', 4000)
  }

  const handleApply = (posting: PosJobPosting) => {
    if (readOnly) {
      showToast(t('community_jobs_demo.readOnly.actionHint'), 'info', 4000)
      return
    }
    setApplyPosting(posting)
  }

  const handleCloseSeekingPost = async () => {
    if (!closingPost || closeMutation.isPending) return
    try {
      await closeMutation.mutateAsync(closingPost.id)
      setClosingPost(null)
      showToast(t(`${TK}.myPosts.closeSuccess`), 'success', 3000)
    } catch {
      showToast(t(`${TK}.myPosts.closeFailed`), 'error', 3500)
    }
  }

  const openCreateSeekingPost = () => {
    setComposer({ postId: null })
  }

  const composerInitialDraft = useMemo(() => {
    const editing = composer?.postId ? seekingPosts.find((post) => post.id === composer.postId) : undefined
    return editing ? seekingPostToDraft(editing) : createDefaultSeekingDraft(staffAccount)
  }, [composer?.postId, seekingPosts, staffAccount])

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-nexoraText">{t(`${TK}.pageTitle`)}</h1>
          <p className="mt-1 text-sm font-medium text-nexoraMuted">{t(`${TK}.pageDescription`)}</p>
        </div>
        {readOnly ? (
          <p className="w-fit rounded-md border border-nexoraBorder bg-nexoraSurfaceMuted px-3 py-1.5 text-[11px] font-bold text-nexoraMuted">{t('community_jobs_demo.readOnly.banner')}</p>
        ) : COMMUNITY_JOBS_IS_SIMULATED ? (
          <p className="w-fit rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-800">{t(`${TK}.simulatedNotice`)}</p>
        ) : null}
      </section>

      <div role="tablist" aria-label={t(`${TK}.tabs.ariaLabel`)} className="flex gap-1 overflow-x-auto border-b border-nexoraRule">
        <button type="button" role="tab" aria-selected={activeTab === StaffCommunityJobsTab.Browse} onClick={() => setTab(StaffCommunityJobsTab.Browse)} className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 text-xs font-bold ${activeTab === StaffCommunityJobsTab.Browse ? 'border-nexoraBrand text-nexoraBrand' : 'border-transparent text-nexoraMuted hover:text-nexoraText'}`}>
          <SearchIcon className="h-4 w-4" aria-hidden />{t(`${TK}.tabs.browse`)}
        </button>
        {readOnly ? null : (
          <>
            <button type="button" role="tab" aria-selected={activeTab === StaffCommunityJobsTab.Mine} onClick={() => setTab(StaffCommunityJobsTab.Mine)} className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 text-xs font-bold ${activeTab === StaffCommunityJobsTab.Mine ? 'border-nexoraBrand text-nexoraBrand' : 'border-transparent text-nexoraMuted hover:text-nexoraText'}`}>
              <UserRound className="h-4 w-4" aria-hidden />{t(`${TK}.tabs.mine`)}
            </button>
            <button type="button" role="tab" aria-selected={activeTab === StaffCommunityJobsTab.Applied} onClick={() => setTab(StaffCommunityJobsTab.Applied)} className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 text-xs font-bold ${activeTab === StaffCommunityJobsTab.Applied ? 'border-nexoraBrand text-nexoraBrand' : 'border-transparent text-nexoraMuted hover:text-nexoraText'}`}>
              <Briefcase className="h-4 w-4" aria-hidden />{t(`${TK}.tabs.applied`)}
            </button>
          </>
        )}
      </div>

      {activeTab === StaffCommunityJobsTab.Browse ? (
        <HiringFeedPanel
          filters={feedFilters}
          onFiltersChange={setFeedFilters}
          postings={postings}
          isLoading={feedQuery.isLoading}
          isError={feedQuery.isError}
          appliedPostingIds={appliedPostingIds}
          onOpenDetail={setDetailPosting}
          onApply={handleApply}
          onChat={handleChat}
          onRetry={() => feedQuery.refetch()}
        />
      ) : null}

      {!readOnly && activeTab === StaffCommunityJobsTab.Mine ? (
        <MySeekingPostsPanel
          posts={seekingPosts}
          isLoading={seekingPostsQuery.isLoading}
          isError={seekingPostsQuery.isError}
          onRetry={() => seekingPostsQuery.refetch()}
          onCreate={openCreateSeekingPost}
          onEdit={(post) => setComposer({ postId: post.id })}
          onClose={setClosingPost}
        />
      ) : null}

      {!readOnly && activeTab === StaffCommunityJobsTab.Applied ? (
        <AppliedJobsPanel
          applications={applications}
          isLoading={applicationsQuery.isLoading}
          isError={applicationsQuery.isError}
          onRetry={() => applicationsQuery.refetch()}
          onChat={handleChat}
        />
      ) : null}

      {!readOnly && activeTab === StaffCommunityJobsTab.Mine ? (
        <button
          type="button"
          onClick={openCreateSeekingPost}
          className="fixed bottom-24 right-4 z-30 inline-flex min-h-14 min-w-14 items-center justify-center rounded-full bg-nexoraBrand text-white shadow-lg hover:bg-nexoraBrandDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand lg:hidden"
          aria-label={t(`${TK}.myPosts.createAction`)}
        >
          <Plus className="h-6 w-6" aria-hidden />
        </button>
      ) : null}

      {detailPosting ? (
        <HiringPostDetailModal
          posting={detailPosting}
          alreadyApplied={appliedPostingIds.has(detailPosting.id)}
          onClose={() => setDetailPosting(null)}
          onApply={(posting) => { setDetailPosting(null); handleApply(posting) }}
          onChat={handleChat}
        />
      ) : null}

      {applyPosting ? (
        <ApplyToPostingModal
          posting={applyPosting}
          staffKey={staffKey}
          seekingPosts={publishedSeekingPosts}
          onClose={() => setApplyPosting(null)}
          onApplied={() => { /* list refresh handled by query invalidation in useApplyToHiringPosting */ }}
          onChat={(posting) => { setApplyPosting(null); handleChat(posting) }}
          onViewApplied={() => { setApplyPosting(null); setTab(StaffCommunityJobsTab.Applied) }}
        />
      ) : null}

      {composer ? (
        <SeekingPostComposerModal
          postId={composer.postId}
          initialDraft={composerInitialDraft}
          staffKey={staffKey}
          onClose={() => setComposer(null)}
          onSavedDraft={() => setComposer(null)}
          onPublished={() => setComposer(null)}
        />
      ) : null}

      {closingPost ? createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm" onMouseDown={() => !closeMutation.isPending && setClosingPost(null)}>
          <div
            ref={closeDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="close-seeking-title"
            className="nexora-modal-card flex w-full max-w-md flex-col rounded-2xl border border-nexoraBorder bg-white p-5 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="close-seeking-title" className="text-lg font-black text-nexoraText">{t(`${TK}.myPosts.closeConfirmTitle`)}</h2>
            <p className="mt-3 text-sm font-medium leading-6 text-nexoraMuted">{t(`${TK}.myPosts.closeConfirmBody`, { title: closingPost.title })}</p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" disabled={closeMutation.isPending} onClick={() => setClosingPost(null)} className="min-h-11 rounded-lg border border-nexoraBorder px-4 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted disabled:opacity-50">{t(`${TK}.myPosts.closeConfirmCancel`)}</button>
              <button type="button" disabled={closeMutation.isPending} onClick={handleCloseSeekingPost} className="min-h-11 rounded-lg bg-nexoraBrand px-4 text-xs font-black text-white hover:bg-nexoraBrandDark disabled:opacity-50">{t(`${TK}.myPosts.closeConfirmAction`)}</button>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  )
}

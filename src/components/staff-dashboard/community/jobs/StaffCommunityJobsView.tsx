// Adapted for Community demo
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Briefcase, ExternalLink, Plus, Search as SearchIcon, UserRound } from 'lucide-react'
import './communityJobsTheme.css'

import { StaffCommunityJobsTab } from '../../../../constants/communityJobs'
import { JobPostingStatus } from '../../../../constants/posRecruitment'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import {
  useCloseStaffSeekingPost,
  useStaffHiringFeed,
  useStaffJobApplications,
  useStaffSeekingFeed,
  useStaffSeekingPosts,
} from '../../../../data/hooks/useStaffCommunityJobs'
import { COMMUNITY_JOBS_IS_SIMULATED } from '../../../../data/repositories/communityJobsMockClient'
import { getPublicSalonLabel } from '../../../dashboard/views/pos/recruitment/recruitmentModel'
import PosStaffRecruitmentView from '../../../dashboard/views/pos/recruitment/PosStaffRecruitmentView'
import { useCommunityAuth } from '../../../community/CommunityAuth'
import CommunityTechnicianProfile from '../../../community/jobs/CommunityTechnicianProfile'
import { useCommunityJobsDemo } from '../../../community/jobs/CommunityJobsDemoContext'
import CommunityWorkerSuggestions from '../../../community/jobs/CommunityWorkerSuggestions'
import { CommunityJobsPanel } from '../../../community/CommunityJobDetail'
import { presentCommunityDemoPosting, toCommunityHiringCard, toCommunitySeekingCard } from '../../../community/jobs/communityJobsPresentation'
import type { HiringFeedFilters, SeekingPost, SeekingPostUpsertInput } from '../../../../types/communityJobs'
import type { PosJobPosting } from '../../../../types/posRecruitment'
import AppliedJobsPanel from './AppliedJobsPanel'
import ApplyToPostingModal from './ApplyToPostingModal'
import HiringPostDetailModal from './HiringPostDetailModal'
import MySeekingPostsPanel from './MySeekingPostsPanel'
import SeekingPostComposerModal from './SeekingPostComposerModal'
import SeekingPostCard from './SeekingPostCard'
import {
  createDefaultSeekingDraft,
  buildAppliedPostingIdSet,
  normalizeStaffJobsTab,
  resolveHiringPostChatAction,
  seekingPostToDraft,
} from './staffJobsModel'
import { useCommunityJobsModalFocusTrap } from './useCommunityJobsModalFocusTrap'

const TK = 'staff_dashboard.community.jobs'

interface ComposerState {
  postId: string | null
  draft?: SeekingPostUpsertInput
  needsExperience?: boolean
}

export default function StaffCommunityJobsView() {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()
  const { mode, businessId, staffKey, staffAccount, linkedBusinessIds, openInbox, openBusinessChat } = useCommunityJobsDemo()
  const { user } = useCommunityAuth()
  const readOnly = mode === 'readOnly'
  const owner = mode === 'owner'
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [ownerCreateRequested, setOwnerCreateRequested] = useState(false)
  const [ownerComposing, setOwnerComposing] = useState(false)
  const handleOwnerComposerState = useCallback((composing: boolean) => setOwnerComposing(composing), [])
  const handleOwnerCreateRequestHandled = useCallback(() => setOwnerCreateRequested(false), [])

  const requestedTab = mode === 'staff' && (searchParams.get('tab') === 'profile' || searchParams.get('jobsTab') === 'profile')
    ? 'profile' : normalizeStaffJobsTab(searchParams.get('jobsTab'))
  const activeTab = readOnly || (owner && requestedTab === StaffCommunityJobsTab.Applied) ? StaffCommunityJobsTab.Browse : requestedTab
  const [invitedWorkerIds, setInvitedWorkerIds] = useState<ReadonlySet<string>>(new Set())
  const [feedFilters, setFeedFilters] = useState<HiringFeedFilters>({})
  const [detailPosting, setDetailPosting] = useState<PosJobPosting | null>(null)
  const [applyPosting, setApplyPosting] = useState<PosJobPosting | null>(null)
  const [composer, setComposer] = useState<ComposerState | null>(null)
  const [closingPost, setClosingPost] = useState<SeekingPost | null>(null)
  const closeDialogRef = useRef<HTMLDivElement>(null)
  const previousTabRef = useRef(activeTab)

  const feedQuery = useStaffHiringFeed(COMMUNITY_JOBS_IS_SIMULATED ? {} : feedFilters, { enabled: activeTab === StaffCommunityJobsTab.Browse })
  const seekingFeedQuery = useStaffSeekingFeed(COMMUNITY_JOBS_IS_SIMULATED ? {} : feedFilters, { enabled: activeTab === StaffCommunityJobsTab.Browse })
  const seekingPostsQuery = useStaffSeekingPosts(staffKey)
  const applicationsQuery = useStaffJobApplications(staffKey)
  const closeMutation = useCloseStaffSeekingPost(staffKey)

  // POS writes invalidate only their own list. Refresh this existing feed when returning.
  useEffect(() => {
    if (activeTab !== StaffCommunityJobsTab.Browse) {
      setDetailPosting(null)
      setApplyPosting(null)
    } else if (previousTabRef.current !== StaffCommunityJobsTab.Browse) {
      void feedQuery.refetch()
      void seekingFeedQuery.refetch()
    }
    previousTabRef.current = activeTab
  }, [activeTab, feedQuery.refetch, seekingFeedQuery.refetch])

  const handleBrowseFiltersChange = useCallback((next: HiringFeedFilters) => {
    setFeedFilters((previous) => previous.keyword === next.keyword && previous.city === next.city && previous.state === next.state ? previous : next)
  }, [])

  // Not gated on `!closeMutation.isPending` while it's a modal dialog with mouse-down-to-close
  // guards elsewhere — Escape should still close it like the other 3 modals, just not abandon
  // an in-flight close request.
  useCommunityJobsModalFocusTrap(
    Boolean(closingPost) && !closeMutation.isPending,
    closeDialogRef,
    () => setClosingPost(null),
  )

  const seekingPosts = seekingPostsQuery.data?.items ?? []
  const rawPostingsById = new Map((feedQuery.data?.items ?? []).map((posting) => [posting.id, posting]))
  const displayPosting = (posting: PosJobPosting) => COMMUNITY_JOBS_IS_SIMULATED ? presentCommunityDemoPosting(posting, t) : posting
  const hiringCards = (feedQuery.data?.items ?? []).map((posting) => toCommunityHiringCard(displayPosting(posting), t, currentLanguage))
  const seekingFeedPosts = seekingFeedQuery.data?.items ?? []
  const seekingCards = seekingFeedPosts.map((post) => toCommunitySeekingCard(post, t, currentLanguage))
  const rawSeekingByCardId = new Map(seekingFeedPosts.map((post) => [`public-seeking:${post.id}`, post]))
  const applications = (applicationsQuery.data?.items ?? []).map((application) => ({
    ...application,
    posting: application.posting && COMMUNITY_JOBS_IS_SIMULATED
      ? presentCommunityDemoPosting(application.posting, t)
      : application.posting,
  }))
  const appliedPostingIds = buildAppliedPostingIdSet(applications)
  const publishedSeekingPosts = seekingPosts.filter((post) => post.status === JobPostingStatus.Published || post.status === JobPostingStatus.Pending)

  const setTab = (tab: StaffCommunityJobsTab | 'profile') => {
    if (tab !== StaffCommunityJobsTab.Mine) setOwnerCreateRequested(false)
    const next = new URLSearchParams(searchParams)
    next.set('tab', 'jobs')
    next.set('jobsTab', tab)
    setSearchParams(next)
  }

  const handleChat = (posting: PosJobPosting) => {
    if (readOnly) {
      showToast(t('community_jobs_demo.readOnly.actionHint'), 'info', 4000)
      return
    }
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
    if (owner) return
    if (readOnly) {
      showToast(t('community_jobs_demo.readOnly.actionHint'), 'info', 4000)
      return
    }
    setApplyPosting(rawPostingsById.get(posting.id) ?? posting)
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
    if (composer?.draft) return composer.draft
    const editing = composer?.postId ? seekingPosts.find((post) => post.id === composer.postId) : undefined
    return editing ? seekingPostToDraft(editing) : createDefaultSeekingDraft(staffAccount)
  }, [composer?.postId, composer?.draft, seekingPosts, staffAccount])

  return (
    <div className="community-jobs-theme space-y-5">
      <div className={`flex gap-2 ${owner ? 'flex-wrap items-center sm:flex-nowrap sm:justify-between' : 'items-center justify-between'}`}>
        <div role="tablist" aria-label={t(`${TK}.tabs.ariaLabel`)} className={`no-scrollbar flex min-w-0 gap-1 overflow-x-auto border-b border-nexoraRule ${owner ? 'w-full sm:w-auto sm:flex-1' : 'flex-1'}`}>
          <button type="button" role="tab" aria-selected={activeTab === StaffCommunityJobsTab.Browse} onClick={() => setTab(StaffCommunityJobsTab.Browse)} className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 text-xs font-bold ${activeTab === StaffCommunityJobsTab.Browse ? 'border-nexoraBrand text-nexoraBrand' : 'border-transparent text-nexoraMuted hover:text-nexoraText'}`}>
            <SearchIcon className="h-4 w-4" aria-hidden />{t('community_jobs_browser.tabs.browse')}
          </button>
          {readOnly ? null : (
            <>
              <button type="button" role="tab" aria-selected={activeTab === StaffCommunityJobsTab.Mine} onClick={() => setTab(StaffCommunityJobsTab.Mine)} className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 text-xs font-bold ${activeTab === StaffCommunityJobsTab.Mine ? 'border-nexoraBrand text-nexoraBrand' : 'border-transparent text-nexoraMuted hover:text-nexoraText'}`}>
                <UserRound className="h-4 w-4" aria-hidden />{t(owner ? 'community_jobs_browser.tabs.ownerMine' : 'community_jobs_browser.tabs.mine')}
              </button>
              {owner ? null : <button type="button" role="tab" aria-selected={activeTab === StaffCommunityJobsTab.Applied} onClick={() => setTab(StaffCommunityJobsTab.Applied)} className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 text-xs font-bold ${activeTab === StaffCommunityJobsTab.Applied ? 'border-nexoraBrand text-nexoraBrand' : 'border-transparent text-nexoraMuted hover:text-nexoraText'}`}>
                <Briefcase className="h-4 w-4" aria-hidden />{t(`${TK}.tabs.applied`)}
              </button>}
              {mode === 'staff' ? <button type="button" role="tab" aria-selected={activeTab === 'profile'} onClick={() => setTab('profile')} className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 text-xs font-bold ${activeTab === 'profile' ? 'border-nexoraBrand text-nexoraBrand' : 'border-transparent text-nexoraMuted hover:text-nexoraText'}`}>
                <UserRound className="h-4 w-4" aria-hidden />{t('community_jobs_browser.technicianProfile.tab')}
              </button> : null}
            </>
          )}
        </div>

        {owner && !ownerComposing ? (
          <div className="ml-auto flex w-full flex-wrap justify-end gap-2 sm:w-auto sm:shrink-0">
            <button type="button" aria-label={t('community_jobs_demo.owner.openInPos')} onClick={() => navigate('/pos/staff?staffView=recruitment')} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-nexoraBorder bg-white px-3 text-xs font-bold text-nexoraBrand hover:bg-nexoraBrandSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand">
              <ExternalLink className="h-4 w-4" aria-hidden /><span>{t('community_jobs_demo.owner.openInPos')}</span>
            </button>
            <button type="button" aria-label={t('community_jobs_browser.ownerActions.postJob')} onClick={() => { setOwnerCreateRequested(true); setTab(StaffCommunityJobsTab.Mine) }} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-nexoraBrand px-3 text-xs font-black text-white hover:bg-nexoraBrandDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand focus-visible:ring-offset-2">
              <Plus className="h-4 w-4" aria-hidden /><span>{t('community_jobs_browser.ownerActions.postJob')}</span>
            </button>
          </div>
        ) : mode === 'staff' ? (
          <button type="button" aria-label={t(`${TK}.feed.postSeeking`)} onClick={openCreateSeekingPost} className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-nexoraBrand px-0 text-xs font-black text-white hover:bg-nexoraBrandDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand focus-visible:ring-offset-2 sm:px-4">
            <Plus className="h-4 w-4" aria-hidden /><span className="hidden sm:inline">{t(`${TK}.feed.postSeeking`)}</span>
          </button>
        ) : null}
      </div>

      {mode === 'staff' && staffKey && user?.id ? (
        <CommunityTechnicianProfile
          key={`${user.id}:${staffKey}`}
          identity={`${user.id}:${staffKey}`}
          initialName={typeof staffAccount.fullName === 'string' ? staffAccount.fullName : ''}
          editing={activeTab === 'profile'}
          browsing={false}
          onEdit={() => setTab('profile')}
          onSaved={() => setTab(StaffCommunityJobsTab.Browse)}
          onDraft={(draft, needsExperience) => {
            if (COMMUNITY_JOBS_IS_SIMULATED) setComposer({ postId: null, draft, needsExperience })
          }}
        />
      ) : null}

      <div hidden={activeTab !== StaffCommunityJobsTab.Browse}>
        <CommunityJobsPanel
          browseOnly
          isActive={activeTab === StaffCommunityJobsTab.Browse}
          browseHiringJobs={hiringCards}
          browseSeekingJobs={seekingCards}
          renderSeekingJob={(id) => { const post = rawSeekingByCardId.get(id); return post ? <SeekingPostCard post={post} variant="feed" /> : null }}
          onSelectHiringJob={(id) => setDetailPosting(rawPostingsById.get(id) ?? null)}
          onBrowseFiltersChange={handleBrowseFiltersChange}
          hiringIsLoading={feedQuery.isLoading || seekingFeedQuery.isLoading}
          hiringIsError={feedQuery.isError || seekingFeedQuery.isError}
          onRetryHiring={() => { void feedQuery.refetch(); void seekingFeedQuery.refetch() }}
          browseHeader={
            <>
              {owner ? <CommunityWorkerSuggestions invitedIds={invitedWorkerIds} onInvite={(id) => setInvitedWorkerIds((previous) => new Set([...previous, id]))} /> : null}
              <h2 className="text-lg font-black text-nexoraText">{t('community_jobs_browser.postsTitle')}</h2>
            </>
          }
        />
      </div>

      {owner && activeTab === StaffCommunityJobsTab.Mine ? <PosStaffRecruitmentView businessId={businessId} hideHeader createRequested={ownerCreateRequested} onCreateRequestHandled={handleOwnerCreateRequestHandled} onComposerStateChange={handleOwnerComposerState} /> : null}

      {mode === 'staff' && activeTab === StaffCommunityJobsTab.Mine ? (
        <MySeekingPostsPanel
          posts={seekingPosts}
          isLoading={seekingPostsQuery.isLoading}
          isError={seekingPostsQuery.isError}
          onRetry={() => seekingPostsQuery.refetch()}
          onEdit={(post) => setComposer({ postId: post.id })}
          onClose={setClosingPost}
        />
      ) : null}

      {mode === 'staff' && activeTab === StaffCommunityJobsTab.Applied ? (
        <AppliedJobsPanel
          applications={applications}
          isLoading={applicationsQuery.isLoading}
          isError={applicationsQuery.isError}
          onRetry={() => applicationsQuery.refetch()}
          onChat={handleChat}
        />
      ) : null}

      {activeTab === StaffCommunityJobsTab.Browse && detailPosting ? (
        <HiringPostDetailModal
          posting={displayPosting(detailPosting)}
          alreadyApplied={appliedPostingIds.has(detailPosting.id)}
          canApply={!owner}
          relatedPostings={(feedQuery.data?.items ?? []).map(displayPosting)}
          onOpenRelated={(id) => setDetailPosting(rawPostingsById.get(id) ?? null)}
          onClose={() => setDetailPosting(null)}
          onApply={(posting) => { setDetailPosting(null); handleApply(posting) }}
          onChat={handleChat}
        />
      ) : null}

      {activeTab === StaffCommunityJobsTab.Browse && applyPosting ? (
        <ApplyToPostingModal
          posting={displayPosting(applyPosting)}
          staffKey={staffKey}
          seekingPosts={publishedSeekingPosts}
          onClose={() => setApplyPosting(null)}
          onApplied={() => { /* Existing application hook invalidates the application/feed queries. */ }}
          onChat={(posting) => { setApplyPosting(null); handleChat(posting) }}
          onViewApplied={() => { setApplyPosting(null); setTab(StaffCommunityJobsTab.Applied) }}
        />
      ) : null}

      {mode === 'staff' && composer ? (
        <SeekingPostComposerModal
          postId={composer.postId}
          initialDraft={composerInitialDraft}
          needsExperience={composer.needsExperience}
          staffKey={staffKey}
          onClose={() => setComposer(null)}
          onSavedDraft={() => setComposer(null)}
          onPublished={() => { setComposer(null); if (composer.draft) setTab(StaffCommunityJobsTab.Mine) }}
        />
      ) : null}

      {closingPost ? createPortal(
        <div className="community-jobs-theme fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm" onMouseDown={() => !closeMutation.isPending && setClosingPost(null)}>
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

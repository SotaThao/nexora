// Community Jobs demo (#589) — Jobs tab content, split by signed-in persona:
// Kayla (owner) sees the POS recruitment shell (trimmed) plus a "Duyệt tin" tab that reuses the
// staff browse feed, Jessica (staff) sees the staff hiring feed / seeking posts / applications,
// Linh and guests get a read-only browse view.
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ExternalLink, Plus } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import PosStaffRecruitmentView from '../../dashboard/views/pos/recruitment/PosStaffRecruitmentView'
import StaffCommunityJobsView from '../../staff-dashboard/community/jobs/StaffCommunityJobsView'
import { CommunityJobsDemoProvider, useCommunityDemoPersonaId, useCommunityJobsDemo } from './CommunityJobsDemoContext'

type OwnerJobsView = 'recruitment' | 'browse'

function OwnerJobsTabs() {
  const { t } = useTranslation()
  const { businessId } = useCommunityJobsDemo()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  // Bumped by "Post a Job" so the Recruitment view opens its create picker; reset on manual tab switches
  // so remounting Recruitment later doesn't re-open it.
  const [createRequest, setCreateRequest] = useState(0)
  const activeView: OwnerJobsView = searchParams.get('ownerView') === 'browse' ? 'browse' : 'recruitment'
  const tabs: { key: OwnerJobsView; label: string }[] = [
    { key: 'recruitment', label: t('components.dashboard.views.pos.recruitment.shell.recruitmentTab') },
    { key: 'browse', label: t('staff_dashboard.community.jobs.tabs.browse') },
  ]

  const setView = (view: OwnerJobsView) => {
    setCreateRequest(0)
    const next = new URLSearchParams(searchParams)
    if (view === 'browse') next.set('ownerView', 'browse')
    else next.delete('ownerView')
    setSearchParams(next, { replace: true })
  }

  const postJob = () => {
    if (activeView !== 'recruitment') setView('recruitment')
    setCreateRequest((value) => value + 1)
  }

  return (
    <div className="space-y-4">
      {/* Same sub-tab style as POS › Staff (PosStaffPage); the page titles are dropped and the owner actions
          sit on the right of the tab row for both Tuyển dụng and Duyệt tin. */}
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-nexoraBorder">
      <div role="tablist" aria-label={t('staff_dashboard.community.jobs.tabs.ariaLabel')} className="flex min-w-0 gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const active = tab.key === activeView
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setView(tab.key)}
              className={`min-h-11 shrink-0 border-b-2 px-4 text-sm font-bold transition ${
                active ? 'border-nexoraBrand text-nexoraBrand' : 'border-transparent text-nexoraMuted hover:text-nexoraText'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/pos/staff?staffView=recruitment')}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-xs font-bold text-nexoraBrand hover:bg-nexoraBrandSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            {t('community_jobs_demo.owner.openInPos')}
          </button>
          <button
            type="button"
            onClick={postJob}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-nexoraBrand px-4 text-xs font-black text-white shadow-nexora-soft hover:bg-nexoraBrandDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t('components.dashboard.views.pos.recruitment.shell.recruitStaff')}
          </button>
        </div>
      </div>
      {activeView === 'browse'
        ? <StaffCommunityJobsView browseOnly />
        : <PosStaffRecruitmentView businessId={businessId} createRequest={createRequest} hideHeader />}
    </div>
  )
}

function CommunityJobsTabContent() {
  const { mode } = useCommunityJobsDemo()
  return mode === 'owner' ? <OwnerJobsTabs /> : <StaffCommunityJobsView />
}

export default function CommunityJobsTab() {
  const personaId = useCommunityDemoPersonaId()
  return (
    // `key` forces a fresh Provider (and DemoStaffShell) per persona so switching
    // Jessica ↔ Linh ↔ guest doesn't leak the previous persona's mode/context state.
    <CommunityJobsDemoProvider key={personaId ?? 'guest'}>
      <CommunityJobsTabContent />
    </CommunityJobsDemoProvider>
  )
}

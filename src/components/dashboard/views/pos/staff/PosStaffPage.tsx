// POS Admin demo (#589 follow-up) — public "Staff & Recruitment" page for the /pos/staff
// route. Mirrors the real product's POS > Salon Settings > Staff sub-tabs
// (Nhân viên / Tuyển dụng), driven by ?staffView= so it can be linked to directly
// (e.g. from Kayla's Community Jobs "Mở trong POS" header button).
import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ExternalLink, Plus } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { PosOwnerJobsDemoProvider } from '../../../../community/jobs/CommunityJobsDemoContext'
import { BNB_BUSINESS_ID } from '../../../../community/jobs/communityJobsDemoData'
import PosStaffRecruitmentView from '../recruitment/PosStaffRecruitmentView'
import PosStaffSampleList from './PosStaffSampleList'

const TK = 'components.dashboard.views.pos.recruitment.shell'

type StaffView = 'staff' | 'recruitment'

function resolveStaffView(raw: string | null): StaffView {
  return raw === 'staff' ? 'staff' : 'recruitment'
}

export default function PosStaffPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeView = resolveStaffView(searchParams.get('staffView'))
  // Bumped by the tab-row "Post a Job" button so the Recruitment view opens its composer (same as the Community owner tabs).
  const [createRequest, setCreateRequest] = useState(0)

  const setView = useCallback(
    (next: StaffView) => {
      setCreateRequest(0)
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev)
        params.set('staffView', next)
        return params
      }, { replace: true })
    },
    [setSearchParams],
  )

  const tabs = useMemo(
    () => [
      { key: 'staff' as const, label: t(`${TK}.staffTab`) },
      { key: 'recruitment' as const, label: t(`${TK}.recruitmentTab`) },
    ],
    [t],
  )

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-nexoraText">{t(`${TK}.title`)}</h1>
        <p className="mt-1 text-xs font-medium text-nexoraMuted">{t(`${TK}.description`)}</p>
      </section>

      {/* Same layout as the Community owner Jobs tabs: the Recruitment title block is dropped and its
          actions sit on the right of the Staff / Recruitment tab row. */}
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-nexoraBorder">
      <div
        role="tablist"
        aria-label={t(`${TK}.subtabsAriaLabel`)}
        className="flex min-w-0 gap-1 overflow-x-auto"
      >
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
        {activeView === 'recruitment' ? (
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/community?tab=jobs')}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-xs font-bold text-nexoraBrand hover:bg-nexoraBrandSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              {t('community_jobs_demo.pos.viewOnCommunity')}
            </button>
            <button
              type="button"
              onClick={() => setCreateRequest((value) => value + 1)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-nexoraBrand px-4 text-xs font-black text-white shadow-nexora-soft hover:bg-nexoraBrandDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand focus-visible:ring-offset-2"
            >
              <Plus className="h-4 w-4" aria-hidden />
              {t(`${TK}.recruitStaff`)}
            </button>
          </div>
        ) : null}
      </div>

      {activeView === 'recruitment' ? (
        <PosOwnerJobsDemoProvider>
          <PosStaffRecruitmentView businessId={BNB_BUSINESS_ID} createRequest={createRequest} hideHeader />
        </PosOwnerJobsDemoProvider>
      ) : (
        <PosStaffSampleList />
      )}
    </div>
  )
}

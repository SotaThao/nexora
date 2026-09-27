// POS Admin demo (#589 follow-up) — public "Staff & Recruitment" page for the /pos/staff
// route. Mirrors the real product's POS > Salon Settings > Staff sub-tabs
// (Nhân viên / Tuyển dụng), driven by ?staffView= so it can be linked to directly
// (e.g. from Kayla's Community Jobs "Mở trong POS" header button).
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  const [searchParams, setSearchParams] = useSearchParams()
  const activeView = resolveStaffView(searchParams.get('staffView'))

  const setView = useCallback(
    (next: StaffView) => {
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

      <div
        role="tablist"
        aria-label={t(`${TK}.subtabsAriaLabel`)}
        className="flex gap-1 overflow-x-auto border-b border-nexoraBorder"
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
        <PosOwnerJobsDemoProvider>
          <PosStaffRecruitmentView businessId={BNB_BUSINESS_ID} />
        </PosOwnerJobsDemoProvider>
      ) : (
        <PosStaffSampleList />
      )}
    </div>
  )
}

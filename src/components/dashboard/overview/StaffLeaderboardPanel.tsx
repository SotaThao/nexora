import { Star, Trophy } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { formatCurrency } from '../utils'
import { useDashboardStaff } from '../../../data/hooks/useDashboard'
import Panel from '../../ui/Panel'
import { SkeletonList } from '../../ui/skeleton'
import OverviewEmptyState from './OverviewEmptyState'

function StaffLeaderboardPanel({
  selectedStaff,
  setSelectedStaff,
  hasKyb = true,
  chartStartDate,
  chartEndDate,
  onOpenStaff,
}) {
  const { t } = useTranslation()
  const { data, isLoading, isFetched } = useDashboardStaff({
    startDate: chartStartDate,
    endDate: chartEndDate,
  })

  const rows = [...(data ?? [])]
    .filter((member) => member.name?.trim())
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4)

  const avatarClasses = ['bg-nexoraBrand text-white', 'bg-indigo-500 text-white', 'bg-nexoraLavender text-white', 'bg-indigo-200 text-white']
  const showEmpty = isFetched && !isLoading && rows.length === 0

  return (
    <Panel className="p-4 sm:p-7">
      <h2 className="text-sm font-extrabold text-nexoraText uppercase tracking-wider">{t('dashboard.leaderboard.title')}</h2>

      {isLoading ? (
        <SkeletonList count={4} showAvatar lines={1} className="mt-7" />
      ) : showEmpty ? (
        <div className="mt-7">
          <OverviewEmptyState
            icon={Trophy}
            title={t('components.dashboard.overview.StaffLeaderboardPanel.empty_title')}
            description={t('components.dashboard.overview.StaffLeaderboardPanel.empty_desc')}
            actionLabel={onOpenStaff ? t('components.dashboard.overview.StaffLeaderboardPanel.empty_action') : undefined}
            onAction={onOpenStaff}
          />
        </div>
      ) : (
        <div className="mt-5 space-y-4 sm:mt-7 sm:space-y-7">
          {rows.map((member, index) => (
            <button
              key={member.id || index}
              onClick={() => setSelectedStaff(member.id)}
              className={`dashboard-list-row grid w-full grid-cols-[40px_minmax(0,1fr)_auto] items-start gap-x-3 rounded-lg p-2 text-left transition hover:bg-nexoraSurfaceMuted sm:grid-cols-[48px_minmax(0,1fr)_88px_72px] sm:items-center sm:gap-4 ${selectedStaff === member.id ? 'bg-nexoraBrandSoft' : ''}`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <span className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold sm:mt-0 sm:h-11 sm:w-11 ${avatarClasses[index]}`}>
                {(member.name || 'A').split(' ').map((part) => part[0]).join('')}
              </span>
              <div className="min-w-0">
                <div className="truncate text-base font-semibold text-nexoraText sm:text-lg">{member.name}</div>
                <div className="mt-0.5 text-sm font-bold text-nexoraText sm:hidden">{formatCurrency(member.tips)}</div>
              </div>
              <span className="hidden text-lg font-bold text-nexoraText sm:block">{formatCurrency(member.tips)}</span>
              <span className="mt-1 flex shrink-0 items-center justify-end gap-1 text-sm font-bold text-nexoraWarning sm:mt-0 sm:justify-start">
                <Star className="h-4 w-4 fill-current" />
                {member.rating}
              </span>
            </button>
          ))}
        </div>
      )}
    </Panel>
  )
}

export default StaffLeaderboardPanel

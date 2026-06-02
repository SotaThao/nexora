import { Star } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { formatCurrency } from '../utils'
import { STAFF_PERFORMANCE } from '../data/mockData'
import Panel from '../../ui/Panel'

function StaffLeaderboardPanel({ selectedStaff, setSelectedStaff, hasKyb = true }) {
  const { t } = useTranslation()
  const rows = STAFF_PERFORMANCE.slice(0, 4)
  const avatarClasses = ['bg-nexoraBrand text-white', 'bg-indigo-500 text-white', 'bg-nexoraLavender text-white', 'bg-indigo-200 text-white']

  return (
    <Panel className="p-7">
      <h2 className="text-sm font-extrabold text-nexoraText uppercase tracking-wider">{t('dashboard.leaderboard.title')}</h2>
      <div className="mt-7 space-y-7">
        {rows.map((member, index) => (
          <button
            key={member.name}
            onClick={() => setSelectedStaff(member.nickname)}
            className={`dashboard-list-row grid w-full grid-cols-[40px_minmax(0,1fr)] items-center gap-3 rounded-lg p-2 text-left transition hover:bg-nexoraSurfaceMuted sm:grid-cols-[48px_minmax(0,1fr)_88px_72px] sm:gap-4 ${selectedStaff === member.nickname ? 'bg-nexoraBrandSoft' : ''}`}
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <span className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ${avatarClasses[index]}`}>
              {member.name.split(' ').map((part) => part[0]).join('')}
            </span>
            <span className="truncate text-lg font-semibold text-nexoraText">{index === 2 ? 'Ashley P...' : index === 3 ? 'Hanna Ng...' : member.name}</span>
            <span className="hidden text-lg font-bold text-nexoraText sm:block">{formatCurrency(member.tips)}</span>
            <span className="flex items-center gap-1 text-sm font-bold text-nexoraWarning">
              <Star className="h-4 w-4 fill-current" />
              {member.rating}
            </span>
          </button>
        ))}
      </div>
    </Panel>
  )
}

export default StaffLeaderboardPanel

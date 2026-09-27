// POS Admin demo (#589 follow-up) — top nav for the public /pos* preview routes so the
// owner recruitment screen (POS > Salon Settings > Staff > Recruitment in the real
// product) is reachable from the same place as POS Services, without a community
// persona session. Rendered only by the public /pos* routes in AppRouter — the
// authenticated dashboard (DashboardOwnerShell/Dashboard.tsx) has its own sidebar nav
// and never mounts this.
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from '../../contexts/LanguageContext'

const SERVICES_PATHS = ['/pos', '/pos/services', '/pos-services', '/services', '/preview/pos']

export default function PosAdminDemoNav() {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  const isServicesActive = SERVICES_PATHS.includes(pathname)
  const isStaffActive = pathname.startsWith('/pos/staff') || pathname.startsWith('/pos/recruitment')

  const tabClass = (active: boolean) =>
    `inline-flex min-h-11 shrink-0 items-center rounded-lg px-3.5 text-xs font-bold transition ${
      active
        ? 'bg-nexoraBrand text-white shadow-nexora-soft'
        : 'text-nexoraMuted hover:bg-nexoraSurfaceMuted hover:text-nexoraText'
    }`

  return (
    <nav
      aria-label={t('community_jobs_demo.posNav.staffRecruitment')}
      className="sticky top-0 z-30 border-b border-nexoraBorder bg-nexoraSurface/95 backdrop-blur"
    >
      <div className="flex items-center gap-1 overflow-x-auto px-3 py-2 sm:px-6">
        <Link to="/pos/services" aria-current={isServicesActive ? 'page' : undefined} className={tabClass(isServicesActive)}>
          {t('community_jobs_demo.posNav.services')}
        </Link>
        <Link
          to="/pos/staff?staffView=recruitment"
          aria-current={isStaffActive ? 'page' : undefined}
          className={tabClass(isStaffActive)}
        >
          {t('community_jobs_demo.posNav.staffRecruitment')}
        </Link>
      </div>
    </nav>
  )
}

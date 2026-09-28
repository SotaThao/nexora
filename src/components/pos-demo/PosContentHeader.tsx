// POS Admin demo (#589 follow-up) — breadcrumb + "Salon Settings" tab row shown above the
// routed page content on the public /pos* preview routes. Replaces the old top tab bar
// (PosAdminDemoNav). Matches the approved reference (OneQR pack, "Recruitment · POS ->
// NailHub" screen): "POS / Salon Settings / Staff|Services" breadcrumb, then
// "Salon Information · Staff · Services · Roles & Permissions" tabs — only Staff and
// Services have a real page in this public demo, the other two are inert.
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from '../../contexts/LanguageContext'
import { useNotification } from '../../contexts/NotificationContext'
import { isPosServicesPath, isPosStaffPath } from './posSidebarNavConfig'

const TK = 'components.pos_demo.PosContentHeader'

const STAFF_PATH = '/pos/staff?staffView=recruitment'
const SERVICES_PATH = '/pos/services'

export default function PosContentHeader() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { showToast } = useNotification()

  const isStaffActive = isPosStaffPath(pathname)
  const isServicesActive = !isStaffActive && isPosServicesPath(pathname)
  const activeLeafLabel = isStaffActive ? t(`${TK}.crumbStaff`) : t(`${TK}.crumbServices`)

  const showComingSoon = () => {
    showToast(t('components.pos_demo.PosSidebarNav.comingSoon'), 'info')
  }

  const tabClass = (active: boolean) =>
    `inline-flex min-h-11 shrink-0 items-center rounded-lg border px-3.5 text-xs font-bold transition ${
      active
        ? 'border-nexoraBrandSoft bg-nexoraBrandSoft text-nexoraBrandDark'
        : 'border-nexoraBorder bg-white text-nexoraMuted hover:bg-nexoraSurfaceMuted hover:text-nexoraText'
    }`

  return (
    <div className="border-b border-nexoraBorder bg-nexoraSurface">
      <div
        className={
          'flex flex-wrap items-center gap-1.5 px-4 pt-4 text-xs font-semibold text-nexoraMuted sm:px-6 lg:px-7'
        }
      >
        <span>{t(`${TK}.crumbPos`)}</span>
        <span aria-hidden="true" className="text-nexoraBorder">
          /
        </span>
        <span>{t(`${TK}.crumbSalonSettings`)}</span>
        <span aria-hidden="true" className="text-nexoraBorder">
          /
        </span>
        <span className="font-bold text-nexoraText">{activeLeafLabel}</span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-3 sm:px-6 lg:px-7">
        <button type="button" onClick={showComingSoon} className={tabClass(false)}>
          {t(`${TK}.tabSalonInformation`)}
        </button>
        <Link to={STAFF_PATH} aria-current={isStaffActive ? 'page' : undefined} className={tabClass(isStaffActive)}>
          {t(`${TK}.tabStaff`)}
        </Link>
        <Link
          to={SERVICES_PATH}
          aria-current={isServicesActive ? 'page' : undefined}
          className={tabClass(isServicesActive)}
        >
          {t(`${TK}.tabServices`)}
        </Link>
        <button type="button" onClick={showComingSoon} className={tabClass(false)}>
          {t(`${TK}.tabRolesPermissions`)}
        </button>
      </div>
    </div>
  )
}

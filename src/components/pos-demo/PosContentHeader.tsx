// POS Admin demo (#589 follow-up) — breadcrumb + "Salon Settings" tab row shown above the
// routed page content on the public /pos* preview routes. The tab row mirrors the REAL
// product's own tab strip (src/components/dashboard/views/pos/PosSalonSettingsView.tsx in
// vlink-nexora-fe: icon + label pills, active = bg-nexoraBrand) and reuses its exact i18n
// keys — only Staff and Services have a real page in this public demo, the rest are inert.
import { Building2, Layers, List, ShieldCheck, Users, type LucideIcon } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from '../../contexts/LanguageContext'
import { useNotification } from '../../contexts/NotificationContext'
import { isPosServicesPath, isPosStaffPath } from './posSidebarNavConfig'

const TK = 'components.pos_demo.PosContentHeader'
const SALON_SETTINGS_TK = 'components.dashboard.views.pos.PosSalonSettingsView.tabs'

const STAFF_PATH = '/pos/staff?staffView=recruitment'
const SERVICES_PATH = '/pos/services'

type TabDefinition = {
  id: 'salonInformation' | 'staff' | 'services' | 'rolesPermissions' | 'staffLevels'
  Icon: LucideIcon
}

const TABS: TabDefinition[] = [
  { id: 'salonInformation', Icon: Building2 },
  { id: 'staff', Icon: Users },
  { id: 'services', Icon: List },
  { id: 'rolesPermissions', Icon: ShieldCheck },
  { id: 'staffLevels', Icon: Layers },
]

export default function PosContentHeader() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { showToast } = useNotification()

  const isStaffActive = isPosStaffPath(pathname)
  const isServicesActive = !isStaffActive && isPosServicesPath(pathname)
  const activeLeafLabel = isStaffActive ? t(`${SALON_SETTINGS_TK}.staff`) : t(`${SALON_SETTINGS_TK}.services`)

  const showComingSoon = () => {
    showToast(t('components.pos_demo.PosSidebarNav.comingSoon'), 'info')
  }

  const tabClass = (active: boolean) =>
    [
      'inline-flex min-h-11 min-w-0 shrink-0 items-center gap-2 rounded-lg border px-3 py-2',
      'text-xs font-bold transition',
      active
        ? 'border-transparent bg-nexoraBrand text-white shadow-nexora-soft'
        : 'border-nexoraBorder bg-nexoraSurface text-nexoraMuted hover:border-nexoraLavender ' +
          'hover:bg-nexoraSurfaceMuted hover:text-nexoraText',
    ].join(' ')

  const iconWrapClass = (active: boolean) =>
    [
      'grid h-6 w-6 shrink-0 place-items-center rounded-lg',
      active ? 'bg-white/15 text-white' : 'bg-nexoraSurfaceMuted text-nexoraBrand',
    ].join(' ')

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

      <nav
        aria-label={t(`${SALON_SETTINGS_TK}.ariaLabel`)}
        className="flex items-center gap-1.5 overflow-x-auto px-4 py-3 sm:px-6 lg:px-7"
      >
        {TABS.map(({ id, Icon }) => {
          const label = t(`${SALON_SETTINGS_TK}.${id}`)

          if (id === 'staff') {
            return (
              <Link
                key={id}
                to={STAFF_PATH}
                aria-current={isStaffActive ? 'page' : undefined}
                className={tabClass(isStaffActive)}
              >
                <span className={iconWrapClass(isStaffActive)}>
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span>{label}</span>
              </Link>
            )
          }

          if (id === 'services') {
            return (
              <Link
                key={id}
                to={SERVICES_PATH}
                aria-current={isServicesActive ? 'page' : undefined}
                className={tabClass(isServicesActive)}
              >
                <span className={iconWrapClass(isServicesActive)}>
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span>{label}</span>
              </Link>
            )
          }

          return (
            <button key={id} type="button" onClick={showComingSoon} className={tabClass(false)}>
              <span className={iconWrapClass(false)}>
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span>{label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

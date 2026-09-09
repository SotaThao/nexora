import { Navigate, NavLink, useLocation, useParams } from 'react-router-dom'
import { Building2, Layers, List, ShieldCheck, Users, type LucideIcon } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import {
  isPosSalonSettingsTab,
  posSalonSettingsPath,
  PosSalonSettingsTab,
} from '../../../../constants/posSalonSettings'
import PosGeneralSettingsView from './PosGeneralSettingsView'
import PosRolesView from './PosRolesView'
import PosServicesView from './PosServicesView'
import PosStaffLevelsView from './PosStaffLevelsView'
import PosStaffProfileView from './PosStaffProfileView'

type Props = {
  verificationStatus?: string
  businessId: string
}

const TK = 'components.dashboard.views.pos.PosSalonSettingsView'

type SalonSettingsTabDefinition = {
  id: PosSalonSettingsTab
  label: string
  Icon: LucideIcon
}

export default function PosSalonSettingsView({ verificationStatus, businessId }: Props) {
  const { t } = useTranslation()
  const location = useLocation()
  const { settingsTab } = useParams<{ settingsTab: string }>()

  if (!isPosSalonSettingsTab(settingsTab)) {
    return (
      <Navigate
        to={`${posSalonSettingsPath(PosSalonSettingsTab.SalonInformation)}${location.search}`}
        replace
      />
    )
  }

  const tabs: SalonSettingsTabDefinition[] = [
    {
      id: PosSalonSettingsTab.SalonInformation,
      label: t(`${TK}.tabs.salonInformation`),
      Icon: Building2,
    },
    { id: PosSalonSettingsTab.Staff, label: t(`${TK}.tabs.staff`), Icon: Users },
    {
      id: PosSalonSettingsTab.Services,
      label: t(`${TK}.tabs.services`),
      Icon: List,
    },
    {
      id: PosSalonSettingsTab.RolesPermissions,
      label: t(`${TK}.tabs.rolesPermissions`),
      Icon: ShieldCheck,
    },
    {
      id: PosSalonSettingsTab.StaffLevels,
      label: t(`${TK}.tabs.staffLevels`),
      Icon: Layers,
    },
  ]

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <header className="space-y-1 px-0.5">
        <h1 className="text-xl font-extrabold leading-tight tracking-tight text-nexoraText">
          {t(`${TK}.title`)}
        </h1>
        <p className="text-xs font-medium text-nexoraMuted">{t(`${TK}.description`)}</p>
      </header>

      <nav
        className="grid grid-cols-2 gap-1 sm:flex sm:flex-wrap"
        aria-label={t(`${TK}.tabs.ariaLabel`)}
      >
        {tabs.map(({ id, label, Icon }) => (
          <NavLink
            key={id}
            to={`${posSalonSettingsPath(id)}${location.search}`}
            className={({ isActive }) =>
              [
                'inline-flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-lg border px-1 py-1.5 text-center text-xs font-bold leading-tight transition sm:min-h-11 sm:flex-row sm:px-3 sm:py-2',
                isActive
                  ? 'border-transparent bg-nexoraBrand text-white shadow-nexora-soft'
                  : 'border-nexoraBorder bg-nexoraSurface text-nexoraMuted hover:border-nexoraLavender hover:bg-nexoraSurfaceMuted hover:text-nexoraText',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={[
                    'grid h-6 w-6 shrink-0 place-items-center rounded-lg sm:h-7 sm:w-7',
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'bg-nexoraSurfaceMuted text-nexoraBrand',
                  ].join(' ')}
                >
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                </span>
                <span className="min-w-0 break-words">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="min-h-0 flex-1">
        {settingsTab === PosSalonSettingsTab.SalonInformation ? (
          <PosGeneralSettingsView
            embedded
            verificationStatus={verificationStatus}
            businessId={businessId}
          />
        ) : null}
        {settingsTab === PosSalonSettingsTab.Staff ? <PosStaffProfileView embedded /> : null}
        {settingsTab === PosSalonSettingsTab.Services ? <PosServicesView embedded /> : null}
        {settingsTab === PosSalonSettingsTab.RolesPermissions ? <PosRolesView embedded /> : null}
        {settingsTab === PosSalonSettingsTab.StaffLevels ? <PosStaffLevelsView embedded /> : null}
      </div>
    </div>
  )
}

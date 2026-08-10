import { useCallback, useEffect } from 'react'
import { Boxes, History, LayoutGrid, Sparkles } from 'lucide-react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { useTranslation } from '../../../../contexts/LanguageContext'
import PackageHistoryPanel from '../plans/PackageHistoryPanel'
import { PhoneTabIcon } from '../BookingHubIcons'
import PackageAiVoicePlansPanel from './PackageAiVoicePlansPanel'
import PackageOverviewPanel from './PackageOverviewPanel'
import PackageSubscriptionsPanel from './PackageSubscriptionsPanel'
import {
  isKnownPackageManagementTab,
  PACKAGE_MANAGEMENT_TAB_I18N_KEY,
  PACKAGE_MANAGEMENT_TAB_ORDER,
  PACKAGE_MANAGEMENT_TAB_QUERY,
  PACKAGE_MANAGEMENT_TK,
  PACKAGE_QUERY_PARAM,
  PackageManagementTab,
  packagePanelDomId,
  packageTabDomId,
  parsePackageManagementTab,
} from './constants'
import { stripPlanQueryParam } from './tipPlatformCheckout'
import './package-management.css'
import '../booking-hub.css'

const TK = PACKAGE_MANAGEMENT_TK

const TAB_ICON = {
  [PackageManagementTab.Overview]: LayoutGrid,
  [PackageManagementTab.Subscriptions]: Sparkles,
  [PackageManagementTab.AiVoice]: PhoneTabIcon,
  [PackageManagementTab.History]: History,
} as const

export default function PackageManagementView() {
  const { t } = useTranslation()
  const ctx = useOutletContext<LooseObject>()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = parsePackageManagementTab(
    searchParams.get(PACKAGE_QUERY_PARAM.tab),
  )

  /** Canonicalize ?tab= (missing / casing / invalid) and strip orphan ?plan=. */
  useEffect(() => {
    const raw = searchParams.get(PACKAGE_QUERY_PARAM.tab)
    const next = new URLSearchParams(searchParams)
    let changed = false

    if (raw == null || raw === '') {
      next.set(PACKAGE_QUERY_PARAM.tab, PackageManagementTab.Overview)
      changed = true
    } else {
      const normalized = raw.trim().toLowerCase()
      if (!isKnownPackageManagementTab(normalized)) {
        next.set(PACKAGE_QUERY_PARAM.tab, PackageManagementTab.Overview)
        next.delete(PACKAGE_QUERY_PARAM.plan)
        changed = true
      } else if (raw !== normalized) {
        next.set(PACKAGE_QUERY_PARAM.tab, normalized)
        changed = true
      }
    }

    const tab = parsePackageManagementTab(next.get(PACKAGE_QUERY_PARAM.tab))
    if (tab !== PackageManagementTab.Subscriptions && next.has(PACKAGE_QUERY_PARAM.plan)) {
      next.delete(PACKAGE_QUERY_PARAM.plan)
      changed = true
    }

    if (changed) setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const setTab = useCallback(
    (tab: PackageManagementTab) => {
      const next = new URLSearchParams(searchParams)
      next.set(PACKAGE_QUERY_PARAM.tab, tab)
      if (tab !== PackageManagementTab.Subscriptions) {
        const stripped = stripPlanQueryParam(next)
        setSearchParams(stripped ?? next)
        return
      }
      setSearchParams(next)
    },
    [searchParams, setSearchParams],
  )

  let activePanel
  switch (activeTab) {
    case PackageManagementTab.Subscriptions:
      activePanel = <PackageSubscriptionsPanel profile={ctx?.profile} />
      break
    case PackageManagementTab.AiVoice:
      activePanel = <PackageAiVoicePlansPanel />
      break
    case PackageManagementTab.History:
      activePanel = (
        <div className="booking-hub-view package-history-host">
          <PackageHistoryPanel queryOptions={PACKAGE_MANAGEMENT_TAB_QUERY} />
        </div>
      )
      break
    case PackageManagementTab.Overview:
    default:
      activePanel = <PackageOverviewPanel />
      break
  }

  return (
    <div className="package-management-view">
      <header className="package-heading">
        <div className="package-heading-row">
          <span className="package-heading-icon" aria-hidden="true">
            <Boxes />
          </span>
          <div>
            <h1 className="page-title">{t(`${TK}.title`)}</h1>
            <p className="page-description">{t(`${TK}.description`)}</p>
          </div>
        </div>
      </header>

      <div
        className="package-tabs"
        role="tablist"
        aria-label={t(`${TK}.ariaTabs`)}
      >
        {PACKAGE_MANAGEMENT_TAB_ORDER.map((tab) => {
          const Icon = TAB_ICON[tab]
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              id={packageTabDomId(tab)}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={packagePanelDomId(tab)}
              tabIndex={isActive ? 0 : -1}
              className={`package-tab${isActive ? ' is-active' : ''}`}
              onClick={() => setTab(tab)}
            >
              <span className="package-tab-icon">
                <Icon />
              </span>
              {t(`${TK}.${PACKAGE_MANAGEMENT_TAB_I18N_KEY[tab]}`)}
            </button>
          )
        })}
      </div>

      <div
        id={packagePanelDomId(activeTab)}
        className="package-panel"
        role="tabpanel"
        aria-labelledby={packageTabDomId(activeTab)}
      >
        {activePanel}
      </div>
    </div>
  )
}

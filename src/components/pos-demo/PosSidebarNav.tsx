// POS Admin demo (#589 follow-up) — demo-local replica of the REAL Nexora owner sidebar
// (src/components/dashboard/layout/DashboardSidebar.tsx + MobileMenuDrawer.tsx in
// vlink-nexora-fe), rendered inside both the fixed desktop PosSidebar and the mobile
// PosSidebarDrawer. The production shell cannot be mounted on this public, auth-less route
// (it consumes auth/query state — see community/demo/DemoMerchantShell.tsx for the same
// pattern), so this rebuilds only its visual structure: business card, Home, menu rows
// (Payments & Payouts / AI Hub / Gift Card Center reuse the real shared component +
// constants), the POS group (the only real link is "Salon Settings"), plan card, sign-out.
import { Fragment, useState } from 'react'
import { ChevronDown, ChevronUp, Home, LogOut } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from '../../contexts/LanguageContext'
import { useNotification } from '../../contexts/NotificationContext'
import { BNB_BUSINESS_INFO } from '../community/jobs/communityJobsDemoData'
import PaymentsPayoutsMenuSection from '../dashboard/layout/PaymentsPayoutsMenuSection'
import MenuIcon from '../ui/MenuIcon'
import SidebarPlanCard from '../ui/SidebarPlanCard'
import {
  SIDEBAR_NAV_CLASS,
  SIDEBAR_PROFILE_CARD_CLASS,
  SIDEBAR_AVATAR_FALLBACK_CLASS,
  SIDEBAR_SIGN_OUT_WRAP_CLASS,
  SIDEBAR_SUBMENU_WRAP_CLASS,
  sidebarMenuItemBetweenClass,
  sidebarMenuItemClass,
  sidebarSubmenuItemClass,
} from '../ui/sidebarMenuStyles'
import {
  AI_HUB_SUBMENU,
  GIFT_CARD_CENTER_SUBMENU,
  POS_DEMO_SIDEBAR_MENU_ITEMS,
  POS_DEMO_SUBMENU,
  POS_SALON_SETTINGS_CHILD_ID,
} from './posRealSidebarMenu'
import { isPosGroupActive, isSalonSettingsActive, SALON_SETTINGS_DEFAULT_PATH } from './posSidebarNavConfig'

const TK = 'components.pos_demo.PosSidebarNav'

type PosSidebarNavProps = {
  onNavigate?: () => void
}

export default function PosSidebarNav({ onNavigate }: PosSidebarNavProps) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { showToast } = useNotification()

  const isPosActive = isPosGroupActive(pathname)
  const isSalonSettingsChildActive = isSalonSettingsActive(pathname)

  const [isPaymentsExpanded, setIsPaymentsExpanded] = useState(false)
  const [isAiHubExpanded, setIsAiHubExpanded] = useState(false)
  const [isPosExpanded, setIsPosExpanded] = useState(true)
  const [isGiftCardExpanded, setIsGiftCardExpanded] = useState(false)

  const handleInert = () => {
    showToast(t(`${TK}.comingSoon`), 'info')
  }

  return (
    <>
      <div className={SIDEBAR_PROFILE_CARD_CLASS}>
        <button
          type="button"
          onClick={handleInert}
          aria-label={t(`${TK}.businessSwitcherAria`)}
          className="flex min-h-11 w-full items-center justify-between text-left"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className={`${SIDEBAR_AVATAR_FALLBACK_CLASS} shrink-0 bg-amber-400/20 text-amber-300`}>
              {BNB_BUSINESS_INFO.name.charAt(0)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-white">{BNB_BUSINESS_INFO.name}</span>
            </span>
          </span>
          <span className="ml-2 shrink-0 text-white/85">
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </span>
        </button>
      </div>

      <nav className={SIDEBAR_NAV_CLASS} aria-label={t(`${TK}.navAriaLabel`)}>
        <button type="button" onClick={handleInert} className={`${sidebarMenuItemClass(false)} border-0`}>
          <MenuIcon item={{ icon: Home }} active={false} />
          <span className="truncate">{t('dashboard.menu.home')}</span>
        </button>

        {POS_DEMO_SIDEBAR_MENU_ITEMS.map((item) => {
          const isPos = item.id === 'pos'
          const isAiHub = item.id === 'ai-hub'
          const isGiftCard = item.id === 'product-management'
          const isActive = isPos && isPosActive

          const isExpanded = isPos ? isPosExpanded : isAiHub ? isAiHubExpanded : isGiftCard ? isGiftCardExpanded : false

          const handleClick = () => {
            if (isPos) {
              setIsPosExpanded((prev) => !prev)
            } else if (isAiHub) {
              setIsAiHubExpanded((prev) => !prev)
            } else if (isGiftCard) {
              setIsGiftCardExpanded((prev) => !prev)
            }
            handleInert()
          }

          return (
            <Fragment key={item.id}>
              <button
                type="button"
                aria-expanded={item.expandable ? isExpanded : undefined}
                onClick={handleClick}
                className={sidebarMenuItemBetweenClass(isActive)}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <MenuIcon item={item} active={isActive} />
                  <span className="truncate">{t(item.labelKey)}</span>
                </span>
                {item.expandable ? (
                  <span className="ml-auto shrink-0 text-white/50">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="h-4 w-4" aria-hidden="true" />
                    )}
                  </span>
                ) : null}
              </button>

              {item.id === 'overview' ? (
                <PaymentsPayoutsMenuSection
                  activeMenu="pos"
                  tabParam={null}
                  isExpanded={isPaymentsExpanded}
                  onToggle={() => {
                    setIsPaymentsExpanded((prev) => !prev)
                    handleInert()
                  }}
                  onNavigate={handleInert}
                />
              ) : null}

              {isAiHub && isAiHubExpanded ? (
                <div className={SIDEBAR_SUBMENU_WRAP_CLASS}>
                  {AI_HUB_SUBMENU.map((sub) => (
                    <button key={sub.id} type="button" onClick={handleInert} className={sidebarSubmenuItemClass(false)}>
                      <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
                      <span>{t(sub.labelKey)}</span>
                    </button>
                  ))}
                </div>
              ) : null}

              {isGiftCard && isGiftCardExpanded ? (
                <div className={SIDEBAR_SUBMENU_WRAP_CLASS}>
                  {GIFT_CARD_CENTER_SUBMENU.map((sub) => (
                    <button key={sub.id} type="button" onClick={handleInert} className={sidebarSubmenuItemClass(false)}>
                      <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
                      <span>{t(sub.labelKey)}</span>
                    </button>
                  ))}
                </div>
              ) : null}

              {isPos && isPosExpanded ? (
                <div className={SIDEBAR_SUBMENU_WRAP_CLASS}>
                  {POS_DEMO_SUBMENU.map((sub) => {
                    const isSalonSettings = sub.id === POS_SALON_SETTINGS_CHILD_ID
                    const isSubActive = isSalonSettings && isSalonSettingsChildActive

                    if (isSalonSettings) {
                      return (
                        <Link
                          key={sub.id}
                          to={SALON_SETTINGS_DEFAULT_PATH}
                          onClick={() => onNavigate?.()}
                          aria-current={isSubActive ? 'page' : undefined}
                          className={sidebarSubmenuItemClass(isSubActive)}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isSubActive ? 'bg-brandCyan shadow-sm' : 'bg-white/30'
                            }`}
                          />
                          <span>{t(sub.labelKey)}</span>
                        </Link>
                      )
                    }

                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={handleInert}
                        className={sidebarSubmenuItemClass(false)}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
                        <span>{t(sub.labelKey)}</span>
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </Fragment>
          )
        })}
      </nav>

      <div className="mt-auto shrink-0 space-y-3 pt-3">
        <SidebarPlanCard
          subscriptionCopy={{ planLabel: t(`${TK}.planLabel`), detailLabel: t(`${TK}.planDetail`) }}
          onManagePlan={handleInert}
          t={t}
        />

        <div className={`${SIDEBAR_SIGN_OUT_WRAP_CLASS} border-t-0 pt-0`}>
          <button
            type="button"
            onClick={handleInert}
            className={
              'flex min-h-11 w-full items-center gap-2 px-3 py-2 text-sm font-bold text-white/65 ' +
              'transition hover:text-white'
            }
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {t('dashboard.sidebar.sign_out')}
          </button>
        </div>
      </div>
    </>
  )
}

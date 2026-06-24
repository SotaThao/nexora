// DashboardSidebar — left nav: brand, profile card, plan card, menu w/ tips & touchpoints sub-tabs.
// Extracted from Dashboard.jsx (Group 2 refactor).
import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronUp, ChevronDown, LogOut } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { visibleMenuItems } from '../constants'
import MenuIcon from '../../ui/MenuIcon'
import HomepageLink from '../../ui/HomepageLink'
import { getSubscriptionSidebarCopy } from '../../../utils/subscriptionDisplay'

export default function DashboardSidebar({
  activeMenu,
  setActiveMenu,
  businessName,
  profile,
  subscription = null,
  settingsTab,
  setSettingsTab,
  isProfileExpanded,
  setIsProfileExpanded,
  hasKyb = true,
  verificationStatus = 'kyb_approved',
  onBlockedFeatureClick,
  onLogout,
  tipsTab = 'overview',
  setTipsTab,
  touchpointsTab = 'stations',
  setTouchpointsTab,
  userRole = 'owner'
}) {
  const { currentLanguage, setLanguage, t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // Sub-tabs are URL-driven (?tab=) so the sidebar highlight stays in sync with
  // the rendered route content (TipsRoute / TouchpointsRoute read the same param).
  const activeSubTab = searchParams.get('tab')
  const [isTipsExpanded, setIsTipsExpanded] = useState(activeMenu === 'tips')
  const [isTouchpointsExpanded, setIsTouchpointsExpanded] = useState(activeMenu === 'touchpoints')
  const subscriptionCopy = getSubscriptionSidebarCopy(
    subscription ?? profile?.subscription,
    t,
    currentLanguage,
  )

  useEffect(() => {
    if (activeMenu === 'tips') {
      setIsTipsExpanded(true)
      setIsTouchpointsExpanded(false)
    } else if (activeMenu === 'touchpoints') {
      setIsTouchpointsExpanded(true)
      setIsTipsExpanded(false)
    }
  }, [activeMenu])

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-nexoraSidebar px-5 py-7 text-white lg:flex">
      {/* Expandable Profile Card */}
      <div className="rounded-xl border border-white/15 bg-white/5 p-4 shrink-0">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsProfileExpanded(!isProfileExpanded)}>
          <div className="flex items-center gap-3 min-w-0">
            {profile.avatar && !profile.avatar.includes('unsplash.com') ? (
              <img src={profile.avatar} alt="" className="h-10 w-10 shrink-0 rounded-full border border-white/15 object-cover" />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-nexoraElectric to-nexoraViolet text-sm font-extrabold uppercase">
                {(businessName || profile.email || '').slice(0, 2).toUpperCase() || '?'}
              </div>
            )}
            <div className="min-w-0">
              {/* Top line: business name when present (same bold style), else
                  fall back to owner name / email. Email shown below only when
                  there is no business name to avoid redundant identity lines. */}
              <div className="flex items-center gap-1 min-w-0">
                <div className="truncate text-sm font-bold text-white">{businessName || profile.fullName || profile.email}</div>
              </div>
              {!businessName && (
                <div className="text-[10px] text-white/60 truncate mt-0.5">{profile.email}</div>
              )}
            </div>
          </div>
          <div className="text-white/85 hover:text-white transition ml-2">
            {isProfileExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>

        {/* Submenu links */}
        {isProfileExpanded && userRole !== 'staff' && (
          <div className="mt-3.5 pt-3 border-t border-white/5 space-y-1 animate-fadeIn">
            <button
              onClick={() => {
                setActiveMenu('settings')
                setSettingsTab('profile')
              }}
              className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-bold transition ${
                activeMenu === 'settings' && settingsTab === 'profile'
                  ? 'text-brandCyan font-extrabold'
                  : 'text-white/75 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className={`h-1.5 w-1.5 rounded-full ${activeMenu === 'settings' && settingsTab === 'profile' ? 'bg-brandCyan shadow-sm' : 'bg-white/30'}`} />
              <span>{t('dashboard.menu.business_setting')}</span>
            </button>
            <button
              onClick={() => {
                setActiveMenu('settings')
                setSettingsTab('kyb')
              }}
              className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-bold transition ${
                activeMenu === 'settings' && settingsTab === 'kyb'
                  ? 'text-brandCyan font-extrabold'
                  : 'text-white/75 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className={`h-1.5 w-1.5 rounded-full ${activeMenu === 'settings' && settingsTab === 'kyb' ? 'bg-brandCyan shadow-sm' : 'bg-white/30'}`} />
              <span>{t('dashboard.menu.kyb')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Card 2: Current Plan & Manage Plan */}
      {userRole !== 'staff' && (
        <div className="mt-3 rounded-xl border border-white/15 bg-white/5 p-4 shrink-0">
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-white/45">
          {t('dashboard.sidebar.current_plan_header')}
        </div>
        {subscriptionCopy.planLabel ? (
          <>
            <div className="mt-1 text-sm font-black text-white">
              {subscriptionCopy.planLabel}
            </div>
            {subscriptionCopy.detailLabel ? (
              <div className="mt-1 text-xs text-white/55">
                {subscriptionCopy.detailLabel}
              </div>
            ) : null}
          </>
        ) : (
          <div className="mt-1 text-xs font-semibold text-rose-400">
            {t('dashboard.sidebar.no_plan')}
          </div>
        )}
        <button
          type="button"
          onClick={() => setActiveMenu('subscriptions')}
          className="mt-3.5 w-full rounded-lg border border-white/15 py-1.5 text-center text-xs font-bold text-luxuryGold hover:bg-white/5 hover:border-white/25 transition-all"
        >
          {t('dashboard.sidebar.manage_plan')}
        </button>
      </div>
      )}

      {/* Navigation Menu */}
      <nav className="mt-6 flex-1 space-y-1.5 overflow-y-auto pr-1">
        <HomepageLink variant="menu" />
        {(() => {
          const menuItemsToDisplay = userRole === 'staff'
            ? [
                { id: 'overview', label: t('components.dashboard.layout.DashboardSidebar.myDashboard'), icon: visibleMenuItems.find(i => i.id === 'overview')?.icon, image: visibleMenuItems.find(i => i.id === 'overview')?.image },
                { id: 'support', label: t('dashboard.menu.support'), icon: visibleMenuItems.find(i => i.id === 'support')?.icon, image: visibleMenuItems.find(i => i.id === 'support')?.image }
              ]
            : visibleMenuItems

          return menuItemsToDisplay.map((item) => {
          const { id, label } = item
          const isActive = activeMenu === id
          const localizedLabel = {
            overview: t('dashboard.menu.dashboard'),
            staff: t('dashboard.menu.staff'),
            tips: t('dashboard.menu.tips'),
            reviews: t('dashboard.menu.reviews'),
            reports: t('dashboard.menu.transactions'),
            touchpoints: t('dashboard.menu.touchpoints'),
            devices: t('dashboard.menu.qr_nfc'),
            analytics: t('dashboard.menu.analytics'),
            support: t('dashboard.menu.support')
          }[id] || label

          return (
            <React.Fragment key={id}>
              <button
                onClick={() => {
                  setActiveMenu(id)
                  if (id === 'tips') {
                    setIsTipsExpanded(!isTipsExpanded)
                  }
                  if (id === 'touchpoints') {
                    setIsTouchpointsExpanded(!isTouchpointsExpanded)
                  }
                }}
                className={`flex h-12 w-full items-center justify-between rounded-lg px-4 text-left text-sm font-bold transition ${
                  isActive
                    ? 'bg-gradient-to-r from-nexoraElectric to-nexoraViolet text-white shadow-lg shadow-nexoraElectric/20'
                    : 'text-white/85 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <MenuIcon item={item} active={isActive} />
                  <span className="truncate">{localizedLabel}</span>
                </div>
                {(id === 'tips' || id === 'touchpoints') && (
                  <div className="text-white/50 shrink-0">
                    {id === 'tips'
                      ? (isTipsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)
                      : (isTouchpointsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)
                    }
                  </div>
                )}
              </button>

              {id === 'tips' && isTipsExpanded && (
                <div className="ml-9 mt-1 space-y-1 border-l border-white/15 pl-3 animate-fadeIn">
                  {[
                    { id: 'overview', label: t('dashboard.tips.tabs.overview') },
                    { id: 'savings', label: t('dashboard.tips.tabs.savings') },
                    { id: 'payouts', label: t('dashboard.tips.tabs.payouts') }
                  ].map(sub => {
                    const isSubActive = activeMenu === 'tips' && (activeSubTab || 'overview') === sub.id
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          navigate(`/dashboard/tips?tab=${sub.id}`, { replace: true })
                        }}
                        className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-bold transition ${
                          isSubActive
                            ? 'text-brandCyan font-extrabold'
                            : 'text-white/75 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className={`h-1.5 w-1.5 rounded-full ${isSubActive ? 'bg-brandCyan shadow-sm' : 'bg-white/30'}`} />
                        <span>{sub.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {id === 'touchpoints' && isTouchpointsExpanded && (
                <div className="ml-9 mt-1 space-y-1 border-l border-white/15 pl-3 animate-fadeIn">
                  {[
                    { id: 'stations', label: t('dashboard.touchpoints.tabs.stations') },
                  ].map(sub => {
                    const isSubActive = activeMenu === 'touchpoints' && (activeSubTab || 'stations') === sub.id
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          navigate(`/dashboard/touchpoints?tab=${sub.id}`, { replace: true })
                        }}
                        className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-bold transition ${
                          isSubActive
                            ? 'text-brandCyan font-extrabold'
                            : 'text-white/75 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className={`h-1.5 w-1.5 rounded-full ${isSubActive ? 'bg-brandCyan shadow-sm' : 'bg-white/30'}`} />
                        <span>{sub.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </React.Fragment>
          )
        })
      })()}
      </nav>

      {/* Bottom Sign Out */}
      <div className="mt-auto pt-4 border-t border-white/15 shrink-0">
        <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-white/65 transition hover:text-white w-full">
          <LogOut className="h-4 w-4" />
          {t('dashboard.sidebar.sign_out')}
        </button>
      </div>
    </aside>
  )
}

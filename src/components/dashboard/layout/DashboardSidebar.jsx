// DashboardSidebar — left nav: brand, profile card, plan card, menu w/ tips & touchpoints sub-tabs.
// Extracted from Dashboard.jsx (Group 2 refactor).
import React, { useEffect, useState } from 'react'
import { ChevronUp, ChevronDown, LogOut } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { visibleMenuItems } from '../constants'
import MenuIcon from '../../ui/MenuIcon'

export default function DashboardSidebar({
  activeMenu,
  setActiveMenu,
  businessName,
  profile,
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
  const [isTipsExpanded, setIsTipsExpanded] = useState(activeMenu === 'tips')
  const [isTouchpointsExpanded, setIsTouchpointsExpanded] = useState(activeMenu === 'touchpoints')

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
      {/* Logo block */}
      <div className="flex items-center gap-3 px-2">
        <img src="/assets/nexora-logo.png" alt="Nexora Logo" className="h-12 w-12 shrink-0 object-contain" />
        <div className="min-w-0">
          <div className="text-2xl font-extrabold leading-none tracking-normal">{t('dashboard.sidebar.console_title')}</div>
          <div className="mt-1 text-sm font-semibold text-white/65">{t('dashboard.sidebar.console_subtitle')}</div>
        </div>
      </div>

      {/* Expandable Profile Card */}
      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 shrink-0">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsProfileExpanded(!isProfileExpanded)}>
          <div className="flex items-center gap-3 min-w-0">
            {profile.avatar ? (
              <img src={profile.avatar} alt="" className="h-10 w-10 rounded-full border border-white/10 object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-extrabold">
                {profile.fullName ? profile.fullName.charAt(0) : businessName.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate text-xs font-black text-white/50 uppercase tracking-wider">{businessName}</div>
              <div className="flex items-center gap-1 min-w-0 mt-0.5">
                <div className="truncate text-sm font-bold text-white">{profile.fullName || businessName}</div>
              </div>
              <div className="text-[10px] text-white/40 truncate mt-0.5">{profile.email}</div>
            </div>
          </div>
          <div className="text-white/70 hover:text-white transition ml-2">
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
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className={`h-1.5 w-1.5 rounded-full ${activeMenu === 'settings' && settingsTab === 'profile' ? 'bg-brandCyan shadow-sm' : 'bg-white/30'}`} />
              <span>{t('dashboard.menu.business_setting') || 'Business Setting'}</span>
            </button>
            <button
              onClick={() => {
                setActiveMenu('settings')
                setSettingsTab('kyb')
              }}
              className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-bold transition ${
                activeMenu === 'settings' && settingsTab === 'kyb'
                  ? 'text-brandCyan font-extrabold'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className={`h-1.5 w-1.5 rounded-full ${activeMenu === 'settings' && settingsTab === 'kyb' ? 'bg-brandCyan shadow-sm' : 'bg-white/30'}`} />
              <span>{t('dashboard.menu.kyb') || 'Business Verification'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Card 2: Current Plan & Manage Plan */}
      {userRole !== 'staff' && (
        <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4 shrink-0">
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-white/45">
          {t('dashboard.sidebar.current_plan_header') || 'CURRENT PLAN'}
        </div>
        {hasKyb ? (
          <>
            <div className="mt-1 text-sm font-black text-white">
              {t('dashboard.sidebar.plan_name') || 'Pro Plan'}
            </div>
            <div className="mt-1 text-xs text-white/55">
              {t('dashboard.sidebar.renews_text') || 'Renews on Jun 20, 2024'}
            </div>
          </>
        ) : (
          <div className="mt-1 text-xs font-semibold text-rose-400">
            {t('dashboard.sidebar.no_plan') || 'No current plan'}
          </div>
        )}
        <button
          type="button"
          onClick={() => setActiveMenu('subscriptions')}
          className="mt-3.5 w-full rounded-lg border border-white/15 py-1.5 text-center text-xs font-bold text-luxuryGold hover:bg-white/5 hover:border-white/25 transition-all"
        >
          {t('dashboard.sidebar.manage_plan') || 'Manage Plan'}
        </button>
      </div>
      )}

      {/* Navigation Menu */}
      <nav className="mt-6 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {(() => {
          const menuItemsToDisplay = userRole === 'staff'
            ? [
                { id: 'overview', label: currentLanguage === 'vi' ? 'Hồ sơ của tôi' : 'My Dashboard', icon: visibleMenuItems.find(i => i.id === 'overview')?.icon, image: visibleMenuItems.find(i => i.id === 'overview')?.image },
                { id: 'support', label: t('dashboard.menu.support') || 'Support', icon: visibleMenuItems.find(i => i.id === 'support')?.icon }
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
                    ? 'bg-gradient-to-r from-[#2B59FF] to-[#8E4DF8] text-white shadow-lg shadow-[#2B59FF]/20'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
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
                <div className="ml-9 mt-1 space-y-1 border-l border-white/10 pl-3 animate-fadeIn">
                  {[
                    { id: 'overview', label: t('dashboard.tips.tabs.overview') || 'Overview' },
                    { id: 'savings', label: t('dashboard.tips.tabs.savings') || 'Direct Savings' },
                    { id: 'transactions', label: t('dashboard.tips.tabs.transactions') || 'Tip Transactions' },
                    { id: 'payouts', label: t('dashboard.tips.tabs.payouts') || 'Staff Payouts' }
                  ].map(sub => {
                    const isSubActive = activeMenu === 'tips' && tipsTab === sub.id
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          setActiveMenu('tips')
                          setTipsTab(sub.id)
                        }}
                        className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-bold transition ${
                          isSubActive
                            ? 'text-brandCyan font-extrabold'
                            : 'text-white/60 hover:bg-white/5 hover:text-white'
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
                <div className="ml-9 mt-1 space-y-1 border-l border-white/10 pl-3 animate-fadeIn">
                  {[
                    { id: 'stations', label: t('dashboard.touchpoints.tabs.stations') || 'QR Stations' },
                    { id: 'devices', label: t('dashboard.touchpoints.tabs.devices') || 'Hardware Devices' }
                  ].map(sub => {
                    const isSubActive = activeMenu === 'touchpoints' && touchpointsTab === sub.id
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          setActiveMenu('touchpoints')
                          setTouchpointsTab(sub.id)
                        }}
                        className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-bold transition ${
                          isSubActive
                            ? 'text-brandCyan font-extrabold'
                            : 'text-white/60 hover:bg-white/5 hover:text-white'
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
      <div className="mt-auto pt-4 border-t border-white/10 shrink-0">
        <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-white/65 transition hover:text-white w-full">
          <LogOut className="h-4 w-4" />
          {t('dashboard.sidebar.sign_out')}
        </button>
      </div>
    </aside>
  )
}

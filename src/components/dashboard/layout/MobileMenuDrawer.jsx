import React from 'react'
import { X, ChevronUp, ChevronDown, LogOut } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import IconButton from '../../ui/IconButton'
import MenuIcon from '../../ui/MenuIcon'

export default function MobileMenuDrawer({
  isOpen,
  onClose,
  profile,
  businessName,
  activeMenu,
  setActiveMenu,
  settingsTab,
  setSettingsTab,
  isProfileExpanded,
  setIsProfileExpanded,
  tipsTab,
  setTipsTab,
  touchpointsTab,
  setTouchpointsTab,
  isTipsMobileExpanded,
  setIsTipsMobileExpanded,
  isTouchpointsMobileExpanded,
  setIsTouchpointsMobileExpanded,
  hasKyb,
  userRole,
  onLogout,
  menuItemsToDisplay,
  viewingStaffDetailId,
  setViewingStaffDetailId,
  navigateMenu,
}) {
  const { t } = useTranslation()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-nexoraText/60"
        aria-label="Close navigation menu"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-[min(84vw,320px)] flex-col bg-nexoraSidebar px-5 py-6 text-white shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/assets/nexora-logo.png" alt="Nexora Logo" className="h-10 w-10 object-contain" />
            <div>
              <div className="text-xl font-extrabold leading-none">{t('dashboard.sidebar.console_title')}</div>
              <div className="mt-1 text-xs text-white/60">{t('dashboard.sidebar.console_subtitle')}</div>
            </div>
          </div>
          <IconButton label="Close menu" onClick={onClose} className="text-white hover:bg-white/10">
            <X className="h-5 w-5" />
          </IconButton>
        </div>

        {/* Expandable Profile Card for Mobile */}
        <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-4 shrink-0">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsProfileExpanded(!isProfileExpanded)}>
            <div className="flex items-center gap-3 min-w-0">
              {profile.avatar ? (
                <img src={profile.avatar} alt="" className="h-9 w-9 rounded-full border border-white/10 object-cover" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-extrabold">
                  {profile.fullName ? profile.fullName.charAt(0) : businessName.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <div className="truncate text-xs font-black text-white/50 uppercase tracking-wider">{businessName}</div>
                <div className="flex items-center gap-1 min-w-0 mt-0.5">
                  <div className="truncate text-xs font-bold text-white">{profile.fullName || businessName}</div>
                </div>
                <div className="text-[10px] text-white/40 truncate mt-0.5">{profile.email}</div>
              </div>
            </div>
            <div className="text-white/70 hover:text-white transition ml-2">
              {isProfileExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </div>
          </div>

          {/* Submenu links */}
          {isProfileExpanded && userRole !== 'staff' && (
            <div className="mt-3 pt-2.5 border-t border-white/5 space-y-1 animate-fadeIn">
              <button
                type="button"
                onClick={() => {
                  setActiveMenu('settings')
                  setSettingsTab('profile')
                  onClose()
                }}
                className={`flex h-8 w-full items-center gap-2.5 rounded-lg px-2 text-left text-xs font-bold transition ${
                  activeMenu === 'settings' && settingsTab === 'profile'
                    ? 'text-brandCyan font-extrabold'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className={`h-1.5 w-1.5 rounded-full ${activeMenu === 'settings' && settingsTab === 'profile' ? 'bg-brandCyan shadow-sm' : 'bg-white/30'}`} />
                <span>{t('dashboard.menu.business_setting') || 'Business Setting'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveMenu('settings')
                  setSettingsTab('kyb')
                  onClose()
                }}
                className={`flex h-8 w-full items-center gap-2.5 rounded-lg px-2 text-left text-xs font-bold transition ${
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

        {/* Card 2: Current Plan & Manage Plan (Mobile) */}
        {userRole !== 'staff' && (
          <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3.5 shrink-0">
            <div className="text-[9px] font-extrabold uppercase tracking-wider text-white/45">
              {t('dashboard.sidebar.current_plan_header') || 'CURRENT PLAN'}
            </div>
            {hasKyb ? (
              <>
                <div className="mt-0.5 text-xs font-black text-white">
                  {t('dashboard.sidebar.plan_name') || 'Pro Plan'}
                </div>
                <div className="mt-0.5 text-[10px] text-white/55">
                  {t('dashboard.sidebar.renews_text') || 'Renews on Jun 20, 2024'}
                </div>
              </>
            ) : (
              <div className="mt-0.5 text-[10px] font-semibold text-rose-400">
                {t('dashboard.sidebar.no_plan') || 'No current plan'}
              </div>
            )}
            <button
              type="button"
              onClick={() => navigateMenu('subscriptions')}
              className="mt-2.5 w-full rounded-lg border border-white/15 py-1 text-center text-[10.5px] font-bold text-luxuryGold hover:bg-white/5 hover:border-white/25 transition-all"
            >
              {t('dashboard.sidebar.manage_plan') || 'Manage Plan'}
            </button>
          </div>
        )}

        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          {menuItemsToDisplay.filter((item) => item.id !== 'settings').map((item) => {
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
                  type="button"
                  onClick={() => {
                    setActiveMenu(id)
                    if (id === 'tips') {
                      setIsTipsMobileExpanded(!isTipsMobileExpanded)
                    } else if (id === 'touchpoints') {
                      setIsTouchpointsMobileExpanded(!isTouchpointsMobileExpanded)
                    } else {
                      onClose()
                      setViewingStaffDetailId(null)
                    }
                  }}
                  className={`flex min-h-11 w-full items-center justify-between rounded-lg px-4 text-left text-sm font-bold transition ${
                    isActive
                      ? 'bg-gradient-to-r from-nexoraElectric to-nexoraViolet text-white shadow-lg shadow-nexoraElectric/20'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <MenuIcon item={item} active={isActive} />
                    <span>{localizedLabel}</span>
                  </div>
                  {(id === 'tips' || id === 'touchpoints') && (
                    <div className="text-white/50 shrink-0">
                      {id === 'tips'
                        ? (isTipsMobileExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)
                        : (isTouchpointsMobileExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)
                      }
                    </div>
                  )}
                </button>

                {id === 'tips' && isTipsMobileExpanded && (
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
                            setViewingStaffDetailId(null)
                            onClose()
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

                {id === 'touchpoints' && isTouchpointsMobileExpanded && (
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
                            setViewingStaffDetailId(null)
                            onClose()
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
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-white/10 shrink-0">
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-white/65 transition hover:text-white w-full"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
            <span>{t('dashboard.sidebar.sign_out')}</span>
          </button>
        </div>
      </aside>
    </div>
  )
}

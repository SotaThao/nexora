import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronUp, ChevronDown, ChevronRight, LogOut } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import MenuIcon from '../../ui/MenuIcon'
import { PUBLIC_HOME_MENU_ITEM } from '../constants'
import { getSubscriptionSidebarCopy } from '../../../utils/subscriptionDisplay'

const APP_STORE_URL = 'https://apps.apple.com/us/app/nexora-touch/id6775340468'
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=net.vlinkgroup.nexora'

function AppleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 384 512" fill="currentColor" aria-hidden="true">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
    </svg>
  )
}

function AndroidIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48A5.84 5.84 0 0 0 12 1c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31A5.98 5.98 0 0 0 6 7h12c0-2.12-1.1-3.98-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z"/>
    </svg>
  )
}

export default function MobileMenuDrawer({
  isOpen,
  onClose,
  profile,
  subscription = null,
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
  navigateMenu,
}) {
  const { t, currentLanguage } = useTranslation()
  const navigate = useNavigate()
  const subscriptionCopy = getSubscriptionSidebarCopy(
    subscription ?? profile?.subscription,
    t,
    currentLanguage,
  )

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
        {/* Close handle — small button straddling the drawer's right edge */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="absolute right-0 top-5 z-10 flex h-7 w-7 translate-x-1/2 items-center justify-center rounded-full bg-white text-nexoraText shadow-lg ring-1 ring-black/5 transition hover:bg-nexoraSurfaceMuted"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Expandable Profile Card for Mobile */}
        <div className="mb-4 rounded-xl border border-white/15 bg-white/5 p-4 shrink-0">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsProfileExpanded(!isProfileExpanded)}>
            <div className="flex items-center gap-3 min-w-0">
              {profile.avatar && !profile.avatar.includes('unsplash.com') ? (
                <img src={profile.avatar} alt="" className="h-9 w-9 shrink-0 rounded-full border border-white/15 object-cover" />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-nexoraElectric to-nexoraViolet text-xs font-extrabold uppercase">
                  {(businessName || profile.email || '').slice(0, 2).toUpperCase() || '?'}
                </div>
              )}
              <div className="min-w-0">
                <div className="truncate text-xs font-black text-white/65 uppercase tracking-wider">{businessName}</div>
                <div className="flex items-center gap-1 min-w-0 mt-0.5">
                  <div className="truncate text-xs font-bold text-white">{profile.fullName || businessName || profile.email}</div>
                </div>
                {!businessName && (
                  <div className="text-[10px] text-white/60 truncate mt-0.5">{profile.email}</div>
                )}
              </div>
            </div>
            <div className="text-white/85 hover:text-white transition ml-2">
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
                    : 'text-white/75 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className={`h-1.5 w-1.5 rounded-full ${activeMenu === 'settings' && settingsTab === 'profile' ? 'bg-brandCyan shadow-sm' : 'bg-white/30'}`} />
                <span>{t('dashboard.menu.business_setting')}</span>
              </button>
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="flex h-8 w-full cursor-not-allowed items-center gap-2.5 rounded-lg px-2 text-left text-xs font-bold text-white/40 opacity-60"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
                <span>{t('dashboard.menu.kyb')} ({t('common.coming_soon')})</span>
              </button>
            </div>
          )}
        </div>

        {/* Card 2: Current Plan & Manage Plan (Mobile) */}
        {userRole !== 'staff' && (
          <div className="mb-4 rounded-xl border border-white/15 bg-white/5 p-3.5 shrink-0">
            <div className="text-[9px] font-extrabold uppercase tracking-wider text-white/45">
              {t('dashboard.sidebar.current_plan_header')}
            </div>
            {subscriptionCopy.planLabel ? (
              <>
                <div className="mt-0.5 text-xs font-black text-white">
                  {subscriptionCopy.planLabel}
                </div>
                {subscriptionCopy.detailLabel ? (
                  <div className="mt-0.5 text-[10px] text-white/55">
                    {subscriptionCopy.detailLabel}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="mt-0.5 text-[10px] font-semibold text-rose-400">
                {t('dashboard.sidebar.no_plan')}
              </div>
            )}
            <button
              type="button"
              onClick={() => navigateMenu('subscriptions')}
              className="mt-2.5 w-full rounded-lg border border-white/15 py-1 text-center text-[10.5px] font-bold text-luxuryGold hover:bg-white/5 hover:border-white/25 transition-all"
            >
              {t('dashboard.sidebar.manage_plan')}
            </button>
          </div>
        )}

        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => {
              navigate('/')
              onClose()
            }}
            className="flex min-h-11 w-full items-center gap-3 rounded-lg px-4 text-left text-sm font-bold text-white/85 transition hover:bg-white/5 hover:text-white"
          >
            <MenuIcon item={PUBLIC_HOME_MENU_ITEM} active={false} />
            <span>{t('dashboard.menu.home')}</span>
          </button>

          <div className="my-1 border-t border-white/10" />

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
                    if (id === 'tips') {
                      setIsTipsMobileExpanded(!isTipsMobileExpanded)
                    } else if (id === 'touchpoints') {
                      setIsTouchpointsMobileExpanded(!isTouchpointsMobileExpanded)
                    } else {
                      navigateMenu(id)
                    }
                  }}
                  className={`flex min-h-11 w-full items-center justify-between rounded-lg px-4 text-left text-sm font-bold transition ${
                    isActive
                      ? 'bg-gradient-to-r from-nexoraElectric to-nexoraViolet text-white shadow-lg shadow-nexoraElectric/20'
                      : 'text-white/85 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <MenuIcon item={item} active={isActive} />
                    <span>{localizedLabel}</span>
                  </div>
                  {(id === 'tips' || id === 'touchpoints') && (
                    <div className="text-white/65 shrink-0">
                      {id === 'tips'
                        ? (isTipsMobileExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)
                        : (isTouchpointsMobileExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)
                      }
                    </div>
                  )}
                </button>

                {id === 'tips' && isTipsMobileExpanded && (
                  <div className="ml-9 mt-1 space-y-1 border-l border-white/15 pl-3 animate-fadeIn">
                    {[
                      { id: 'overview', label: t('dashboard.tips.tabs.overview') },
                      { id: 'savings', label: t('dashboard.tips.tabs.savings') },
                      { id: 'payouts', label: t('dashboard.tips.tabs.payouts') }
                    ].map(sub => {
                      const isSubActive = activeMenu === 'tips' && tipsTab === sub.id
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => {
                            setTipsTab(sub.id)
                            navigateMenu('tips')
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

                {id === 'touchpoints' && isTouchpointsMobileExpanded && (
                  <div className="ml-9 mt-1 space-y-1 border-l border-white/15 pl-3 animate-fadeIn">
                    {[
                      { id: 'stations', label: t('dashboard.touchpoints.tabs.stations') },
                      { id: 'devices', label: t('dashboard.touchpoints.tabs.devices') },
                    ].map(sub => {
                      const isSubActive = activeMenu === 'touchpoints' && touchpointsTab === sub.id
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => {
                            setTouchpointsTab(sub.id)
                            navigate(`/dashboard/touchpoints?tab=${sub.id}`)
                            onClose()
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
          })}

          <div className="my-2 border-t border-white/10" />

          <button
            type="button"
            onClick={() => { window.open(APP_STORE_URL, '_blank', 'noopener'); onClose() }}
            className="group flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-white/20 hover:bg-white/[0.06]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-nexoraElectric to-nexoraViolet shadow-lg shadow-nexoraViolet/20">
              <AppleIcon className="h-6 w-6 text-white" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-white">{t('staff_dashboard.nav.download_ios')}</span>
              <span className="mt-0.5 block truncate text-[11px] text-white/55">{t('staff_dashboard.nav.download_ios_sub')}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-white/50" />
          </button>

          <button
            type="button"
            onClick={() => { window.open(GOOGLE_PLAY_URL, '_blank', 'noopener'); onClose() }}
            className="group mt-2 flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-white/20 hover:bg-white/[0.06]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-nexoraViolet shadow-lg shadow-emerald-500/20">
              <AndroidIcon className="h-6 w-6 text-white" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-white">{t('staff_dashboard.nav.download_android')}</span>
              <span className="mt-0.5 block truncate text-[11px] text-white/55">{t('staff_dashboard.nav.download_android_sub')}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-white/50" />
          </button>
        </nav>

        <div className="mt-auto pt-4 border-t border-white/15 shrink-0">
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
